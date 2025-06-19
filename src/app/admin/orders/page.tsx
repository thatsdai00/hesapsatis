'use client';

import * as React from 'react';

import { useState } from 'react';
import {FaSearch, FaFilter, FaEye, FaSpinner} from 'react-icons/fa';
import { formatPrice, formatDate } from '@/lib/utils';
import { trpc } from '@/lib/trpc-client';
import toast from 'react-hot-toast';


// Define types for the order data
type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

interface User {
  "id": string;
  "name": string | null;
  "email": string;
}

// Used in TypeScript type checking for order items
// interface OrderItem {
//   "id": string;
//   "productId": string;
//   "quantity": number;
//   "price": number | string;
//   "product": {
//     "id": string;
//     "name": string;
//     [key: string]: unknown;
//   };
// }

// Used in TypeScript type checking for stocks
// interface Stock {
//   "id": string;
//   "content": string;
//   "isDelivered": boolean;
//   "product": {
//     "id": string;
//     "name": string;
//     [key: string]: unknown;
//   };
// }

// We'll keep this interface for reference but not use it directly
interface OrderType {
  "id": string;
  "userId": string;
  "totalAmount": number | string;
  "status": OrderStatus;
  deliveryStatus?: string;
  "createdAt": string | Date;
  "updatedAt": string | Date;
  "user": User;
  orderItems?: [];
  stocks?: [];
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
    "onSuccess": () => {
      toast.success('Status updated successfully');
      refetch();
      if (selectedOrder) {
        // Refetch the selected order details
        utils.admin.getOrderDetails.invalidate({ orderId: selectedOrder });
      }
    },
    "onError": (error: { message: string }) => {
      toast.error(`Failed to update order status: ${error.message}`);
    }
  });
  
  // Filter orders based on search term and status filter
  const filteredOrders = orders?.orders?.filter((order: OrderType) => {
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
      status: newStatus as OrderStatus 
    });
  };
  
  // Handle order re-delivery
  const handleRedeliver = (orderId: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
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
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order: OrderType) => (
                      <tr key={order.id} className={selectedOrder === order.id ? 'bg-primary bg-opacity-10' : ''}>
                        <td className="font-mono text-xs">{order.id.substring(0, 8)}...</td>
                        <td>{order.user.email}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>{formatPrice(order.totalAmount)}</td>
                        <td>
                          <span className={`status-badge status-${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedOrder(order.id === selectedOrder ? "null": order.id)}
                            className="admin-icon-button"
                            aria-label="View order details"
                          >
                            <FaEye />
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
        
        {/*  Details */}
        <div className="lg:w-1/3">
          <div className="admin-card">
            {!selectedOrder ? (
              <div className="p-4 text-center">
                <p className="text-gray-400">Select an order to view details</p>
              </div>
            ) : isLoadingDetails ? (
              <div className="p-8 text-center">
                <FaSpinner className="animate-spin text-primary text-3xl mx-auto mb-4" />
                <p className="text-gray-400">Loading order details...</p>
              </div>
            ) : !orderDetails ? (
              <div className="p-4 text-center">
                <p className="text-gray-400"> details not found</p>
              </div>
            ) : (
              <div>
                <div className="border-b border-gray-700 pb-4 mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Order Details</h3>
                    <span className={`status-badge status-${orderDetails.status.toLowerCase()}`}>
                      {orderDetails.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Order ID: {orderDetails.id}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <p className="text-sm">{orderDetails.user.name || 'No name provided'}</p>
                  <p className="text-sm">{orderDetails.user.email}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{formatDate(orderDetails.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold">{formatPrice(orderDetails.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span>Balance</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Order Items</h4>
                  {orderDetails.orderItems && orderDetails.orderItems.length > 0 ? (
                    <div className="space-y-3">
                      {orderDetails.orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between pb-2 border-b border-gray-700">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                          </div>
                          <p>{formatPrice(item.price)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No items found</p>
                  )}
                </div>
                
                {orderDetails.stocks && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Delivery Status</h4>
                    <div className="space-y-2">
                      {orderDetails.stocks.map((stock) => (
                        <div key={stock.id} className="text-sm flex items-center justify-between">
                          <span>{stock.product.name}</span>
                          <span className={`status-badge ${stock.isDelivered ? 'status-completed' : 'status-pending'}`}>
                            {stock.isDelivered ? 'Delivered' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-t border-gray-700 pt-4 mt-6">
                  <h4 className="font-medium mb-3">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="admin-input text-sm py-1"
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
                    
                    <button
                      className="admin-button-secondary text-sm py-1"
                      onClick={() => handleRedeliver(orderDetails.id)}
                    >
                      Re-deliver Items
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 