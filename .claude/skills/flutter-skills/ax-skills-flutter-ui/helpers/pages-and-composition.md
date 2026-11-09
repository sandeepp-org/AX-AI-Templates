# Pages & Composition

How a screen is assembled: a DS **template** + **organisms**, bound to a bloc, with one shared state→UI mapping and responsive layout from the template.

## The page recipe

```
Route ─┬─ BlocProvider(create: XCubit(...)..load())
       └─ XPage  ──uses──>  AppScaffold (template)
                                ├─ AppAppBar (organism)
                                └─ body: DsStateView<...>(state) → success/loading/empty/error
```

A page's job is small: provide the bloc, pick a template, and map state to organisms. **No raw layout primitives or styling in pages beyond composition.**

```dart
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppAppBar(title: context.l10n.profileTitle),
      body: BlocBuilder<ProfileCubit, ProfileState>(
        builder: (context, state) => DsStateView<Profile>(
          status: state.status,
          data: state.profile,
          onRetry: context.read<ProfileCubit>().load,
          builder: (profile) => ProfileView(profile: profile),   // organism
        ),
      ),
    );
  }
}
```

## State-driven UI — one mapping for the whole app

Every async screen renders the same loading/empty/error/success shapes via a single DS widget. No bespoke spinners or ad-hoc error text per screen.

```dart
// design_system/components/organisms/ds_state_view.dart
class DsStateView<T> extends StatelessWidget {
  const DsStateView({
    super.key,
    required this.status,
    required this.builder,
    this.data,
    this.onRetry,
    this.isEmpty,
    this.loading,
    this.empty,
    this.error,
  });

  final ViewStatus status;                 // initial | loading | success | failure
  final T? data;
  final Widget Function(T data) builder;
  final VoidCallback? onRetry;
  final bool Function(T data)? isEmpty;
  final Widget? loading, empty, error;

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case ViewStatus.loading:
      case ViewStatus.initial:
        return loading ?? const Center(child: AppSpinner());
      case ViewStatus.failure:
        return error ?? AppErrorState(onRetry: onRetry);     // organism
      case ViewStatus.success:
        final d = data as T;
        if (isEmpty?.call(d) ?? false) return empty ?? const AppEmptyState();
        return builder(d);
    }
  }
}
```

Map your feature's status enum/freezed union to `ViewStatus` (or make blocs emit `ViewStatus` directly). The point: error/empty/loading are **components**, owned by the DS, identical everywhere.

## Templates (responsive skeletons)

Templates own layout and breakpoints so pages don't. They expose **slots**, not data.

```dart
class AppScaffold extends StatelessWidget {
  const AppScaffold({super.key, required this.body, this.appBar, this.bottomNav, this.maxContentWidth = 1040});
  // ...
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar,
      bottomNavigationBar: bottomNav,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(                       // cap line length on wide web
            constraints: BoxConstraints(maxWidth: maxContentWidth),
            child: body,
          ),
        ),
      ),
    );
  }
}
```

Adaptive navigation template:

```dart
class AdaptivePage extends StatelessWidget {
  // compact: NavigationBar (bottom) ; expanded: NavigationRail (side)
  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= context.breakpoints.medium;
    return wide ? Row(children: [NavigationRail(...), Expanded(child: body)])
                : Scaffold(body: body, bottomNavigationBar: NavigationBar(...));
  }
}
```

- Master–detail: single column on compact, two panes (list + detail) on expanded — implemented once in a `MasterDetailTemplate`, reused by features.
- Use `go_router`'s `StatefulShellRoute` with the adaptive template for persistent nav across tabs.

## Composition rules

- Pages compose templates + organisms; they don't use `Container`/`Padding`/`Row` for visual styling — that belongs in components/templates.
- One screen = one route = one bloc scope (see architecture DI rules).
- Loading/empty/error always go through `DsStateView`; never inline a `CircularProgressIndicator` in a feature page.
- Responsive behavior lives in templates; pages stay layout-agnostic.
- Long lists use `ListView.builder` inside the organism, paginated via the bloc (see performance + networking helpers).
- All copy via `context.l10n` (intl/ARB), all spacing/color via tokens.

## Navigation side effects

Use `BlocListener` at the page level for one-off effects (navigate, snackbar via a DS `AppSnackBar`), keeping `GoRouter` calls in the widget layer — never in the cubit (see navigation helper).
