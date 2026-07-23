---
name: "speckit-tasks"
description: "Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/tasks.md"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/powershell/setup-tasks.ps1 -Json` from repo root and parse FEATURE_DIR, TASKS_TEMPLATE, and AVAILABLE_DOCS list. `FEATURE_DIR` and `TASKS_TEMPLATE` must be absolute paths when provided. `AVAILABLE_DOCS` is a list of document names/relative paths available under `FEATURE_DIR` (for example `research.md` or `contracts/`). For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories or verifiable technical outcomes with priorities)
   - **Optional**: data-model.md (entities), contracts/ (interface contracts), research.md (decisions), quickstart.md (test scenarios)
   - **IF EXISTS**: Load `.specify/memory/constitution.md` for project principles and governance constraints
   - Note: Not all projects have all documents. Generate tasks based on what's available.
   - Extract observable behavior details, validation matrices,
     semantic-equivalence reviews, and the validation choices and reasons
     recorded in the plan. Preserve required evidence, but do not convert every
     row, criterion, surface, or consumer into a new automated-test task.

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories or verifiable technical outcomes with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories or technical outcomes
   - If contracts/ exists: Map interface contracts to user stories or technical outcomes
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by user story when the feature has natural user journeys, or by verifiable technical outcome for technical/enabling work (see Task Generation Rules below)
   - Generate dependency graph showing user story or technical outcome completion order
   - Create parallel execution examples per user story or technical outcome
   - Validate task completeness (each user story or technical outcome has all needed implementation and evidence tasks, independently testable where the artifacts support it)
   - Consolidate related requirements, acceptance criteria, contracts, matrix rows, files, pages, surfaces, or equivalent consumers into one implementation or evidence task when they describe the same underlying behavior. Preserve traceability by naming the covered behavior and the aggregate completeness check rather than multiplying task rows.
   - Group repetitive consumer migration into one or a few practical tasks and verify completeness with a directed search, inventory, compilation, build, existing test suite, or other proportional check. Do not create separate tasks or tests solely because the same mechanism appears in several equivalent consumers.
   - Keep tasks separate when implementation, observable behavior, responsible layer, dependency, risk, or required evidence is materially different.
   - For validation matrices, generate enough evidence work to prove the relevant rows at the appropriate layer. One broader task may cover several rows when the same mechanism and evidence prove them; state that coverage instead of repeating equivalent tasks. For forms and similar validation surfaces, consider empty string, whitespace-only string when trim-based validation exists, valid value, invalid format, boundary dates or numbers, missing optional vs required values, role-dependent permissions, stale state, and backend-rejected state when applicable.
   - For semantic-equivalence and replacement reviews, generate only the proof
     task or tasks selected by the applicable Validation Evidence Plan entry.
     The presence of the review MUST NOT independently generate a new permanent
     automated-test task. Proof MAY be existing-suite execution, compilation,
     build, directed inspection, focused review, a temporary/manual check, no
     new permanent test, or the smallest useful focused automated test. Allow
     low-impact local migrations, including validation or error-handling
     mechanism changes, to use review/inspection/build evidence when sufficient
     for actual regression risk. Preserve stronger responsible-layer proof for
     genuinely correctness-sensitive replacements.

4. **Generate tasks.md**: Read the tasks template from TASKS_TEMPLATE (from the JSON output above) and use it as structure. If TASKS_TEMPLATE is empty, fall back to `.specify/templates/tasks-template.md`. Fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks (project initialization)
   - Phase 2: Foundational tasks (blocking prerequisites for affected user stories or technical outcomes)
   - Phase 3+: One phase per user story or technical outcome (in priority or dependency order from spec.md)
   - Each phase includes: goal, independent verification criteria, required
     implementation and the proportionate evidence selected by the plan or
     demanded by the specification, constitution, validation matrix, or
     material regression risk. Semantic-equivalence and replacement reviews
     inherit this evidence decision rather than creating a separate test
     obligation
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing user story or technical outcome completion order
   - Parallel execution examples per user story or technical outcome
   - Implementation strategy section (first verifiable increment, incremental delivery)

## Completion Report

Output path to generated tasks.md and summary:
- Total task count
- Task count per user story or technical outcome
- Parallel opportunities identified
- Independent verification criteria for each user story or technical outcome
- Suggested first verifiable increment (typically the highest-priority user story or technical outcome)
- Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, labels, file paths)

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story when the feature has natural
user journeys, or by verifiable technical outcome when the work is technical,
architectural, migration, security, operational, refactoring, or enabling.

**Tests are OPTIONAL by default**: Zero new test files is a valid outcome when
the plan's selected validation is sufficient for the actual regression risk.
Do not generate a test merely because behavior is observable, changes, has
several consumers, maps to several artifact statements, or could theoretically
regress. Generate automated or non-automated evidence tasks when demanded by
the specification, constitution, the validation and reason recorded in the
plan, validation matrix, or material regression risk. Semantic-equivalence and
replacement reviews inherit that decision and do not independently require a
new permanent test. A user request for TDD also requires test tasks in the
relevant phases.
When new tests are justified, create only the smallest useful set and apply the
coverage consolidation rules below.

Evidence may be existing-suite execution, compilation, build, directed
inspection, focused review, a temporary/manual check, or a new automated test
at the responsible layer. The number of files, pages, fields, signals,
acceptance criteria, or consumers does not determine the number of tests.

### Coverage Consolidation

- One task MAY cover multiple related requirements, acceptance criteria,
  contracts, matrix rows, or equivalent consumers when they describe the same
  implementation behavior or can be proved by the same adequate evidence.
- Traceability is many-to-one when appropriate. Make the grouped task's scope
  and verification explicit; do not duplicate tasks merely to create one row
  per generated statement, file, page, surface, or consumer.
- For repetitive consumer work, prefer one or a few bounded migration tasks plus
  a directed search, inventory, compilation, build, existing test suite, or
  other aggregate completeness check.
- Separate tasks remain required when behavior, implementation responsibility,
  dependency order, risk, or evidence is materially different. Consolidation
  MUST NOT hide constitution-required evidence or unresolved decisions.

### Evidence Requirements

1. **Frontend-visible behavior**:
   - Do not assume that a visible or observable change requires a new DOM,
     Angular Material/CDK harness, or component test. Preserve the plan's
     selected existing-suite, compilation, build, directed inspection, focused
     review, temporary/manual, or automated evidence when it is sufficient for
     the actual risk.
   - When maintained automated coverage is justified for visible behavior, use
     DOM assertions, Angular Material/CDK harness checks where appropriate,
     routed navigation assertions, or focus/keyboard checks at the visible
     surface. Component state, service spies, implementation details, or
     class-only assertions do not substitute for visible-surface proof in that
     case.
   - Include i18n-visible text, responsive/mobile behavior, loading/empty/error/disabled states, destructive confirmations, and role-dependent visibility when in scope.

2. **Backend and contract behavior**:
   - Business rules need evidence at the service layer and, where externally observable, controller/API behavior.
   - API contracts need status, payload, serialization, validation response, and compatibility evidence at the contract boundary.
   - Authorization/security behavior needs evidence at the enforcing backend layer; add frontend visibility/navigation evidence only when the UI changes.
   - Persistence and migrations need Flyway/schema/data-integrity evidence proportional to risk.

3. **Validation and state matrices**:
   - Ensure every relevant matrix behavior is covered at the appropriate layer, but allow one adequate evidence task to cover several related rows. State the grouped coverage or aggregate check instead of generating one task per row.
   - Distinguish blocked action, API-call behavior, visible error/conflict, value transformation or preservation, and correction behavior when in scope.

4. **Scope and freshness**:
   - Add review or validation tasks for shared components, global styles, routing, contracts, migrations, authorization, and other cross-cutting surfaces changed by the plan.
   - Validation tasks are complete only when the evidence passes after the latest relevant change.
   - Do not add a new test task solely because an acceptance criterion or
     validation-plan row lacks its own test. Report or task a gap only when the
     selected aggregate evidence is inadequate for actual risk or a
     constitutional requirement.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Trace?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Trace] label**: REQUIRED for user story or technical outcome phase tasks
   - Format: [US1], [US2], [US3], etc. for user stories from spec.md
   - Format: [TO1], [TO2], [TO3], etc. for verifiable technical outcomes from spec.md
   - Setup phase: NO trace label
   - Foundational phase: NO trace label
   - User story or technical outcome phases: MUST have trace label
   - Polish phase: NO trace label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [TO1] Update workflow template in .specify/templates/tasks-template.md`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Trace label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

