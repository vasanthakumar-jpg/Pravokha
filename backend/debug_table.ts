import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("--- DROPPING CONSTRAINTS ---");
  try {
    await prisma.$executeRawUnsafe("ALTER TABLE vendors DROP CHECK `business_address`").catch(e => console.log("Check drop failed, trying constraint drop..."));
    await prisma.$executeRawUnsafe("ALTER TABLE vendors DROP CONSTRAINT `business_address`").catch(e => console.log("Constraint drop failed for business_address."));

    await prisma.$executeRawUnsafe("ALTER TABLE vendors DROP CHECK `payout_settings`").catch(e => console.log("Check drop failed for payout_settings..."));
    await prisma.$executeRawUnsafe("ALTER TABLE vendors DROP CONSTRAINT `payout_settings`").catch(e => console.log("Constraint drop failed for payout_settings."));

    console.log("--- DROP OPERATION COMPLETE ---");
  } catch (err) {
    console.error("Critical error during drop:", err);
  }

  const result = await prisma.$queryRawUnsafe("SHOW CREATE TABLE vendors");
  console.log("--- CREATED TABLE (POST-FIX) ---");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
