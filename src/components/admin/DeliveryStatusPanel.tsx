'use client';

import * as React from 'react';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, ChevronDown, Server, User, ShoppingCart, Clock } from 'lucide-react';

interface DeliveryLog {
  id: string;
  orderId: string;
  stockId: string;
  status: string;
  message: string;
  createdAt: string;
}

interface Order {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  totalAmount: number;
  status: string;
  deliveryStatus: string;
  createdAt: string;
  orderItems: {
    id: string;
    productId: string;
    product: {
      name: string;
    };
  }[];
  stocks: {
    id: string;
    content: string;
    isDelivered: boolean;
  }[];
  deliveryLogs: DeliveryLog[];
}

const statusStyles: { [key: string]: string } = {
  DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

function OrderCard({ order, onRetry, isRetrying }: { order: Order, onRetry: (orderId: string) => void, isRetrying: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-gray-800/40 border border-gray-700/60 rounded-lg overflow-hidden"
    >
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className={`py-1 px-3 text-sm font-semibold ${statusStyles[order.deliveryStatus] || 'bg-gray-600'}`}>
            {order.deliveryStatus}
          </Badge>
          <span className="font-semibold text-gray-200">Order #{order.id.substring(0, 8)}</span>
          <span className="text-gray-400 text-sm hidden md:block">{order.orderItems.map(item => item.product.name).join(', ')}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{formatDate(order.createdAt)}</span>
          <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-700/60 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Customer & Order Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><User size={16}/> Customer</h3>
                <p className="text-gray-400">{order.user.name}</p>
                <p className="text-gray-400">{order.user.email}</p>
                
                <h3 className="font-semibold text-white flex items-center gap-2 pt-4"><ShoppingCart size={16}/> Order Items</h3>
                <ul className="list-disc list-inside text-gray-400">
                  {order.orderItems.map(item => <li key={item.id}>{item.product.name}</li>)}
                </ul>
              </div>

              {/* Column 2: Delivered Stock */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><Server size={16}/> Delivered Stock</h3>
                {order.stocks.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {order.stocks.map(stock => (
                      <code key={stock.id} className="block text-sm bg-gray-900/70 p-2 rounded-md text-gray-300 w-full truncate">
                        {stock.content}
                      </code>
                    ))}
                  </div>
                ) : <p className="text-gray-500">No stock delivered.</p>}
                 {order.deliveryStatus === 'FAILED' && (
                  <Button onClick={() => onRetry(order.id)} disabled={isRetrying} size="sm">
                    {isRetrying ? 'Retrying...' : 'Retry Delivery'}
                  </Button>
                )}
              </div>

              {/* Column 3: Logs */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><Clock size={16}/> Delivery Logs</h3>
                {order.deliveryLogs.length > 0 ? (
                  <ul className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                    {order.deliveryLogs.map(log => (
                      <li key={log.id} className="text-gray-500">
                        <span className="text-gray-400 font-mono text-xs block">{formatDate(log.createdAt)}</span>
                        {log.message}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-gray-500">No delivery logs available.</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DeliveryStatusPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryLoading, setDeliveryLoading] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('ALL'); // ALL, DELIVERED, FAILED, PENDING

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders?status=COMPLETED');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  const triggerDelivery = async (orderId: string) => {
    setDeliveryLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await fetch('/api/orders/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (response.ok) {
        await fetchOrders();
      } else {
        const data = await response.json();
        alert(`Failed to deliver: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error triggering delivery:', error);
      alert('Failed to trigger delivery');
    } finally {
      setDeliveryLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter(order => order.deliveryStatus === filter);
  }, [orders, filter]);

  const FilterButton = ({ value, children }: {value: string, children: React.ReactNode}) => (
    <button 
      className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${filter === value ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
      onClick={() => setFilter(value)}
    >
      {children}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div layout className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2">
              <FilterButton value="ALL">All</FilterButton>
              <FilterButton value="DELIVERED">Delivered</FilterButton>
              <FilterButton value="FAILED">Failed</FilterButton>
              <FilterButton value="PENDING">Pending</FilterButton>
           </div>
          <Button onClick={fetchOrders} disabled={loading} variant="outline" className="border-gray-600 hover:bg-gray-800">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading recent deliveries...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No orders found for this filter.</div>
        ) : (
          <motion.div layout className="space-y-3">
             <AnimatePresence>
              {filteredOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onRetry={triggerDelivery}
                  isRetrying={!!deliveryLoading[order.id]}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
} 