const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  const categories = await prisma.category.findMany();
  console.log('Categories:', JSON.stringify(categories, null, 2));
  
  const productsWithKidsCategory = await prisma.product.findMany({
    where: { 
      OR: [
        { title: { contains: 'kids' } },
        { category: { name: { contains: 'kids' } } }
      ]
    },
    include: { category: true }
  });
  console.log('Products matching Kids:', JSON.stringify(productsWithKidsCategory.map(p => ({ id: p.id, title: p.title, category: p.category })), null, 2));
  
  await prisma.$disconnect();
}

checkCategories().catch(e => {
  console.error(e);
  process.exit(1);
});
