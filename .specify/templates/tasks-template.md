---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Include tests when explicitly
requested in the feature specification or required by the constitution, plan,
semantic-equivalence review, validation matrix, or feature risk for business
rules, visible behavior, persistence, migrations, security, shared contracts,
or other correctness-sensitive behavior. Evidence may also be a focused review
or manual visible smoke check when automation cannot fully prove the behavior.

**Organization**: Tasks are grouped by independently verifiable user journeys
when natural, or by dependency-driven verifiable technical outcomes for
technical/enabling work. Related requirements and equivalent consumers may
share an implementation or evidence task when they describe the same underlying
behavior; materially different behavior remains separately actionable.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which user story or technical outcome this task belongs to
  (e.g., US1, US2, TO1)
- Include exact file paths in descriptions. For repetitive consumer work, a
  precise directory or bounded pattern plus an inventory/completeness check may
  replace a repetitive file-by-file task list.

## Path Conventions

- **Backend source**: `src/main/java/`
- **Backend resources and migrations**: `src/main/resources/`
- **Backend tests**: `src/test/java/`
- **Frontend source and tests**: `frontend/src/`
- Generated tasks MUST use exact file paths and include only paths relevant to
  the feature, except that grouped repetitive-consumer tasks may use a precise
  directory or bounded pattern with an explicit aggregate completeness check.

## Architecture and Technology Assessment Gate

Before generating implementation tasks, inspect plan.md.

- If Architecture and Technology Assessment is required and **Human approval**
  is still `pending`, treat the feature as blocked.
- Do not generate implementation tasks that assume or select an architecture,
  framework, library, service, native capability, or custom design while the
  required approval is pending.
- Generate only legitimate research, comparison, decision-documentation, or
  approval-blocker tasks when those tasks are actually still needed.
- If the plan already contains the completed assessment and only human approval
  is missing, report the blocking condition instead of creating a task that an
  implementation agent could falsely mark complete.
- After explicit approval is recorded, implementation tasks may be generated or
  regenerated and MUST follow the approved approach.
- If a valid prior approved architectural decision is referenced and applicable,
  no duplicate approval task is needed.
- Implementation tasks MUST NOT reopen the decision or silently substitute a
  different approach.

## Validation Evidence Rules

Before generating implementation tasks, inspect spec.md and plan.md for
observable behavior details, validation matrices, semantic-equivalence reviews,
and validation evidence plans.

- Frontend-visible requirements need evidence at the visible surface: DOM
  assertions, Angular Material/CDK harness checks where appropriate, routed
  navigation assertions, focus/keyboard checks, or manual visible-device smoke
  checks when automation is not enough. Component state, service spies, or
  implementation-detail assertions are not sufficient by themselves.
- Backend business rules need service-layer evidence and controller/API
  evidence when externally observable.
- API contracts need status, payload, serialization, validation-response, and
  compatibility evidence at the contract boundary.
- Authorization and security behavior need backend enforcement evidence; add
  frontend role visibility or navigation evidence when the UI changes.
- Persistence and migrations need Flyway/schema/data-integrity evidence
  proportional to risk.
- Validation matrices need evidence for relevant behavior, including blocked
  action, API-call behavior, visible feedback, value transformation or
  preservation, and correction behavior when in scope. One adequate evidence
  task may cover several related rows; do not require one task or test per row
  when the same mechanism and proof apply.
- Semantic-equivalence reviews need proof tasks that compare preserved behavior
  against the recorded old behavior/source of truth and new mechanism
  semantics.
- Replacement, migration, or narrowing work needs a replacement-boundary proof
  task. The task must verify that the old mechanism no longer affects migrated
  surfaces unless that coexistence is intentional, and that any remaining old
  behavior is scoped to surfaces that still depend on it.
- Validation tasks are complete only when the required evidence passed after
  the latest relevant change.

## Coverage Consolidation Rules

- One implementation or evidence task MAY cover multiple related requirements,
  acceptance criteria, contracts, matrix rows, files, pages, surfaces, or
  equivalent consumers when they describe the same underlying behavior.
- Do not create separate tasks or tests solely because the same mechanism
  appears in several equivalent consumers. Group repetitive migration into one
  or a few practical tasks and prove completeness with a directed search,
  inventory, compilation, build, existing test suite, or other proportional
  check.
