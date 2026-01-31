import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { useAuth } from "@/core/context/AuthContext";
import { useToast } from "@/shared/hook/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters"); // Simplified for now, backend will enforce
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

export function AuthPage() {
    const navigate = useNavigate();
    const { user, role, loading, login, register, googleLogin } = useAuth();
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

    // Redirection is handled globally by the RoleBasedRedirect component in App.tsx

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
                await login(email, password);
                toast({ title: "Success", description: "Logged in successfully" });
            } else {
                await register({
                    email,
                    password,
                    name: fullName,
                    phone
                });
                toast({
                    title: "Account created!",
                    description: "You have been registered successfully.",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An error occurred",
                variant: "destructive",
            });
        } finally {
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

                        <div className="flex justify-center mb-6">
                            <GoogleLogin
                                onSuccess={(credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        googleLogin(credentialResponse.credential);
                                        toast({ title: "Google Auth Successful", description: "Logging you in..." });
                                    }
                                }}
                                onError={() => {
                                    toast({ title: "Google Login Failed", variant: "destructive" });
                                }}
                                useOneTap
                                width="100%"
                            />
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

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
                                {passwordError && (
                                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                        <span className="text-destructive">⚠</span> {passwordError}
                                    </p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                            </Button>
                        </form>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

export default AuthPage;
