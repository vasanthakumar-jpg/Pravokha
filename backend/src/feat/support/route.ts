import { Router } from 'express';
import { SupportController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Public routes
router.post('/contact', SupportController.contactUs);

// User routes
router.post('/tickets', authenticate, SupportController.createTicket);
router.get('/tickets', authenticate, SupportController.listTickets);
router.get('/tickets/:id', authenticate, SupportController.getTicket);

// Conversations (User)
router.get('/conversations', authenticate, SupportController.listUserConversations);
router.post('/conversations', authenticate, SupportController.createConversation);

// Admin routes
router.get('/admin/tickets', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), SupportController.listAllTickets);
router.patch('/tickets/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), SupportController.updateStatus);

// Shared/Messaging routes
router.get('/tickets/:id/messages', authenticate, SupportController.getTicketMessages);
router.post('/tickets/:id/reply', authenticate, SupportController.replyToTicket);

// Conversation/Chat routes
router.get('/admin/conversations', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), SupportController.listConversations);
router.get('/conversations/:id/messages', authenticate, SupportController.getConversationMessages);
router.post('/conversations/:id/messages', authenticate, SupportController.sendConversationMessage);
router.patch('/conversations/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), SupportController.updateConversationStatus);

export default router;
