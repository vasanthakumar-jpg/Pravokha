import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.auditLog.findMany({
        where: {
            targetType: 'Product',
            actionType: 'UPDATE'
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(logs, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
