import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";
import { sendTicketRepliedEmail } from "@/lib/email";

const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]) });

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    const allowedRoles = ['ADMIN', 'MANAGER', 'SUPPORTER'];
    
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedBody = updateStatusSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.errors }, { status: 400 });
    }

    const { status } = parsedBody.data;

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: { status } });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error(`Error updating ticket ${params.id}:`, error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

const replySchema = z.object({
  message: z.string().min(1),
  isAdmin: z.boolean().optional() });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const parsedBody = replySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.errors }, { status: 400 });
    }

    const { message, isAdmin } = parsedBody.data;

    // Check if user can post as staff
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORTER'].includes(session.user.role);
    
    if (isAdmin && !isStaff) {
      return NextResponse.json({ error: "Only staff can post admin replies." }, { status: 403 });
    }

    // Get ticket details to access user information
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const newMessage = await prisma.ticketMessage.create({
      data: {
        content: message,
        ticketId: params.id,
        userId: session.user.id,
        isAdmin: isStaff ? true : false },
      include: {
        user: {
          select: { name: true, image: true } } } });

    // Also update ticket status to IN_PROGRESS if user replies
    if (!isAdmin) {
      await prisma.ticket.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' }
      });
    }

    // Send email notification if staff member replies
    if (isStaff && ticket.user.email) {
      await sendTicketRepliedEmail(
        ticket.user.email,
        ticket.user.name || 'Değerli Müşterimiz',
        ticket.title
      ).catch(error => {
        console.error('Failed to send ticket reply email:', error);
      });
    }

    return NextResponse.json(newMessage);

  } catch (error) {
    console.error(`Error creating message for ticket ${params.id}:`, error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    const allowedRoles = ['ADMIN', 'MANAGER', 'SUPPORTER'];
    
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { name: true, image: true } }
          }
        },
        user: {
          select: { name: true, email: true, balance: true }
        },
        order: true
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);

  } catch (error) {
    console.error(`Error fetching ticket ${params.id}:`, error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
} 