import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

const refundSchema = z.object({
    amount: z.number().positive(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getAuthSession();
        
        // Allow ADMIN, MANAGER, and SUPPORTER roles to process refunds
        const allowedRoles = ['ADMIN', 'MANAGER', 'SUPPORTER'];
        if (!session?.user || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ 
                error: "Unauthorized - Only staff members can process refunds" 
            }, { status: 401 });
        }

        const ticketId = params.id;
        
        // Safely parse the request body
        let body;
        try {
            body = await req.json();
        } catch (error) {
            return NextResponse.json({ 
                error: "Invalid JSON in request body" 
            }, { status: 400 });
        }
        
        // Validate the request data
        let amount;
        try {
            const parsed = refundSchema.parse(body);
            amount = parsed.amount;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json({ 
                    error: "Invalid request data",
                    details: error.errors
                }, { status: 422 });
            }
            return NextResponse.json({ 
                error: "Invalid request data" 
            }, { status: 400 });
        }

        // Find the ticket
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { user: true },
        });

        if (!ticket) {
            return NextResponse.json({ 
                error: "Ticket not found" 
            }, { status: 404 });
        }

        if (ticket.status === 'CLOSED') {
            return NextResponse.json({ 
                error: "Ticket is already closed" 
            }, { status: 400 });
        }

        const refundMessage = `Yaşadığınız sorun ile ilgili incelemelerimiz sonucunda ${amount.toFixed(2)} TL tutarında iade hesabınıza bakiye olarak tanımlandı. Bizi tercih ettiğiniz için teşekkürler!`;

        try {
            const [updatedUser, updatedTicket, newMessage] = await prisma.$transaction([
                prisma.user.update({
                    where: { id: ticket.userId },
                    data: {
                        balance: {
                            increment: amount,
                        },
                    },
                }),
                prisma.ticket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'CLOSED',
                    }
                }),
                (prisma as any).ticketMessage.create({
                    data: {
                        content: refundMessage,
                        ticketId: ticketId,
                        userId: session.user.id,
                        isAdmin: true,
                        isRefund: true,
                    }
                })
            ]);

            // The transaction returns results in order. We want to get the updated message to send back to the client.
            // We need to fetch it with user details.
            const returnedMessage = await (prisma as any).ticketMessage.findUnique({
                where: { id: newMessage.id },
                include: {
                    user: {
                        select: {
                            name: true,
                            image: true,
                        }
                    }
                }
            });
            
            // Log the activity
            logActivity({
                type: 'BALANCE_REFUND',
                message: `Refunded ${amount.toFixed(2)} TL to user ${ticket.user.name || ticket.user.email} for ticket #${ticketId}`,
                userId: session.user.id,
            }).catch(error => {
                console.error('Failed to log balance refund activity:', error);
            });

            return NextResponse.json({
                newStatus: 'CLOSED',
                newMessage: returnedMessage,
            });
        } catch (error) {
            console.error("[TICKET_REFUND_TRANSACTION_ERROR]", error);
            return NextResponse.json({ 
                error: "Failed to process refund transaction" 
            }, { status: 500 });
        }

    } catch (error) {
        console.error("[TICKET_REFUND_POST]", error);
        return NextResponse.json({ 
            error: "Internal Server Error" 
        }, { status: 500 });
    }
} 