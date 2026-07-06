import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function useDashboard(role: string) {
  return useQuery({
    queryKey: ["dashboard", role],
    queryFn: () => apiClient.get<{ data: any }>(`/dashboard/${role}`).then((r) => r.data),
    refetchInterval: 30_000,
    // OPEN-1 fix (QA verify-3, ECP-028 AC2): same root cause as useStock's OPEN-2 - React
    // Query's `refetchInterval` is paused while the page isn't focused/visible unless this is
    // set, which silently broke the "dashboard updates within 60s unprompted" requirement.
    refetchIntervalInBackground: true
  });
}
