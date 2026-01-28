const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Resetting ratings for products with 0 reviews...');
    
    const result = await prisma.product.updateMany({
        where: {
            reviews: 0
        },
        data: {
            rating: 0.0
        }
    });
    
    console.log(`Successfully reset ratings for ${result.count} products.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
