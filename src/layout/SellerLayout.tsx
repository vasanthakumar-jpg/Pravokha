import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { cn, getMediaUrl } from "@/lib/utils";
import { Button } from "@/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/ui/Sheet";
import { ScrollArea } from "@/ui/ScrollArea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/Tooltip";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { useAuth } from "@/core/context/AuthContext";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import {
    LogOut,
    Menu,
    Settings as SettingsIcon,
    LayoutDashboard,
    Home,
    Package,
    ShoppingBag,
    Store,
    Plus,
    TrendingUp,
    DollarSign,
    Tag,
    ChevronDown,
    Bell,
    Search,
} from "lucide-react";
import { NotificationBell } from "@/shared/ui/NotificationBell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/ui/DropdownMenu";
import { AccountSuspendedMessage } from "@/shared/ui/AccountSuspendedMessage";
import { VerificationBanner } from "@/feat/seller/components/VerificationBanner";

interface NavLink {
    title: string;
    href: string;
    icon: React.ReactNode;
}

interface NavSection {
    title: string;
    links: NavLink[];
}

const navSections: NavSection[] = [
    {
        title: "Main",
        links: [
            { title: "Dashboard", href: "/seller", icon: <LayoutDashboard className="h-4 w-4" /> },
            { title: "Products", href: "/seller/products", icon: <ShoppingBag className="h-4 w-4" /> },
            { title: "Orders", href: "/seller/orders", icon: <Package className="h-4 w-4" /> },
            { title: "Bulk Upload", href: "/seller/products?bulk=true", icon: <Plus className="h-4 w-4" /> },
            { title: "Payments", href: "/seller/payouts", icon: <DollarSign className="h-4 w-4" /> },
            { title: "Analytics", href: "/seller/analytics", icon: <TrendingUp className="h-4 w-4" /> },
            { title: "Settings", href: "/seller/settings", icon: <SettingsIcon className="h-4 w-4" /> },
        ]
    },
];

