import { prisma } from './src/infra/database/client';

async function fix() {
    try {
        console.log('Fetching orders...');
        const orders = await (prisma as any).order.findMany();
        let fixedCount = 0;

        for (const order of orders) {
            if (!order.paymentStatus || order.paymentStatus === '') {
                console.log(`Fixing order ${order.id}...`);
                await (prisma as any).order.update({
                    where: { id: order.id },
                    data: { paymentStatus: 'UNPAID' }
                });
                fixedCount++;
            }
        }

        console.log(`Successfully fixed ${fixedCount} orders.`);
    } catch (error: any) {
        console.error('Error during fix:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
