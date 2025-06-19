'use client';

import * as React from 'react';

import { trpc } from '@/lib/trpc-client';
import Link from 'next/link';
import { 
  FaShoppingBag, 
  FaBoxOpen, 
  FaUsers, 
  FaTicketAlt, 
  FaLayerGroup,
  FaList,
  FaImages,
  FaServer,
  FaArrowRight
} from 'react-icons/fa';
import ActivityLogList from '@/components/admin/ActivityLogList';
import SalesOverviewPanel from '@/components/admin/SalesOverviewPanel';

import { useSession } from 'next-auth/react';

// Define types for the data
type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

interface Order {
  id: string;
  userId: string;
  totalAmount: number | string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
  } | null;
  orderItems: Array<{
    id: string;
    product: {
      id: string;
      name: string;
    };
  }>;
}

interface LowStockProduct {
  id: string;
  name: string;
  stockCount: number;
}

// Stats interface is now merged with SupporterDashboardStats

interface SupporterDashboardStats {
  totalOrders: number;
  totalDelivered: number;
  totalTickets: number;
  openTickets: number;
  totalProducts: number;
  totalCategories: number;
  lowStockProducts: LowStockProduct[];
  totalUsers: number;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  messages: Array<{
    id: string;
    content: string;
    createdAt: Date;
  }>;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const isSupporter = session?.user?.role === 'SUPPORTER';
  
  // Use the appropriate query based on user role
  const { data: adminStats, isLoading: adminStatsLoading } = trpc.admin.getDashboardStats.useQuery(
    undefined,
    { enabled: !isSupporter }
  );
  
  const { data: supporterStats, isLoading: supporterStatsLoading } = trpc.admin.getSupporterDashboardStats.useQuery(
    undefined,
    { enabled: isSupporter }
  );
  
  // Get TRPC utils for invalidation
  
  
  // Get the appropriate stats based on user role
  const stats = isSupporter ? supporterStats : adminStats;
  const statsLoading = isSupporter ? supporterStatsLoading : adminStatsLoading;
    
  // Only fetch recent orders if not a supporter
  const { data: recentOrdersData, isLoading: ordersLoading } = trpc.admin.getRecentOrders.useQuery(
    { limit: 5 },
    { enabled: !isSupporter }
  );
  
  // Fetch recent tickets if supporter
  const { data: recentTicketsData, isLoading: ticketsLoading } = trpc.admin.getRecentTickets.useQuery(
    { limit: 5 },
    { enabled: isSupporter }
  );
  
