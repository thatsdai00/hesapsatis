"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ticket, TicketStatus } from "@prisma/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { FaTicketAlt, FaPlus } from 'react-icons/fa';
import '../../dashboard.css'; // Reusing dashboard styles
import Modal from "@/components/ui/Modal";
import NewTicketForm from '@/components/dashboard/NewTicketForm';

type TicketWithRelations = Ticket & {
    messages: { content: string }[];
    subject: string;
}

const allStatuses = ["OPEN", "IN_PROGRESS", "CLOSED", "PENDING"] as const;
type AllStatus = typeof allStatuses[number];

const TicketStatusBadge = ({ status }: { status: TicketStatus }) => {
    const statusStyles: { [key in AllStatus]: string } = {
        OPEN: "bg-green-500/20 text-green-400 border-green-500/30",
        IN_PROGRESS: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        CLOSED: "bg-red-500/20 text-red-400 border-red-500/30",
        PENDING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };

    const statusTranslations: { [key in AllStatus]: string } = {
        OPEN: "Açık",
        IN_PROGRESS: "İşlemde",
        CLOSED: "Kapalı",
        PENDING: "Beklemede",
    };

    const classes = statusStyles[status as AllStatus] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${classes}`}>
        {statusTranslations[status as AllStatus] || status}
      </span>
    );
};

export default function SupportPage() {
    const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/tickets");
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Destek talepleri getirilemedi");
            }
            const data = await res.json();
            setTickets(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleTicketCreated = () => {
        setIsModalOpen(false);
        fetchTickets(); // Refresh the ticket list
    }

    return (
      <div className="space-y-8">
        <div className="dashboard-header">
          <h1>Destek Taleplerim</h1>
        </div>

        <div className="flex justify-end">
             <Button onClick={() => setIsModalOpen(true)} className="dashboard-nav-button active">
                <FaPlus className="mr-2"/> Yeni Destek Talebi Oluştur
             </Button>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Destek Talebi Oluştur">
            <NewTicketForm onTicketCreated={handleTicketCreated} />
        </Modal>
 
        {loading && <p className="text-gray-400">Destek talepleri yükleniyor...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && tickets.length === 0 && (
            <div className="dashboard-card items-center justify-center text-center py-16">
                 <FaTicketAlt size={48} className="text-gray-600 mb-4" />
                 <h4 className="text-xl font-semibold text-white">Hiç destek talebi bulunamadı.</h4>
                 <p className="text-gray-400">Başlamak için yeni bir destek talebi oluşturun.</p>
             </div>
        )}
 
        {!loading && !error && tickets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => (
                    <Link href={`/dashboard/tickets/${ticket.id}`} key={ticket.id} className="dashboard-card h-full flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <p className="font-bold text-lg text-white">{ticket.subject}</p>
                                <TicketStatusBadge status={ticket.status} />
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2">
                                {ticket.messages[0]?.content || 'Mesaj içeriği yok'}
                            </p>
                        </div>
                        <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-white/10">
                            Son güncelleme: {format(new Date(ticket.updatedAt), "dd MMM yyyy", { locale: tr })}
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    );
} 