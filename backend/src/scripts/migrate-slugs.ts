
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSlugs() {
    const isDryRun = process.argv.includes('--dry-run');
    const isExecute = process.argv.includes('--execute');
    const isConfirm = process.argv.includes('--confirm');

    if (!isDryRun && !isExecute) {
        console.log('Usage: npx ts-node migrate-slugs.ts [--dry-run | --execute --confirm]');
        return;
    }

    const migrationId = `MIG-SLUG-${Date.now()}`;
    console.log(`Starting migration run: ${migrationId} (Dry Run: ${isDryRun})`);

    const subcategories = await prisma.subcategory.findMany({
        include: { category: true }
    });

    console.log(`Found ${subcategories.length} subcategories to process.`);

    let successCount = 0;
    let collisionCount = 0;
    let skipCount = 0;

    for (const sub of subcategories) {
        const parentSlug = sub.category.slug;
        const subNameSlug = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newSlug = `${parentSlug}-${subNameSlug}`;

        if (sub.slug === newSlug) {
            console.log(`[SKIP] ID ${sub.id}: Slug already correct ("${sub.slug}")`);
            skipCount++;
            continue;
        }

        // Check for potential collisions
        const existing = await prisma.subcategory.findUnique({
            where: { slug: newSlug }
        });

        if (existing) {
            console.log(`[COLLISION] ID ${sub.id}: New slug "${newSlug}" already exists! Skipping.`);
            collisionCount++;
            continue;
        }

        if (isDryRun) {
            console.log(`[DRY-RUN] ID ${sub.id}: "${sub.slug}" -> "${newSlug}" (parent: ${sub.category.name})`);
            successCount++;
        } else if (isExecute && isConfirm) {
            try {
                await prisma.$transaction(async (tx) => {
                    // Update Subcategory
                    await tx.subcategory.update({
                        where: { id: sub.id },
                        data: { slug: newSlug }
                    });

                    // Log to Audit
                    await tx.migrationAudit.create({
                        data: {
                            entityType: 'Subcategory',
                            entityId: sub.id,
                            oldData: { slug: sub.slug },
                            newData: { slug: newSlug },
                            migrationId: migrationId
                        }
                    });
                });
                console.log(`[SUCCESS] ID ${sub.id}: Migrated to "${newSlug}"`);
                successCount++;
            } catch (err) {
                console.error(`[ERROR] ID ${sub.id}: Failed to migrate:`, err);
            }
        }
    }

    console.log('\nMigration Summary:');
    console.log(`- Total processed: ${subcategories.length}`);
    console.log(`- Success/Review:  ${successCount}`);
    console.log(`- Collisions:     ${collisionCount}`);
    console.log(`- Already Correct: ${skipCount}`);

    await prisma.$disconnect();
}

migrateSlugs().catch((err) => {
    console.error('Fatal Migration Error:', err);
    process.exit(1);
});
