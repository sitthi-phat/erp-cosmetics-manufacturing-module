import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient";

export interface MePermission {
  resource: string;
  action: string;
  allow: boolean;
}

export interface MeResponse {
  id: number;
  userId: string;
  username: string;
  fullName: string;
  role: string;
  permissions: MePermission[];
}

interface AuthContextValue {
  me: MeResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Polls GET /auth/me periodically (ADR-005 rev.2: FE should refetch within the permission TTL
 * window so the menu/guards stay in sync even without an explicit re-login).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get<{ data: MeResponse }>("/auth/me").then((r) => r.data),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      me: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      hasPermission: (resource, action) =>
        Boolean(query.data?.permissions.some((p) => p.resource === resource && p.action === action && p.allow)),
      refetch: () => void query.refetch()
    }),
    [query.data, query.isLoading, query.isError, query.refetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useInvalidateMe() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["me"] });
}
