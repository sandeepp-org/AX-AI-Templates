import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** `app/src`, from this file's folder (`app/src/modules`). */
const SRC = join(__dirname, "..");
const MODULES = join(SRC, "modules");

/** The layers a module must never import: it owns ports, the outer layers implement and call them. */
const OUTER_LAYERS = ["channels", "infrastructure", "bootstrap"];

// Every .ts file under a folder, depth first.
const filesUnder = (folder: string): string[] =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) {
      return filesUnder(path);
    }
    return entry.name.endsWith(".ts") ? [path] : [];
  });

// The relative import specifiers of a file, resolved to paths under `app/src` (forward slashes, no extension).
const importsOf = (file: string): string[] =>
  [...readFileSync(file, "utf8").matchAll(/from\s+"(\.{1,2}\/[^"]+)"/g)].map(
    (match) =>
      relative(SRC, join(file, "..", match[1]))
        .split(sep)
        .join("/")
        .replace(/\.js$/, "")
  );

const moduleNames = readdirSync(MODULES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe("module boundaries", () => {
  it("should find at least one module", () => {
    expect(moduleNames.length).toBeGreaterThan(0);
  });

  it("should give every module an index.ts and a README.md", () => {
    for (const name of moduleNames) {
      const entries = readdirSync(join(MODULES, name));
      expect({
        module: name,
        hasIndex: entries.includes("index.ts"),
        hasReadme: entries.includes("README.md"),
      }).toEqual({
        module: name,
        hasIndex: true,
        hasReadme: true,
      });
    }
  });

  it("should keep modules free of imports from channels, infrastructure and bootstrap", () => {
    const offenders = filesUnder(MODULES).flatMap((file) =>
      importsOf(file)
        .filter((path) =>
          OUTER_LAYERS.some(
            (layer) => path === layer || path.startsWith(`${layer}/`)
          )
        )
        .map((path) => `${relative(SRC, file)} imports ${path}`)
    );

    expect(offenders).toEqual([]);
  });

  it("should reach a module only through its index.ts", () => {
    const offenders = filesUnder(SRC).flatMap((file) => {
      const own = relative(MODULES, file).split(sep)[0];
      return importsOf(file)
        .filter((path) => path.startsWith("modules/"))
        .filter((path) => {
          const [, target, ...rest] = path.split("/");
          return target !== own && rest.join("/") !== "index";
        })
        .map((path) => `${relative(SRC, file)} imports ${path}`);
    });

    expect(offenders).toEqual([]);
  });
});
