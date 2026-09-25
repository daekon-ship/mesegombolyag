import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/mesegombolyag/",
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 4173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
