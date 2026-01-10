import { useState, useEffect, useMemo } from "react";
import {
  Users as UsersIcon,
  Search,
  UserCog,
  Ban,
  RefreshCw,
  Download,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Mail,
  Calendar,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  FileText,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCcw,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";
import { useAuth } from "@/core/context/AuthContext";
import { useAdmin } from "@/core/context/AdminContext";
import { useNavigate } from "react-router-dom";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/ui/Skeleton";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import { StatsCard } from "@/feat/admin/components/StatsCard";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Badge } from "@/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/Select";
import { Label } from "@/ui/Label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/DropdownMenu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/Pagination";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  status: string;
  verificationStatus: string;
  phone?: string | null;
  address?: string | null;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // CRITICAL: Authentication check to prevent unauthorized access
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Failed to fetch user directory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (user: User) => {
    try {
      const newStatus = user.status === "active" ? "suspended" : "active";
      const response = await apiClient.patch(`/users/${user.id}/status`, { status: newStatus });

      if (response.data.success) {
        toast({ title: "Governance Action Complete", description: `User status set to ${newStatus}.` });
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      }
    } catch (error) {
      console.error("[Governance Error]:", error);
      toast({ title: "Action Failed", description: "Identity server rejected the protocol update.", variant: "destructive" });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    if (selectedUser.role.toLowerCase() === newRole.toLowerCase()) {
      setShowRoleDialog(false);
      return;
    }

    try {
      const response = await apiClient.patch(`/users/${selectedUser.id}/role`, { role: newRole.toUpperCase() });

      if (response.data.success) {
        toast({ title: "Role Authorization Updated", description: `Access level changed to ${newRole}.` });
        setShowRoleDialog(false);
        fetchUsers();
      }
    } catch (error) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      sellers: users.filter(u => u.role === 'seller').length,
      suspended: users.filter(u => u.status === 'suspended').length
    };
  }, [users]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, roleFilter]);

  if (loading) return <AdminSkeleton variant="table" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex-1 flex flex-col gap-4 sm:gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs w-fit justify-start shadow-sm"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center flex-wrap gap-3">
                  User Management
                  <Badge variant="outline" className="text-xs font-medium bg-primary/5 rounded-lg border-primary/20 shrink-0">{users.length} Total</Badge>
                </h1>
                <p className="text-xs sm:text-base text-muted-foreground mt-1">Account management and permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none h-10 rounded-xl border-border/60 bg-card font-medium text-xs shadow-sm"
                onClick={fetchUsers}
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                <Download className="mr-2 h-4 w-4" /> Export data
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatsCard
            title="Platform admins"
            value={stats.admins.toString()}
            icon={ShieldCheck}
            color="bg-blue-600"
            description="Superuser accounts"
          />
          <StatsCard
            title="Verified sellers"
            value={stats.sellers.toString()}
            icon={UserCheck}
            color="bg-emerald-500"
            description="Authorized merchant nodes"
          />
          <StatsCard
            title="Active accounts"
            value={(stats.total - stats.suspended).toString()}
            icon={UsersIcon}
            color="bg-primary"
            description="Net active platform users"
          />
          <StatsCard
            title="Suspended"
            value={stats.suspended.toString()}
            icon={AlertCircle}
            color="bg-rose-500"
            description="Deactivated for compliance"
            trend="Attention needed"
          />
        </div>

        {/* Main Identity Grid/Table */}
        <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/40 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UsersIcon className="h-5 w-5 text-primary opacity-70" />
                <CardTitle className="text-sm font-medium">User directory</CardTitle>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11 bg-card border-border/60 focus:ring-primary/20 rounded-xl text-sm"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-11 rounded-xl border-border/60 bg-card px-4 text-sm font-medium">
                    <SelectValue placeholder="Role filter" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="text-sm font-medium">All roles</SelectItem>
                    <SelectItem value="user" className="text-sm font-medium">Users</SelectItem>
                    <SelectItem value="seller" className="text-sm font-medium">Sellers</SelectItem>
                    <SelectItem value="admin" className="text-sm font-bold text-primary">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          {/* Mobile Card List View */}
          <div className="sm:hidden px-4 pb-4 space-y-3">
            {loading ? (
              <AdminSkeleton variant="list" skeletonProps={{ count: 3 }} />
            ) : paginatedUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No users found matching criteria</p>
              </div>
            ) : (
              paginatedUsers.map((user) => (
                <Card key={user.id} className="border-border/60 bg-card overflow-hidden shadow-sm" onClick={() => { setSelectedUser(user); setShowProfileModal(true); }}>
                  <CardHeader className="p-3 bg-muted/20 border-b border-border/10 pb-2 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3 w-[75%]">
                      <Avatar className="h-8 w-8 rounded-lg border border-border/40">
                        <AvatarImage src={user.avatarUrl || ""} aria-label={user.name || user.email} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold text-[10px]">
                          {user.full_name?.charAt(0) || user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate">{user.name || 'Incognito Entity'}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold border-border/60 ml-2 shrink-0 self-start hover:bg-transparent shadow-none capitalize",
                      user.role === 'admin' ? "bg-primary/10 text-primary border-primary/20" :
                        user.role === 'seller' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          "bg-muted/10 text-muted-foreground"
                    )}>
                      {user.role}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-3 pt-3 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground">Status</span>
                      <Badge className={cn(
                        "border-none shadow-none font-bold text-[9px] px-2 py-0.5 rounded-md w-fit hover:bg-transparent capitalize",
                        user.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      )}>
                        {user.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground block text-right">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-48 border-border/40">
                          <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowProfileModal(true); }}>
                            <Eye className="mr-2 h-3.5 w-3.5 text-primary" /> View dossier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowRoleDialog(true); }}>
                            <UserCog className="mr-2 h-3.5 w-3.5 text-primary" /> Modify Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={cn("cursor-pointer", user.id === currentUser?.id ? "opacity-50 cursor-not-allowed" : "")}
                            disabled={user.id === currentUser?.id}
                            onClick={(e) => { e.stopPropagation(); handleSuspendUser(user); }}
                          >
                            <Ban className={cn("mr-2 h-3.5 w-3.5", user.status === 'active' ? "text-rose-500" : "text-emerald-500")} />
                            {user.status === 'active' ? "Revoke Access" : "Restore Access"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <CardContent className="p-0 hidden sm:block">
            <div className="overflow-x-auto overflow-y-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="px-6 h-12 text-xs font-medium text-muted-foreground/70">User information</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground/70 text-center">Role</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground/70 text-center">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground/70 text-center">Joined on</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground/70 text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LayoutGroup>
                    <AnimatePresence mode="popLayout">
                      {paginatedUsers.map((user, idx) => (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.05 }}
                          key={user.id}
                          className="border-b border-border/20 hover:bg-white/50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                          onClick={() => { setSelectedUser(user); setShowProfileModal(true); }}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 rounded-xl border border-border/40 relative z-10">
                                <AvatarImage src={user.avatarUrl || ""} aria-label={user.name || user.email} />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                                  {user.full_name?.charAt(0) || user.email.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm tracking-tight truncate max-w-[180px]">{user.name || 'Incognito Entity'}</span>
                                <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{user.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn(
                              "px-3 py-0.5 rounded-full text-[10px] font-bold border-border/60 hover:bg-transparent shadow-none",
                              user.role === 'admin' ? "bg-primary/10 text-primary border-primary/20" :
                                user.role === 'seller' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                  "bg-muted/10 text-muted-foreground"
                            )}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <Badge className={cn(
                                "border-none shadow-none font-bold text-[10px] px-2 py-0.5 rounded-lg hover:bg-transparent capitalize min-w-[70px] justify-center",
                                user.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                              )}>
                                {user.status}
                              </Badge>
                              {user.role === 'seller' && (
                                <Badge variant="outline" className={cn(
                                  "text-[8px] font-bold px-1.5 py-0 h-4 border-none shadow-none hover:bg-transparent",
                                  user.verificationStatus === 'verified' ? "text-emerald-500/70" :
                                    user.verificationStatus === 'rejected' ? "text-rose-500/70" : "text-amber-500/70"
                                )}>
                                  {user.verificationStatus === 'verified' ? 'Verified Reg.' :
                                    user.verificationStatus === 'rejected' ? 'Restricted Reg.' : 'Pending Reg.'}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-[11px] font-medium text-muted-foreground font-mono">
                              {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </TableCell>
                          <TableCell className="px-10 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all p-0 border border-transparent hover:border-primary/10"
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowProfileModal(true); }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl w-56 p-2 border-border/40">
                                  <DropdownMenuLabel className="text-xs font-medium px-3 py-2 text-muted-foreground">Actions</DropdownMenuLabel>
                                  <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowRoleDialog(true); }}>
                                    <UserCog className="mr-3 h-4 w-4 text-primary" /> Modify authorization
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className={cn("rounded-xl px-3 py-2.5 cursor-pointer", user.id === currentUser?.id ? "opacity-50 cursor-not-allowed" : "")}
                                    disabled={user.id === currentUser?.id}
                                    onClick={(e) => { e.stopPropagation(); handleSuspendUser(user); }}
                                  >
                                    <Ban className={cn("mr-3 h-4 w-4", user.status === 'active' ? "text-rose-500" : "text-emerald-500")} />
                                    {user.status === 'active' ? "Revoke clearance" : "Restore clearance"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </LayoutGroup>
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-border/40 bg-muted/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs font-medium text-muted-foreground w-full sm:w-auto text-center sm:text-left">
              {stats.total} users registered
            </p>
            <Pagination className="w-auto mx-0">
              <PaginationContent className="gap-2">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                    className={cn("h-9 rounded-xl border-border/60 bg-card font-medium text-xs", currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-muted transition-all")}
                  />
                </PaginationItem>
                <div className="h-9 px-4 rounded-xl border border-border/40 bg-primary/5 flex items-center justify-center font-bold text-[11px] text-primary">
                  {currentPage} / {totalPages || 1}
                </div>
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                    className={cn("h-9 rounded-xl border-border/60 bg-card font-medium text-xs", currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-muted transition-all")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>

        {/* Profile Detail Dialog */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/60 rounded-2xl bg-card shadow-xl">
            <DialogHeader className="p-6 bg-primary text-white">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-2xl border-2 border-white/20 shadow-lg" >
                  <AvatarImage src={selectedUser?.avatarUrl || ""} />
                  <AvatarFallback className="bg-white/10 text-white font-bold text-xl" >
                    {selectedUser?.name?.charAt(0) || selectedUser?.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5" >
                  <DialogTitle className="text-xl font-bold" > Identity dossier </DialogTitle>
                  <DialogDescription className="text-white/80 font-medium text-xs" >
                    Reviewing: {selectedUser?.name || selectedUser?.email}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-0 max-h-[80vh] overflow-y-auto scrollbar-none section-scroll" >
              <div className="p-6 space-y-8" >
                {/* Identification Group */}
                <section className="space-y-4" >
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2" >
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] font-black tracking-[0.2em] text-primary" > Identification </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" >
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1.5 hover:bg-muted/50 transition-colors" >
                      <p className="text-[9px] font-black text-muted-foreground tracking-widest" > Platform UUID </p>
                      <p className="text-[11px] font-mono font-bold break-all text-foreground leading-relaxed" > {selectedUser?.id} </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1.5 hover:bg-muted/50 transition-colors" >
                      <p className="text-[9px] font-black text-muted-foreground tracking-widest" > Core role </p>
                      <Badge variant="outline" className="w-fit bg-primary/10 text-primary border-primary/20 rounded-lg px-2.5 py-0.5 text-[10px] font-bold" >
                        {selectedUser?.role}
                      </Badge>
                    </div>
                  </div>
                </section>

                {/* Contact Interface Group */}
                <section className="space-y-4" >
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2" >
                    <Mail className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] font-black tracking-[0.2em] text-primary" > Contact interface </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" >
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1.5 hover:bg-muted/50 transition-colors" >
                      <p className="text-[9px] font-black text-muted-foreground tracking-widest" > Reach email </p>
                      <p className="text-sm font-bold truncate text-foreground" > {selectedUser?.email} </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1.5 hover:bg-muted/50 transition-colors" >
                      <p className="text-[9px] font-black text-muted-foreground tracking-widest" > Official phone </p>
                      <p className="text-sm font-bold text-foreground" > {selectedUser?.phone || 'NOT CONNECTED'} </p>
                    </div>
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1.5 hover:bg-muted/50 transition-colors" >
                      <p className="text-[9px] font-black text-muted-foreground tracking-widest" > Registered address </p>
                      <p className="text-sm font-medium text-foreground leading-relaxed" >
                        {selectedUser?.address || 'No address registered'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Account Metrics */}
                <section className="space-y-4" >
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2" >
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] font-black tracking-[0.2em] text-primary" > Account metrics </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" >
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1.5 hover:bg-muted/50 transition-colors" >
                      <p className="text-[9px] font-black text-muted-foreground tracking-widest" > Genesis date </p>
                      <div className="flex items-center gap-2 mt-1" >
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm font-bold text-foreground" >
                          {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          }) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 flex flex-col gap-1.5 hover:bg-muted/50 transition-colors" >
                      <p className="text-[9px] font-black text-muted-foreground tracking-widest" > Clearance status </p>
                      <div className="flex items-center gap-2 mt-1" >
                        <div className={cn("h-2 w-2 rounded-full", selectedUser?.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]")} />
                        <p className={cn("text-xs font-black tracking-wider", selectedUser?.status === 'active' ? "text-emerald-600" : "text-rose-600")} >
                          {selectedUser?.status === 'active' ? "Active" : "Suspended"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
            <div className="p-6 pt-2 flex flex-col gap-3" >
              <Button
                variant={selectedUser?.status === 'suspended' ? "default" : "destructive"}
                className="rounded-xl h-12 font-bold transition-all"
                onClick={() => { if (selectedUser) handleSuspendUser(selectedUser); setShowProfileModal(false); }}
              >
                {selectedUser?.status === 'suspended' ? <RefreshCw className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                {selectedUser?.status === 'suspended' ? "Authorize platform access" : "Revoke platform clearance"}
              </Button>
              <Button variant="ghost" className="text-xs font-bold text-muted-foreground" onClick={() => setShowProfileModal(false)} >
                Close dossier
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Role Authorization Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog} >
          <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-border/40 rounded-3xl bg-card shadow-xl" >
            <DialogHeader className="p-6 bg-slate-900 text-white" >
              <div className="flex items-center gap-3" >
                <UserCog className="h-5 w-5 text-primary" />
                <DialogTitle className="text-xl font-bold" > Role authorization </DialogTitle>
              </div>
              <DialogDescription className="text-slate-400" >
                Update platform clearance for <span className="text-white font-semibold" > {selectedUser?.email} </span>
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6" >
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-4" >
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed" >
                  Platform roles dictate universal access levels. Admin grants full sovereignty.
                </p>
              </div>

              <div className="space-y-3" >
                <Label className="text-xs font-bold text-muted-foreground ml-1" > New clearance level </Label>
                <Select value={newRole} onValueChange={setNewRole} >
                  <SelectTrigger className="h-12 rounded-xl border-border/60 bg-background font-bold px-4" >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-1" >
                    <SelectItem value="user" className="rounded-lg font-medium" > Marketplace User </SelectItem>
                    <SelectItem value="seller" className="rounded-lg font-medium" > Verified Seller </SelectItem>
                    <SelectItem value="admin" className="rounded-lg font-bold text-primary" > Platform Admin </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-2" >
                <Button variant="ghost" onClick={() => setShowRoleDialog(false)} className="flex-1 rounded-xl font-bold" > Cancel </Button>
                <Button onClick={handleUpdateRole} className="flex-1 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20" > Update role </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


function InfoItem({ label, value, icon }: { label: string; value: string | undefined | null; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[8px] font-black tracking-widest text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-sm font-bold truncate max-w-full">{value || "UNDEFINED"}</span>
    </div>
  );
}




