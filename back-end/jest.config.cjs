const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  setupFiles: [path.join(__dirname, "jest.setup.cjs")],
  preset: "ts-jest/presets/default",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: path.join(__dirname, "tsconfig.base.json"),
        diagnostics: { ignoreCodes: [151002] },
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@util/logger$": "<rootDir>/packages/util-logger/src/index.ts",
    "^@util/api-server$":
      "<rootDir>/packages/util-api-server/src/index.ts",
    "^@util/secret-manager-aws$":
      "<rootDir>/packages/util-secret-manager-aws/src/index.ts",
    "^@util/mongodb$": "<rootDir>/packages/util-mongodb/src/index.ts",
    "^@util/redis$": "<rootDir>/packages/util-redis/src/index.ts",
    "^@util/jwt-tokens$": "<rootDir>/packages/util-jwt-tokens/src/index.ts",
    "^@util/rate-limit-core$":
      "<rootDir>/packages/util-rate-limit-core/src/index.ts",
    "^@util/error-normalizer$":
      "<rootDir>/packages/util-error-normalizer/src/index.ts",
    "^@util/agentic-memory$":
      "<rootDir>/packages/util-agentic-memory/src/index.ts",
    "^@util/agent-trace$":
      "<rootDir>/packages/util-agent-trace/src/index.ts",
  },
  transformIgnorePatterns: ["/node_modules/"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "integration.test.ts",
  ],
  testTimeout: 10000,
};
