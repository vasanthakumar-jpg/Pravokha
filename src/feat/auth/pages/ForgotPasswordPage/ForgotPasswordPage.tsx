import { useState } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { useToast } from "@/shared/hook/use-toast";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { useTheme } from "next-themes";

export function ForgotPasswordPage() {
    const { toast } = useToast();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                title: "Error",
                description: "Please enter your email address",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/auth/forgot-password', { email });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Password reset failed');
            }

            setEmailSent(true);
            toast({
                title: "Check your email",
                description: "We've sent you a password reset link. Please check your inbox (and spam folder).",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to send reset email',
                variant: "destructive",
            });
        } finally {
            setLoading(false);
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
                        {emailSent ? "Email Sent!" : "Forgot Password?"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {emailSent
                            ? "Check your email for a password reset link. The link will expire in 1 hour for security."
                            : "Enter your registered email address and we'll send you a secure password reset link."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {!emailSent ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Sending..." : "Send Reset Link"}
                            </Button>

                            <div className="text-center">
                                <Link to="/auth" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center text-sm text-muted-foreground">
                                <p>Didn't receive the email?</p>
                                <p className="mt-1">Check your spam folder or try again.</p>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setEmailSent(false);
                                    setEmail("");
                                }}
                            >
                                Send Another Email
                            </Button>

                            <div className="text-center">
                                <Link to="/auth" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default ForgotPasswordPage;
