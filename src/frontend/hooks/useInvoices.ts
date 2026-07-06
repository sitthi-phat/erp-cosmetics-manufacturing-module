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

/** ECP-040: full detail (customer, lines, subtotal/discount/vat/total, payments) for one invoice. */
export function useInvoiceDetail(invoiceId: number | null) {
  return useQuery({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: () => apiClient.get<{ data: any }>(`/invoices/${invoiceId}`).then((r) => r.data),
    enabled: invoiceId !== null
  });
}

/** ECP-042: assembled print-view data (issuer/customer snapshot, Thai baht text, etc). */
export function useInvoiceDocument(invoiceId: number | null) {
  return useQuery({
    queryKey: ["invoice-document", invoiceId],
    queryFn: () => apiClient.get<{ data: any }>(`/invoices/${invoiceId}/document`).then((r) => r.data),
    enabled: invoiceId !== null
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, lines, discountAmount }: { poId: number; lines: any[]; discountAmount?: number }) =>
      apiClient.post(`/pos/${poId}/invoice`, { lines, discountAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos"] });
    }
  });
}

export function useReviseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, lines, discountAmount }: { invoiceId: number; lines: any[]; discountAmount?: number }) =>
      apiClient.post<{ data: any; warnings: string[] }>(`/invoices/${invoiceId}/revise`, { lines, discountAmount }),
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
