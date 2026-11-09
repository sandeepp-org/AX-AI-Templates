# BLoC + Cubit Canonical Patterns

Reference shapes for this project. Keep state immutable (`freezed`), inject domain contracts via constructor, and map errors to `Failure`. These are illustrative skeletons, not copy-paste-and-forget — adapt names to the feature.

## 1. Cubit with status-enum state (default)

Use for most screens: simple, method-driven, data shared across statuses.

```dart
// presentation/cubit/profile_state.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/profile.dart';
part 'profile_state.freezed.dart';

enum ProfileStatus { initial, loading, success, failure }

@freezed
class ProfileState with _$ProfileState {
  const factory ProfileState({
    @Default(ProfileStatus.initial) ProfileStatus status,
    Profile? profile,
    String? errorMessage,
  }) = _ProfileState;
}
```

```dart
// presentation/cubit/profile_cubit.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/profile_repository.dart';
import 'profile_state.dart';

class ProfileCubit extends Cubit<ProfileState> {
  ProfileCubit(this._repository) : super(const ProfileState());
  final ProfileRepository _repository;

  Future<void> load() async {
    emit(state.copyWith(status: ProfileStatus.loading));
    final result = await _repository.getProfile();
    result.fold(
      (failure) => emit(state.copyWith(
        status: ProfileStatus.failure,
        errorMessage: failure.message,
      )),
      (profile) => emit(state.copyWith(
        status: ProfileStatus.success,
        profile: profile,
      )),
    );
  }
}
```

## 2. Bloc with event union (when events earn their keep)

Use when you need an event stream, ordered transitions, or transformers (debounce/throttle).

```dart
// presentation/bloc/search_event.dart
@freezed
class SearchEvent with _$SearchEvent {
  const factory SearchEvent.queryChanged(String query) = _QueryChanged;
  const factory SearchEvent.cleared() = _Cleared;
}
```

```dart
// presentation/bloc/search_bloc.dart
import 'package:bloc_concurrency/bloc_concurrency.dart';
import 'package:stream_transform/stream_transform.dart';

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  SearchBloc(this._repository) : super(const SearchState()) {
    on<_QueryChanged>(
      _onQueryChanged,
      transformer: (events, mapper) =>
          events.debounce(const Duration(milliseconds: 300)).switchMap(mapper),
    );
    on<_Cleared>((event, emit) => emit(const SearchState()));
  }
  final SearchRepository _repository;

  Future<void> _onQueryChanged(_QueryChanged event, Emitter<SearchState> emit) async {
    if (event.query.isEmpty) return emit(const SearchState());
    emit(state.copyWith(status: SearchStatus.loading));
    final result = await _repository.search(event.query);
    result.fold(
      (f) => emit(state.copyWith(status: SearchStatus.failure, errorMessage: f.message)),
      (items) => emit(state.copyWith(status: SearchStatus.success, items: items)),
    );
  }
}
```

## 3. Providing the cubit at the route (DI)

Scope the bloc/cubit to the route subtree; read the repository injected above the router.

```dart
GoRoute(
  path: ProfileRoute.path,
  name: ProfileRoute.name,
  builder: (context, state) => BlocProvider(
    create: (ctx) => ProfileCubit(ctx.read<ProfileRepository>())..load(),
    child: const ProfilePage(),
  ),
),
```

## 4. Consuming state in the widget

Widgets only render state and call methods / add events. No business logic, no `context` after `await`.

```dart
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<ProfileCubit, ProfileState>(
        builder: (context, state) {
          switch (state.status) {
            case ProfileStatus.loading:
              return const Center(child: CircularProgressIndicator());
            case ProfileStatus.failure:
              return ErrorView(
                message: state.errorMessage ?? 'Something went wrong',
                onRetry: context.read<ProfileCubit>().load,
              );
            case ProfileStatus.success:
              return ProfileView(profile: state.profile!);
            case ProfileStatus.initial:
              return const SizedBox.shrink();
          }
        },
      ),
    );
  }
}
```

Use `BlocListener` / `BlocConsumer` for one-off side effects (snackbars, navigation) so they don't fire on every rebuild.

## 5. Repository contract + error mapping

```dart
// domain/repositories/profile_repository.dart
abstract class ProfileRepository {
  Future<Either<Failure, Profile>> getProfile();
}
```

```dart
// data/repositories/profile_repository_impl.dart
class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._remote);
  final ProfileApi _remote; // retrofit

  @override
  Future<Either<Failure, Profile>> getProfile() async {
    try {
      final model = await _remote.fetchProfile();
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(NetworkFailure.fromDio(e)); // map, never leak DioException upward
    }
  }
}
```

## 6. Testing (bloc_test)

```dart
blocTest<ProfileCubit, ProfileState>(
  'emits [loading, success] when load() succeeds',
  build: () => ProfileCubit(mockRepo),
  setUp: () => when(() => mockRepo.getProfile())
      .thenAnswer((_) async => Right(tProfile)),
  act: (cubit) => cubit.load(),
  expect: () => [
    const ProfileState(status: ProfileStatus.loading),
    ProfileState(status: ProfileStatus.success, profile: tProfile),
  ],
);
```

## 7. Global BlocObserver (observability)

Register one observer in `bootstrap.dart` to log/trace every transition and error centrally.

```dart
// core/observability/app_bloc_observer.dart
class AppBlocObserver extends BlocObserver {
  const AppBlocObserver(this._logger);
  final AppLogger _logger;

  @override
  void onChange(BlocBase bloc, Change change) {
    super.onChange(bloc, change);
    _logger.debug('${bloc.runtimeType} $change');
  }

  @override
  void onError(BlocBase bloc, Object error, StackTrace stackTrace) {
    _logger.error('${bloc.runtimeType}', error, stackTrace);
    super.onError(bloc, error, stackTrace);
  }
}

// bootstrap.dart
Bloc.observer = AppBlocObserver(logger);
```

## Anti-patterns to reject

- Business/validation logic inside a widget `build` or an `onPressed` closure.
- `emit` after the bloc is closed, or `emit` from outside the bloc.
- Mutable state fields or storing `BuildContext`/controllers in state.
- Presentation importing `*_model` or a data source instead of a domain entity/contract.
- Global service locator / singletons instead of constructor-injected contracts.
- Swallowing errors (`catch (_) {}`) instead of mapping to `Failure` and a UI error state.
- Navigation state living only in memory on web (breaks refresh/deep-link) instead of route params.
