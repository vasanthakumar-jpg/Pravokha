/**
 * Order Data Isolation Tests
 * 
 * Validates that sellers can only view orders containing their products.
 * Ensures strict multi-vendor data isolation.
 */

import { OrderService } from '../src/feat/order/service';
import { prisma } from '../src/infra/database/client';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

describe('Order Data Isolation', () => {
    let dealerA: any;
    let dealerB: any;
    let customer: any;
    let admin: any;
    let productA: any;
    let productB: any;
    let mixedOrder: any;
    let dealerAOnlyOrder: any;

    beforeAll(async () => {
        // Create test users
        dealerA = await prisma.user.create({
            data: {
                email: 'dealerA-order@test.com',
                password: 'hashed',
                name: 'Dealer A',
                role: Role.DEALER
            }
        });

        dealerB = await prisma.user.create({
            data: {
                email: 'dealerB-order@test.com',
                password: 'hashed',
                name: 'Dealer B',
                role: Role.DEALER
            }
        });

        customer = await prisma.user.create({
            data: {
                email: 'customer-order@test.com',
                password: 'hashed',
                name: 'Test Customer',
                role: Role.USER
            }
        });

        admin = await prisma.user.create({
            data: {
                email: 'admin-order@test.com',
                password: 'hashed',
                name: 'Admin',
                role: Role.ADMIN
            }
        });

        // Create products
        productA = await prisma.product.create({
            data: {
                title: 'Product A',
                slug: 'product-a-order-test',
                description: 'Test',
                price: 100,
                stock: 100,
                dealerId: dealerA.id,
                published: true
            }
        });

        productB = await prisma.product.create({
            data: {
                title: 'Product B',
                slug: 'product-b-order-test',
                description: 'Test',
                price: 200,
                stock: 100,
                dealerId: dealerB.id,
                published: true
            }
        });

        // Create orders
        // Order with both dealers' products
        mixedOrder = await prisma.order.create({
            data: {
                orderNumber: 'ORD-MIXED-TEST',
                total: 300,
                status: OrderStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING,
                customerName: 'Test Customer',
                customerEmail: customer.email,
                customerPhone: '1234567890',
                shippingAddress: '123 Test St',
                shippingCity: 'Test City',
                shippingPincode: '123456',
                userId: customer.id,
                items: {
                    create: [
                        {
                            productId: productA.id,
                            sellerId: dealerA.id,
                            title: productA.title,
                            price: productA.price,
                            quantity: 1
                        },
                        {
                            productId: productB.id,
                            sellerId: dealerB.id,
                            title: productB.title,
                            price: productB.price,
                            quantity: 1
                        }
                    ]
                }
            }
        });

        // Order with only Dealer A's products
        dealerAOnlyOrder = await prisma.order.create({
            data: {
                orderNumber: 'ORD-A-ONLY-TEST',
                total: 100,
                status: OrderStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING,
                customerName: 'Test Customer',
                customerEmail: customer.email,
                customerPhone: '1234567890',
                shippingAddress: '123 Test St',
                shippingCity: 'Test City',
                shippingPincode: '123456',
                userId: customer.id,
                items: {
                    create: [
                        {
                            productId: productA.id,
                            sellerId: dealerA.id,
                            title: productA.title,
                            price: productA.price,
                            quantity: 1
                        }
                    ]
                }
            }
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.orderItem.deleteMany({
            where: { orderId: { in: [mixedOrder.id, dealerAOnlyOrder.id] } }
        });
        await prisma.order.deleteMany({
            where: { id: { in: [mixedOrder.id, dealerAOnlyOrder.id] } }
        });
        await prisma.product.deleteMany({
            where: { id: { in: [productA.id, productB.id] } }
        });
        await prisma.user.deleteMany({
            where: { id: { in: [dealerA.id, dealerB.id, customer.id, admin.id] } }
        });
        await prisma.$disconnect();
    });

    describe('List Orders - Seller Isolation', () => {
        it('DEALER A can view orders containing their products (mixed order)', async () => {
            const orders = await OrderService.listOrders(dealerA.id, Role.DEALER);
            const mixedOrderFound = orders.some(o => o.id === mixedOrder.id);
            expect(mixedOrderFound).toBe(true);
        });

        it('DEALER B can view orders containing their products (mixed order)', async () => {
            const orders = await OrderService.listOrders(dealerB.id, Role.DEALER);
            const mixedOrderFound = orders.some(o => o.id === mixedOrder.id);
            expect(mixedOrderFound).toBe(true);
        });

        it('DEALER A can view their exclusive orders', async () => {
            const orders = await OrderService.listOrders(dealerA.id, Role.DEALER);
            const exclusiveOrderFound = orders.some(o => o.id === dealerAOnlyOrder.id);
            expect(exclusiveOrderFound).toBe(true);
        });

        it('DEALER B cannot view orders containing ONLY DEALER A products', async () => {
            const orders = await OrderService.listOrders(dealerB.id, Role.DEALER);
            const exclusiveOrderFound = orders.some(o => o.id === dealerAOnlyOrder.id);
            expect(exclusiveOrderFound).toBe(false);
        });

        it('ADMIN can view all orders', async () => {
            const orders = await OrderService.listOrders(admin.id, Role.ADMIN);
            expect(orders.length).toBeGreaterThanOrEqual(2);
        });

        it('CUSTOMER can only view their own orders', async () => {
            const orders = await OrderService.listOrders(customer.id, Role.USER);
            expect(orders.every(o => o.userId === customer.id)).toBe(true);
        });
    });

    describe('Get Order By ID - Access Control', () => {
        it('DEALER A can view mixed order (contains their product)', async () => {
            const order = await OrderService.getOrderById(mixedOrder.id, dealerA.id, Role.DEALER);
            expect(order).toBeTruthy();
            expect(order!.id).toBe(mixedOrder.id);
        });

        it('DEALER B cannot view Dealer A exclusive order', async () => {
            await expect(
                OrderService.getOrderById(dealerAOnlyOrder.id, dealerB.id, Role.DEALER)
            ).rejects.toThrow('Forbidden: This order does not contain your products');
        });

        it('CUSTOMER can view their own order', async () => {
            const order = await OrderService.getOrderById(mixedOrder.id, customer.id, Role.USER);
            expect(order).toBeTruthy();
        });

        it('CUSTOMER cannot view another customer\'s order', async () => {
            const anotherCustomer = await prisma.user.create({
                data: {
                    email: 'another-customer@test.com',
                    password: 'hashed',
                    role: Role.USER
                }
            });

            await expect(
                OrderService.getOrderById(mixedOrder.id, anotherCustomer.id, Role.USER)
            ).rejects.toThrow('Unauthorized access to order');

            await prisma.user.delete({ where: { id: anotherCustomer.id } });
        });

        it('ADMIN can view any order', async () => {
            const order = await OrderService.getOrderById(mixedOrder.id, admin.id, Role.ADMIN);
            expect(order).toBeTruthy();
        });
    });

    describe('Order Item Seller Tracking', () => {
        it('Order items have correct sellerId', async () => {
            const order = await prisma.order.findUnique({
                where: { id: mixedOrder.id },
                include: { items: true }
            });

            const itemA = order!.items.find(i => i.productId === productA.id);
            const itemB = order!.items.find(i => i.productId === productB.id);

            expect(itemA?.sellerId).toBe(dealerA.id);
            expect(itemB?.sellerId).toBe(dealerB.id);
        });
    });
});
