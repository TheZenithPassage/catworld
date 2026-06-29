---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Include tests when explicitly
requested in the feature specification or required by the constitution for
business rules, persistence, migrations, security, shared contracts, or other
high-risk behavior.

**Organization**: Tasks are grouped by independently verifiable user journeys
when natural, or by dependency-driven verifiable technical outcomes for
technical/enabling work.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which user story or technical outcome this task belongs to
  (e.g., US1, US2, TO1)
- Include exact file paths in descriptions

## Path Conventions

- **Backend source**: `src/main/java/`
- **Backend resources and migrations**: `src/main/resources/`
- **Backend tests**: `src/test/java/`
- **Frontend source and tests**: `frontend/src/`
- Generated tasks MUST use exact file paths and include only paths relevant to
  the feature.

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
  parallel task groups when the feature artifacts do not support them.

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
- [ ] T007 Add constitution-required validation task(s) for business rules, persistence, security, contracts, or operational safety

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

### Tests for User Story or Technical Outcome 1 (include if requested or constitution-required) ⚠️

> **NOTE: Testing order is chosen per feature. Constitution-required coverage
> remains mandatory for business rules, persistence, migrations, security,
> shared contracts, and other high-risk behavior.**

- [ ] T011 [P] [US1/TO1] Backend/service/controller test in src/test/java/[package]/[TestClass].java
- [ ] T012 [P] [US1/TO1] Frontend behavior test in frontend/src/[feature]/[component-or-service].spec.ts

### Implementation for User Story or Technical Outcome 1

- [ ] T013 [P] [US1/TO1] Update backend model/DTO/mapper in src/main/java/[package]/[Class].java when required by the feature
- [ ] T014 [P] [US1/TO1] Update frontend model or utility in frontend/src/[feature]/[file].ts when required by the feature
- [ ] T015 [US1/TO1] Implement service behavior in src/main/java/[package]/service/[Service].java when required by the feature
- [ ] T016 [US1/TO1] Implement endpoint or UI behavior in src/main/java/[package]/controller/[Controller].java or frontend/src/[feature]/[file].ts when required by the feature
- [ ] T017 [US1/TO1] Add validation and error handling required by this user journey or technical outcome
- [ ] T018 [US1/TO1] Add logging only if required by the specification, plan, or existing project pattern

**Checkpoint**: At this point, User Story or Technical Outcome 1 should be fully functional and objectively verifiable

---

## Phase 4: User Story or Technical Outcome 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this user journey or technical outcome delivers]

**Verification**: [How to verify this user journey or technical outcome works on its own, or document real dependencies]

### Tests for User Story or Technical Outcome 2 (include if requested or constitution-required) ⚠️

- [ ] T019 [P] [US2/TO2] Backend/service/controller test in src/test/java/[package]/[TestClass].java
- [ ] T020 [P] [US2/TO2] Frontend behavior test in frontend/src/[feature]/[component-or-service].spec.ts

### Implementation for User Story or Technical Outcome 2

- [ ] T021 [P] [US2/TO2] Update backend or frontend model in src/main/java/[package]/[Class].java or frontend/src/[feature]/[file].ts when required by the feature
- [ ] T022 [US2/TO2] Implement service behavior in src/main/java/[package]/service/[Service].java when required by the feature
- [ ] T023 [US2/TO2] Implement endpoint or UI behavior in src/main/java/[package]/controller/[Controller].java or frontend/src/[feature]/[file].ts when required by the feature
- [ ] T024 [US2/TO2] Integrate with User Story or Technical Outcome 1 components if required by recorded dependencies

**Checkpoint**: At this point, User Stories or Technical Outcomes 1 AND 2 should both be objectively verifiable

---

## Phase 5: User Story or Technical Outcome 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this user journey or technical outcome delivers]

**Verification**: [How to verify this user journey or technical outcome works on its own, or document real dependencies]

### Tests for User Story or Technical Outcome 3 (include if requested or constitution-required) ⚠️

- [ ] T025 [P] [US3/TO3] Backend/service/controller test in src/test/java/[package]/[TestClass].java
- [ ] T026 [P] [US3/TO3] Frontend behavior test in frontend/src/[feature]/[component-or-service].spec.ts

### Implementation for User Story or Technical Outcome 3

- [ ] T027 [P] [US3/TO3] Update backend or frontend model in src/main/java/[package]/[Class].java or frontend/src/[feature]/[file].ts when required by the feature
- [ ] T028 [US3/TO3] Implement service behavior in src/main/java/[package]/service/[Service].java when required by the feature
- [ ] T029 [US3/TO3] Implement endpoint or UI behavior in src/main/java/[package]/controller/[Controller].java or frontend/src/[feature]/[file].ts when required by the feature

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
# Launch all tests for User Story or Technical Outcome 1 together (if included and independent):
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
- Do not commit unless the user explicitly asks for a commit for that task
- Stop at any checkpoint to validate the user journey or technical outcome
- Avoid: vague tasks, same file conflicts, artificial independence, or
  unrelated cleanup
