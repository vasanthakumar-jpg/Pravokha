import { createContext, useContext, ReactNode } from "react";
import { useAuth, User } from "@/core/context/AuthContext";

interface AdminContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  user: User | null;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isSuperAdmin: false,
  loading: true,
  user: null,
});

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const isSuperAdmin = role?.toUpperCase() === "SUPER_ADMIN";
  const isAdmin = isSuperAdmin || role?.toUpperCase() === "ADMIN";

  return (
    <AdminContext.Provider value={{ isAdmin, isSuperAdmin, loading, user }}>
      {children}
    </AdminContext.Provider>
  );
}
