const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- START ACTIVATE ---');
    try {
        const result = await prisma.category.update({
            where: { slug: 'kids' },
            data: { status: 'active' }
        });
        console.log('Category activated:', result.name, result.status);
    } catch (e) {
        console.error('Error activating:', e);
    } finally {
        await prisma.$disconnect();
        console.log('--- END ACTIVATE ---');
    }
}

main();
