import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { config } from '../config/env';

export class AuthService {
    static async register(data: any) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw { statusCode: 400, message: 'Email already exists' };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
                // Default to DEALER if not provided or force via admin logic (kept simple here)
            },
        });

        const token = this.generateToken(user);
        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    }

    static async login(data: any) {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        const token = this.generateToken(user);
        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    }

    private static generateToken(user: any) {
        return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1d' });
    }
}
