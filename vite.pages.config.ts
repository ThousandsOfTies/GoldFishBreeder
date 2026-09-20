import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Keep this static build independent of the existing Sites/Cloudflare build.
// Relative asset URLs work both at /GoldFishBreeder/ and on a custom domain.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  build: {
    outDir: "dist-pages",
  },
});
