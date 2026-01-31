
import { useAuth } from "@/core/context/AuthContext";
import { AlertCircle, ShieldAlert, BadgeCheck, Clock, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";

export function VerificationBanner() {
    const { verificationStatus, verificationComments, role } = useAuth();
    const isAdmin = role === 'ADMIN';

    if (verificationStatus === 'verified' || isAdmin) return null;

    const config = {
        pending: {
            icon: Clock,
            bg: "bg-amber-500/10 border-amber-500/20",
            text: "text-amber-700 dark:text-amber-400",
            button: "hover:bg-amber-600 hover:text-white dark:hover:bg-amber-400 dark:hover:text-amber-950 active:bg-amber-700 dark:active:bg-amber-300",
            title: "Verification in Progress",
            message: "Your account is being reviewed. Most features are locked until verification is complete.",
            cta: "View Status",
            href: "/seller/settings"
        },
        rejected: {
            icon: ShieldAlert,
            bg: "bg-destructive/10 border-destructive/20",
            text: "text-destructive",
            button: "hover:bg-destructive hover:text-destructive-foreground active:bg-destructive/90",
            title: "Verification Rejected",
            message: verificationComments || "Your business details were not approved. Please update your information.",
            cta: "Fix Now",
            href: "/seller/settings"
        },
        unverified: {
            icon: Lock,
            bg: "bg-blue-500/10 border-blue-500/20",
            text: "text-blue-700 dark:text-blue-400",
            button: "hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-blue-950 active:bg-blue-700 dark:active:bg-blue-300",
            title: "Action Required: Complete Verification",
            message: "You must complete your business profile to start listing products and receiving orders.",
            cta: "Complete Profile",
            href: "/seller/settings"
        }
    };

    const current = config[verificationStatus as keyof typeof config] || config.unverified;
    const Icon = current.icon;

    return (
        <div className={cn("border-b px-4 py-4 sm:px-6 lg:px-8 transition-all duration-300", current.bg)}>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-full bg-background/50", current.text)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <p className={cn("font-bold text-sm", current.text)}>{current.title}</p>
                        <p className="text-xs opacity-80 mt-0.5 max-w-lg">{current.message}</p>
                    </div>
                </div>

                <Link to={current.href} className="flex-shrink-0 self-end sm:self-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                            "h-9 px-5 gap-2 border-current bg-transparent transition-all duration-300 shadow-sm active:scale-95 font-semibold",
                            current.text,
                            current.button
                        )}
                    >
                        {current.cta}
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
