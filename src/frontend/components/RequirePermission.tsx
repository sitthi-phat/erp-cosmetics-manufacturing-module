import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import { EmptyState, Spin } from "../ui";

/**
 * Frontend-side route guard (ECP-034/backend is ADR-005's real enforcement point - this is
 * purely UX so a user without permission sees a clear Thai message instead of a broken page).
 */
export function RequirePermission({
  resource,
  action,
  children
}: {
  resource: string;
  action: string;
  children: ReactNode;
}) {
  const { me, isLoading, isError, hasPermission } = useAuth();

  if (isLoading) return <Spin spinning>{null}</Spin>;
  if (isError || !me) return <Navigate to="/login" replace />;
  if (!hasPermission(resource, action)) {
    return <EmptyState description="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" testId="access-denied-message" />;
  }
  return <>{children}</>;
}
