import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "web",
  envDir: "..",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "web/index.html"),
        laporan: resolve(__dirname, "web/contoh-laporan.html"),
        privasi: resolve(__dirname, "web/privasi.html"),
      },
    },
  },
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
});
