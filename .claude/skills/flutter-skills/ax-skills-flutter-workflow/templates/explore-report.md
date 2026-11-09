# Flutter Explore Report - {{timestamp}}

## Explore Intent

### User intent seed
- {{intent_seed}}

### Scope boundaries
- In scope:
  - {{in_scope_item}}
- Out of scope:
  - {{out_of_scope_item}}

### Source grounding
- Bootstrap: {{bootstrap_source}}
- Codebase (lib/features, lib/core): {{codebase_source}}
- Documents / designs: {{document_source}}

## New Specs to Propose

### Candidate: {{feature_module}} / {{component}}
- Problem to solve: {{problem_to_solve}}
- Candidate spec intent: {{candidate_spec_intent}}
- Primary user journey: {{primary_user_journey}}
- Layer touchpoints (data / domain / presentation): {{layer_touchpoints}}
- Key constraints:
  - {{constraint}}
- Why now: {{why_now}}

## Existing Specs Changes and Deletions

### Spec area: {{feature_module}} / {{component}}
- Current state: {{current_state}}
- Proposed change: {{proposed_change}}
- Change type: {{change_type}} <!-- add | update | delete -->
- Why change is needed: {{why_change_is_needed}}
- Impact scope (blocs/cubits, repos, routes, widgets):
  - {{impact_scope}}

## Feature Modules and Integration Notes

### Feature module: {{feature_module}}
- Description: {{description}}
- User or business value: {{value}}
- Folder layout: `lib/features/{{feature_module}}/{data,domain,presentation}`
- Repositories / data sources: {{repositories_and_datasources}}
- Routes (go_router) exposed: {{routes}}
- Integration touchpoints (APIs, shared core, other features):
  - {{integration_touchpoint}}
- Risks or unknowns:
  - {{risk_or_unknown}}

## State Management Design

### Bloc/Cubit: {{bloc_or_cubit_name}}
- Type: {{bloc_or_cubit}} <!-- Cubit (method-driven) | Bloc (event-driven) -->
- Why this type: {{why_this_type}}
- States (freezed union / sealed): {{states}}
- Events or public methods: {{events_or_methods}}
- Dependencies injected: {{injected_dependencies}}
- Side effects (navigation, snackbars, analytics): {{side_effects}}

## Platform and Responsiveness Notes

- Target platforms in scope: {{target_platforms}} <!-- web | ios | android -->
- Responsive / adaptive behavior: {{responsive_behavior}}
- Platform-specific concerns (web URL/SEO, iOS permissions, Android back handling): {{platform_specific_concerns}}
- Plugins requiring per-platform support / fallbacks: {{platform_plugin_notes}}

## Assumptions

- {{assumption}}

## High-Impact Open Questions

- [ ] {{high_impact_question}}
  - Resolution: {{resolution_or_tbd}}
  - Decision owner: {{decision_owner}}
  - Evidence or source: {{evidence_source}}
  - Status: {{resolved_or_blocked}}

## Discussion Notes and Decision Trail

### {{note_timestamp}} — {{topic}}
- User input: {{user_input}}
- Options explored:
  - {{explored_option}}
- Decision or current direction: {{decision_or_direction}}
- Grounding sources: {{grounding_sources}}

## Out-of-Scope Candidate Ideas

- Idea: {{candidate_idea}}
  - Why out of scope now: {{out_of_scope_reason}}
  - Potential future trigger: {{future_trigger}}
  - Related area: {{related_area}}

## Proposal Status

- **State**: pending
- **Last updated**: {{timestamp}}
- **Generated specs**:
  - none
