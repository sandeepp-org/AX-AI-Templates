---
name: ax-skills-flutter-ui
description: "Design-system & UI standard for the Flutter (BLoC + Cubit) app — design tokens, theme variables/modes (light/dark/brand), an Atomic-Design component library, and page composition, with Figma-to-code via the Figma MCP. Use when building UI, creating a screen/widget/component, setting up tokens/theme, translating a Figma design, or reviewing visual fidelity. Triggers on build UI, create screen/page/widget/component, design system, design tokens, theme, colors/typography/spacing, implement Figma, style this."
metadata:
  version: "1.0"
---

# Flutter UI & Design System Standard

How this app's UI is built so it is **consistent, themeable, multiplatform, and Figma-aligned**. UI is a *system*, not per-screen styling: every pixel traces back to a **token**, every screen is composed from **reusable components**, and every component maps to a **Figma component**.

Pairs with `ax-skills-flutter-architecture` (where files live, presentation rules). The design system is presentation-only and **dumb** — it knows tokens and props, never blocs, repositories, or business logic.

## The three pillars (and their references)

| Pillar | What it governs | Reference |
| --- | --- | --- |
| **Tokens & variables** | colors, typography, spacing, radii, elevation, motion, breakpoints; light/dark/brand modes | [helpers/design-tokens.md](helpers/design-tokens.md) |
| **Components** | Atomic-Design widget library (atoms→molecules→organisms→templates), variants/states/API | [helpers/components.md](helpers/components.md) |
| **Pages & composition** | screen scaffolding, state-driven UI, responsive/adaptive page layouts | [helpers/pages-and-composition.md](helpers/pages-and-composition.md) |
| **Figma → code** | import variables as tokens, implement frames, Code Connect mapping via Figma MCP | [helpers/figma-to-code.md](helpers/figma-to-code.md) |

## Where the design system lives

