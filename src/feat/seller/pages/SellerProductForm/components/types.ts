export interface ColorOption {
    id: string;
    name: string;
    hex: string;
}

export interface ProductFormData {
    title: string;
    description: string;
    category: string;
    selectedCategoryId: string;
    selectedSubcategoryId: string;
    price: string;
    discountPrice: string;
    stockQuantity: string;
    selectedColors: ColorOption[];
    selectedSizes: string[];
    sizeStock: Record<string, number>;
    unavailableVariants: string[];
    variantImages: Record<string, File[]>;
    variantPreviews: Record<string, string[]>;
    existingVariantImages: Record<string, string[]>;
    imagesToDelete: string[];
    sku: string;
    tags: string[];
}

export interface StepProps {
    formData: ProductFormData;
    onChange: (field: keyof ProductFormData, value: any) => void;
    errors: Record<string, string>;
}

export const getStockKey = (color: string, size: string) => `${color}-${size}`;
