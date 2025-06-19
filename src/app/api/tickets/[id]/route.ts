import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true } } },
          orderBy: { createdAt: "asc" } },
        user: {
            select: {
                id: true,
                name: true,
                email: true,
                balance: true }
        },
        order: true } });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Authorize user
    if (session.user.role !== "ADMIN" && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getAuthSession();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const body = await req.json();
      const { message } = body;
      if (!message || typeof message !== "string") {
        return NextResponse.json({ error: "Message is required" }, { status: 400 });
      }
  
      const ticket = await prisma.ticket.findUnique({
        where: { id: params.id } });
  
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
  
      // Authorize user
      const isOwner = ticket.userId === session.user.id;
      const isAdmin = session.user.role === "ADMIN";
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
  
      const newMessage = await prisma.ticketMessage.create({
        data: {
          content: message,
          ticketId: params.id,
          userId: session.user.id,
          isAdmin: isAdmin },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true }
            }
        }
      });

      // Update ticket status if admin replies
      if(isAdmin && ticket.status === 'OPEN'){
        await prisma.ticket.update({
            where: {id: params.id},
            data: {
                status: 'IN_PROGRESS'
            }
        });
      }
  
      return NextResponse.json(newMessage);
    } catch (error) {
      console.error(`Error adding message to ticket ${params.id}:`, error);
      return NextResponse.json(
        { error: "An internal server error occurred." },
        { status: 500 }
      );
    }
  } 