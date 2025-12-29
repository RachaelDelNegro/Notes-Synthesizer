import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
       "@": path.resolve(__dirname, "./src"),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url))
    }
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001"
    }
  }
});