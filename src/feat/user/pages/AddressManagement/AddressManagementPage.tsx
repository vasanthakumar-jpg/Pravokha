import React, { useState, useEffect } from "react";
import { Plus, MapPin, Phone, User, Trash2, Edit2, Star, Check } from "lucide-react";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/ui/Dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/ui/Select";
import { useToast } from "@/shared/hook/use-toast";
import { apiClient } from "@/infra/api/apiClient";
import { cn } from "@/lib/utils";
import { addressSchema } from "@/shared/validation/user.schema";
import { ZodError } from "zod";

interface Address {
    id: string;
    name: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
    type: string;
}

const AddressManagementPage: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState<Partial<Address>>({
        name: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        type: "HOME",
        isDefault: false
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const { toast } = useToast();

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const response = await apiClient.get("/users/addresses");
            // Backend might return raw data or wrapped in success object
            const data = response.data.success !== undefined ? response.data.data : response.data;
            setAddresses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching addresses:", error);
            toast({
                title: "Error",
                description: "Failed to load addresses",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenDialog = (address?: Address) => {
        if (address) {
            setEditingAddress(address);
            setFormData(address);
        } else {
            setEditingAddress(null);
            setFormData({
                name: "",
                phoneNumber: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                pincode: "",
                type: "HOME",
                isDefault: addresses.length === 0
            });
        }
        setIsDialogOpen(true);
        setFormErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        try {
            addressSchema.parse(formData);
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string> = {};
                error.errors.forEach(err => {
                    if (err.path[0]) errors[err.path[0].toString()] = err.message;
                });
                setFormErrors(errors);
                return;
            }
        }

        try {
            if (editingAddress) {
                await apiClient.patch(`/users/addresses/${editingAddress.id}`, formData);
                toast({ title: "Success", description: "Address updated successfully" });
            } else {
                await apiClient.post("/users/addresses", formData);
                toast({ title: "Success", description: "Address added successfully" });
            }
            setIsDialogOpen(false);
            fetchAddresses();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save address",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await apiClient.delete(`/users/addresses/${id}`);
            toast({ title: "Deleted", description: "Address removed" });
            fetchAddresses();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete address",
                variant: "destructive"
            });
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await apiClient.patch(`/users/addresses/${id}`, { isDefault: true });
            toast({ title: "Success", description: "Default address updated" });
            fetchAddresses();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update default address",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Address Book</h1>
                    <p className="text-muted-foreground">Manage your shipping addresses for a faster checkout.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <Card key={i} className="animate-pulse bg-muted h-48"></Card>
                    ))}
                </div>
            ) : addresses.length === 0 ? (
                <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-primary/5 rounded-full mb-4">
                        <MapPin className="h-8 w-8 text-primary opacity-50" />
                    </div>
                    <CardTitle>No addresses found</CardTitle>
                    <CardDescription className="max-w-[250px] mt-2">
                        You haven't saved any addresses yet. Add one to make ordering easier.
                    </CardDescription>
                    <Button variant="outline" className="mt-6" onClick={() => handleOpenDialog()}>
                        Add your first address
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <Card key={address.id} className={cn(
                            "relative transition-all duration-300",
                            address.isDefault ? "ring-2 ring-primary shadow-lg" : "hover:border-primary/50"
                        )}>
                            {address.isDefault && (
                                <div className="absolute -top-3 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current" />
                                    Default
                                </div>
                            )}
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{address.name}</span>
                                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-medium text-muted-foreground uppercase">
                                                {address.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Phone className="h-3 w-3 mr-2" />
                                            {address.phoneNumber}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(address)} className="h-8 w-8">
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        {!address.isDefault && (
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(address.id)} className="h-8 w-8 text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>{address.addressLine1}</p>
                                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                                    <p>{address.city}, {address.state} - {address.pincode}</p>
                                </div>
                                {!address.isDefault && (
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto mt-4 text-xs font-semibold text-primary"
                                        onClick={() => handleSetDefault(address.id)}
                                    >
                                        Set as Default
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                        <DialogDescription>
                            Enter the details for your shipping delivery.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="John Doe" />
                                {formErrors.name && <p className="text-[10px] text-destructive">{formErrors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required placeholder="10-digit number" />
                                {formErrors.phoneNumber && <p className="text-[10px] text-destructive">{formErrors.phoneNumber}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="addressLine1">Street Address</Label>
                            <Input id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} required placeholder="Building, Street, Area" />
                            {formErrors.addressLine1 && <p className="text-[10px] text-destructive">{formErrors.addressLine1}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="addressLine2">Apartment, Suite, etc. (Optional)</Label>
                            <Input id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} placeholder="Floor, Flat No." />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                                {formErrors.city && <p className="text-[10px] text-destructive">{formErrors.city}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                                {formErrors.state && <p className="text-[10px] text-destructive">{formErrors.state}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pincode</Label>
                                <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
                                {formErrors.pincode && <p className="text-[10px] text-destructive">{formErrors.pincode}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Address Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HOME">Home</SelectItem>
                                        <SelectItem value="WORK">Work</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    checked={formData.isDefault}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                                />
                                <Label htmlFor="isDefault" className="text-sm font-medium">Set as default</Label>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingAddress ? "Update" : "Save"} Address</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AddressManagementPage;
