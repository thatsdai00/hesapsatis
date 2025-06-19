"use client";

import * as React from 'react';
import {useState} from 'react';
import { useParams } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {Ticket, User, Order, TicketStatus} from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { TicketHeader } from '@/components/tickets/TicketHeader';
import { MessageBubble } from '@/components/tickets/MessageBubble';
import Link from 'next/link';


// @TODO: Workaround for a persistent TypeScript/Prisma type resolution issue.
// The correct types (e.g., TicketMessage) were not being recognized by the linter.
// Using a more specific type definition until the Prisma types are properly resolved.
interface TicketMessage {
  id: string;
  content: string;
  createdAt: Date;
  ticketId: string;
  userId: string;
  isAdmin: boolean;
}

interface MessageUser {
  id: string;
  name: string | null;
  email: string | null;
}

type MessageWithUser = TicketMessage & {
  user: MessageUser;
};

type TicketDetails = Ticket & {
  messages: MessageWithUser[];
  user: Pick<User, 'name' | 'email' | 'balance'>;
  order: Order | null;
};

const replySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});
type ReplyFormValues = z.infer<typeof replySchema>;

const refundSchema = z.object({
    amount: z.coerce.number().positive('Amount must be positive.'),
});
type RefundFormValues = z.infer<typeof refundSchema>;

const statusOptions = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CLOSED', label: 'Closed' },
];

export default function AdminTicketDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [ticket, setTicket] = useState<TicketDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, reset, formState: { isSubmitting: isSubmittingReply } } = useForm<ReplyFormValues>({
        resolver: zodResolver(replySchema),
    });
    const { register: registerRefund, handleSubmit: handleSubmitRefund, reset: resetRefund, formState: { isSubmitting: isSubmittingRefund, errors: refundErrors } } = useForm<RefundFormValues>({
        resolver: zodResolver(refundSchema),
    });
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/tickets/${id}`);
            if (!res.ok) throw new Error(await res.json().then(d => d.error || 'Failed to fetch ticket'));
            setTicket(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (id) fetchTicket();
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    const handleReplySubmit: SubmitHandler<ReplyFormValues> = async (data) => {
        try {
            const res = await fetch(`/api/admin/tickets/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: data.message, isAdmin: true }),
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.error || 'Failed to post reply'));
            const newMsg = await res.json();
            setTicket(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null);
            reset();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };

    const handleRefundSubmit: SubmitHandler<RefundFormValues> = async (data) => {
        try {
            const res = await fetch(`/api/admin/tickets/${id}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: data.amount }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to process refund');
            }

            const { newStatus, newMessage } = await res.json();

            setTicket(prev => {
                if (!prev) return null;

                const newBalance = Number(prev.user.balance) + data.amount;

                return {
                    ...prev,
                    status: newStatus,
                    messages: [...prev.messages, newMessage],
                    // Cast to string to match the expected type
                    user: { ...prev.user, balance: newBalance.toString() },
                };
            });

            resetRefund();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while processing refund.');
        }
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as TicketStatus;
        setIsUpdatingStatus(true);
        try {
            const res = await fetch(`/api/admin/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error(await res.json().then(d => d.error || 'Failed to update status'));
            setTicket(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (loading) return <p className="text-gray-400">Loading ticket...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!ticket) return <p>Ticket not found.</p>;

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Main chat area */}
            <div className="lg:w-2/3">
                <TicketHeader ticket={ticket} />
                <div className="admin-card p-6">
                    <div className="space-y-6 h-[60vh] overflow-y-auto pr-4">
                        {ticket.messages.map((message) => <MessageBubble key={message.id} message={message} />)}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="mt-6 border-t border-gray-700 pt-6">
                        <form onSubmit={handleSubmit(handleReplySubmit)}>
                            <Textarea
                                {...register('message')}
                                placeholder="Write your reply as admin..."
                                rows={4}
                                className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="flex justify-end mt-4">
                                <Button type="submit" disabled={isSubmittingReply} className="admin-button-primary">
                                    {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-1/3 space-y-6">
                <div className="admin-card">
                    <h3 className="admin-card-header">Ticket Actions</h3>
                    <div className="p-6">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">Update Status</label>
                        <Select
                            id="status"
                            value={ticket.status}
                            onChange={handleStatusChange}
                            disabled={isUpdatingStatus}
                            options={statusOptions}
                            className="dashboard-input"
                        />
                    </div>
                </div>
                <div className="admin-card">
                    <h3 className="admin-card-header">User Information</h3>
                    <div className="p-6 space-y-3">
                        <div>
                            <p className="text-sm text-gray-400">Name</p>
                            <p className="text-white font-medium">{ticket.user.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Email</p>
                            <p className="text-white font-medium">{ticket.user.email}</p>
                        </div>
                         <div>
                            <p className="text-sm text-gray-400">Current Balance</p>
                            <p className="text-white font-medium">₺{Number(ticket.user.balance).toFixed(2)}</p>
                        </div>
                        {ticket.order && (
                           <div>
                                <p className="text-sm text-gray-400">Related Order</p>
                                <Link href={`/admin/orders/${ticket.order.id}`} className="text-blue-400 hover:underline">
                                    View Order #{ticket.order.id.substring(0,8)}
                                </Link>
                            </div>
                        )}
                    </div>
                    {ticket.status !== 'CLOSED' && (
                        <div className="p-6 border-t border-gray-700/50">
                             <h4 className="text-sm font-medium text-gray-300 mb-3">Refund Balance</h4>
                             <form onSubmit={handleSubmitRefund(handleRefundSubmit)} className="space-y-3">
                                 <Input
                                    type="number"
                                    step="0.01"
                                    {...registerRefund('amount')}
                                    placeholder="Refund amount"
                                    className="dashboard-input"
                                 />
                                 {refundErrors.amount && <p className="text-red-500 text-xs">{refundErrors.amount.message}</p>}
                                 <Button type="submit" disabled={isSubmittingRefund} className="admin-button-primary w-full">
                                     {isSubmittingRefund ? 'Processing...' : 'Process Refund'}
                                 </Button>
                             </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 