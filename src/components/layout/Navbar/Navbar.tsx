import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ShoppingCart,
    Search,
    Menu,
    LogOut,
    User,
    X,
    Package,
    LayoutDashboard,
    Store,
    Settings,
    Plus,
    ChevronDown,
    LifeBuoy,
    ShieldAlert,
    Bell
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/contexts/CartContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Badge } from "@/components/ui/Badge";
import { categories } from "@/data/products";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { debounce } from "@/utils/debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/Sheet";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { TShirtIcon, PantsIcon, ShortsIcon, MensIcon, WomensIcon, KidsIcon } from "@/components/icons/ClothingIcons";

import styles from "./Navbar.module.css";
import { NotificationBell } from "@/components/common/NotificationBell";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";

interface SearchResult {
    id: string;
    title: string;
    category: string;
    price: number;
    discountPrice?: number;
    images: string[];
    description?: string;
}

export function Navbar() {
    const { cartCount, setIsCartOpen } = useCart();
    const { isAdmin } = useAdmin();
    const { user, role, signOut, isSuspended } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const { theme, resolvedTheme } = useTheme();
    const { profile } = useProfile(user?.id);
    const [mensDropdownOpen, setMensDropdownOpen] = useState(false);
    const [womensDropdownOpen, setWomensDropdownOpen] = useState(false);
    const [kidsDropdownOpen, setKidsDropdownOpen] = useState(false);
    const [sellerProductsDropdownOpen, setSellerProductsDropdownOpen] = useState(false);

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (query.trim()) {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, title, price, discount_price, category, product_variants(images)')
                    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                    .eq('published', true)
                    .limit(5);

                if (error) {
                    console.error('Search error:', error);
                    return;
                }

                const formattedResults = data.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    description: p.category, // Using category as description for now
                    category: p.category,
                    price: p.price,
                    discountPrice: p.discount_price,
                    images: p.product_variants?.[0]?.images || [] // Get first variant's images
                }));

                setSearchResults(formattedResults as any);
            } else {
                setSearchResults([]);
            }
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    useEffect(() => {
        if (isSuspended) {
            toast({
                title: "Regulatory Restriction Active",
                description: "Your account is currently under suspension. Access is limited to verification and appeals.",
                variant: "destructive",
                duration: 10000,
            });
        }
    }, [isSuspended]);

    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        debouncedSearch(value);
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            setSearchOpen(false);
            setSearchQuery("");
            setSearchResults([]);
        }
    };

    const toggleSearch = () => {
        const newState = !searchOpen;
        setSearchOpen(newState);
        if (newState) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchQuery("");
        }
    };

    // Close search and profile menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                if (searchOpen) {
                    setSearchOpen(false);
                    setSearchQuery("");
                }
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                if (profileMenuOpen) {
                    setProfileMenuOpen(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchOpen, profileMenuOpen]);

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        await signOut();
        toast({
            title: "Logged out",
            description: "You have been successfully logged out.",
        });
    };

    return (
        <header className={styles.navbar}>
            {isSuspended && (
                <div className={styles.notice}>
                    <div className={styles.noticeContent}>
                        <div className="flex items-center gap-3">
                            <div className={styles.noticeIconWrapper}>
                                <ShieldAlert className={styles.noticeIcon} />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                <span className="text-xs font-bold text-destructive uppercase tracking-tight">Regulatory Notice</span>
                                <span className="text-[11px] sm:text-xs text-destructive/80 font-medium leading-tight">
                                    Account status restricted. Limited access enabled for identity verification and appeals only.
                                </span>
                            </div>
                        </div>
                        <Link to="/tickets">
                            <Button size="sm" variant="destructive" className="h-7 px-3 text-[10px] font-bold uppercase rounded-md shadow-sm hover:shadow-md transition-all">
                                Support Portal
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    {/* Left: Hamburger + Logo */}
                    <div className={styles.leftSection}>
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden -mr-2 flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10">
                                    <Menu className="h-6 w-6 sm:h-7 sm:w-7" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72 flex flex-col">
                                <SheetHeader>
                                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                    <SheetDescription className="sr-only">Browse products and navigate the site</SheetDescription>
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
                                        <Link to="/" onClick={closeMobileMenu}>
                                            <Button variant="ghost" className="w-full justify-start">Home</Button>
                                        </Link>
                                        {categories.map((category) => (
                                            <Link key={category.id} to={`/products?category=${category.slug}`} onClick={closeMobileMenu}>
                                                <Button variant="ghost" className="w-full justify-start">{category.name}</Button>
                                            </Link>
                                        ))}
                                        {user && role === "admin" && (
                                            <Link to="/admin" onClick={closeMobileMenu}>
                                                <Button variant="ghost" className="w-full justify-start font-semibold text-primary">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    Admin Dashboard
                                                </Button>
                                            </Link>
                                        )}
                                        {user && role === "seller" && !isSuspended && (
                                            <Link to="/seller" onClick={closeMobileMenu}>
                                                <Button variant="ghost" className="w-full justify-start font-semibold text-primary">
                                                    <Store className="mr-2 h-4 w-4" />
                                                    Seller Dashboard
                                                </Button>
                                            </Link>
                                        )}
                                        {user && (role === "user" || isSuspended) && (
                                            <>
                                                <Link to="/user" onClick={closeMobileMenu}>
                                                    <Button variant="ghost" className="w-full justify-start">My Account</Button>
                                                </Link>
                                                <Link to="/orders" onClick={closeMobileMenu}>
                                                    <Button variant="ghost" className="w-full justify-start">My Orders</Button>
                                                </Link>
                                            </>
                                        )}
                                        {user ? (
                                            <Button variant="ghost" className="w-full justify-start" onClick={() => { handleLogout(); closeMobileMenu(); }}>
                                                <LogOut className="h-4 w-4 mr-2" />Logout
                                            </Button>
                                        ) : (
                                            <Link to="/auth" onClick={closeMobileMenu}>
                                                <Button variant="ghost" className="w-full justify-start">
                                                    <User className="h-4 w-4 mr-2" />Login
                                                </Button>
                                            </Link>
                                        )}
                                    </nav>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>

                        <Link to="/" className="flex items-center flex-shrink-0">
                            <img
                                key={resolvedTheme}
                                src={resolvedTheme === "dark" ? logoDark : logoLight}
                                alt="PRAVOKHA Logo"
                                className={styles.logo}
                                loading="eager"
                            />
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation */}
                    <nav className={styles.centerSection}>
                        <Link to="/">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={styles.navButton}
                            >
                                <LayoutDashboard className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                <span className={cn("hidden xl:inline", styles.navButtonText)}>Home</span>
                            </Button>
                        </Link>

                        {(!user || role === "user" || isSuspended) ? (
                            <Link to="/products">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={styles.navButton}
                                >
                                    <Package className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                    <span className={cn("hidden xl:inline", styles.navButtonText)}>All products</span>
                                </Button>
                            </Link>
                        ) : (
                            <DropdownMenu open={sellerProductsDropdownOpen} onOpenChange={setSellerProductsDropdownOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={styles.navButton}
                                        onMouseEnter={() => setSellerProductsDropdownOpen(true)}
                                        onMouseLeave={() => setSellerProductsDropdownOpen(false)}
                                    >
                                        <Package className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                        <span className={cn("hidden xl:inline", styles.navButtonText)}>Products</span>
                                        <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="center"
                                    className="w-56 focus:outline-none focus-visible:outline-none"
                                    onMouseEnter={() => setSellerProductsDropdownOpen(true)}
                                    onMouseLeave={() => setSellerProductsDropdownOpen(false)}
                                >
                                    <Link to="/products">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Package className="h-4 w-4 mr-2" />
                                            All Products
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to={role === 'admin' ? "/admin/products" : "/seller/products"}>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Store className="h-4 w-4 mr-2" />
                                            My Products
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to={role === 'admin' ? "/admin/products/add" : "/seller/products/add"}>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Product
                                        </DropdownMenuItem>
                                    </Link>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Mens Dropdown */}
                        <DropdownMenu open={mensDropdownOpen} onOpenChange={setMensDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={styles.navButton}
                                    onMouseEnter={() => setMensDropdownOpen(true)}
                                    onMouseLeave={() => setMensDropdownOpen(false)}
                                >
                                    <MensIcon className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                    <span className={cn("hidden xl:inline", styles.navButtonText)}>Men</span>
                                    <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="center"
                                className="w-48 focus:outline-none focus-visible:outline-none"
                                onMouseEnter={() => setMensDropdownOpen(true)}
                                onMouseLeave={() => setMensDropdownOpen(false)}
                            >
                                <Link to="/products?category=mens-tshirts">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <TShirtIcon className="h-4 w-4 mr-2" />
                                        T-Shirts
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/products?category=mens-track-pants">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <PantsIcon className="h-4 w-4 mr-2" />
                                        Track Pants
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/products?category=mens-shorts">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <ShortsIcon className="h-4 w-4 mr-2" />
                                        Shorts
                                    </DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Womens Dropdown */}
                        <DropdownMenu open={womensDropdownOpen} onOpenChange={setWomensDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={styles.navButton}
                                    onMouseEnter={() => setWomensDropdownOpen(true)}
                                    onMouseLeave={() => setWomensDropdownOpen(false)}
                                >
                                    <WomensIcon className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                    <span className={cn("hidden xl:inline", styles.navButtonText)}>Women</span>
                                    <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="center"
                                className="w-48 focus:outline-none focus-visible:outline-none"
                                onMouseEnter={() => setWomensDropdownOpen(true)}
                                onMouseLeave={() => setWomensDropdownOpen(false)}
                            >
                                <Link to="/products?category=womens-tshirts">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <TShirtIcon className="h-4 w-4 mr-2" />
                                        T-Shirts
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/products?category=womens-track-pants">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <PantsIcon className="h-4 w-4 mr-2" />
                                        Track Pants
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/products?category=womens-shorts">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <ShortsIcon className="h-4 w-4 mr-2" />
                                        Shorts
                                    </DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Kids Dropdown */}
                        <DropdownMenu open={kidsDropdownOpen} onOpenChange={setKidsDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={styles.navButton}
                                    onMouseEnter={() => setKidsDropdownOpen(true)}
                                    onMouseLeave={() => setKidsDropdownOpen(false)}
                                >
                                    <KidsIcon className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                    <span className={cn("hidden xl:inline", styles.navButtonText)}>Kids</span>
                                    <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="center"
                                className="w-48 focus:outline-none focus-visible:outline-none"
                                onMouseEnter={() => setKidsDropdownOpen(true)}
                                onMouseLeave={() => setKidsDropdownOpen(false)}
                            >
                                <Link to="/products?category=kids-tshirts">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <TShirtIcon className="h-4 w-4 mr-2" />
                                        T-Shirts
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/products?category=kids-track-pants">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <PantsIcon className="h-4 w-4 mr-2" />
                                        Track Pants
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/products?category=kids-shorts">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <ShortsIcon className="h-4 w-4 mr-2" />
                                        Shorts
                                    </DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {user && role === "admin" && (
                            <Link to="/admin">
                                <Button variant="ghost" size="sm" className={styles.navButton}>
                                    <LayoutDashboard className={cn("h-4 w-4 mr-1.5", styles.navButtonIcon)} />
                                    <span className={styles.navButtonText}>Admin</span>
                                </Button>
                            </Link>
                        )}
                        {user && role === "seller" && !isSuspended && (
                            <Link to="/seller/dashboard">
                                <Button variant="ghost" size="sm" className={styles.navButton}>
                                    <Store className={cn("h-4 w-4 mr-1.5", styles.navButtonIcon)} />
                                    <span className={styles.navButtonText}>Seller</span>
                                </Button>
                            </Link>
                        )}
                        {user && (role === "user" || isSuspended) && (
                            <>
                                <Link to={isSuspended ? "/tickets" : "/user/home"}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(styles.navButton, isSuspended && "text-destructive hover:text-white hover:bg-destructive")}
                                    >
                                        {isSuspended ? (
                                            <ShieldAlert className={cn("h-4 w-4", styles.navButtonIcon)} />
                                        ) : (
                                            <User className={cn("h-4 w-4", styles.navButtonIcon)} />
                                        )}
                                        <span className={cn("hidden xl:inline", styles.navButtonText)}>{isSuspended ? "Support" : "Account"}</span>
                                    </Button>
                                </Link>
                                {!isSuspended && (
                                    <Link to="/tickets">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={styles.navButton}
                                        >
                                            <LifeBuoy className={cn("h-4 w-4", styles.navButtonIcon)} />
                                            <span className={cn("hidden xl:inline", styles.navButtonText)}>Support</span>
                                        </Button>
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>

                    {/* Right: Actions */}
                    <div className={styles.rightSection}>
                        <Button variant="ghost" size="icon" onClick={toggleSearch} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>

                        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9" onClick={() => setIsCartOpen(true)}>
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                            {cartCount > 0 && (
                                <Badge className={styles.badge}>
                                    {cartCount}
                                </Badge>
                            )}
                        </Button>

                        <ThemeToggle />

                        {user && <NotificationBell />}

                        {user ? (
                            <UserAccountDropdown />
                        ) : (
                            <Link to="/auth">
                                <Button variant="ghost" size="sm" className="h-8 sm:h-9 px-3 text-xs flex-shrink-0">
                                    Login
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {searchOpen && (
                    <div className="border-t bg-background/98 py-3 animate-in slide-in-from-top-2" ref={searchRef}>
                        <div className="relative">
                            <Input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                                className="w-full text-sm focus-visible:ring-0 focus-visible:ring-offset-0 border-primary pr-20"
                            />
                            {searchQuery && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSearchResults([]);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={toggleSearch}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

