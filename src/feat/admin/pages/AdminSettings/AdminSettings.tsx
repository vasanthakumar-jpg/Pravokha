import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/AlertDialog";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { Switch } from "@/ui/Switch";
import { Separator } from "@/ui/Separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import {
  User,
  Store,
  Shield,
  Bell,
  Lock,
  Globe,
  Trash2,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Plus,
  Activity,
  Database,
  Eye,
  BarChart3,
  Zap,
  CreditCard,
  ArrowLeft
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/Select";
import { useAuth } from "@/core/context/AuthContext";
import { useAdmin } from "@/core/context/AdminContext";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";
import { AdminFormSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AdminRoleCounts, ApiResponse } from "@/feat/admin/types/settings";

export default function AdminSettings() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [roleCounts, setRoleCounts] = useState({
    super_admins: 0,
    sellers: 0,
    support: 0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    avatarUrl: ""
  });

  const [storeData, setStoreData] = useState({
    storeName: "Pravokha",
    storeUrl: "https://pravokha.com",
    maintenanceMode: false,
    autoConfirmOrders: true,
    logoUrl: "",
    bannerUrl: ""
  });

  const [notificationData, setNotificationData] = useState({
    governanceAlerts: true,
    revenueTelemetry: true,
    inventoryCriticality: false
  });

  const [systemData, setSystemData] = useState({
    currency: "INR",
    timezone: "IST",
    analyticsEnabled: true,
    aiInsightsEnabled: false,
    payoutAutomationEnabled: true,
    sessionTrackingEnabled: true,
    dataAnonymizationEnabled: false,
    publicIndexingEnabled: false
  });

  const { isAdmin, loading: adminLoading } = useAdmin();

  // CRITICAL: Authentication check to prevent unauthorized access
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSiteSettings();
      fetchNotificationSettings();
      fetchRoleCounts();
    }
  }, [user]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/users/profile');

      const userData = data || {};

      // Backend returns camelCase from Prisma, map directly
      setProfileData({
        fullName: userData.name || userData.fullName || "",
        email: userData.email || user?.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        avatarUrl: userData.avatarUrl || ""
      });
    } catch (error) {
      console.error("[AdminSettings] Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
      // Fallback
      setProfileData(prev => ({ ...prev, email: user?.email || "" }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSiteSettings = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/settings/site');

      if (data) {
        // Backend returns camelCase from Prisma
        const settings = data.settings || data.data || data;
        setStoreData({
          storeName: settings.storeName || "Pravokha",
          storeUrl: settings.storeUrl || "https://pravokha.com",
          maintenanceMode: settings.maintenanceMode || false,
          autoConfirmOrders: settings.autoConfirmOrders !== undefined ? settings.autoConfirmOrders : true,
          logoUrl: settings.logoUrl || "",
          bannerUrl: settings.bannerUrl || ""
        });
        setSystemData({
          currency: settings.currency || "INR",
          timezone: settings.timezone || "IST",
          analyticsEnabled: settings.analyticsEnabled !== undefined ? settings.analyticsEnabled : true,
          aiInsightsEnabled: settings.aiInsightsEnabled || false,
          payoutAutomationEnabled: settings.payoutAutomationEnabled !== undefined ? settings.payoutAutomationEnabled : true,
          sessionTrackingEnabled: settings.sessionTrackingEnabled !== undefined ? settings.sessionTrackingEnabled : true,
          dataAnonymizationEnabled: settings.dataAnonymizationEnabled || false,
          publicIndexingEnabled: settings.publicIndexingEnabled || false
        });
      }
    } catch (error) {
      console.error("[AdminSettings] Error fetching site settings:", error);
    }
  }, []);

  const fetchRoleCounts = useCallback(async () => {
    try {
      // Use existing endpoint that's already in backend
      const { data } = await apiClient.get('/users/admin/stats');
      setRoleCounts(data || { super_admins: 0, sellers: 0, support: 0 });
    } catch (e) {
      console.warn("Could not fetch user stats", e);
    }
  }, []);

  const fetchNotificationSettings = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/admin/settings/notifications');
      if (data) {
        // Backend returns camelCase from Prisma
        const settings = data.settings || data.data || data;
        setNotificationData({
          governanceAlerts: settings.governanceAlerts || false,
          revenueTelemetry: settings.revenueTelemetry || false,
          inventoryCriticality: settings.inventoryCriticality || false
        });
      }
    } catch (error) {
      console.error("[AdminSettings] Error fetching notifications:", error);
    }
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // Backend expects camelCase (Prisma model uses name, not fullName)
      await apiClient.put('/users/profile', {
        name: profileData.fullName,
        phone: profileData.phone,
        address: profileData.address,
        avatarUrl: profileData.avatarUrl,
      });

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });

      await refreshProfile();
    } catch (error) {
      console.error("[AdminSettings] Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to save profile changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStoreSettings = async () => {
    try {
      setSaving(true);
      // Backend expects camelCase (Prisma SiteSetting model)
      await apiClient.put('/admin/settings/site', {
        storeName: storeData.storeName,
        storeUrl: storeData.storeUrl,
        maintenanceMode: storeData.maintenanceMode,
        autoConfirmOrders: storeData.autoConfirmOrders,
        logoUrl: storeData.logoUrl,
        bannerUrl: storeData.bannerUrl
      });

      toast({
        title: "Store Policy Sync",
        description: "Global marketplace configurations have been updated.",
      });
    } catch (error) {
      console.error("[AdminSettings] Error saving store settings:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to update global store settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async (settings: any) => {
    try {
      const newSettings = { ...notificationData, ...settings };
      setNotificationData(newSettings);

      await apiClient.put('/admin/settings/notifications', newSettings);

      toast({
        title: "Alert Matrix Updated",
        description: "Your notification preferences are now active.",
      });
    } catch (error) {
      console.error("[AdminSettings] Error saving notification settings:", error);
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      setSaving(true);
      // Backend expects camelCase (Prisma SiteSetting model)
      await apiClient.put('/admin/settings/system', {
        currency: systemData.currency,
        timezone: systemData.timezone,
        analyticsEnabled: systemData.analyticsEnabled,
        aiInsightsEnabled: systemData.aiInsightsEnabled,
        payoutAutomationEnabled: systemData.payoutAutomationEnabled,
        sessionTrackingEnabled: systemData.sessionTrackingEnabled,
        dataAnonymizationEnabled: systemData.dataAnonymizationEnabled,
        publicIndexingEnabled: systemData.publicIndexingEnabled
      });

      toast({
        title: "System Config Updated",
        description: "Infrastructure settings have been applied.",
      });
    } catch (error) {
      console.error("[AdminSettings] Error saving system settings:", error);
      toast({
        title: "Update Failed",
        description: "System configuration could not be saved.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please upload a JPEG, PNG, WebP or GIF.", variant: "destructive" });
        return;
      }

      if (file.size > maxSize) {
        toast({ title: "File Too Large", description: "Image must be smaller than 2MB.", variant: "destructive" });
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post('/uploads/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const publicUrl = data.url;

      // Update using camelCase property
      setProfileData(prev => ({ ...prev, avatarUrl: publicUrl }));

      // Update profile with new avatar URL - backend expects camelCase
      await apiClient.put('/users/profile', { avatarUrl: publicUrl });

      await refreshProfile();

      toast({ title: "Upload Success", description: "Your photo has been updated." });
    } catch (error) {
      console.error("[AdminSettings] Upload error:", error);
      toast({ title: "Upload Failed", description: "Failed to transmit asset.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleStoreAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post('/uploads/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const publicUrl = data.url;

      // Update using camelCase properties
      if (type === 'logo') {
        setStoreData(prev => ({ ...prev, logoUrl: publicUrl }));
      } else {
        setStoreData(prev => ({ ...prev, bannerUrl: publicUrl }));
      }

      // Update settings - backend expects camelCase
      const payload = type === 'logo' ? { logoUrl: publicUrl } : { bannerUrl: publicUrl };
      await apiClient.put('/admin/settings/site', payload);

      toast({ title: "Asset Updated", description: `Marketplace ${type} synchronized.` });
    } catch (error) {
      console.error("[AdminSettings] Store asset upload error:", error);
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const tabs = useMemo(() => [
    { id: "profile", label: "Profile settings", description: "Identity & contact", icon: User },
    { id: "store", label: "Store configuration", description: "Branding & logic", icon: Store },
    { id: "roles", label: "Roles & permissions", description: "Access matrix", icon: Shield },
    { id: "notifications", label: "Notifications", description: "Alert protocols", icon: Bell },
    { id: "security", label: "Security & privacy", description: "Protection ops", icon: Lock },
    { id: "system", label: "System settings", description: "Global defaults", icon: Globe },
  ], []);

  // Mobile Navigation Dropdown (Visible < XL)
  const mobileNav = useMemo(() => (
    <div className="xl:hidden w-full">
      <Select value={activeTab} onValueChange={setActiveTab}>
        <SelectTrigger className="w-full h-12 bg-card border-border/60 rounded-xl font-bold px-4 shadow-sm">
          <SelectValue placeholder="Select settings section" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border/60">
          {tabs.map((tab) => (
            <SelectItem key={tab.id} value={tab.id} className="font-medium py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <tab.icon className="h-4 w-4" />
                </div>
                {tab.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ), [activeTab, tabs]);

  return (
    <div className="w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* SAP-H v1 Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs w-fit justify-start shadow-sm"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold flex items-center flex-wrap gap-3">
                System settings
              </h1>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-10 rounded-xl border-border/40 font-bold text-xs bg-card hover:bg-muted/50"
              onClick={() => navigate("/admin/audit-logs")}
            >
              <Activity className="mr-2 h-4 w-4" /> Audit trail
            </Button>
            <Button className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
              <Globe className="mr-2 h-4 w-4" /> Production view
            </Button>
          </div>
        </div>
      </div>

      {mobileNav}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col xl:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="hidden xl:block xl:w-64 shrink-0 h-full">
          <div className="flex flex-col w-full bg-transparent p-0 border-none gap-2 items-stretch h-full">
            {[
              { id: "profile", label: "Profile settings", description: "Identity & contact", icon: User },
              { id: "store", label: "Store configuration", description: "Branding & logic", icon: Store },
              { id: "roles", label: "Roles & permissions", description: "Access matrix", icon: Shield },
              { id: "notifications", label: "Notifications", description: "Alert protocols", icon: Bell },
              { id: "security", label: "Security & privacy", description: "Protection ops", icon: Lock },
              { id: "system", label: "System settings", description: "Global defaults", icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-shrink-0 w-full flex items-center justify-start px-4 py-3 h-auto rounded-xl transition-all duration-200 outline-none border",
                  activeTab === tab.id
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-background hover:bg-muted text-muted-foreground font-semibold border-border/40"
                )}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <tab.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-[11px] font-bold tracking-tight leading-none mb-1">{tab.label}</span>
                    <span className={cn("text-[9px] font-medium truncate", activeTab === tab.id ? "text-white/80" : "text-muted-foreground/60")}>
                      {tab.description}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <AdminFormSkeleton />
          ) : (
            <div className="space-y-6 pb-20 overflow-visible">
              {/* Profile Settings */}
              <TabsContent value="profile" className="space-y-6 mt-0 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Avatar Card */}
                  <Card className="col-span-1 border-border/60 bg-card rounded-2xl overflow-hidden relative group shadow-sm">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="text-center pb-2 relative z-10">
                      <CardTitle className="text-xs font-bold py-2 text-muted-foreground">Auth photo</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6 py-6 relative z-10">
                      <div className="relative group/avatar">
                        <div className="relative p-1 rounded-full bg-primary/10 transition-transform duration-500">
                          <Avatar className="h-40 w-40 border-4 border-background">
                            <AvatarImage src={profileData.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-900 text-5xl font-black text-primary/40">
                              {profileData.fullName?.charAt(0) || "A"}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="absolute bottom-2 right-2 p-3 rounded-xl bg-slate-900 text-white shadow-sm border border-white/10 hover:bg-primary transition-all active:scale-95 disabled:opacity-50 z-20 group/btn"
                        >
                          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />}
                        </button>
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />

                      <div className="space-y-4 w-full text-center">
                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed opacity-60">
                          Maximum payload: 2.0 MB <br /> Supported: PNG, JPG, WEBP
                        </p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                            <div className="flex items-center gap-2"><Shield className="h-3 w-3" /> Identity proof</div>
                            <span className="opacity-60 font-mono">Encrypted</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                            <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Live status</div>
                            <span>Active</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Info Card */}
                  <Card className="col-span-1 md:col-span-2 border-border/60 bg-card rounded-2xl flex flex-col shadow-sm">
                    <CardHeader className="p-6">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="h-1 w-6 bg-primary rounded-full" />
                        <span className="text-xs font-bold text-muted-foreground">Identity registry</span>
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight">Core profile</CardTitle>
                      <CardDescription className="text-sm font-medium">Immutable administrative identity and contact lattice.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 space-y-6 flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 ml-1 text-xs font-bold text-muted-foreground opacity-70">
                            <User className="h-3 w-3 text-primary" /> Signature identity
                          </Label>
                          <Input
                            value={profileData.fullName}
                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                            className="rounded-xl border-border/60 h-11 text-sm font-bold bg-muted/20 focus:ring-primary/20 transition-all placeholder:text-[10px] sm:placeholder:text-sm placeholder:text-muted-foreground/30 px-4"
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 ml-1 text-xs font-bold text-muted-foreground opacity-70">
                            <Mail className="h-3 w-3 text-primary" /> Authorized endpoint
                          </Label>
                          <div className="relative group">
                            <Input
                              value={profileData.email || user?.email || ""}
                              disabled
                              className="rounded-xl border-border/60 h-11 text-sm font-bold bg-muted/40 pr-10 opacity-80 cursor-not-allowed px-4"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-900 border border-border/40 flex items-center justify-center text-muted-foreground">
                              <Lock className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 ml-1 text-xs font-bold text-muted-foreground opacity-70">
                            <Phone className="h-3 w-3 text-primary" /> Telephony line
                          </Label>
                          <Input
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="rounded-xl border-border/60 h-11 text-sm font-bold bg-muted/20 focus:ring-primary/20 transition-all placeholder:text-[10px] sm:placeholder:text-sm placeholder:text-muted-foreground/30 px-4"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 ml-1 text-xs font-bold text-muted-foreground opacity-70">
                            <MapPin className="h-3 w-3 text-primary" /> Operational HQ
                          </Label>
                          <Input
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            className="rounded-xl border-border/60 h-11 text-sm font-bold bg-muted/20 focus:ring-primary/20 transition-all placeholder:text-[10px] sm:placeholder:text-sm placeholder:text-muted-foreground/30 px-4"
                            placeholder="Enter operational address"
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 border-t border-border/40 bg-muted/10">
                      <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                            Sync pulse active • Global broadcast target
                          </p>
                        </div>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="rounded-xl h-11 px-8 min-w-[180px] font-bold text-xs bg-primary hover:bg-primary/90 transition-all"
                        >
                          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                          {saving ? "Transmitting..." : "Update identity"}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="store" className="space-y-6 mt-0 outline-none">
                <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
                  <CardHeader className="p-6 bg-muted/20 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-6 bg-primary rounded-full" />
                          <span className="text-xs font-bold text-muted-foreground">Operational nexus</span>
                        </div>
                        <CardTitle className="text-xl font-bold tracking-tight">Marketplace governance</CardTitle>
                        <CardDescription className="text-sm font-medium">Brand identity architecture and global operational logic.</CardDescription>
                      </div>
                      {/* <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-bold px-4 py-1 rounded-full">
                          Protocol v12.4
                        </Badge> */}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-10">
                    {/* Store Branding Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-primary" />
                        <Label className="text-xs font-bold text-foreground/70">Asset manifest</Label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Store Logo */}
                        <div className="relative group rounded-2xl border border-border/40 bg-muted/10 p-6 flex flex-col items-center gap-6 transition-all hover:bg-muted/20">
                          <div className="relative">
                            <div className="h-28 w-28 rounded-2xl bg-white dark:bg-slate-900 border border-border/40 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                              {storeData.logo_url ? (
                                <img src={storeData.logo_url} className="w-full h-full object-contain p-2" />
                              ) : (
                                <Store className="h-8 w-8 text-muted-foreground/20" />
                              )}
                            </div>
                            <button
                              onClick={() => logoInputRef.current?.click()}
                              className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-slate-950 text-white shadow-sm border border-white/10 hover:bg-primary transition-all active:scale-95 z-10"
                            >
                              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            </button>
                          </div>
                          <input
                            type="file"
                            ref={logoInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleStoreAssetUpload(e, 'logo')}
                          />
                          <div className="text-center space-y-1">
                            <p className="text-sm font-bold tracking-tight">Canonical logo</p>
                            <p className="text-[11px] text-muted-foreground font-medium opacity-60">Vector / raster • Max 1.0 MB</p>
                          </div>
                        </div>

                        {/* Store Banner */}
                        <div className="relative group rounded-2xl border border-border/40 bg-muted/10 p-6 flex flex-col items-center gap-6 transition-all hover:bg-muted/20">
                          <div className="relative w-full">
                            <div className="h-28 w-full rounded-2xl bg-white dark:bg-slate-900 border border-border/40 flex items-center justify-center overflow-hidden group-hover:scale-[1.01] transition-transform duration-500">
                              {storeData.bannerUrl ? (
                                <img src={storeData.bannerUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center gap-1 opacity-20">
                                  <Globe className="h-8 w-8 text-primary" />
                                  <span className="font-bold text-lg italic">Pravokha</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => bannerInputRef.current?.click()}
                              className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-slate-950 text-white shadow-sm border border-white/10 hover:bg-primary transition-all active:scale-95 z-10"
                            >
                              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            </button>
                          </div>
                          <input
                            type="file"
                            ref={bannerInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleStoreAssetUpload(e, 'banner')}
                          />
                          <div className="text-center space-y-1">
                            <p className="text-sm font-bold tracking-tight">Identity banner</p>
                            <p className="text-[11px] text-muted-foreground font-medium opacity-60">1920x600 optimized • Max 2.5 MB</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground opacity-70 ml-1">Universal site alias</Label>
                        <Input value={storeData.storeName} className="rounded-xl border-border/60 h-11 text-sm font-bold bg-muted/10 focus:ring-primary/20 px-4" onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground opacity-70 ml-1">Network endpoint</Label>
                        <div className="relative">
                          <Input value={storeData.storeUrl} className="rounded-xl border-border/60 h-11 text-sm font-bold bg-muted/10 focus:ring-primary/20 px-4 pr-12" onChange={(e) => setStoreData({ ...storeData, storeUrl: e.target.value })} />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-900 border border-border/40 flex items-center justify-center text-primary/60">
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/40" />

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-primary" />
                        <Label className="text-xs font-bold text-foreground/70">Operational toggles</Label>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 transition-all hover:bg-rose-500/10">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                              <AlertCircle className="h-3.5 w-3.5" /> System blackout
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-[240px]">Decouple public gateways and initiate hard maintenance protocol.</p>
                          </div>
                          <Switch
                            checked={storeData.maintenanceMode}
                            onCheckedChange={(checked) => setStoreData({ ...storeData, maintenanceMode: checked })}
                            className="data-[state=checked]:bg-rose-500"
                          />
                        </div>

                        <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 transition-all hover:bg-emerald-500/10">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Logic autopilot
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-[240px]">Enable background telemetry for automated order synchronization.</p>
                          </div>
                          <Switch
                            checked={storeData.autoConfirmOrders}
                            onCheckedChange={(checked) => setStoreData({ ...storeData, autoConfirmOrders: checked })}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 border-t border-border/40 bg-muted/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <p className="text-xs font-bold text-muted-foreground opacity-60">Ready for global propagation</p>
                    </div>
                    <Button onClick={handleSaveStoreSettings} disabled={saving} className="rounded-xl h-11 px-8 font-bold text-xs bg-primary hover:bg-primary/90 transition-all">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                      {saving ? "Deploying..." : "Sync global policy"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Roles Management */}
              <TabsContent value="roles" className="space-y-6 mt-0 outline-none">
                <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
                  <CardHeader className="p-6 bg-muted/20 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-muted-foreground">Permission matrix</span>
                        </div>
                        <CardTitle className="text-xl font-bold tracking-tight">Access infrastructure</CardTitle>
                        <CardDescription className="text-sm font-medium">Global role distribution and administrative privilege lattice.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { title: "Super admins", count: roleCounts.super_admins, icon: ShieldCheck, color: "text-primary", bg: "bg-primary/5", border: "border-primary/10" },
                        { title: "Standard sellers", count: roleCounts.sellers, icon: Store, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
                        { title: "Support staff", count: roleCounts.support, icon: Bell, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/10" },
                      ].map((role) => (
                        <div key={role.title} className={cn("p-6 rounded-2xl border flex flex-col gap-4 transition-all hover:bg-muted/10", role.bg, role.border)}>
                          <div className={cn("h-10 w-10 rounded-xl bg-background border border-border/40 flex items-center justify-center", role.color)}>
                            <role.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-muted-foreground opacity-60 mb-0.5">{role.title}</p>
                            <p className="text-2xl font-bold tabular-nums tracking-tighter">{role.count}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Lock className="h-4 w-4 text-primary" />
                        <Label className="text-xs font-bold text-foreground/70">Hard clearances</Label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          "Platform governance & core settings",
                          "Universal data access & export",
                          "Security policy enforcement",
                          "Role escalation capabilities",
                          "Financial settlement oversight",
                          "Log analytics & forensics"
                        ].map((clearance, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border/40 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{clearance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 border-t border-border/40 bg-muted/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                      <p className="text-xs font-bold text-muted-foreground mr-auto max-w-sm">
                        <span className="text-primary">Warning:</span> Administrative roles grant deep system access. Changes require multi-factor verification.
                      </p>
                      <Button
                        variant="outline"
                        className="rounded-xl h-11 px-8 font-bold text-xs border-border/60 hover:bg-slate-900 hover:text-white transition-all"
                        onClick={() => navigate("/admin/audit-logs")}
                      >
                        Audit privileges
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications" className="space-y-6 mt-0 outline-none">
                <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
                  <CardHeader className="p-6 bg-muted/20 border-b border-border/40">
                    <div className="flex items-center gap-3 mb-1">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground">Signal registry</span>
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Communication cluster</CardTitle>
                    <CardDescription className="text-sm font-medium">Real-time telemetry and operational alert orchestration.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {[
                      { id: "governanceAlerts", title: "Governance protocol", desc: "Identity verification and role escalation alerts.", checked: notificationData.governanceAlerts, icon: Shield },
                      { id: "revenueTelemetry", title: "Revenue velocity", desc: "Real-time settlement pulses and financial transitions.", checked: notificationData.revenueTelemetry, icon: Activity },
                      { id: "inventoryCriticality", title: "Supply chain vitals", desc: "Inventory depletion alerts and warehouse status.", checked: notificationData.inventoryCriticality, icon: Database },
                    ].map((n, i) => (
                      <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-muted/10 border border-border/40 hover:bg-white/40 dark:hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border/40 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <n.icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold tracking-tight">{n.title}</Label>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-sm">{n.desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={n.checked}
                          onCheckedChange={(checked) => handleSaveNotificationSettings({ [n.id]: checked })}
                          className="scale-90 data-[state=checked]:bg-primary"
                        />
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="p-6 border-t border-border/40 bg-muted/10">
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-muted-foreground opacity-60">Push channels synchronized</span>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl px-4 h-9"
                        onClick={() => {
                          const el = document.getElementById('webhook-section');
                          el?.scrollIntoView({ behavior: 'smooth' });
                          toast({ title: "Automation Hub", description: "Directing to webhook configuration segment." });
                        }}
                      >
                        Configure webhooks
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Security & privacy */}
              <TabsContent value="security" className="space-y-6 mt-0 outline-none">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Security Ops */}
                  <Card className="border-border/60 bg-card rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
                      <div className="flex items-center gap-3 mb-1">
                        <Lock className="h-4 w-4 text-rose-500" />
                        <span className="text-xs font-bold text-muted-foreground">Encryption logic</span>
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight">Security perimeter</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 flex-1">
                      <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                          <Shield className="h-3.5 w-3.5" /> Cryptographic identity
                        </div>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                          Administrative identities use decentralized hash-links for authentication. Initiating a security cycle will invalidate current tokens and broadcast a recovery handshake to:
                        </p>
                        <code className="block p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-primary font-mono text-[11px] border border-border/40 truncate">
                          {profileData.email}
                        </code>
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 border-t border-border/40 bg-muted/10">
                      <Button
                        onClick={async () => {
                          // Validate email format before attempting reset
                          if (!profileData.email || !profileData.email.trim()) {
                            toast({
                              title: "Email required",
                              description: "Please ensure your profile has a valid email address.",
                              variant: "destructive"
                            });
                            return;
                          }

                          // Basic email format validation
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(profileData.email)) {
                            toast({
                              title: "Invalid email format",
                              description: "Please check your email address and try again.",
                              variant: "destructive"
                            });
                            return;
                          }

                          // Attempt password reset
                          try {
                            await apiClient.post('/auth/password-reset', {
                              email: profileData.email,
                              redirectTo: `${window.location.origin}/admin/settings`
                            });

                            // Security: Use neutral messaging to prevent email enumeration
                            toast({
                              title: "Security cycle initiated",
                              description: "A cryptographic reset link has been dispatched to your verified email channel.",
                            });
                          } catch (error: any) {
                            console.error("Reset password error:", error);
                            toast({
                              title: "Security cycle failed",
                              description: error.response?.data?.message || "Configuration Error: Redirect URL not whitelisted.",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="w-full rounded-xl h-12 font-bold text-xs bg-slate-950 text-white hover:bg-rose-600 transition-all active:scale-95"
                      >
                        Cycle cryptographic keys
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Privacy Lattice */}
                  <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
                    <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
                      <div className="flex items-center gap-3 mb-1">
                        <Eye className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-bold text-muted-foreground">Visibility matrix</span>
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight">Privacy context</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {[
                        { id: "publicIndexingEnabled", title: "Public identity indexing", desc: "Allow global search clusters to index administrative credentials.", checked: systemData.publicIndexingEnabled },
                        { id: "sessionTrackingEnabled", title: "Audit trail persistence", desc: "Immutable logging of every administrative operational sequence.", checked: systemData.sessionTrackingEnabled },
                        { id: "dataAnonymizationEnabled", title: "PII redaction engine", desc: "Automatically redact sensitive data from analytics exports.", checked: systemData.dataAnonymizationEnabled },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-muted/10 border border-border/40 hover:bg-white/40 dark:hover:bg-white/5 transition-all group">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold tracking-tight">{p.title}</Label>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px]">{p.desc}</p>
                          </div>
                          <Switch
                            checked={p.checked}
                            onCheckedChange={(checked) => setSystemData({ ...systemData, [p.id]: checked })}
                            className="scale-90 data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Danger Zone */}
                <Card className="border-rose-500/20 bg-rose-500/5 rounded-2xl overflow-hidden mt-6">
                  <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5" /> Identity termination link
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-xl">
                        Requesting identity termination is irreversible. All marketplace assets, administrative tokens, and history will be cryptographically locked.
                      </p>
                    </div>
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="rounded-xl h-11 px-8 font-bold text-xs hover:bg-rose-600 active:scale-95 transition-all"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Terminate identity
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-rose-500/20 bg-background max-w-lg shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-rose-600 font-black flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            CRITICAL: IRREVERSIBLE ACTION
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-4 pt-2">
                            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-2">
                              <p className="font-bold text-foreground text-sm">
                                This action cannot be undone.
                              </p>
                              <p className="text-xs text-muted-foreground">
                                This will permanently delete your account, remove all administrative access tokens, and scrub your profile data.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-bold text-muted-foreground tracking-wider">
                                Type your email to confirm
                              </p>
                              <div className="p-3 bg-muted/50 rounded-xl font-mono text-xs border border-border/50 text-center select-all font-bold text-primary">
                                {profileData.email || "No confirmed email"}
                              </div>
                              <Input
                                placeholder={profileData.email}
                                value={deleteConfirmEmail}
                                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                                className="bg-background border-border/60 rounded-xl h-11 font-medium"
                                autoComplete="off"
                              />
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0">
                          <AlertDialogCancel
                            onClick={() => setDeleteConfirmEmail("")}
                            className="rounded-xl font-bold h-11"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            variant="destructive"
                            disabled={deleteConfirmEmail.trim() !== profileData.email || isTerminating}
                            onClick={async () => {
                              try {
                                setIsTerminating(true);
                                // Delete user account via API
                                await apiClient.delete(`/users/${user?.id}`);

                                toast({
                                  title: "Termination successful",
                                  description: "Identity purged. Redirecting to initialization sequence...",
                                });

                                // Sign out locally
                                localStorage.removeItem('pravokha_auth_token');
                                localStorage.removeItem('pravokha_user_role');
                                localStorage.removeItem('pravokha_user_id');
                                navigate("/auth");

                              } catch (error: any) {
                                toast({
                                  title: "Termination failed",
                                  description: error.response?.data?.message || "Could not complete sequence.",
                                  variant: "destructive"
                                });
                                setIsTerminating(false);
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 font-bold rounded-xl h-11 px-6 min-w-[140px]"
                          >
                            {isTerminating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Purging...
                              </>
                            ) : (
                              "Confirm Termination"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System settings */}
              <TabsContent value="system" className="space-y-6 mt-0 outline-none">
                <Card className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
                  <CardHeader className="p-6 bg-muted/20 border-b border-border/40">
                    <div className="flex items-center gap-3 mb-1">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground">Platform core</span>
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Environment infrastructure</CardTitle>
                    <CardDescription className="text-sm font-medium">Global platform defaults and high-velocity telemetry orchestration.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground opacity-70 ml-1">Universal currency</Label>
                        <Select value={systemData.currency} onValueChange={(val) => setSystemData({ ...systemData, currency: val })}>
                          <SelectTrigger className="rounded-xl border-border/60 h-11 bg-muted/10 font-bold px-4 focus:ring-primary/20">
                            <SelectValue placeholder="Protocol symbol" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/60 bg-card shadow-xl">
                            <SelectItem value="INR" className="px-4 py-2 text-sm font-bold">INR (₹) • Indian rupee</SelectItem>
                            <SelectItem value="USD" className="px-4 py-2 text-sm font-bold">USD ($) • US dollar</SelectItem>
                            <SelectItem value="EUR" className="px-4 py-2 text-sm font-bold">EUR (€) • Euro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground opacity-70 ml-1">Temporal alignment</Label>
                        <Select value={systemData.timezone} onValueChange={(val) => setSystemData({ ...systemData, timezone: val })}>
                          <SelectTrigger className="rounded-xl border-border/60 h-11 bg-muted/10 font-bold px-4 focus:ring-primary/20">
                            <SelectValue placeholder="Cluster timezone" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/60 bg-card shadow-xl">
                            <SelectItem value="IST" className="px-4 py-2 text-sm font-bold">(UTC+05:30) Asia / Mumbai</SelectItem>
                            <SelectItem value="UTC" className="px-4 py-2 text-sm font-bold">(UTC+00:00) Global / Universal</SelectItem>
                            <SelectItem value="EST" className="px-4 py-2 text-sm font-bold">(UTC-05:00) US / Eastern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="bg-border/40" />

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-primary" />
                        <Label className="text-xs font-bold text-foreground/70">Operational feature flags</Label>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        {[
                          { id: "analyticsEnabled", title: "Analytics engine", desc: "High-velocity data processing.", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/10" },
                          { id: "aiInsightsEnabled", title: "AI intelligence", desc: "ML-driven recommendations (BETA).", icon: Zap, color: "text-violet-500", bg: "bg-violet-500/5", border: "border-violet-500/10" },
                          { id: "payoutAutomationEnabled", title: "Auto-settlement", desc: "Automated seller disbursements.", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
                        ].map((f, i) => (
                          <div key={i} className={cn("p-6 rounded-2xl border flex flex-col gap-6 transition-all hover:bg-muted/10", f.bg, f.border)}>
                            <div className="flex items-center justify-between">
                              <div className={cn("h-10 w-10 rounded-xl bg-background border border-border/40 flex items-center justify-center", f.color)}>
                                <f.icon className="h-5 w-5" />
                              </div>
                              <Switch
                                checked={systemData[f.id as keyof typeof systemData]}
                                onCheckedChange={(checked) => setSystemData({ ...systemData, [f.id]: checked })}
                                className="scale-90 data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold tracking-tight">{f.title}</h4>
                              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 border-t border-border/40 bg-muted/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-xs font-bold text-muted-foreground opacity-60">Environment pulse nominal</p>
                    </div>
                    <Button onClick={handleSaveSystemSettings} disabled={saving} className="rounded-xl h-11 px-8 font-bold text-xs bg-primary hover:bg-primary/90 transition-all">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      {saving ? "Syncing..." : "Commit global changes"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Webhook Automation Section (NEW) */}
                <Card id="webhook-section" className="border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm mt-6 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <CardHeader className="p-6 bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-amber-500" />
                      <div>
                        <CardTitle className="text-lg font-bold">Automation orchestration</CardTitle>
                        <CardDescription className="text-slate-400 text-xs font-medium">Configure external triggers and real-time backend synchronization.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-muted-foreground ml-1">Marketplace Webhook Endpoint (Payload URL)</Label>
                      <div className="relative group">
                        <Input
                          placeholder="https://your-api.com/webhook"
                          className="rounded-xl h-12 bg-muted/20 border-border/60 font-mono text-xs font-bold px-11"
                          defaultValue={storeData.storeUrl + "/api/v1/webhook"}
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">ACTIVE LISTENER</Badge>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium px-2 leading-relaxed italic">
                        * Platform events (Orders, Payouts, Support) will be transmitted as JSON payloads to this endpoint. Security signature included in headers.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 bg-muted/10 border-t border-border/40 flex justify-end">
                    <Button className="rounded-xl h-11 px-8 font-bold text-xs bg-slate-900 hover:bg-primary transition-all" onClick={() => toast({ title: "Configuration Localized", description: "Marketplace webhook target has been updated locally." })}>
                      Synchronize endpoint
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </div>
          )}
        </div>
      </Tabs >
    </div >
  );
}


