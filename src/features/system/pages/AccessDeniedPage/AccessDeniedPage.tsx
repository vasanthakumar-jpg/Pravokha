import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AccessDeniedPage() {
    const navigate = useNavigate();
    const { role, signOut } = useAuth();

    const getDashboardLink = () => {
        switch (role) {
            case "admin":
                return "/admin";
            case "seller":
                return "/seller";
            default:
                return "/";
        }
    };

    const getDashboardLabel = () => {
        switch (role) {
            case "admin":
                return "Admin Dashboard";
            case "seller":
                return "Seller Dashboard";
            default:
                return "Home Page";
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
            <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />

            <Card className="w-full max-w-md shadow-2xl border-destructive/20 animate-in fade-in zoom-in-95 duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-destructive/10 p-4 rounded-full w-fit ring-1 ring-destructive/20">
                        <ShieldAlert className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Access Denied
                    </CardTitle>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    <div className="space-y-2">
                        <p className="text-muted-foreground">
                            You don't have permission to view this page.
                        </p>
                        <p className="text-sm text-muted-foreground/80">
                            Please return to the appropriate dashboard or contact support if you believe this is a mistake.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button
                            variant="default"
                            className="w-full sm:w-auto gap-2"
                            onClick={() => navigate(getDashboardLink())}
                        >
                            <Home className="h-4 w-4" />
                            Go to {getDashboardLabel()}
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full sm:w-auto gap-2"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-center border-t bg-muted/20 py-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground gap-2"
                        onClick={() => signOut()}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign in with different account
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default AccessDeniedPage;
