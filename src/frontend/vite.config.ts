import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local dev proxy so the SPA can call /api and /rt without CORS friction (backend on :4000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
      "/rt": { target: "http://localhost:4000", changeOrigin: true, ws: true }
    }
  }
});
