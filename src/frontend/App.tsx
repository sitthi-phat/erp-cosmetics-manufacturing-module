import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AppThemeProvider, NotifyHost, Notify } from "./ui";
import { AuthProvider } from "./lib/authContext";
import { ApiError } from "./lib/apiClient";
import { router } from "./router";

/**
 * OPEN-3 fix (QA verify-3): the central error surface (`ui/Notify`, ECP-036) was only ever
 * invoked from mutation `catch` blocks written by hand on each page - a plain read (`useQuery`)
 * failure (e.g. `GET /customers` returning 500) never reached `Notify.error` at all, so
 * `notify-error` stayed empty even though the request genuinely failed. A `QueryCache`-level
 * `onError` covers EVERY query failure app-wide, not just the ones a page happens to handle
 * explicitly. `/auth/me` (see lib/authContext.tsx) is marked `meta: { silent: true }` because a
 * 401 there is an expected, normal state before login - not an error worth a toast.
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent) return;
      if (error instanceof ApiError) {
        Notify.error(error.message);
      } else {
        Notify.error("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
      }
    }
  })
});

export function App() {
  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotifyHost />
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </AppThemeProvider>
  );
}