- Keep tasks separate when implementation, observable behavior, responsible
  layer, dependency, risk, or required evidence is materially different.
- Consolidation MUST preserve explicit traceability and all
  constitution-required evidence; it must not hide unresolved decisions or
  uncovered behavior.

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories or verifiable technical outcomes from spec.md
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story where the feature has natural user
  journeys, or by verifiable technical outcome where the work is technical,
  architectural, migration, security, operational, refactoring, or enabling.
  Do not create artificial user stories, independent deployment steps, or
  parallel task groups when the feature artifacts do not support them. Do not
  expand one shared mechanism into one task per file, page, surface, or
  equivalent consumer.

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Optional)

**Purpose**: Feature-specific setup only. Omit this phase if the feature has no
real setup work.

- [ ] T001 Add or adjust only feature-required scaffolding in [exact path]
- [ ] T002 [P] Add feature-required fixture, asset, or helper in [exact path]

<!--
  Omit setup entirely when there is no real setup work. Do not generate
  meta-tasks merely to confirm scope, inspect files, or restate the
  implementation plan. Do not initialize an already existing project,
  migration framework, authentication system, or directory structure.
-->

---

## Phase 2: Foundational (Optional Blocking Prerequisites)

**Purpose**: Shared work that MUST be complete before affected user stories or
technical outcomes can be implemented. Omit this phase if the feature has no
shared foundational work.

**⚠️ CRITICAL**: Include this phase only for real cross-story or cross-outcome
prerequisites.
Do not create placeholder infrastructure tasks when existing CatWorld
infrastructure already satisfies the feature.

Examples of foundational tasks (adjust based on your project):

- [ ] T003 Add Flyway migration in src/main/resources/db/migration/[version]__[name].sql when the feature changes persisted schema
- [ ] T004 [P] Update authorization in src/main/java/[package]/[Class].java when the feature changes access behavior
- [ ] T005 [P] Add shared DTO/model/mapper changes in src/main/java/[package]/[Class].java when required by multiple stories
- [ ] T006 Add configuration in src/main/resources/[file] only when the feature introduces a new runtime setting
- [ ] T007 Add constitution- or plan-required validation task(s) for visible behavior, business rules, persistence, migrations, security, contracts, authorization, semantic equivalence, or operational safety

<!--
  Architecture and Technology Assessment approval is a generation gate, not an
  ordinary implementation checkbox. If the selected approach lacks explicit
  human approval or an applicable prior approved decision, stop task generation
  and report the blocker. When approval exists, implementation tasks MUST follow
  the approved approach and MUST NOT silently reopen the decision or choose a
  different framework, library, native capability, custom design, or
  shared-infrastructure design.
-->

**Checkpoint**: Shared prerequisites complete - affected user story or
technical outcome implementation can now begin

---

## Phase 3: User Story or Technical Outcome 1 - [Title] (Priority: P1)

**Goal**: [Brief description of what this user journey or technical outcome delivers]

**Verification**: [How to verify this user journey or technical outcome works on its own, or document real dependencies]

### Evidence for User Story or Technical Outcome 1 (include when specification-, constitution-, plan-, semantic-equivalence-, matrix-, or risk-required) ⚠️

> **NOTE: Evidence timing is chosen per feature. Required coverage remains
> mandatory for visible behavior, business rules, persistence, migrations,
> security, shared contracts, semantic equivalence, validation matrices, and
> other correctness-sensitive behavior.**

- [ ] T011 [P] [US1/TO1] Backend service/controller/API evidence in src/test/java/[package]/[TestClass].java
- [ ] T012 [P] [US1/TO1] Frontend visible-behavior evidence using DOM assertions or Angular Material/CDK harnesses in frontend/src/[feature]/[component-or-service].spec.ts
- [ ] T013 [US1/TO1] Validation matrix evidence for blocked actions, API-call behavior, visible feedback, value transformation or preservation, and correction behavior in [exact test or review path]

### Implementation for User Story or Technical Outcome 1

