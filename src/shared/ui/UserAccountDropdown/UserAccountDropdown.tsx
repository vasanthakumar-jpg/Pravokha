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
    Users,
    Package,
    Heart,
    MapPin,
    User,
    ShoppingBag,
    LayoutDashboard,
    Store,
    LogOut,
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
            case "super_admin":
            case "admin":
                return styles.roleBadgeAdmin;
            case "vendor":
                return styles.roleBadgeSeller;
            default:
                return styles.roleBadgeUser;
        }
    };

    // Menu items based on role
    const getUserMenuItems = () => [
        { icon: ShoppingBag, label: "My Orders", path: "/user/orders" },
        { icon: User, label: "Profile", path: "/user/account/profile" },
        { icon: MapPin, label: "Addresses", path: "/user/account/addresses" },
        { icon: Heart, label: "Wishlist", path: "/wishlist" },
    ];

    const getSellerMenuItems = () => [
        { icon: LayoutDashboard, label: "Seller Dashboard", path: "/seller" },
        { icon: Store, label: "Manage Products", path: "/seller/products" },
        { icon: ShoppingBag, label: "Sales Orders", path: "/seller/orders" },
        { icon: User, label: "Account Overview", path: "/user/account" },
    ];

    const getAdminMenuItems = () => [
        { icon: LayoutDashboard, label: "Admin Panel", path: "/admin" },
        { icon: Users, label: "Users List", path: "/admin/users" },
        { icon: Package, label: "All Products", path: "/admin/products" },
        { icon: ShoppingBag, label: "All Orders", path: "/admin/orders" },
        { icon: User, label: "Account Overview", path: "/user/account" },
    ];

    const getMenuItems = () => {
        const normalizedRole = role?.toLowerCase();
        switch (normalizedRole) {
            case "super_admin":
            case "admin":
                return getAdminMenuItems();
            case "vendor":
            case "seller":
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
