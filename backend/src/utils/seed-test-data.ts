/**
 * Test Data Seeder for Security Verification
 * 
 * Creates realistic test data including:
 * - Multiple sellers with products
 * - Customers with orders
 * - Mixed-vendor orders
 * - Admin user
 */

import { prisma } from '../infra/database/client';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export async function seedTestData() {
    console.log('🌱 Seeding test data...');

    // 1. Create Super Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pravokha.com' },
        update: {},
        create: {
            email: 'admin@pravokha.com',
            password: await bcrypt.hash('admin123', 10),
            name: 'Super Admin',
            role: Role.ADMIN,
            status: 'active'
        }
    });
    console.log('✅ Admin created:', admin.email);

    // 2. Create Dealer A
    const dealerA = await prisma.user.upsert({
        where: { email: 'dealer-a@pravokha.com' },
        update: {},
        create: {
            email: 'dealer-a@pravokha.com',
            password: await bcrypt.hash('dealer123', 10),
            name: 'Fashion Dealer A',
            role: Role.DEALER,
            status: 'active',
            storeName: 'A\'s Fashion Store',
            storeDescription: 'Premium clothing by Dealer A'
        }
    });
    console.log('✅ Dealer A created:', dealerA.email);

    // 3. Create Dealer B
    const dealerB = await prisma.user.upsert({
        where: { email: 'dealer-b@pravokha.com' },
        update: {},
        create: {
            email: 'dealer-b@pravokha.com',
            password: await bcrypt.hash('dealer123', 10),
            name: 'Fashion Dealer B',
            role: Role.DEALER,
            status: 'active',
            storeName: 'B\'s Clothing Hub',
            storeDescription: 'Trendy apparel by Dealer B'
        }
    });
    console.log('✅ Dealer B created:', dealerB.email);

    // 4. Create Customers
    const customer1 = await prisma.user.upsert({
        where: { email: 'customer1@pravokha.com' },
        update: {},
        create: {
            email: 'customer1@pravokha.com',
            password: await bcrypt.hash('customer123', 10),
            name: 'John Customer',
            role: Role.USER,
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
            role: Role.USER,
            status: 'active'
        }
    });
    console.log('✅ Customers created');

    // 5. Create Products for Dealer A
    const productA1 = await prisma.product.upsert({
        where: { slug: 'dealer-a-tshirt' },
        update: {},
        create: {
            title: 'Premium Cotton T-Shirt',
            slug: 'dealer-a-tshirt',
            description: 'High-quality cotton t-shirt by Dealer A',
            price: 499,
            stock: 50,
            published: true,
            dealerId: dealerA.id
        }
    });

    const productA2 = await prisma.product.upsert({
        where: { slug: 'dealer-a-jeans' },
        update: {},
        create: {
            title: 'Slim Fit Jeans',
            slug: 'dealer-a-jeans',
            description: 'Comfortable slim fit jeans',
            price: 1299,
            stock: 30,
            published: true,
            dealerId: dealerA.id
        }
    });
    console.log('✅ Dealer A products created');

    // 6. Create Products for Dealer B
    const productB1 = await prisma.product.upsert({
        where: { slug: 'dealer-b-hoodie' },
        update: {},
        create: {
            title: 'Casual Hoodie',
            slug: 'dealer-b-hoodie',
            description: 'Warm and stylish hoodie',
            price: 899,
            stock: 40,
            published: true,
            dealerId: dealerB.id
        }
    });

    const productB2 = await prisma.product.upsert({
        where: { slug: 'dealer-b-shorts' },
        update: {},
        create: {
            title: 'Sports Shorts',
            slug: 'dealer-b-shorts',
            description: 'Breathable sports shorts',
            price: 399,
            stock: 60,
            published: true,
            dealerId: dealerB.id
        }
    });
    console.log('✅ Dealer B products created');

    // 7. Create Mixed Order (contains products from both dealers)
    const mixedOrder = await prisma.order.create({
        data: {
            orderNumber: `ORD-MIXED-${Date.now()}`,
            total: 1398, // Product A1 + Product B1
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            customerName: customer1.name!,
            customerEmail: customer1.email,
            customerPhone: '9876543210',
            shippingAddress: '123 Main Street',
            shippingCity: 'Mumbai',
            shippingPincode: '400001',
            userId: customer1.id,
            items: {
                create: [
                    {
                        productId: productA1.id,
                        sellerId: dealerA.id,
                        title: productA1.title,
                        price: productA1.price,
                        quantity: 1
                    },
                    {
                        productId: productB1.id,
                        sellerId: dealerB.id,
                        title: productB1.title,
                        price: productB1.price,
                        quantity: 1
                    }
                ]
            }
        }
    });
    console.log('✅ Mixed order created:', mixedOrder.orderNumber);

    // 8. Create Dealer A exclusive order
    const dealerAOrder = await prisma.order.create({
        data: {
            orderNumber: `ORD-A-${Date.now()}`,
            total: 1798, // Product A1 + Product A2
            status: 'SHIPPED',
            paymentStatus: 'PAID',
            customerName: customer2.name!,
            customerEmail: customer2.email,
            customerPhone: '9123456780',
            shippingAddress: '456 Park Avenue',
            shippingCity: 'Delhi',
            shippingPincode: '110001',
            userId: customer2.id,
            items: {
                create: [
                    {
                        productId: productA1.id,
                        sellerId: dealerA.id,
                        title: productA1.title,
                        price: productA1.price,
                        quantity: 1
                    },
                    {
                        productId: productA2.id,
                        sellerId: dealerA.id,
                        title: productA2.title,
                        price: productA2.price,
                        quantity: 1
                    }
                ]
            }
        }
    });
    console.log('✅ Dealer A exclusive order created:', dealerAOrder.orderNumber);

    console.log('\n🎉 Test data seeding complete!\n');
    console.log('📝 Test Accounts:');
    console.log('   Admin:      admin@pravokha.com / admin123');
    console.log('   Dealer A:   dealer-a@pravokha.com / dealer123');
    console.log('   Dealer B:   dealer-b@pravokha.com / dealer123');
    console.log('   Customer 1: customer1@pravokha.com / customer123');
    console.log('   Customer 2: customer2@pravokha.com / customer123\n');
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
