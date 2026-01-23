import { AuthService } from './src/feat/auth/service';
import { prisma } from './src/infra/database/client';

async function verify() {
    const testAccounts = [
        { email: 'admin@pravokha.com', password: 'admin123', expectedRole: 'ADMIN' },
        { email: 'dealer-a@pravokha.com', password: 'dealer123', expectedRole: 'DEALER' },
        { email: 'customer1@pravokha.com', password: 'customer123', expectedRole: 'USER' }
    ];

    console.log('🔍 Starting Role Verification...\n');

    for (const account of testAccounts) {
        try {
            const result = await AuthService.login({ email: account.email, password: account.password });
            console.log(`✅ Login Successful: ${account.email}`);
            console.log(`👤 Role in DB: ${result.user.role}`);

            if (result.user.role === account.expectedRole) {
                console.log(`✨ Role Verified: ${account.expectedRole}\n`);
            } else {
                console.log(`❌ Role MISMATCH! Expected ${account.expectedRole}, got ${result.user.role}\n`);
            }
        } catch (error: any) {
            console.log(`❌ Login FAILED for ${account.email}: ${error.message}\n`);
        }
    }

    await prisma.$disconnect();
}

verify();