- [ ] T014 [P] [US1/TO1] Update backend model/DTO/mapper in src/main/java/[package]/[Class].java when required by the feature
- [ ] T015 [P] [US1/TO1] Update frontend model or utility in frontend/src/[feature]/[file].ts when required by the feature
- [ ] T016 [US1/TO1] Implement service behavior in src/main/java/[package]/service/[Service].java when required by the feature
- [ ] T017 [US1/TO1] Implement endpoint or UI behavior in src/main/java/[package]/controller/[Controller].java or frontend/src/[feature]/[file].ts when required by the feature
- [ ] T018 [US1/TO1] Add validation and error handling required by this user journey or technical outcome
- [ ] T019 [US1/TO1] Add logging only if required by the specification, plan, or existing project pattern

**Checkpoint**: At this point, User Story or Technical Outcome 1 should be fully functional and objectively verifiable

---

## Phase 4: User Story or Technical Outcome 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this user journey or technical outcome delivers]

**Verification**: [How to verify this user journey or technical outcome works on its own, or document real dependencies]

### Evidence for User Story or Technical Outcome 2 (include when specification-, constitution-, plan-, semantic-equivalence-, matrix-, or risk-required) ⚠️

- [ ] T020 [P] [US2/TO2] Backend service/controller/API evidence in src/test/java/[package]/[TestClass].java
- [ ] T021 [P] [US2/TO2] Frontend visible-behavior evidence using DOM assertions or Angular Material/CDK harnesses in frontend/src/[feature]/[component-or-service].spec.ts

### Implementation for User Story or Technical Outcome 2

- [ ] T022 [P] [US2/TO2] Update backend or frontend model in src/main/java/[package]/[Class].java or frontend/src/[feature]/[file].ts when required by the feature
- [ ] T023 [US2/TO2] Implement service behavior in src/main/java/[package]/service/[Service].java when required by the feature
- [ ] T024 [US2/TO2] Implement endpoint or UI behavior in src/main/java/[package]/controller/[Controller].java or frontend/src/[feature]/[file].ts when required by the feature
- [ ] T025 [US2/TO2] Integrate with User Story or Technical Outcome 1 components if required by recorded dependencies

**Checkpoint**: At this point, User Stories or Technical Outcomes 1 AND 2 should both be objectively verifiable

---

## Phase 5: User Story or Technical Outcome 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this user journey or technical outcome delivers]

**Verification**: [How to verify this user journey or technical outcome works on its own, or document real dependencies]

### Evidence for User Story or Technical Outcome 3 (include when specification-, constitution-, plan-, semantic-equivalence-, matrix-, or risk-required) ⚠️

- [ ] T026 [P] [US3/TO3] Backend service/controller/API evidence in src/test/java/[package]/[TestClass].java
- [ ] T027 [P] [US3/TO3] Frontend visible-behavior evidence using DOM assertions or Angular Material/CDK harnesses in frontend/src/[feature]/[component-or-service].spec.ts

### Implementation for User Story or Technical Outcome 3

- [ ] T028 [P] [US3/TO3] Update backend or frontend model in src/main/java/[package]/[Class].java or frontend/src/[feature]/[file].ts when required by the feature
- [ ] T029 [US3/TO3] Implement service behavior in src/main/java/[package]/service/[Service].java when required by the feature
- [ ] T030 [US3/TO3] Implement endpoint or UI behavior in src/main/java/[package]/controller/[Controller].java or frontend/src/[feature]/[file].ts when required by the feature

**Checkpoint**: All user stories or technical outcomes should now be objectively verifiable

---

