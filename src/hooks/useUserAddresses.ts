import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Address {
    id: string;
    user_id: string;
    label: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export function useUserAddresses() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch addresses
    const fetchAddresses = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("user_addresses" as any)
                .select("*")
                .eq("user_id", user.id)
                .order("is_default", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAddresses((data as unknown as Address[]) || []);
        } catch (error: any) {
            console.error("Error fetching addresses:", error);
            toast({
                title: "Error",
                description: "Failed to load addresses",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Add address
    const addAddress = async (address: Omit<Address, "id" | "user_id" | "created_at" | "updated_at">) => {
        if (!user) return;

        try {
            // If this is set as default, unset others first
            if (address.is_default) {
                await supabase
                    .from("user_addresses" as any)
                    .update({ is_default: false })
                    .eq("user_id", user.id);
            }

            const { data, error } = await supabase
                .from("user_addresses" as any)
                .insert({ ...address, user_id: user.id })
                .select()
                .single();

            if (error) throw error;

            setAddresses((prev) => [data as unknown as Address, ...prev]);
            toast({
                title: "Success",
                description: "Address added successfully",
            });
            return data as unknown as Address;
        } catch (error: any) {
            console.error("Error adding address:", error);
            toast({
                title: "Error",
                description: "Failed to add address",
                variant: "destructive",
            });
            throw error;
        }
    };

    // Update address
    const updateAddress = async (id: string, updates: Partial<Address>) => {
        if (!user) return;

        try {
            // If setting as default, unset others first
            if (updates.is_default) {
                await supabase
                    .from("user_addresses" as any)
                    .update({ is_default: false })
                    .eq("user_id", user.id)
                    .neq("id", id);
            }

            const { data, error } = await supabase
                .from("user_addresses" as any)
                .update(updates)
                .eq("id", id)
                .eq("user_id", user.id)
                .select()
                .single();

            if (error) throw error;

            setAddresses((prev) =>
                prev.map((addr) => (addr.id === id ? (data as unknown as Address) : addr))
            );
            toast({
                title: "Success",
                description: "Address updated successfully",
            });
            return data as unknown as Address;
        } catch (error: any) {
            console.error("Error updating address:", error);
            toast({
                title: "Error",
                description: "Failed to update address",
                variant: "destructive",
            });
            throw error;
        }
    };

    // Delete address
    const deleteAddress = async (id: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("user_addresses" as any)
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

            setAddresses((prev) => prev.filter((addr) => addr.id !== id));
            toast({
                title: "Success",
                description: "Address deleted successfully",
            });
        } catch (error: any) {
            console.error("Error deleting address:", error);
            toast({
                title: "Error",
                description: "Failed to delete address",
                variant: "destructive",
            });
            throw error;
        }
    };

    // Set default address
    const setDefaultAddress = async (id: string) => {
        await updateAddress(id, { is_default: true });
    };

    useEffect(() => {
        fetchAddresses();
    }, [user]);

    return {
        addresses,
        loading,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        refetch: fetchAddresses,
    };
}
