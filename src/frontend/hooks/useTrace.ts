import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

/** ECP-014 (Gate 2 rework): single search box, server auto-detects Lot/Batch/PO/Invoice from
 * the term itself (§13.3.1) - no more "which field do I type this in" guesswork. */
export function useTraceSearch() {
  return useMutation({
    mutationFn: (term: string) =>
      apiClient.get<{ data: any[] }>(`/trace?q=${encodeURIComponent(term)}`).then((r) => r.data)
  });
}
