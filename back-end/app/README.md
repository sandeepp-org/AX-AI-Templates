# app

The API application. It serves `GET /api/v1/health` and is laid out so each new capability is a module.

- Entry: `src/index.ts`; composition root: `src/bootstrap.ts`.
- Environment: copy `.env.example` to `.env`.
- Layout, layer rules and the steps to add a feature: [repository README](../../README.md#back-end).
