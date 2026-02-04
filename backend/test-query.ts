import { prisma } from './src/infra/database/client';

async function test() {
    try {
        console.log('Testing prisma.order.findMany...');
        const orders = await prisma.order.findMany({
            take: 1,
            include: {
                items: {
                    include: { product: true }
                },
                vendor: true
            }
        });
        console.log('Success!', orders.length, 'orders found.');
    } catch (error: any) {
        console.error('FAILED:', error.message);
        if (error.code) console.error('Error Code:', error.code);
    } finally {
        await prisma.$disconnect();
    }
}

test();
