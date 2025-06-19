'use client';

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Order, Product } from "@prisma/client";
import '../../app/dashboard.css';

interface NewTicketFormProps {
    onTicketCreated: () => void;
}

type OrderWithItems = Order & {
  orderItems: { product: Product }[];
};

const ticketSchema = z.object({
  subject: z.string().min(5, "Başlık en az 5 karakter uzunluğunda olmalıdır."),
  message: z.string().min(10, "Mesaj en az 10 karakter uzunluğunda olmalıdır."),
  orderId: z.string().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

const FormInput = ({ label, id, error, children }: { label: string, id: string, error?: { message?: string }, children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      {children}
      {error && <p className="text-sm text-red-500 mt-2">{error.message}</p>}
    </div>
);

export default function NewTicketForm({ onTicketCreated }: NewTicketFormProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) setOrders(await res.json());
      } catch (err) {
        console.error("Siparişler getirilemedi:", err);
      }
    };
    fetchOrders();
  }, []);

  const orderOptions = orders.flatMap(order => 
    order.orderItems.map(item => ({
        value: order.id,
        label: `${item.product.name} (Sipariş #${order.id.substring(0,8)})`
    }))
  );

  const onSubmit: SubmitHandler<TicketFormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Destek talebi oluşturulamadı");
      }
      onTicketCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="p-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md">{error}</div>}
        
        <FormInput label="Destek Talebi Başlığı" id="subject" error={errors.subject}>
            <Input id="subject" {...register("subject")} placeholder="örneğin, Siparişimle ilgili sorun" className="dashboard-input"/>
        </FormInput>

        <FormInput label="İlgili Ürün (İsteğe Bağlı)" id="orderId">
            <Select 
                {...register("orderId")}
                options={[{ value: "", label: "Bir ürün seçin (İsteğe Bağlı)" }, ...orderOptions]}
                className="dashboard-input"
            />
        </FormInput>

        <FormInput label="Detaylı Mesaj" id="message" error={errors.message}>
            <Textarea id="message" {...register("message")} rows={6} placeholder="Lütfen sorununuzu detaylı olarak açıklayın..." className="dashboard-input"/>
        </FormInput>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="dashboard-nav-button active">
                {isSubmitting ? "Gönderiliyor..." : "Destek Talebi Gönder"}
            </Button>
        </div>
    </form>
  );
} 