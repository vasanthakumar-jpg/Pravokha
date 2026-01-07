import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().transform(Number).default('5000'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET should be a secure 32+ character string for production'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
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
};
