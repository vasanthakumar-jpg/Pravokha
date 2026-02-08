import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { cn, getMediaUrl } from "@/lib/utils";
import { Button } from "@/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import { Input } from "@/ui/Input";
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
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Settings as SettingsIcon,
  LayoutDashboard,
  Home,
  Package,
  ShoppingBag,
  Users,
  Store,
  UserCog,
  CreditCard,
  BarChart,
  Shield,
  ShoppingCart,
  ChevronDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  Command as CommandIcon,
  TrendingUp,
  ShieldAlert,
  LogOutIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/ui/Command";

import { NotificationBell } from "@/shared/ui/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/DropdownMenu";

interface NavLink {
  title: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: string[]; // Optional: if defined, restricts access
}

interface NavSection {
  title: string;
  links: NavLink[];
}

const navSections: NavSection[] = [
  {
    title: "Intelligence",
    links: [
      { title: "Owner Dashboard", href: "/admin/super-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, allowedRoles: ['SUPER_ADMIN'] },
      { title: "Staff Workspace", href: "/admin/staff-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, allowedRoles: ['ADMIN'] },
      { title: "Analytics", href: "/admin/analytics", icon: <BarChart className="h-4 w-4" /> }, // Controlled access
      { title: "Reports", href: "/admin/reports", icon: <TrendingUp className="h-4 w-4" /> },
    ]
  },
  {
    title: "Marketplace",
    links: [
      { title: "Orders", href: "/admin/orders", icon: <ShoppingCart className="h-4 w-4" /> },
      { title: "Tracking", href: "/admin/orders/tracking", icon: <Package className="h-4 w-4" /> },
      { title: "Sellers", href: "/admin/sellers", icon: <Store className="h-4 w-4" /> },
      { title: "Customers", href: "/admin/customers", icon: <Users className="h-4 w-4" /> },
    ]
  },
  {
    title: "Inventory",
    links: [
      { title: "Products", href: "/admin/products/manage", icon: <Package className="h-4 w-4" /> },
      { title: "Categories", href: "/admin/categories", icon: <LayoutDashboard className="h-4 w-4" /> },
      { title: "Subcategories", href: "/admin/subcategories", icon: <ShoppingBag className="h-4 w-4" /> },
      { title: "Offers", href: "/admin/combo-offers", icon: <Plus className="h-4 w-4" /> },
    ]
  },
  {
    title: "System",
    links: [
      { title: "Payments", href: "/admin/payments", icon: <CreditCard className="h-4 w-4" />, allowedRoles: ['SUPER_ADMIN'] }, // Private Financials
      { title: "Tickets", href: "/admin/tickets", icon: <Shield className="h-4 w-4" /> },
      { title: "Users", href: "/admin/users", icon: <UserCog className="h-4 w-4" /> }, // User Management (General)
      { title: "Admins & Roles", href: "/admin/roles", icon: <UserCog className="h-4 w-4" />, allowedRoles: ['SUPER_ADMIN'] }, // Critical Action
      { title: "Audit Logs", href: "/admin/audit-logs", icon: <Shield className="h-4 w-4" />, allowedRoles: ['SUPER_ADMIN'] },
      { title: "Suspended Tickets", href: "/admin/tickets/suspended", icon: <ShieldAlert className="h-4 w-4" /> },
      { title: "System Settings", href: "/admin/settings", icon: <SettingsIcon className="h-4 w-4" />, allowedRoles: ['SUPER_ADMIN'] }, // Critical Config
      { title: "Profile Settings", href: "/admin/profile-settings", icon: <UserCog className="h-4 w-4" />, allowedRoles: ['ADMIN'] }, // Staff Config
    ]
  }
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, role, signOut } = useAuth(); // Get role
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const NavItem = ({ link, collapsed }: { link: NavLink; collapsed: boolean }) => {
    const isActive = location.pathname === link.href || (link.href !== "/admin" && location.pathname.startsWith(link.href));
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link to={link.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/5",
                collapsed ? "px-0 justify-center h-10 w-10 mx-auto rounded-xl" : "px-3 h-11 rounded-xl"
              )}
            >
              <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
                <span className={cn(isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  {link.icon}
                </span>
                {!collapsed && <span className="text-sm font-semibold truncate">{link.title}</span>}
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Button>
          </Link>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="bg-popover text-popover-foreground">
            {link.title}
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {navSections.map((section) => {
            const visibleLinks = section.links.filter(link => !link.allowedRoles || (role && link.allowedRoles.includes(role.toUpperCase())));
            if (visibleLinks.length === 0) return null;

            return (
              <CommandGroup key={section.title} heading={section.title}>
                {visibleLinks.map((link) => (
                  <CommandItem
                    key={link.href}
                    onSelect={() => {
                      setCommandOpen(false);
                      navigate(link.href);
                    }}
                    className="cursor-pointer"
                  >
                    <Link to={link.href} className="flex items-center gap-2 w-full">
                      {link.icon}
                      <span>{link.title}</span>
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem className="cursor-pointer" onSelect={() => handleLogout()}>
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign Out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* FIXED Navbar */}
      <header className="fixed top-0 left-0 right-0 h-20 border-b bg-card/60 backdrop-blur-xl flex items-center justify-between z-40 px-0">
        <div
          className={cn(
            "flex-1 flex items-center justify-between h-full transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
          )}
        >
          {/* Left Section: Mobile Menu, Logo, Search */}
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 h-full">
            {/* Mobile Menu Trigger (Hamburger) - Visible only on mobile */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 border-r bg-card/60 backdrop-blur-xl">
                  <div className="p-6 border-b border-border/50">
                    <img
                      src={resolvedTheme === "dark" ? logoDark : logoLight}
                      alt="Logo"
                      className="h-10 w-auto"
                    />
                  </div>
                  <ScrollArea className="h-[calc(100vh-80px)] px-4 py-6">
                    {navSections.map((section) => {
                      const visibleLinks = section.links.filter(link => !link.allowedRoles || (role && link.allowedRoles.includes(role.toUpperCase())));
                      if (visibleLinks.length === 0) return null;

                      return (
                        <div key={section.title} className="mb-6 last:mb-0">
                          <h3 className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground/50">
                            {section.title}
                          </h3>
                          <div className="space-y-1">
                            {visibleLinks.map((link) => (
                              <Link key={link.href} to={link.href} onClick={() => setMobileMenuOpen(false)}>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start h-11 px-3 rounded-xl transition-all",
                                    location.pathname === link.href
                                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                      : "hover:bg-primary/10 hover:text-primary"
                                  )}
                                >
                                  <span className={cn("mr-3", location.pathname === link.href ? "text-primary-foreground" : "text-muted-foreground")}>
                                    {link.icon}
                                  </span>
                                  <span className="text-sm font-semibold">{link.title}</span>
                                </Button>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            {/* Brand Logo */}
            <Link to="/admin" className="hidden sm:block transition-all hover:opacity-80">
              <img
                src={resolvedTheme === "dark" ? logoDark : logoLight}
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
            {/* Mobile Logo (Icon only if needed, or just same logo) */}
            <Link to="/admin" className="sm:hidden transition-all hover:opacity-80">
              <img
                src={resolvedTheme === "dark" ? logoDark : logoLight}
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>


            {/* Deep-Search Trigger */}
            <div
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border/50 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-all shadow-sm ml-auto sm:ml-0"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground hidden md:block">Search...</span>
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[9px] font-bold opacity-70">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          {/* Right Section: Controls */}
          <div className="flex items-center gap-2 sm:gap-4 pr-4 sm:pr-6 h-full text-right">
            <ThemeToggle />
            <NotificationBell />

            {/* User Avatar - Visible on Mobile too now */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0 rounded-full border border-border/40 ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getMediaUrl(user?.avatar_url)} />
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {user?.name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/50 shadow-xl">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-medium text-sm">{user?.name || 'Admin'}</p>
                    <p className="w-[200px] truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => handleLogout()} className="text-destructive cursor-pointer font-bold focus:bg-destructive/10">
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Layout Body */}
      <div className="flex flex-1 pt-20 h-screen overflow-hidden">
        {/* FIXED Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? "80px" : "280px" }}
          className="fixed left-0 top-0 bottom-0 z-50 hidden lg:flex flex-col border-r bg-card/40 backdrop-blur-xl transition-all duration-300 ease-in-out shrink-0"
        >
          {/* ARROW TOGGLE (On the border) - Moved slightly TOP */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-4 top-16 z-50 h-8 w-8 rounded-full border bg-background shadow-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-all duration-300"
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </Button>

          <ScrollArea className="flex-1">
            <div className="space-y-6 py-8 px-4">
              {navSections.map((section) => {
                const visibleLinks = section.links.filter(link => !link.allowedRoles || (role && link.allowedRoles.includes(role.toUpperCase())));
                if (visibleLinks.length === 0) return null;

                return (
                  <div key={section.title} className="space-y-2">
                    {!sidebarCollapsed && (
                      <h3 className="px-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground/40 uppercase">
                        {section.title}
                      </h3>
                    )}
                    <div className="space-y-1">
                      {visibleLinks.map((link) => (
                        <NavItem key={link.href} link={link} collapsed={sidebarCollapsed} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* User Profile & Logout (Sidebar Bottom) */}
          <div className="mt-auto p-4 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full transition-all duration-300 rounded-xl overflow-hidden",
                    sidebarCollapsed ? "px-0 justify-center h-12" : "px-3 h-14 justify-start gap-3"
                  )}
                >
                  <Avatar className={cn("ring-2 ring-primary/10 transition-all", sidebarCollapsed ? "h-9 w-9" : "h-10 w-10")}>
                    <AvatarImage src={getMediaUrl(user?.avatar_url)} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {user?.name?.[0] || user?.email?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex flex-col items-start overflow-hidden">
                      <p className="text-xs font-bold leading-none mb-1 truncate w-full">{user?.name || "Admin"}</p>
                      <p className="text-[10px] text-muted-foreground font-medium opacity-60 truncate w-full">Account Settings</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={sidebarCollapsed ? "center" : "start"} side="right" className="w-56 rounded-2xl border-border/50 shadow-xl ml-2">
                <DropdownMenuItem onClick={() => handleLogout()} className="text-destructive cursor-pointer font-bold focus:bg-destructive/10">
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.aside>

        {/* Main Content Area (Independent Scroll) */}
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-muted/10 h-full transition-all duration-300 ease-in-out font-sans",
            sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
          )}
        >
          <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
