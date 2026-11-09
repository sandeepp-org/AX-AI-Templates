# Localization (i18n) & Accessibility (a11y)

Both are requirements, not polish. They apply on web, iOS, and Android.

## Localization (intl + ARB)

- All user-facing copy comes from generated localizations — **no hardcoded strings in widgets**.
- Use `flutter_localizations` + `gen_l10n`: ARB files in `lib/core/l10n/arb/` (`app_en.arb`, `app_xx.arb`), generated `AppLocalizations`.

```dart
// usage
Text(AppLocalizations.of(context).welcomeMessage(userName));
```

- Wire `localizationsDelegates` + `supportedLocales` in `MaterialApp.router`.
- Use ICU plural/select/gender forms in ARB, not string concatenation:

```json
{ "itemsCount": "{count, plural, =0{No items} =1{1 item} other{{count} items}}" }
```

- Localize and format **numbers, dates, currency** via `intl` (`DateFormat`, `NumberFormat`) using the active locale — never manual formatting.
- **RTL:** support right-to-left if any locale needs it. Use `EdgeInsetsDirectional`, `start`/`end`, `Directionality`-aware widgets — not hardcoded `left`/`right`.

## Accessibility

- **Semantics:** every meaningful control/image has an accessible label. Add `Semantics(label: ...)`, `semanticLabel` on images/icons, `excludeSemantics` for decorative content. Group related nodes with `MergeSemantics`.
- **Contrast:** meet WCAG AA (4.5:1 text). Verify in light *and* dark themes; don't rely on color alone to convey state.
- **Text scaling:** layouts must survive large `textScaler` (system font size). Avoid fixed-height text containers; test at 150–200%.
- **Touch targets:** ≥ 48dp; adequate spacing between actions.
- **Focus & keyboard (web/desktop):** logical focus order, visible focus, full keyboard operability (`FocusTraversalGroup`, shortcuts). Don't trap focus.
- **Motion:** honor reduced-motion (`MediaQuery.disableAnimationsOf` / `accessibleNavigation`); avoid essential info conveyed only by animation.
- **Announcements:** use `SemanticsService.announce` for important async updates (e.g. "loaded", errors) so screen readers notice state changes.

## Testing

- Widget tests can assert semantics (`expectLater(tester, meetsGuideline(...))` with `textContrastGuideline`, `androidTapTargetGuideline`, `labeledTapTargetGuideline`).
- Add at least one a11y assertion per primary screen; cover localized strings (don't assert hardcoded English in tests for localized UI).
