# Figma → Flutter (design-to-code)

When a Figma design exists, **import it** — pull variables as tokens, map components via Code Connect, and implement frames as DS organisms/templates. Don't transcribe colors/spacing by eye. Uses the Figma MCP server available in this environment.

## Load the right skill first

- Before any `use_figma` call → load the **`figma-use`** skill (mandatory).
- Before mapping components → load **`figma-code-connect`**.
- To stand up a design-system file from code → **`figma-generate-library`**; to push a screen into Figma → **`figma-generate-design`**.

## Figma MCP tools you'll use

| Goal | Tool |
| --- | --- |
| Read a frame's structure/layout/styles | `get_design_context` |
| See the frame visually | `get_screenshot` |
| Get node names/ids/hierarchy | `get_metadata` |
| **Pull variables (tokens) + modes** | `get_variable_defs` |
| Search the design system | `search_design_system` |
| Read existing component↔code mappings | `get_code_connect_map` |
| Suggest mappings | `get_code_connect_suggestions` |
| Create/send mappings | `add_code_connect_map` / `send_code_connect_mappings` |

Parse Figma URLs: `figma.com/design/:fileKey/...?node-id=:nodeId` → convert `-` to `:` in nodeId.

## Step 1 — Variables → tokens (do this first, once per design system)

1. `get_variable_defs` on the variables/tokens file. Read collections and **modes**.
2. Map to the three token tiers (see design-tokens.md):
   - primitive collection → `Ref`
   - semantic collection + modes (Light/Dark/Brand) → `AppColors.light/dark/brandX`, `AppTypography`, `AppSpacing`, `AppRadii`, `AppElevation`, `AppMotion`
   - component variables → Tier-3 component tokens
3. Each Figma **mode** becomes one `ThemeExtension` instance → one `ThemeData`. Reconcile names (Figma `surface/elevated` → `colors.surface`), and record any token that has no Figma source (or vice-versa) in `docs/plan.md`.

Tokens are the contract — get them right before building any screen, so every component inherits correct values automatically.

## Step 2 — Component inventory & Code Connect

1. `search_design_system` / `get_code_connect_map` to see what Figma components exist and what's already mapped.
2. For each Figma component, find or create the matching DS atom/molecule/organism (`App<Name>`). Match **variants** to Figma variant properties (e.g. Figma `Type=Primary/Secondary` → `AppButtonVariant`).
3. `get_code_connect_suggestions` → review → `add_code_connect_map` / `send_code_connect_mappings` so a Figma component points at the real Flutter widget + its props. Now design references real code, and future frames "compile" to known components.

## Step 3 — Implement a frame

1. `get_metadata` + `get_design_context` for the node; `get_screenshot` for visual reference.
2. Identify which DS components the frame is made of (most should already exist after Steps 1–2). Build **missing pieces as DS components first** (atoms→organisms), not inline in the page.
3. Assemble the screen as a **page** = DS **template** + organisms, bound to its bloc, with `DsStateView` for async states (see pages-and-composition.md).
4. Use tokens for every value; if the frame uses a value with no token, add the token (and flag the design gap) rather than hardcoding.
5. Record in the spec's §5 **Design source**: Figma file/page/frames; and in §5 **design-system mapping**: tokens touched, DS components consumed, DS components created.

## Step 4 — Verify fidelity

- Add/refresh **golden tests** for new components and the page's key states (light + dark, key breakpoints).
- Compare against `get_screenshot`; differences are either a token fix or an intentional, recorded deviation.
- Keep the **gallery** updated so the implemented component is reviewable next to the Figma source.

## Guardrails

- Never paste raw hex/spacing from Figma into a widget — it must land as a token.
- Don't implement a frame as one giant `build()`; decompose into DS components by Atomic-Design level.
- If Figma and code disagree on a token's value, the design is the source of truth unless a maintainer overrides it in `docs/plan.md` Decision Log.
- Interactive-auth MCP servers may be unavailable in headless/CI runs — keep the token/component source files in-repo so the build never depends on live Figma access.
