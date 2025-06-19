'use client';

import * as React from 'react';

import { useState } from 'react';

import ActivityLogList from '@/components/admin/ActivityLogList';


export default function ActivityLogsPage() {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  

  return (
    <div>
      <div className="admin-header">
        <h1>Activity Logs</h1>
        <p>Monitor all system activities</p>
      </div>
      
      <div className="admin-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="admin-title">All Activity</h2>
          
          <div className="flex flex-wrap gap-4">
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
        </div>
        
        <ActivityLogList 
          limit={50} 
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>
    </div>
  );
} 