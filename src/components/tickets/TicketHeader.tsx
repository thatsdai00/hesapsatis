'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Ticket, Order, User } from '@prisma/client';

type TicketDetails = Ticket & {
  user: Pick<User, 'name' | 'email'>;
  order: Order | null;
  title: string;
};

export const TicketHeader = ({ ticket }: { ticket: TicketDetails }) => (
    <div className="dashboard-card p-6 mb-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-white">{ticket.title}</h1>
                <p className="text-sm text-gray-400">
                    {format(new Date(ticket.createdAt), 'PPP')} tarihinde açıldı
                </p>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border bg-gray-500/20 text-gray-400 border-gray-500/30`}>
                {ticket.status.replace("_", " ")}
            </span>
        </div>
        {ticket.order && (
            <div className="text-sm border-t border-white/10 pt-4 mt-4">
                <p className="text-gray-300">
                    İlgili Sipariş: <Link href={`/dashboard/orders/${ticket.order.id}`} className="text-blue-400 hover:underline">#{ticket.order.id.substring(0,8)}</Link>
                </p>
            </div>
        )}
    </div>
); 