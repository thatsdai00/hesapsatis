'use client';

import { useState } from 'react';
import { FaSearch, FaFilter, FaEye, FaRedo, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { formatPrice, formatDate } from '@/lib/utils';
import { trpc } from '@/lib/trpc-client';
import toast from 'react-hot-toast';
import { Decimal } from '@prisma/client/runtime/library';

// Define types for the order data
type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number | string;
  product: {
    id: string;
    name: string;
    [key: string]: any;
  };
}

interface Stock {
  id: string;
  content: string;
  isDelivered: boolean;
  product: {
    id: string;
    name: string;
    [key: string]: any;
  };
}

interface Order {
  id: string;
  userId: string;
  totalAmount: number | string | Decimal;
  status: OrderStatus;
  deliveryStatus?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: User;
  orderItems?: any[];
  stocks?: any[];
}

export default function AdminOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const utils = trpc.useContext();
  
  // Fetch all orders
  const { data: orders, isLoading, refetch } = trpc.admin.getOrders.useQuery({
    limit: 50 // Add a default limit parameter
  });
  
  // Fetch order details when an order is selected
  const { data: orderDetails, isLoading: isLoadingDetails } = trpc.admin.getOrderDetails.useQuery(
    { orderId: selectedOrder as string },
    { enabled: !!selectedOrder }
  );
  
  // Update order status mutation
  const updateOrderStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success('Order status updated successfully');
      refetch();
      if (selectedOrder) {
        // Refetch the selected order details
        utils.admin.getOrderDetails.invalidate({ orderId: selectedOrder });
      }
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to update order status: ${error.message}`);
    },
  });
  
  // Re-deliver order items mutation - This seems to be a custom method that doesn't exist in the router
  // We'll comment it out for now as it's not defined in the admin router
  /*
  const redeliverOrder = trpc.admin.redeliverOrder.useMutation({
    onSuccess: () => {
      toast.success('Order items re-delivered successfully');
      refetch();
      if (selectedOrder) {
        // Refetch the selected order details
        utils.admin.getOrderDetails.invalidate({ orderId: selectedOrder });
      }
    },
    onError: (error: { message: string }) => {
      toast.error(`Failed to re-deliver order: ${error.message}`);
    },
  });
  */
  
  // Filter orders based on search term and status filter
  const filteredOrders = orders?.orders?.filter((order: any) => {
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle order status update
  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    updateOrderStatus.mutate({
      orderId,
      status: newStatus as OrderStatus,
    });
  };
  
  // Handle order re-delivery
  const handleRedeliver = (orderId: string) => {
    // Since redeliverOrder doesn't exist, we'll show a toast message instead
    toast.error('Re-delivery functionality is not implemented yet');
    // redeliverOrder.mutate({ orderId });
  };
  
  return (
    <div>
      <div className="admin-header">
        <h1>Orders Management</h1>
        <p>View and manage customer orders</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Orders List */}
        <div className="lg:w-2/3">
          {/* Filters */}
          <div className="admin-card mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by order ID or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-input pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <FaSearch className="text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <FaFilter className="text-gray-500 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="admin-input"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Orders Table */}
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <FaSpinner className="animate-spin text-primary text-3xl mx-auto mb-4" />
                  <p className="text-gray-400">Loading orders...</p>
                </div>
              ) : !filteredOrders || filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">No orders found</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order: any) => (
                      <tr 
                        key={order.id} 
                        className={`transition-colors ${
                          selectedOrder === order.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <td>
                          <div className="font-medium">#{order.id.substring(0, 8).toUpperCase()}</div>
                        </td>
                        <td>
                          <div className="font-medium">{order.user.name || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{order.user.email}</div>
                        </td>
                        <td>
                          {formatDate(order.createdAt)}
                        </td>
                        <td>
                          {formatPrice(Number(order.totalAmount))}
                        </td>
                        <td>
                          <span 
                            className={`admin-badge ${
                              order.status === 'COMPLETED' 
                                ? 'admin-badge-success' 
                                : order.status === 'FAILED' || order.status === 'CANCELED'
                                ? 'admin-badge-danger'
                                : order.status === 'PROCESSING'
                                ? 'admin-badge-info'
                                : 'admin-badge-warning'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedOrder(order.id)}
                            className="p-2 text-primary hover:text-primary-hover"
                            title="View Details"
                            type="button"
                          >
                            <FaEye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        
        {/* Order Details */}
        <div className="lg:w-1/3">
          <div className="admin-card h-full">
            {selectedOrder ? (
              isLoadingDetails ? (
              <div className="p-8 text-center">
                <FaSpinner className="animate-spin text-primary text-3xl mx-auto mb-4" />
                <p className="text-gray-400">Loading order details...</p>
              </div>
            ) : !orderDetails ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Order details not found</p>
              </div>
            ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="admin-title">Order Details</h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Order Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Order ID:</span>
                        <span className="font-medium">#{orderDetails.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span>{formatDate(orderDetails.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Customer:</span>
                        <span>{orderDetails.user.name || orderDetails.user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span>{orderDetails.user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Amount:</span>
                        <span className="font-medium">{formatPrice(Number(orderDetails.totalAmount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                    <span 
                          className={`admin-badge ${
                        orderDetails.status === 'COMPLETED' 
                              ? 'admin-badge-success' 
                          : orderDetails.status === 'FAILED' || orderDetails.status === 'CANCELED'
                              ? 'admin-badge-danger'
                          : orderDetails.status === 'PROCESSING'
                              ? 'admin-badge-info'
                              : 'admin-badge-warning'
                      }`}
                    >
                      {orderDetails.status}
                    </span>
                  </div>
                    </div>
                    
                    {/* Order Items */}
                    {orderDetails?.orderItems?.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Order Items</h3>
                        <div className="space-y-2">
                          {orderDetails.orderItems.map((item: any) => (
                            <div key={item.id} className="admin-card-inner flex justify-between items-center">
                              <div>
                                <div className="font-medium">{item.product.name}</div>
                                <div className="text-sm text-gray-400">
                                  Quantity: {item.quantity} × {formatPrice(Number(item.price))}
                                </div>
                              </div>
                              <div className="font-medium">
                                {formatPrice(Number(item.price) * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Order Actions */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Actions</h3>
                  <div className="space-y-3">
                        {/* Status Update */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm text-gray-400">Update Status:</label>
                          <div className="flex gap-2">
                      <select
                              className="admin-input flex-1"
                              value={orderDetails.status}
                        onChange={(e) => handleUpdateStatus(orderDetails.id, e.target.value)}
                              disabled={updateOrderStatus.isPending}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELED">Canceled</option>
                      </select>
                            {updateOrderStatus.isPending && (
                              <FaSpinner className="animate-spin text-primary my-auto" />
                            )}
                          </div>
                    </div>
                    
                    {/* Re-deliver Button */}
                        {orderDetails.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleRedeliver(orderDetails.id)}
                            className="admin-button w-full flex items-center justify-center gap-2"
                        disabled={/* redeliverOrder.isPending */ false}
                      >
                        {/* redeliverOrder.isPending ? (
                          <>
                                <FaSpinner className="animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                                <FaRedo /> Re-deliver Items
                          </>
                        ) */}
                      </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Delivered Items */}
                    {orderDetails?.stocks?.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Delivered Items</h3>
                        <div className="space-y-2">
                          {orderDetails.stocks.map((stock: any) => (
                            <div key={stock.id} className="admin-card-inner">
                              <div className="flex justify-between mb-2">
                                <div className="font-medium">
                                  {stock.product?.name || "Product"}
                                </div>
                                <span 
                                  className={`admin-badge ${
                                    stock.isDelivered 
                                      ? 'admin-badge-success' 
                                      : 'admin-badge-warning'
                                  }`}
                                >
                                  {stock.isDelivered ? 'Delivered' : 'Pending'}
                                </span>
                              </div>
                              <div className="bg-gray-800 p-3 rounded text-sm font-mono overflow-x-auto">
                                {stock.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-400">Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 