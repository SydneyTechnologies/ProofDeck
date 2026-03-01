import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@proofdeck/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@proofdeck/ai": fileURLToPath(new URL("../../packages/ai/src/index.ts", import.meta.url))
    }
  }
});
