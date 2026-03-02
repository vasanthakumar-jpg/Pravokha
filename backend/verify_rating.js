const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findFirst({
        select: { id: true, title: true, rating: true, reviews: true }
    });
    console.log('Sample Product Rating:', product);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
