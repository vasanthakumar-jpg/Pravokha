// @ts-ignore - Prisma client is generated but IDE cache may be lagging
import { PrismaClient, ShippingZone } from '@prisma/client';
import { prisma as defaultPrisma } from '../infra/database/client';

export interface ShippingCalculationResult {
    totalShippingFee: number;
    isFreeShipping: boolean;
    breakdown: {
        vendorId: string;
        vendorName: string;
        chargeableWeight: number;
        baseFee: number;
        slabFee: number;
        codFee: number;
        remoteSurcharge: number;
        expressFee: number;
        total: number;
        minDays: number;
        maxDays: number;
        zone: string;
    }[];
}

export class ShippingService {
    /**
     * Calculates the total shipping fee for an order, separated by vendor.
     */
    static async calculateShipping(
        items: { productId: string; quantity: number; sellerId: string }[],
        destinationPincode: string,
        isCod: boolean = false,
        isExpress: boolean = false,
        tx?: any // Optional transaction client
    ): Promise<ShippingCalculationResult> {
        const db = tx || defaultPrisma;

        // 1. Get destination zone mapping
        const destMapping = await db.pincodeZoneMapping.findUnique({
            where: { pincode: destinationPincode }
        });

        if (!destMapping) {
            // If pincode not mapped, use a default zone or throw unserviceable error
            // For now, let's assume a "Default" zone exists or fallback to a standard one
            throw new Error(`Shipping not available for pincode: ${destinationPincode}`);
        }

        const zone = await db.shippingZone.findUnique({
            where: { id: destMapping.zoneId }
        });

        if (!zone) {
            throw new Error(`Shipping zone configuration not found for pincode: ${destinationPincode}`);
        }

        // 2. Fetch all products to get weights and dimensions
        const productIds = items.map(i => i.productId);
        const products = await db.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                weight: true,
                length: true,
                width: true,
                height: true,
                vendorId: true,
                vendor: {
                    select: { storeName: true }
                }
            }
        });

        // 3. Group items by Vendor
        const vendorItems: Record<string, typeof items> = {};
        items.forEach(item => {
            if (!vendorItems[item.sellerId]) vendorItems[item.sellerId] = [];
            vendorItems[item.sellerId].push(item);
        });

        const breakdown: ShippingCalculationResult['breakdown'] = [];
        let totalShippingFee = 0;

        // 4. Calculate per Vendor
        for (const [vendorId, itemsList] of Object.entries(vendorItems)) {
            let totalActualWeight = 0;
            let totalVolumetricWeight = 0;

            itemsList.forEach((item: { productId: string; quantity: number; sellerId: string }) => {
                const product = products.find((p: any) => p.id === item.productId);
                if (product) {
                    totalActualWeight += (product.weight || 0.5) * item.quantity;
                    const volWeight = ((product.length || 20) * (product.width || 15) * (product.height || 5)) / 5000;
                    totalVolumetricWeight += volWeight * item.quantity;
                }
            });

            const chargeableWeight = Math.max(totalActualWeight, totalVolumetricWeight);

            // Slab Calculation: Round up to nearest 500g (0.5kg)
            // First 500g is Base Price, every additional 500g is Additional Price
            const weightInSlabs = Math.ceil(chargeableWeight / 0.5);
            const baseFee = zone.baseSlabPrice;
            const additionalSlabs = Math.max(0, weightInSlabs - 1);
            const slabFee = additionalSlabs * zone.additionalSlabPrice;

            let codFee = isCod ? zone.codFee : 0;
            let remoteSurcharge = destMapping.isRemote ? zone.remoteSurcharge : 0;

            let vendorTotal = baseFee + slabFee + codFee + remoteSurcharge;

            // Apply Express Multiplier
            let expressFee = 0;
            if (isExpress) {
                expressFee = vendorTotal * (zone.expressMultiplier - 1);
                vendorTotal *= zone.expressMultiplier;
            }

            // Estimate Delivery Days
            let minDays = zone.minDays;
            let maxDays = zone.maxDays;
            if (destMapping.isRemote) {
                minDays += 2; // Remote areas take longer
                maxDays += 3;
            }
            if (isExpress) {
                minDays = Math.max(1, minDays - 2);
                maxDays = Math.max(2, maxDays - 3);
            }

            const firstProduct = products.find((p: { id: string; weight: number | null; length: number | null; width: number | null; height: number | null; vendorId: string; vendor: { storeName: string | null; } | null; }) => p.vendorId === vendorId);
            const vendorName = firstProduct?.vendor?.storeName || "Vendor";

            breakdown.push({
                vendorId,
                vendorName,
                chargeableWeight: Number(chargeableWeight.toFixed(2)),
                baseFee,
                slabFee,
                codFee,
                remoteSurcharge,
                expressFee: Number(expressFee.toFixed(2)),
                total: Number(vendorTotal.toFixed(2)),
                minDays,
                maxDays,
                zone: zone.zoneName
            });

            totalShippingFee += vendorTotal;
        }

        // 5. Check Free Shipping Threshold (Site-wide or Global)
        const settings = await db.siteSetting.findUnique({ where: { id: "primary" } });
        const subtotal = items.reduce((sum, item) => {
            // Price should be passed or fetched. For calculation logic we focus on fee.
            return sum;
        }, 0);

        // Note: The caller (Controller) should handle the free shipping threshold logic 
        // against the order subtotal. We return the calculated fee.

        return {
            totalShippingFee: Number(totalShippingFee.toFixed(2)),
            isFreeShipping: false, // Default, handled by caller
            breakdown
        };
    }
}
