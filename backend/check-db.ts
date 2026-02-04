
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const products = await prisma.product.findMany({
            include: { category: true, vendor: true }
        });
        console.log('Product count:', products.length);
        if (products.length > 0) {
            console.log('First product:', JSON.stringify(products[0], null, 2));
        }

        const categories = await prisma.category.findMany();
        console.log('Category count:', categories.length);

        const vendors = await prisma.vendor.findMany();
        console.log('Vendor count:', vendors.length);
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
