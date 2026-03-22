import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/**", "node_modules/**", ".next/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
