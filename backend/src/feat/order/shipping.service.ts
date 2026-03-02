import { prisma } from '../../infra/database/client';

export class ShippingService {
    /**
     * Simulates generating an Airway Bill (AWB) from a courier provider like Shiprocket.
     */
    static async generateAwb(orderId: string, carrier: string = 'Shiprocket'): Promise<string> {
        console.log(`[ShippingService] Generating AWB for order ${orderId} via ${carrier}...`);

        // In a real world app, this would be an API call to Shiprocket/Delhivery
        // For simulation, we generate a professional AWB format
        const prefix = carrier === 'Shiprocket' ? 'SR' : 'CX';
        const randomPart = Math.floor(100000000 + Math.random() * 900000000);
        const awb = `${prefix}${randomPart}`;

        return awb;
    }

    /**
     * Updates an order with an automated AWB if one isn't provided.
     */
    static async autoAssignAwb(orderId: string): Promise<void> {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.trackingNumber) return;

        const awb = await this.generateAwb(orderId);

        await prisma.order.update({
            where: { id: orderId },
            data: {
                trackingNumber: awb,
                trackingCarrier: 'Shiprocket'
            }
        });

        console.log(`[ShippingService] Auto-assigned AWB ${awb} to order ${orderId}`);
    }
}
