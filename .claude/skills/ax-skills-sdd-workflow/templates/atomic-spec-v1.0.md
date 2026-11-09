# Feature Spec: {{feature_name}}

- **ID**: {{spec_id}}
- **Title**: {{title}}
- **Status**: {{status}} <!-- Draft | Review | Approved -->
- **Owner**: {{owner}}
- **Created**: {{created_date}} <!-- YYYY-MM-DD -->
- **Updated**: {{updated_date}} <!-- YYYY-MM-DD -->
- **Coverage**: {{coverage}} <!-- Frontend | Backend | DB | Scripts | Jobs | NFR | Integration | Composite -->
- **Source explore**: {{source_explore_path}} <!-- repository-relative path to the explore-*.md this spec was derived from -->

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
- {{constraint_3}}

## 4. Change Summary

### Added
- {{added_change_1}}

### Changed
- {{changed_change_1}}
- {{changed_change_2}}

### Removed
- {{removed_change_1}}
- {{removed_change_2}}

## 5. Experience and Design Constraints

### User experience requirements
- {{ux_requirement_1}}
- {{ux_requirement_2}}
- {{ux_requirement_3}}

### Interaction flow
- **Flow:** {{interaction_flow}}
- **Visuals:** {{visual_requirements}}
- **Edge Cases:** {{ux_edge_cases}}

### Design source
- **Figma file:** {{figma_file_url}}
- **Page ID:** {{figma_page_id}}
- **Frames covered:** {{figma_frames}}
- **Design owner:** {{design_owner}}
- **Version or branch:** {{design_version}}

### Interaction and state requirements
- **Required states:** default, hover, focus, active, disabled, loading, empty, error, success.
- **Required transitions:** {{required_transitions}}
- **Keyboard and focus behavior:** {{keyboard_focus_behavior}}

### Content and layout constraints
- {{layout_constraint_1}}
- {{layout_constraint_2}}
- {{layout_constraint_3}}
- {{layout_constraint_4}}

## 6. Data and State

### Data model and entities
- **{{data_model_name}}**: {{data_model_description}}
- **{{entity_1_name}}**: {{entity_1_description}}
- **{{entity_2_name}}**: {{entity_2_description}}

### State transitions
- {{valid_state_transition}}
- {{invalid_state_transition}}

### Data rules
- {{data_validation_rule}}
- {{retention_sync_consistency_rule}}

## 7. Technical Boundaries

### Technical design requirements
- {{technical_design_requirement_1}}
- {{technical_design_requirement_2}}

### Integration points
- {{integration_point_1}}
- {{integration_point_2}}

### Compatibility requirements
- {{compatibility_requirement_1}}
- {{compatibility_requirement_2}}

### Deployment requirements (optional)

<!-- Omit this entire subsection when there is **no deployment impact** (tests-only, docs-only, local tooling). When infra, releases, migrations, or production config change, list concrete steps. -->

- {{deployment_requirement_1}}
- {{deployment_requirement_2}}
- {{deployment_requirement_3}}

### Auth requirements
- {{auth_requirement_1}}

## 8. Success Criteria

### Measurable outcomes
- **SC-001**: {{success_criterion_1}}
- **SC-002**: {{success_criterion_2}}

### Acceptance notes
- {{acceptance_note}}
- [ ] GIVEN {{given_context}}, WHEN {{when_action}}, THEN {{then_result}}
- [ ] Negative Test: GIVEN {{negative_given}}, THEN {{negative_then_result}}

## 9. Important Notes

- {{important_note_or_na}}

## 10. Dependencies

### Upstream atomic specs
<!-- Other spec-*.md under paths.proposed_output_dir that must land before this one; repo-relative path + one-line why. None if not applicable. -->
- {{upstream_atomic_spec_1}}
- {{upstream_atomic_spec_2}}

### External systems and libraries
<!-- Services, packages, infra outside this repo’s spec set. -->
- {{external_dependency_1}}
- {{external_dependency_2}}

## 11. Review Checklist

- [ ] Requirements are atomic.
- [ ] No implementation tasks are included.
- [ ] Add/change/remove are explicit.
- [ ] UX, technical, and deployment impact are documented **or explicitly marked not applicable** (omit optional deployment subsection when N/A).
- [ ] Success criteria are measurable.
- [ ] Ambiguities are marked clearly.
- [ ] Playwright test should be wriiten properly for all user clicks(if front end chages).
- [ ] After code completion run playwright test (if front end changes).
- [ ] Push Everything to the brach and then create pr if using github create pr on github if azure then on azure there will be always for github cli and Azure MCP will be there.
