
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVendorData() {
    try {
        const vendors = await prisma.vendor.findMany({
            select: {
                storeName: true,
                businessAddress: true,
                vacationMode: true,
                returnPolicy: true,
                metaTitle: true,
                metaDescription: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                        dateOfBirth: true,
                        bio: true
                    }
                }
            },
            take: 5
        });

        console.log('--- Vendor Data Check ---');
        if (vendors.length === 0) {
            console.log("No vendors found.");
        } else {
            vendors.forEach((v, index) => {
                console.log(`\nVendor #${index + 1} (${v.storeName || 'No Store Name'}):`);
                console.log(`- Owner Email: ${v.owner.email}`);
                console.log(`- Business Address: ${v.businessAddress || '[EMPTY]'}`);
                console.log(`- Vacation Mode: ${v.vacationMode}`);
                console.log(`- Return Policy: ${v.returnPolicy || '[EMPTY]'}`);
                console.log(`- Meta Title: ${v.metaTitle || '[EMPTY]'}`);
                console.log(`- Meta Description: ${v.metaDescription || '[EMPTY]'}`);
                console.log(`- Owner Name: ${v.owner.name}`);
                console.log(`- Owner Phone: ${v.owner.phoneNumber || '[EMPTY]'}`);
                console.log(`- Owner DOB: ${v.owner.dateOfBirth?.toISOString() || '[EMPTY]'}`);
                console.log(`- Owner Bio: ${v.owner.bio || '[EMPTY]'}`);
            });
        }

    } catch (error) {
        console.error('Error checking vendor data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkVendorData();
