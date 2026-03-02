
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
    try {
        const hashedPassword = await bcrypt.hash('12345678', 10);

        const users = ['admin@pravokha.com', 'seller@pravokha.com', 'user@pravokha.com'];

        for (const email of users) {
            const user = await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log(`Password reset for ${user.email} (ID: ${user.id})`);
        }

        console.log("All default passwords reset to '12345678'");
    } catch (e) {
        console.error("Error resetting passwords:", e);
    } finally {
        await prisma.$disconnect();
    }
}

resetPasswords();
