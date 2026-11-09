/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/** Where the web app is served in development and preview. */
const WEB_PORT = 3000;

/** Where the API listens when API_PROXY_TARGET is not set (back-end/app default PORT). */
const DEFAULT_API_TARGET = "http://localhost:3001";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // The browser calls /api on the web origin; the dev server forwards it, so no CORS setup is needed locally.
  const proxy = {
    "/api": {
      target: env.API_PROXY_TARGET || DEFAULT_API_TARGET,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { port: WEB_PORT, strictPort: true, proxy },
    preview: { port: WEB_PORT, strictPort: true, proxy },
    build: { outDir: "dist", sourcemap: mode !== "production" },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
