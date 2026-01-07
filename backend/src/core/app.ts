import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../shared/middleware/error';
import authRoutes from '../feat/auth/route';
import productRoutes from '../feat/product/route';

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per 15 minutes
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
    res.send('Pravokha Backend is running securely.');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Error Handling
app.use(errorHandler);

export default app;
