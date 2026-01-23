/**
 * Product Ownership Security Tests
 * 
 * Validates that DEALER role can only create, update, and delete their own products.
 * Tests IDOR (Insecure Direct Object Reference) protection.
 */

import { ProductService } from '../src/feat/product/service';
import { prisma } from '../src/infra/database/client';
import { Role } from '@prisma/client';

describe('Product Ownership Validation', () => {
    let dealerA: any;
    let dealerB: any;
    let admin: any;
    let productA: any;
    let productB: any;

    beforeAll(async () => {
        // Create test users
        dealerA = await prisma.user.create({
            data: {
                email: 'dealerA@test.com',
                password: 'hashed',
                name: 'Dealer A',
                role: Role.DEALER
            }
        });

        dealerB = await prisma.user.create({
            data: {
                email: 'dealerB@test.com',
                password: 'hashed',
                name: 'Dealer B',
                role: Role.DEALER
            }
        });

        admin = await prisma.user.create({
            data: {
                email: 'admin@test.com',
                password: 'hashed',
                name: 'Admin User',
                role: Role.ADMIN
            }
        });

        // Create test products
        productA = await prisma.product.create({
            data: {
                title: 'Product A',
                slug: 'product-a-test',
                description: 'Test product A',
                price: 100,
                dealerId: dealerA.id,
                published: true
            }
        });

        productB = await prisma.product.create({
            data: {
                title: 'Product B',
                slug: 'product-b-test',
                description: 'Test product B',
                price: 200,
                dealerId: dealerB.id,
                published: true
            }
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.product.deleteMany({
            where: { id: { in: [productA.id, productB.id] } }
        });
        await prisma.user.deleteMany({
            where: { id: { in: [dealerA.id, dealerB.id, admin.id] } }
        });
        await prisma.$disconnect();
    });

    describe('Product Creation', () => {
        it('DEALER can create their own products', async () => {
            const product = await ProductService.createProduct(dealerA.id, {
                title: 'Dealer A New Product',
                slug: 'dealer-a-new-test',
                description: 'New product',
                price: 150,
                published: false
            } as any);

            expect(product.dealerId).toBe(dealerA.id);

            // Cleanup
            await prisma.product.delete({ where: { id: product.id } });
        });
    });

    describe('Product Update - Ownership Validation', () => {
        it('DEALER can update their own products', async () => {
            const updated = await ProductService.updateProduct(
                productA.id,
                { id: dealerA.id, role: Role.DEALER },
                { title: 'Updated Product A' }
            );

            expect(updated.title).toBe('Updated Product A');
        });

        it('DEALER cannot update another dealer\'s product (IDOR protection)', async () => {
            await expect(
                ProductService.updateProduct(
                    productB.id,  // Product B belongs to Dealer B
                    { id: dealerA.id, role: Role.DEALER },  // But Dealer A is trying to update it
                    { title: 'Hacked Product' }
                )
            ).rejects.toMatchObject({
                statusCode: 403,
                message: expect.stringContaining('can only update your own products')
            });
        });

        it('ADMIN can update any product', async () => {
            const updated = await ProductService.updateProduct(
                productB.id,
                { id: admin.id, role: Role.ADMIN },
                { title: 'Admin Updated Product B' }
            );

            expect(updated.title).toBe('Admin Updated Product B');
        });
    });

    describe('Product Delete - Ownership Validation', () => {
        it('DEALER can delete their own products', async () => {
            const tempProduct = await prisma.product.create({
                data: {
                    title: 'Temp Product',
                    slug: 'temp-test',
                    description: 'To be deleted',
                    price: 50,
                    dealerId: dealerA.id,
                    published: false
                }
            });

            const deleted = await ProductService.deleteProduct(
                tempProduct.id,
                { id: dealerA.id, role: Role.DEALER }
            );

            expect(deleted.deletedAt).toBeTruthy();
        });

        it('DEALER cannot delete another dealer\'s product (IDOR protection)', async () => {
            await expect(
                ProductService.deleteProduct(
                    productB.id,  // Product B belongs to Dealer B
                    { id: dealerA.id, role: Role.DEALER }  // Dealer A tries to delete it
                )
            ).rejects.toMatchObject({
                statusCode: 403,
                message: expect.stringContaining('can only delete your own products')
            });
        });

        it('ADMIN can delete any product', async () => {
            const tempProduct = await prisma.product.create({
                data: {
                    title: 'Admin Delete Test',
                    slug: 'admin-delete-test',
                    description: 'To be deleted by admin',
                    price: 75,
                    dealerId: dealerB.id,
                    published: false
                }
            });

            const deleted = await ProductService.deleteProduct(
                tempProduct.id,
                { id: admin.id, role: Role.ADMIN }
            );

            expect(deleted.deletedAt).toBeTruthy();
        });
    });
});
