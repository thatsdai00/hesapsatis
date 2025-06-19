import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FaUser, FaShoppingCart, FaTicketAlt, FaWallet, FaArrowRight, FaCog, FaHome } from 'react-icons/fa';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import prisma from '@/lib/prisma';
import '../dashboard.css';

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    // This should theoretically not be reached if middleware is working,
    // but as a fallback, redirect to login.
    redirect('/auth/login');
  }

  // Fetch user with balance
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      balance: true,
      orders: {
        select: { id: true },
      },
      tickets: {
        where: { status: 'CLOSED' },
        select: { id: true },
      },
    },
  });

  if (!user) {
    // If the user session exists but user is not in DB, redirect to login
    redirect('/auth/login');
  }

  const orderCount = user.orders.length;
  const ticketCount = user.tickets.length;
  // Convert Decimal to number for formatting
  const balance = Number(user.balance);

  // Navigation items for the top nav


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="dashboard-header">
        <h1>Kontrol Paneli</h1>
        <p>Tekrar hoş geldiniz, {user.name?.split(' ')[0] || user.email?.split('@')[0] || 'Kullanıcı'}</p>
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* User Info Card */}
        <div className="dashboard-card">
          <div className="flex items-center mb-4">
            <div className="dashboard-icon dashboard-icon-primary">
              <FaUser size={20} />
            </div>
            <div>
              <h2 className="dashboard-title">{user.name || 'Kullanıcı'}</h2>
              <p className="dashboard-subtitle">{user.email}</p>
            </div>
          </div>
          <Link 
            href="/dashboard/profile" 
            className="dashboard-link"
          >
            Profili Düzenle <FaArrowRight size={12} />
          </Link>
        </div>

        {/* Balance Card */}
        <div className="dashboard-card">
          <div className="flex items-center mb-4">
            <div className="dashboard-icon dashboard-icon-green">
              <FaWallet size={20} />
            </div>
            <div>
              <h2 className="dashboard-title">Bakiye</h2>
              <p className="dashboard-subtitle">Mevcut Bakiye</p>
            </div>
          </div>
          <div className="dashboard-value">{formatPrice(balance)}</div>
          <Link 
            href="/dashboard/add-funds" 
            className="dashboard-link"
          >
            Bakiye Ekle <FaArrowRight size={12} />
          </Link>
        </div>

        {/* Orders Card */}
        <div className="dashboard-card">
          <div className="flex items-center mb-4">
            <div className="dashboard-icon dashboard-icon-blue">
              <FaShoppingCart size={20} />
            </div>
            <div>
              <h2 className="dashboard-title">Siparişler</h2>
              <p className="dashboard-subtitle">Satın Alma Geçmişi</p>
            </div>
          </div>
          <div className="dashboard-value">{orderCount}</div>
          <Link 
            href="/dashboard/orders" 
            className="dashboard-link"
          >
            Siparişleri Görüntüle <FaArrowRight size={12} />
          </Link>
        </div>

        {/* Tickets Card */}
        <div className="dashboard-card">
          <div className="flex items-center mb-4">
            <div className="dashboard-icon dashboard-icon-yellow">
              <FaTicketAlt size={20} />
            </div>
            <div>
              <h2 className="dashboard-title">Destek</h2>
              <p className="dashboard-subtitle">Çözülmüş Destek Talepleri</p>
            </div>
          </div>
          <div className="dashboard-value">{ticketCount}</div>
          <Link 
            href="/dashboard/tickets" 
            className="dashboard-link"
          >
            Destek Taleplerini Görüntüle <FaArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="dashboard-card mt-8">
        <h2 className="dashboard-title mb-4">Son Etkinlik</h2>
        <div className="space-y-4">
          {/* This is a placeholder for dynamic content */}
          <div className="flex items-center p-3 bg-black/20 rounded-lg border border-gray-800">
            <div className="dashboard-icon dashboard-icon-blue w-10 h-10">
              <FaShoppingCart size={16} />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-white">Yeni Sipariş Verildi</div>
              <div className="text-xs text-gray-400">#12345 numaralı siparişiniz işleme alındı</div>
            </div>
            <div className="ml-auto text-xs text-gray-500">Şimdi</div>
          </div>
          
          {/* More activity items would be dynamically generated here */}
        </div>
      </div>
    </div>
  );
} 