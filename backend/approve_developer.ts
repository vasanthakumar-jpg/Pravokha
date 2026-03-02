import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const userId = 'd8dd2f6c-4225-4b3c-90d0-617ef933099f';

    console.log(`--- VERIFYING USER ${userId} ---`);

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            verificationStatus: 'verified',
            status: 'active'
        }
    });

    const updatedVendor = await prisma.vendor.update({
        where: { ownerId: userId },
        data: {
            status: 'ACTIVE',
            approvedAt: new Date()
        }
    });

    console.log('User Verified:', updatedUser.verificationStatus);
    console.log('Vendor Status:', updatedVendor.status);
    console.log('--- VERIFICATION COMPLETE ---');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
