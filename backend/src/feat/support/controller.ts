import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class SupportController {
    static createTicket = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { type, subject, description, priority, evidenceUrls } = req.body;

        // Generate Ticket Number
        const count = await prisma.supportTicket.count();
        const ticketNumber = `TK-${(count + 1000).toString()}`;

        const ticket = await prisma.supportTicket.create({
            data: {
                ticketNumber,
                userId,
                type,
                subject,
                description,
                priority: priority || 'medium',
                evidenceUrls: evidenceUrls || [],
            }
        });

        // Notify Admins
        try {
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            });

            if (admins.length > 0) {
                const notifications = admins.map(admin => ({
                    userId: admin.id,
                    title: 'New Support Ticket',
                    message: `A new ${type.replace('_', ' ')} ticket has been submitted: ${subject}`,
                    type: 'alert',
                    // Note: Front-end will handle the link
                }));

                await prisma.notification.createMany({
                    data: notifications
                });
            }
        } catch (error) {
            console.warn('Failed to notify admins regarding new ticket:', error);
        }

        res.status(201).json({
            success: true,
            ticket
        });
    });

    static listTickets = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const tickets = await prisma.supportTicket.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            tickets
        });
    });

    static getTicket = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        });

        if (!ticket || (ticket.userId !== userId && req.user.role !== 'ADMIN')) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        res.json({
            success: true,
            ticket
        });
    });

    static listAllTickets = asyncHandler(async (req: any, res: Response) => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { isSuspendedSeller } = req.query;

        const tickets = await prisma.supportTicket.findMany({
            where: isSuspendedSeller !== undefined ? {
                isSuspendedSeller: isSuspendedSeller === 'true'
            } : {},
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            tickets
        });
    });

    static getTicketMessages = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        });

        if (!ticket || (ticket.userId !== userId && req.user.role !== 'ADMIN')) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const messages = await prisma.ticketMessage.findMany({
            where: { ticketId: id },
            include: {
                sender: {
                    select: {
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Mark external messages as read for the current user if they are the ticket owner or admin
        const otherMessages = messages.filter(m => m.senderId !== userId && !m.isRead);
        if (otherMessages.length > 0) {
            await prisma.ticketMessage.updateMany({
                where: { id: { in: otherMessages.map(m => m.id) } },
                data: { isRead: true }
            });
        }

        res.json({
            success: true,
            messages
        });
    });

    static replyToTicket = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;
        const { message, isInternal } = req.body;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        });

        if (!ticket || (ticket.userId !== userId && req.user.role !== 'ADMIN')) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const newMessage = await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: userId,
                message,
                isInternal: isInternal || false
            }
        });

        // Update ticket status
        const newStatus = req.user.role === 'ADMIN' ? 'awaiting_user' : 'under_review';
        await prisma.supportTicket.update({
            where: { id },
            data: {
                status: newStatus,
                updatedAt: new Date()
            }
        });

        // Notify recipient
        if (req.user.role === 'ADMIN') {
            await prisma.notification.create({
                data: {
                    userId: ticket.userId,
                    title: 'Official support update',
                    message: `The Pravokha registry has issued a new response regarding "${ticket.subject}".`,
                    type: 'info'
                }
            });
        }

        res.json({
            success: true,
            message: newMessage
        });
    });

    static updateStatus = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: { status }
        });

        res.json({
            success: true,
            ticket
        });
    });

    // Chat Conversation Methods
    static listConversations = asyncHandler(async (req: any, res: Response) => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const conversations = await prisma.supportConversation.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        res.json({
            success: true,
            conversations
        });
    });

    static listUserConversations = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;

        const conversations = await prisma.supportConversation.findMany({
            where: { userId },
            orderBy: { lastMessageAt: 'desc' }
        });

        res.json({
            success: true,
            conversations
        });
    });

    static createConversation = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { subject } = req.body;

        const conversation = await prisma.supportConversation.create({
            data: {
                userId,
                subject: subject || 'No Subject',
            }
        });

        res.status(201).json({
            success: true,
            conversation
        });
    });

    static getConversationMessages = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;

        const conversation = await prisma.supportConversation.findUnique({
            where: { id },
        });

        if (!conversation || (conversation.userId !== userId && req.user.role !== 'ADMIN')) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const messages = await prisma.supportMessage.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' }
        });

        res.json({
            success: true,
            messages
        });
    });

    static sendConversationMessage = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;
        const { message } = req.body;

        const conversation = await prisma.supportConversation.findUnique({
            where: { id },
        });

        if (!conversation || (conversation.userId !== userId && req.user.role !== 'ADMIN')) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const newMessage = await prisma.supportMessage.create({
            data: {
                conversationId: id,
                userId: userId, // Use the sender's ID
                message,
                isAdmin: req.user.role === 'ADMIN'
            }
        });

        // Update conversation lastMessageAt
        await prisma.supportConversation.update({
            where: { id },
            data: { lastMessageAt: new Date() }
        });

        res.json({
            success: true,
            message: newMessage
        });
    });

    static updateConversationStatus = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const conversation = await prisma.supportConversation.update({
            where: { id },
            data: { status }
        });

        res.json({
            success: true,
            conversation
        });
    });
}
