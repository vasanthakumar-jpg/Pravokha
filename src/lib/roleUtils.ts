import { apiClient } from "@/infra/api/apiClient";

export type UserRole = "admin" | "seller" | "user" | "moderator" | null;

export async function fetchUserRole(userId: string): Promise<UserRole> {
    try {
        const response = await apiClient.get(`/users/${userId}/role`);
        if (response.data.success) {
            return response.data.role || "user";
        }
        return "user";
    } catch (error) {
        console.error("[roleUtils] Exception fetching role:", error);
        return "user";
    }
}
