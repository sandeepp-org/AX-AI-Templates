import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  external: ["react", "react-dom", "react/jsx-runtime"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