### Task Organization

1. **From User Stories or Verifiable Technical Outcomes (spec.md)** - PRIMARY ORGANIZATION:
   - Each user story or technical outcome (P1, P2, P3...) gets its own phase
   - Map all related components to that story or outcome:
     - Models needed for that story or outcome
     - Services needed for that story or outcome
     - Interfaces/UI needed for that story or outcome
     - Evidence tasks required for that story or outcome by the specification,
       constitution, the plan's selected validation and reason, validation
       matrix, or material regression risk. Semantic-equivalence and
       replacement reviews use that selected evidence rather than creating a
       separate test obligation. Do not manufacture a permanent-test task for
       each artifact row.
   - Multiple related requirements or components MAY map to the same task when
     the Coverage Consolidation rules are satisfied.
   - Mark dependencies between stories or outcomes; most product stories should be independent unless the artifacts document real dependencies

2. **From Contracts**:
   - Map each interface contract → to the user story or technical outcome it serves
   - If evidence is required: Each interface contract → contract validation task [P] before implementation in that story or outcome phase when the contract change or risk demands it

3. **From Data Model**:
   - Map each entity to the user story or technical outcome that needs it
   - If entity serves multiple stories or outcomes: Put in earliest phase or Setup phase
   - Relationships → service layer tasks in appropriate story or outcome phase

4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story- or outcome-specific setup → within that phase

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before affected user stories or technical outcomes)
- **Phase 3+**: User stories or technical outcomes in priority/dependency order (P1, P2, P3...)
  - Within each story or outcome: Required evidence tasks when applicable → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns

## Done When

- [ ] tasks.md generated with all phases, task IDs, and file paths
- [ ] Completion reported to user with task count, story/outcome breakdown, and first verifiable increment
