import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface Customer {
  id: number;
  customerId: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  status: "Active" | "Inactive";
}

export function useCustomers(q = "") {
  return useQuery({
    queryKey: ["customers", q],
    queryFn: () => apiClient.get<{ data: Customer[] }>(`/customers?q=${encodeURIComponent(q)}`).then((r) => r.data)
  });
}

export function useCustomerPOs(customerId: number | null) {
  return useQuery({
    queryKey: ["customer-pos", customerId],
    queryFn: () => apiClient.get<{ data: unknown[] }>(`/customers/${customerId}/pos`).then((r) => r.data),
    enabled: customerId !== null
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; address?: string; phone?: string; email?: string; contactPerson?: string }) =>
      apiClient.post<{ data: Customer; warning: string | null }>("/customers", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] })
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<Customer> }) =>
      apiClient.put<{ data: Customer; warning: string | null }>(`/customers/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] })
  });
}
