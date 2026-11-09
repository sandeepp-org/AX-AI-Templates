# MERN Stack template

A starting point for a MongoDB, Express, React and Node.js product. It ships the smallest thing that proves every
part is connected:

- **Back-end:** one endpoint, `GET /api/v1/health`.
- **Front-end:** one page that renders **Hello World** and shows the answer of that endpoint.

Everything else is structure: where code goes, how the layers depend on each other, and the tooling that keeps it
that way.

## Contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Repository layout](#repository-layout)
- [Back-end](#back-end)
- [Front-end](#front-end)
- [Commands](#commands)
- [Configuration](#configuration)
- [Tooling](#tooling)
- [Dependency versions](#dependency-versions)

## Requirements

| Tool    | Version        | Note                                         |
| ------- | -------------- | -------------------------------------------- |
| Node.js | 22 or newer    | `.nvmrc` pins 22                             |
| pnpm    | 10.31 or newer | `corepack enable` picks the version declared |

MongoDB and Redis are **not** needed to run the template. The packages for them are included and unused until a
feature needs them.

## Quick start

The back-end and the front-end are two independent pnpm workspaces. Run each in its own terminal.

```bash
# Terminal 1: API on http://localhost:3001
cd back-end
pnpm install
pnpm dev
```

```bash
# Terminal 2: web app on http://localhost:3000
cd front-end
pnpm install
pnpm dev
```

Open http://localhost:3000. The page shows **Hello World** and **API status: ok**.

How the two are connected: the browser calls `/api/...` on the web origin, and the Vite dev server forwards those
requests to the API (`front-end/app/vite.config.ts`). No CORS setup is needed locally.

```
Browser ──> http://localhost:3000  (Vite, front-end/app)
                 │  /api/*  is forwarded
                 ▼
            http://localhost:3001  (Express, back-end/app)
                 GET /api/v1/health
```

## Repository layout

```
.
├── back-end/                  pnpm workspace: the API and its packages
│   ├── app/                   the API application
│   ├── packages/              reusable back-end packages (@util/*)
│   ├── eslint.config.js       lint rules for the whole workspace
│   ├── jest.config.cjs        test setup for the whole workspace
│   ├── tsconfig.base.json     TypeScript settings every package extends
│   └── turbo.json             task graph: build, test, lint, typecheck
├── front-end/                 pnpm workspace: the web app and its packages
│   ├── app/                   the web application (Vite + React)
│   ├── packages/              reusable front-end packages (@canopy/*)
│   ├── eslint.config.js
│   ├── tsconfig.base.json
│   └── turbo.json
├── .editorconfig              editor defaults
├── .gitignore                 one ignore file for the whole repository
├── .nvmrc                     Node.js version
└── .prettierrc.json           one code style for both workspaces
```

**Rule for both workspaces:** an `app/` holds product code; `packages/` hold code that knows nothing about the
product and could be used by another one. A package never imports from an app.

## Back-end

### Layout of `back-end/app/src`

The app follows a domain-driven, ports-and-adapters layout. Each folder is a layer with one job.

```
src/
├── index.ts                   process entry: read config, create the logger, start the server
├── bootstrap.ts               composition root: builds adapters, services and routes, and wires them
├── modules/                   the domain, one folder per business capability
│   ├── module-boundary.test.ts    enforces the dependency rules below
│   └── health/
│       ├── README.md          what the module is and its public API
│       ├── index.ts           the ONLY file other code imports from
│       ├── domain/            rules and vocabulary: pure functions and constants, no I/O
│       ├── entities/          the shapes the module works with (types)
│       ├── ports/             what the module needs from the outside, as types
│       └── service/           use cases: orchestrate domain rules over ports
├── channels/                  how the outside world reaches the modules
│   └── http/                  one <name>.routes.ts per module: HTTP in, service call, result out
├── infrastructure/            adapters: the implementations of ports, and configuration
│   ├── config/                reads and validates environment variables
│   └── health/                process-health-probe.adapter.ts implements HealthProbePort
└── shared/                    small cross-cutting pieces with no business meaning (logger, constants)
```

### Dependency rules

Dependencies point inward, toward the domain.

```
channels ──────┐
               ├──> modules (through index.ts only)
infrastructure ┘
bootstrap ──> everything (it is the only place that knows every concrete piece)
```

| Layer             | May import                                                | Must not import                                            |
| ----------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `modules/*`       | its own files, `shared/`, `@util/*` packages              | `channels/`, `infrastructure/`, another module's internals |
| `channels/`       | a module's `index.ts`, `shared/`                          | `infrastructure/`, a module's internals                    |
| `infrastructure/` | a module's `index.ts` (to implement its ports), `shared/` | `channels/`                                                |
| `bootstrap.ts`    | everything                                                |                                                            |

`modules/module-boundary.test.ts` fails the test run when a module imports an outer layer, when anything reaches
into a module past its `index.ts`, or when a module has no `index.ts` or `README.md`.

### Why ports and adapters

A service never imports a driver. It declares what it needs as a **port** (a type in `ports/`), and
`infrastructure/` supplies an **adapter** that implements it. `bootstrap.ts` hands the adapter to the service.

The health module shows the whole pattern with the least code:

| Piece                                                   | Role                                                     |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `modules/health/domain/health-status.ts`                | the rule: the report is `ok` only if every check is `ok` |
| `modules/health/entities/health-report.entity.ts`       | the shape of a report and of one check                   |
| `modules/health/ports/health-probe.port.ts`             | "something I can ask for its health"                     |
| `modules/health/service/health.service.ts`              | asks every probe, folds the answers into one report      |
| `infrastructure/health/process-health-probe.adapter.ts` | the first probe: the process itself                      |
| `channels/http/health.routes.ts`                        | `GET /api/v1/health` calls `health.report()`             |
| `bootstrap.ts`                                          | creates the probe, the service and the route             |

Because of this, tests need no mocks of libraries: a service test passes a plain object as the port
(`health.service.test.ts`), and the route test starts the real server on a free port (`health.routes.test.ts`).

### Adding a feature

Example: a `todos` capability stored in MongoDB.

1. **Module:** create `src/modules/todos/` with `domain/`, `entities/`, `ports/`, `service/`, `index.ts` and
   `README.md`. Put the rules in `domain/`, the `Todo` type in `entities/`, a `TodoRepositoryPort` in `ports/`
   and a `TodoService` in `service/`. Export the public API from `index.ts`.
2. **Adapter:** create `src/infrastructure/todos/mongo-todo-repository.adapter.ts` implementing
   `TodoRepositoryPort` with `@util/mongodb`.
3. **Channel:** create `src/channels/http/todos.routes.ts` exporting `todosRoutes({ todos })`.
4. **Wire:** in `src/bootstrap.ts` build the adapter, pass it to `TodoService.create(...)`, and add
   `...todosRoutes({ todos })` to `routes`.
5. **Config:** read any new environment variable in `src/infrastructure/config/app-config.ts` and add it to
   `app/.env.example`.
6. **Tests:** a `*.test.ts` beside each file. Name each test `should <behaviour>`.

### File naming

| Kind    | Name                       | Example                           |
| ------- | -------------------------- | --------------------------------- |
| Service | `<name>.service.ts`        | `health.service.ts`               |
| Port    | `<name>.port.ts`           | `health-probe.port.ts`            |
| Entity  | `<name>.entity.ts`         | `health-report.entity.ts`         |
| Adapter | `<what>-<name>.adapter.ts` | `process-health-probe.adapter.ts` |
| Routes  | `<module>.routes.ts`       | `health.routes.ts`                |
| Helper  | `<name>.util.ts`           | `parse-input.util.ts`             |
| Test    | same name + `.test.ts`     | `health.service.test.ts`          |

Folders and files are kebab-case. Imports of local files end in `.js` (Node ES modules).

### Back-end packages

Each package in `back-end/packages/` has the same shape: `src/`, `package.json`, `tsconfig.json`, `README.md`,
`SKILL.md` and `docs/`. The app uses the first two today; the rest are ready for when a feature needs them.

| Package                    | What it gives                                                                          | Used by the app    |
| -------------------------- | -------------------------------------------------------------------------------------- | ------------------ |
| `@util/api-server`         | Express server: security headers, CORS, rate limit, routes, Swagger, graceful shutdown | Yes                |
| `@util/logger`             | structured logger with console, file and MongoDB transports                            | Yes                |
| `@util/error-normalizer`   | typed errors and one error shape                                                       | Through api-server |
| `@util/rate-limit-core`    | rate-limit policies and stores                                                         | Through api-server |
| `@util/mongodb`            | MongoDB connection and CRUD helpers                                                    | Not yet            |
| `@util/redis`              | Redis client and record helpers                                                        | Not yet            |
| `@util/jwt-tokens`         | JWT access and refresh tokens, password hashing                                        | Not yet            |
| `@util/secret-manager-aws` | reads secrets from AWS Secrets Manager                                                 | Not yet            |

To use one in the app: `pnpm --filter app add @util/mongodb --workspace`, then add
`{ "path": "../packages/util-mongodb" }` to `app/tsconfig.json` references.

### API conventions

- Routes are mounted at `/api/<version>/<path>`; the version is `v1` (`src/shared/constants.ts`).
- Every answer is an envelope: `{ "data": <value or null>, "error": <message or null> }`.
- Swagger UI is served at `/docs` outside production.
- The server package also answers `GET /health` at the root for load balancers; the app's own report is
  `GET /api/v1/health`.

## Front-end

### Layout of `front-end/app/src`

The web app is organised by feature. A feature owns everything it needs; shared code is the exception.

```
src/
├── main.tsx                   mounts <App /> and loads the styles
├── App.tsx                    the page: providers and layout
├── App.test.tsx
├── index.css                  Tailwind, the design tokens and the themes
├── features/                  one folder per product capability
│   └── health/
│       ├── index.ts           the ONLY file other code imports from
│       ├── api/               calls to the back-end and the types they return
│       ├── hooks/             React state around those calls
│       └── components/        what the feature renders
├── shared/                    code used by more than one feature
│   └── api/rest-client.ts     the one REST client; unwraps the response envelope
└── test/setup.ts              test environment setup
```

Rules:

- A feature imports from `shared/` and from packages, never from another feature's internals.
- Components do not call the network; they use a hook, and the hook uses the feature's `api/`.
- Colours, spacing and type come from the design tokens (`bg-background`, `text-foreground`, ...), never from
  hard-coded values.

### Adding a feature

1. Create `src/features/<name>/` with `api/`, `hooks/`, `components/` and `index.ts`.
2. In `api/`, call the back-end through `apiGet` from `shared/api/rest-client.ts`.
3. In `hooks/`, wrap the call in a hook that returns a loading, success or failure state.
4. In `components/`, render from the hook. Use components from `@canopy/shadcn-modulus`.
5. Export the feature's components from `index.ts` and place them in `App.tsx`.

### Front-end packages

Each package in `front-end/packages/` has the same shape: `src/`, `package.json`, `tsconfig.json` and
`tsup.config.ts`. They build in dependency order.

```
app ──> @canopy/shadcn-modulus ──> @canopy/shadcn-core
   │              └──────────────> @canopy/chroma
   ├──> @canopy/chroma
   └──> @canopy/frontend-utils
```

| Package                  | What it gives                                                          |
| ------------------------ | ---------------------------------------------------------------------- |
| `@canopy/chroma`         | design tokens: the themes (SCSS), the Tailwind preset, `ThemeProvider` |
| `@canopy/shadcn-core`    | shadcn/ui components as generated, unbranded                           |
| `@canopy/shadcn-modulus` | the components the app uses: shadcn-core wired to the chroma tokens    |
| `@canopy/frontend-utils` | the REST client and upload helpers                                     |

- **Add a shadcn component:** run `pnpm dlx shadcn@latest add <component>` inside `packages/shadcn-core`, export
  it from `src/index.ts`, then wrap and export it from `packages/shadcn-modulus/src/components`.
- **Change a colour or size:** edit the theme files in `packages/chroma/src/themes/blue/`.
- **Tailwind and packages:** Tailwind does not scan `node_modules`, so `app/src/index.css` names the package
  folders with `@source`. Add a line there when a new package ships components.

## Commands

The same commands work in `back-end/` and in `front-end/`.

| Command             | What it does                                               |
| ------------------- | ---------------------------------------------------------- |
| `pnpm install`      | install dependencies                                       |
| `pnpm dev`          | build the packages, then run the app with reload on change |
| `pnpm build`        | build every package and the app                            |
| `pnpm start`        | run the built app                                          |
| `pnpm test`         | run every test                                             |
| `pnpm lint`         | lint every package and the app                             |
| `pnpm lint:fix`     | lint and fix what can be fixed                             |
| `pnpm typecheck`    | type-check without building                                |
| `pnpm format`       | format every file with Prettier                            |
| `pnpm format:check` | fail if a file is not formatted                            |
| `pnpm clean`        | remove build output and `node_modules`                     |

Run one package only with a filter: `pnpm --filter @util/logger test`, `pnpm --filter app lint`.

Before opening a pull request, run in both workspaces:

```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm test && pnpm format:check
```

## Configuration

Environment files are never committed; only the `*.example` templates are. Copy the example and edit the copy.

**Back-end** (`back-end/app/.env`, from `.env.example`):

| Variable    | Default       | Meaning                                                        |
| ----------- | ------------- | -------------------------------------------------------------- |
| `NODE_ENV`  | `development` | `production` turns Swagger UI off                              |
| `PORT`      | `3001`        | port the API listens on                                        |
| `LOG_LEVEL` | `info`        | `trace`, `debug`, `info`, `warn`, `error`, `fatal` or `silent` |

A value the app cannot use (a port that is not a number, an unknown log level) stops the start with a message
naming the variable.

**Front-end** (`front-end/app/.env.local`, from `.env.example`):

| Variable           | Default                 | Meaning                                       |
| ------------------ | ----------------------- | --------------------------------------------- |
| `API_PROXY_TARGET` | `http://localhost:3001` | where the dev server forwards `/api` requests |

The web app is served on port 3000 (`WEB_PORT` in `front-end/app/vite.config.ts`).

## Tooling

| Concern     | Back-end                               | Front-end                                    |
| ----------- | -------------------------------------- | -------------------------------------------- |
| Language    | TypeScript, ES modules (`NodeNext`)    | TypeScript, ES modules (`bundler`)           |
| Task runner | Turborepo                              | Turborepo                                    |
| Build       | `tsc --build` (project references)     | `tsup` for packages, Vite for the app        |
| Tests       | Jest + ts-jest, Supertest              | Vitest + Testing Library (jsdom)             |
| Lint        | ESLint flat config + typescript-eslint | the same, plus React hooks and refresh rules |
| Format      | Prettier (root `.prettierrc.json`)     | Prettier (root `.prettierrc.json`)           |
| Styles      |                                        | Tailwind CSS 4 + SCSS themes                 |

## Dependency versions

Every dependency is on its latest release, with one exception:

| Dependency | Version | Latest | Why it is held                                                                                 |
| ---------- | ------- | ------ | ---------------------------------------------------------------------------------------------- |
| TypeScript | 6.0     | 7.0    | typescript-eslint and ts-jest do not support TypeScript 7 yet, so lint and tests would not run |

To check and update:

```bash
pnpm outdated -r          # what is behind
pnpm update -r --latest   # move everything to latest, then run the checks above
```
