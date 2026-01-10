import { createContext, useContext, ReactNode } from "react";
import { useAuth, User } from "./AuthContext";

interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
  user: User | null;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  loading: true,
  user: null,
});

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const isAdmin = role === "admin";

  return (
    <AdminContext.Provider value={{ isAdmin, loading, user }}>
      {children}
    </AdminContext.Provider>
  );
}
