import { useState } from "react";
import { Plus, Loader2, Home, Briefcase, MapPin, MoreVertical, Edit2, Star, Trash2, Phone } from "lucide-react";
import { Button } from "@/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/Dialog";
import { Label } from "@/ui/Label";
import { Input } from "@/ui/Input";
import { Switch } from "@/ui/Switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/DropdownMenu";
import { Badge } from "@/ui/Badge";
import { cn } from "@/lib/utils";
import { Address } from "@/shared/hook/useUserSettings";
import { useToast } from "@/shared/hook/use-toast";

interface AddressesManagerProps {
  addresses: Address[];
  addAddress: (addr: Omit<Address, 'id'>) => Promise<any>;
  updateAddress: (id: string, addr: Partial<Address>) => Promise<any>;
  deleteAddress: (id: string) => Promise<any>;
  loading: boolean;
}

export const AddressesManager = ({ addresses, addAddress, updateAddress, deleteAddress, loading }: AddressesManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState<Omit<Address, 'id'>>({
    label: "Home",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false
  });

  const { toast } = useToast();

  const handleSubmit = async () => {
    // Validation
    if (!form.full_name || !form.phone || !form.address_line1 || !form.city || !form.state || !form.pincode) {
        toast({
            title: "Error",
            description: "Please fill in all required fields",
            variant: "destructive",
        });
        return;
    }

    // Pincode validation (assuming 6 digits for Indian pincode as per constraint likely)
    if (!/^\d{6}$/.test(form.pincode)) {
        toast({
            title: "Error",
            description: "Pincode must be exactly 6 digits",
            variant: "destructive",
        });
        return;
    }

    if (editingId) {
      await updateAddress(editingId, form);
    } else {
      await addAddress(form);
    }
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      label: "Home",
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pincode: "",
      is_default: false
    });
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      full_name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: addr.is_default
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Shipping Addresses</h2>
          <p className="text-muted-foreground text-sm">Manage your shipping locations.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Address" : "Add New Address"}</DialogTitle>
              <DialogDescription>
                 Enter your delivery details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Type Selection - Scrollable on mobile */}
              <div className="space-y-3">
                 <Label>Address Type</Label>
                 <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {['Home', 'Office', 'Other'].map(l => (
                      <div 
                        key={l}
                        onClick={() => setForm({...form, label: l})}
                        className={cn(
                          "cursor-pointer px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all min-w-fit",
                          form.label === l 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-muted hover:border-muted-foreground/50"
                        )}
                      >
                         {l === 'Home' ? <Home className="h-4 w-4" /> : 
                          l === 'Office' ? <Briefcase className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                         <span className="font-medium">{l}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Recipient Name</Label>
                     <Input 
                        value={form.full_name} 
                        onChange={e => setForm({...form, full_name: e.target.value})}
                        placeholder="Who receives this?"
                        className="h-10"
                      />
                   </div>
                   <div className="space-y-2">
                     <Label>Phone Number</Label>
                     <Input 
                        value={form.phone} 
                        onChange={e => setForm({...form, phone: e.target.value})}
                        placeholder="+91 98765 43210"
                        className="h-10"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                  <Label>Address Line 1</Label>
                  <Input 
                    value={form.address_line1} 
                    onChange={e => setForm({...form, address_line1: e.target.value})}
                    placeholder="Street, House No."
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>City</Label>
                    <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} className="h-10" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 bg-muted/30 p-3 rounded-lg border border-dashed">
                  <Switch 
                    checked={form.is_default} 
                    onCheckedChange={c => setForm({...form, is_default: c})} 
                  />
                  <Label className="font-normal cursor-pointer" onClick={() => setForm({...form, is_default: !form.is_default})}>
                    Set as default shipping address
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Address"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {addresses.map((addr: Address) => (
          <Card key={addr.id} className={cn(
            "relative group border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden",
            addr.is_default ? "ring-2 ring-primary/20 bg-primary/5" : "bg-card"
          )}>
            <div className="absolute top-0 right-0 p-2 md:p-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => startEdit(addr)} className="cursor-pointer gap-2 py-2.5">
                    <Edit2 className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateAddress(addr.id, { is_default: true })} disabled={addr.is_default} className="cursor-pointer gap-2 py-2.5">
                    <Star className="h-4 w-4" /> Set Default
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive cursor-pointer gap-2 py-2.5" onClick={() => deleteAddress(addr.id)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-3 pr-10">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center shrink-0",
                  addr.label === 'Home' ? "bg-blue-100 text-blue-600" :
                  addr.label === 'Office' ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-orange-600"
                )}>
                  {addr.label === 'Home' ? <Home className="h-5 w-5 md:h-6 md:w-6" /> : 
                   addr.label === 'Office' ? <Briefcase className="h-5 w-5 md:h-6 md:w-6" /> : <MapPin className="h-5 w-5 md:h-6 md:w-6" />}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    {addr.label}
                    {addr.is_default && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary px-1.5 py-0 h-5">Default</Badge>}
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm truncate max-w-[150px] md:max-w-none">{addr.full_name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0 text-sm md:text-base text-muted-foreground space-y-1">
              <div className="line-clamp-2 min-h-[2.5rem]">
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
              </div>
              <p className="truncate">{addr.city}, {addr.state} - {addr.pincode}</p>
              <p className="pt-3 flex items-center gap-2 text-foreground/80 text-sm">
                <Phone className="h-3.5 w-3.5" /> {addr.phone}
              </p>
            </CardContent>
          </Card>
        ))}
        {addresses.length === 0 && (
           <div className="col-span-full py-12 text-center border-dashed border-2 rounded-xl bg-muted/10">
             <MapPin className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground/30 mb-4" />
             <p className="text-muted-foreground text-sm md:text-base">No addresses saved yet.</p>
           </div>
        )}
      </div>
    </div>
  );
};

