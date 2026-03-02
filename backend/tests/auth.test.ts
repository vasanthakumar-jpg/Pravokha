import request from 'supertest';
import app from '../src/core/app';
import { prisma } from '../src/infra/database/client';

// Mock Prisma
jest.mock('../src/infra/database/client', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

describe('Auth API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                password: 'hashedpassword',
                name: 'Test User',
                role: 'DEALER',
            });

            const res = await request(app).post('/api/auth/register').send({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('should fail if email exists', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });

            const res = await request(app).post('/api/auth/register').send({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email already exists');
        });
    });
});
