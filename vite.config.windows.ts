import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./client/src"),
      "@shared": resolve(__dirname, "./shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:5000",
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    },
    hmr: {
      overlay: true,
    }
  },
  clearScreen: false,
  cacheDir: '.vite-cache', // Use a different cache directory to avoid permission issues
});