export default function SellerLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [allProductsDropdownOpen, setAllProductsDropdownOpen] = useState(false);
    const location = useLocation();
    const { user, signOut, isSuspended, loading } = useAuth();
    const { resolvedTheme } = useTheme();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    if (isSuspended) {
        return <AccountSuspendedMessage />;
    }

    const handleLogout = async () => {
        await signOut();
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    // Close profile menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                if (profileMenuOpen) {
                    setProfileMenuOpen(false);
                }
            }
        };


        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileMenuOpen]);
    const { theme, setTheme } = useTheme();

    // Navbar Skeleton Component
    // Navbar Skeleton Component (Exact Match)
    const NavbarSkeleton = () => (
        <div className="h-16 border-b border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 w-full animate-pulse">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Left: Hamburger (Mobile) + Logo + Brand + Nav */}
                <div className="flex items-center gap-2 lg:gap-0 flex-shrink-0 min-w-0">
                    <div className="lg:hidden -mr-2 h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-md sm:h-10 sm:w-10"></div> {/* Mobile Menu */}

                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 sm:h-20 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded object-contain ml-4 mr-2" /> {/* Logo */}
                        {/* Nav Links - Desktop Only */}
                        <div className="hidden lg:flex items-center gap-1 sm:gap-2 ml-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-9 w-20 bg-gray-200/50 dark:bg-gray-700/50 rounded-md mx-1" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" /> {/* Theme */}
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" /> {/* Bell */}
                    <div className="relative">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 bg-gray-200 dark:bg-gray-700 rounded-full" /> {/* Avatar */}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <NavbarSkeleton />;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar */}
            <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center gap-2 lg:gap-0 flex-shrink-0 min-w-0">
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden -mr-2 flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10">
                                    <Menu className="h-6 w-6 sm:h-7 sm:w-7" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72 flex flex-col">
                                <SheetHeader>
                                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                    <SheetDescription className="sr-only">Browse navigation links and manage your store</SheetDescription>
                                    <div className="flex items-center gap-2">
                                        <img
                                            key={resolvedTheme}
                                            src={resolvedTheme === "dark" ? logoDark : logoLight}
                                            alt="PRAVOKHA Logo"
                                            className="h-10 w-auto sm:h-20 ml-4 object-contain transition-opacity duration-300"
                                        />
                                    </div>
                                </SheetHeader>
                                <ScrollArea className="flex-1 -mx-6 px-6">
                                    <nav className="mt-6 flex flex-col gap-2 pb-4">
                                        {isSuspended ? (
                                            <>
                                                <Link to="/" onClick={closeMobileMenu}>
                                                    <Button variant="ghost" className="w-full justify-start"><Home className="h-4 w-4 mr-2" /> Home</Button>
                                                </Link>
                                                <Link to="/products" onClick={closeMobileMenu}>
                                                    <Button variant="ghost" className="w-full justify-start"><ShoppingBag className="h-4 w-4 mr-2" /> All Products</Button>
                                                </Link>
                                                <Link to="/orders" onClick={closeMobileMenu}>
                                                    <Button variant="ghost" className="w-full justify-start"><Package className="h-4 w-4 mr-2" /> My Orders</Button>
                                                </Link>
                                                <Link to="/support" onClick={closeMobileMenu}>
                                                    <Button variant="ghost" className="w-full justify-start"><Bell className="h-4 w-4 mr-2" /> Support</Button>
                                                </Link>
                                            </>
                                        ) : (
                                            navSections.map((section) => (
                                                <div key={section.title}>
                                                    <div className="space-y-1">
                                                        {section.links.map((link) => (
                                                            <Link key={link.href} to={link.href} onClick={closeMobileMenu}>
                                                                <Button variant="ghost" className="w-full justify-start">
                                                                    {link.icon}
                                                                    <span className="ml-2">{link.title}</span>
                                                                </Button>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <Button variant="ghost" className="w-full justify-start" onClick={() => { handleLogout(); closeMobileMenu(); }}>
                                            <LogOut className="h-4 w-4 mr-2" />Logout
                                        </Button>
                                    </nav>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>

                        <Link to="/" className="flex items-center flex-shrink-0">
                            <img
                                key={resolvedTheme}
                                src={resolvedTheme === "dark" ? logoDark : logoLight}
                                alt="PRAVOKHA Logo"
                                className="h-10 sm:h-12 w-auto max-w-[120px] sm:max-w-[160px] md:max-w-[200px] object-contain transition-opacity duration-300"
                                loading="eager"
                            />
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center overflow-hidden">
                        {navSections[0].links.map((link) => {
                            const isActive = location.pathname === link.href ||
                                (link.href !== '/seller' && location.pathname.startsWith(link.href));
                            return (
                                <Link key={link.href} to={link.href}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "group font-semibold whitespace-nowrap h-8 lg:h-9 px-2 xl:px-4 transition-all duration-200",
                                            isActive ? "text-[#3FA6A6] bg-[#3FA6A6]/10" : "text-foreground hover:text-[#3FA6A6]"
                                        )}
                                    >
                                        <span className="mr-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {link.icon}
                                        </span>
                                        <span className="hidden xl:inline">{link.title}</span>
                                        <span className="xl:hidden inline max-w-0 group-hover:max-w-[120px] transition-all duration-200 overflow-hidden ml-0 group-hover:ml-1 text-xs">
                                            {link.title}
                                        </span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {/* Search Button (Added to match design) */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground">
                            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>

                        {/* Dark Mode Toggle */}
                        <ThemeToggle />

                        {/* Notifications */}
                        <NotificationBell />

                        {/* Profile Avatar */}
                        <div className="relative" ref={profileMenuRef}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0"
                                    >
                                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                                            <AvatarImage src={getMediaUrl(user?.avatar_url)} alt="Profile" />
                                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                                {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0].toUpperCase() || "S"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-center">
                                        <p className="font-semibold">{user?.full_name || user?.name || "Seller"}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>

                            {profileMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-56 bg-background border rounded-md shadow-lg overflow-hidden animate-scale-in z-50">
                                    <div className="px-3 py-1.5 border-b bg-muted/30">
                                        <p className="font-semibold text-sm truncate leading-tight">{user?.full_name || user?.name || user?.email?.split('@')[0] || "Seller"}</p>
                                        <p className="text-[10px] text-muted-foreground truncate leading-tight">{user?.email}</p>
                                        {isSuspended && <p className="text-[10px] text-destructive font-semibold mt-0.5">Suspended</p>}
                                    </div>
                                    <div className="p-1 space-y-0.5">
                                        {isSuspended ? (
                                            <>
                                                <Link to="/orders" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded-sm transition-colors">
                                                    <Package className="h-3.5 w-3.5" /> My Orders
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                <Link
                                                    to="/"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded-sm transition-colors"
                                                >
                                                    <LayoutDashboard className="h-3.5 w-3.5" />
                                                    Home
                                                </Link>
                                                <Link
                                                    to="/seller/settings"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-sm transition-colors"
                                                >
                                                    <SettingsIcon className="h-3.5 w-3.5" />
                                                    Store Settings
                                                </Link>
                                            </>
                                        )}
                                        <button
                                            onClick={() => { handleLogout(); setProfileMenuOpen(false); }}
                                            className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded-sm transition-colors w-full text-left mt-0.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <LogOut className="h-3.5 w-3.5" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header >

            {/* Main content */}
            < main className="flex-1" >
                {
                    isSuspended ? (
                        <AccountSuspendedMessage />
                    ) : (
                        <>
                            <VerificationBanner />
                            <Outlet />
                        </>
                    )
                }
            </main >
        </div >
    );
}

