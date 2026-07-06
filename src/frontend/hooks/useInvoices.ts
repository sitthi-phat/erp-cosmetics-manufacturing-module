import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function useInvoices(status?: string) {
  return useQuery({
    queryKey: ["invoices", status],
    queryFn: () => apiClient.get<{ data: any[] }>(`/invoices${status ? `?status=${status}` : ""}`).then((r) => r.data)
  });
}

export function useInvoiceVersions(poId: number | null) {
  return useQuery({
    queryKey: ["invoice-versions", poId],
    queryFn: () => apiClient.get<{ data: any[] }>(`/pos/${poId}/invoice/versions`).then((r) => r.data),
    enabled: poId !== null
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, lines }: { poId: number; lines: any[] }) =>
      apiClient.post(`/pos/${poId}/invoice`, { lines }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos"] });
    }
  });
}

export function useReviseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, lines }: { invoiceId: number; lines: any[] }) =>
      apiClient.post<{ data: any; warnings: string[] }>(`/invoices/${invoiceId}/revise`, { lines }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-versions"] });
    }
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, amount, paymentDate, method }: { invoiceId: number; amount: number; paymentDate: string; method: string }) =>
      apiClient.post(`/invoices/${invoiceId}/payments`, { amount, paymentDate, method }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] })
  });
}
