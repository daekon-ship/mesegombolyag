import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

declare const process: { env: Record<string, string | undefined> };

const devPort = Number(process.env.VITE_PORT || 4173);
const apiTarget = `http://localhost:${process.env.PORT || 3001}`;

export default defineConfig({
  // Relatív hivatkozások: a HashRouter miatt minden oldal az index.html-ből töltődik,
  // így a build bármely alapútvonal alatt (/, /mesegombolyag/) változtatás nélkül működik.
  base: "./",
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: devPort,
    // Foglalt port esetén álljon le, ne lépjen csendben másikra — különben a levelekben
    // szereplő hivatkozások (PUBLIC_SITE_URL) egy másik, ugyanott futó alkalmazásra mutatnának.
    strictPort: true,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/uploads": { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: devPort,
    strictPort: true,
  },
});
