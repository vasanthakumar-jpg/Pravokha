import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Backend Seeding (Standardized Schema - 4 Role System)...');

    // Default Passwords
    const superAdminPass = await bcrypt.hash('SuperAdmin123!', 10);
    const sellerPass = await bcrypt.hash('Seller123!', 10);
    const userPass = await bcrypt.hash('User123!', 10);

    // 1. SUPER ADMIN (Owners)
    const superAdmins = [
        { email: 'superadmin@pravokha.com', name: 'Super Admin One', phone: '+91-9990000001' },
        { email: 'owner@pravokha.com', name: 'Owner', phone: '+91-9990000002' }
    ];

    for (const [i, sa] of superAdmins.entries()) {
        const upserted = await prisma.user.upsert({
            where: { email: sa.email },
            update: {
                password: superAdminPass, // FORCE UPDATE PASSWORD
                role: Role.SUPER_ADMIN,
                name: sa.name,
                status: 'active'
            },
            create: {
                email: sa.email,
                password: superAdminPass,
                name: sa.name,
                role: Role.SUPER_ADMIN,
                phoneNumber: sa.phone,
                status: 'active'
            }
        });

        // Ensure Admin Permissions
        await prisma.adminPermission.upsert({
            where: { adminId: upserted.id },
            update: { canManagePlatform: true, canManageVendors: true, canManageUsers: true },
            create: {
                adminId: upserted.id, canManagePlatform: true, canManageVendors: true, canManageUsers: true,
                canAccessAuditLogs: true, canApproveProducts: true, canEditAnyProduct: true, canDeleteAnyProduct: true,
                canManageCategories: true, canSuspendUsers: true, canVerifyVendors: true, canChangeUserRoles: true,
                canViewAllOrders: true, canCancelAnyOrder: true, canIssueRefunds: true, canApprovePayouts: true,
                canViewFinancials: true, canModifyCommission: true, canManageAdmins: true, canChangeSettings: true
            }
        });
        console.log(`✅ Super Admin ${sa.name} updated/created`);
    }

    // 2. STAFF ADMINS (Employees)
    const staffAdmins = [
        { email: 'admin@pravokha.com', name: 'Staff Admin One', phone: '+91-8880000001', role: 'Support Lead' },
        { email: 'support@pravokha.com', name: 'Support Agent', phone: '+91-8880000002', role: 'Support Agent' },
        { email: 'finance@pravokha.com', name: 'Finance Manager', phone: '+91-8880000003', role: 'Finance' }
    ];

    for (const [i, admin] of staffAdmins.entries()) {
        const upserted = await prisma.user.upsert({
            where: { email: admin.email },
            update: {
                password: superAdminPass, // Using same for admins for simplicity in demo
                role: Role.ADMIN,
                name: admin.name,
                status: 'active'
            },
            create: {
                email: admin.email,
                password: superAdminPass,
                name: admin.name,
                role: Role.ADMIN,
                phoneNumber: admin.phone,
                status: 'active'
            }
        });

        // Permissions based on role simulation
        const isFinance = admin.role === 'Finance';

        await prisma.adminPermission.upsert({
            where: { adminId: upserted.id },
            update: {
                canManageUsers: !isFinance,
                canViewAllOrders: true,
                canViewFinancials: isFinance,
                canApprovePayouts: isFinance
            },
            create: {
                adminId: upserted.id,
                canManageUsers: !isFinance,
                canViewAllOrders: true,
                canViewFinancials: isFinance,
                canApprovePayouts: isFinance,
                // Defaults for others false
                canManagePlatform: false
            }
        });
        console.log(`✅ Staff Admin ${admin.name} updated/created`);
    }

    // 3. SELLERS (Vendors)
    const sellers = [
        { email: 'seller1@pravokha.com', name: 'Seller One', store: 'Pravokha Tech Store', slug: 'pravokha-tech' },
        { email: 'seller2@pravokha.com', name: 'Seller Two', store: 'Fashion Hub', slug: 'fashion-hub' },
        { email: 'seller3@pravokha.com', name: 'Seller Three', store: 'Organic Life', slug: 'organic-life' },
        { email: 'seller4@pravokha.com', name: 'Seller Four', store: 'Urban Decor', slug: 'urban-decor' }
    ];

    for (const [index, v] of sellers.entries()) {
        const user = await prisma.user.upsert({
            where: { email: v.email },
            update: {
                password: sellerPass, // FORCE UPDATE
                role: Role.SELLER,     // FORCE ROLE UPDATE
                name: v.name,
                status: 'active'
            },
            create: {
                email: v.email,
                password: sellerPass,
                name: v.name,
                role: Role.SELLER,
                phoneNumber: `+91-800000000${index + 1}`,
                status: 'active'
            }
        });

        await prisma.vendor.upsert({
            where: { ownerId: user.id },
            update: { storeName: v.store, slug: v.slug }, // Ensure correct store details
            create: {
                ownerId: user.id,
                storeName: v.store,
                slug: v.slug,
                status: 'ACTIVE',
                commissionRate: 10.0,
                description: `This is ${v.store}, selling premium goods.`,
                gstNumber: `GSTIN000${index + 1}`,
                panNumber: `PANABC00${index + 1}`,
                bankAccountNumber: `123456789${index + 1}`,
                bankIfscCode: `IFSC000${index + 1}`,
                autoConfirm: true,
                approvedAt: new Date()
            }
        });
        console.log(`✅ Seller ${v.name} updated/created`);
    }

    // 4. CUSTOMERS (Users)
    const customers = [
        { email: 'user1@pravokha.com', name: 'User One' },
        { email: 'user2@pravokha.com', name: 'User Two' },
        { email: 'user3@pravokha.com', name: 'User Three' },
        { email: 'user4@pravokha.com', name: 'User Four' }
    ];

    for (const [index, c] of customers.entries()) {
        await prisma.user.upsert({
            where: { email: c.email },
            update: {
                password: userPass, // FORCE UPDATE
                role: Role.CUSTOMER,
                name: c.name,
                status: 'active'
            },
            create: {
                email: c.email,
                password: userPass,
                name: c.name,
                role: Role.CUSTOMER,
                phoneNumber: `+91-700000000${index + 1}`,
                status: 'active'
            }
        });
        console.log(`✅ Customer ${c.name} updated/created`);
    }

    // 5. Create CATEGORIES
    console.log('🌱 Seeding Categories...');
    const categoryNames = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Beauty'];
    const categories: any[] = [];
    for (const name of categoryNames) {
        const slug = name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
        const cat = await prisma.category.upsert({
            where: { slug },
            update: {},
            create: { name, slug, description: `Explore our collection of ${name}` }
        });
        categories.push(cat);
    }
    console.log('✅ Categories created');

    console.log('✅ Products created');

    // 7. Create SHIPPING ZONES
    console.log('🌱 Seeding Shipping Zones...');
    const zones = [
        { name: 'Zone A - Metros', base: 60, additional: 40, cod: 50, remote: 100, minDays: 2, maxDays: 4 },
        { name: 'Zone B - Regional', base: 80, additional: 60, cod: 70, remote: 150, minDays: 4, maxDays: 7 },
        { name: 'Zone C - National', base: 120, additional: 100, cod: 100, remote: 200, minDays: 6, maxDays: 10 }
    ];

    const createdZones: any[] = [];
    for (const z of zones) {
        const zone = await (prisma as any).shippingZone.create({
            data: {
                zoneName: z.name,
                baseSlabPrice: z.base,
                additionalSlabPrice: z.additional,
                codFee: z.cod,
                remoteSurcharge: z.remote,
                minDays: z.minDays,
                maxDays: z.maxDays
            }
        });
        createdZones.push(zone);
    }
    console.log('✅ Shipping Zones created');

    // 8. Create PINCODE MAPPINGS
    console.log('🌱 Seeding Pincode Mappings...');
    const localPincodes = ['400001', '400002', '400003']; // Mumbai (Metro)
    const regionalPincodes = ['411001', '411002']; // Pune (Regional)

    for (const p of localPincodes) {
        await (prisma as any).pincodeZoneMapping.create({
            data: { pincode: p, zoneId: createdZones[0].id, isRemote: false }
        });
    }

    for (const p of regionalPincodes) {
        await (prisma as any).pincodeZoneMapping.create({
            data: { pincode: p, zoneId: createdZones[1].id, isRemote: false }
        });
    }
    console.log('✅ Pincode Mappings created');

    // 9. Update SITE SETTINGS
    console.log('🌱 Seeding Site Settings...');
    await prisma.siteSetting.upsert({
        where: { id: 'primary' },
        update: {
            defaultShippingFee: 99,
            freeShippingThreshold: 1999
        } as any,
        create: {
            id: 'primary',
            storeName: 'Pravokha',
            defaultShippingFee: 99,
            freeShippingThreshold: 1999
        } as any
    });
    console.log('✅ Site Settings updated');

    console.log('Advanced Shipping Seeding completed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
