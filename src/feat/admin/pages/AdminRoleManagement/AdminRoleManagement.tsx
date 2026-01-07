import { useState, useEffect } from "react";
import { supabase } from "@/infra/api/supabase";
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
import { Users, Shield, Store, User as UserIcon, ArrowLeft } from "lucide-react";
import { AdminHeaderSkeleton, AdminTableSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "seller" | "user" | null;
}

export default function AdminRoleManagement() {
  const { isAdmin, loading: adminLoading } = useAdmin();
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

  const fetchUsers = async () => {
    try {
      console.log("[AdminRoleManagement] Starting fetchUsers...");

      // Fetch user_roles with user metadata
      // Since we can't use admin.listUsers() from client side, we'll work with user_roles table
      console.log("[AdminRoleManagement] Fetching user_roles...");
      const { data: rolesData, error: rolesError } = await supabase
        .from("users")
        .select("*");

      if (rolesError) {
        console.error("[AdminRoleManagement] Error fetching user_roles:", rolesError);
        throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
      }

      console.log("[AdminRoleManagement] Roles data:", rolesData);

      // Fetch profiles to get email addresses
      console.log("[AdminRoleManagement] Fetching profiles...");
      const { data: profilesData, error: profilesError } = await supabase
        .from("users")
        .select("id, full_name, avatar_url");

      if (profilesError) {
        console.warn("[AdminRoleManagement] Error fetching profiles:", profilesError);
        // Don't throw - profiles are optional
      }

      console.log("[AdminRoleManagement] Profiles data:", profilesData);

      // Get current auth user to extract email
      console.log("[AdminRoleManagement] Getting current user...");
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("[AdminRoleManagement] Error getting current user:", userError);
      }

      console.log("[AdminRoleManagement] Current user:", currentUser?.id);

      // Combine data - since we can't access all users' emails from client,
      // we'll show user IDs and fetch emails where available
      const usersWithRoles: UserWithRole[] = (rolesData || []).map((roleEntry) => {
        const profile = profilesData?.find((p) => p.id === roleEntry.user_id);

        // For current user, we have the email
        const isCurrentUser = roleEntry.user_id === currentUser?.id;
        const displayName = profile?.full_name ||
          (isCurrentUser ? currentUser.email : null) ||
          `User ${roleEntry.user_id.slice(0, 8)}`;

        return {
          id: roleEntry.user_id,
          email: displayName,
          created_at: roleEntry.created_at || new Date().toISOString(),
          role: roleEntry.role as "admin" | "seller" | "user" | null,
        };
      });

      console.log("[AdminRoleManagement] Users with roles:", usersWithRoles.length);

      // If no users with roles found, show a helpful message
      if (usersWithRoles.length === 0) {
        console.warn("[AdminRoleManagement] No users found with roles");
        toast({
          title: "No Role Assignments Yet",
          description: "Create user roles by assigning roles to users below. New users will default to 'user' role.",
          variant: "default",
        });
      }

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("[AdminRoleManagement] Error in fetchUsers:", error);

      // Provide more specific error messages
      let errorMessage = error.message || "Failed to fetch users";
      if (error.code === "42501") {
        errorMessage = "Database permission error. Please check Row Level Security policies for user_roles table.";
      } else if (error.message?.includes("403") || error.message?.includes("not allowed")) {
        errorMessage = "Access forbidden. This might be a database permission issue.";
      }

      toast({
        title: "Error Loading Users",
        description: errorMessage,
        variant: "destructive",
      });

      // Set empty array so UI doesn't break
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log(`[AdminRoleManagement] Updating role for user ${userId} to ${newRole}`);

      // First, delete existing role(s) for this user
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("[AdminRoleManagement] Error deleting old role:", deleteError);
        throw deleteError;
      }

      // Then insert the new role with proper type casting
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          user_id: userId,
          role: newRole as "admin" | "seller" | "user" | "moderator"
        });

      if (insertError) {
        console.error("[AdminRoleManagement] Error inserting new role:", insertError);
        throw insertError;
      }

      console.log(`[AdminRoleManagement] Successfully updated role to ${newRole}`);

      // Automated Audit Insertion
      await supabase.from("audit_logs").insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        target_id: userId,
        target_type: "user",
        action_type: "role_change",
        severity: "warning",
        description: `User role updated to ${newRole}`,
        metadata: { new_role: newRole }
      });

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      // Refresh the list
      fetchUsers();
    } catch (error: any) {
      console.error("[AdminRoleManagement] Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
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
              className="h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs w-fit justify-start"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">Access Control</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5">Manage administrative roles and platform permissions</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
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
