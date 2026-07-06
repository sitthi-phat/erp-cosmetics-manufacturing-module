import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function useShipments() {
  return useQuery({
    queryKey: ["shipments"],
    queryFn: () => apiClient.get<{ data: any[] }>("/shipments").then((r) => r.data)
  });
}

export function useEligibleBatches() {
  return useQuery({
    queryKey: ["shipping-eligible"],
    queryFn: () => apiClient.get<{ data: any[] }>("/shipments/eligible-batches").then((r) => r.data)
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { batchId: number; shippedDate: string }) =>
      apiClient.post("/shipments", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-eligible"] });
      queryClient.invalidateQueries({ queryKey: ["pos"] });
    }
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deliveredDate }: { id: number; deliveredDate: string }) =>
      apiClient.patch(`/shipments/${id}/status`, { status: "Delivered", deliveredDate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipments"] })
  });
}
