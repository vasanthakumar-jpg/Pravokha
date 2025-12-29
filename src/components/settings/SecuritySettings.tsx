import { useState } from "react";
import { Lock, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SecuritySettingsProps {
  email: string;
  preferences?: any;
  updatePreferences?: (prefs: any) => void;
}

export const SecuritySettings = ({ email, preferences, updatePreferences }: SecuritySettingsProps) => {
   const [loading, setLoading] = useState(false);
   const { toast } = useToast();

   const handleResetPassword = async () => {
      // ... (rest of logic same)
      if (!email) {
          toast({ title: "Error", description: "No email found for this user.", variant: "destructive" });
          return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        
        toast({ 
            title: "Check your email", 
            description: `We've sent a password reset link to ${email}.`,
        });
      } catch (error: any) {
        console.error("Error resetting password:", error);
        toast({ 
            title: "Error", 
            description: error.message || "Failed to send reset email.", 
            variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
   };

   return (
    <Card className="border-none shadow-lg">
      {/* ... header ... */}
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-xl md:text-2xl">Security</CardTitle>
        <CardDescription>Manage your password and security settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6 pt-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-transparent hover:border-border transition-all">
           <div className="flex gap-3 items-center">
             <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
               <Lock className="h-5 w-5" />
             </div>
             <div>
               <p className="font-medium text-sm md:text-base">Password</p>
               <p className="text-xs text-muted-foreground">Last changed 3 months ago</p>
             </div>
           </div>
           <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={loading} className="w-full md:w-auto text-xs md:text-sm">
             {loading ? "Sending..." : "Change Password"}
           </Button>
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-transparent hover:border-border transition-all">
           <div className="flex gap-3 items-center">
             <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shrink-0">
               <Smartphone className="h-5 w-5" />
             </div>
             <div>
               <p className="font-medium text-sm md:text-base">Two-Factor Auth</p>
               <p className="text-xs text-muted-foreground hidden md:block">Add an extra layer of security</p>
               <p className="text-xs text-muted-foreground md:hidden">Secure your account</p>
             </div>
           </div>
           <Switch 
              checked={preferences?.two_factor_auth || false}
              onCheckedChange={(checked) => updatePreferences && updatePreferences({ two_factor_auth: checked })}
           />
        </div>
      </CardContent>
    </Card>
   );
};
