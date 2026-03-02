const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    select: { name: true, slug: true, status: true }
  });
  console.log('--- Categories ---');
  console.table(categories);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
