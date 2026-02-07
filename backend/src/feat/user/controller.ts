import { Request, Response } from 'express';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { PermissionService } from '../auth/permission.service';
import { AuditService } from '../../shared/service/audit.service';
import { Role } from '@prisma/client';

export class UserController {
    // 1. Profile Management
    static getMyProfile = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;

        const userData = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                vendor: true,
                adminPermission: true
            }
        });

        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { password: _, ...userResponse } = userData;

        res.json({
            success: true,
            user: {
                ...userResponse,
                full_name: userData.name,
                avatar_url: userData.avatarUrl || userData.vendor?.logoUrl,
                date_of_birth: userData.dateOfBirth,
                phone: userData.phoneNumber
            }
        });
    });

    // Admin Stats
    static getAdminStats = asyncHandler(async (req: Request, res: Response) => {
        const [superAdmins, staffAdmins, vendors, customers] = await Promise.all([
            prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
            prisma.user.count({ where: { role: Role.ADMIN } }),
            prisma.user.count({ where: { role: Role.SELLER } }),
            prisma.user.count({ where: { role: Role.CUSTOMER } })
        ]);

        res.json({
            success: true,
            data: {
                total: superAdmins + staffAdmins + vendors + customers,
                superAdmins,
                staffAdmins,
                vendors,
                customers
            }
        });
    });

    static getProfile = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const requester = (req as any).user;

        const user = await prisma.user.findUnique({
            where: { id },
            include: { vendor: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // SECURITY: If not Super Admin and not Owner, strip PII
        if (requester.role !== Role.SUPER_ADMIN && requester.id !== user.id) {
            return res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    storeName: user.vendor?.storeName,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                    status: user.status
                }
            });
        }

        const { password, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    });

    static updateProfile = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;
        const validatedData = req.body;

        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: validatedData,
            });

            const { password: _, ...userResponse } = updatedUser;
            res.json({ success: true, user: userResponse });
        } catch (error: any) {
            console.error(`[UserController] Prisma Update Error for ${userId}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user profile',
                error: (error as Error).message,
            });
        }
    });

    // 2. Vendor Settings
    static getVendorSettings = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;

        const userData = await prisma.user.findUnique({
            where: { id: userId },
            include: { vendor: true }
        });

        if (!userData || !userData.vendor) {
            return res.status(404).json({ success: false, message: 'Vendor profile not found' });
        }

        const vendor = userData.vendor;

        res.json({
            success: true,
            settings: {
                storeName: vendor.storeName || "",
                storeDescription: vendor.description || "",
                storeLogoUrl: vendor.logoUrl || "",
                storeBannerUrl: vendor.bannerUrl || "",
                gst: vendor.gstNumber || "",
                pan: vendor.panNumber || "",
                bankAccount: vendor.bankAccountNumber || "",
                ifsc: vendor.bankIfscCode || "",
                beneficiaryName: vendor.beneficiaryName || "",
                autoConfirm: vendor.autoConfirm ?? true,
                vacationMode: (vendor as any).vacationMode ?? false,
                returnPolicy: vendor.returnPolicy || "",
                metaTitle: (vendor as any).metaTitle || "",
                metaDescription: (vendor as any).metaDescription || "",
                email: userData.email,
                phone: userData.phoneNumber || vendor.supportPhone,
                address: vendor.businessAddress || ""
            }
        });
    });

    static updateVendorSettings = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const userId = user.id;
        const {
            storeName,
            storeDescription,
            storeLogoUrl,
            storeBannerUrl,
            gstNumber,
            panNumber,
            bankAccountNumber,
            bankIfscCode,
            beneficiaryName,
            bankName,
            supportPhone,
            businessAddress,
            autoConfirm,
            vacationMode,
            returnPolicy,
            metaTitle,
            metaDescription,
            phone // From frontend form for user profile sync
        } = req.body;

        const vendorUpdates: any = {};
        if (storeName !== undefined) vendorUpdates.storeName = storeName;
        if (storeDescription !== undefined) vendorUpdates.description = storeDescription;
        if (storeLogoUrl !== undefined) vendorUpdates.logoUrl = storeLogoUrl;
        if (storeBannerUrl !== undefined) vendorUpdates.bannerUrl = storeBannerUrl;
        if (gstNumber !== undefined) vendorUpdates.gstNumber = gstNumber;
        if (panNumber !== undefined) vendorUpdates.panNumber = panNumber;
        if (bankAccountNumber !== undefined) vendorUpdates.bankAccountNumber = bankAccountNumber;
        if (bankIfscCode !== undefined) vendorUpdates.bankIfscCode = bankIfscCode;
        if (beneficiaryName !== undefined) vendorUpdates.beneficiaryName = beneficiaryName;
        if (bankName !== undefined) vendorUpdates.bankName = bankName;
        if (supportPhone !== undefined) vendorUpdates.supportPhone = supportPhone;
        if (businessAddress !== undefined) vendorUpdates.businessAddress = businessAddress;
        if (autoConfirm !== undefined) vendorUpdates.autoConfirm = autoConfirm;
        if (vacationMode !== undefined) vendorUpdates.vacationMode = vacationMode;
        if (returnPolicy !== undefined) vendorUpdates.returnPolicy = returnPolicy;
        if (metaTitle !== undefined) vendorUpdates.metaTitle = metaTitle;
        if (metaDescription !== undefined) vendorUpdates.metaDescription = metaDescription;

        const userUpdates: any = {};
        if (phone !== undefined) userUpdates.phoneNumber = phone;
        else if (supportPhone !== undefined) userUpdates.phoneNumber = supportPhone;

        try {
            if (vendorUpdates.storeName) {
                vendorUpdates.slug = vendorUpdates.storeName
                    .toLowerCase()
                    .replace(/[^\w ]+/g, '')
                    .replace(/ +/g, '-');
            }

            const result = await prisma.$transaction(async (tx) => {
                if (Object.keys(userUpdates).length > 0) {
                    await tx.user.update({ where: { id: userId }, data: userUpdates });
                }

                return await tx.vendor.upsert({
                    where: { ownerId: userId },
                    update: vendorUpdates,
                    create: {
                        ownerId: userId,
                        ...vendorUpdates,
                        // Ensure required fields for creation if they're missing in this specific update
                        storeName: vendorUpdates.storeName || user.name || 'My Store',
                        slug: vendorUpdates.slug || (vendorUpdates.storeName || user.name || 'my-store')
                            .toLowerCase()
                            .replace(/[^\w ]+/g, '')
                            .replace(/ +/g, '-'),
                        status: 'PENDING'
                    }
                });
            });

            console.log('[updateVendorSettings] Update/Upsert successful');
            res.json({ success: true, settings: result });
        } catch (error: any) {
            console.error('[updateVendorSettings] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update store settings.',
                error: error.message,
                code: error.code,
                meta: error.meta
            });
        }
    });

    // 3. Address Management
    static listAddresses = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const addresses = await prisma.address.findMany({
            where: { userId: user.id },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
        });
        res.json(addresses);
    });

    static addAddress = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { name, phoneNumber, addressLine1, addressLine2, city, state, pincode, type, isDefault } = req.body;

        const address = await prisma.$transaction(async (tx) => {
            if (isDefault) {
                await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
            }
            return await tx.address.create({
                data: {
                    name,
                    phoneNumber,
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    pincode,
                    type,
                    isDefault,
                    userId: user.id
                }
            });
        });
        res.status(201).json(address);
    });

    static updateAddress = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { id } = req.params;
        const { name, phoneNumber, addressLine1, addressLine2, city, state, pincode, type, isDefault } = req.body;

        const address = await prisma.$transaction(async (tx) => {
            if (isDefault) {
                await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
            }
            return await tx.address.update({
                where: { id, userId: user.id },
                data: { name, phoneNumber, addressLine1, addressLine2, city, state, pincode, type, isDefault }
            });
        });
        res.json(address);
    });

    static deleteAddress = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { id } = req.params;
        await prisma.address.delete({ where: { id, userId: user.id } });
        res.json({ success: true, message: 'Address deleted' });
    });

    // 4. Admin User Management
    static listUsers = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const canViewUsers = await PermissionService.canPerform(user.id, user.role, 'VIEW_USERS', 'USER');
        if (!canViewUsers) return res.status(403).json({ success: false, message: 'Permission denied' });

        const { role, status, searchQuery, skip, take } = req.query;
        const where: any = {};

        if (role) where.role = role;
        if (status) where.status = status;
        const { verificationStatus } = req.query;
        if (verificationStatus) where.verificationStatus = verificationStatus;

        if (searchQuery) {
            where.OR = [
                { email: { contains: searchQuery as string } },
                { name: { contains: searchQuery as string } },
                { vendor: { storeName: { contains: searchQuery as string } } }
            ];
        }

        const [users, count] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip: skip ? parseInt(skip as string) : 0,
                take: take ? parseInt(take as string) : 10,
                orderBy: { createdAt: 'desc' },
                include: { vendor: true }
            }),
            prisma.user.count({ where })
        ]);

        res.json({ success: true, users, count });
    });

    static updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
        const adminUser = (req as any).user;
        const { id } = req.params;
        const { status } = req.body;

        const canManage = await PermissionService.canPerform(adminUser.id, adminUser.role, 'MANAGE_USER', 'USER');
        if (!canManage) return res.status(403).json({ success: false, message: 'Permission denied' });

        const user = await prisma.user.update({ where: { id }, data: { status } });

        await AuditService.logAction({
            performedBy: adminUser.id,
            performerRole: adminUser.role,
            performerEmail: adminUser.email,
            action: 'UPDATE_USER_STATUS',
            entity: 'User',
            entityId: id,
            changes: { status },
            reason: 'Admin updated user status',
            ipAddress: req.ip
        });

        res.json({ success: true, user });
    });

    static updateUserRole = asyncHandler(async (req: Request, res: Response) => {
        const adminUser = (req as any).user;
        const { id } = req.params;
        const { role } = req.body;

        // SUPER_ADMIN-only restriction for role changes
        if (adminUser.role !== Role.SUPER_ADMIN) {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can change user roles'
            });
        }

        // CRITICAL CHECK: Prevent downgrade if user has vendor-specific data
        const targetUser = await prisma.user.findUnique({
            where: { id },
            include: { vendor: true }
        });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // If downgrading from ADMIN/SELLER to CUSTOMER, check for dependencies
        if ((targetUser.role === Role.ADMIN || targetUser.role === Role.SELLER) && role === Role.CUSTOMER) {
            // Check if user has a vendor profile
            if (targetUser.vendor) {
                const productCount = await prisma.product.count({
                    where: { vendorId: targetUser.vendor.id }
                });

                if (productCount > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot downgrade role: User has ${productCount} active products as a vendor. Please delete vendor data first.`,
                        constraint: 'VENDOR_DATA_EXISTS',
                        productCount
                    });
                }
            }
        }

        // Use transaction to ensure data integrity

        const user = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({ where: { id }, data: { role } });

            // If promoting to SELLER, ensure Vendor profile exists
            if (role === Role.SELLER) {
                const existingVendor = await tx.vendor.findUnique({ where: { ownerId: id } });
                if (!existingVendor) {
                    const userData = await tx.user.findUnique({ where: { id } });
                    const storeName = (userData?.name || 'My Store') + ' ' + Math.floor(Math.random() * 1000);
                    const slug = storeName.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

                    await tx.vendor.create({
                        data: {
                            ownerId: id,
                            storeName: storeName,
                            slug: slug,
                            status: 'PENDING'
                        }
                    });
                }
            }
            return updatedUser;
        });

        await AuditService.logAction({
            performedBy: adminUser.id,
            performerRole: adminUser.role,
            performerEmail: adminUser.email,
            action: 'CHANGE_USER_ROLE',
            entity: 'User',
            entityId: id,
            changes: { role },
            reason: 'Super Admin updated user role',
            ipAddress: req.ip
        });

        res.json({ success: true, user });
    });

    static verifySeller = asyncHandler(async (req: Request, res: Response) => {
        const adminUser = (req as any).user;
        const { id } = req.params; // This is the user ID of the seller
        const { status, reason } = req.body; // status is 'approved' or 'rejected' from frontend

        const canVerify = await PermissionService.canPerform(adminUser.id, adminUser.role, 'VERIFY_VENDOR', 'USER');
        if (!canVerify) return res.status(403).json({ success: false, message: 'Permission denied' });

        // Map frontend status to database values
        const userVerificationStatus = status === 'approved' ? 'verified' : 'rejected';
        const vendorStatus = status === 'approved' ? 'ACTIVE' : 'REJECTED';

        // Update both user and vendor in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update user verification status for badge persistence
            await tx.user.update({
                where: { id },
                data: {
                    verificationStatus: userVerificationStatus,
                    status: status === 'approved' ? 'active' : undefined
                }
            });

            // Update vendor status IF vendor exists
            const vendor = await tx.vendor.findUnique({ where: { ownerId: id } });
            if (vendor) {
                return await tx.vendor.update({
                    where: { ownerId: id },
                    data: {
                        status: vendorStatus,
                        approvedAt: status === 'approved' ? new Date() : null
                    }
                });
            }
            return { id: null }; // Return dummy if no vendor
        });

        await AuditService.logAction({
            performedBy: adminUser.id,
            performerRole: adminUser.role,
            performerEmail: adminUser.email,
            action: status === 'approved' ? 'VERIFY_VENDOR' : 'REJECT_VENDOR',
            entity: 'Vendor',
            entityId: result.id || id, // Use user ID if vendor ID is null (user-only verification)
            changes: { status: vendorStatus, userVerificationStatus, reason },
            reason: reason,
            ipAddress: req.ip
        });

        res.json({ success: true, vendor: result });
    });
}
