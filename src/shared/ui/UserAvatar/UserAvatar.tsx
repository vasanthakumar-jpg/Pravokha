import { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, Package, Heart, MapPin, LayoutDashboard, Store } from "lucide-react";
import { Button } from "@/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import styles from "./UserAvatar.module.css";
import { cn } from "@/lib/utils";
import { UserAvatarProps, UserAvatarMenuItem } from "./UserAvatar.types";

export function UserAvatar({
    userName = "User",
    userEmail,
    avatarUrl,
    role = "user",
    menuItems,
    onLogout,
}: UserAvatarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const getRoleLabel = () => {
        if (role === "admin") return "Admin";
        if (role === "seller") return "Seller";
        return "Customer";
    };

    const getInitials = () => {
        if (userName && userName !== "User") {
            return userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return userEmail?.[0]?.toUpperCase() || "U";
    };

    const getDefaultMenuItems = (): UserAvatarMenuItem[] => {
        if (menuItems) return menuItems;

        switch (role) {
            case "admin":
                return [
                    {
                        icon: <LayoutDashboard className="h-4 w-4" />,
                        label: "Admin Dashboard",
                        href: "/admin",
                    },
                    {
                        icon: <Settings className="h-4 w-4" />,
                        label: "Settings",
                        href: "/profile",
                    },
                ];
            case "seller":
                return [
                    {
                        icon: <Store className="h-4 w-4" />,
                        label: "Seller Dashboard",
                        href: "/seller",
                    },
                    {
                        icon: <Settings className="h-4 w-4" />,
                        label: "Settings",
                        href: "/profile",
                    },
                ];
            case "user":
            default:
                return [
                    {
                        icon: <User className="h-4 w-4" />,
                        label: "My Account",
                        href: "/user",
                    },
                    {
                        icon: <Package className="h-4 w-4" />,
                        label: "My Orders",
                        href: "/orders",
                    },
                    {
                        icon: <Heart className="h-4 w-4" />,
                        label: "Wishlist",
                        href: "/wishlist",
                    },
                    {
                        icon: <MapPin className="h-4 w-4" />,
                        label: "Addresses",
                        href: "/addresses",
                    },
                    {
                        icon: <Settings className="h-4 w-4" />,
                        label: "Profile",
                        href: "/profile",
                    },
                ];
        }
    };

    const items = getDefaultMenuItems();

    return (
        <div className={styles.relative} ref={dropdownRef}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(!isOpen)}
                        className={styles.avatarButton}
                    >
                        <Avatar className={styles.avatar}>
                            <AvatarImage src={avatarUrl} alt={userName} />
                            <AvatarFallback className={styles.avatarFallback}>
                                {getInitials()}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <div className={styles.tooltipContent}>
                        <p className={styles.tooltipName}>{userName}</p>
                        {userEmail && <p className={styles.tooltipEmail}>{userEmail}</p>}
                    </div>
                </TooltipContent>
            </Tooltip>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={styles.dropdown}
                    >
                        <div className={styles.header}>
                            <p className={styles.userName}>{userName}</p>
                            {userEmail && (
                                <p className={styles.userEmail}>{userEmail}</p>
                            )}
                            <p className={styles.roleLabel}>{getRoleLabel()}</p>
                        </div>

                        <div className={styles.menuList}>
                            {items.map((item, index) => (
                                <div key={index}>
                                    {item.divider && <div className={styles.divider} />}
                                    {item.href ? (
                                        <Link
                                            to={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={styles.menuItem}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                item.onClick?.();
                                                setIsOpen(false);
                                            }}
                                            className={styles.menuItem}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </button>
                                    )}
                                </div>
                            ))}

                            <div className={styles.divider} />

                            <button
                                onClick={() => {
                                    onLogout?.();
                                    setIsOpen(false);
                                }}
                                className={cn(styles.menuItem, styles.logoutItem)}
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
