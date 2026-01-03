import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
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
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
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
} from "@/components/ui/Command";

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
    title: "Intelligence",
    links: [
      { title: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
      { title: "Analytics", href: "/admin/analytics", icon: <BarChart className="h-4 w-4" /> },
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
      { title: "Payments", href: "/admin/payments", icon: <CreditCard className="h-4 w-4" /> },
      { title: "Tickets", href: "/admin/tickets", icon: <Shield className="h-4 w-4" /> },
      { title: "Users", href: "/admin/users", icon: <UserCog className="h-4 w-4" /> },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: <Shield className="h-4 w-4" /> },
      { title: "Suspended Tickets", href: "/admin/tickets/suspended", icon: <ShieldAlert className="h-4 w-4" /> },
      { title: "Settings", href: "/admin/settings", icon: <SettingsIcon className="h-4 w-4" /> },
    ]
  }
];

import { ShieldAlert, LogOut as LogOutIcon } from "lucide-react";

import { NotificationBell } from "@/components/common/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, profile } = useAuth();
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
    <div className="min-h-screen bg-background flex">
      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {navSections.map((section) => (
            <CommandGroup key={section.title} heading={section.title}>
              {section.links.map((link) => (
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
          ))}
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem className="cursor-pointer" onSelect={() => handleLogout()}>
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign Out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? "80px" : "280px" }}
        className="hidden lg:flex flex-col border-r bg-card/60 backdrop-blur-xl sticky top-0 h-screen z-50 transition-all duration-300 ease-in-out group"
      >
        <div className="p-6 flex items-center justify-between h-20 border-b border-border/10 relative">
          <AnimatePresence mode="wait">
            {sidebarCollapsed ? (
              <motion.div
                key="collapsed-logo"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex items-center justify-center flex-1"
              >
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img
                    src={resolvedTheme === "dark" ? logoDark : logoLight}
                    alt="Logo"
                    className="h-full w-full object-contain scale-[2.2] translate-y-[-2px]"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="expanded-logo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 w-full"
              >
                <img
                  src={resolvedTheme === "dark" ? logoDark : logoLight}
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar Toggle Button - Now at the Top */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "h-7 w-7 rounded-lg border border-border/50 bg-background/50 hover:bg-accent text-muted-foreground transition-all duration-300 shadow-sm",
              sidebarCollapsed ? "absolute -right-3.5 top-1/2 -translate-y-1/2 z-50" : "ml-auto"
            )}
          >
            {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-4">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {!sidebarCollapsed && (
                  <h3 className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.links.map((link) => (
                    <NavItem key={link.href} link={link} collapsed={sidebarCollapsed} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 bg-muted/30 relative">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full transition-all rounded-xl", sidebarCollapsed ? "px-0 justify-center h-12 w-12 mx-auto" : "px-3 justify-start gap-3 h-12")}>
                <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {profile?.full_name?.[0] || user?.email?.[0]}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-bold truncate w-full">{profile?.full_name || "Admin"}</span>
                    <span className="text-[10px] text-muted-foreground truncate w-full opacity-70 font-medium">{user?.email}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/50 shadow-xl">
              <DropdownMenuItem onClick={() => handleLogout()} className="text-destructive cursor-pointer font-bold focus:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header / TopNav */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-40">
          <div className="flex items-center gap-4 flex-1">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <div className="lg:hidden flex items-center gap-2">
                <img
                  src={resolvedTheme === "dark" ? logoDark : logoLight}
                  alt="Logo"
                  className="h-8 w-auto"
                />
              </div>
              <SheetContent side="left" className="w-72 p-0 border-r bg-card/60 backdrop-blur-xl">
                <div className="p-6 border-b border-border/50">
                  <img
                    src={resolvedTheme === "dark" ? logoDark : logoLight}
                    alt="Logo"
                    className="h-10 w-auto"
                  />
                </div>
                <ScrollArea className="h-[calc(100vh-80px)] px-4 py-6">
                  {navSections.map((section) => (
                    <div key={section.title} className="mb-6 last:mb-0">
                      <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        {section.title}
                      </h3>
                      <div className="space-y-1">
                        {section.links.map((link) => (
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
                  ))}
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Breadcrumbs or Command trigger */}
            <div className="hidden md:flex items-center text-sm text-muted-foreground">
              <div
                onClick={() => setCommandOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50 cursor-pointer hover:bg-muted transition-colors mr-4"
              >
                <Search className="h-4 w-4" />
                <span>Search...</span>
                <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <NotificationBell />
            <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold">{profile?.full_name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground">Platform Governance</p>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

