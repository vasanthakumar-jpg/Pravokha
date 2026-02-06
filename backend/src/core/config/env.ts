import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().transform(Number).default('5000'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET should be a secure 32+ character string for production'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
    EMAIL_HOST: z.string(),
    EMAIL_PORT: z.string().transform(Number),
    EMAIL_USER: z.string().email(),
    EMAIL_PASS: z.string(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder'),
    RAZORPAY_KEY_SECRET: z.string().default('placeholder'),
    RAZORPAY_WEBHOOK_SECRET: z.string().default('placeholder'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    process.exit(1);
}

export const env = _env.data;

export const config = {
    port: env.PORT,
    jwtSecret: env.JWT_SECRET,
    nodeEnv: env.NODE_ENV,
    email: {
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
    google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    razorpay: {
        keyId: env.RAZORPAY_KEY_ID,
        keySecret: env.RAZORPAY_KEY_SECRET,
        webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    },
};
