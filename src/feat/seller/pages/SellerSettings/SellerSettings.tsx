
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { useSearchParams } from "react-router-dom";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";
import { Switch } from "@/ui/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { Upload, Store, FileText, Shield, ShieldAlert, Clock, AlertTriangle, Loader2, Save, BadgeCheck, Building2, CreditCard, Settings, Image as ImageIcon, User, Camera } from "lucide-react";
import { useSellerSettings, SellerProfile } from "@/shared/hook/useSellerSettings";
import { useProfile } from "@/shared/hook/useProfile";
import { useAuth } from "@/core/context/AuthContext";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/Form";
import { useToast } from "@/shared/hook/use-toast";
import { Separator } from "@/ui/Separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import { apiClient } from "@/infra/api/apiClient";
import { Badge } from "@/ui/Badge";

// Validation Schema (Seller Store)
const formSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters").max(50),
  storeDescription: z.string().max(300, "Description is too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9+\s-]{10,}$/, "Invalid phone number"),
  address: z.string().min(10, "Address is too short (min 10 characters)"),

  // Business - Validation Logic
  gst: z.string()
    .transform(v => v?.toUpperCase())
    .pipe(
      z.string()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST Number Format (e.g., 22AAAAA0000A1Z5)")
        .or(z.literal(""))
    )
    .optional(),
  pan: z.string()
    .transform(v => v?.toUpperCase())
    .pipe(
      z.string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number Format (e.g., ABCDE1234F)")
        .or(z.literal(""))
    )
    .optional(),

  // Bank
  bankAccount: z.string().min(8, "Account number must be at least 8 digits").optional().or(z.literal("")),
  ifsc: z.string()
    .transform(v => v?.toUpperCase())
    .pipe(
      z.string()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code (e.g., HDFC0001234)")
        .or(z.literal(""))
    )
    .optional(),
  beneficiaryName: z.string().min(2, "Beneficiary name is too short").optional().or(z.literal("")),

  // Config
  vacationMode: z.boolean(),
  autoConfirm: z.boolean(),
  returnPolicy: z.string(),
  storeLogoUrl: z.string().nullable().optional(),
  storeBannerUrl: z.string().nullable().optional(),
  metaTitle: z.string().max(60, "Meta title should be under 60 characters").optional().or(z.literal("")).default(""),
  metaDescription: z.string().max(160, "Meta description should be under 160 characters").optional().or(z.literal("")).default(""),
});

const INITIAL_FORM_VALUES: SellerProfile = {
  storeName: "",
  storeDescription: "",
  email: "",
  phone: "",
  address: "",
  gst: "",
  pan: "",
  bankAccount: "",
  ifsc: "",
  beneficiaryName: "",
  vacationMode: false,
  autoConfirm: true,
  returnPolicy: "",
  storeLogoUrl: null,
  storeBannerUrl: null,
  metaTitle: "",
  metaDescription: "",
};

