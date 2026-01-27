
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { CategoryController } from '../feat/category/controller';

const prisma = new PrismaClient();

// Mock Express Objects
const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.data = data;
        return res;
    };
    return res;
};

async function verifyFixes() {
    console.log("Starting Verification Suite...");

    try {
        // 1. Verify Scoped Slug Logic
        console.log("\n[TEST] Subcategory Scoped Slug Generation");

        // precise setup
        const testCategoryName = `Test-Cat-${Date.now()}`;
        const testCategory = await prisma.category.create({
            data: { name: testCategoryName, slug: testCategoryName.toLowerCase() }
        });

        const req: any = {
            body: {
                name: 'Sub Item',
                categoryId: testCategory.id
            }
        };
        const res = mockResponse();

        const next = (err: any) => console.error("Next called with:", err); // Mock next

        await CategoryController.createSubcategory(req, res, next);

        if (res.statusCode === 201) {
            console.log("✅ Subcategory created successfully");
            console.log("   Slug:", res.data.data.slug);

            const expectedPrefix = `${testCategory.slug}-sub-item`;
            if (res.data.data.slug.startsWith(expectedPrefix)) {
                console.log("✅ Slug is correctly scoped");
            } else {
                console.error("❌ Slug NOT scoped properly. Got:", res.data.data.slug);
            }
        } else {
            console.error("❌ Failed to create subcategory", res.data);
        }

        // Cleanup
        await prisma.category.delete({ where: { id: testCategory.id } });

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFixes();
