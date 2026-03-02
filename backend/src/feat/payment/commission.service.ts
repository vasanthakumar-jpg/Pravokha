/**
 * Commission Service
 * 
 * Handles commission calculations for multi-vendor marketplace
 * - Platform commission: 10%
 * - Seller earning: 90%
 */

export interface CommissionResult {
  platformCommission: number;
  sellerEarning: number;
}

export interface OrderCommissionBreakdown {
  totalCommission: number;
  totalSellerEarnings: number;
  breakdown: Map<string, { commission: number; earnings: number; itemCount: number }>;
}

export class CommissionService {
  // Platform commission rate (10%)
  private static readonly PLATFORM_COMMISSION_RATE = 0.10;
  
  // Seller earning rate (90%)
  private static readonly SELLER_EARNING_RATE = 0.90;

  /**
   * Calculate commission and seller earning for a single item total
   * @param itemTotal - Total cost of the item (price * quantity)
   * @returns Commission breakdown
   */
  static calculateCommission(itemTotal: number): CommissionResult {
    // Round to 2 decimal places to avoid floating point issues
    const platformCommission = Math.round(itemTotal * this.PLATFORM_COMMISSION_RATE * 100) / 100;
    const sellerEarning = Math.round(itemTotal * this.SELLER_EARNING_RATE * 100) / 100;

    return {
      platformCommission,
      sellerEarning,
    };
  }

  /**
   * Calculate commission breakdown for an entire order with multiple vendors
   * Groups items by seller and calculates per-seller commissions
   * @param orderItems - Array of order items with seller info
   * @returns Order commission breakdown
   */
  static calculateOrderCommissions(
    orderItems: Array<{
      sellerId: string;
      price: number;
      quantity: number;
    }>
  ): OrderCommissionBreakdown {
    const breakdown = new Map<string, { commission: number; earnings: number; itemCount: number }>();
    let totalCommission = 0;
    let totalSellerEarnings = 0;

    // Group by seller and calculate
    for (const item of orderItems) {
      const itemTotal = item.price * item.quantity;
      const { platformCommission, sellerEarning } = this.calculateCommission(itemTotal);

      // Update totals
      totalCommission += platformCommission;
      totalSellerEarnings += sellerEarning;

      // Update seller breakdown
      const existing = breakdown.get(item.sellerId);
      if (existing) {
        existing.commission += platformCommission;
        existing.earnings += sellerEarning;
        existing.itemCount += 1;
      } else {
        breakdown.set(item.sellerId, {
          commission: platformCommission,
          earnings: sellerEarning,
          itemCount: 1,
        });
      }
    }

    // Round totals to avoid floating point errors
    totalCommission = Math.round(totalCommission * 100) / 100;
    totalSellerEarnings = Math.round(totalSellerEarnings * 100) / 100;

    return {
      totalCommission,
      totalSellerEarnings,
      breakdown,
    };
  }

  /**
   * Validate that commission calculations add up correctly
   * Useful for testing and debugging
   */
  static validateCommission(itemTotal: number): boolean {
    const { platformCommission, sellerEarning } = this.calculateCommission(itemTotal);
    const sum = platformCommission + sellerEarning;
    
    // Allow for small rounding differences (< 0.01)
    return Math.abs(sum - itemTotal) < 0.01;
  }
}
