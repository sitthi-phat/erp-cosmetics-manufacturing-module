import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function useDashboard(role: string) {
  return useQuery({
    queryKey: ["dashboard", role],
    queryFn: () => apiClient.get<{ data: any }>(`/dashboard/${role}`).then((r) => r.data),
    refetchInterval: 30_000
  });
}
