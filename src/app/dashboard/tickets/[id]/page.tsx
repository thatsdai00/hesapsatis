"use client";

import * as React from 'react';
import {useState} from 'react';
import { useParams } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ticket, User, Order } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TicketHeader } from '@/components/tickets/TicketHeader';
import { MessageBubble } from '@/components/tickets/MessageBubble';
import '../../../dashboard.css';

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
  user: Pick<User, 'name' | 'email'>;
  order: Order | null;
};

const replySchema = z.object({
  message: z.string().min(1, 'Mesaj boş olamaz.'),
});
type ReplyFormValues = z.infer<typeof replySchema>;

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (id) {
      const fetchTicket = async () => {
        try { setLoading(true);
          const res = await fetch(`/api/tickets/${id}`);
          if (!res.ok) throw new Error(await res.json().then(d => d.error || 'Destek talebi getirilemedi'));
          setTicket(await res.json());
        } catch (err) { setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
        } finally { setLoading(false); }
      };
      fetchTicket();
    }
  }, [id]);

  useEffect(() => { scrollToBottom(); }, [ticket?.messages]);

  const onSubmit: SubmitHandler<ReplyFormValues> = async (data) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.json().then(d => d.error || 'Yanıt gönderilemedi'));
      const newMsg = await res.json();
      setTicket(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null);
      reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'); }
  };

  if (loading) return <p className="text-gray-400">Destek talebi yükleniyor...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!ticket) return <p>Destek talebi bulunamadı.</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <TicketHeader ticket={ticket} />
      <div className="dashboard-card p-6">
        <div className="space-y-6 h-[50vh] overflow-y-auto pr-4">
            {ticket.messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            <div ref={messagesEndRef} />
        </div>
        <div className="mt-6 border-t border-white/10 pt-6">
            {ticket.status === 'CLOSED' ? (
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400">Bu talep kapanmıştır. Yeni mesaj gönderemezsiniz.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Textarea
                        {...register('message')}
                        placeholder="Yanıtınızı yazın..."
                        rows={4}
                        className="bg-black/20 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex justify-end mt-4">
                        <Button type="submit" disabled={isSubmitting} className="dashboard-nav-button active">
                            {isSubmitting ? 'Gönderiliyor...' : 'Yanıt Gönder'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
} 