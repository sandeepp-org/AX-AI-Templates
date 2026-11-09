const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const packagesDir = path.join(__dirname, "packages");
const appEnv = path.join(__dirname, "app", ".env");

const jestPackageEnv = process.env.JEST_PACKAGE_ENV;

/**
 * Package-scoped tests (e.g. `pnpm test` in `packages/util-redis`):
 * load **only** `packages/<JEST_PACKAGE_ENV>/.env` — not `app/.env` or other packages.
 */
if (jestPackageEnv && fs.existsSync(packagesDir)) {
  const pkgEnvPath = path.join(packagesDir, jestPackageEnv, ".env");
  if (fs.existsSync(pkgEnvPath)) {
    dotenv.config({ path: pkgEnvPath });
  }
} else {
  if (fs.existsSync(appEnv)) {
    dotenv.config({ path: appEnv });
  }

  if (fs.existsSync(packagesDir)) {
    for (const pkg of fs.readdirSync(packagesDir)) {
      const envPath = path.join(packagesDir, pkg, ".env");
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
      }
    }
  }
}
