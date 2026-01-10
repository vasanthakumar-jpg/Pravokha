import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Package, LogOut, Settings } from "lucide-react";
import { Button } from "@/ui/Button";
import { useAuth } from "@/core/context/AuthContext";
import styles from "./ProfileDropdown.module.css";
import { cn } from "@/lib/utils";

interface ProfileDropdownProps {
    user: any;
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { isAdmin } = useAdmin();
    const { signOut } = useAuth();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            signOut();
            toast({
                title: "Logged out",
                description: "You have been successfully logged out.",
            });
            setIsOpen(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to logout. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className={styles.relative} ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                title="Profile"
            >
                <User className="h-5 w-5" />
            </Button>

            {isOpen && (
                <div className={cn(styles.dropdown, "animate-in fade-in zoom-in duration-200")}>
                    <div className={styles.header}>
                        <p className={styles.userEmail}>{user.email}</p>
                    </div>
                    <div className={styles.menuList}>
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className={styles.menuItem}
                        >
                            <Settings className="h-4 w-4" />
                            Profile Settings
                        </Link>
                        <Link
                            to="/orders"
                            onClick={() => setIsOpen(false)}
                            className={styles.menuItem}
                        >
                            <Package className="h-4 w-4" />
                            Order History
                        </Link>
                        {isAdmin && (
                            <Link
                                to="/admin"
                                onClick={() => setIsOpen(false)}
                                className={cn(styles.menuItem, styles.itemInfo)}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                        <div className={styles.divider}></div>
                        <button
                            onClick={handleLogout}
                            className={cn(styles.menuItem, styles.logoutItem)}
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
