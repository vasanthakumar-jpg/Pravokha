import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AccountSuspendedMessage } from "@/components/common/AccountSuspendedMessage";
import { fetchUserRole } from "@/lib/roleUtils";
import { Eye, EyeOff, Mail, Lock, User, Phone, Github, Facebook, Chrome, Apple as AppleIcon } from "lucide-react";
import { Provider } from "@supabase/supabase-js";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (!@#$%^&*)");
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number");
const nameSchema = z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Name should only contain letters");

export function AuthPage() {
    const navigate = useNavigate();
    const { user, role, loading, suspensionError } = useAuth();
    const { toast } = useToast();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Validation errors
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [fullNameError, setFullNameError] = useState("");
    const [phoneError, setPhoneError] = useState("");

    // Auto-redirect based on role
    useEffect(() => {
        if (!loading && user && role) {
            if (role === "admin") {
                navigate("/admin", { replace: true });
            } else if (role === "seller") {
                navigate("/seller", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        }
    }, [user, role, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setEmailError("");
        setPasswordError("");
        setFullNameError("");
        setPhoneError("");

        // Validate all fields
        let hasErrors = false;

        try {
            emailSchema.parse(email);
        } catch (error: any) {
            setEmailError(error.errors[0].message);
            hasErrors = true;
        }

        try {
            passwordSchema.parse(password);
        } catch (error: any) {
            setPasswordError(error.errors[0].message);
            hasErrors = true;
        }

        if (!isLogin) {
            if (!fullName.trim()) {
                setFullNameError("Full name is required");
                hasErrors = true;
            }

            try {
                phoneSchema.parse(phone);
            } catch (error: any) {
                setPhoneError(error.errors[0].message);
                hasErrors = true;
            }
        }

        if (hasErrors) return;

        setIsLoading(true);

        try {

            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                if (data.user) {
                    const userRole = await fetchUserRole(data.user.id);
                    toast({ title: "Success", description: "Logged in successfully" });

                    if (userRole === 'admin') {
                        navigate("/admin");
                    } else if (userRole === 'seller') {
                        navigate("/seller");
                    } else {
                        navigate("/");
                    }
                }
            } else {
                // Signup
                const { data: signUpData, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (error) throw error;

                // Update profile with phone number
                if (signUpData.user && phone) {
                    await supabase
                        .from('profiles')
                        .update({ phone: phone })
                        .eq('id', signUpData.user.id);
                }

                toast({
                    title: "Account created!",
                    description: "Please check your email to verify your account.",
                });

                setEmail("");
                setPassword("");
                setFullName("");
                setPhone("");
                setIsLogin(true);
            }
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toast({
                    title: "Validation Error",
                    description: error.errors[0].message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: error.message || "An error occurred",
                    variant: "destructive",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: Provider) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            toast({
                title: "Login Error",
                description: error.message || `Failed to sign in with ${provider}`,
                variant: "destructive",
            });
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Show suspension message if user is suspended
    if (suspensionError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
                <AccountSuspendedMessage userName={suspensionError.userName} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isLogin ? "Enter your credentials to access your account" : "Fill in your details to get started"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {!isLogin && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">
                                            Full Name <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="fullName"
                                                type="text"
                                                placeholder="Enter your full name"
                                                value={fullName}
                                                onChange={(e) => { setFullName(e.target.value); setFullNameError(""); }}
                                                className={`pl-10 ${fullNameError ? 'border-destructive' : ''}`}
                                                required={!isLogin}
                                            />
                                        </div>
                                        {fullNameError && (
                                            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                                <span className="text-destructive">⚠</span> {fullNameError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">
                                            Phone Number <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="Enter your phone number"
                                                value={phone}
                                                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setPhoneError(""); }}
                                                className={`pl-10 ${phoneError ? 'border-destructive' : ''}`}
                                                maxLength={10}
                                                required={!isLogin}
                                            />
                                        </div>
                                        {phoneError && (
                                            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                                <span className="text-destructive">⚠</span> {phoneError}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                                        className={`pl-10 ${emailError ? 'border-destructive' : ''}`}
                                        required
                                    />
                                </div>
                                {emailError && (
                                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                        <span className="text-destructive">⚠</span> {emailError}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                                        className={`pl-10 pr-10 ${passwordError ? 'border-destructive' : ''}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {!isLogin && !passwordError && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Must include uppercase, lowercase, number, and special character
                                    </p>
                                )}
                                {passwordError && (
                                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                        <span className="text-destructive">⚠</span> {passwordError}
                                    </p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleSocialLogin('google')}
                                    className="w-full h-12 border-slate-200 dark:border-slate-800 hover:bg-[#4285F4]/5 hover:text-[#4285F4] hover:border-[#4285F4]/30 transition-all duration-300 flex items-center justify-center gap-3 text-sm font-medium"
                                >
                                    <Chrome className="h-5 w-5" />
                                    Sign in with Google
                                </Button>

                                <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleSocialLogin('facebook')}
                                    className="w-full h-12 border-slate-200 dark:border-slate-800 hover:bg-[#1877F2]/5 hover:text-[#1877F2] hover:border-[#1877F2]/30 transition-all duration-300 flex items-center justify-center gap-3 text-sm font-medium"
                                >
                                    <Facebook className="h-5 w-5 fill-current" />
                                    Sign in with Facebook
                                </Button>
                            </div>
                        </form>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

export default AuthPage;
