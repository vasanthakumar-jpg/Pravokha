import { prisma } from './src/infra/database/client';

async function main() {
    try {
        const columns: any[] = await prisma.$queryRawUnsafe('DESCRIBE orders');
        const paymentCol = columns.find(c => c.Field.toLowerCase().includes('paymentstatus'));
        console.log('Payment Column:', paymentCol);

        if (paymentCol) {
            console.log('Attempting fix...');
            const fieldName = paymentCol.Field;
            const updated = await prisma.$executeRawUnsafe(`UPDATE orders SET ${fieldName} = 'UNPAID' WHERE ${fieldName} = '' OR ${fieldName} IS NULL`);
            console.log('Rows updated:', updated);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
