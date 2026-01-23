import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";
import { apiClient } from "@/infra/api/apiClient";
import { cn } from "@/lib/utils";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { toast } from "@/shared/hook/use-toast";
import { Badge } from "@/ui/Badge";
import { Input } from "@/ui/Input";
import { Separator } from "@/ui/Separator";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/ui/Table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/DropdownMenu";
import {
  ArrowLeft,
  Users,
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Phone,
  UserCheck,
  Calendar,
  Download,
  FilterX,
  Ban
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
}

export default function AdminCustomers() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
      return;
    }
    if (isAdmin) {
      loadProfiles();
    }
  }, [isAdmin, adminLoading, navigate, currentPage]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * pageSize;

      const response = await apiClient.get('/users', {
        params: {
          skip: from,
          take: pageSize,
          searchQuery: searchQuery
        }
      });

      if (response.data.success) {
        setProfiles(response.data.users || []);
        setTotalCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      toast({
        title: "Link Error",
        description: "Failed to establish sync with Identity Server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCustomer = async (customerId: string, status: 'verified' | 'rejected') => {
    try {
      const response = await apiClient.post(`/users/${customerId}/verify`, {
        status: status === 'verified' ? 'approved' : 'rejected'
      });

      if (response.data.success) {
        toast({
          title: status === 'verified' ? "Account Verified" : "Account Restricted",
          description: `Customer clearance has been updated to ${status}.`,
        });
        loadProfiles();
      }
    } catch (error) {
      console.error("[Verification Error]:", error);
      toast({ title: "Action Failed", description: "Verification transmission failed.", variant: "destructive" });
    }
  };

  const handleRestrictCustomer = async (customerId: string) => {
    try {
      const response = await apiClient.patch(`/users/${customerId}/status`, {
        status: 'suspended'
      });

      if (response.data.success) {
        toast({
          title: "Account Restricted",
          description: "Global platform clearance has been revoked for this account.",
          variant: "destructive",
        });
        loadProfiles();
      }
    } catch (err) {
      console.error("[Restriction Error]:", err);
      toast({ title: "Action Failed", description: "Restriction transmission failed.", variant: "destructive" });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredProfiles = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (adminLoading || loading) {
    return <AdminSkeleton variant="registry" skeletonProps={{ count: pageSize }} />;
  }

  if (!isAdmin) return null;

  return (
    <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-3 sm:gap-6 lg:gap-8 animate-in fade-in duration-500 pb-6 sm:pb-8 lg:pb-10">
      <div className="flex flex-col gap-3 sm:gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
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
                Customer Management
                <Badge variant="outline" className="text-xs font-medium bg-primary/5 rounded-lg border-primary/20 shrink-0 h-5 px-2">
                  {profiles.length} Total
                </Badge>
              </h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-1">
                Manage registered users and engagement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none rounded-xl h-10 font-medium text-xs bg-card shadow-sm" onClick={loadProfiles}>
              Refresh
            </Button>
            <Button className="flex-1 sm:flex-none h-8 sm:h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
              <Download className="mr-2 h-3.5 w-3.5" /> Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-9 h-10 sm:h-11 bg-muted/40 rounded-xl border-border/40 text-xs sm:text-sm placeholder:text-[10px] sm:placeholder:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="space-y-2 sm:hidden">
        {filteredProfiles.length === 0 ? (
          <Card className="border-border/60 bg-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No customer matching your query.</p>
            </CardContent>
          </Card>
        ) : (
          filteredProfiles.map((profile) => (
            <Card key={profile.id} className="border-border/60 bg-card overflow-hidden shadow-sm">
              <CardHeader className="p-2.5 bg-muted/20 border-b border-border/10 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center font-bold text-primary text-[10px] shrink-0">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                      ) : (
                        profile.full_name?.charAt(0) || <Users className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm truncate text-foreground">{profile.full_name || 'Anonymous User'}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "rounded-full text-[9px] font-bold px-2 py-0 h-5 hover:bg-transparent shadow-none",
                    (profile as any).verificationStatus === 'verified' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      (profile as any).verificationStatus === 'rejected' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                        "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    {((profile as any).verificationStatus === 'verified' ? 'Verified' : (profile as any).verificationStatus === 'rejected' ? 'Restricted / Suspended' : 'Pending')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2.5 pt-2.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</span>
                  <span className="font-medium text-foreground truncate max-w-[150px]">{profile.email || 'N/A'}</span>
                </div>
                {profile.phone && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone</span>
                    <span className="font-medium text-foreground font-mono">{profile.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Registered</span>
                  <span className="font-medium text-foreground">{profile.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : 'N/A'}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs font-medium">
                      Manage Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border/50">
                    <DropdownMenuLabel>Customer Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/admin/orders', { state: { customerEmail: profile.email } })}>
                      <Eye className="mr-2 h-4 w-4" /> View Order History
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleVerifyCustomer(profile.id, 'verified')}>
                      <UserCheck className="mr-2 h-4 w-4" /> Verify Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => handleRestrictCustomer(profile.id)}>
                      Restrict Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Customers Table */}
      <Card className="hidden sm:block border-border/60 bg-card overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs font-medium text-muted-foreground/70 px-4">Customer</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground/70">Contact information</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground/70">Account status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground/70">Registration date</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground/70 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No customer matching your query.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id} className="group hover:bg-primary/5 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center font-bold text-primary text-xs shrink-0">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                          ) : (
                            profile.full_name?.charAt(0) || <Users className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm tracking-tight">{profile.full_name || 'Anonymous User'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" /> {profile.email || 'No email'}
                        </div>
                        {profile.phone && (
                          <div className="flex items-center gap-2 text-[11px] font-medium font-mono text-muted-foreground">
                            <Phone className="h-3 w-3" /> {profile.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn(
                          "rounded-full text-[10px] font-bold px-3 py-0.5 hover:bg-transparent shadow-none capitalize w-fit",
                          (profile as any).verificationStatus === 'verified'
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : (profile as any).verificationStatus === 'rejected'
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          {((profile as any).verificationStatus === 'verified' ? 'Verified' : (profile as any).verificationStatus === 'rejected' ? 'Restricted / Suspended' : 'Pending')}
                        </Badge>
                        {(profile as any).status === 'suspended' && (
                          <span className="text-[9px] font-bold text-rose-500/80 ml-1 flex items-center gap-1">
                            <Ban className="h-2.5 w-2.5" /> Platform Access Revoked
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> {profile.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border/50">
                          <DropdownMenuLabel>Customer Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/admin/orders', { state: { customerEmail: profile.email } })}>
                            <Eye className="mr-2 h-4 w-4" /> View Order History
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleVerifyCustomer(profile.id, 'verified')}>
                            <UserCheck className="mr-2 h-4 w-4" /> Verify Account
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => handleRestrictCustomer(profile.id)}>
                            Restrict Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 pt-0">
          <p className="text-xs font-semibold text-muted-foreground tracking-widest opacity-70">
            Page {currentPage} of {totalPages} <Separator orientation="vertical" className="inline mx-2 h-3" /> {totalCount} Records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="rounded-xl h-10 px-4 font-semibold border-border/50 bg-background/50 shadow-sm"
            >
              Back
            </Button>
            <div className="flex items-center gap-1.5 px-3">
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-xl font-semibold transition-all",
                    currentPage === i + 1 ? "bg-primary shadow-lg shadow-primary/20 scale-110" : "hover:bg-primary/10"
                  )}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="rounded-xl h-10 px-4 font-semibold border-border/50 bg-background/50 shadow-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

