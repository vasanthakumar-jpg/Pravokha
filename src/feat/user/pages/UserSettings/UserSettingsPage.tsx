import React, { useState, useEffect } from "react";
import { Shield, Bell, Moon, Sun, Eye, EyeOff, Save, Lock } from "lucide-react";
import { Button } from "@/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Switch } from "@/ui/Switch";
import { Separator } from "@/ui/Separator";
import { useToast } from "@/shared/hook/use-toast";
import { apiClient } from "@/infra/api/apiClient";
import { useTheme } from "next-themes";
import { changePasswordSchema } from "@/shared/validation/user.schema";
import { ZodError } from "zod";

const UserSettingsPage: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        orderUpdates: true,
        marketingEmails: false
    });

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await apiClient.get("/users/preferences");
            if (response.data.success) {
                setPreferences(response.data.preferences);
            }
        } catch (error) {
            console.error("Error fetching preferences:", error);
        }
    };

    const handlePreferenceChange = async (key: string, value: boolean) => {
        const updatedPrefs = { ...preferences, [key]: value };
        setPreferences(updatedPrefs);

        try {
            await apiClient.patch("/users/preferences", updatedPrefs);
            toast({
                title: "Settings updated",
                description: "Your preferences have been saved."
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update preferences",
                variant: "destructive"
            });
            // Revert on failure
            setPreferences(preferences);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        try {
            // Validate using Zod
            changePasswordSchema.parse(passwords);
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

        setLoading(true);
        try {
            const response = await apiClient.post("/auth/change-password", {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });

            if (response.data.success) {
                toast({ title: "Success", description: "Password updated successfully" });
                setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update password",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your security and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Security Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>Security</CardTitle>
                        </div>
                        <CardDescription>Update your password to keep your account secure.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    required
                                />
                                {formErrors.currentPassword && <p className="text-xs text-destructive">{formErrors.currentPassword}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        placeholder="Min. 8 characters"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {formErrors.newPassword && <p className="text-xs text-destructive">{formErrors.newPassword}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        placeholder="Repeat your password"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {formErrors.confirmPassword && <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>}
                            </div>

                            <Button type="submit" disabled={loading || !passwords.newPassword} className="w-full sm:w-auto">
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>Choose how you want to be notified about orders and promotions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Order Updates</Label>
                                <p className="text-sm text-muted-foreground">Receive notifications about your order status and shipping.</p>
                            </div>
                            <Switch
                                checked={preferences.orderUpdates}
                                onCheckedChange={(checked) => handlePreferenceChange("orderUpdates", checked)}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Get emails about account activity and security alerts.</p>
                            </div>
                            <Switch
                                checked={preferences.emailNotifications}
                                onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Marketing Emails</Label>
                                <p className="text-sm text-muted-foreground">Receive emails about new products, sales, and special offers.</p>
                            </div>
                            <Switch
                                checked={preferences.marketingEmails}
                                onCheckedChange={(checked) => handlePreferenceChange("marketingEmails", checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                            <CardTitle>Appearance</CardTitle>
                        </div>
                        <CardDescription>Customize your viewing experience.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Dark Mode</Label>
                                <p className="text-sm text-muted-foreground">Adjust the theme of the interface.</p>
                            </div>
                            <Switch
                                checked={theme === "dark"}
                                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserSettingsPage;
