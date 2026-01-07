import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infra/database/client';
import { config } from '../../core/config/env';
import { User } from '@prisma/client';

export class AuthService {
    static async register(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw { statusCode: 400, message: 'Email already exists' };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });

        const token = this.generateToken(user);
        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    }

    static async login(data: Pick<User, 'email' | 'password'>) {
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

    private static generateToken(user: Pick<User, 'id' | 'role'>) {
        return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1d' });
    }
}
