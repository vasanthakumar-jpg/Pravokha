import { prisma } from './src/infra/database/client';

async function verifyRoles() {
    const emails = ['admin@pravokha.com', 'dealer-a@pravokha.com', 'dealer-b@pravokha.com'];

    console.log('--- Verifying Database Roles ---');
    for (const email of emails) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { email: true, role: true, status: true }
        });

        if (user) {
            console.log(`User: ${user.email} | Role: ${user.role} | Status: ${user.status}`);
        } else {
            console.log(`User: ${email} | NOT FOUND`);
        }
    }
    console.log('-------------------------------');
    process.exit(0);
}

verifyRoles();
