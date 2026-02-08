import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '@prisma/client';

export class SupportController {
    static createTicket = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;
        const { type, subject, description, priority, evidenceUrls } = req.body;

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
                evidenceUrls: evidenceUrls || undefined,
            }
        });

        // Notify Admins
        try {
            const admins = await prisma.user.findMany({
                where: { role: Role.SUPER_ADMIN },
                select: { id: true }
            });

            if (admins.length > 0) {
                const notifications = admins.map(admin => ({
                    userId: admin.id,
                    title: 'New Support Ticket',
                    message: `A new ${type.replace('_', ' ')} ticket has been submitted: ${subject}`,
                    type: 'alert',
                    link: `/admin/support/tickets/${ticket.id}`
                }));

                await prisma.notification.createMany({
                    data: notifications
                });
            }
        } catch (error) {
            console.warn('Failed to notify admins regarding new ticket:', error);
        }

        res.status(201).json({ success: true, ticket });
    });

    static listTickets = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const tickets = await prisma.supportTicket.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, tickets });
    });

    static getTicket = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: { user: { select: { name: true, email: true } } }
        });
        if (!ticket || (ticket.userId !== user.id && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN)) {
            return res.status(404).json({ success: false, message: 'Ticket not found or access denied' });
        }
        res.json({ success: true, ticket });
    });

    static listAllTickets = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role === Role.CUSTOMER) return res.status(403).json({ success: false, message: 'Unauthorized' });

        const { isSuspendedSeller, page = '1', limit = '10', search, status, priority } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = {};
        if (isSuspendedSeller !== undefined) whereClause.isSuspendedSeller = isSuspendedSeller === 'true';
        if (status && status !== 'all') whereClause.status = status;
        if (priority && priority !== 'all') whereClause.priority = priority;

        if (search) {
            whereClause.OR = [
                { ticketNumber: { contains: search as string } }, // Removed mode: 'insensitive' as ticketNumber is likely exact match or uppercase
                { subject: { contains: search as string } }, // Removed mode: 'insensitive' if db is mysql standard collation, or add back if needed. Prisma mysql default is case insensitive usually.
                { user: { name: { contains: search as string } } },
                { user: { email: { contains: search as string } } }
            ];
        }

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where: whereClause,
                skip,
                take: limitNum,
                include: { user: { select: { name: true, email: true, status: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.supportTicket.count({ where: whereClause })
        ]);

        res.json({
            success: true,
            tickets,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
    });

    static updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role === Role.CUSTOMER) return res.status(403).json({ success: false, message: 'Unauthorized' });
        const { id } = req.params;
        const { status } = req.body;
        const ticket = await prisma.supportTicket.update({ where: { id }, data: { status } });
        res.json({ success: true, ticket });
    });

    static getTicketMessages = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        const ticket = await prisma.supportTicket.findUnique({ where: { id } });
        if (!ticket || (ticket.userId !== user.id && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN)) {
            return res.status(404).json({ success: false, message: 'Ticket not found or access denied' });
        }
        const messages = await prisma.ticketMessage.findMany({
            where: { ticketId: id, ...(user.role === Role.CUSTOMER ? { isInternal: false } : {}) },
            include: { sender: { select: { name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'asc' }
        });
        res.json({ success: true, messages });
    });

    static replyToTicket = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        const { message, isInternal } = req.body;
        const ticket = await prisma.supportTicket.findUnique({ where: { id } });
        if (!ticket || (ticket.userId !== user.id && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN)) {
            return res.status(404).json({ success: false, message: 'Ticket not found or access denied' });
        }
        const newMessage = await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: user.id,
                message,
                isInternal: user.role !== Role.CUSTOMER ? (isInternal || false) : false
            }
        });
        const newStatus = user.role !== Role.CUSTOMER ? 'AWAITING_USER' : 'UNDER_REVIEW';
        await prisma.supportTicket.update({ where: { id }, data: { status: newStatus, updatedAt: new Date() } });
        res.json({ success: true, message: newMessage });
    });

    static contactUs = asyncHandler(async (req: Request, res: Response) => {
        const { name, email, subject, message } = req.body;
        // Logic for contact form (e.g., storage or email)
        res.json({ success: true, message: 'Message received' });
    });

    // Chat Conversation Methods
    static listConversations = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role === Role.CUSTOMER) return res.status(403).json({ success: false, message: 'Unauthorized' });
        const conversations = await prisma.supportConversation.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { lastMessageAt: 'desc' }
        });
        res.json({ success: true, conversations });
    });

    static listUserConversations = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const conversations = await prisma.supportConversation.findMany({
            where: { userId: user.id },
            orderBy: { lastMessageAt: 'desc' }
        });
        res.json({ success: true, conversations });
    });

    static createConversation = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { subject } = req.body;
        const conversation = await prisma.supportConversation.create({
            data: { userId: user.id, subject: subject || 'No Subject' }
        });
        res.status(201).json({ success: true, conversation });
    });

    static getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        const conversation = await prisma.supportConversation.findUnique({ where: { id } });
        if (!conversation || (conversation.userId !== user.id && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN)) {
            return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
        }
        const messages = await prisma.supportMessage.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' }
        });
        res.json({ success: true, messages });
    });

    static sendConversationMessage = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        const { message } = req.body;
        const conversation = await prisma.supportConversation.findUnique({ where: { id } });
        if (!conversation || (conversation.userId !== user.id && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN)) {
            return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
        }
        const newMessage = await prisma.supportMessage.create({
            data: { conversationId: id, userId: user.id, message, isAdmin: user.role !== Role.CUSTOMER }
        });
        await prisma.supportConversation.update({ where: { id }, data: { lastMessageAt: new Date() } });
        res.json({ success: true, message: newMessage });
    });

    static updateConversationStatus = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        if (user.role === Role.CUSTOMER) return res.status(403).json({ success: false, message: 'Unauthorized' });
        const { id } = req.params;
        const { status } = req.body;
        const conversation = await prisma.supportConversation.update({ where: { id }, data: { status } });
        res.json({ success: true, conversation });
    });
}
