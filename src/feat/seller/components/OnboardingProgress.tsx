import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Progress } from "@/ui/Progress";
import { CheckCircle2, Circle, ArrowRight, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface OnboardingProgressProps {
    profile: any;
    productsCount: number;
}

export function OnboardingProgress({ profile, productsCount }: OnboardingProgressProps) {
    if (!profile) return null;

    const steps = [
        {
            id: "profile",
            title: "Merchant Profile",
            description: "Personal and contact details",
            isCompleted: !!(profile.full_name && (profile.avatar_url || profile.email)),
            link: "/seller/settings?tab=profile"
        },
        {
            id: "branding",
            title: "Store Identity",
            description: "Name, logo, and banner",
            isCompleted: !!(profile.store_name && (profile.store_logo_url || profile.store_description)),
            link: "/seller/settings?tab=general"
        },
        {
            id: "financial",
            title: "Payment Ledger",
            description: "PAN and payout bank details",
            isCompleted: !!(profile.pan && profile.bank_account),
            link: "/seller/settings?tab=payment"
        },
        {
            id: "product",
            title: "Inventory Start",
            description: "List your first marketplace item",
            isCompleted: productsCount > 0,
            link: "/seller/products/add"
        },
        {
            id: "verification",
            title: "Compliance Seal",
            description: "KYC and business verification",
            isCompleted: profile.verificationStatus === "verified",
            link: "/seller/settings?tab=business"
        },
    ];

    const completedSteps = steps.filter(s => s.isCompleted).length;
    const progressPercentage = (completedSteps / steps.length) * 100;

    if (progressPercentage === 100) {
        return (
            <Card className="border-emerald-500/20 bg-emerald-500/5 group hover:border-emerald-500/40 transition-all duration-500 overflow-hidden relative rounded-[32px]">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform">
                    <Trophy className="h-24 w-24 text-emerald-500" />
                </div>
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold tracking-tight text-emerald-700 dark:text-emerald-400">Store Fully Optimized</h3>
                        <p className="text-xs font-medium text-emerald-600/70">You are ready for professional commerce.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 rounded-2xl overflow-hidden relative group shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform cursor-default">
                <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                        Store Pulse
                    </CardTitle>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-primary">{Math.round(progressPercentage)}%</span>
                        <span className="text-[10px] font-bold text-muted-foreground">Setup</span>
                    </div>
                </div>
                <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {steps.map((step, idx) => (
                    <Link key={step.id} to={step.link} className="relative group/item block select-none">
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center transition-all duration-500 mt-0.5",
                                step.isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-muted text-muted-foreground group-hover/item:border-primary/40 group-hover/item:bg-primary/5"
                            )}>
                                {step.isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <span className="text-[10px] font-black">{idx + 1}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                        "text-sm font-bold tracking-tight transition-colors",
                                        step.isCompleted ? "text-muted-foreground/60" : "text-foreground group-hover/item:text-primary"
                                    )}>
                                        {step.title}
                                    </p>
                                    {!step.isCompleted && (
                                        <div className="text-[10px] font-black text-primary flex items-center hover:translate-x-1 transition-transform whitespace-nowrap bg-primary/5 px-2 py-0.5 rounded-full">
                                            Fix <ArrowRight className="h-3 w-3 ml-1" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] font-medium text-muted-foreground/70 leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                        {idx !== steps.length - 1 && (
                            <div className="absolute left-3 top-7 bottom-[-16px] w-[1px] bg-border/40" />
                        )}
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
