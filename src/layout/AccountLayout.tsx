import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
    User,
    MapPin,
    ShoppingBag,
    Heart,
    Settings,
    LayoutDashboard,
    ChevronRight,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/Button";
import { useAuth } from "@/core/context/AuthContext";
import { useProfile } from "@/shared/hook/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import { getMediaUrl } from "@/lib/utils";

const sidebarLinks = [
    {
        title: "Dashboard",
        href: "/user",
        icon: LayoutDashboard,
    },
    {
        title: "My Orders",
        href: "/user/orders",
        icon: ShoppingBag,
    },
    {
        title: "Personal Info",
        href: "/user/account/profile",
        icon: User,
    },
    {
        title: "Address Book",
        href: "/user/account/addresses",
        icon: MapPin,
    },
    {
        title: "Wishlist",
        href: "/wishlist",
        icon: Heart,
    },
    {
        title: "Settings",
        href: "/user/account/settings",
        icon: Settings,
    },
];

const AccountLayout: React.FC = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const { profile } = useProfile(user?.id);

    const initials = profile?.full_name
        ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : user?.email?.[0].toUpperCase();

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 shrink-0 space-y-6">
                        <div className="bg-card rounded-xl border border-border/50 p-6 flex flex-col items-center text-center">
                            <Avatar className="h-20 w-20 mb-4 border-2 border-primary/10">
                                <AvatarImage src={getMediaUrl(profile?.avatar_url || user?.avatar_url)} alt="Profile" />
                                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="font-bold text-lg truncate w-full">
                                {profile?.full_name || "User Account"}
                            </h2>
                            <p className="text-xs text-muted-foreground truncate w-full">
                                {user?.email}
                            </p>
                        </div>

                        <nav className="bg-card rounded-xl border border-border/50 overflow-hidden">
                            <div className="p-2 space-y-1">
                                {sidebarLinks.map((link) => {
                                    const isActive = location.pathname === link.href ||
                                        (link.href !== "/user" && location.pathname.startsWith(link.href));
                                    return (
                                        <Link
                                            key={link.href}
                                            to={link.href}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <link.icon className={cn("h-5 w-5", isActive ? "" : "group-hover:text-primary")} />
                                                <span className="font-medium text-sm">{link.title}</span>
                                            </div>
                                            <ChevronRight className={cn("h-4 w-4 opacity-50", isActive ? "opacity-100" : "")} />
                                        </Link>
                                    );
                                })}
                            </div>
                            <div className="p-2 border-t border-border/50">
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 px-4 h-11"
                                >
                                    <LogOut className="h-5 w-5 mr-3" />
                                    <span className="font-medium text-sm">Logout</span>
                                </Button>
                            </div>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AccountLayout;
