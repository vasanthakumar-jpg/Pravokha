
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, name: true }
        });
        console.log("Users found:", users);
    } catch (e) {
        console.error("Error fetching users:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
