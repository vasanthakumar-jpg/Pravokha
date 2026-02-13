const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySearch() {
  const searchTerm = 'Molestiae'; // Title of one of the combo offers
  console.log(`Verifying search for: "${searchTerm}"`);

  // SMARTER PROMOTION SEARCH LOGIC (SIMULATED)
  const comboMatches = await prisma.comboOffer.findMany({
    where: {
        active: true,
        OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } }
        ]
    },
    select: { productIds: true }
  });

  console.log('Combo Matches:', JSON.stringify(comboMatches, null, 2));

  const comboProductIdsSet = new Set();
  comboMatches.forEach(combo => {
    if (combo.productIds) {
      try {
        const ids = typeof combo.productIds === 'string' ? JSON.parse(combo.productIds) : combo.productIds;
        if (Array.isArray(ids)) ids.forEach(id => comboProductIdsSet.add(id));
        else if (typeof ids === 'string' && ids.length > 0) comboProductIdsSet.add(ids);
      } catch (e) {}
    }
  });

  const promotionIds = Array.from(comboProductIdsSet);
  console.log('Derived Promotion Product IDs/Slugs:', promotionIds);

  if (promotionIds.length > 0) {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { id: { in: promotionIds } },
          { slug: { in: promotionIds } }
        ]
      },
      select: { title: true, slug: true }
    });
    console.log('Search Results (Products found via Combo link):');
    console.table(products);
  } else {
    console.log('No combo product IDs found for this search term.');
  }
}

verifySearch()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
