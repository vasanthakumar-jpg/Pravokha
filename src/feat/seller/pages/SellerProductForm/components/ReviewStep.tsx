import React from "react";
import { cn } from "@/lib/utils";
import { ProductFormData } from "./types";

interface ReviewStepProps {
    isAdmin: boolean;
    formData: ProductFormData;
    onChange: (field: keyof ProductFormData, value: any) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
    isAdmin,
    formData,
    onChange
}) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                {/* Attributes Summary or other review items can go here if needed later */}
                <div className="bg-muted/30 p-4 rounded-xl border border-dashed text-center">
                    <p className="text-sm text-muted-foreground italic">
                        Please review all previous steps before finalizing. All data has been captured.
                    </p>
                </div>
            </div>

        </div>
    );
};
