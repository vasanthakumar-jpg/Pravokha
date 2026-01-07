import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
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
      { title: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
      { title: "Dashboard", href: "/seller", icon: <LayoutDashboard className="h-4 w-4" /> },
    ]
  },
  {
    title: "Products",
    links: [
      { title: "All Products", href: "/products", icon: <ShoppingBag className="h-4 w-4" /> },
      { title: "My Products", href: "/seller/products", icon: <Package className="h-4 w-4" /> },
      { title: "Add Product", href: "/seller/products/add", icon: <Plus className="h-4 w-4" /> },
    ]
  },
  {
    title: "Orders",
    links: [
      { title: "All Orders", href: "/seller/orders", icon: <ShoppingBag className="h-4 w-4" /> },
    ]
  },
  {
    title: "Analytics",
    links: [
      { title: "Reports", href: "/seller/analytics", icon: <TrendingUp className="h-4 w-4" /> },
    ]
  },
  {
    title: "Payments",
    links: [
      { title: "Payouts", href: "/seller/payouts", icon: <DollarSign className="h-4 w-4" /> },
    ]
  },
  {
    title: "Settings",
    links: [
      { title: "Store Settings", href: "/seller/settings", icon: <SettingsIcon className="h-4 w-4" /> },
    ]
  }

];

export default function SellerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [allProductsDropdownOpen, setAllProductsDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, isSuspended, profile, loading } = useAuth();
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
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 2xl:gap-2 flex-1 justify-center overflow-hidden">
            {isSuspended ? (
              <>
                <Link to="/">
                  <Button variant="ghost" size="sm" className="group font-semibold whitespace-nowrap h-8 lg:h-9 px-2 xl:px-3">
                    <Home className="h-4 w-4 mr-2" /> Home
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="ghost" size="sm" className="group font-semibold whitespace-nowrap h-8 lg:h-9 px-2 xl:px-3">
                    <ShoppingBag className="h-4 w-4 mr-2" /> All products
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button variant="ghost" size="sm" className="group font-semibold whitespace-nowrap h-8 lg:h-9 px-2 xl:px-3 text-primary">
                    <Package className="h-4 w-4 mr-2" /> My orders
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Home Link */}
                <Link to="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group font-semibold whitespace-nowrap h-8 lg:h-9 px-2 xl:px-3 transition-all duration-200 overflow-hidden"
                  >
                    <Home className="h-4 w-4 xl:h-4 xl:w-4 flex-shrink-0" />
                    <span className="hidden xl:inline ml-2">Home</span>
                    <span className="xl:hidden inline max-w-0 group-hover:max-w-[100px] group-hover:ml-2 overflow-hidden transition-all duration-200 ease-in-out">Home</span>
                  </Button>
                </Link>

                {/* Dashboard Link */}
                <Link to="/seller">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "group font-semibold whitespace-nowrap h-8 lg:h-9 px-2 xl:px-3 transition-all duration-200 overflow-hidden",
                      location.pathname === "/seller" && "text-primary"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4 xl:h-4 xl:w-4 flex-shrink-0" />
                    <span className="hidden xl:inline ml-2">Dashboard</span>
                    <span className="xl:hidden inline max-w-0 group-hover:max-w-[100px] group-hover:ml-2 overflow-hidden transition-all duration-200 ease-in-out">Dashboard</span>
                  </Button>
                </Link>

                {/* Products Dropdown */}
                <DropdownMenu open={allProductsDropdownOpen} onOpenChange={setAllProductsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group font-semibold whitespace-nowrap h-8 lg:h-9 px-2 xl:px-3 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:outline-none"
                      onMouseEnter={() => setAllProductsDropdownOpen(true)}
                      onMouseLeave={() => setAllProductsDropdownOpen(false)}
                    >
                      <Package className="h-4 w-4 xl:h-4 xl:w-4 flex-shrink-0" />
                      <span className="hidden xl:inline ml-2">Products</span>
                      <span className="xl:hidden inline max-w-0 group-hover:max-w-[120px] group-hover:ml-2 overflow-hidden transition-all duration-200 ease-in-out">Products</span>
                      <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="w-48 focus:outline-none focus-visible:outline-none"
                    onMouseEnter={() => setAllProductsDropdownOpen(true)}
                    onMouseLeave={() => setAllProductsDropdownOpen(false)}
                  >
                    <Link to="/products">
                      <DropdownMenuItem className="cursor-pointer">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        All Products
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/seller/products">
                      <DropdownMenuItem className="cursor-pointer">
                        <Package className="h-4 w-4 mr-2" />
                        My Products
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/seller/products/add">
                      <DropdownMenuItem className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Remaining Links */}
                {navSections.flatMap(section => section.links)
                  .filter(link => link.title !== "Home" && link.title !== "Dashboard" && link.title !== "All Products" && link.title !== "My Products" && link.title !== "Add Product")
                  .map((link) => {
                    const isActive = location.pathname === link.href ||
                      location.pathname.startsWith(link.href + "/");
                    return (
                      <Link key={link.href} to={link.href}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "group font-semibold whitespace-nowrap h-8 lg:h-9 px-2 xl:px-3 transition-all duration-200 overflow-hidden",
                            isActive && "text-primary"
                          )}
                        >
                          <span className="[&>svg]:h-4 [&>svg]:w-4 xl:[&>svg]:h-4 xl:[&>svg]:w-4 flex-shrink-0">
                            {link.icon}
                          </span>
                          <span className="hidden xl:inline ml-2">{link.title}</span>
                          <span className="xl:hidden inline max-w-0 group-hover:max-w-[100px] group-hover:ml-2 overflow-hidden transition-all duration-200 ease-in-out">{link.title}</span>
                        </Button>
                      </Link>
                    );
                  })}
              </>
            )}
          </nav>

          {/* Right: Theme Toggle, Notifications and Avatar */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
                      <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0].toUpperCase() || "S"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-semibold">{profile?.full_name || "Seller"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 md:w-56 lg:w-60 bg-background border rounded-lg shadow-lg overflow-hidden animate-scale-in z-50">
                  <div className="p-2 sm:p-3 border-b bg-muted/50">
                    <p className="font-semibold text-xs sm:text-sm truncate">{profile?.full_name || user?.email?.split('@')[0] || "Seller"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    {isSuspended && <p className="text-[10px] text-destructive font-semibold mt-1">Suspended</p>}
                  </div>
                  <div className="py-1">
                    {isSuspended ? (
                      <>
                        <Link to="/orders" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-muted transition-colors">
                          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> My Orders
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-muted transition-colors"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Home
                        </Link>
                        <Link
                          to="/seller/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <SettingsIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Store Settings
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => { handleLogout(); setProfileMenuOpen(false); }}
                      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-muted transition-colors w-full text-left border-t mt-1"
                    >
                      <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

