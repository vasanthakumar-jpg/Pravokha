/**
 * Test Data Seeder for Security Verification
 * 
 * Creates realistic test data including:
 * - Multiple vendors with products
 * - Customers with orders
 * - Mixed-vendor orders
 * - Super Admin user
 */

import { prisma } from '../infra/database/client';
import bcrypt from 'bcryptjs';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

export async function seedTestData() {
    console.log('🌱 Seeding test data...');

    // 1. Create Super Admin
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@pravokha.com' },
        update: {},
        create: {
            email: 'admin@pravokha.com',
            password: await bcrypt.hash('admin123', 10),
            name: 'Super Admin',
            role: Role.SUPER_ADMIN,
            status: 'active'
        }
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // 2. Create Vendor A User & Record
    const vendorAUser = await prisma.user.upsert({
        where: { email: 'vendor-a@pravokha.com' },
        update: {},
        create: {
            email: 'vendor-a@pravokha.com',
            password: await bcrypt.hash('vendor123', 10),
            name: 'Vendor A Owner',
            role: Role.ADMIN,
            status: 'active'
        }
    });

    const vendorA = await prisma.vendor.upsert({
        where: { ownerId: vendorAUser.id },
        update: {},
        create: {
            ownerId: vendorAUser.id,
            storeName: "A's Fashion Store",
            slug: 'vendor-a-store',
            description: "Premium clothing by Vendor A",
            status: 'ACTIVE',
            commissionRate: 10
        }
    });
    console.log('✅ Vendor A created:', vendorAUser.email);

    // 3. Create Vendor B User & Record
    const vendorBUser = await prisma.user.upsert({
        where: { email: 'vendor-b@pravokha.com' },
        update: {},
        create: {
            email: 'vendor-b@pravokha.com',
            password: await bcrypt.hash('vendor123', 10),
            name: 'Vendor B Owner',
            role: Role.ADMIN,
            status: 'active'
        }
    });

    const vendorB = await prisma.vendor.upsert({
        where: { ownerId: vendorBUser.id },
        update: {},
        create: {
            ownerId: vendorBUser.id,
            storeName: "B's Clothing Hub",
            slug: 'vendor-b-hub',
            description: "Trendy apparel by Vendor B",
            status: 'ACTIVE',
            commissionRate: 12
        }
    });
    console.log('✅ Vendor B created:', vendorBUser.email);

    // 4. Create Customers
    const customer1 = await prisma.user.upsert({
        where: { email: 'customer1@pravokha.com' },
        update: {},
        create: {
            email: 'customer1@pravokha.com',
            password: await bcrypt.hash('customer123', 10),
            name: 'John Customer',
            role: Role.CUSTOMER,
            status: 'active'
        }
    });

    const customer2 = await prisma.user.upsert({
        where: { email: 'customer2@pravokha.com' },
        update: {},
        create: {
            email: 'customer2@pravokha.com',
            password: await bcrypt.hash('customer123', 10),
            name: 'Jane Customer',
            role: Role.CUSTOMER,
            status: 'active'
        }
    });
    console.log('✅ Customers created');

    // 5. Create Categories
    const catFashion = await prisma.category.upsert({
        where: { slug: 'fashion' },
        update: {},
        create: {
            name: 'Fashion',
            slug: 'fashion',
            status: 'active'
        }
    });

    // 6. Create Products for Vendor A
    const productA1 = await prisma.product.upsert({
        where: { slug: 'vendor-a-tshirt' },
        update: {},
        create: {
            title: 'Premium Cotton T-Shirt',
            slug: 'vendor-a-tshirt',
            description: 'High-quality cotton t-shirt by Vendor A',
            price: 499,
            stock: 50,
            status: 'ACTIVE',
            vendorId: vendorA.id,
            categoryId: catFashion.id
        }
    });

    const productA2 = await prisma.product.upsert({
        where: { slug: 'vendor-a-jeans' },
        update: {},
        create: {
            title: 'Slim Fit Jeans',
            slug: 'vendor-a-jeans',
            description: 'Comfortable slim fit jeans',
            price: 1299,
            stock: 30,
            status: 'ACTIVE',
            vendorId: vendorA.id,
            categoryId: catFashion.id
        }
    });
    console.log('✅ Vendor A products created');

    // 7. Create Products for Vendor B
    const productB1 = await prisma.product.upsert({
        where: { slug: 'vendor-b-hoodie' },
        update: {},
        create: {
            title: 'Casual Hoodie',
            slug: 'vendor-b-hoodie',
            description: 'Warm and stylish hoodie',
            price: 899,
            stock: 40,
            status: 'ACTIVE',
            vendorId: vendorB.id,
            categoryId: catFashion.id
        }
    });

    const productB2 = await prisma.product.upsert({
        where: { slug: 'vendor-b-shorts' },
        update: {},
        create: {
            title: 'Sports Shorts',
            slug: 'vendor-b-shorts',
            description: 'Breathable sports shorts',
            price: 399,
            stock: 60,
            status: 'ACTIVE',
            vendorId: vendorB.id,
            categoryId: catFashion.id
        }
    });
    console.log('✅ Vendor B products created');

    // 8. Create Orders
    const orderNumber = `ORD-${Date.now()}`;
    await prisma.order.create({
        data: {
            orderNumber: `${orderNumber}-1`,
            totalAmount: 499,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PAID,
            paymentMethod: 'STRIPE',
            customerName: customer1.name!,
            customerEmail: customer1.email,
            customerPhone: '9876543210',
            shippingAddress: { address: '123 Main Street', city: 'Mumbai', pincode: '400001' },
            customerId: customer1.id,
            vendorId: vendorA.id,
            platformFee: 49.9,
            vendorEarnings: 449.1,
            items: {
                create: [
                    {
                        productId: productA1.id,
                        priceAtPurchase: productA1.price,
                        subtotal: productA1.price,
                        quantity: 1
                    }
                ]
            },
            statusHistory: {
                create: {
                    status: OrderStatus.PENDING,
                    notes: 'Order seeded for testing'
                }
            }
        }
    });

    console.log('\n🎉 Test data seeding complete!\n');
    console.log('📝 Test Accounts:');
    console.log('   Super Admin: admin@pravokha.com / admin123');
    console.log('   Vendor A:    vendor-a@pravokha.com / vendor123');
    console.log('   Vendor B:    vendor-b@pravokha.com / vendor123');
    console.log('   Customer 1:  customer1@pravokha.com / customer123');
    console.log('   Customer 2:  customer2@pravokha.com / customer123\n');
}

// Run if executed directly
if (require.main === module) {
    seedTestData()
        .then(() => {
            console.log('✅ Seeding completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Seeding failed:', error);
            process.exit(1);
        });
}
