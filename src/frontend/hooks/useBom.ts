import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface BomLine {
  id: number;
  materialId: number;
  materialName?: string;
  qtyPerUnit: number;
}

export interface BomSummary {
  id: number;
  productId: number;
  productName?: string;
  lines: BomLine[];
}

/** ECP-039: list every product's BOM. */
export function useBoms() {
  return useQuery({
    queryKey: ["boms"],
    queryFn: () => apiClient.get<{ data: BomSummary[] }>("/boms").then((r) => r.data)
  });
}

export function useBom(productId: number | null) {
  return useQuery({
    queryKey: ["bom", productId],
    queryFn: () => apiClient.get<{ data: BomSummary | null }>(`/boms/${productId}`).then((r) => r.data),
    enabled: productId !== null
  });
}

export function useCreateBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: number; lines: Array<{ materialId: number; qtyPerUnit: number }> }) =>
      apiClient.post<{ data: BomSummary }>("/boms", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });
}

export function useUpdateBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, lines }: { productId: number; lines: Array<{ id?: number; materialId: number; qtyPerUnit: number }> }) =>
      apiClient.put<{ data: BomSummary }>(`/boms/${productId}`, { lines }),
    onSuccess: (_d, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["bom", productId] });
    }
  });
}

export function useDeleteBomLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, lineId }: { productId: number; lineId: number }) =>
      apiClient.delete(`/boms/${productId}/lines/${lineId}`),
    onSuccess: (_d, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["bom", productId] });
    }
  });
}
