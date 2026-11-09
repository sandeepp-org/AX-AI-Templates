# Design Tokens & Theme Variables

Three token tiers, mode-aware theming, and the exact Flutter mapping. Widgets read **semantic** tokens only.

## Tier 1 — Primitive (reference) tokens

Raw values, no meaning attached. Private to the DS (`tokens/ref_tokens.dart`). Never used by a widget directly.

```dart
abstract class Ref {
  // palette
  static const blue50  = Color(0xFFE8F0FE);
  static const blue500 = Color(0xFF1A73E8);
  static const blue700 = Color(0xFF1558B0);
  static const neutral0 = Color(0xFFFFFFFF);
  static const neutral900 = Color(0xFF131316);
  static const red500 = Color(0xFFD93025);
  // scales
  static const space1 = 4.0, space2 = 8.0, space3 = 12.0, space4 = 16.0, space6 = 24.0, space8 = 32.0;
  static const radius4 = 4.0, radius8 = 8.0, radius12 = 12.0, radiusFull = 999.0;
  static const fontXs = 12.0, fontSm = 14.0, fontMd = 16.0, fontLg = 20.0, fontXl = 28.0;
}
```

## Tier 2 — Semantic (alias) tokens, mode-aware

Intent-named, assembled per **mode** (light/dark/brand) and exposed via `ThemeExtension` so they flip automatically.

```dart
// tokens/color_tokens.dart
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.primary, required this.onPrimary,
    required this.surface, required this.onSurface,
    required this.background, required this.danger, required this.border,
  });
  final Color primary, onPrimary, surface, onSurface, background, danger, border;

  static const light = AppColors(
    primary: Ref.blue500, onPrimary: Ref.neutral0,
    surface: Ref.neutral0, onSurface: Ref.neutral900,
    background: Ref.blue50, danger: Ref.red500, border: Color(0xFFE0E0E0),
  );
  static const dark = AppColors(
    primary: Ref.blue500, onPrimary: Ref.neutral0,
    surface: Ref.neutral900, onSurface: Ref.neutral0,
    background: Color(0xFF0E0E10), danger: Ref.red500, border: Color(0xFF2A2A2E),
  );

  @override
  AppColors copyWith({Color? primary, /* ... */}) => AppColors(primary: primary ?? this.primary, /* ... */);
  @override
  AppColors lerp(AppColors? other, double t) => other == null ? this : AppColors(
    primary: Color.lerp(primary, other.primary, t)!, /* ... */);
}
```

Do the same for `AppSpacing`, `AppRadii`, `AppElevation`, `AppMotion` (durations/curves), `AppBreakpoints`. Spacing/radii usually don't change by mode, so a single const instance is fine; still expose them as extensions for uniform access.

```dart
class AppSpacing extends ThemeExtension<AppSpacing> {
  const AppSpacing();
  double get xs => Ref.space1; double get sm => Ref.space2; double get md => Ref.space4;
  double get lg => Ref.space6; double get xl => Ref.space8;
  // copyWith / lerp ...
}
```

## Tier 3 — Component tokens

Only when a component needs its own scale not covered by semantics (e.g. control heights). Keep them in or near the component; prefer semantics first.

```dart
abstract class ButtonTokens { static const heightSm = 36.0, heightMd = 44.0, heightLg = 52.0; }
```

## Assembling ThemeData per mode

```dart
// theme/app_theme.dart
abstract class AppTheme {
  static ThemeData light() => _base(Brightness.light, AppColors.light);
  static ThemeData dark()  => _base(Brightness.dark,  AppColors.dark);

  static ThemeData _base(Brightness b, AppColors colors) => ThemeData(
    useMaterial3: true,
    brightness: b,
    colorScheme: ColorScheme.fromSeed(seedColor: colors.primary, brightness: b)
        .copyWith(surface: colors.surface, error: colors.danger),
    textTheme: AppTypography.textTheme,
    extensions: [colors, const AppSpacing(), const AppRadii(), const AppElevation(), const AppMotion()],
  );
}
```

Wire into `MaterialApp.router`: `theme: AppTheme.light(), darkTheme: AppTheme.dark(), themeMode: state.themeMode`. A brand mode is just another `AppColors.brandX` + `ThemeData`.

## Ergonomic access (context extensions)

```dart
// theme/context_ext.dart
extension DsContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
  AppSpacing get spacing => Theme.of(this).extension<AppSpacing>()!;
  AppRadii get radii => Theme.of(this).extension<AppRadii>()!;
  TextTheme get text => Theme.of(this).textTheme;
}
```

Usage in a widget: `Container(color: context.colors.surface, padding: EdgeInsets.all(context.spacing.md))`. **Never** `Colors.*`, hex literals, or magic numbers in feature/component code.

## Mapping Figma variables → these tiers

- Figma **primitive collection** → `Ref`.
- Figma **semantic collection with modes** (Light/Dark/Brand) → `AppColors.light/dark/brandX` and other extensions; each Figma **mode** = one extension instance.
- Figma **component variables** → Tier-3 component tokens.
- Pull values with the Figma MCP `get_variable_defs` (see figma-to-code.md) instead of transcribing by hand.

## Rules

- Exactly one source of truth per value; no duplicated palettes.
- Add a token before using a new value; if it's used twice, it's a token.
- Dark mode is not optional — every semantic color defines a dark value, contrast verified both ways.
