"use client";

import { createContext, useContext, useMemo } from "react";
import { authClient } from "@/lib/auth-client";

type Session = {
  id: string;
  fullName: string;
  email: string;
};

type AuthContextValue = {
  session: Session | null;
  status: "loading" | "authenticated" | "guest";
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; fullName: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sessionQuery = authClient.useSession();
  const session = useMemo<Session | null>(() => {
    if (!sessionQuery.data?.user) {
      return null;
    }

    return {
      id: sessionQuery.data.user.id,
      email: sessionQuery.data.user.email,
      fullName: sessionQuery.data.user.name || "Pemilik Toko",
    };
  }, [sessionQuery.data]);

  const status: AuthContextValue["status"] = sessionQuery.isPending
    ? "loading"
    : session
      ? "authenticated"
      : "guest";

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      login: async ({ email, password }) => {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          throw new Error(result.error.message || "Login gagal.");
        }
        await sessionQuery.refetch();
      },
      register: async ({ email, fullName, password }) => {
        const result = await authClient.signUp.email({ email, password, name: fullName });
        if (result.error) {
          throw new Error(result.error.message || "Pendaftaran gagal.");
        }
        await sessionQuery.refetch();
      },
      logout: async () => {
        const result = await authClient.signOut();
        if (result.error) {
          throw new Error(result.error.message || "Logout gagal.");
        }
        await sessionQuery.refetch();
      },
      refreshSession: async () => {
        await sessionQuery.refetch();
      },
    }),
    [session, sessionQuery, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  }

  return context;
}
