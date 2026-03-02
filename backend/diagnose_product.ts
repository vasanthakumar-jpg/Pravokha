import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const id = '26ba097b-69be-4d1c-a6b2-4f9e77d8a95c';
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            variants: {
                include: {
                    sizes: true
                }
            }
        }
    });
    console.log(JSON.stringify(product, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
