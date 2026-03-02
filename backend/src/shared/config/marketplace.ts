/**
 * Marketplace Configuration
 * Centralized configuration for marketplace business rules
 */

export const MarketplaceConfig = {
  payout: {
    // Minimum payout amount in INR
    minAmount: parseInt(process.env.MIN_PAYOUT_AMOUNT || '500'),
    
    // Processing time in days
    processingDays: parseInt(process.env.PAYOUT_PROCESSING_DAYS || '7'),
    
    // Payout schedule (bi-monthly on 1st and 16th)
    schedule: {
      firstDate: 1,
      secondDate: 16
    }
  },
  
  commission: {
    // Default commission rate (0.10 = 10%)
    defaultRate: parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0.10'),
    
    // Future: Per-category rates could be loaded from database
    // categoryRates: {} 
  },
  
  verification: {
    // Auto-approve sellers when they complete all required fields
    autoApprove: process.env.AUTO_APPROVE_SELLERS === 'true',
    
    // Required fields for seller verification
    requiredFields: ['gst', 'pan', 'bankAccount', 'ifsc', 'beneficiaryName'],
    
    // Verification statuses
    statuses: {
      unverified: 'unverified',
      pending: 'pending',
      verified: 'verified',
      rejected: 'rejected'
    }
  },
  
  seller: {
    // Minimum products before going live
    minProductsToPublish: parseInt(process.env.MIN_PRODUCTS_TO_PUBLISH || '0'),
    
    // Auto-confirm orders setting
    defaultAutoConfirm: process.env.DEFAULT_AUTO_CONFIRM === 'true'
  }
};

export default MarketplaceConfig;
