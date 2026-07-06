import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function useProductionQueue() {
  return useQuery({
    queryKey: ["production-queue"],
    queryFn: () => apiClient.get<{ data: any[] }>("/production/queue").then((r) => r.data)
  });
}

export function useAssignedProductionOrders() {
  return useQuery({
    queryKey: ["production-assigned"],
    queryFn: () => apiClient.get<{ data: any[] }>("/production/assigned").then((r) => r.data)
  });
}

export interface MaterialPlanLine {
  materialId: number;
  materialName: string;
  requiredQty: number;
  proposedLots: Array<{ lotId: number; lotNumber: string; allocQty: number }>;
  shortfall: number;
}

/**
 * ECP-013 AC1: auto-calculated material requirement + FIFO lot proposal for a production order -
 * root-cause fix for defect D (Production no longer types/guesses an internal Lot id).
 */
export function useMaterialPlan(productionOrderId: number | null) {
  return useQuery({
    queryKey: ["material-plan", productionOrderId],
    queryFn: () =>
      apiClient.get<{ data: MaterialPlanLine[] }>(`/production/${productionOrderId}/material-plan`).then((r) => r.data),
    enabled: productionOrderId !== null
  });
}

export function useAssignProduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poLineId, assignedTo }: { poLineId: number; assignedTo: number }) =>
      apiClient.post(`/production/${poLineId}/assign`, { assignedTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-queue"] });
      queryClient.invalidateQueries({ queryKey: ["production-assigned"] });
    }
  });
}

export function useProduceBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productionOrderId,
      producedQty,
      lotSelections
    }: {
      productionOrderId: number;
      producedQty: number;
      lotSelections: Array<{ materialId: number; lotId: number; qtyUsed: number }>;
    }) => apiClient.post(`/production/${productionOrderId}/produce`, { producedQty, lotSelections }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-queue"] });
      queryClient.invalidateQueries({ queryKey: ["production-assigned"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["qc-batches"] });
    }
  });
}
