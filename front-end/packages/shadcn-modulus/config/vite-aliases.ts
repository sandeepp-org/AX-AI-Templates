import path from "path"

type AliasMap = Record<string, string>

/**
 * Shared shadcn/chroma/frontend-utils aliases for Vite configs.
 *
 * Pass the app's __dirname as rootDir, e.g.:
 *   const aliases = createShadcnAliases(__dirname)
 *   resolve: { alias: { ...aliases, ...appSpecificAliases } }
 */
export function createShadcnAliases(rootDir: string): AliasMap {
  const resolveFromApp = (relativePath: string) =>
    path.resolve(rootDir, relativePath)

  return {
    "@/lib": resolveFromApp("../../packages/shadcn-core/src/lib"),
    "@/hooks": resolveFromApp("../../packages/shadcn-core/src/hooks"),
    "@/components": resolveFromApp("../../packages/shadcn-core/src/components"),

    "@shadcn-core": resolveFromApp("../../packages/shadcn-core/src"),
    "@canopy/shadcn-core": resolveFromApp("../../packages/shadcn-core/src"),

    "@canopy/shadcn-modulus": resolveFromApp(
      "../../packages/shadcn-modulus/src",
    ),
    "@canopy/chroma": resolveFromApp("../../packages/chroma/src"),
    "@canopy/frontend-utils": resolveFromApp(
      "../../packages/frontend-utils/src",
    ),
  }
}

 