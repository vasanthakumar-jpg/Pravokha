import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import {
    User,
    Lock,
    Loader2,
    Camera,
    Shield,
    Mail,
    Phone,
    MapPin,
    CheckCircle2
} from "lucide-react";
import { useAuth } from "@/core/context/AuthContext";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";
import { AdminFormSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { cn, getMediaUrl } from "@/lib/utils";

// --- Zod Schemas ---
const profileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone number format"),
    address: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain number"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export default function StaffSettings() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form States
    const [profileData, setProfileData] = useState({
        fullName: "",
        phone: "",
        address: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Validation Errors
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setProfileData({
                fullName: user.name || "",
                phone: user.phone || "",
                address: user.address || "",
            });
            setLoading(false);
        }
    }, [user]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                toast({ title: "File Too Large", description: "Image must be smaller than 2MB.", variant: "destructive" });
                return;
            }

            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await apiClient.post('/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await apiClient.put('/users/profile', { avatarUrl: data.url });
            await refreshProfile();
            toast({ title: "Success", description: "Profile photo updated." });
        } catch (error) {
            console.error("Avatar upload failed", error);
            toast({ title: "Upload Failed", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setProfileErrors({});

        // Zod Validation
        const result = profileSchema.safeParse(profileData);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.errors.forEach((err) => {
                if (err.path[0]) errors[err.path[0] as string] = err.message;
            });
            setProfileErrors(errors);
            return;
        }

        try {
            setSaving(true);
            await apiClient.put('/users/profile', {
                name: profileData.fullName,
                phone: profileData.phone,
                address: profileData.address,
            });

            await refreshProfile();
            toast({ title: "Profile Updated", description: "Your information has been saved." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        setPasswordErrors({});

        const result = passwordSchema.safeParse(passwordData);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.errors.forEach((err) => {
                if (err.path[0]) errors[err.path[0] as string] = err.message;
            });
            setPasswordErrors(errors);
            return;
        }

        try {
            setSaving(true);
            // Assuming backend has this endpoint, if not we might need to add it or use a different one
            await apiClient.put('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast({ title: "Success", description: "Password updated successfully." });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to update password", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminFormSkeleton />;

    return (
        <div className="w-full max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account details and security preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="profile" className="rounded-lg">Profile</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg">Security</TabsTrigger>
                </TabsList>

                {/* --- Profile Tab --- */}
                <TabsContent value="profile" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Avatar Section */}
                        <Card className="col-span-1 border-border/60 shadow-sm">
                            <CardContent className="pt-6 flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                                        <AvatarImage src={getMediaUrl(user?.avatar_url)} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-muted">{user?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    </button>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                <div className="text-center">
                                    <p className="font-semibold">{user?.email}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Details Form */}
                        <Card className="col-span-1 md:col-span-2 border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your contact details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={profileData.fullName}
                                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                            className={`pl-9 ${profileErrors.fullName ? 'border-destructive' : ''}`}
                                        />
                                    </div>
                                    {profileErrors.fullName && <p className="text-xs text-destructive">{profileErrors.fullName}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            className={`pl-9 ${profileErrors.phone ? 'border-destructive' : ''}`}
                                        />
                                    </div>
                                    {profileErrors.phone && <p className="text-xs text-destructive">{profileErrors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                            className="pl-9"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end border-t bg-muted/20 py-4">
                                <Button onClick={handleSaveProfile} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Security Tab --- */}
                <TabsContent value="security" className="space-y-6 outline-none">
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle>Password Security</CardTitle>
                            <CardDescription>Ensure your account is protected with a strong password.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label>Current Password</Label>
                                <Input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className={passwordErrors.currentPassword ? 'border-destructive' : ''}
                                />
                                {passwordErrors.currentPassword && <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className={passwordErrors.newPassword ? 'border-destructive' : ''}
                                />
                                {passwordErrors.newPassword && <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                                />
                                {passwordErrors.confirmPassword && <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-start border-t bg-muted/20 py-4">
                            <Button onClick={handleUpdatePassword} disabled={saving} variant="destructive">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                Update Password
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
