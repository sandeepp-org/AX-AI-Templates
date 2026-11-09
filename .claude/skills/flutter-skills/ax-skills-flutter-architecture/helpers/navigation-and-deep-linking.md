# Navigation & Deep Linking (go_router)

One router, named routes, web-safe URLs, and working deep links on all three platforms.

## Router setup

- A single `GoRouter` in `app/router.dart`, consumed by `MaterialApp.router`.
- **Named-route constants** — never scatter raw path strings in widgets.

```dart
abstract class AppRoute {
  static const home = (name: 'home', path: '/');
  static const profile = (name: 'profile', path: '/profile/:id');
}

context.goNamed(AppRoute.profile.name, pathParameters: {'id': id});
```

- Use `ShellRoute` / `StatefulShellRoute` for persistent scaffolds (bottom nav / rail) with per-branch state.

## Web URL strategy

- Enable path-based URLs: `usePathUrlStrategy()` in `bootstrap()` (no `#` in URLs).
- **Every screen must be reachable by URL, refresh-safe, and back/forward-correct.** Page state that must survive reload belongs in **path/query params**, not in-memory bloc state.
- Set per-route titles for the browser/history.

## Guards & redirects

Auth and gating live in `redirect`, driven by an app-level `AuthCubit`/stream — never ad-hoc checks inside widgets.

```dart
redirect: (context, state) {
  final loggedIn = context.read<AuthCubit>().state.isAuthenticated;
  final goingToAuth = state.matchedLocation == AppRoute.login.path;
  if (!loggedIn && !goingToAuth) return AppRoute.login.path;
  if (loggedIn && goingToAuth) return AppRoute.home.path;
  return null;
}
```

Use `refreshListenable` (e.g. a `GoRouterRefreshStream` over the auth stream) so redirects re-run on auth changes.

## Deep links / universal links / app links

- **iOS Universal Links:** Associated Domains entitlement + `apple-app-site-association` on the domain.
- **Android App Links:** `intent-filter` with `autoVerify` + `assetlinks.json` on the domain.
- **Web:** the URL *is* the deep link — ensure the route parses params and renders without prior in-app navigation.
- **Validate every inbound param** (ids, tokens) before use — treat deep-link input as untrusted (see `helpers/security.md`).
- Define a fallback/not-found route (`errorBuilder`) for unknown or malformed links.

## Navigation side effects from blocs

Don't navigate inside `build`. Emit a state/one-off signal and react in a `BlocListener` at the page level, or expose navigation via a callback — keep `GoRouter` calls in the widget layer, not the cubit.
