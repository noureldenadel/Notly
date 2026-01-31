import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use relative paths for Tauri production builds (absolute paths fail with tauri:// protocol)
  base: './',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize production build
    target: 'esnext',
    // Use esbuild for minification (default, faster than terser)
    minify: 'esbuild',
    // Let Vite handle chunking automatically - manual chunks was causing circular dependency issues
    chunkSizeWarningLimit: 1000,
  },
  // Drop console and debugger statements in production for smaller bundle
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