export default function SellerSettings() {
  const { user } = useAuth();
  // Seller Store Hooks
  const { settings, loading, saving, uploading, saveSettings, uploadImage } = useSellerSettings();
  // Personal Profile Hooks
  const { profile, updateProfile } = useProfile(user?.id);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");
  const { toast } = useToast();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && activeTab !== tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Hidden File Inputs Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Local state for profile (separate from store form)
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileDob, setProfileDob] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const form = useForm<SellerProfile>({
    resolver: zodResolver(formSchema),
    defaultValues: INITIAL_FORM_VALUES,
    mode: "onChange",
  });

  // Sync hook data to form when loaded
  useEffect(() => {
    if (!loading && settings) {
      form.reset(settings);
    }
  }, [loading, settings, form]);

  // Sync profile fields
  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name || "");
      setProfilePhone(profile.phone || "");
      setProfileBio(profile.bio || "");
      setProfileDob(profile.date_of_birth || "");
    }
  }, [profile]);

  // --- HANDLERS ---

  const handleProfileSave = async () => {
    if (!profileName.trim()) {
      toast({ title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    setUpdatingProfile(true);
    try {
      await updateProfile({
        full_name: profileName,
        phone: profilePhone,
        bio: profileBio,
        date_of_birth: profileDob
      });
      toast({
        title: "Profile Updated",
        description: "Your personal details have been updated successfully.",
        className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      });
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Could not update profile details.",
        variant: "destructive"
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onAllSaves = async (data: SellerProfile) => {
    try {
      if (activeTab === 'profile') {
        await handleProfileSave();
      } else {
        await saveSettings(data);
      }
    } catch (error) {
      // toast is handled by hooks
    }
  };

  const handleValidationErrors = () => {
    if (activeTab === 'profile') return; // Skip form validation for profile tab
    if (Object.keys(form.formState.errors).length > 0) {
      toast({
        title: "Validation Errors",
        description: "Please check the form for errors (highlighted in red) before saving.",
        variant: "destructive"
      });
    }
  };

  // Image Handler (Store Logo/Banner)
  const handleStoreImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const publicUrl = await uploadImage(file, type);
      if (publicUrl) {
        if (type === 'logo') form.setValue('storeLogoUrl', publicUrl, { shouldDirty: true });
        if (type === 'banner') form.setValue('storeBannerUrl', publicUrl, { shouldDirty: true });
        toast({ title: "Image Uploaded", description: "Don't forget to click Save to persist changes." });
      }
    }
  };

  // Avatar Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Basic validation
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Image must be under 2MB", variant: "destructive" });
        return;
      }

      setUpdatingProfile(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'avatar');

        const response = await apiClient.post('/uploads/single', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const publicUrl = response.data.url;

        // 2. Update profile record
        await updateProfile({ avatar_url: publicUrl });

        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully.",
          className: "bg-green-50 text-green-900 border-green-200"
        });
      } catch (error: any) {
        console.error("Avatar upload error:", error);
        toast({
          title: "Upload Failed",
          description: "Could not upload profile picture. Please try again.",
          variant: "destructive"
        });
      } finally {
        setUpdatingProfile(false);
      }
    }
  };


  if (loading) {
    return (
      <div className="container py-8 max-w-6xl animate-pulse space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-7 border border-border/40 rounded-2xl bg-card/10">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-muted rounded-xl" />
            <div className="h-4 w-72 bg-muted/60 rounded-lg" />
          </div>
          <div className="h-12 w-40 bg-muted rounded-xl" />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <div className="hidden md:block w-64 space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-11 w-full bg-muted/40 rounded-lg mb-1" />
            ))}
          </div>

          {/* Content Skeleton - Mimicking Branding & Basic Info */}
          <div className="flex-1 space-y-6">
            {/* Branding Card */}
            <div className="rounded-xl border border-border/40 p-6 space-y-6">
              <div className="h-6 w-32 bg-muted rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-40 bg-muted/30 rounded-xl border-2 border-dashed border-border/60" />
                <div className="h-40 bg-muted/30 rounded-xl border-2 border-dashed border-border/60" />
              </div>
            </div>

            {/* Basic Info Card */}
            <div className="rounded-xl border border-border/40 p-6 space-y-6">
              <div className="h-6 w-40 bg-muted rounded mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                  <div className="h-10 w-full bg-muted/40 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                  <div className="h-24 w-full bg-muted/40 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 w-full bg-muted/40 rounded-lg" />
                  <div className="h-10 w-full bg-muted/40 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Define Tabs Data for Side Nav
  const tabs = [
    { id: "general", label: "General", icon: Store, description: "Store name, branding & contact" },
    { id: "profile", label: "My Profile", icon: User, description: "Personal details & Avatar" },
    { id: "business", label: "Business Details", icon: Building2, description: "GSTIN, PAN & Address" },
    { id: "payment", label: "Bank & Payout", icon: CreditCard, description: "Account details for payouts" },
    { id: "policies", label: "Policies & Config", icon: Settings, description: "Returns, Logic & Vacation" },
  ];

  return (
    <div className="w-full mx-auto py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 bg-card p-4 sm:p-7 rounded-2xl border border-border/60 shadow-sm transition-all animate-in slide-in-from-top duration-500">
        <div className="space-y-1 w-full lg:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Store settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground italic max-w-xl leading-relaxed">Manage your storefront, business profile and preferences with precision.</p>
        </div>

        <div className="w-full lg:w-auto flex items-center gap-3">
          <Button
            onClick={form.handleSubmit(onAllSaves, handleValidationErrors)}
            disabled={saving || uploading || updatingProfile}
            size="lg"
            className="flex-1 lg:flex-none min-w-[140px] sm:min-w-[180px] shadow-lg hover:shadow-xl transition-all rounded-xl h-11 sm:h-12 font-bold group"
          >
            {(saving || uploading || updatingProfile) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Saving Changes...</span>
                <span className="sm:hidden">Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onAllSaves, handleValidationErrors)} className="space-y-8">

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">

            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4">
              {/* Mobile Switcher - Visible on < LG */}
              <div className="lg:hidden">
                <Select value={activeTab} onValueChange={handleTabChange}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-primary/20 bg-muted/30 responsive-button focus:ring-primary/20">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-primary" />
                      <span>{tabs.find(t => t.id === activeTab)?.label || "Menu"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60">
                    {tabs.map((tab) => (
                      <SelectItem key={tab.id} value={tab.id} className="responsive-body font-semibold p-3">
                        <div className="flex items-center gap-2">
                          <tab.icon className="w-4 h-4 text-muted-foreground" />
                          {tab.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Nav - Visible on >= LG */}
              <div className="hidden lg:block sticky top-24 bg-card rounded-2xl border border-border/40 p-2 shadow-sm space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-300 ${activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold translate-x-1"
                      : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <tab.icon className={`w-5 h-5 shrink-0 ${activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{tab.label}</p>
                      <p className={`text-[10px] leading-tight mt-0.5 truncate ${activeTab === tab.id ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                        {tab.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

                {/* ================= GENERAL ================= */}
                <TabsContent value="general" className="mt-0 space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl font-bold">Branding</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">Your store's visual identity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-0 sm:pt-6">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                        {/* Logo Upload */}
                        <div>
                          <Label className="mb-3 block font-semibold">Store logo</Label>
                          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleStoreImageChange(e, 'logo')} />
                          <div
                            onClick={() => logoInputRef.current?.click()}
                            className="group relative h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all overflow-hidden bg-muted/10 shadow-inner"
                          >
                            {form.watch('storeLogoUrl') ? (
                              <img
                                src={form.watch('storeLogoUrl')!}
                                alt="Logo"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <>
                                <div className="p-3 bg-muted rounded-full mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                  <Store className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <span className="text-sm text-muted-foreground font-medium">Upload logo</span>
                              </>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold backdrop-blur-[2px]">
                              Change image
                            </div>
                          </div>
                        </div>

                        {/* Banner Upload */}
                        <div>
                          <Label className="mb-3 block font-semibold">Store banner</Label>
                          <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleStoreImageChange(e, 'banner')} />
                          <div
                            onClick={() => bannerInputRef.current?.click()}
                            className="group relative h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all overflow-hidden bg-muted/10 shadow-inner"
                          >
                            {form.watch('storeBannerUrl') ? (
                              <img src={form.watch('storeBannerUrl')!} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <>
                                <div className="p-3 bg-muted rounded-full mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <span className="text-sm text-muted-foreground font-medium">Upload banner</span>
                              </>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold backdrop-blur-[2px]">
                              Change Image
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl font-bold">Basic information</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">Public details visible to customers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="storeName"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base font-semibold">Store Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Official Store Name" {...field} className="h-11" />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="storeDescription"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base font-semibold">About Store</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Briefly describe your business..." {...field} rows={4} className="resize-none" />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base font-semibold">Business Email</FormLabel>
                              <FormControl>
                                <Input {...field} disabled className="bg-muted text-muted-foreground h-11" />
                              </FormControl>
                              <FormDescription className="text-xs">Linked to your login account.</FormDescription>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base font-semibold">One-tap Contact</FormLabel>
                              <FormControl>
                                <Input placeholder="Mobile number" {...field} className="h-11" />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-base font-semibold">Warehouse Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Building, Street, City, State, Zip" {...field} rows={3} className="resize-none" />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-indigo-100 bg-indigo-50/10 dark:bg-indigo-900/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        Visibility & SEO
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">Optimize how your store appears in search results and social shares.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="metaTitle"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="flex justify-between text-base font-semibold">
                              Page Title
                              <span className="text-[10px] text-muted-foreground font-mono">{((field.value as string) || "").length}/60</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Title for search engines" {...field} value={field.value as string || ""} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="flex justify-between text-base font-semibold">
                              Meta Description
                              <span className="text-[10px] text-muted-foreground font-mono">{((field.value as string) || "").length}/160</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Summary for search results..."
                                {...field}
                                value={field.value as string || ""}
                                rows={3}
                                className="resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ================= PROFILE TAB (NEW) ================= */}
                <TabsContent value="profile" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="responsive-h4">Personal profile</CardTitle>
                      <CardDescription className="responsive-body">Your personal account details, visible to admins and reflected in the dashboard header.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar Upload */}
                        <div className="relative group shrink-0">
                          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-border/60 shadow-inner">
                            <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                            <AvatarFallback className="text-2xl">{profileName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => avatarInputRef.current?.click()}
                          >
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                          <input
                            type="file"
                            ref={avatarInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                          />
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="responsive-label text-muted-foreground">Full name</Label>
                              <Input
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="E.g. John Doe"
                                className="h-11 rounded-xl"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="responsive-label text-muted-foreground">Personal email (Login)</Label>
                              <Input
                                value={user?.email || profile?.email || ""}
                                disabled
                                className="h-11 rounded-xl bg-muted/50 cursor-not-allowed border-dashed"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="responsive-label text-muted-foreground">Mobile number</Label>
                              <Input
                                value={profilePhone}
                                onChange={(e) => setProfilePhone(e.target.value)}
                                placeholder="+91 ..."
                                className="h-11 rounded-xl"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="responsive-label text-muted-foreground">Date of birth</Label>
                              <Input
                                type="date"
                                value={profileDob}
                                onChange={(e) => setProfileDob(e.target.value)}
                                className="h-11 rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="responsive-label text-muted-foreground">Short bio</Label>
                            <Textarea
                              value={profileBio}
                              onChange={(e) => setProfileBio(e.target.value)}
                              placeholder="Tell admins a bit about yourself..."
                              className="rounded-xl min-h-[100px] bg-background focus:ring-primary/20"
                            />
                            <p className="text-[10px] text-muted-foreground italic">This information helps us personalize your seller experience.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ================= BUSINESS ================= */}
                <TabsContent value="business" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <CardTitle className="responsive-h4">Legal information</CardTitle>
                      </div>
                      <CardDescription className="responsive-body">Tax documents required for compliance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="gst"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="responsive-label">GST number</FormLabel>
                            <FormControl>
                              <Input placeholder="22AAAAA0000A1Z5" {...field} className="uppercase font-mono" maxLength={15} />
                            </FormControl>
                            <FormDescription>Must be a valid 15-digit GSTIN.</FormDescription>
                            <FormMessage className="text-red-500 font-medium" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="responsive-label">PAN number</FormLabel>
                            <FormControl>
                              <Input placeholder="ABCDE1234F" {...field} className="uppercase font-mono" maxLength={10} />
                            </FormControl>
                            <FormMessage className="text-red-500 font-medium" />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="responsive-h4">Verification status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {profile?.verificationStatus === 'verified' ? (
                        <div className="flex items-center justify-between p-5 border rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 shadow-sm transition-all hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 dark:bg-emerald-800/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-700">
                              <BadgeCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-bold text-emerald-900 dark:text-emerald-300 text-base leading-tight">Account Verified</p>
                              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/60 mt-0.5">Your business identity has been validated. You are eligible to sell.</p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-600 text-white dark:bg-emerald-500/40 dark:text-emerald-400 border-none font-black text-[10px] tracking-widest px-3 py-1">Active</Badge>
                        </div>
                      ) : profile?.verificationStatus === 'rejected' ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border rounded-2xl bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800 shadow-sm gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="bg-rose-100 dark:bg-rose-900/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-700 mt-1">
                              <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="space-y-2">
                              <p className="font-black text-rose-900 dark:text-rose-300 text-lg leading-none">Identity Verification Rejected</p>
                              <div className="text-xs p-3.5 bg-white dark:bg-black/20 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-medium leading-relaxed">
                                <p className="font-black mb-1 opacity-50 tracking-widest text-[9px] flex items-center gap-1.5">
                                  <AlertTriangle className="h-3 w-3" /> Compliance Feedback
                                </p>
                                {profile?.verificationComments || "Your identity documents could not be verified by our compliance team. Please double-check your business details for errors and contact support if this is incorrect."}
                              </div>
                            </div>
                          </div>
                          <Badge variant="destructive" className="bg-rose-600 text-white dark:bg-rose-500 dark:text-white border-none font-black text-[10px] tracking-widest px-4 py-1.5 whitespace-nowrap self-end sm:self-center">Rejected</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-5 border rounded-2xl bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 shadow-sm transition-all hover:shadow-md border-dashed">
                          <div className="flex items-center gap-4">
                            <div className="bg-amber-100 dark:bg-amber-800/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-700">
                              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-pulse" />
                            </div>
                            <div>
                              <p className="font-bold text-amber-900 dark:text-amber-300 text-base leading-tight">Verification In Progress</p>
                              <p className="text-xs text-amber-700/80 dark:text-amber-400/60 mt-0.5">Our compliance team is currently reviewing your application. This usually takes 24-48 hours.</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-none font-semibold text-[10px] tracking-widest px-3 py-1">Pending</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ================= PAYMENT ================= */}
                <TabsContent value="payment" className="mt-0 space-y-6">
                  <Card className="border-blue-100 dark:border-blue-900/50 shadow-sm">
                    <CardHeader className="bg-blue-50/30 dark:bg-blue-950/10 border-b border-blue-100 dark:border-blue-900/50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 responsive-h4">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Bank account
                          </CardTitle>
                          <CardDescription className="responsive-body">Securely stored. Used for weekly payouts.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="beneficiaryName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="responsive-label">Beneficiary name</FormLabel>
                              <FormControl>
                                <Input placeholder="Account Holder Name" {...field} />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ifsc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="responsive-label">IFSC code</FormLabel>
                              <FormControl>
                                <Input placeholder="HDFC0001234" {...field} className="uppercase font-mono" maxLength={11} />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="bankAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="responsive-label">Account number</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} className="font-mono" />
                            </FormControl>
                            <FormDescription>Encrypted at rest.</FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ================= POLICIES ================= */}
                <TabsContent value="policies" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="responsive-h4">Store configuration</CardTitle>
                      <CardDescription className="responsive-body">Manage automation and availability</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="autoConfirm"
                        render={({ field }) => (
                          <FormItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border p-4 sm:p-5 hover:bg-muted/50 transition-all gap-4">
                            <div className="space-y-1">
                              <FormLabel className="responsive-body font-bold text-foreground">Auto-confirm orders</FormLabel>
                              <FormDescription className="responsive-small leading-relaxed">
                                Automatically move new orders to "Confirmed" status without manual approval.
                              </FormDescription>
                            </div>
                            <FormControl className="shrink-0 self-end sm:self-center">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Separator className="opacity-50" />
                      <FormField
                        control={form.control}
                        name="vacationMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border p-4 sm:p-5 hover:bg-muted/50 transition-all gap-4">
                            <div className="space-y-1">
                              <FormLabel className="responsive-body font-bold text-blue-600 flex items-center gap-2">
                                Vacation mode
                                {field.value && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-1.5 h-4">Active</Badge>}
                              </FormLabel>
                              <FormDescription className="responsive-small leading-relaxed">
                                Temporarily pause your store. Your products will be hidden from search.
                              </FormDescription>
                            </div>
                            <FormControl className="shrink-0 self-end sm:self-center">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-blue-600"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="responsive-h4">Return policy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="returnPolicy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="responsive-label">Policy text</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Example: We accept returns within 7 days of delivery if the item is unused..."
                                {...field}
                                rows={6}
                                className="responsive-body"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
            </main>
          </div>
        </form>
      </Form>
    </div>
  );
}