  const isLoading = statsLoading || 
                   (!isSupporter && ordersLoading) ||
                   (isSupporter && ticketsLoading);
  
  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  return (
    <div>
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your store and monitor performance</p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="admin-stats-card">
          <div className="flex items-center">
            <div className="admin-icon admin-icon-green">
              <FaShoppingBag />
            </div>
            <div>
              <p className="admin-subtitle">Total Orders</p>
              <h3 className="admin-value">{stats?.totalOrders || 0}</h3>
            </div>
          </div>
        </div>
        
        {isSupporter ? (
          // Show ticket stats for supporters
          <>
            <div className="admin-stats-card">
              <div className="flex items-center">
                <div className="admin-icon admin-icon-blue">
                  <FaTicketAlt />
                </div>
                <div>
                  <p className="admin-subtitle">Total Tickets</p>
                  <h3 className="admin-value">{(stats as SupporterDashboardStats)?.totalTickets || 0}</h3>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-card">
              <div className="flex items-center">
                <div className="admin-icon admin-icon-yellow">
                  <FaTicketAlt />
                </div>
                <div>
                  <p className="admin-subtitle">Open Tickets</p>
                  <h3 className="admin-value">{(stats as SupporterDashboardStats)?.openTickets || 0}</h3>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-card">
              <div className="flex items-center">
                <div className="admin-icon admin-icon-primary">
                  <FaShoppingBag />
                </div>
                <div>
                  <p className="admin-subtitle">Completed Orders</p>
                  <h3 className="admin-value">{stats?.totalDelivered || 0}</h3>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Show regular stats for admins/managers
          <>
            <div className="admin-stats-card">
              <div className="flex items-center">
                <div className="admin-icon admin-icon-blue">
                  <FaUsers />
                </div>
                <div>
                  <p className="admin-subtitle">Total Users</p>
                  <h3 className="admin-value">{stats?.totalUsers || 0}</h3>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-card">
              <div className="flex items-center">
                <div className="admin-icon admin-icon-primary">
                  <FaBoxOpen />
                </div>
                <div>
                  <p className="admin-subtitle">Products</p>
                  <h3 className="admin-value">{stats?.totalProducts || 0}</h3>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-card">
              <div className="flex items-center">
                <div className="admin-icon admin-icon-yellow">
                  <FaList />
                </div>
                <div>
                  <p className="admin-subtitle">Categories</p>
                  <h3 className="admin-value">{stats?.totalCategories || 0}</h3>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-card">
              <div className="flex items-center">
                <div className="admin-icon admin-icon-red">
                  <FaLayerGroup />
                </div>
                <div>
                  <p className="admin-subtitle">Low Stock</p>
                  <h3 className="admin-value">{stats?.lowStockProducts?.length || 0}</h3>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Quick Actions - Only show for non-supporters */}
      {!isSupporter && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Link 
            href="/admin/products"
            className="admin-action-card"
          >
            <FaList className="text-primary text-3xl mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">Manage Products</h3>
            <p className="text-sm text-gray-400">Add, edit, or remove products</p>
          </Link>
          
          <Link 
            href="/admin/categories"
            className="admin-action-card"
          >
            <FaBoxOpen className="text-primary text-3xl mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">Manage Categories</h3>
            <p className="text-sm text-gray-400">Organize your products</p>
          </Link>
          
          <Link 
            href="/admin/sliders"
            className="admin-action-card"
          >
            <FaImages className="text-primary text-3xl mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">Manage Sliders</h3>
            <p className="text-sm text-gray-400">Update homepage sliders</p>
          </Link>
          
          <Link 
            href="/admin/seo"
            className="admin-action-card"
          >
            <FaServer className="text-primary text-3xl mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">SEO Settings</h3>
            <p className="text-sm text-gray-400">Optimize your site for search</p>
          </Link>
        </div>
      )}
      
      {/* Quick Action for Supporters */}
      {isSupporter && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-10">
          <Link 
            href="/admin/tickets"
            className="admin-action-card"
          >
            <FaTicketAlt className="text-primary text-3xl mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">Support Tickets</h3>
            <p className="text-sm text-gray-400">Manage customer support tickets</p>
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders - Only show for non-supporters */}
        {!isSupporter && (
          <div className="admin-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="admin-title">Recent Orders</h2>
              <Link href="/admin/orders" className="admin-link">
                View All <FaArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrdersData?.map((order: Order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="font-medium">{order.id.substring(0, 8)}</span>
                      </td>
                      <td>
                        <span className="text-sm">{order.user?.email || 'Unknown'}</span>
                      </td>
                      <td>
                        <span className="text-sm">₺{Number(order.totalAmount).toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            order.status === 'COMPLETED'
                              ? 'admin-badge-success'
                              : order.status === 'PENDING'
                              ? 'admin-badge-warning'
                              : order.status === 'PROCESSING'
                              ? 'admin-badge-info'
                              : 'admin-badge-danger'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!recentOrdersData || recentOrdersData.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center py-4">No recent orders found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Low Stock Products - Only show for non-supporters */}
        {!isSupporter && (
          <div className="admin-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="admin-title">Low Stock Products</h2>
              <Link href="/admin/products" className="admin-link">
                View All <FaArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.lowStockProducts?.map((product: LowStockProduct) => (
                    <tr key={product.id}>
                      <td>
                        <span className="font-medium">{product.name}</span>
                      </td>
                      <td>
                        <span className="text-sm">{product.stockCount}</span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            product.stockCount === 0
                              ? 'admin-badge-danger'
                              : product.stockCount < 5
                              ? 'admin-badge-warning'
                              : 'admin-badge-info'
                          }`}
                        >
                          {product.stockCount === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.lowStockProducts || stats.lowStockProducts.length === 0) && (
                    <tr>
                      <td colSpan={3} className="text-center py-4">No low stock products</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Recent Activity - Only show for non-supporters */}
        {!isSupporter && (
          <div className="admin-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="admin-title">Recent Activity</h2>
              <Link href="/admin/activity" className="admin-link">
                View All <FaArrowRight size={12} />
              </Link>
            </div>
            <ActivityLogList limit={5} />
          </div>
        )}
        
        {/* Sales Overview - Only show for non-supporters */}
        {!isSupporter && (
          <SalesOverviewPanel />
        )}
        
        {/* Recent Tickets - Show for supporters */}
        {isSupporter && (
          <div className="admin-card lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="admin-title">Recent Support Tickets</h2>
              <Link href="/admin/tickets" className="admin-link">
                View All <FaArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTicketsData?.map((ticket: Ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <span className="font-medium">{ticket.id.substring(0, 8)}</span>
                      </td>
                      <td>
                        <span className="text-sm">{ticket.title}</span>
                      </td>
                      <td>
                        <span className="text-sm">{ticket.user?.email || 'Unknown'}</span>
                      </td>
                      <td>
                        <span className="text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            ticket.status === 'OPEN'
                              ? 'admin-badge-warning'
                              : ticket.status === 'IN_PROGRESS'
                              ? 'admin-badge-info'
                              : 'admin-badge-success'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        <Link 
                          href={`/admin/tickets/${ticket.id}`}
                          className="admin-button text-xs py-1 px-2"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!recentTicketsData || recentTicketsData.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center py-4">No tickets found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}