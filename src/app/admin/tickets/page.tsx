"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Ticket, User, TicketMessage } from '@prisma/client';
import { format } from 'date-fns';
import { FaEye, FaTicketAlt, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { TicketFilter, TicketStatus } from '@/components/admin/TicketFilter';

type TicketForAdminList = Ticket & {
  user: Pick<User, 'name' | 'email'>;
  messages: Pick<TicketMessage, 'content'>[];
};

const TicketStatusBadge = ({ status }: { status: string }) => {
    const statusClasses = {
      OPEN: "admin-badge-success",
      CLOSED: "admin-badge-danger",
    };
    const classes = statusClasses[status as keyof typeof statusClasses] || "admin-badge-secondary";
  
    return (
      <span className={`admin-badge ${classes}`}>
        {status.replace("_", " ")}
      </span>
    );
};

// Summary card component for ticket statistics
const TicketSummaryCard = ({ 
  title, 
  count, 
  icon: Icon,
  color
}: { 
  title: string; 
  count: number; 
  icon: React.ElementType;
  color: string;
}) => (
  <div className="admin-stats-card flex-1 min-w-[200px]">
    <div className="flex items-center">
      <div className={`admin-icon ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="admin-title">{title}</div>
        <div className="admin-value">{count}</div>
      </div>
    </div>
  </div>
);

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketForAdminList[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketForAdminList[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate status counts for the filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<TicketStatus, number> = {
      ALL: tickets.length,
      OPEN: 0,
      CLOSED: 0
    };

    tickets.forEach(ticket => {
      const status = ticket.status as TicketStatus;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  }, [tickets]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/admin/tickets');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch tickets');
        }
        const data = await res.json();
        setTickets(data);
        setFilteredTickets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Filter tickets when status changes
  useEffect(() => {
    if (selectedStatus === 'ALL') {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter(ticket => ticket.status === selectedStatus));
    }
  }, [selectedStatus, tickets]);

  const handleStatusChange = (status: TicketStatus) => {
    setSelectedStatus(status);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
        <div className="admin-header">
            <h1>Support Tickets</h1>
            <p>Manage user support requests and issues</p>
        </div>

        {/* Ticket Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <TicketSummaryCard 
            title="Total Tickets" 
            count={statusCounts.ALL} 
            icon={FaTicketAlt}
            color="admin-icon-primary" 
          />
          <TicketSummaryCard 
            title="Open" 
            count={statusCounts.OPEN} 
            icon={FaExclamationCircle}
            color="admin-icon-green" 
          />
          <TicketSummaryCard 
            title="Closed" 
            count={statusCounts.CLOSED} 
            icon={FaCheckCircle}
            color="admin-icon-red" 
          />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-200">Filter by Status</h2>
          <TicketFilter 
            selectedStatus={selectedStatus} 
            onStatusChange={handleStatusChange} 
            showAsButtons={true}
            statusCounts={statusCounts}
            totalCount={tickets.length}
          />
        </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                        <div className="font-medium">{ticket.user.name}</div>
                        <div className="text-sm text-gray-400">{ticket.user.email}</div>
                    </td>
                    <td>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{ticket.messages[0]?.content}</div>
                    </td>
                    <td>
                        <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td className="text-sm text-gray-400">
                      {format(new Date(ticket.updatedAt), 'dd MMM yyyy, p')}
                    </td>
                    <td className="actions-column">
                      <Link href={`/admin/tickets/${ticket.id}`} className="admin-action-button">
                        <FaEye />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    No tickets found with the selected status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 