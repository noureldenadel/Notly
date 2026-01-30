import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Core React libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Heavy canvas library
          'vendor-tldraw': ['tldraw'],
          // PDF handling
          'vendor-pdf': ['react-pdf', 'pdfjs-dist'],
          // Rich text editor
          'vendor-editor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-color',
            '@tiptap/extension-highlight',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-text-style',
            '@tiptap/extension-underline',
          ],
          // UI component libraries
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
          ],
          // State management
          'vendor-state': ['zustand', 'immer', '@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 700, // Adjust warning for large vendor chunks
  },
  // Drop console in production via esbuild
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
