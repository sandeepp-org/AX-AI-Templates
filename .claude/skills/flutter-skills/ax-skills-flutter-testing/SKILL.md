---
name: ax-skills-flutter-testing
description: "Testing standard for the Flutter (BLoC + Cubit) app — unit, bloc_test, widget, golden, and integration tests across web/iOS/Android, with mocking, coverage, and CI conventions. Use when writing or reviewing tests, setting a Test Plan, or verifying a change. Triggers on write tests, test this, add coverage, bloc_test, golden test, integration test, how do I test."
metadata:
  version: "1.0"
---

# Flutter Testing Standard

How this app is tested. Pairs with `ax-skills-flutter-architecture` (what the code looks like) and `ax-skills-flutter-planning` (the Test Plan written before code). Each layer of clean architecture has a matching test type.

## Tooling

When the **Dart & Flutter MCP server** is registered (see `.claude/skills/ax-skills-flutter-workflow/config/tooling.config.yaml`), run tests through its **run_tests** capability rather than parsing CLI output — it returns structured pass/fail with the failing test and assertion, so a red test feeds straight back into a fix without scraping the terminal. Use **resolve_symbol** to confirm a type's real shape before writing a fixture or mock. CLI (`flutter test`) remains the fallback when the server is not registered. One-time setup: `claude mcp add --transport stdio dart -- dart mcp-server`.

## The pyramid (what to test where)

| Layer | Test type | Tool | Covers |
| --- | --- | --- | --- |
| domain / data | Unit | `flutter_test`, `mocktail` | use cases, repository impls, model (de)serialization, error→Failure mapping |
| presentation (cubit/bloc) | Bloc | `bloc_test`, `mocktail` | every state transition incl. failure/empty, event handling, debounce/concurrency |
| presentation (widgets) | Widget | `flutter_test` | key states render, interactions dispatch events, navigation, a11y guidelines |
| visual | Golden | `flutter_test` (+ `alchemist`/`golden_toolkit` optional) | pixel-stable UI for important widgets/themes |
| critical flows | Integration | `integration_test` | end-to-end journeys on real device + web |

Most tests are unit + bloc + widget. Goldens for design-critical UI. Integration for a few high-value flows.

## Conventions

- Mirror `lib/` under `test/` (`test/features/<feature>/...`). Name `*_test.dart`.
- Use `mocktail` (no codegen) for mocks; register fallback values for custom types. Mock the **domain contract**, not Dio.
- Arrange-Act-Assert; one behavior per test; `group` per unit. Fixtures/builders for entities (`tProfile`) keep tests readable.
- Deterministic: no real network/clock/random. Inject fakes; use `fakeAsync`/`FakeAsync` for timers/debounce.
- Localized UI: assert via keys/semantics, not hardcoded English where copy is localized.

## Unit (domain/data)

```dart
test('repository maps DioException(401) to UnauthorizedFailure', () async {
  when(() => api.fetchProfile()).thenThrow(DioException(
    requestOptions: RequestOptions(), response: Response(statusCode: 401, requestOptions: RequestOptions())));
  final result = await repo.getProfile();
  expect(result, Left(const Failure.unauthorized()));
});
```

Cover: happy path, each `Failure` branch, model `fromJson`/`toJson` round-trips, edge inputs (null/empty/boundary).

## Bloc / Cubit (bloc_test)

Test **every** transition, including failure and empty. Use `seed`, `act`, `expect`, `verify`, `wait` (for debounce).

```dart
blocTest<ProfileCubit, ProfileState>(
  'emits [loading, failure] when repository fails',
  build: () => ProfileCubit(repo),
  setUp: () => when(() => repo.getProfile())
      .thenAnswer((_) async => const Left(Failure.network())),
  act: (c) => c.load(),
  expect: () => [
    const ProfileState(status: ProfileStatus.loading),
    const ProfileState(status: ProfileStatus.failure, errorMessage: anyMessage),
  ],
);
```

For debounced/concurrent Blocs, assert stale events are dropped (`wait: const Duration(milliseconds: 350)`).

## Widget

```dart
testWidgets('shows error view with retry on failure state', (tester) async {
  await tester.pumpWidget(pumpWithBloc(cubit, const ProfilePage()));
  cubit.emit(const ProfileState(status: ProfileStatus.failure));
  await tester.pump();
  expect(find.byType(ErrorView), findsOneWidget);
  await tester.tap(find.text('Retry'));
  verify(() => repo.getProfile()).called(greaterThanOrEqualTo(1));
});
```

- Provide the bloc via a test helper (`BlocProvider.value`). Cover loading/empty/error/success per screen.
- Add accessibility assertions per primary screen:

```dart
await expectLater(tester, meetsGuideline(textContrastGuideline));
await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
```

## Golden

- Use goldens for design-critical, stable widgets; render across themes (light/dark) and key breakpoints.
- Load fonts in `flutter_test_config.dart`; update with `flutter test --update-goldens` only on intentional visual change (review the diff).
- Keep goldens deterministic (fixed sizes, no animations, fake data/time).

## Integration (per platform)

- Put end-to-end flows in `integration_test/`; drive with `IntegrationTestWidgetsFlutterBinding`.
- Run the critical journeys (login, primary task, checkout-equivalent) on an emulator/device and on web (`chromedriver` + `flutter drive`).
- Keep these few and high-value; they're slow.

## Coverage & CI

- `flutter test --coverage` → `coverage/lcov.info`. Enforce a floor in CI (e.g. 80% on domain/data/presentation; exclude generated `*.g.dart`/`*.freezed.dart` and entrypoints).
- New/changed behavior ships with tests in the same PR. A bug fix adds a regression test.

## Definition of done (testing)

- [ ] Every cubit/bloc state transition (incl. failure + empty) has a `bloc_test`.
- [ ] Repository error→Failure mapping is unit-tested for each branch.
- [ ] Each primary screen has widget tests for loading/empty/error/success + one a11y assertion.
- [ ] Design-critical widgets have goldens (light + dark).
- [ ] At least one integration test per critical flow, run on mobile + web.
- [ ] Coverage floor met; tests are deterministic; CI green.
