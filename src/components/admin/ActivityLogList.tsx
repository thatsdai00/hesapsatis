'use client';

import * as React from 'react';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import { ActivityLog } from '@/interfaces';
import { 
  FaShoppingBag, 
  FaUser, 
  FaTicketAlt, 
  FaBoxOpen, 
  FaList, 
  FaLayerGroup,
  FaCog,
  FaWallet
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLogListProps {
  limit?: number;
  showDateFilter?: boolean;
  className?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default function ActivityLogList({ 
  limit = 10, 
  showDateFilter = false,
  className = '',
  dateFrom: externalDateFrom,
  dateTo: externalDateTo
}: ActivityLogListProps) {
  const [internalDateFrom, setInternalDateFrom] = useState<string>('');
  const [internalDateTo, setInternalDateTo] = useState<string>('');
  
  // Use external dates if provided, otherwise use internal state
  const dateFrom = externalDateFrom !== undefined ? externalDateFrom : internalDateFrom;
  const dateTo = externalDateTo !== undefined ? externalDateTo : internalDateTo;
  
  // If external dates are provided, use them directly
  const setDateFrom = externalDateFrom !== undefined ? () => {} : setInternalDateFrom;
  const setDateTo = externalDateTo !== undefined ? () => {} : setInternalDateTo;

  const { data, isLoading } = trpc.admin.getActivityLogs.useQuery({
    limit,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_REGISTRATION':
        return <FaUser />;
      case 'ORDER_CREATED':
        return <FaShoppingBag />;
      case 'TICKET_SUBMITTED':
        return <FaTicketAlt />;
      case 'PRODUCT_ADDED':
        return <FaBoxOpen />;
      case 'CATEGORY_CREATED':
        return <FaList />;
      case 'STOCK_ADDED':
        return <FaLayerGroup />;
      case 'SETTINGS_UPDATED':
        return <FaCog />;
      case 'BALANCE_REFUND':
        return <FaWallet />;
      default:
        return <FaShoppingBag />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'admin-icon-green';
      case 'ORDER_CREATED':
        return 'admin-icon-blue';
      case 'TICKET_SUBMITTED':
        return 'admin-icon-yellow';
      case 'PRODUCT_ADDED':
        return 'admin-icon-primary';
      case 'CATEGORY_CREATED':
        return 'admin-icon-purple';
      case 'STOCK_ADDED':
        return 'admin-icon-cyan';
      case 'SETTINGS_UPDATED':
        return 'admin-icon-orange';
      case 'BALANCE_REFUND':
        return 'admin-icon-red';
      default:
        return 'admin-icon-blue';
    }
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <div className={className}>
      {showDateFilter && (
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label htmlFor="dateFrom" className="block text-sm text-gray-400 mb-1">From</label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm text-gray-400 mb-1">To</label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2" data-testid="activity-log-list">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : data?.logs && data.logs.length > 0 ? (
          data.logs.map((log: ActivityLog) => (
            <div 
              key={log.id} 
              className="flex items-center p-3 bg-black/20 rounded-lg border border-gray-800 hover:bg-black/30 transition-colors cursor-help"
              title={log.user ? `Triggered by: ${log.user.name || log.user.email}` : 'System activity'}
              onClick={() => {
                if (log.user) {
                  alert(`Activity triggered by: ${log.user.name || log.user.email}`);
                }
              }}
            >
              <div className={`admin-icon ${getActivityColor(log.type)} w-10 h-10`}>
                {getActivityIcon(log.type)}
              </div>
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-white">{log.type.replace(/_/g, ' ')}</div>
                <div className="text-xs text-gray-400">{log.message}</div>
                {log.user && (
                  <div className="text-xs text-blue-400 mt-1 font-medium">
                    By: {log.user.name || log.user.email}
                  </div>
                )}
              </div>
              <div className="ml-auto text-xs text-gray-500" title={formatDate(log.createdAt)}>
                {formatTime(log.createdAt)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">No activity logs found</div>
        )}
      </div>
    </div>
  );
} 