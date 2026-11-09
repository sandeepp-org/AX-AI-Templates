import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { compile } from "sass";
import { defineConfig } from "tsup";

/** Each stylesheet the package ships, compiled from its SCSS source. */
const STYLESHEETS: readonly { from: string; to: string }[] = [
  { from: "src/index.scss", to: "dist/css/index.css" },
  { from: "src/themes/index.scss", to: "dist/css/themes/all.css" },
  {
    from: "src/themes/blue/light/index.scss",
    to: "dist/css/themes/blue/light.css",
  },
  {
    from: "src/themes/blue/dark/index.scss",
    to: "dist/css/themes/blue/dark.css",
  },
];

/** Asset folders copied as they are. */
const ASSET_FOLDERS = ["assets/fonts", "assets/icons"] as const;

export default defineConfig({
  entry: { index: "src/index.ts" },
  external: ["react", "react/jsx-runtime"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  onSuccess: async () => {
    for (const { from, to } of STYLESHEETS) {
      mkdirSync(dirname(resolve(to)), { recursive: true });
      writeFileSync(resolve(to), compile(resolve(from)).css);
    }
    for (const folder of ASSET_FOLDERS) {
      if (existsSync(resolve(folder))) {
        cpSync(resolve(folder), resolve("dist", folder), { recursive: true });
      }
    }
  },
});
