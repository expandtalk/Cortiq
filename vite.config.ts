import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: 'public',
  build: {
    copyPublicDir: true,
  },
  ssr: {
    // Bundle next-themes for SSR — it expects browser globals otherwise
    noExternal: ['next-themes'],
  },
}));
