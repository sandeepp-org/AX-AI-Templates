# Component Library (Atomic Design)

Reusable, token-driven, presentation-only widgets. The taxonomy gives every widget a home and a clear dependency direction.

## Taxonomy (dependency flows up only)

| Level | What it is | Examples | May use |
| --- | --- | --- | --- |
| **Atoms** | smallest UI units | `AppButton`, `AppText`, `AppIcon`, `AppTextField`, `AppBadge`, `AppAvatar`, `AppSpinner` | tokens only |
| **Molecules** | a few atoms bonded | `AppFormField` (label+field+error), `AppSearchField`, `AppListTile` | atoms + tokens |
| **Organisms** | distinct sections | `AppAppBar`, `AppEmptyState`, `AppErrorState`, `AppCardSection`, `AppBottomNav` | molecules + atoms |
| **Templates** | page skeletons (slots, no data) | `AppScaffold`, `AdaptivePage`, `MasterDetailTemplate` | organisms |
| **Pages** | templates + real data/bloc (feature-owned) | `ProfilePage` | templates + organisms + bloc |

Atoms→templates live in `lib/design_system/components/`; pages live in `lib/features/<f>/presentation/pages/`. Never import "down" (an atom must not know about an organism).

## Component API conventions

- `App<Name>`, one per file, `const` constructor, presentation-only (no bloc/repo/navigation/business logic).
- **Variants** and **sizes** are enums; **states** are handled internally.
- Data + callbacks come in as props (`onPressed`, `label`, `value`, `onChanged`).
- Compose via **slots** (`child`, `leading`, `trailing`, `builder`) — avoid boolean flag explosions.

```dart
enum AppButtonVariant { primary, secondary, tertiary, danger }
enum AppButtonSize { sm, md, lg }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,        // null => disabled
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.isLoading = false,
    this.leading,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool isLoading;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final bg = switch (variant) {
      AppButtonVariant.primary => colors.primary,
      AppButtonVariant.danger => colors.danger,
      _ => Colors.transparent,
    };
    final height = switch (size) {
      AppButtonSize.sm => ButtonTokens.heightSm,
      AppButtonSize.md => ButtonTokens.heightMd,
      AppButtonSize.lg => ButtonTokens.heightLg,
    };
    return Semantics(
      button: true, label: label, enabled: onPressed != null,
      child: SizedBox(
        height: height,
        child: FilledButton(
          onPressed: isLoading ? null : onPressed,        // never null silently — disabled is a real state
          style: FilledButton.styleFrom(backgroundColor: bg, foregroundColor: colors.onPrimary),
          child: isLoading
              ? const AppSpinner(size: 18)
              : Row(mainAxisSize: MainAxisSize.min, children: [
                  if (leading != null) ...[leading!, SizedBox(width: context.spacing.sm)],
                  AppText(label),
                ]),
        ),
      ),
    );
  }
}
```

## Required states (every interactive component)

`default`, `hover` (web/desktop), `focus`, `pressed`, `disabled`, `loading`. Use `WidgetStateProperty`/`MaterialState*` for Material-backed widgets, or `FocusableActionDetector`/`MouseRegion` for custom ones. Don't ship a button that has no disabled/loading visual.

## Accessibility (built into the component, not bolted on)

- Semantic label/role (`Semantics`, `semanticLabel`); decorative bits `excludeSemantics`.
- Minimum 48dp interactive target; sufficient contrast (comes free from tokens).
- Keyboard + focus support for web/desktop; visible focus ring.

## Gallery / catalog

- Maintain a `widgetbook` (or a `/gallery` dev route) with every component × variant × size × state, in light and dark. This is how designers and devs review the DS without running a full feature.
- New component ⇒ new gallery story in the same PR.

## Golden tests (the visual contract)

- One golden per component × key variants × states × {light, dark}. Deterministic (fixed size, no animation, loaded fonts).
- Update goldens only on intentional change and review the image diff (see `ax-skills-flutter-testing`).

## When to create vs extend

- Reaching for a raw `Container`/`Text`/`ElevatedButton` in feature code is a smell — use or extend the matching atom.
- If a screen needs a variation, add a **variant/size/slot** to the existing component; fork into a new component only when it's genuinely a different thing.
- A component used by exactly one feature can start in that feature, but promote it to the DS the moment a second feature needs it.
