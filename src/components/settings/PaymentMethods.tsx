import { useState } from "react";
import { Plus, Loader2, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Loader } from "lucide-react"; // Wait, Loader2 is used. Loader not used in previous code.
// I will stick to what I saw.

// Props interface
interface PaymentMethodsProps {
  payments: any[];
  addPaymentMethod: (data: any) => Promise<any>;
  deletePaymentMethod: (id: string) => Promise<any>;
}

export const PaymentMethods = ({ payments, addPaymentMethod, deletePaymentMethod }: PaymentMethodsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    card_holder_name: "",
    card_last4: "",
    card_brand: "Visa",
    card_exp_month: "",
    card_exp_year: "",
    is_default: false
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await addPaymentMethod({
        ...form,
        card_exp_month: parseInt(form.card_exp_month),
        card_exp_year: parseInt(form.card_exp_year),
        type: 'card'
      });
      setIsOpen(false);
      setForm({
        card_holder_name: "",
        card_last4: "",
        card_brand: "Visa",
        card_exp_month: "",
        card_exp_year: "",
        is_default: false
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Payment Methods</h2>
        <p className="text-muted-foreground text-sm">Manage your saved cards and UPI.</p>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
           <Button className="w-full sm:w-auto gap-2"><Plus className="h-4 w-4" /> Add Method</Button>
        </DialogTrigger>
        <DialogContent>
           <DialogHeader>
             <DialogTitle>Add New Card</DialogTitle>
             <DialogDescription>Securely save your card details for faster checkout.</DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
              <div className="space-y-2">
                 <Label>Card Holder Name</Label>
                 <Input 
                   placeholder="Name as on card" 
                   value={form.card_holder_name}
                   onChange={e => setForm({...form, card_holder_name: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <Label>Card Number (Last 4 Digits only for demo)</Label>
                 <Input 
                   placeholder="1234" maxLength={4}
                   value={form.card_last4}
                   onChange={e => setForm({...form, card_last4: e.target.value})}
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Expiry Month</Label>
                    <Input placeholder="MM" maxLength={2} value={form.card_exp_month} onChange={e => setForm({...form, card_exp_month: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label>Expiry Year</Label>
                    <Input placeholder="YYYY" maxLength={4} value={form.card_exp_year} onChange={e => setForm({...form, card_exp_year: e.target.value})} />
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Switch checked={form.is_default} onCheckedChange={c => setForm({...form, is_default: c})} />
                 <Label>Set as default</Label>
              </div>
           </div>
           <DialogFooter>
             <Button onClick={handleSave} disabled={loading}>
               {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Card"}
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      {/* Show only if cards exist or show a placeholder/default */}
      {payments.length > 0 ? payments.map((p: any) => (
        <div key={p.id} className="relative aspect-[1.586/1] w-full max-w-[400px] mx-auto md:mx-0 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
           <div className="absolute top-0 right-0 p-24 md:p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           {/* DELETE BUTTON */}
           <Button 
             variant="ghost" 
             size="icon" 
             className="absolute top-2 right-2 text-white/50 hover:text-white hover:bg-white/10 z-20"
             onClick={() => deletePaymentMethod(p.id)}
           >
             <Trash2 className="h-4 w-4" />
           </Button>

           <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                 <div className="text-xs opacity-75 uppercase tracking-wider">Credit Card</div>
                 <CreditCard className="h-5 w-5 md:h-6 md:w-6 opacity-80" />
              </div>
              <div className="space-y-4 md:space-y-6">
                <div className="text-xl md:text-2xl font-mono tracking-wider">**** **** **** {p.last4}</div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] md:text-xs opacity-75 uppercase tracking-wider mb-1">Card Holder</div>
                    <div className="font-medium text-sm md:text-base truncate max-w-[120px]">{p.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] md:text-xs opacity-75 uppercase tracking-wider mb-1">Expires</div>
                    <div className="font-medium text-sm md:text-base">{p.expiry}</div>
                  </div>
                </div>
              </div>
           </div>
           {/* Shiny effect */}
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
        </div>
      )) : (
        <div className="col-span-full py-12 text-center border-dashed border-2 rounded-xl bg-muted/10">
           <CreditCard className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground/30 mb-4" />
           <p className="text-muted-foreground text-sm md:text-base">No payment methods saved.</p>
        </div>
      )}
    </div>
  </div>
  );
};
