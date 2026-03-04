import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Separator } from "@/ui/Separator";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { useToast } from "@/shared/hook/use-toast";
import { z } from "zod";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { useTheme } from "next-themes";

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
    email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Mobile must be a valid 10-digit Indian number"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be less than 100 characters"),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export function AuthEnhancedPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const { theme } = useTheme();
    const { user, login, register: authRegister, googleLogin } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        checkUser();
    }, [user]);

    const checkUser = async () => {
        if (user) {
            const redirect = searchParams.get("redirect") || "/";
            navigate(redirect);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            loginSchema.parse(formData);
            setErrors({});
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0].toString()] = err.message;
                    }
                });
                setErrors(newErrors);
                return;
            }
        }

        setLoading(true);
        try {
            await login(formData.email, formData.password);

            // Success handled by AuthContext and useEffect checkUser
            toast({
                title: "Welcome back!",
                description: "You have successfully logged in.",
            });
        } catch (error: any) {
            setLoading(false);
            const msg = error.message || "Invalid credentials";
            toast({
                title: "Login Failed",
                description: msg,
                variant: "destructive",
            });
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            signupSchema.parse(formData);
            setErrors({});
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0].toString()] = err.message;
                    }
                });
                setErrors(newErrors);
                toast({
                    title: "Validation Error",
                    description: "Please check all fields and try again.",
                    variant: "destructive",
                });
                return;
            }
        }

        setLoading(true);
        try {
            // use context helper which already handles token/storage
            await authRegister({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phoneNumber: formData.mobile // backend now accepts this field
            });

            setLoading(false);

            toast({
                title: "Account Created!",
                description: "Please check your email to verify your account before logging in.",
            });
            setIsLogin(true);
            setFormData({ ...formData, password: "", confirmPassword: "" });
        } catch (error: any) {
            setLoading(false);
            const msg = error.response?.data?.message || error.message || "Registration failed";
            toast({
                title: "Registration Failed",
                description: msg,
                variant: "destructive",
            });
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-3">
                    <div className="flex justify-center mb-2">
                        <img
                            src={theme === "dark" ? logoDark : logoLight}
                            alt="PRAVOKHA Logo"
                            className="h-12 w-auto object-contain"
                        />
                    </div>
                    <CardTitle className="text-2xl text-center">
                        {isLogin ? "Welcome Back!" : "Join PRAVOKHA"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isLogin
                            ? "Please sign in to continue"
                            : "Create an account for faster checkout and order tracking"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={(credentialResponse) => {
                                if (credentialResponse.credential) {
                                    googleLogin(credentialResponse.credential);
                                    toast({
                                        title: "Google Auth Successful",
                                        description: "Logging you in...",
                                    });
                                }
                            }}
                            onError={() => {
                                toast({
                                    title: "Google Login Failed",
                                    description: "Authentication was unsuccessful.",
                                    variant: "destructive",
                                });
                            }}
                            useOneTap
                            theme={theme === 'dark' ? 'filled_black' : 'outline'}
                            shape="pill"
                            width="100%"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {isLogin ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile Number *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="mobile"
                                        name="mobile"
                                        type="tel"
                                        placeholder="10-digit mobile number"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className="pl-10"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Required for order updates via SMS</p>
                                {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min 8 characters"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating account..." : "Create Account"}
                            </Button>
                        </form>
                    )}

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </span>
                        {" "}
                        <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto font-semibold"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setErrors({});
                            }}
                        >
                            {isLogin ? "Sign Up" : "Sign In"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default AuthEnhancedPage;
