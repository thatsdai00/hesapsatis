import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { serializeDecimals } from "@/lib/decimal-helper";
import { logActivity } from "@/lib/activity-logger";
import { sendOrderConfirmationEmail, sendOrderDeliveredEmail } from "@/lib/email";
import { Prisma } from "@prisma/client";

export const publicRouter = createTRPCRouter({
  // Get active sliders for homepage
  getSliders: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.slider.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  }),

  // Get user balance
  getUserBalance: publicProcedure.query(async ({ ctx }) => {
    // Check if user is authenticated
    if (!ctx.session || !ctx.session.user) {
      return null;
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { balance: true },
    });

    // Convert Decimal to string for client
    return user ? user.balance.toString() : "0";
  }),

  // Get user orders
  getUserOrders: publicProcedure.query(async ({ ctx }) => {
    // Check if user is authenticated
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view your orders",
      });
    }

    // Fetch all orders for the user without any filtering
    const orders = await ctx.prisma.order.findMany({
      where: { 
        userId: ctx.session.user.id,
      },
      orderBy: { createdAt: "desc" },
      // Include basic order information
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deliveryStatus: true,
        // Count related items for debugging
        _count: {
          select: {
            orderItems: true,
            stocks: true,
          }
        }
      }
    });

    // Return the orders
    return orders;
  }),

  // Get order details
  getOrderDetails: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view order details",
        });
      }

      const order = await ctx.prisma.order.findUnique({
        where: { 
          id: input.orderId,
          userId: ctx.session.user.id, // Ensure the order belongs to the current user
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          stocks: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return order;
    }),

  // Checkout with balance
  checkoutWithBalance: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1),
            price: z.number().min(0),
          })
        ),
        totalAmount: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is authenticated
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to checkout with balance",
        });
      }

      const userId = ctx.session.user.id;

      // Check if user has enough balance
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true, name: true, email: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const currentBalance = Number(user.balance);
      if (currentBalance < input.totalAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient balance",
        });
      }

      return ctx.prisma.$transaction(async (tx) => {
        // Check product prices and stock counts
        for (const item of input.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Product with ID ${item.productId} not found`,
            });
          }

          if (product.stockCount < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Not enough stock for product ${product.name}`,
            });
          }

          if (Number(product.price) !== item.price) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Product price mismatch",
            });
          }
        }

        // Create the order
        const order = await tx.order.create({
          data: {
            userId,
            totalAmount: input.totalAmount,
            status: "COMPLETED", // Mark as completed since payment is immediate
            orderItems: {
              create: input.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: {
            orderItems: {
              include: {
                product: true
              }
            }
          }
        });
        
        // Log the activity outside of the transaction
        // We use a Promise that we don't await to avoid blocking the transaction
        logActivity({
          type: 'ORDER_CREATED',
          message: `Order #${order.id} created for ${input.totalAmount} TL`,
          userId,
        }).catch(error => {
          console.error('Failed to log order creation activity:', error);
        });

        // Send order confirmation email
        const orderDetails = order.orderItems.map(item => ({
          productName: item.product.name,
          price: item.price.toString(),
          quantity: item.quantity
        }));
        
        sendOrderConfirmationEmail(
          user.email,
          user.name || 'Değerli Müşterimiz',
          order.id,
          orderDetails
        ).catch(error => {
          console.error('Failed to send order confirmation email:', error);
        });

        // Update product stock counts
        let autoDelivered = false;
        const autoDeliveredStocks = [];
        
        for (const item of input.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockCount: {
                decrement: item.quantity,
              },
            },
          });

          // Assign stock items to the order (for digital products)
          const availableStock = await tx.stock.findMany({
            where: {
              productId: item.productId,
              isDelivered: false,
            },
            take: item.quantity,
          });

          if (availableStock.length > 0) {
            autoDelivered = true;
            autoDeliveredStocks.push(...availableStock);
            
            // Update stock status
            await tx.stock.updateMany({
              where: {
                id: {
                  in: availableStock.map((stock) => stock.id),
                },
              },
              data: {
                orderId: order.id,
                isDelivered: true,
              },
            });
          }
        }
        
        // If stock was automatically assigned, update order status and send delivered email
        if (autoDelivered && autoDeliveredStocks.length > 0) {
          // Update order delivery status
          await tx.order.update({
            where: { id: order.id },
            data: {
              deliveryStatus: 'DELIVERED'
            }
          });
          
          // Create delivery log
          await tx.deliveryLog.create({
            data: {
              orderId: order.id,
              stockId: autoDeliveredStocks[0]?.id || '',
              status: 'SUCCESS',
              message: 'Order automatically delivered'
            }
          });
          
          // Prepare data for email
          const products = order.orderItems.map(item => ({
            productName: item.product.name,
            price: item.price.toString()
          }));
          
          const stockItems = autoDeliveredStocks.map(stock => {
            const orderItem = order.orderItems.find(item => item.productId === stock.productId);
            return {
              productName: orderItem?.product.name || 'Product',
              content: stock.content
            };
          });
          
          // Send email notification for auto-delivery
          // We don't await this to avoid transaction timeouts
          sendOrderDeliveredEmail(
            user.email,
            user.name || 'Değerli Müşterimiz',
            order.id,
            products,
            stockItems
          ).catch(error => {
            console.error('Failed to send auto-delivery email:', error);
          });
        }

        // Deduct the amount from user's balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: input.totalAmount,
            },
          },
        });

        return {
          success: true,
          orderId: order.id,
        };
      });
    }),

  // Get all products with pagination and filtering
  getProducts: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, categoryId, search, minPrice, maxPrice, sortBy } = input;

      // Build the where clause
      const where: Prisma.ProductWhereInput = {
        published: true,
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (minPrice !== undefined) {
        where.price = {
          ...(where.price as object || {}),
          gte: minPrice,
        };
      }

      if (maxPrice !== undefined) {
        where.price = {
          ...(where.price as object || {}),
          lte: maxPrice,
        };
      }

      // Build the orderBy clause
      let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
      if (sortBy) {
        switch (sortBy) {
          case 'price_asc':
            orderBy = { price: 'asc' };
            break;
          case 'price_desc':
            orderBy = { price: 'desc' };
            break;
          case 'newest':
            orderBy = { createdAt: 'desc' };
            break;
          case 'popular':
            orderBy = { orderItems: { _count: 'desc' } };
            break;
        }
      }

      // Execute the query
      const products = await ctx.prisma.product.findMany({
        take: limit + 1, // Take one extra to determine if there's a next page
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Check if there's a next page
      let nextCursor: typeof cursor | undefined = undefined;
      if (products.length > limit) {
        const nextItem = products.pop();
        nextCursor = nextItem?.id;
      }

      // Serialize Decimal values
      const serializedProducts = products.map(product => serializeDecimals(product));

      return {
        products: serializedProducts,
        nextCursor,
      };
    }),

  // Get featured products
  getFeaturedProducts: publicProcedure
    .input(z.object({ limit: z.number().default(8) }))
    .query(async ({ ctx, input }) => {
      const featuredProducts = await ctx.prisma.product.findMany({
        where: {
          published: true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
      });

      // Serialize Decimal values
      return featuredProducts.map(product => serializeDecimals(product));
    }),

  // Get product by slug
  getProductBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: { slug: input.slug },
        include: {
          category: true,
        },
      });

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      // Serialize Decimal values
      return serializeDecimals(product);
    }),

  // Get categories for homepage
  getHomeCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.category.findMany({
      where: {
        isActive: true,
        showOnHomepage: true,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return categories;
  }),

  // Get homepage categories with products
  getHomepageCategories: publicProcedure
    .input(z.object({ productLimit: z.number().default(8) }))
    .query(async ({ ctx, input }) => {
      const { productLimit } = input;
      
      const categories = await ctx.prisma.category.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          products: {
            where: {
              published: true,
            },
            take: productLimit,
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      // Serialize Decimal values for product prices
      return categories.map(category => ({
        ...category,
        products: category.products.map((product) => serializeDecimals(product)),
      }));
    }),

  // Get all active categories
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.category.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return categories;
  }),

  // Get products by category slug
  getProductsByCategory: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { slug, limit, cursor } = input;

      // First, find the category by slug
      const category = await ctx.prisma.category.findUnique({
        where: { slug },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      // Then, get products in that category
      const products = await ctx.prisma.product.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          categoryId: category.id,
          published: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Check if there's a next page
      let nextCursor: typeof cursor | undefined = undefined;
      if (products.length > limit) {
        const nextItem = products.pop();
        nextCursor = nextItem?.id;
      }

      // Serialize Decimal values
      const serializedProducts = products.map(product => serializeDecimals(product));

      return {
        category,
        products: serializedProducts,
        nextCursor,
      };
    }),

  // Search for products and categories
  searchAll: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query } = input;

      // Search for products
      const products = await ctx.prisma.product.findMany({
        where: {
          published: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
        take: 8,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Search for categories
      const categories = await ctx.prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
        take: 5,
      });

      return {
        products: products.map(product => serializeDecimals(product)),
        categories,
      };
    }),

  // Get custom page by slug
  getCustomPageBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const customPage = await ctx.prisma.customPage.findUnique({
        where: {
          slug: input.slug,
          published: true,
        },
      });

      if (!customPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Custom page not found",
        });
      }

      return customPage;
    }),

  // Get header links
  getHeaderLinks: publicProcedure.query(async ({ ctx }) => {
    const links = await ctx.prisma.headerLink.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    
    return links;
  }),

  // Get footer links
  getFooterLinks: publicProcedure.query(async ({ ctx }) => {
    const links = await ctx.prisma.footerLink.findMany({
      where: { 
        isActive: true,
        section: 'institutional'
      },
      orderBy: { order: 'asc' },
    });
    
    return links;
  }),

  // Get site settings
  getSiteSettings: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.siteSettings.findUnique({
      where: { id: 1 },
    });
    
    if (!settings) {
      return {
        logoWhiteText: 'thats',
        logoAccentText: 'dai',
        logoWhiteColor: '#FFFFFF',
        logoAccentColor: '#7e22ce',
        siteName: 'thatsdai',
        footerDescription: 'Güvenli, hızlı ve uygun fiyatlı oyun hesapları ve içerik satışı.',
        footerBottomText: '© 2025 thatsdai.com. Tüm hakları saklıdır.',
        footerInstitutionalTitle: 'Kurumsal',
        
        // Social media fields
        socialFacebook: null,
        socialTwitter: null,
        socialInstagram: null,
        socialDiscord: null,
        socialYoutube: null,
        socialFacebookVisible: false,
        socialTwitterVisible: false,
        socialInstagramVisible: false,
        socialDiscordVisible: false,
        socialYoutubeVisible: false,
        
        // Contact information fields
        contactEmail: null,
        contactPhone: null,
        contactWhatsapp: null,
        contactAddress: null,
      };
    }
    
    return settings;
  }),
}); 