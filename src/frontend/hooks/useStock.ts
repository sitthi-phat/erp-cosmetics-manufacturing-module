import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { getSocket, STOCK_POLL_FALLBACK_MS } from "../lib/socket";

export interface StockRow {
  materialId: number;
  materialName: string;
  uom: string;
  physicalQty: number;
  reservedQty: number;
  availableQty: number;
  outOfStock: boolean;
  updatedAt: string | null;
}

/**
 * ECP-007: subscribes to `stock.changed` over Socket.IO to invalidate the query cache
 * immediately, with a 30s polling fallback in case the socket connection drops (ADR-004 §4).
 */
export function useStock() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["stock"] });
    socket.on("stock.changed", invalidate);
    return () => {
      socket.off("stock.changed", invalidate);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["stock"],
    queryFn: () => apiClient.get<{ data: StockRow[] }>("/stock").then((r) => r.data),
    refetchInterval: STOCK_POLL_FALLBACK_MS
  });
}

export function useStockReconciliation(materialId: number | null) {
  return useQuery({
    queryKey: ["stock-reconciliation", materialId],
    queryFn: () =>
      apiClient
        .get<{ data: unknown }>(`/stock/reconciliation?material=${materialId}`)
        .then((r) => r.data),
    enabled: materialId !== null
  });
}
