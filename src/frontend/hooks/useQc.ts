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

export interface IncomingLot {
  id: number;
  lotNumber: string;
  materialId: number;
  materialName: string;
  receivedQty: number;
  uom: string;
  supplierName: string;
  incomingQcStatus: string;
  receivedDate: string;
}

/** ECP-017 AC1 (E29): lots awaiting incoming QC, with qty/lot-number/supplier already captured
 * at goods-receipt time - QA/QC reviews this list instead of typing/guessing a raw Lot id. */
export function useIncomingLots(status = "Pending") {
  return useQuery({
    queryKey: ["incoming-lots", status],
    queryFn: () => apiClient.get<{ data: IncomingLot[] }>(`/qc/lots?status=${status}`).then((r) => r.data)
  });
}

export function useInspectLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lotId, result }: { lotId: number; result: "Passed" | "Failed" }) =>
      apiClient.post(`/qc/lots/${lotId}/inspect`, { result }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incoming-lots"] })
  });
}
