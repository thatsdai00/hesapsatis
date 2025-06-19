'use client';

import React from 'react';
import { format } from 'date-fns';
import { FaUser, FaUserShield, FaCheckCircle } from 'react-icons/fa';

// @TODO: Workaround for a persistent TypeScript/Prisma type resolution issue.
// The correct types (e.g., TicketMessage) were not being recognized by the linter.
// Reverting to `any` to unblock functionality. This should be revisited.
type MessageWithUser = any;

export const MessageBubble = ({ message }: { message: MessageWithUser }) => {
    const isUser = !message.isAdmin;
    const isRefund = message.isRefund;
    
    let bubbleColor = isUser ? 'bg-blue-600/50' : 'bg-gray-700/50';
    if (isRefund) {
        bubbleColor = 'bg-green-600/30';
    }

    const alignment = isUser ? 'items-end' : 'items-start';
    const icon = isUser ? <FaUser size={18} className="text-white"/> : <FaUserShield size={18} className="text-blue-400"/>;
    const name = isUser ? 'Siz' : 'Destek Ekibi';
    const dateColor = isUser ? 'text-blue-200/80' : 'text-gray-400';

    return (
        <div className={`flex flex-col ${alignment}`}>
            <div className={`flex items-start gap-3`}>
                { !isUser && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">{icon}</div> }
                <div className={`rounded-lg p-4 max-w-lg ${bubbleColor} border ${isRefund ? 'border-green-500/50' : 'border-white/10'}`}>
                    {isRefund && (
                        <div className="flex items-center gap-2 mb-2 text-green-400">
                            <FaCheckCircle />
                            <span className="font-semibold text-sm">Bakiye İade Onayı</span>
                        </div>
                    )}
                    <p className="text-sm text-white">{message.content}</p>
                </div>
                { isUser && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">{icon}</div> }
            </div>
            <p className={`text-xs mt-2 ${dateColor} ${isUser ? 'mr-11': 'ml-11'}`}>
                {name} • {format(new Date(message.createdAt), 'Pp')}
            </p>
        </div>
    );
}; 