A self-contained foundation that features depend on (features never reach into each other's widgets):

```
lib/design_system/
  design_system.dart        # barrel export (tokens, theme, components)
  tokens/
    ref_tokens.dart         # PRIMITIVE tokens — raw palette & scales (private to DS)
    color_tokens.dart       # SEMANTIC color tokens (ThemeExtension: AppColors)
    typography_tokens.dart  # AppTypography (TextTheme + extension)
    spacing_tokens.dart     # AppSpacing, AppRadii, AppElevation, AppMotion, AppBreakpoints
  theme/
    app_theme.dart          # builds ThemeData light/dark/brand from token sets
    context_ext.dart        # context.colors / context.spacing / context.text getters
  foundations/              # icons, illustrations, asset refs
  components/
    atoms/                  # AppButton, AppText, AppTextField, AppIcon, AppBadge...
    molecules/              # AppListTile, AppSearchField, AppFormField...
    organisms/              # AppAppBar, AppCardSection, AppEmptyState, AppErrorState...
    templates/              # page skeletons: AppScaffold, AdaptivePage, MasterDetail
  gallery/                  # widgetbook / dev catalog of every component × variant × state
```

Feature **pages** live in `lib/features/<feature>/presentation/pages/` and are composed from DS templates + organisms. **Atoms→templates are shared (DS); pages are feature-owned.** That is the line.

## Token tiers (non-negotiable)

Three layers, used top-down. **Widgets only ever read the semantic/component layer — never primitives, never raw literals.**

1. **Primitive (reference) tokens** — raw values: `blue500`, `space4`, `radius8`, font sizes. Private to the DS. Never used directly by a widget.
2. **Semantic (alias) tokens** — intent: `colors.surface`, `colors.onSurface`, `colors.primary`, `colors.danger`, `spacing.md`, `radii.card`. Map to primitives and are **mode-aware** (light/dark/brand). Exposed through `ThemeExtension`s so they flip automatically.
3. **Component tokens** — only where a component needs its own scale (e.g. `button.heightMd`). Default to semantic tokens; introduce component tokens sparingly.

This mirrors Figma **variables**: primitive collection → semantic collection (with **modes** = light/dark/brand) → component variables. See [helpers/design-tokens.md](helpers/design-tokens.md).

## Variables & modes (theming)

- Each **mode** (light, dark, high-contrast, brand-A/brand-B) is a concrete set of token values assembled into a `ThemeData` via `ThemeExtension`s. Brightness mode flips with the system + an app override.
- Material colors go through `ColorScheme`; everything Material doesn't model (brand colors, spacing, radii, elevation, motion) goes through custom `ThemeExtension`s.
- Read tokens ergonomically: `context.colors.primary`, `context.spacing.md`, `context.text.titleLarge` — never `Colors.blue` / `EdgeInsets.all(16)` in feature code.

## Components — the rules

- **Atomic Design taxonomy**: atoms → molecules → organisms → templates (DS), then pages (features).
- Naming `App<Name>` (`AppButton`, `AppTextField`, `AppCard`). One component per file, `const` constructor, presentation-only.
- Each interactive component declares **variants** (e.g. `AppButtonVariant.primary/secondary/tertiary/danger`), **sizes**, and handles **all states**: default, hover, focus, pressed, disabled, loading. Web/desktop need hover+focus; mobile needs large touch targets.
- Components **consume tokens only** (no raw colors/sizes), carry **no business logic**, take **no bloc/repository** — data and callbacks come in as props.
- Accessibility is built in: semantic label, ≥48dp target, focus handling, contrast from tokens.
- Compose with **slots** (`child`, `leading`, `trailing`, `builder`) rather than boolean explosions.
- Every component has a **gallery entry** and **golden tests** across variants × states × light/dark (see `ax-skills-flutter-testing`).

## Pages — the composition model

- A page = a DS **template** (layout skeleton with slots) filled with **organisms**, bound to a bloc/cubit at the route.
- Map bloc state → UI with one **state-view pattern** so loading/empty/error/success look identical app-wide (`DsStateView`/`AsyncView`). No bespoke per-screen spinners.
- Pages are **responsive by template**: the template switches single-column ↔ master-detail at breakpoints; pages don't hand-roll `MediaQuery` branching. See [helpers/pages-and-composition.md](helpers/pages-and-composition.md).

## Figma is the source of truth

When a design exists, **import, don't eyeball**: pull Figma **variables → tokens**, map Figma **components → DS components** via Code Connect, and implement frames as organisms/templates using the Figma MCP. Full workflow + tool list: [helpers/figma-to-code.md](helpers/figma-to-code.md). Load the `figma-use` skill before any `use_figma` call and `figma-code-connect` before mapping.

## How this skill plugs into the rest

- **Spec** (`...-propose`): each spec's §5 records the **design-system mapping** — tokens touched, DS components consumed, and new DS components to create.
- **Plan** (`...-planning`): LLD lists new/changed tokens and components before code; new DS components are their own deliverable.
- **Review** (`...-code-review`): the `design-system` (`ds`) category fails raw literals, one-off widgets that duplicate a DS component, and components carrying logic.
- **Test** (`...-testing`): goldens per component/variant/state and per page state are the visual contract.

## Rules (enforced by code-review)

- No raw colors/sizes/text styles/durations in feature code — only semantic tokens (`context.colors/spacing/text/radii/motion`).
- No one-off widget that re-implements an existing DS component; extend the DS instead.
- DS components are presentation-only: no bloc, repository, navigation, or business logic inside them.
- Every new screen is built from DS templates + organisms; bloc states render through the shared state-view pattern.
- Every interactive component handles default/hover/focus/pressed/disabled/loading and is accessible (label, target size, contrast).
- New/changed components ship with a gallery entry + golden tests.
- When a Figma design exists, tokens/components are imported and Code-Connect-mapped — not approximated.
