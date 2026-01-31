import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

export class UserController {
    // 1. Profile Management
    // 1. Profile Management
    static getMyProfile = asyncHandler(async (req: any, res: Response) => {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, phone: true, address: true,
                avatarUrl: true, bio: true, dateOfBirth: true, role: true,
                status: true, verificationStatus: true, verificationComments: true,
                storeName: true, storeDescription: true, storeLogoUrl: true,
                storeBannerUrl: true, gst: true, pan: true, bankAccount: true,
                ifsc: true, beneficiaryName: true, vacationMode: true, autoConfirm: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                ...user,
                full_name: user.name,
                avatar_url: user.avatarUrl || user.storeLogoUrl,
                date_of_birth: user.dateOfBirth,
            }
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

    static getProfile = asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const requester = req.user;

        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // SECURITY: If not Admin and not Owner, strip PII (PAN, Bank, Email, Phone, etc.)
        if (requester.role !== 'ADMIN' && requester.id !== user.id) {
            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    storeName: user.storeName,
                    storeDescription: user.storeDescription,
                    storeLogoUrl: user.storeLogoUrl,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                    verificationStatus: user.verificationStatus
                }
            });
        }

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
        let { password, role, email, status, verificationStatus, ...safeUpdates } = updates;

        // Map snake_case to camelCase for Prisma
        if (updates.full_name !== undefined) {
            safeUpdates.name = updates.full_name;
        }
        if (updates.avatar_url !== undefined) {
            safeUpdates.avatarUrl = updates.avatar_url;
        }
        if (updates.date_of_birth !== undefined) {
            safeUpdates.dateOfBirth = updates.date_of_birth;
        }

        // CRITICAL: Strict dateOfBirth transformation with validation
        const dobValue = safeUpdates.dateOfBirth;
        if (dobValue !== undefined) {
            console.log('[UserController] Processing DOB - Received value:', dobValue, 'Type:', typeof dobValue);

            // Handle null or empty string
            if (dobValue === "" || dobValue === null) {
                safeUpdates.dateOfBirth = null;
                console.log('[UserController] DOB set to null (empty/null input)');
            } else {
                // Validate and transform
                const dob = new Date(dobValue);

                // Check if date is valid
                if (isNaN(dob.getTime())) {
                    console.error('[UserController] INVALID DOB FORMAT:', dobValue);
                    throw new Error(`Invalid date format for date_of_birth: ${dobValue}`);
                }

                safeUpdates.dateOfBirth = dob;
                console.log('[UserController] DOB validated and transformed to:', safeUpdates.dateOfBirth.toISOString());
            }
        }

        // Remove legacy snake_case keys from safeUpdates if they were added via spread
        delete safeUpdates.full_name;
        delete safeUpdates.avatar_url;
        delete safeUpdates.date_of_birth;

        console.log('[UserController] Final update payload:', JSON.stringify(safeUpdates, null, 2));

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: safeUpdates,
        });

        console.log('[UserController] User updated successfully - New DOB:', updatedUser.dateOfBirth, 'New avatarUrl:', updatedUser.avatarUrl);

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

        // CRITICAL: Auto-verification logic
        // Check if seller has completed all required verification fields
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                gst: true,
                pan: true,
                bankAccount: true,
                ifsc: true,
                beneficiaryName: true,
                verificationStatus: true,
                role: true
            }
        });

        // Only apply to DEALER role
        if (currentUser?.role === 'DEALER') {
            // Merge current values with updates to get final state
            const finalFields = {
                gst: filteredUpdates.gst ?? currentUser?.gst,
                pan: filteredUpdates.pan ?? currentUser?.pan,
                bankAccount: filteredUpdates.bankAccount ?? currentUser?.bankAccount,
                ifsc: filteredUpdates.ifsc ?? currentUser?.ifsc,
                beneficiaryName: filteredUpdates.beneficiaryName ?? currentUser?.beneficiaryName
            };

            // Check if all required fields are filled
            const allFieldsFilled = Object.values(finalFields).every(
                field => field && String(field).trim() !== ''
            );

            // Auto-set to pending if all fields filled and currently unverified
            if (allFieldsFilled && currentUser.verificationStatus === 'unverified') {
                filteredUpdates.verificationStatus = 'pending';
                console.log(`[AutoVerification] Setting user ${userId} to 'pending' - all required fields completed`);
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
                    avatarUrl: true,
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
                    gst: true,
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

        // Map frontend roles to backend Enum values
        const roleMapping: Record<string, any> = {
            'user': 'USER',
            'seller': 'DEALER',
            'dealer': 'DEALER',
            'admin': 'ADMIN',
            'USER': 'USER',
            'DEALER': 'DEALER',
            'ADMIN': 'ADMIN'
        };

        const backendRole = roleMapping[role.toLowerCase()] || 'USER';

        const user = await prisma.user.update({
            where: { id },
            data: { role: backendRole }
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
