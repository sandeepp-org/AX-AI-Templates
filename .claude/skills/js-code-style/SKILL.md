---
name: js-code-style
description: Enforces code style rules for MEAN/MERN and full-stack JavaScript/TypeScript projects — arrow functions, consolidated exports, separate type exports/imports, import ordering, no nested functions, no hardcodes, no emojis, function comments, and focused classes (extract complex logic to helpers). Use when generating, reviewing, or refactoring JavaScript or TypeScript code.
metadata:
  version: "1.1"
---

# Code Style for JavaScript / TypeScript Projects

These rules apply to all MEAN, MERN, and full-stack JavaScript/TypeScript codebases.

This skill **consolidates** the previous `js-build-standards`, `js-naming-conventions`, and `js-typescript-conventions` skills into a single source of truth for:

- **Architecture & build standards** (from `js-build-standards`)
- **Naming conventions** (from `js-naming-conventions`)
- **TypeScript conventions** (from `js-typescript-conventions`)

When you need the full details, load these helper docs:

- `helpers/js-build-standards.md`
- `helpers/js-naming-conventions.md`
- `helpers/js-typescript-conventions.md`

## How to Use This Skill (Hash-map style)

This skill is an **index**. Load only the helpers you need:

- **Arrow functions**: `helpers/arrow-functions.md`
- **Exports & imports (order + types)**: `helpers/exports-and-imports.md`
- **Structure, control flow & constants** (no nesting, early returns, no hardcodes, literal unions, comments, no emojis): `helpers/structure-and-constants.md`

## Summary Checklist

| Rule              | Key point                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Arrow functions   | No `function` keyword — ever                                                                               |
| Exports           | Single `export { ... }` block at end of file                                                               |
| Type exports      | Use `export type { ... }` separately                                                                       |
| Type imports      | Use `import type { ... }` separately                                                                       |
| Import order      | Type imports -> library imports -> local imports                                                           |
| Emojis            | None in any generated text                                                                                 |
| No nesting        | All functions top-level; pass state explicitly                                                             |
| Early returns     | Use freely for guard clauses; avoid deep nesting                                                           |
| No hardcodes      | Reusable values must come from constants                                                                   |
| Literal unions    | Extract string unions into `as const` objects, derive types                                                |
| Function comments | Every function must have a 1–2 line comment explaining intent                                              |
| Focused classes   | Extract complex logic (>~20 lines, reusable) to standalone helpers; simple wiring is fine in class methods |

---

## Architecture & Build Standards (from `js-build-standards`)

See `js-build-standards` for full project-specific architecture and monorepo build rules. When both apply, prefer **this skill (js-code-style)** for function style and imports, and **js-build-standards** for hexagonal architecture, packaging, and testing strategy.

---

## Naming Conventions (from `js-naming-conventions`)

See `js-naming-conventions` for detailed rules on:

- File and folder naming (always kebab-case, with role-based suffixes).
- Class, interface, type, and enum naming (PascalCase).
- Variables, constants, booleans, and private fields (camelCase / UPPER_SNAKE_CASE, `#private`).
- Package names (kebab-case) and test block names (`describe` / `it`).

---

## TypeScript Conventions (from `js-typescript-conventions`)

See `js-typescript-conventions` for detailed rules on:

- Choosing between `interface` and `type`.
- Null safety and strict null checks.
- Error handling with custom error classes.
- Generic patterns, comments, and strict-mode compliance.
