# Performance

Frame budget, rebuild discipline, and web/mobile-specific cost control.

## Rebuild discipline

- Mark everything `const` that can be (`prefer_const_constructors`). `const` widgets skip rebuilds.
- Scope bloc rebuilds:
  - `BlocBuilder(buildWhen: ...)` to rebuild only on relevant state changes.
  - `context.select<Cubit, T>((c) => c.state.field)` to depend on one field.
  - `BlocListener` for side effects (no rebuild) vs `BlocBuilder` for UI.
- Keep `build` cheap and pure; hoist static children, split large widgets so a small leaf rebuilds instead of a whole screen.
- Don't allocate controllers/objects in `build`; create in `initState`/cubit and dispose properly.

## Lists & large content

- Always `ListView.builder`/`GridView.builder`/`Sliver*` for long/unbounded lists — never a `Column` of N children.
- Provide `itemExtent`/`prototypeItem` when item size is known (faster layout).
- Paginate (see networking helper) instead of loading everything.

## Images & assets

- Size images to their display box; use `cacheWidth`/`cacheHeight` to decode at target size.
- Cache network images (`cached_network_image`); show placeholders + error widgets.
- Prefer vectors (`flutter_svg`) / icon fonts for crisp scaling; ship resolution variants for raster.

## Async & isolates

- Keep heavy work (JSON for big payloads, parsing, crypto) off the UI thread with `compute`/isolates. Note: isolates aren't available on web — for web, chunk work or do it server-side.
- Avoid rebuild storms from high-frequency streams; debounce/throttle (`bloc_concurrency`, `stream_transform`).

## Web-specific

- **Renderer:** know your target (CanvasKit = fidelity/consistency, larger download; HTML/`auto` = smaller, more DOM-dependent). Choose per product needs.
- **Initial load:** keep the first bundle small — `deferred as` imports + `loadLibrary()` for heavy/rare routes; lazy-load big assets; tree-shake icons.
- Avoid huge synchronous work on first frame; show a fast shell.

## Startup

- Defer non-critical init (analytics, prefetch) until after first frame (`addPostFrameCallback`).
- Keep `bootstrap()` lean; don't block `runApp` on slow network.

## Measuring (don't guess)

- Profile in **profile mode** on a real device + web: DevTools timeline, "Performance overlay", raster vs UI thread, rebuild counts (DevTools "Track widget rebuilds").
- Budget: 60/120fps → 16ms/8ms per frame. Investigate jank, not vibes. Record findings + fixes in `docs/plan.md`.
