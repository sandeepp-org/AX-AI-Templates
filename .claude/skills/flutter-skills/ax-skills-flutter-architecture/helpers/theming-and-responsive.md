# Responsiveness & Adaptive Layout

One widget tree that serves mobile, tablet, and wide web. **Breakpoints live here; tokens, theme, and components live in the design system.**

> Design tokens, `ThemeData`/modes (light/dark/brand), the component library, and Figma-to-code are owned by **`ax-skills-flutter-ui`** (`lib/design_system/`). This helper covers only responsive/adaptive *layout*. Read both together; never hardcode colors/spacing — use `context.colors`/`context.spacing` from the design system.

## Responsive & adaptive layout

Drive layout off breakpoints and available space, **not** `Platform.isX` or screen "device" guesses.

```dart
// core/theme/breakpoints.dart
abstract class Breakpoints { static const compact = 600.0, medium = 840.0, expanded = 1200.0; }

class Responsive {
  static bool isCompact(BuildContext c) => MediaQuery.sizeOf(c).width < Breakpoints.compact;
}
```

- Use `LayoutBuilder` / `MediaQuery.sizeOf` to switch layouts (single column → master-detail) at breakpoints.
- Prefer adaptive widgets: `NavigationBar` (compact) ↔ `NavigationRail` (expanded); dialogs vs full-screen sheets by width.
- Constrain content width on large web screens (`ConstrainedBox` / centered max-width) — full-bleed text is unreadable.
- Make tap targets ≥ 48dp; ensure layouts survive text scaling and keyboard insets (`SafeArea`, `resizeToAvoidBottomInset`).

## Platform-adaptive touches

- Use `.adaptive` constructors (e.g. `Switch.adaptive`, `CircularProgressIndicator.adaptive`) where a native feel matters.
- Web: support hover/focus states and pointer + keyboard; mobile: large touch targets and gesture affordances.

## Design source (Figma)

Implementing from Figma — importing variables as tokens, mapping components via Code Connect, and building frames as design-system components — is owned by **`ax-skills-flutter-ui`**; see its [figma-to-code helper](../../ax-skills-flutter-ui/helpers/figma-to-code.md). Record the Figma file/page/frames in the spec's **Design source** section. Do not eyeball values that exist as tokens.
