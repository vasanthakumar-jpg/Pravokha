import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/Select";
import { toast } from "@/shared/hook/use-toast";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";
import { useAuth } from "@/core/context/AuthContext";
import { Users, Shield, Store, User as UserIcon, ArrowLeft } from "lucide-react";
import { AdminHeaderSkeleton, AdminTableSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";

interface UserWithRole {
  id: string;
  email: string;
  createdAt: string;
  role: string | null;
}

export default function AdminRoleManagement() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  // CRITICAL: Authentication check to prevent privilege escalation
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const mapRoleBackToFront = (role: string | null): string => {
    if (!role) return "user";
    const r = role.toLowerCase();
    if (r === 'dealer') return 'seller';
    return r;
  };

  const mapRoleFrontToBack = (role: string): string => {
    if (role === 'DEALER' || role === 'seller') return 'DEALER';
    return role.toUpperCase();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users?take=5000');

      if (response.data.success) {
        const usersWithRoles = (response.data.users as any[]).map(u => ({
          id: u.id,
          email: u.email,
          createdAt: u.createdAt,
          role: mapRoleBackToFront(u.role)
        }));
        setUsers(usersWithRoles);
      }
    } catch (error: any) {
      console.error("[AdminRoleManagement] Error in fetchUsers:", error);
      toast({
        title: "Error Loading Users",
        description: "Failed to fetch users from backend",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const backendRole = mapRoleFrontToBack(newRole);
      const response = await apiClient.patch(`/users/${userId}/role`, { role: backendRole });

      if (response.data.success) {
        toast({
          title: "Success",
          description: `User role updated to ${newRole}`,
        });
        fetchUsers();
      }
    } catch (error: any) {
      console.error("[AdminRoleManagement] Error updating role:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "seller":
        return <Store className="h-4 w-4" />;
      case "user":
        return <UserIcon className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "seller":
        return "default";
      case "user":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
        <AdminHeaderSkeleton />
        <AdminTableSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Role Management</h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-1">Manage user roles and permissions</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/60 bg-card rounded-xl overflow-hidden shadow-sm">
        <CardContent>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AdminTableSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {user.id.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="flex items-center gap-1"
                      >
                        {getRoleIcon(user.role)}
                        {user.role || "No Role"}
                      </Badge>

                      <Select
                        value={user.role || "user"}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                        disabled={currentUser?.role !== 'SUPER_ADMIN'}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              User
                            </div>
                          </SelectItem>
                          <SelectItem value="seller">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4" />
                              Seller
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}

                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                    No users found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
