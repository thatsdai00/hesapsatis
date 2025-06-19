import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthSession();
    
    // Check if user has appropriate role (ADMIN, MANAGER, or SUPPORTER)
    const allowedRoles = ['ADMIN', 'MANAGER', 'SUPPORTER'];
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.ticket.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true } },
        messages: {
            take: 1,
            orderBy: {
                createdAt: 'asc'
            }
        }
      },
      orderBy: {
        updatedAt: "desc" } });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets for admin:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
} 