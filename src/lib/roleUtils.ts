import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "seller" | "user" | "moderator" | null;

export async function fetchUserRole(userId: string): Promise<UserRole> {
    try {
        // console.log(`[roleUtils] Fetching role for user: ${userId}`);

        const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

        if (error) {
            // console.error("[roleUtils] Error fetching role:", error);
            return "user";
        }

        const role = (data?.role as UserRole) || "user";
        // console.log(`[roleUtils] Role determined: ${role}`);
        return role;
    } catch (error) {
        // console.error("[roleUtils] Exception fetching role:", error);
        return "user";
    }
}
