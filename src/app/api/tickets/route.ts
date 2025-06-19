import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  orderId: z.string().optional() });

// Note: Rate limiting temporarily removed due to redis import issue.
// Will be re-implemented later.

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsedBody = createTicketSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const { subject, message, orderId } = parsedBody.data;

    // Check if orderId is empty string and set to null
    const finalOrderId = orderId && orderId.trim() !== "" ? orderId : null;

    // Optional: Validate that the orderId belongs to the user
    if (finalOrderId) {
        const order = await prisma.order.findFirst({
            where: {
                id: finalOrderId,
                userId: userId
            }
        });
        if (!order) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
        }
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: subject,
        userId: userId,
        orderId: finalOrderId,
        messages: {
          create: {
            content: message,
            userId: userId,
            isAdmin: false } } },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc" },
          take: 1 },
        order: true } });
    
    // Log the activity
    await logActivity({
      type: 'TICKET_SUBMITTED',
      message: `New ticket submitted: ${subject}`,
      userId: userId });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function GET() {
    try {
      const session = await getAuthSession();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userId = session.user.id;
  
      const tickets = await prisma.ticket.findMany({
        where: {
          userId },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc" } },
          order: true },
        orderBy: {
          updatedAt: "desc" } });
  
      return NextResponse.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      return NextResponse.json(
        { error: "An internal server error occurred." },
        { status: 500 }
      );
    }
  } 