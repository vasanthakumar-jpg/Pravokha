import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../shared/middleware/error';
import authRoutes from '../feat/auth/route';
import productRoutes from '../feat/product/route';
import orderRoutes from '../feat/order/route';
import notificationRoutes from '../feat/notification/route';
import userRoutes from '../feat/user/route';
import supportRoutes from '../feat/support/route';
import adminRoutes from '../feat/admin/route';
import paymentRoutes from '../feat/payment/route';
import payoutRoutes from '../feat/payout/route';
import auditRoutes from '../feat/audit/route';
import categoryRoutes from '../feat/category/route';
import uploadRoutes from '../feat/upload/route';
import wishlistRoutes from '../feat/wishlist/route';
import reviewRoutes from '../feat/review/route';
import newsletterRoutes from '../feat/newsletter/route';
import homeRoutes from '../feat/home/route';
import analyticsRoutes from '../feat/analytics/route';
import reportRoutes from '../feat/report/route';
import comboOfferRoutes from '../feat/combo-offer/route';
import emailRoutes from '../feat/email/route';
import { WebhookController } from '../feat/webhook/controller';

const app = express();

// Security & Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../../../uploads'), {
    setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Increased limit for dev/staging
});
app.use(limiter);

// Webhook endpoint (MUST be before express.json())
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), WebhookController.handleStripeWebhook);

// Body Parsers
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Pravokha Backend is running securely.');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/combo-offers', comboOfferRoutes);

// Error Handling
app.use(errorHandler);

export default app;
