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

        let hashedPassword = null;
        if (data.password) {
            hashedPassword = await bcrypt.hash(data.password as string, 10);
        }

        const user = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });

        const token = this.generateToken(user as any);
        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    }

    static async login(data: Pick<User, 'email' | 'password'>) {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        if (!user.password) {
            throw { statusCode: 401, message: 'This account uses SSO. Please login with Google.' };
        }

        if (!data.password) {
            throw { statusCode: 400, message: 'Password is required' };
        }

        const isMatch = await bcrypt.compare(data.password as string, user.password as string);
        if (!isMatch) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        const token = this.generateToken(user);
        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
    }

    static async googleLogin(googleData: { googleId: string, email: string | null | undefined, name?: string | null, picture?: string | null }) {
        const { googleId, email, name, picture } = googleData;

        if (!email) {
            throw { statusCode: 400, message: 'Email is required from Google' };
        }

        // 1. Find user by googleId
        let user = await prisma.user.findUnique({ where: { googleId } });

        if (!user) {
            // 2. If not found by googleId, check if email exists
            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
                // Link account if email matches
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId }
                });
            } else {
                // 3. Create new user
                user = await prisma.user.create({
                    data: {
                        email,
                        name: name || email.split('@')[0],
                        googleId,
                        avatarUrl: picture,
                        role: 'CUSTOMER',
                        status: 'active',
                    }
                });
            }
        }

        const token = this.generateToken(user as any);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl
            },
            token
        };
    }

    static async changePassword(userId: string, data: { currentPassword: string, newPassword: string }) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.password) {
            throw { statusCode: 404, message: 'User not found or uses SSO' };
        }

        const isMatch = await bcrypt.compare(data.currentPassword, user.password);
        if (!isMatch) {
            throw { statusCode: 401, message: 'Incorrect current password' };
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return { success: true };
    }

    static async generateResetToken(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Security Best Practice: Don't reveal if user exists
            return { success: true, message: 'If an account exists, a reset link will be sent.' };
        }

        if (!user.password && user.googleId) {
            return { success: false, message: 'This account uses Google Social Login. Please login via Google.' };
        }

        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpires: expires
            }
        });

        // Send Email
        const { EmailService } = await import('../../shared/service/email.service');
        const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;

        await EmailService.sendEmail({
            to: email,
            subject: 'Password Reset Request',
            template: 'passwordReset', // Ensure this template exists
            variables: {
                name: user.name,
                resetLink
            }
        }).catch(e => console.error('[AuthService] Reset email failed:', e));

        return { success: true, message: 'Password reset link sent to your email.' };
    }

    static async resetPassword(data: { token: string, newPassword: string }) {
        const user = await prisma.user.findFirst({
            where: {
                resetToken: data.token,
                resetTokenExpires: { gte: new Date() }
            }
        });

        if (!user) {
            throw { statusCode: 400, message: 'Invalid or expired reset token' };
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            }
        });

        return { success: true, message: 'Password updated successfully' };
    }

    private static generateToken(user: Pick<User, 'id' | 'role'>) {
        return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1d' });
    }
}