[Add more user story or technical outcome phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Concrete final work supported by the feature artifacts

- [ ] TXXX [P] Documentation update in [exact path] if required by the feature or constitution
- [ ] TXXX Refactor [exact path] only if required to complete this feature safely
- [ ] TXXX Performance optimization in [exact path] only when required by confirmed performance goals
- [ ] TXXX [P] Additional test in [exact path] if required by risk or constitution
- [ ] TXXX Security hardening in [exact path] only when required by the feature or constitution
- [ ] TXXX Run constitution compliance validation
- [ ] TXXX Run quickstart.md validation only if quickstart.md exists for this feature
- [ ] TXXX Review changed files against plan/source map and justify or remove unplanned touched surfaces
- [ ] TXXX Perform a proportional replacement-boundary review when the feature replaces, migrates, or narrows an existing mechanism. Briefly list the old selectors, helpers, routes, APIs, styles, or behaviors being replaced; verify they no longer affect migrated surfaces unless coexistence is intentional; identify the surfaces that still depend on the old mechanism; and remove or narrow any unintentional remaining effect
- [ ] TXXX Rerun affected validation after relevant late changes, or report stale/not-revalidated checks explicitly

<!--
  The final phase must contain only concrete work supported by the feature
  artifacts. Do not add unrelated cleanup, refactoring, performance work,
  security hardening, configuration changes, or documentation updates merely
  because they appear in this template.
-->

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Optional; include only when real setup work exists
- **Foundational (Phase 2)**: Optional; include only when shared prerequisites exist
- **User Stories or Technical Outcomes (Phase 3+)**: Depend on included
  prerequisite phases and the actual dependencies recorded in plan.md
- **Polish (Final Phase)**: Depends on all desired user stories or technical
  outcomes being complete

### User Story or Technical Outcome Dependencies

- **User Story or Technical Outcome 1 (P1)**: [Actual dependencies from plan.md]
- **User Story or Technical Outcome 2 (P2)**: [Actual dependencies from plan.md]
- **User Story or Technical Outcome 3 (P3)**: [Actual dependencies from plan.md]

### Within Each User Story or Technical Outcome

- Order tasks according to actual dependencies recorded in plan.md.
- Shared prerequisites before dependent user journeys or technical outcomes.
- Validation tasks at the point where they provide useful evidence; testing
  order may be chosen per feature.
- Complete and validate each user journey or technical outcome before treating
  it done.

### Parallel Opportunities (only when dependencies allow)

- Included Setup tasks marked [P] can run in parallel
- Included Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once included prerequisite phases complete, user stories or technical outcomes
  with no dependencies between them may start in parallel
- Tests marked [P] may run in parallel
- Independent file changes marked [P] may run in parallel
- Different user stories or technical outcomes may be worked on in parallel
  when dependencies allow

---

## Parallel Example: User Story or Technical Outcome 1

```bash
# Launch all evidence tasks for User Story or Technical Outcome 1 together (if included and independent):
Task: "Backend/service/controller test in src/test/java/[package]/[TestClass].java"
Task: "Frontend behavior test in frontend/src/[feature]/[component-or-service].spec.ts"

# Launch independent model/utility updates together:
Task: "Update backend model/DTO/mapper in src/main/java/[package]/[Class].java"
Task: "Update frontend model or utility in frontend/src/[feature]/[file].ts"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete included prerequisite phases, if any
2. Complete Phase 3: User Story or Technical Outcome 1
3. **STOP and VALIDATE**: Verify the first user journey or technical outcome
4. Demo if relevant

### Incremental Delivery

1. Complete included prerequisite phases, if any
2. Add User Story or Technical Outcome 1 → Validate objective evidence
3. Add User Story or Technical Outcome 2 → Validate objective evidence
4. Add User Story or Technical Outcome 3 → Validate objective evidence
5. Each increment preserves previous validated behavior

### Parallel Team Strategy

With multiple developers:

1. Team completes included prerequisite phases, if any
2. Once prerequisites are done, assign independent user stories or technical
   outcomes according to dependency order
3. Work integrates when each assigned outcome has objective validation evidence

---

## Notes

- [P] tasks = different files, no dependencies
- [Trace] label maps task to a specific user story or technical outcome for traceability
- Each group must be objectively verifiable
- Choose test timing per feature while preserving constitution-required coverage
- Do not add task-list tasks for branch cleanup, branch deletion, remote
  pruning, force-push, merge, auto-merge, issue mutation, or public comments
  unless the user explicitly requests those operations where applicable.
- Do not add committing, pushing, or opening/updating pull requests as ordinary
  implementation tasks. Delivery operations are handled by the active CatWorld
  workflow after scoped tasks and required validation complete, when that
  workflow allows delivery.
- Stop at any checkpoint to validate the user journey or technical outcome
- Avoid: vague tasks, same file conflicts, artificial independence, or
  unrelated cleanup
