"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AdminContextValue = {
  isAdmin: boolean;
  authenticate: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <AdminContext.Provider
      value={{ isAdmin, authenticate: () => setIsAdmin(true) }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
