import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface Product {
  id: number;
  name: string;
  uom: string;
  status: string;
  hasBom: boolean;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => apiClient.get<{ data: Product[] }>("/products").then((r) => r.data)
  });
}

export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: () => apiClient.get<{ data: unknown[] }>("/materials").then((r) => r.data)
  });
}
