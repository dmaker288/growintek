import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/sitemap.xml": "http://localhost:3000",
      "/robots.txt": "http://localhost:3000",
      "/llms.txt": "http://localhost:3000",
      "/llm.txt": "http://localhost:3000",
      "/feed.xml": "http://localhost:3000",
    },
  },
  build: { sourcemap: false },
});
