import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { useToast } from "@/shared/hook/use-toast";

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

    // Map backend camelCase to frontend snake_case
    const mapAddress = (data: any): Address => ({
        id: data.id,
        user_id: data.userId,
        label: data.label,
        full_name: data.fullName,
        phone: data.phone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt
    });

    // Map frontend snake_case to backend camelCase
    const mapAddressToBackend = (address: any) => ({
        label: address.label,
        fullName: address.full_name,
        phone: address.phone,
        addressLine1: address.address_line1,
        addressLine2: address.address_line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: address.is_default,
    });

    // Fetch addresses
    const fetchAddresses = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const response = await apiClient.get('/users/addresses');
            const data = response.data;
            setAddresses(data.map(mapAddress));
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
            const backendData = mapAddressToBackend(address);
            const response = await apiClient.post('/users/addresses', backendData);
            const data = response.data;

            setAddresses((prev) => [mapAddress(data), ...prev]);
            toast({
                title: "Success",
                description: "Address added successfully",
            });
            return mapAddress(data);
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
            const backendUpdates: any = {};
            if (updates.label !== undefined) backendUpdates.label = updates.label;
            if (updates.full_name !== undefined) backendUpdates.fullName = updates.full_name;
            if (updates.phone !== undefined) backendUpdates.phone = updates.phone;
            if (updates.address_line1 !== undefined) backendUpdates.addressLine1 = updates.address_line1;
            if (updates.address_line2 !== undefined) backendUpdates.addressLine2 = updates.address_line2;
            if (updates.city !== undefined) backendUpdates.city = updates.city;
            if (updates.state !== undefined) backendUpdates.state = updates.state;
            if (updates.pincode !== undefined) backendUpdates.pincode = updates.pincode;
            if (updates.is_default !== undefined) backendUpdates.isDefault = updates.is_default;

            const response = await apiClient.patch(`/users/addresses/${id}`, backendUpdates);
            const data = response.data;

            setAddresses((prev) =>
                prev.map((addr) => (addr.id === id ? mapAddress(data) : addr))
            );
            toast({
                title: "Success",
                description: "Address updated successfully",
            });
            return mapAddress(data);
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
            await apiClient.delete(`/users/addresses/${id}`);
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
