import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function useUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiClient.get<{ data: any[] }>("/users").then((r) => r.data)
  });
}

/**
 * DEF-14 fix (QA verify-4, Major): ProductionPage's "assign worker" dropdown used to call
 * `useUsers()` -> `GET /users`, which requires the Admin-only `user_management.view_users`
 * permission - Production never had it, so the dropdown was always empty (403). This calls the
 * new, narrower `GET /users/basic` (permission `user.view_basic`, granted to Production) which
 * returns only `{id, fullName}` for active users - enough to populate an assignee picker without
 * needing full user-management visibility (username/role/status) that Production has no business
 * need for.
 */
export function useBasicUsers() {
  return useQuery({
    queryKey: ["basic-users"],
    queryFn: () => apiClient.get<{ data: Array<{ id: number; fullName: string }> }>("/users/basic").then((r) => r.data)
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => apiClient.get<{ data: any[] }>("/roles").then((r) => r.data)
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; fullName: string; password: string; roleId: number }) =>
      apiClient.post("/users", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] })
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: { roleId?: number; status?: string; fullName?: string } }) =>
      apiClient.put(`/users/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] })
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: Array<{ resource: string; action: string; allow: boolean }> }) =>
      apiClient.put(`/roles/${roleId}/permissions`, { permissions }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-roles"] })
  });
}

export function useVatConfig() {
  return useQuery({
    queryKey: ["vat-config"],
    queryFn: () => apiClient.get<{ data: { id: number; rate: number } }>("/admin/vat-config").then((r) => r.data)
  });
}

export function useUpdateVatConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rate: number) => apiClient.put("/admin/vat-config", { rate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vat-config"] })
  });
}

export function useAuditLogs(params: { userId?: string; actionType?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params.userId) qs.set("userId", params.userId);
  if (params.actionType) qs.set("actionType", params.actionType);
  if (params.page) qs.set("page", String(params.page));
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => apiClient.get<{ data: any[]; meta: any }>(`/audit-logs?${qs.toString()}`)
  });
}
