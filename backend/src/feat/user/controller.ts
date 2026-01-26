import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class UserController {
    // 1. Profile Management
    // 1. Profile Management
    // 1. Profile Management
    static getMyProfile = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { password, ...safeUser } = user;

        res.json({
            success: true,
            ...safeUser, // Spread first to avoid overwriting warnings for id, email, etc.
            full_name: safeUser.name,
            avatar_url: safeUser.avatarUrl || safeUser.storeLogoUrl,
        });
    });

    // Admin Stats
    static getAdminStats = asyncHandler(async (req: Request, res: Response) => {
        const [superAdmins, sellers] = await Promise.all([
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.user.count({ where: { role: 'DEALER' } })
        ]);

        res.json({
            super_admins: superAdmins,
            sellers: sellers,
            support: 0 // Support role not defined in schema
        });
    });

    static getProfile = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Strip sensitive fields
        const { password, ...safeUser } = user;

        res.json({
            success: true,
            user: safeUser
        });
    });

    static updateProfile = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const updates = req.body;

        // Strip sensitive fields
        const { password, role, email, status, verificationStatus, ...safeUpdates } = updates;

        // Handle date transformation if dateOfBirth is provided
        if (safeUpdates.dateOfBirth) {
            const dob = new Date(safeUpdates.dateOfBirth);
            // If date is invalid, set to null instead of throwing error
            safeUpdates.dateOfBirth = isNaN(dob.getTime()) ? null : dob;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: safeUpdates,
        });

        const { password: _, ...userResponse } = updatedUser;

        res.json({
            success: true,
            user: userResponse
        });
    });

    // 2. Dealer Settings
    static getDealerSettings = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            settings: {
                storeName: user.storeName,
                storeDescription: user.storeDescription,
                storeLogoUrl: user.storeLogoUrl,
                storeBannerUrl: user.storeBannerUrl,
                gst: user.gst,
                pan: user.pan,
                bankAccount: user.bankAccount,
                ifsc: user.ifsc,
                beneficiaryName: user.beneficiaryName,
                vacationMode: user.vacationMode,
                autoConfirm: user.autoConfirm,
                returnPolicy: user.returnPolicy,
                metaTitle: user.metaTitle,
                metaDescription: user.metaDescription,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    });

    static updateDealerSettings = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const updates = req.body;

        // Filter valid dealer fields to prevent unauthorized privilege escalation
        const allowedFields = [
            'storeName', 'storeDescription', 'storeLogoUrl', 'storeBannerUrl',
            'gst', 'pan', 'bankAccount', 'ifsc', 'beneficiaryName',
            'vacationMode', 'autoConfirm', 'returnPolicy',
            'metaTitle', 'metaDescription', 'phone', 'address'
        ];

        const filteredUpdates: any = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: filteredUpdates,
        });

        res.json({
            success: true,
            settings: updatedUser
        });
    });

    // 3. Address Management
    static listAddresses = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        res.json(addresses);
    });

    static addAddress = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const data = req.body;

        return await prisma.$transaction(async (tx) => {
            if (data.isDefault) {
                await tx.address.updateMany({
                    where: { userId },
                    data: { isDefault: false }
                });
            }

            const address = await tx.address.create({
                data: {
                    ...data,
                    userId
                }
            });

            res.status(201).json(address);
        });
    });

    static updateAddress = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        return await prisma.$transaction(async (tx) => {
            if (updates.isDefault) {
                await tx.address.updateMany({
                    where: { userId },
                    data: { isDefault: false }
                });
            }

            const address = await tx.address.update({
                where: { id, userId },
                data: updates
            });

            res.json(address);
        });
    });

    static deleteAddress = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const { id } = req.params;

        await prisma.address.delete({
            where: { id, userId }
        });

        res.json({ success: true, message: 'Address deleted' });
    });

    // 4. Admin User Management
    static listUsers = asyncHandler(async (req: any, res: Response) => {
        const { role, status, searchQuery, skip, take } = req.query;
        const where: any = {};

        if (role) where.role = role;
        if (status) where.status = status;

        if (searchQuery) {
            where.OR = [
                { email: { contains: searchQuery as string } },
                { name: { contains: searchQuery as string } },
                { phone: { contains: searchQuery as string } }
            ];
        }

        const [users, count] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip: skip ? parseInt(skip as string) : 0,
                take: take ? parseInt(take as string) : 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                    verificationStatus: true,
                    createdAt: true,
                    phone: true,
                    storeName: true,
                    storeDescription: true,
                    storeLogoUrl: true,
                    pan: true,
                    bankAccount: true,
                    ifsc: true,
                    beneficiaryName: true
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            success: true,
            users,
            count
        });
    });

    static updateUserStatus = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { status }
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                status: user.status
            }
        });
    });

    static updateUserRole = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { role } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { role }
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                role: user.role
            }
        });
    });

    static verifySeller = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const { status, reason } = req.body; // status is 'approved' or 'rejected'

        const verificationStatus = status === 'approved' ? 'verified' : 'rejected';
        const userStatus = status === 'approved' ? 'active' : 'suspended';

        const user = await prisma.user.update({
            where: { id },
            data: {
                verificationStatus,
                status: userStatus,
                verificationComments: reason
            }
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                verificationStatus: user.verificationStatus,
                status: user.status
            }
        });
    });
}
