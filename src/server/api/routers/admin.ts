import { z } from "zod";
import { adminProcedure, createTRPCRouter, supporterProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { OrderStatus, Prisma } from "@prisma/client";
import { serializeDecimals } from "@/lib/decimal-helper";
import { Decimal } from "@prisma/client/runtime/library";
import { getServerSiteSettings } from "@/lib/server-utils";
import { logActivity } from "@/lib/activity-logger";

// Helper function to fill in missing dates in the sales data
function fillMissingDates(
  dateMap: Map<string, any>,
  startDate: Date,
  endDate: Date,
  timeRange: 'today' | 'week' | 'month' | 'year' | 'all'
): Map<string, any> {
  const filledMap = new Map(dateMap);
  const currentDate = new Date(startDate);
  
  // Loop through each date in the range and ensure it exists in the map
  while (currentDate <= endDate) {
    let dateKey: string;
    
    switch (timeRange) {
      case 'today':
        // For today, create an entry for each hour
        for (let hour = 0; hour < 24; hour++) {
          const hourDate = new Date(currentDate);
          hourDate.setHours(hour, 0, 0, 0);
          
          // Skip future hours
          if (hourDate > endDate) continue;
          
          dateKey = `${hourDate.getFullYear()}-${String(hourDate.getMonth() + 1).padStart(2, '0')}-${String(hourDate.getDate()).padStart(2, '0')} ${String(hour).padStart(2, '0')}:00:00`;
          
          if (!filledMap.has(dateKey)) {
            filledMap.set(dateKey, {
              date: dateKey,
              totalAmount: 0,
              orderCount: 0,
            });
          }
        }
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        break;
        
      case 'week':
      case 'month':
        // For week/month, create an entry for each day
        dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        
        if (!filledMap.has(dateKey)) {
          filledMap.set(dateKey, {
            date: dateKey,
            totalAmount: 0,
            orderCount: 0,
          });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        break;
        
      case 'year':
      case 'all':
        // For year/all, create an entry for each month
        dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!filledMap.has(dateKey)) {
          filledMap.set(dateKey, {
            date: dateKey,
            totalAmount: 0,
            orderCount: 0,
          });
        }
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }
  
  // Sort the map by date
  return new Map([...filledMap.entries()].sort());
}

// Utility function to generate SEO titles
async function generateSeoTitle(name: string): Promise<string> {
  const settings = await getServerSiteSettings();
  return `${name} | ${settings.siteName}`;
}

export const adminRouter = createTRPCRouter({
  // Sales Overview data for admin dashboard
  getSalesOverview: adminProcedure.query(async ({ ctx }) => {
    // Get current date values for filtering
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Query for completed orders only
    const completedOrdersWhere = { 
      status: OrderStatus.COMPLETED 
    };
    
    // Get today's sales
    const todaySales = await ctx.prisma.order.aggregate({
      where: {
        ...completedOrdersWhere,
        createdAt: { gte: today }
      },
      _sum: { totalAmount: true },
    });
    
    // Get this week's sales
    const thisWeekSales = await ctx.prisma.order.aggregate({
      where: {
        ...completedOrdersWhere,
        createdAt: { gte: startOfWeek }
      },
      _sum: { totalAmount: true },
    });
    
    // Get this month's sales
    const thisMonthSales = await ctx.prisma.order.aggregate({
      where: {
        ...completedOrdersWhere,
        createdAt: { gte: startOfMonth }
      },
      _sum: { totalAmount: true },
    });
    
    // Get total sales (all time)
    const totalSales = await ctx.prisma.order.aggregate({
      where: completedOrdersWhere,
      _sum: { totalAmount: true },
    });
    
    // Handle null values (when no orders exist)
    const todaySalesAmount = todaySales._sum.totalAmount?.toNumber() || 0;
    const thisWeekSalesAmount = thisWeekSales._sum.totalAmount?.toNumber() || 0;
    const thisMonthSalesAmount = thisMonthSales._sum.totalAmount?.toNumber() || 0;
    const totalSalesAmount = totalSales._sum.totalAmount?.toNumber() || 0;
    
    return {
      todaySales: todaySalesAmount,
      thisWeekSales: thisWeekSalesAmount,
      thisMonthSales: thisMonthSalesAmount,
      totalSales: totalSalesAmount,
    };
  }),
  
  // Get detailed sales data for charting
  getSalesData: adminProcedure
    .input(
      z.object({
        timeRange: z.enum(['today', 'week', 'month', 'year', 'all']).default('week'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { timeRange } = input;
      const now = new Date();
      let startDate: Date;
      let groupByFormat: string;
      let ordersByDate: any[] = [];
      
      // Set the start date and grouping format based on the time range
      switch (timeRange) {
        case 'today':
          // For today, get hourly data
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          groupByFormat = '%Y-%m-%d %H:00:00';
          break;
        
        case 'week':
          // For last 7 days, get daily data
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
          startDate.setHours(0, 0, 0, 0);
          groupByFormat = '%Y-%m-%d';
          break;
        
        case 'month':
          // For last 30 days, get daily data
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 29); // Last 30 days including today
          startDate.setHours(0, 0, 0, 0);
          groupByFormat = '%Y-%m-%d';
          break;
        
        case 'year':
          // For last year, get monthly data
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          groupByFormat = '%Y-%m';
          break;
        
        case 'all':
          // For all time, get monthly data
          // Get the date of the first order or default to 1 year ago
          const firstOrder = await ctx.prisma.order.findFirst({
            where: { status: OrderStatus.COMPLETED },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
          });
          
          if (firstOrder) {
            startDate = new Date(firstOrder.createdAt);
            startDate.setDate(1); // First day of the month
            startDate.setHours(0, 0, 0, 0);
          } else {
            startDate = new Date(now);
            startDate.setFullYear(startDate.getFullYear() - 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
          }
          
          groupByFormat = '%Y-%m';
          break;
      }
      
      // Get completed orders in the date range
      const orders = await ctx.prisma.order.findMany({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
      
      // Group orders by date based on the format
      if (orders.length > 0) {
        // Process the orders to group by date
        const dateMap = new Map();
        
        orders.forEach(order => {
          let dateKey: string;
          const orderDate = new Date(order.createdAt);
          
          switch (timeRange) {
            case 'today':
              dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')} ${String(orderDate.getHours()).padStart(2, '0')}:00:00`;
              break;
            case 'week':
            case 'month':
              dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
              break;
            case 'year':
            case 'all':
              dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
              break;
          }
          
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, {
              date: dateKey,
              totalAmount: 0,
              orderCount: 0,
            });
          }
          
          const entry = dateMap.get(dateKey);
          entry.totalAmount += Number(order.totalAmount);
          entry.orderCount += 1;
        });
        
        // Fill in missing dates with zero values
        const filledData = fillMissingDates(dateMap, startDate, now, timeRange);
        ordersByDate = Array.from(filledData.values());
      }
      
      // Calculate totals
      const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const totalOrders = orders.length;
      
      return {
        data: ordersByDate,
        totalAmount,
        totalOrders,
        timeRange,
      };
    }),
  
  // Dashboard stats for admins and managers
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalOrders,
      totalDelivered,
      totalProducts,
      totalCategories,
      lowStockProducts,
      totalUsers,
    ] = await Promise.all([
      ctx.prisma.order.count(),
      ctx.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      ctx.prisma.product.count(),
      ctx.prisma.category.count(),
      ctx.prisma.product.findMany({
        where: { stockCount: { lte: 10 } },
        select: { id: true, name: true, stockCount: true },
        take: 5,
      }),
      ctx.prisma.user.count(),
    ]);

    return {
      totalOrders,
      totalDelivered,
      totalProducts,
      totalCategories,
      lowStockProducts,
      totalUsers,
    };
  }),
  
  // Dashboard stats for supporters (limited data)
  getSupporterDashboardStats: supporterProcedure.query(async ({ ctx }) => {
    // Only get stats that supporters need to see
    const [
      totalOrders,
      totalDelivered,
      totalTickets,
      openTickets,
    ] = await Promise.all([
      ctx.prisma.order.count(),
      ctx.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      ctx.prisma.ticket.count(),
      ctx.prisma.ticket.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      totalOrders,
      totalDelivered,
      totalTickets,
      openTickets,
      // Return empty data for fields that supporters shouldn't access
      totalProducts: 0,
      totalCategories: 0,
      lowStockProducts: [],
      totalUsers: 0,
    };
  }),

  // Get recent tickets for supporters
  getRecentTickets: supporterProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const tickets = await ctx.prisma.ticket.findMany({
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return tickets;
    }),

  // User balance management
  getUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search } = input;

      const users = await ctx.prisma.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: search
          ? {
              OR: [
                { email: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
        select: {
          id: true,
          name: true,
          email: true,
          balance: true,
          role: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      return {
        users: users.map(user => ({
          ...user,
          balance: user.balance.toString(),
        })),
        nextCursor,
      };
    }),

  getUserById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          balance: true,
          role: true,
          createdAt: true,
          orders: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        ...user,
        balance: user.balance.toString(),
        orders: user.orders.map(order => ({
          ...order,
          totalAmount: order.totalAmount.toString(),
        })),
      };
    }),

  updateUserBalance: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        amount: z.number().refine((val) => val !== 0, {
          message: "Amount must not be zero",
        }),
        operation: z.enum(["ADD", "SUBTRACT", "SET"]),
        reason: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, amount, operation } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      let newBalance;
      const currentBalance = user.balance.toNumber();

      switch (operation) {
        case "ADD":
          newBalance = currentBalance + amount;
          break;
        case "SUBTRACT":
          newBalance = currentBalance - amount;
          if (newBalance < 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot reduce balance below zero",
            });
          }
          break;
        case "SET":
          if (amount < 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot set negative balance",
            });
          }
          newBalance = amount;
          break;
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });
      
      // Log the activity
      logActivity({
        type: 'BALANCE_REFUND',
        message: `User balance ${operation.toLowerCase()}ed by ${amount}. Reason: ${input.reason}`,
        userId: ctx.session.user.id,
      }).catch(error => {
        console.error('Failed to log balance update activity:', error);
      });

      return {
        success: true,
        newBalance: updatedUser.balance.toString(),
      };
    }),

  // Update user role
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["MANAGER", "SUPPORTER", "USER", "BANNED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;
      
      // Check if the target user is an ADMIN (cannot be changed)
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true },
      });
      
      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      
      // Prevent changing ADMIN users
      if (targetUser.role === "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change role of an admin user",
        });
      }
      
      // Prevent MANAGER users from modifying other MANAGER accounts
      if (
        ctx.session.user.role === "MANAGER" && 
        (targetUser.role === "MANAGER" || role === "MANAGER")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Manager users cannot modify other manager accounts",
        });
      }
      
      // Update the user role
      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: { role },
      });
      
      // Log the activity
      logActivity({
        type: 'USER_ROLE_UPDATED',
        message: `User role updated from ${targetUser.role} to ${role} for user ${targetUser.email}`,
        userId: ctx.session.user.id,
      }).catch(error => {
        console.error('Failed to log role update activity:', error);
      });
      
      return {
        success: true,
        newRole: updatedUser.role,
      };
    }),

  // Get recent orders for dashboard
  getRecentOrders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const orders = await ctx.prisma.order.findMany({
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return orders.map(order => serializeDecimals(order));
    }),

  // Site Settings
  getSiteSettings: adminProcedure.query(async () => {
    return await getServerSiteSettings();
  }),

  updateSiteSettings: adminProcedure
    .input(
      z.object({
        logoWhiteText: z.string().optional(),
        logoAccentText: z.string().optional(),
        logoWhiteColor: z.string().optional(),
        logoAccentColor: z.string().optional(),
        siteName: z.string().optional(),
        siteTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
        ogImage: z.string().optional(),
        footerDescription: z.string().optional(),
        footerBottomText: z.string().optional(),
        footerInstitutionalTitle: z.string().optional(),
        
        // Social media fields
        socialFacebook: z.string().optional(),
        socialTwitter: z.string().optional(),
        socialInstagram: z.string().optional(),
        socialDiscord: z.string().optional(),
        socialYoutube: z.string().optional(),
        socialFacebookVisible: z.boolean().optional(),
        socialTwitterVisible: z.boolean().optional(),
        socialInstagramVisible: z.boolean().optional(),
        socialDiscordVisible: z.boolean().optional(),
        socialYoutubeVisible: z.boolean().optional(),
        
        // Contact information fields
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        contactWhatsapp: z.string().optional(),
        contactAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.prisma.siteSettings.update({
        where: { id: 1 },
        data: input,
      });

      // Log the activity
      logActivity({
        type: 'SETTINGS_UPDATED',
        message: 'Site settings were updated',
        userId: ctx.session.user.id,
      }).catch(error => {
        console.error('Failed to log settings update activity:', error);
      });

      return settings;
    }),

  // Get all orders with pagination and filtering
  getOrders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        status: z.nativeEnum(OrderStatus).optional(),
        userId: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["newest", "oldest", "amount_high", "amount_low"]).default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, userId, search, sortBy } = input;

      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (userId) {
        where.userId = userId;
      }
      
      if (search) {
        where.OR = [
          { id: { contains: search } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      let orderBy: any = { createdAt: "desc" };
      
      switch (sortBy) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "amount_high":
          orderBy = { totalAmount: "desc" };
          break;
        case "amount_low":
          orderBy = { totalAmount: "asc" };
          break;
      }

      const orders = await ctx.prisma.order.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem?.id;
      }

      return {
        orders: orders.map(order => serializeDecimals(order)),
        nextCursor,
      };
    }),

  // Get order details
  getOrderDetails: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          user: true,
          orderItems: {
            include: {
              product: true,
            },
          },
          stocks: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return serializeDecimals(order);
    }),

  // Update order status
  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.nativeEnum(OrderStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orderId, status } = input;

      const order = await ctx.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, totalAmount: true, userId: true },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      await ctx.prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

      return { success: true };
    }),

  // Product management
  getProducts: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["newest", "oldest", "price_high", "price_low", "name_asc", "name_desc"]).default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, categoryId, search, sortBy } = input;

      const where: any = {};
      
      if (categoryId) {
        where.categoryId = categoryId;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      let orderBy: any = { createdAt: "desc" };
      
      switch (sortBy) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "price_high":
          orderBy = { price: "desc" };
          break;
        case "price_low":
          orderBy = { price: "asc" };
          break;
        case "name_asc":
          orderBy = { name: "asc" };
          break;
        case "name_desc":
          orderBy = { name: "desc" };
          break;
      }

      const products = await ctx.prisma.product.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy,
        include: {
          category: true,
          _count: {
            select: {
              orderItems: true,
              stocks: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (products.length > limit) {
        const nextItem = products.pop();
        nextCursor = nextItem?.id;
      }

      return {
        products: products.map(product => serializeDecimals(product)),
        nextCursor,
      };
    }),

  // Get product details
  getProductDetails: adminProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        include: {
          category: true,
          stocks: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return serializeDecimals(product);
    }),

  // Create product
  createProduct: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        price: z.number().min(0),
        categoryId: z.string(),
        stockCount: z.number().min(0).default(0),
        published: z.boolean().default(false),
        isFeatured: z.boolean().default(false),
        slug: z.string().min(1).max(255),
        image: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug } = input;

      const existingProduct = await ctx.prisma.product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A product with this slug already exists",
        });
      }

      // Generate SEO title
      const seoTitle = await generateSeoTitle(input.name);

      const product = await ctx.prisma.product.create({
        data: {
          ...input,
          seoTitle,
        },
      });
      
      // Log the activity
      logActivity({
        type: 'PRODUCT_ADDED',
        message: `New product added: ${input.name}`,
        userId: ctx.session.user.id,
      }).catch(error => {
        console.error('Failed to log product creation activity:', error);
      });

      return serializeDecimals(product);
    }),

  // Update product
  updateProduct: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        categoryId: z.string().optional(),
        stockCount: z.number().min(0).optional(),
        published: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        slug: z.string().min(1).max(255).optional(),
        image: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const product = await ctx.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (data.slug && data.slug !== product.slug) {
        const existingProduct = await ctx.prisma.product.findUnique({
          where: { slug: data.slug },
        });

        if (existingProduct) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A product with this slug already exists",
          });
        }
      }

      // Generate SEO title if name is being updated
      let seoTitle = product.seoTitle;
      if (data.name) {
        seoTitle = await generateSeoTitle(data.name);
      }

      const updatedProduct = await ctx.prisma.product.update({
        where: { id },
        data: {
          ...data,
          seoTitle,
        },
      });

      return serializeDecimals(updatedProduct);
    }),

  // Delete product
  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: {
          orderItems: {
            take: 1,
          },
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (product.orderItems.length > 0) {
        await ctx.prisma.product.update({
          where: { id: input.id },
          data: { published: false },
        });

        return { success: true, message: "Product has been unpublished because it has associated orders" };
      }

      await ctx.prisma.product.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Category management
  getCategories: adminProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const categories = await ctx.prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      return categories;
    }),

  // Create category
  createCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        slug: z.string().min(1).max(255),
        isActive: z.boolean().default(true),
        showOnHomepage: z.boolean().default(false),
        order: z.number().default(0),
        image: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug } = input;

      const existingCategory = await ctx.prisma.category.findUnique({
        where: { slug },
      });

      if (existingCategory) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A category with this slug already exists",
        });
      }

      // Generate SEO title
      const seoTitle = await generateSeoTitle(input.name);

      const category = await ctx.prisma.category.create({
        data: {
          ...input,
          seoTitle,
        },
      });

      // Log the activity
      logActivity({
        type: 'CATEGORY_CREATED',
        message: `New category created: ${input.name}`,
        userId: ctx.session.user.id,
      }).catch(error => {
        console.error('Failed to log category creation activity:', error);
      });

      return category;
    }),

  // Update category
  updateCategory: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        slug: z.string().min(1).max(255).optional(),
        isActive: z.boolean().optional(),
        showOnHomepage: z.boolean().optional(),
        order: z.number().optional(),
        image: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const category = await ctx.prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      if (data.slug && data.slug !== category.slug) {
        const existingCategory = await ctx.prisma.category.findUnique({
          where: { slug: data.slug },
        });

        if (existingCategory) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A category with this slug already exists",
          });
        }
      }

      // Generate SEO title if name is being updated
      let seoTitle = category.seoTitle;
      if (data.name) {
        seoTitle = await generateSeoTitle(data.name);
      }

      const updatedCategory = await ctx.prisma.category.update({
        where: { id },
        data: {
          ...data,
          seoTitle,
        },
      });

      return updatedCategory;
    }),

  // Delete category
  deleteCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if category exists
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.id },
        include: {
          products: {
            take: 1,
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // If category has products, don't delete it
      if (category.products.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete category with associated products",
        });
      }

      // Delete the category
      await ctx.prisma.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Slider management
  getSliders: adminProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const sliders = await ctx.prisma.slider.findMany({
        orderBy: { order: "asc" },
      });

      return sliders;
    }),

  // Create slider
  createSlider: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        subtitle: z.string().optional(),
        image: z.string().min(1),
        link: z.string().optional(),
        active: z.boolean().default(true),
        order: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slider = await ctx.prisma.slider.create({
        data: input,
      });

      return slider;
    }),

  // Update slider
  updateSlider: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        subtitle: z.string().optional(),
        image: z.string().min(1).optional(),
        link: z.string().optional(),
        active: z.boolean().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const slider = await ctx.prisma.slider.findUnique({
        where: { id },
      });

      if (!slider) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Slider not found",
        });
      }

      const updatedSlider = await ctx.prisma.slider.update({
        where: { id },
        data,
      });

      return updatedSlider;
    }),

  // Delete slider
  deleteSlider: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const slider = await ctx.prisma.slider.findUnique({
        where: { id: input.id },
      });

      if (!slider) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Slider not found",
        });
      }

      await ctx.prisma.slider.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Custom Pages Management
  getCustomPages: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        search: z.string().optional(),
        sortBy: z.enum(["newest", "oldest", "title_asc", "title_desc"]).default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, sortBy } = input;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ];
      }

      let orderBy: any = { createdAt: "desc" };
      
      switch (sortBy) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "title_asc":
          orderBy = { title: "asc" };
          break;
        case "title_desc":
          orderBy = { title: "desc" };
          break;
      }

      const customPages = await ctx.prisma.customPage.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (customPages.length > limit) {
        const nextItem = customPages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        customPages,
        nextCursor,
      };
    }),

  // Get custom page details
  getCustomPageDetails: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const customPage = await ctx.prisma.customPage.findUnique({
        where: { id: input.id },
      });

      if (!customPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Custom page not found",
        });
      }

      return customPage;
    }),

  // Create custom page
  createCustomPage: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        content: z.string(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
        published: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug } = input;

      const existingPage = await ctx.prisma.customPage.findUnique({
        where: { slug },
      });

      if (existingPage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A page with this slug already exists",
        });
      }

      const customPage = await ctx.prisma.customPage.create({
        data: input,
      });

      return customPage;
    }),

  // Update custom page
  updateCustomPage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        seoKeywords: z.string().optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const customPage = await ctx.prisma.customPage.findUnique({
        where: { id },
      });

      if (!customPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Custom page not found",
        });
      }

      if (data.slug && data.slug !== customPage.slug) {
        const existingPage = await ctx.prisma.customPage.findUnique({
          where: { slug: data.slug },
        });

        if (existingPage) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A page with this slug already exists",
          });
        }
      }

      const updatedCustomPage = await ctx.prisma.customPage.update({
        where: { id },
        data,
      });

      return updatedCustomPage;
    }),

  // Delete custom page
  deleteCustomPage: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const customPage = await ctx.prisma.customPage.findUnique({
        where: { id: input.id },
      });

      if (!customPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Custom page not found",
        });
      }

      await ctx.prisma.customPage.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Header Links
  getHeaderLinks: adminProcedure.query(async ({ ctx }) => {
    const links = await ctx.prisma.headerLink.findMany({
      orderBy: { order: 'asc' },
    });
    
    return links;
  }),
  
  updateHeaderLinks: adminProcedure
    .input(
      z.object({
        links: z.array(
          z.object({
            id: z.string().optional(),
            text: z.string().min(1, "Link text is required"),
            url: z.string().min(1, "URL is required"),
            order: z.number(),
            isNew: z.boolean().optional(),
          })
        ),
        deletedIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { links, deletedIds } = input;
      
      // Process deletions first
      if (deletedIds && deletedIds.length > 0) {
        await ctx.prisma.headerLink.deleteMany({
          where: { id: { in: deletedIds } },
        });
      }
      
      // Process updates and additions
      for (const link of links) {
        if (link.isNew || !link.id) {
          // Create new link
          await ctx.prisma.headerLink.create({
            data: {
              text: link.text,
              url: link.url,
              order: link.order,
            },
          });
        } else {
          // Update existing link
          await ctx.prisma.headerLink.update({
            where: { id: link.id },
            data: {
              text: link.text,
              url: link.url,
              order: link.order,
            },
          });
        }
      }
      
      return { success: true };
    }),
  
  // Footer Links
  getFooterLinks: adminProcedure.query(async ({ ctx }) => {
    const links = await ctx.prisma.footerLink.findMany({
      where: { section: 'institutional' },
      orderBy: { order: 'asc' },
    });
    
    return links;
  }),
  
  updateFooterLinks: adminProcedure
    .input(
      z.object({
        links: z.array(
          z.object({
            id: z.string().optional(),
            text: z.string().min(1, "Link text is required"),
            url: z.string().min(1, "URL is required"),
            order: z.number(),
            isNew: z.boolean().optional(),
          })
        ),
        deletedIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { links, deletedIds } = input;
      
      // Process deletions first
      if (deletedIds && deletedIds.length > 0) {
        await ctx.prisma.footerLink.deleteMany({
          where: { id: { in: deletedIds } },
        });
      }
      
      // Process updates and additions
      for (const link of links) {
        if (link.isNew || !link.id) {
          // Create new link
          await ctx.prisma.footerLink.create({
            data: {
              text: link.text,
              url: link.url,
              order: link.order,
              section: 'institutional',
            },
          });
        } else {
          // Update existing link
          await ctx.prisma.footerLink.update({
            where: { id: link.id },
            data: {
              text: link.text,
              url: link.url,
              order: link.order,
            },
          });
        }
      }
      
      return { success: true };
    }),

  // Activity Logs
  getActivityLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, dateFrom, dateTo } = input;

      // Build where clause for date filtering
      const where: any = {};
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      const logs = await ctx.prisma.activityLog.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (logs.length > limit) {
        const nextItem = logs.pop();
        nextCursor = nextItem?.id;
      }

      return {
        logs,
        nextCursor,
      };
    }),

  // Get detailed user information including orders and activity logs
  getUserDetails: supporterProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          balance: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              totalAmount: true,
              status: true,
              deliveryStatus: true,
              createdAt: true,
              _count: {
                select: {
                  orderItems: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Get activity logs for this user
      const activityLogs = await ctx.prisma.activityLog.findMany({
        where: { userId: input.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return {
        ...user,
        balance: user.balance.toString(),
        orders: user.orders.map(order => ({
          ...order,
          totalAmount: order.totalAmount.toString(),
        })),
        activityLogs,
      };
    }),

  // Get detailed user information for supporters (more limited version)
  getSupporterUserDetails: supporterProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          balance: true,
          role: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              totalAmount: true,
              status: true,
              deliveryStatus: true,
              createdAt: true,
              _count: {
                select: {
                  orderItems: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Get activity logs for this user
      const activityLogs = await ctx.prisma.activityLog.findMany({
        where: { userId: input.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return {
        ...user,
        balance: user.balance.toString(),
        orders: user.orders.map(order => ({
          ...order,
          totalAmount: order.totalAmount.toString(),
        })),
        activityLogs,
      };
    }),

  // Get user by email for supporters
  getUserByEmail: supporterProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),
}); 