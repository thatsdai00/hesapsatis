'use client';

import * as React from 'react';
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function DashboardClient() {
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketSubject || !ticketMessage) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch('/api/tickets', { ... });
      
      toast.success('Support ticket created successfully');
      setIsCreatingTicket(false);
      setTicketSubject('');
      setTicketMessage('');
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error(error);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quick Support</h2>
        <button
          onClick={() => setIsCreatingTicket(!isCreatingTicket)}
          className="flex items-center text-sm bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded transition-colors"
        >
          {isCreatingTicket ? 'Cancel' : (
            <>
              <FaPlus className="mr-1" />
              New Ticket
            </>
          )}
        </button>
      </div>
      
      {isCreatingTicket ? (
        <div className="bg-card rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4">Create Support Ticket</h3>
          
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full rounded-md bg-input text-input-foreground border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary py-2 px-3"
                placeholder="What's your issue about?"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full rounded-md bg-input text-input-foreground border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary py-2 px-3"
                placeholder="Describe your issue in detail..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition-colors"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-card rounded-lg p-8 text-center shadow-md">
          <p className="text-gray-400 mb-4">
            Need help with your account or purchases? Create a support ticket and our team will assist you.
          </p>
          <button
            onClick={() => setIsCreatingTicket(true)}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition-colors"
          >
            Create Support Ticket
          </button>
        </div>
      )}
    </div>
  );
} 