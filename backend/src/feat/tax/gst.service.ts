import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GSTCalculation {
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    taxableAmount: number;
    totalAmount: number;
}

class GSTService {
    // State codes for India
    private readonly stateGSTCodes: Record<string, number> = {
        'ANDHRA PRADESH': 37,
        'ARUNACHAL PRADESH': 12,
        'ASSAM': 18,
        'BIHAR': 10,
        'CHHATTISGARH': 22,
        'GOA': 30,
        'GUJARAT': 24,
        'HARYANA': 6,
        'HIMACHAL PRADESH': 2,
        'JHARKHAND': 20,
        'KARNATAKA': 29,
        'KERALA': 32,
        'MADHYA PRADESH': 23,
        'MAHARASHTRA': 27,
        'MANIPUR': 14,
        'MEGHALAYA': 17,
        'MIZORAM': 15,
        'NAGALAND': 13,
        'ODISHA': 21,
        'PUNJAB': 3,
        'RAJASTHAN': 8,
        'SIKKIM': 11,
        'TAMIL NADU': 33,
        'TELANGANA': 36,
        'TRIPURA': 16,
        'UTTAR PRADESH': 9,
        'UTTARAKHAND': 5,
        'WEST BENGAL': 19,
        'DELHI': 7,
        'JAMMU AND KASHMIR': 1,
        'LADAKH': 38,
        'PUDUCHERRY': 34,
        'CHANDIGARH': 4,
        'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 26,
        'LAKSHADWEEP': 31,
        'ANDAMAN AND NICOBAR ISLANDS': 35
    };

    /**
     * Calculate GST based on seller and buyer states
     */
    calculateGST(options: {
        amount: number;
        gstRate: number;
        sellerState: string;
        buyerState: string;
        taxInclusive?: boolean;
    }): GSTCalculation {
        const { amount, gstRate, sellerState, buyerState, taxInclusive = false } = options;

        // Normalize state names
        const normalizedSellerState = sellerState.toUpperCase().trim();
        const normalizedBuyerState = buyerState.toUpperCase().trim();

        // Calculate taxable amount
        let taxableAmount = amount;
        if (taxInclusive) {
            taxableAmount = amount / (1 + gstRate / 100);
        }

        const gstAmount = taxInclusive
            ? amount - taxableAmount
            : (taxableAmount * gstRate) / 100;

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        // If same state: CGST + SGST
        // If different state: IGST
        if (normalizedSellerState === normalizedBuyerState) {
            cgst = gstAmount / 2;
            sgst = gstAmount / 2;
        } else {
            igst = gstAmount;
        }

        return {
            cgst: Number(cgst.toFixed(2)),
            sgst: Number(sgst.toFixed(2)),
            igst: Number(igst.toFixed(2)),
            totalGst: Number(gstAmount.toFixed(2)),
            taxableAmount: Number(taxableAmount.toFixed(2)),
            totalAmount: Number((taxableAmount + gstAmount).toFixed(2))
        };
    }

    /**
     * Validate GSTIN format (15 characters)
     */
    validateGSTIN(gstin: string): boolean {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstinRegex.test(gstin);
    }

    /**
     * Extract state code from GSTIN
     */
    getStateCodeFromGSTIN(gstin: string): string | null {
        if (!this.validateGSTIN(gstin)) {
            return null;
        }
        return gstin.substring(0, 2);
    }

    /**
     * Get HSN code suggestions based on product category
     */
    getHSNSuggestions(category: string): string[] {
        const categoryHSN: Record<string, string[]> = {
            'CLOTHING': ['6101', '6102', '6103', '6104', '6105', '6106'],
            'FOOTWEAR': ['6401', '6402', '6403', '6404', '6405'],
            'ELECTRONICS': ['8517', '8471', '8528', '8519', '8518'],
            'TOYS': ['9503'],
            'BOOKS': ['4901', '4902', '4903', '4904'],
            'FURNITURE': ['9401', '9403', '9404'],
            'COSMETICS': ['3304', '3305', '3306', '3307'],
            'FOOD': ['1905', '1806', '2106']
        };

        return categoryHSN[category.toUpperCase()] || [];
    }
}

export const gstService = new GSTService();
