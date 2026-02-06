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
    Bell,
    Tag,
    Zap,
    Flame,
    ShoppingBag,
    Calendar,
    UserCircle,
    Home as HomeIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/ui/DropdownMenu";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/ui/Accordion";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { useCart } from "@/core/context/CartContext";
import { useAdmin } from "@/core/context/AdminContext";
import { Badge } from "@/ui/Badge";
import { Separator } from "@/ui/Separator";
// removed static categories import
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { toast } from "@/shared/hook/use-toast";
import { useTheme } from "next-themes";
import { debounce } from "@/shared/util/debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import { useProfile } from "@/shared/hook/useProfile";
import { useAuth } from "@/core/context/AuthContext";
import { cn } from "@/lib/utils";
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
import { NotificationDropdown } from "@/feat/notifications/components/NotificationDropdown";
import { TShirtIcon, PantsIcon, ShortsIcon, MensIcon, WomensIcon, KidsIcon } from "@/shared/ui/icons/ClothingIcons";

import styles from "./Navbar.module.css";
import { NotificationBell } from "@/shared/ui/NotificationBell";
import { UserAccountDropdown } from "@/shared/ui/UserAccountDropdown";
import { useCategories } from "@/shared/hook/useCategories";
import { apiClient } from "@/infra/api/apiClient";
import { MegaMenu } from "./MegaMenu";

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
    const { categories: dynamicCategories } = useCategories();
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
    const shopMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleShopMouseEnter = () => {
        if (shopMenuTimeoutRef.current) clearTimeout(shopMenuTimeoutRef.current);
        setIsShopMenuOpen(true);
    };

    const handleShopMouseLeave = () => {
        shopMenuTimeoutRef.current = setTimeout(() => {
            setIsShopMenuOpen(false);
        }, 300); // Slightly larger delay for better UX
    };
    const [sellerProductsDropdownOpen, setSellerProductsDropdownOpen] = useState(false);

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (query.trim()) {
                try {
                    const response = await apiClient.get('/products', {
                        params: {
                            search: query,
                            limit: 5
                        }
                    });

                    if (response.data.success) {
                        const formattedResults = response.data.products.map((p: any) => ({
                            id: p.id,
                            title: p.title,
                            description: p.category,
                            category: p.category,
                            price: p.price,
                            discountPrice: p.discount_price,
                            images: p.variants?.[0]?.images || []
                        }));
                        setSearchResults(formattedResults);
                    }
                } catch (err) {
                    console.error('Search error:', err);
                }
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
                                            <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                                                <HomeIcon className="mr-3 h-5 w-5" /> Home
                                            </Button>
                                        </Link>

                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="shop" className="border-none">
                                                <AccordionTrigger className="hover:no-underline py-2 text-sm font-medium px-4">
                                                    <div className="flex items-center">
                                                        <ShoppingBag className="mr-3 h-5 w-5" /> Shop
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-2">
                                                    <div className="flex flex-col gap-1 pl-11">
                                                        <Link to="/products" onClick={closeMobileMenu}>
                                                            <Button variant="link" className="w-full justify-start text-xs h-8 text-muted-foreground p-0">All Products</Button>
                                                        </Link>
                                                        {dynamicCategories.map((category) => (
                                                            <div key={category.id} className="flex flex-col gap-0.5 mt-2">
                                                                <Link to={`/products?category=${category.slug}`} onClick={closeMobileMenu}>
                                                                    <span className="text-xs font-bold block mb-1">{category.name}</span>
                                                                </Link>
                                                                <div className="flex flex-col gap-1 pl-2">
                                                                    {category.subcategories?.map(sub => (
                                                                        <Link key={sub.id} to={`/products?subcategory=${sub.slug}`} onClick={closeMobileMenu}>
                                                                            <span className="text-[11px] text-muted-foreground hover:text-primary transition-colors">{sub.name}</span>
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>

                                        <Link to="/products?tag=deals" onClick={closeMobileMenu}>
                                            <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                                                <Flame className="mr-3 h-5 w-5 text-orange-500" /> Hot Deals
                                            </Button>
                                        </Link>

                                        <Link to="/products?tag=new" onClick={closeMobileMenu}>
                                            <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                                                <Calendar className="mr-3 h-5 w-5" /> New Arrivals
                                            </Button>
                                        </Link>

                                        {user && role === "ADMIN" ? (
                                            <Link to="/seller" onClick={closeMobileMenu}>
                                                <Button variant="ghost" className="w-full justify-start text-sm font-bold text-primary">
                                                    <LayoutDashboard className="mr-3 h-5 w-5" /> Seller Dashboard
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Link to="/seller" onClick={closeMobileMenu}>
                                                <Button variant="ghost" className="w-full justify-start text-sm font-medium">
                                                    <Store className="mr-3 h-5 w-5" /> Become a Seller
                                                </Button>
                                            </Link>
                                        )}

                                        <Separator className="my-2" />

                                        <div className="px-4 py-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Account Actions</p>
                                            <div className="grid grid-cols-1 gap-2">
                                                {user ? (
                                                    <>
                                                        <Link to="/user/orders" onClick={closeMobileMenu} className="flex items-center gap-3 px-1 py-1 text-sm font-medium hover:text-primary transition-colors">
                                                            <Package className="h-4 w-4" /> My Orders
                                                        </Link>
                                                        <Link to="/user" onClick={closeMobileMenu} className="flex items-center gap-3 px-1 py-1 text-sm font-medium hover:text-primary transition-colors">
                                                            <User className="h-4 w-4" /> Profile
                                                        </Link>
                                                        <Button variant="ghost" className="w-full justify-start px-1 h-8 text-destructive hover:bg-destructive/10" onClick={() => { handleLogout(); closeMobileMenu(); }}>
                                                            <LogOut className="h-4 w-4 mr-3" /> Logout
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Link to="/auth" onClick={closeMobileMenu}>
                                                        <Button variant="default" className="w-full justify-center rounded-xl font-bold uppercase text-xs h-10 tracking-widest shadow-lg shadow-primary/20">
                                                            Login / Sign Up
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
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
                            <Button variant="ghost" size="sm" className={styles.navButton}>
                                <HomeIcon className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                <span className={cn("hidden lg:inline", styles.navButtonText)}>Home</span>
                            </Button>
                        </Link>

                        {/* Shop Mega Menu */}
                        <div
                            onMouseEnter={handleShopMouseEnter}
                            onMouseLeave={handleShopMouseLeave}
                            className="flex items-center h-full"
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(styles.navButton, isShopMenuOpen && "bg-accent/50")}
                            >
                                <ShoppingBag className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                <span className={cn("hidden lg:inline", styles.navButtonText)}>Shop</span>
                                <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform duration-300", isShopMenuOpen && "rotate-180")} />
                            </Button>

                            <MegaMenu
                                isOpen={isShopMenuOpen}
                                onClose={() => setIsShopMenuOpen(false)}
                                categories={dynamicCategories}
                            />
                        </div>



                        <Link to="/user/orders">
                            <Button variant="ghost" size="sm" className={styles.navButton}>
                                <Package className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                <span className={cn("hidden lg:inline", styles.navButtonText)}>Orders</span>
                            </Button>
                        </Link>

                        <Link to="/account">
                            <Button variant="ghost" size="sm" className={styles.navButton}>
                                <UserCircle className={cn("h-4 w-4 flex-shrink-0", styles.navButtonIcon)} />
                                <span className={cn("hidden lg:inline", styles.navButtonText)}>My Account</span>
                            </Button>
                        </Link>
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
                </div >

                {
                    searchOpen && (
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
                    )
                }
            </div >
        </header >
    );
}
