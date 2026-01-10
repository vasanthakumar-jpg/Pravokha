import { useState, useRef } from "react";
import {
  User, Mail, Phone, MapPin, CreditCard, Bell, Shield,
  History, Upload
} from "lucide-react";

import { useToast } from "@/shared/hook/use-toast";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { useUserSettings } from "@/shared/hook/useUserSettings";
import { cn } from "@/lib/utils";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { Button } from "@/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";

// Settings Components
import { ProfileForm } from "@/feat/user/components/settings/ProfileForm";
import { AddressesManager } from "@/feat/user/components/settings/AddressesManager";
import { PaymentMethods } from "@/feat/user/components/settings/PaymentMethods";
import { NotificationSettings } from "@/feat/user/components/settings/NotificationSettings";
import { SecuritySettings } from "@/feat/user/components/settings/SecuritySettings";
import { HistorySection } from "@/feat/user/components/settings/HistorySection";

export default function UserSettings() {
  const { user } = useAuth();
  const {
    loading, profile, addresses, payments, preferences,
    updateProfile, addAddress, updateAddress, deleteAddress, updatePreferences,
    addPaymentMethod, deletePaymentMethod, history, orders, paymentHistory
  } = useUserSettings();

  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast(); // Ensure useToast is imported or available via hook
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Verify endpoint: likely /users/profile/avatar or similar, or generic upload + profile update
      // Based on previous patterns, we upload then update profile.
      // Or maybe backend has a specific route.
      // Let's use the generic upload then update profile URL.

      const { data } = await apiClient.post('/uploads/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data?.url) {
        await updateProfile({ ...profile, avatar_url: data.url });
        toast({
          title: "Success",
          description: "Profile photo updated successfully",
        });
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile photo",
        variant: "destructive",
      });
    }
  };

  // Calculate Profile Strength
  const calculateStrength = () => {
    let score = 0;
    const checks = {
      emailVerified: !!user?.email_confirmed_at || !!user?.phone_confirmed_at, // Assuming one is enough or checking both
      phoneVerified: !!profile.phone, // Simplified check, ideally check auth phone
      hasPayment: payments.length > 0,
      hasAddress: addresses.length > 0,
      hasAvatar: !!profile.avatar_url,
      hasBio: !!profile.bio,
      hasDob: !!profile.date_of_birth
    };

    if (checks.emailVerified) score += 20;
    if (checks.phoneVerified) score += 20;
    if (checks.hasPayment) score += 20;
    if (checks.hasAddress) score += 10;
    if (checks.hasAvatar) score += 10;
    if (checks.hasBio) score += 10;
    if (checks.hasDob) score += 10;

    return { score: Math.min(score, 100), checks };
  };

  const strength = calculateStrength();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20 md:pb-10">
      {/* Hero Section - Mobile Optimized */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 md:py-10">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-full opacity-75 group-hover:opacity-100 transition duration-500 blur"></div>
              <Avatar className="relative h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="text-3xl md:text-4xl font-bold bg-primary/10 text-primary">
                  {profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full shadow-lg h-9 w-9 md:h-10 md:w-10 border-2 border-background"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>

            <div className="text-center md:text-left space-y-2 w-full min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate px-2 md:px-0">
                {profile.full_name || "Welcome Back"}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 text-muted-foreground">
                <span className="flex items-center gap-1.5 text-xs md:text-sm bg-background/50 px-2.5 py-1 rounded-full border shadow-sm">
                  <Mail className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span className="truncate max-w-[150px] md:max-w-none">{profile.email}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs md:text-sm bg-background/50 px-2.5 py-1 rounded-full border shadow-sm">
                  <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  {profile.phone || "No phone"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-8">
          {/* Mobile-Friendly Sticky Navigation */}
          <div className="sticky top-[3.5rem] md:top-0 z-30 -mx-4 px-4 md:mx-0 md:px-0 bg-background/95 backdrop-blur-md md:bg-background/80 md:rounded-xl md:border md:shadow-sm py-2 md:p-1.5 transition-all">
            <div className="w-full overflow-x-auto pb-0 scrollbar-hide">
              <TabsList className="w-full justify-start md:justify-center bg-transparent gap-2 h-auto p-0 inline-flex">
                <TabItem value="profile" icon={<User className="h-4 w-4" />} label="Profile" />
                <TabItem value="addresses" icon={<MapPin className="h-4 w-4" />} label="Addresses" />
                <TabItem value="payment" icon={<CreditCard className="h-4 w-4" />} label="Payment" />
                <TabItem value="notifications" icon={<Bell className="h-4 w-4" />} label="Alerts" />
                <TabItem value="security" icon={<Shield className="h-4 w-4" />} label="Security" />
                <TabItem value="history" icon={<History className="h-4 w-4" />} label="History" />
              </TabsList>
            </div>
          </div>

          {/* Content Area with Animation */}
          <div className="max-w-5xl mx-auto anime-fade-in relative z-0">
            <TabsContent value="profile" className="space-y-6 mt-0">
              <ProfileForm
                profile={profile}
                updateProfile={updateProfile}
                loading={loading}
                strength={strength}
              />
            </TabsContent>

            <TabsContent value="addresses" className="space-y-6 mt-0">
              <AddressesManager
                addresses={addresses}
                addAddress={addAddress}
                updateAddress={updateAddress}
                deleteAddress={deleteAddress}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="payment" className="space-y-6 mt-0">
              <PaymentMethods payments={payments} addPaymentMethod={addPaymentMethod} deletePaymentMethod={deletePaymentMethod} />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-0">
              <NotificationSettings preferences={preferences} updatePreferences={updatePreferences} />
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-0">
              <SecuritySettings email={profile.email} preferences={preferences} updatePreferences={updatePreferences} />
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-0">
              <HistorySection history={history} orders={orders} payments={paymentHistory} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

const TabItem = ({ value, icon, label }: { value: string, icon: React.ReactNode, label: string }) => (
  <TabsTrigger
    value={value}
    className="flex-1 min-w-[90px] md:min-w-[100px] gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg py-2 md:py-2.5 text-xs md:text-sm transition-all duration-300 select-none"
  >
    {icon}
    <span>{label}</span>
  </TabsTrigger>
);
