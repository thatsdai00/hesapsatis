'use client';

import * as React from 'react';

import {useState} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShoppingCart, FaCheckCircle, FaExclamationTriangle, FaWallet, FaCreditCard, FaShieldAlt, FaInfoCircle, FaBoxOpen, FaMoneyBillWave } from 'react-icons/fa';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc-client';
import { useCart } from '@/components/providers/cart-provider';
import { Button } from '@/components/ui/button';

import FuturisticRadioButton from '@/components/ui/FuturisticRadioButton';
import '../dashboard.css';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  }),
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cartItems, clearCart, cartTotal } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'balance'>('credit_card');
  
  interface OrderDetails {
    orderId: string;
    success: boolean;
    newBalance?: number;
  }
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  
  // Redirect to cart if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !checkoutComplete) {
      router.push('/cart');
    }
  }, [cartItems, checkoutComplete, router]);
  
  // Fetch user balance if logged in
  const { data: userBalance, refetch: refetchBalance } = trpc.public.getUserBalance.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  // Checkout with balance mutation
  const checkoutWithBalance = trpc.public.checkoutWithBalance.useMutation({
    onSuccess: (data) => {
      setCheckoutComplete(true);
      setOrderDetails(data);
      clearCart();
      refetchBalance();
    },
    onError: (error) => {
      // Check if it's a stock error
      if (error.message.includes('Insufficient stock')) {
        setStockError(error.message);
      } else {
        toast.error(`Ödeme başarısız: ${error.message}`);
      }
      setIsProcessing(false);
    },
  });

  const total = cartTotal;
  
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Sepetiniz boş');
      return;
    }

    if (paymentMethod === 'balance' && !session) {
      toast.error('Bakiye ile ödeme yapmak için giriş yapmalısınız');
      return;
    }

    if (paymentMethod === 'balance' && userBalance !== undefined && Number(userBalance) < total) {
      toast.error('Yetersiz bakiye');
      return;
    }
    
    setIsProcessing(true);
    setStockError(null);
    
    try {
      if (paymentMethod === 'balance') {
        // Process payment with balance
        checkoutWithBalance.mutate({
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: total,
        });
      } else {
        // Process credit card payment (mock for now)
        // In a real implementation, this would integrate with a payment gateway
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCheckoutComplete(true);
        setOrderDetails({
          orderId: `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          success: true
        });
        clearCart();
      }
    } catch (error) {
      toast.error('Ödeme başarısız. Lütfen tekrar deneyin.');
      console.error(error);
      setIsProcessing(false);
    }
  };

  if (checkoutComplete) {
    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          className="max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
        >
          <motion.div 
            className="dashboard-header text-center"
            variants={fadeIn}
            custom={0}
          >
            <div className="flex justify-center mb-6">
              <div className="dashboard-icon dashboard-icon-green w-20 h-20">
                <FaCheckCircle className="text-4xl" />
              </div>
            </div>
            <h1>Siparişiniz Tamamlandı!</h1>
            <p>Satın aldığınız için teşekkür ederiz. Siparişiniz onaylandı.</p>
          </motion.div>
          
          <motion.div 
            className="dashboard-card mb-8"
            variants={fadeIn}
            custom={1}
          >
            <h2 className="dashboard-title mb-4">Sipariş Bilgileri</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="dashboard-icon dashboard-icon-blue w-10 h-10">
                  <FaBoxOpen size={16} />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-white">Sipariş ID</div>
                  <div className="text-lg text-gray-200">{orderDetails?.orderId}</div>
                </div>
              </div>
              
              {paymentMethod === 'balance' && (
                <div className="flex items-center">
                  <div className="dashboard-icon dashboard-icon-green w-10 h-10">
                    <FaWallet size={16} />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-white">Yeni Bakiye</div>
                    <div className="text-lg text-gray-200">{formatPrice(orderDetails?.newBalance || 0)}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <div className="dashboard-icon dashboard-icon-primary w-10 h-10">
                  {paymentMethod === 'balance' ? <FaWallet size={16} /> : <FaCreditCard size={16} />}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-white">Ödeme Yöntemi</div>
                  <div className="text-lg text-gray-200">{paymentMethod === 'balance' ? 'Hesap Bakiyesi' : 'Kredi Kartı'}</div>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="dashboard-card mb-8"
            variants={fadeIn}
            custom={2}
          >
            <h2 className="dashboard-title mb-4">Önemli Bilgiler</h2>
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="dashboard-icon dashboard-icon-primary w-8 h-8">
                  <FaInfoCircle size={14} />
                </div>
                <span className="ml-3">Hesap bilgileriniz için e-postanızı kontrol edin</span>
              </li>
              <li className="flex items-center">
                <div className="dashboard-icon dashboard-icon-primary w-8 h-8">
                  <FaInfoCircle size={14} />
                </div>
                <span className="ml-3">Hesap şifrenizi hemen değiştirmeyi unutmayın</span>
              </li>
              <li className="flex items-center">
                <div className="dashboard-icon dashboard-icon-primary w-8 h-8">
                  <FaInfoCircle size={14} />
                </div>
                <span className="ml-3">Herhangi bir sorunla karşılaşırsanız, lütfen destek ekibimizle iletişime geçin</span>
              </li>
            </ul>
          </motion.div>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={fadeIn}
            custom={3}
          >
            <Link 
              href="/dashboard"
              className="flex-1"
            >
              <Button 
                variant="primary"
                className="w-full"
              >
                Siparişlerinizi Görüntüleyin
              </Button>
            </Link>
            <Link 
              href="/products"
              className="flex-1"
            >
              <Button 
                variant="secondary"
                className="w-full"
              >
                Alışverişe Devam Et
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/cart" className="inline-flex items-center text-primary hover:text-primary-hover">
          <FaArrowLeft className="mr-2" /> Sepete Geri Dön
        </Link>
      </div>
      
      <div className="dashboard-header">
        <h1>Ödeme</h1>
        <p>Siparişinizi tamamlamak için ödeme bilgilerinizi girin</p>
      </div>
      
      {/* Stock Error Alert */}
      {stockError && (
        <motion.div 
          className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6 flex items-start"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <FaExclamationTriangle className="text-red-400 mr-2 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold">Stok Hatası</p>
            <p className="text-sm">{stockError}</p>
            <p className="text-sm mt-2">Lütfen sepetinize dönün ve miktarları ayarlayın.</p>
          </div>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="dashboard-card mb-6">
            <div className="flex items-center mb-4 relative z-10">
              <div className="dashboard-icon dashboard-icon-blue">
                <FaShoppingCart size={20} />
              </div>
              <h2 className="dashboard-title">Sepetinizdeki Ürünler</h2>
            </div>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ürün
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Miktar
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Toplam
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {cartItems.map((item, index) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-md mr-4 flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-md" />
                            ) : (
                              <FaShoppingCart className="text-primary/50" />
                            )}
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="dashboard-card">
            <div className="flex items-center mb-4 relative z-10">
              <div className="dashboard-icon dashboard-icon-green">
                <FaMoneyBillWave size={20} />
              </div>
              <h2 className="dashboard-title">Ödeme Yöntemi</h2>
            </div>
            
            <div className="space-y-4 relative z-10">
              <FuturisticRadioButton
                id="payment_credit_card"
                name="paymentMethod"
                value="credit_card"
                checked={paymentMethod === 'credit_card'}
                onChange={() => setPaymentMethod('credit_card')}
                label="Kredi Kartı"
                description="Kredi kartınızla güvenle ödeyin"
                icon={<FaCreditCard />}
              />
              
              <FuturisticRadioButton
                id="payment_balance"
                name="paymentMethod"
                value="balance"
                checked={paymentMethod === 'balance'}
                onChange={() => setPaymentMethod('balance')}
                disabled={!session}
                label="Hesap Bakiyesi"
                description={!session 
                  ? 'Hesap bakiyenizi kullanmak için giriş yapın' 
                  : 'Hesap bakiyenizi kullanarak ödeyin'
                }
                icon={<FaWallet className="text-green-500" />}
              />
              
              {session && userBalance !== undefined && (
                <div className="ml-10 -mt-2 mb-2">
                  <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded">
                    {formatPrice(Number(userBalance))}
                  </span>
                </div>
              )}
              
              {paymentMethod === 'balance' && session && userBalance !== undefined && Number(userBalance) < total && (
                <p className="text-red-500 text-sm ml-10">
                  Yetersiz bakiye. Lütfen para ekleyin veya başka bir ödeme yöntemi seçin.
                </p>
              )}
              
              {!session && (
                <p className="text-sm text-gray-400 ml-10">
                  <Link href="/auth/login?callbackUrl=/checkout" className="text-primary hover:underline">
                    Giriş yapın
                  </Link> hesap bakiyenizi kullanmak için.
                </p>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700 relative z-10">
              <div className="flex items-center text-sm text-gray-400">
                <FaShieldAlt className="text-green-500 mr-2" />
                <span>Tüm ödemeler güvenli ve şifrelidir</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="dashboard-card sticky top-20">
            <div className="flex items-center mb-4 relative z-10">
              <div className="dashboard-icon dashboard-icon-primary">
                <FaShoppingCart size={20} />
              </div>
              <h2 className="dashboard-title">Sipariş Özeti</h2>
            </div>
            
            <div className="space-y-4 mb-6 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Ürün Sayısı</span>
                <span className="dashboard-value text-base">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Ara Toplam</span>
                <span className="dashboard-value text-base">{formatPrice(total)}</span>
              </div>
              
              <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                <span className="font-semibold">Toplam</span>
                <span className="dashboard-value">{formatPrice(total)}</span>
              </div>
            </div>
            
            <div className="relative z-20">
              <Button 
                onClick={handleCheckout}
                disabled={
                  cartItems.length === 0 || 
                  isProcessing || 
                  (paymentMethod === 'balance' && (!session || (userBalance !== undefined && Number(userBalance) < total)))
                }
                className="w-full py-3"
                isLoading={isProcessing}
              >
                {isProcessing ? 'İşleniyor...' : 'Siparişi Tamamla'}
              </Button>
              
              <p className="text-sm text-gray-400 mt-4 text-center">
                Satın alma işleminizi tamamlayarak, Kullanım Koşullarımızı ve Gizlilik Politikamızı kabul etmiş olursunuz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 