import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AppThemeProvider, NotifyHost } from "./ui";
import { AuthProvider } from "./lib/authContext";
import { router } from "./router";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } }
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
