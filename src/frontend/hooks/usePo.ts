import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface POLineInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  uom: string;
}

export function usePOs(status?: string) {
  return useQuery({
    queryKey: ["pos", status],
    queryFn: () => apiClient.get<{ data: any[] }>(`/pos${status ? `?status=${status}` : ""}`).then((r) => r.data)
  });
}

export function usePO(id: number | null) {
  return useQuery({
    queryKey: ["po", id],
    queryFn: () => apiClient.get<{ data: any }>(`/pos/${id}`).then((r) => r.data),
    enabled: id !== null
  });
}

export function usePOTimeline(id: number | null) {
  return useQuery({
    queryKey: ["po-timeline", id],
    queryFn: () => apiClient.get<{ data: any[] }>(`/pos/${id}/timeline`).then((r) => r.data),
    enabled: id !== null
  });
}

export function useCreatePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { customerId: number; requestedDeliveryDate: string; lines: POLineInput[] }) =>
      apiClient.post<{ data: any }>("/pos", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pos"] })
  });
}

export function useConfirmPO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.post(`/pos/${id}/confirm`),
    onSuccess: (_d, id) => {
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      queryClient.invalidateQueries({ queryKey: ["po", id] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    }
  });
}

export function useCancelPO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.post(`/pos/${id}/cancel`),
    onSuccess: (_d, id) => {
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      queryClient.invalidateQueries({ queryKey: ["po", id] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    }
  });
}

/** ECP-004 AC2/AC5: delete a line from a still-Draft PO (post-create, pre-confirm). */
export function useDeletePOLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, lineId }: { poId: number; lineId: number }) =>
      apiClient.delete(`/pos/${poId}/lines/${lineId}`),
    onSuccess: (_d, { poId }) => {
      queryClient.invalidateQueries({ queryKey: ["po", poId] });
      queryClient.invalidateQueries({ queryKey: ["pos"] });
    }
  });
}

export function useBomCheck() {
  return useMutation({
    mutationFn: (input: { productId: number; orderQty: number }) =>
      apiClient.post<{ data: { sufficient: boolean; shortages: any[] } }>("/stock/check", input).then((r) => r.data)
  });
}
