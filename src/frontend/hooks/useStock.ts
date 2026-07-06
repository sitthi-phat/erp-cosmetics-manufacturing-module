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
    refetchInterval: STOCK_POLL_FALLBACK_MS,
    // OPEN-2 fix (QA verify-3): React Query pauses `refetchInterval` while the tab/page is not
    // considered focused/visible by default (`refetchIntervalInBackground` defaults to false) -
    // that defeats the whole point of a "fallback poll in case the socket drops" (ADR-004 §4),
    // since a background/non-focused page is exactly when a dropped socket would otherwise
    // leave stock silently stale. Force polling to keep running regardless of focus.
    refetchIntervalInBackground: true
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
