import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "lucide-react",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "date-fns",
      "recharts",
      "clsx",
      "tailwind-merge"
    ]
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Group heavy 3D, particle, and chart libraries separately so they don't block the main app load
            if (
              id.includes("three") ||
              id.includes("@react-three") ||
              id.includes("ogl") ||
              id.includes("recharts")
            ) {
              return "vendor-visuals";
            }
            return "vendor";
          }
        }
      }
    }
  }
}));
