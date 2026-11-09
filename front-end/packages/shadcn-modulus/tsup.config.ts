import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@canopy/chroma",
    "@canopy/shadcn-core",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
