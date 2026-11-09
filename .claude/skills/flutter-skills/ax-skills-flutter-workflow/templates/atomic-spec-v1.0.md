# Feature Spec: {{feature_name}}

**ID**: {{spec_id}}
**Title**: {{title}}
**Status**: {{status}} <!-- Draft | Review | Approved -->
**Owner**: {{owner}}
**Created**: {{created_date}} <!-- YYYY-MM-DD -->
**Updated**: {{updated_date}} <!-- YYYY-MM-DD -->
**Feature module**: {{feature_module}} <!-- lib/features/<feature_module> -->
**Coverage**: {{coverage}} <!-- Presentation | Domain | Data | State | Navigation | Platform | NFR | Integration | Composite -->
**Target platforms**: {{target_platforms}} <!-- subset of web | ios | android -->
**Source explore**: {{source_explore_path}} <!-- repository-relative path to the explore-*.md this spec was derived from -->

## 1. Intent

### Summary
{{summary}}

### Goal
{{goal}}

### Non-goals
- {{non_goal_1}}
- {{non_goal_2}}

## 2. User Scenarios

### Primary user journey
{{primary_user_journey}}

### Secondary user journeys
- {{secondary_user_journey_1}}
- {{secondary_user_journey_2}}

### Edge cases
- {{edge_case_1}}
- {{edge_case_2}}

## 3. Requirements

### Functional requirements
- **FR-001**: {{functional_requirement_1}}
- **FR-002**: {{functional_requirement_2}}

### Non-functional requirements
- **NFR-001**: {{non_functional_requirement_1}}
- **NFR-002**: {{non_functional_requirement_2}}

### Constraints
- {{constraint_1}}
- {{constraint_2}}

## 4. Change Summary

### Added
- {{added_change_1}}

### Changed
- {{changed_change_1}}

### Removed
- {{removed_change_1}}

## 5. Experience and Design Constraints

### User experience requirements
- {{ux_requirement_1}}
- {{ux_requirement_2}}

### Interaction flow
- **Flow:** {{interaction_flow}}
- **Visuals (Material 3 / design tokens):** {{visual_requirements}}
- **Edge Cases:** {{ux_edge_cases}}

### Responsive and adaptive behavior
- **Breakpoints (mobile / tablet / web):** {{breakpoints}}
- **Adaptive widgets / layout switches:** {{adaptive_layout}}
- **Platform conventions (web URL, iOS gestures, Android back):** {{platform_conventions}}

### Design source
- **Figma file:** {{figma_file_url}}
- **Page ID:** {{figma_page_id}}
- **Frames covered:** {{figma_frames}}
- **Design owner:** {{design_owner}}

### Design system mapping
<!-- How this slice uses lib/design_system (see ax-skills-flutter-ui). State None where not applicable. -->
- **Tokens used / added:** {{tokens_used_or_added}}
- **DS components consumed:** {{ds_components_consumed}}
- **DS components to create (atom/molecule/organism/template):** {{ds_components_to_create}}
- **Page template:** {{page_template}}
- **Modes (light/dark/brand):** {{theme_modes}}

### Required widget states
- **Required states:** initial, loading, empty, success, error, refreshing, disabled.
- **Required transitions:** {{required_transitions}}
- **Accessibility (semantics, focus, contrast, text scaling):** {{accessibility_behavior}}

## 6. State Management and Data

### Bloc / Cubit
- **Name:** {{bloc_or_cubit_name}}
- **Type:** {{bloc_or_cubit}} <!-- Cubit (method-driven) | Bloc (event-driven) -->
- **States (freezed union):** {{states}}
- **Events or public methods:** {{events_or_methods}}
- **Provided via:** {{provider_scope}} <!-- BlocProvider scope: route-level | app-level | widget subtree -->
- **Dependencies injected (constructor):** {{injected_dependencies}}

### Domain
- **Entities:** {{entities}}
- **Use cases / repository contracts:** {{usecases_or_contracts}}

### Data
- **Models (json_serializable):** {{models}}
- **Data sources (remote dio/retrofit, local):** {{data_sources}}
- **Repository implementations:** {{repository_impls}}

### Data and state rules
- **State transitions (valid / invalid):** {{state_transitions}}
- **Validation / error mapping rules:** {{validation_and_error_rules}}
- **Caching / persistence / sync:** {{caching_persistence_sync}}

## 7. Technical Boundaries

### Technical design requirements
- {{technical_design_requirement_1}}
- {{technical_design_requirement_2}}

### Integration points
- {{integration_point_1}}
- {{integration_point_2}}

### Navigation (go_router)
- **Routes added/changed:** {{routes}}
- **Guards / redirects (auth):** {{route_guards}}
- **Deep link / web URL behavior:** {{deep_link_behavior}}

### Auth requirements
- {{auth_requirement_1}}

## 8. Platform and Build Targets

### Per-platform behavior
- **Web:** {{web_behavior}} <!-- URL strategy, renderer, SEO/meta, responsive -->
- **iOS:** {{ios_behavior}} <!-- min version, permissions (Info.plist), gestures -->
- **Android:** {{android_behavior}} <!-- min SDK, permissions, back handling -->

### Plugins and native dependencies
- {{plugin_or_native_dependency}}

### Build / release notes
- {{build_release_note}}

## 9. Success Criteria

### Measurable outcomes
- **SC-001**: {{success_criterion_1}}
- **SC-002**: {{success_criterion_2}}

### Acceptance notes
- [ ] GIVEN {{given_context}}, WHEN {{when_action}}, THEN {{then_result}}
- [ ] Negative Test: GIVEN {{negative_given}}, THEN {{negative_then_result}}

### Test plan hooks
- **bloc_test cases:** {{bloc_test_cases}}
- **Widget / golden tests:** {{widget_or_golden_tests}}
- **Integration (per platform):** {{integration_tests}}

## 10. Important Notes

- {{important_note_or_na}}

## 11. Dependencies

### Upstream atomic specs
<!-- Other spec-*.md under paths.proposed_output_dir that must land before this one; repo-relative path + one-line why. None if not applicable. -->
- {{upstream_atomic_spec_1}}
- {{upstream_atomic_spec_2}}

### External systems and libraries
<!-- Pub packages, backend services, SDKs, infra outside this repo's spec set. -->
- {{external_dependency_1}}
- {{external_dependency_2}}

## 12. Review Checklist

- [ ] Requirements are atomic.
- [ ] No implementation tasks are included.
- [ ] Add/change/remove are explicit.
- [ ] Bloc vs Cubit choice is justified; states/events enumerated.
- [ ] Folder placement under `lib/features/<module>/{data,domain,presentation}` is clear.
- [ ] Per-platform behavior (web/iOS/Android) and responsiveness are covered.
- [ ] UX, navigation, and design constraints are included.
- [ ] Success criteria are measurable and have test hooks.
- [ ] Ambiguities are marked clearly.
