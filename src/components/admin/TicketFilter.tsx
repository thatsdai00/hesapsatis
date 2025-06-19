import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export type TicketStatus = 'ALL' | 'OPEN' | 'CLOSED';

interface TicketFilterProps {
  selectedStatus: TicketStatus;
  onStatusChange: (status: TicketStatus) => void;
  showAsButtons?: boolean;
  statusCounts?: Record<TicketStatus, number>;
  totalCount?: number;
}

export const TicketFilter: React.FC<TicketFilterProps> = ({
  selectedStatus,
  onStatusChange,
  showAsButtons = true,
  statusCounts = {},
  totalCount = 0
}) => {
  const statuses: { value: TicketStatus; label: string }[] = [
    { value: 'ALL', label: 'All Tickets' },
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' }
  ];
  
  // Responsive state to switch between buttons and dropdown
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Use buttons on larger screens, dropdown on smaller screens
  const shouldUseButtons = showAsButtons && !isSmallScreen;

  if (shouldUseButtons) {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map((status) => {
          const count = status.value === 'ALL' 
            ? totalCount 
            : statusCounts[status.value] || 0;
            
          return (
            <Button
              key={status.value}
              variant={selectedStatus === status.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(status.value)}
              className={`
                ${selectedStatus === status.value ? 'shadow-md scale-105' : 'hover:bg-gray-800/10 hover:scale-105'}
                transition-all duration-300 ease-in-out relative
                ${selectedStatus === status.value ? 'after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-0.5 after:bg-primary/50 after:rounded-full' : ''}
              `}
            >
              {status.label}
              {count > 0 && (
                <Badge 
                  className={`ml-2 ${
                    selectedStatus === status.value 
                      ? 'bg-white text-primary animate-pulse' 
                      : 'bg-primary/20 text-white'
                  } transition-all duration-300`}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-4 w-full sm:w-64">
      <Select
        options={statuses.map(status => ({
          value: status.value,
          label: `${status.label} ${
            status.value === 'ALL' 
              ? totalCount > 0 ? `(${totalCount})` : '' 
              : (statusCounts[status.value] || 0) > 0 ? `(${statusCounts[status.value] || 0})` : ''
          }`
        }))}
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value as TicketStatus)}
        className="admin-input transition-all duration-300 hover:border-primary focus:border-primary"
      />
    </div>
  );
}; 