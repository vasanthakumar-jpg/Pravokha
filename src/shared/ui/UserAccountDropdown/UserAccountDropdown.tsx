import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/ui/DropdownMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import {
    User,
    Settings,
    LogOut,
    ShoppingBag,
    CreditCard,
    LayoutDashboard,
    Store,
    DollarSign,
    BarChart3,
    Users,
    Package,
} from "lucide-react";
import styles from "./UserAccountDropdown.module.css";
import { cn, getMediaUrl } from "@/lib/utils";

export function UserAccountDropdown() {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    // ✅ NEW: Read ALL data from AuthContext user object only
    const currentAvatarUrl = user?.avatar_url;
    const currentName = user?.full_name || user?.name || user?.email?.split('@')[0] || "User";
    const userKey = user?._lastFetchedAt || user?.id || 'guest';

    console.log('[UserAccountDropdown] Rendering - avatar_url:', currentAvatarUrl, 'key:', userKey);

    const handleNavigate = (path: string) => {
        navigate(path);
        setOpen(false);
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/auth");
    };

    const getInitials = (name?: string) => {
        if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getRoleBadgeClass = (userRole: string) => {
        const normalizedRole = userRole?.toLowerCase();
        switch (normalizedRole) {
            case "admin":
                return styles.roleBadgeAdmin;
            case "seller":
            case "dealer":
                return styles.roleBadgeSeller;
            default:
                return styles.roleBadgeUser;
        }
    };

    // Menu items based on role
    const getUserMenuItems = () => [
        { icon: User, label: "My Account", path: "/user" },
        { icon: ShoppingBag, label: "My Orders", path: "/user/orders" },
        { icon: CreditCard, label: "Payment History", path: "/settings" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ];

    const getSellerMenuItems = () => [
        { icon: LayoutDashboard, label: "Dashboard", path: "/seller" },
        { icon: Store, label: "My Store", path: "/seller/products" },
        { icon: ShoppingBag, label: "Orders", path: "/seller/orders" },
        { icon: DollarSign, label: "Payouts", path: "/seller/payouts" },
        { icon: BarChart3, label: "Reports", path: "/seller/analytics" },
        { icon: User, label: "My Account", path: "/seller/settings" },
        { icon: Settings, label: "Store Settings", path: "/seller/settings" },
    ];

    const getAdminMenuItems = () => [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: Package, label: "All Products", path: "/admin/products" },
        { icon: ShoppingBag, label: "All Orders", path: "/admin/orders" },
        { icon: BarChart3, label: "Reports", path: "/admin/reports" },
        { icon: User, label: "My Account", path: "/settings" },
        { icon: Settings, label: "System Settings", path: "/admin/settings" },
    ];

    const getMenuItems = () => {
        const normalizedRole = role?.toLowerCase();
        switch (normalizedRole) {
            case "admin":
                return getAdminMenuItems();
            case "seller":
            case "dealer":
                return getSellerMenuItems();
            default:
                return getUserMenuItems();
        }
    };

    const menuItems = getMenuItems();

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger className="focus:outline-none">
                <div className={styles.triggerContainer}>
                    <Avatar
                        key={userKey}
                        className={cn(styles.triggerAvatar, "ring-2 ring-offset-2 ring-offset-background ring-primary/20 hover:ring-primary/40 transition-all")}
                    >
                        <AvatarImage src={getMediaUrl(currentAvatarUrl)} alt={currentName} />
                        <AvatarFallback className={styles.avatarFallback}>
                            {getInitials(currentName)}
                        </AvatarFallback>
                    </Avatar>
                    {role === "admin" && (
                        <div className={cn(styles.roleBadge, getRoleBadgeClass(role))}>
                            A
                        </div>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
                {/* User Info Header */}
                <DropdownMenuLabel className="font-normal">
                    <div className={styles.userInfoContainer}>
                        <Avatar key={`${userKey}-dropdown`} className={styles.avatar}>
                            <AvatarImage src={getMediaUrl(currentAvatarUrl)} />
                            <AvatarFallback className={styles.avatarFallback}>
                                {getInitials(currentName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className={styles.userDetails}>
                            <p className={styles.userName}>
                                {currentName}
                            </p>
                            <p className={styles.userEmail}>
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Menu Items */}
                {menuItems.map((item, index) => (
                    <DropdownMenuItem
                        key={index}
                        onClick={() => handleNavigate(item.path)}
                        className={styles.menuItem}
                    >
                        <item.icon className={styles.menuIcon} />
                        <span className={styles.menuLabel}>{item.label}</span>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                    onClick={handleLogout}
                    className={cn(styles.menuItem, styles.logoutItem)}
                >
                    <LogOut className={styles.menuIcon} />
                    <span className="text-sm font-medium">Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
