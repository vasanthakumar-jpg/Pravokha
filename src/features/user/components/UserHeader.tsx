import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ShoppingBag, Heart, ShoppingCart, User, Menu, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SearchBar } from "@/components/common/SearchBar";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCart } from "@/contexts/CartContext";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

// Customer shopping navigation
const navigationItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "All Products", href: "/products", icon: ShoppingBag },
  { label: "T-Shirts", href: "/products?category=t-shirts" },
  { label: "Track Pants", href: "/products?category=track-pants" },
];

const genderCategories = [
  { label: "Mens", href: "/products?gender=mens" },
  { label: "Womens", href: "/products?gender=womens" },
  { label: "Kids", href: "/products?gender=kids" },
];

const accountItems = [
  { label: "Account", href: "/user", icon: User },
  { label: "Orders", href: "/orders", icon: Package },
];

export default function UserHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [wishlistCount] = useState(3); // Mock wishlist count
  const { resolvedTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const { cartCount, setIsCartOpen } = useCart();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${scrolled
        ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md"
        : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        }`}
    >
      <div className="w-full px-4 md:px-6 max-w-[100vw]">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <img
                      src={resolvedTheme === "dark" ? logoDark : logoLight}
                      alt="Logo"
                      className="h-12 w-auto object-contain"
                    />
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                  <nav className="flex flex-col gap-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button variant="ghost" className="w-full justify-start gap-3 text-base">
                            {Icon && <Icon className="h-5 w-5" />}
                            {item.label}
                          </Button>
                        </Link>
                      );
                    })}

                    <div className="border-t my-2 pt-2">
                      <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">
                        CATEGORIES
                      </p>
                      {genderCategories.map((category) => (
                        <Link
                          key={category.href}
                          to={category.href}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button variant="ghost" className="w-full justify-start text-sm">
                            {category.label}
                          </Button>
                        </Link>
                      ))}
                    </div>

                    {user && (
                      <div className="border-t my-2 pt-2">
                        <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">
                          MY ACCOUNT
                        </p>
                        {accountItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Button variant="ghost" className="w-full justify-start gap-3 text-base">
                                <Icon className="h-5 w-5" />
                                {item.label}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center">
              <img
                key={resolvedTheme}
                src={resolvedTheme === "dark" ? logoDark : logoLight}
                alt="Logo"
                className="h-11 md:h-12 w-auto object-contain transition-opacity duration-300"
              />
            </Link>
          </div>

          {/* Center: Shopping Navigation */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3 flex-1 justify-center">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-sm md:text-base font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            {/* Gender Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-sm md:text-base font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {genderCategories.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href} className="cursor-pointer">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Account & Orders - show only if logged in */}
            {user && (
              <>
                {accountItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} to={item.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-sm md:text-base font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Right: Search + Wishlist + Cart + Theme + Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:block w-48 lg:w-64">
              <SearchBar placeholder="Search products..." />
            </div>
            <div className="md:hidden">
              <SearchBar placeholder="Search..." iconOnly />
            </div>

            {/* Wishlist */}
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-secondary">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-secondary">
                  {cartCount}
                </Badge>
              )}
            </Button>

            <ThemeToggle />

            {/* Profile / Login */}
            {user ? (
              <UserAccountDropdown />
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-2 h-9">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

