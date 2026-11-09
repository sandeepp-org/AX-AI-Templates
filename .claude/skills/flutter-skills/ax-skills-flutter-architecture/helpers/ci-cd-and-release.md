# CI/CD & Release (web / iOS / Android)

Pipeline expectations and per-platform release notes. Keep secrets in CI, never in the repo.

## CI (every PR)

Run on each push/PR (GitHub Actions, Codemagic, GitLab CI, etc.):

```
flutter pub get
dart run build_runner build --delete-conflicting-outputs   # if codegen used
dart format --set-exit-if-changed .
flutter analyze
flutter test --coverage
# optional: integration_test on a device/emulator/headless web
```

- Fail the build on analyzer warnings and test failures. Enforce a coverage floor.
- Cache pub/Gradle/Pods to keep CI fast.

## Versioning

- `version: x.y.z+build` in `pubspec.yaml`. Bump semver for releases; auto-increment build number in CI.
- Tag releases; keep a changelog. Wire the version into crash reports for triage.

## Web release

- Build per flavor: `flutter build web --release -t lib/main_prod.dart --dart-define-from-file=env/prod.json` (choose CanvasKit vs HTML/auto renderer per `helpers/performance.md`).
- Deploy `build/web` to your host (Firebase Hosting, Netlify, S3+CloudFront, etc.) with correct caching headers and SPA fallback (serve `index.html` for unknown routes so deep links work).
- Set `<base href>` correctly for sub-path hosting; configure security headers/CSP.

## Android release

- Build `flutter build appbundle --flavor prod -t lib/main_prod.dart --release --obfuscate --split-debug-info=build/symbols`.
- Sign with an upload key stored in CI secrets (never in VCS). Enable R8 shrink/obfuscate with ProGuard rules.
- Upload to Play Console (internal → closed → production tracks). Automate with Fastlane `supply` or the Codemagic/GHA Play publisher.

## iOS release

- Build `flutter build ipa --flavor prod -t lib/main_prod.dart --release --obfuscate --split-debug-info=build/symbols`.
- Code signing via App Store Connect API key / match (Fastlane). Distribute through TestFlight → App Store.
- Provide required privacy manifest + usage descriptions; handle App Review notes.

## Release checklist

- [ ] Version + build number bumped; tag created.
- [ ] `flutter analyze` clean, tests pass, coverage ≥ floor.
- [ ] Codegen regenerated and committed.
- [ ] Secrets injected from CI (none in repo); release obfuscation on (mobile).
- [ ] Smoke-tested the built artifact on each target platform in scope.
- [ ] Symbol files (`build/symbols`) archived for crash de-obfuscation.
- [ ] Web deep links / refresh verified on the deployed build.
