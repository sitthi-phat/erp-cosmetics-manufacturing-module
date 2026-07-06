import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface CompanyProfile {
  id: number;
  companyName: string;
  address: string;
  taxId: string;
  phone: string;
  logoUrl: string | null;
  updatedAt: string;
}

/** ECP-041: singleton company profile used as the "issuer" on printed documents. */
export function useCompanyProfile() {
  return useQuery({
    queryKey: ["company-profile"],
    queryFn: () => apiClient.get<{ data: CompanyProfile | null }>("/admin/company-profile").then((r) => r.data)
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { companyName: string; address: string; taxId: string; phone: string; logoUrl?: string }) =>
      apiClient.put<{ data: CompanyProfile }>("/admin/company-profile", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-profile"] })
  });
}
