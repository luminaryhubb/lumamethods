import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../server/dist", // build do client vai para o backend
    emptyOutDir: true
  }
});
