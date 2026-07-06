import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function useTraceSearch() {
  return useMutation({
    mutationFn: (lotNumber: string) =>
      apiClient.get<{ data: any[] }>(`/trace?lot=${encodeURIComponent(lotNumber)}`).then((r) => r.data)
  });
}
