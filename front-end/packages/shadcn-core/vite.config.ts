import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shadcn-core": path.resolve(__dirname, "../packages/shadcn-core/src"), // library
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "CanopyShadcnCore",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format}.js`,
    },
  },
})