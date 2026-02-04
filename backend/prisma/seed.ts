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

    // 6. Create PRODUCTS
    console.log('🌱 Seeding Products...');
    // Fetch all vendors to assign products round-robin
    const allVendors = await prisma.vendor.findMany();

    if (allVendors.length === 0) {
        console.log("No vendors found, skipping products.");
    } else {
        const productTitles = [
            'Premium Wireless Headphones',
            'Minimalist Cotton T-Shirt',
            'Smart Fitness Tracker',
            'Organic Coffee Beans',
            'Leather Messenger Bag',
            'Gaming Mouse',
            'Yoga Mat',
            'Stainless Steel Water Bottle',
            'Bluetooth Speaker',
            'Running Shoes'
        ];

        for (let i = 0; i < productTitles.length; i++) {
            const vendor = allVendors[i % allVendors.length];
            const category = categories[i % categories.length];
            const slug = productTitles[i].toLowerCase().replace(/ /g, '-');

            await prisma.product.upsert({
                where: { slug },
                update: {
                    vendorId: vendor.id, // Ensure vendor ownership might change in seed re-run
                    status: 'ACTIVE'
                },
                create: {
                    title: productTitles[i],
                    slug,
                    description: `High-quality ${productTitles[i]} for our premium customers.`,
                    price: 999 + i * 500,
                    stock: 50,
                    categoryId: category.id,
                    vendorId: vendor.id,
                    status: 'ACTIVE',
                    images: {
                        create: [
                            { url: 'https://picsum.photos/seed/' + slug + '/800/600', order: 0 }
                        ]
                    },
                    variants: {
                        create: [
                            {
                                name: 'Standard Variant',
                                colorName: 'Standard',
                                colorHex: '#000000',
                                images: JSON.stringify(['https://picsum.photos/seed/' + slug + '/800/600']),
                                stock: 50,
                                sizes: {
                                    create: [
                                        { size: 'One Size', stock: 50 }
                                    ]
                                }
                            }
                        ]
                    },
                    isVerified: true,
                    isFeatured: i === 0
                }
            });
        }
        console.log('✅ Products created');
    }

    console.log('✨ Seeding Completed Successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
