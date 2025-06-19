'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import { formatPrice } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export default function SalesOverviewPanel() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  
  // Fetch sales overview data
  const { data: overviewData, isLoading: overviewLoading } = trpc.admin.getSalesOverview.useQuery();
  
  // Fetch detailed sales data for chart
  const { 
    data: salesData, 
    isLoading: chartLoading,
    error 
  } = trpc.admin.getSalesData.useQuery({ timeRange });
  
  // Handle loading states
  const isLoading = overviewLoading || chartLoading;
  
  // Format chart data
  const chartData = {
    labels: salesData?.data.map(item => {
      // Format the date label based on time range
      const date = item.date;
      if (timeRange === 'today') {
        // For today, show only the hour
        return date.split(' ')[1].substring(0, 5);
      } else if (timeRange === 'week' || timeRange === 'month') {
        // For week/month, show day and month
        return date.substring(5); // MM-DD
      } else {
        // For year/all, show month and year
        return date; // YYYY-MM
      }
    }) || [],
    datasets: [
      {
        label: 'Sales',
        data: salesData?.data.map(item => item.totalAmount) || [],
        borderColor: 'rgb(162, 89, 255)',
        backgroundColor: 'rgba(162, 89, 255, 0.5)',
        tension: 0.3,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `₺${value}`,
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `₺${context.parsed.y.toFixed(2)}`
        },
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(162, 89, 255, 0.3)',
        borderWidth: 1
      }
    },
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };
  
  // If there's an error, show error message
  if (error) {
    return (
      <div className="admin-card">
        <h2 className="admin-title">Sales Overview</h2>
        <div className="text-red-500 py-4">
          Error loading sales data: {error.message}
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="admin-title">Sales Overview</h2>
        <div className="flex space-x-2">
          <button 
            className={`admin-button text-xs py-1 px-3 ${timeRange === 'today' ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
            onClick={() => handleTimeRangeChange('today')}
          >
            Today
          </button>
          <button 
            className={`admin-button text-xs py-1 px-3 ${timeRange === 'week' ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
            onClick={() => handleTimeRangeChange('week')}
          >
            Last 7 Days
          </button>
          <button 
            className={`admin-button text-xs py-1 px-3 ${timeRange === 'month' ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
            onClick={() => handleTimeRangeChange('month')}
          >
            Last 30 Days
          </button>
          <button 
            className={`admin-button text-xs py-1 px-3 ${timeRange === 'year' ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
            onClick={() => handleTimeRangeChange('year')}
          >
            Year
          </button>
          <button 
            className={`admin-button text-xs py-1 px-3 ${timeRange === 'all' ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
            onClick={() => handleTimeRangeChange('all')}
          >
            All Time
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="py-8 text-center">Loading sales data...</div>
      ) : (
        <>
          {/* Sales Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Today</p>
              <p className="text-xl font-bold text-white">{formatPrice(overviewData?.todaySales || 0)}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400">This Week</p>
              <p className="text-xl font-bold text-white">{formatPrice(overviewData?.thisWeekSales || 0)}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400">This Month</p>
              <p className="text-xl font-bold text-white">{formatPrice(overviewData?.thisMonthSales || 0)}</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-xl font-bold text-white">{formatPrice(overviewData?.totalSales || 0)}</p>
            </div>
          </div>
          
          {/* Sales Chart */}
          <div className="h-64 mt-6">
            {salesData && salesData.data.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No sales data available for the selected period
              </div>
            )}
          </div>
          
          {/* Period Summary */}
          <div className="mt-6 flex justify-between items-center text-sm text-gray-400">
            <p>
              {salesData?.totalOrders || 0} orders in this period
            </p>
            <p>
              Total: {formatPrice(salesData?.totalAmount || 0)}
            </p>
          </div>
        </>
      )}
    </div>
  );
} 