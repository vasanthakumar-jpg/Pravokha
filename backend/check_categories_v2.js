const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- START ---');
    try {
        const categories = await prisma.category.findMany();
        console.log('Categories found:', categories.length);
        categories.forEach(c => {
            console.log(` - ${c.name} (slug: ${c.slug}, status: ${c.status})`);
        });

        const kidsCategory = categories.find(c => c.name.toLowerCase().includes('kids') || c.slug.toLowerCase().includes('kids'));
        if (kidsCategory) {
            console.log('Kids category exists:', kidsCategory.id);
            const products = await prisma.product.count({ where: { categoryId: kidsCategory.id } });
            console.log('Products in Kids category:', products);
        } else {
            console.log('Kids category NOT found by name/slug.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
        console.log('--- END ---');
    }
}

main();
