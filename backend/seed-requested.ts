import { prisma } from './src/infra/database/client';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

async function seed() {
    const users = [
        { email: 'admin@pravokha.com', password: '12345678', name: 'Admin User', role: Role.ADMIN },
        { email: 'seller@pravokha.com', password: '12345678', name: 'Seller User', role: Role.DEALER },
        { email: 'user@pravokha.com', password: '12345678', name: 'Test User', role: Role.USER }
    ];

    console.log('🚀 Seeding requested test users...');

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password: hashedPassword,
                role: u.role,
                status: 'active',
                verificationStatus: 'verified'
            },
            create: {
                email: u.email,
                password: hashedPassword,
                name: u.name,
                role: u.role,
                status: 'active',
                verificationStatus: 'verified'
            }
        });
        console.log(`✅ User ${u.email} set up as ${u.role}`);
    }

    await prisma.$disconnect();
    console.log('✨ Seeding complete!');
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
