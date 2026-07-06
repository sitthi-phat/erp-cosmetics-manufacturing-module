import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function useQcBatches(status?: string) {
  return useQuery({
    queryKey: ["qc-batches", status],
    queryFn: () => apiClient.get<{ data: any[] }>(`/qc/batches${status ? `?status=${status}` : ""}`).then((r) => r.data)
  });
}

export function useInspectBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, result, remarks }: { batchId: number; result: "Approved" | "Rejected"; remarks?: string }) =>
      apiClient.post(`/qc/batches/${batchId}/inspect`, { result, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-batches"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-eligible"] });
    }
  });
}

export function useInspectLot() {
  return useMutation({
    mutationFn: ({ lotId, result }: { lotId: number; result: "Passed" | "Failed" }) =>
      apiClient.post(`/qc/lots/${lotId}/inspect`, { result })
  });
}
