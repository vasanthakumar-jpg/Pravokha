import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
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
import returnRoutes from '../feat/return/route';
import { WebhookController } from '../feat/webhook/controller';
import { registerMarketplaceListeners } from '../shared/listeners/marketplace.listeners';

const app = express();

// Register Marketplace Event Listeners
registerMarketplaceListeners();

// Security & Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// PRODUCTION-READY CORS Configuration
// In development/test allow any origin to simplify local frontend integration
if (config.nodeEnv === 'production') {
    app.use(cors({
        origin: config.frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range']
    }));
} else {
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range']
    }));
}

app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../../../uploads'), {
    setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Rate Limiting - General
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5000,
});

// Rate Limiting - Authentication (Prevent Brute Force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // Only 5 login/register attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiting - High Security (Password Resets, Sensitive Auth)
const securityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 3, // Only 3 attempts per 15 minutes
    message: 'Too many security-sensitive requests. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 50, // 50 attempts per hour for payments
    message: 'Too many payment attempts, please try again later'
});

const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 checkouts per 15 mins
    message: 'Too many checkout attempts, please try again later'
});

app.use(limiter);

// Webhook endpoint (MUST be before express.json())
app.post('/api/webhook/razorpay', express.raw({ type: 'application/json' }), WebhookController.handleRazorpayWebhook);

// Body Parsers
app.use(express.json());

// Routes
app.get('/api/orders/:id/history', (req, res, next) => next()); // Specific exclusion if needed, but the move below is better
app.use('/api/payments', paymentLimiter);
app.post('/api/orders', checkoutLimiter);
app.get('/', (req, res) => {
    res.send('Pravokha Backend is running securely.');
});

// Apply auth rate limiter to authentication endpoints (skip in tests)
if (config.nodeEnv !== 'test') {
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/auth/password-reset', securityLimiter);
    app.use('/api/auth/reset-password', securityLimiter);
}

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
app.use('/api/returns', returnRoutes);
app.use('/api/combo-offers', comboOfferRoutes);

// Error Handling
app.use(errorHandler);

export default app;
