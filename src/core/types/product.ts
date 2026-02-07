export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'ARCHIVED';

export interface ProductSize {
    id: string;
    size: string;
    stock: number;
}

export interface ProductVariant {
    id: string;
    colorName: string;
    colorHex: string;
    images: string[];
    sizes: ProductSize[];
}

export interface Product {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    discountPrice?: number | null;
    status: ProductStatus;
    isBlocked: boolean;
    stock: number;
    sku: string;
    categoryId: string;
    category?: {
        id: string;
        name: string;
        slug: string;
        parentId?: string | null;
    };
    variants: ProductVariant[];
    sellerId?: string;
    vendor?: {
        id: string;
        storeName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    id: string;
    productId: string;
    product?: Partial<Product>;
    variantId?: string;
    colorName?: string;
    size?: string;
    quantity: number;
    price: number;
    priceAtPurchase: number;
    image?: string;
    sellerId?: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalAmount: number;
    taxAmount: number;
    shippingFee: number;
    shippingAddress: string;
    shippingCity: string;
    shippingPincode: string;
    trackingNumber?: string;
    items: OrderItem[];
    history?: any[];
    createdAt: string;
    updatedAt: string;
}
