'use client';

import * as React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaShoppingBag, FaCheck, FaTimes, FaSpinner, FaSync } from 'react-icons/fa';
import { formatPrice, formatDate } from '@/lib/utils';
import { trpc } from '@/lib/trpc-client';
import { useSession } from 'next-auth/react';
import { AccountCredential } from '@/components/ui/AccountCredential';
import { useUserOrders } from '@/lib/hooks/use-orders';

export default function OrdersPage() {
  const { status } = useSession();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  
  // Use custom hook for orders
  const { orders, isLoading, refreshOrders } = useUserOrders();
  
  // Fetch order details when an order is selected
  const { data: orderDetails, isLoading: isLoadingDetails } = trpc.public.getOrderDetails.useQuery(
    { orderId: selectedOrder as string },
    { 
      enabled: !!selectedOrder,
      refetchOnMount: true,
      staleTime: 0 
    }
  );
  
  // Handle download button click
  const handleDownload = (e: React.MouseEvent, content: string, productName: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Create a blob with the content
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.replace(/\s+/g, '_').toLowerCase()}_account.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle order selection
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrder(orderId);
  };

  // Stop event propagation for account details section
  const handleAccountDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="dashboard-card">
            <h1 className="text-2xl font-bold mb-4">Kimlik Doğrulama Gerekli</h1>
            <p className="text-gray-300 mb-6">
              Sipariş geçmişinizi görüntülemek için lütfen giriş yapın.
            </p>
            <Link 
              href="/auth/login?callbackUrl=/dashboard/orders"
              className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg inline-block transition-colors"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dashboard-header">
        <h1>Siparişleriniz</h1>
        <p>Satın alma geçmişinizi görüntüleyin ve yönetin</p>
        <Link href="/dashboard" className="dashboard-link mt-2">
          <FaArrowLeft className="mr-2" /> Kontrol Paneline Geri Dön
        </Link>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Order List */}
        <div className="lg:w-1/2">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="dashboard-icon dashboard-icon-blue">
                  <FaShoppingBag size={20} />
                </div>
                <h2 className="dashboard-title">Sipariş Geçmişi</h2>
              </div>
              <button
                onClick={refreshOrders}
                className="text-primary hover:text-primary-hover bg-black/30 p-2 rounded-full transition-colors"
                title="Siparişleri yenile"
                aria-label="Siparişleri yenile"
              >
                <FaSync size={14} />
              </button>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <FaSpinner className="animate-spin text-primary text-3xl mx-auto mb-4" />
                <p className="text-gray-400">Siparişleriniz yükleniyor...</p>
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="p-8 text-center">
                <FaShoppingBag className="text-gray-500 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Henüz sipariş yok</h3>
                <p className="text-gray-400 mb-6">Henüz hiç sipariş vermediniz.</p>
                <Link 
                  href="/products"
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg inline-block transition-colors"
                >
                  Ürünlere Göz At
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className={`
                      relative cursor-pointer
                      w-full text-left p-4 rounded-lg
                      transition-all duration-300
                      border border-transparent
                      ${selectedOrder === order.id 
                        ? 'bg-primary/20 border-primary/30' 
                        : 'bg-black/20 hover:bg-black/40 hover:border-gray-700'}
                    `}
                    onClick={() => handleOrderSelect(order.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Sipariş #{order.id.substring(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(Number(order.totalAmount))}</p>
                        <span 
                          className={`
                            inline-block px-2 py-1 text-xs rounded-full
                            ${order.status === 'COMPLETED' 
                              ? 'bg-green-900/30 text-green-400 border border-green-900/50' 
                              : order.status === 'FAILED' || order.status === 'CANCELED'
                              ? 'bg-red-900/30 text-red-400 border border-red-900/50'
                              : 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50'}
                          `}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                    {/* Add a transparent overlay to ensure the entire area is clickable */}
                    <div 
                      className="absolute inset-0 z-10" 
                      onClick={() => handleOrderSelect(order.id)}
                      aria-hidden="true"
                    ></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Order Details */}
        <div className="lg:w-1/2">
          <div className="dashboard-card">
            <div className="flex items-center mb-4">
              <div className="dashboard-icon dashboard-icon-primary">
                <FaShoppingBag size={20} />
              </div>
              <h2 className="dashboard-title">Sipariş Detayları</h2>
            </div>
            
            {!selectedOrder ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Detayları görüntülemek için bir sipariş seçin</p>
              </div>
            ) : isLoadingDetails ? (
              <div className="p-8 text-center">
                <FaSpinner className="animate-spin text-primary text-3xl mx-auto mb-4" />
                <p className="text-gray-400">Sipariş detayları yükleniyor...</p>
              </div>
            ) : !orderDetails ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Sipariş detayları bulunamadı</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Sipariş #{orderDetails.id.substring(0, 8).toUpperCase()}
                    </h3>
                    <span 
                      className={`
                        inline-block px-2 py-1 text-xs rounded-full
                        ${orderDetails.status === 'COMPLETED' 
                          ? 'bg-green-900/30 text-green-400 border border-green-900/50' 
                          : orderDetails.status === 'FAILED' || orderDetails.status === 'CANCELED'
                          ? 'bg-red-900/30 text-red-400 border border-red-900/50'
                          : 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50'}
                      `}
                    >
                      {orderDetails.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-lg border border-gray-800">
                    <div>
                      <p className="text-gray-400">Sipariş Tarihi</p>
                      <p>{formatDate(orderDetails.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Toplam Tutar</p>
                      <p className="font-semibold">{formatPrice(Number(orderDetails.totalAmount))}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-3 pb-2 border-b border-gray-700/50">Ürünler</h4>
                  <div className="space-y-3">
                    {orderDetails.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between bg-black/20 p-3 rounded-lg border border-gray-800">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-400">
                            {item.quantity} x {formatPrice(Number(item.price))}
                          </p>
                        </div>
                        <p className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Account Credentials Section */}
                {orderDetails.stocks && orderDetails.stocks.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 pb-2 border-b border-gray-700/50">Hesap Bilgileri</h4>
                    <div className="space-y-3" onClick={handleAccountDetailsClick}>
                      {orderDetails.stocks.map((stock) => (
                        <AccountCredential
                          key={stock.id}
                          title={stock.product.name}
                          content={stock.content}
                          isDelivered={stock.isDelivered}
                          onDownload={(e) => handleDownload(e, stock.content, stock.product.name)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Order Status */}
                <div>
                  <h4 className="font-medium mb-3 pb-2 border-b border-gray-700/50">Sipariş Durumu</h4>
                  <div className="bg-black/20 p-4 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3">
                      {orderDetails.status === 'COMPLETED' ? (
                        <div className="flex items-center text-green-400">
                          <FaCheck className="mr-2" />
                          <span>Tamamlandı</span>
                        </div>
                      ) : orderDetails.status === 'FAILED' || orderDetails.status === 'CANCELED' ? (
                        <div className="flex items-center text-red-400">
                          <FaTimes className="mr-2" />
                          <span>İptal Edildi</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-400">
                          <FaSpinner className="mr-2 animate-spin" />
                          <span>İşleniyor</span>
                        </div>
                      )}
                    </div>
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