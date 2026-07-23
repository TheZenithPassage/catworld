---
name: "speckit-converge"
description: "Assess the current codebase against the feature's spec, plan, and tasks, then append any remaining unbuilt work as new tasks to tasks.md so implement can complete it."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/converge.md"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Close the gap between what a feature's specification, plan, and tasks call for and what the
codebase currently implements. Read `spec.md`, `plan.md`, and `tasks.md` as the **sole
source of intent** (with the constitution as governing constraints), assess the current
state of the code, determine which requirements, acceptance criteria, plan decisions, and
existing tasks are unmet, incomplete, only partially satisfied, missing required
verification, or affected by unplanned touched surfaces, and **append each piece
of remaining work as a new, traceable task** at the bottom of `tasks.md` so that
`/speckit-implement` can complete it. This command MUST run only after
`/speckit-implement` has run on the current `tasks.md`, and after `/speckit-tasks` has produced a complete `tasks.md`.

This is **not** a full diff review and MUST NOT inspect other branches, pull requests, or
history. It assesses the present state of the code relative to the feature's artifacts.
It MAY use current working-tree changed-path metadata (`git status --short` and
current-branch `git diff --name-only`) only to flag files or surfaces touched outside the
plan/source map for review or justification.

## Operating Constraints

**APPEND-ONLY, NEVER REWRITE**: The command's **only** write is appending a new
`## Phase N: Convergence` section to `tasks.md`. It MUST NOT:

- modify `spec.md` or `plan.md` in any way;
- rewrite, renumber, reorder, or delete any existing task (including tasks from a prior
  Convergence phase);
- modify, create, or delete any application code — completing the appended tasks is the
  job of `/speckit-implement`.

When the codebase already satisfies everything, the command MUST leave `tasks.md`
**byte-for-byte unchanged** (no empty Convergence header) and report a clean result.

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is
**non-negotiable**. Code that violates a MUST principle is the highest-severity finding and
produces a corresponding remediation task. If the constitution is an unfilled template,
skip constitution checks gracefully rather than failing.

## Execution Steps

### 1. Initialize Convergence Context

Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` once from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS. Derive absolute paths:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md
- CONSTITUTION = `.specify/memory/constitution.md` (if present)
If `spec.md`, `plan.md`, or `tasks.md` is missing, STOP with a clear, actionable message naming the
prerequisite command to run (`/speckit-specify` for a missing spec, `/speckit-plan` for a missing plan,
`/speckit-tasks` for missing tasks). Do not produce partial output.
For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Load Artifacts (Progressive Disclosure)

Load only the minimal necessary context from each artifact:

**From spec.md:**

- Functional Requirements (FR-###)
- Technical Requirements (TR-###)
- Success Criteria (SC-###) — include only items requiring buildable work; exclude
  post-launch outcome metrics and business KPIs
- User Stories and their Acceptance Scenarios
- Verifiable Technical Outcomes (TO-###), their Acceptance Scenarios, and Validation Evidence
- Edge Cases (if present)

**From plan.md:**

- Architecture/stack choices and technical decisions
- Data Model references
- Phases and named touch-points (files/components the plan says will be created or edited)
- Technical constraints
- Semantic-equivalence review and validation evidence plan (if present)

**From tasks.md:**

- Task IDs (to compute the next ID and next phase number)
- Descriptions, phase grouping, and referenced file paths

**From constitution (if not an unfilled template):**

- Principle names and MUST/SHOULD normative statements

### 3. Build the Intent Inventory

Create an internal model (do not echo raw artifacts):

- **Requirements inventory**: one stable key per FR-### / TR-### / SC-### /
  user-story acceptance scenario (e.g. `US1/AC2`) / technical-outcome acceptance
  scenario (e.g. `TO1/AC2`), plus the plan decisions and constitution principles
  that impose buildable obligations.
- **Technical outcome inventory**: TO-### items with their acceptance scenarios
  and validation evidence, treated as first-class intent for technical/enabling
  features.
- **Evidence inventory**: observable behavior details, validation matrix rows,
  semantic-equivalence proof requirements, and validation evidence plan entries that
  impose verification obligations at a responsible layer. Preserve the plan's
  selected validation and maintenance reason, and group equivalent consumers
  when the same evidence covers them.
- **Code-scope map**: from the file paths named in `plan.md` and `tasks.md`, plus a keyword
  search for the concepts each requirement describes, derive the set of source files and
  components in scope for assessment. Bound the assessment to these — do **not** infer
  scope beyond what the artifacts define.
- **Touched-surface map**: if git metadata is available, collect current working-tree
  changed paths from `git status --short` and current-branch diff path listings. Compare
  them with the code-scope map and plan/source map. Do not inspect other branches,
  pull requests, or discarded implementations.

### 4. Assess the Codebase and Classify Findings

For each item in the intent inventory, inspect the current code in scope and produce a
`Finding` only where there is a gap. Classify every finding by **gap type**:

- **`missing`**: the required work is absent from the code entirely.
- **`partial`**: the work exists but does not yet fully satisfy the requirement /
  acceptance criterion / plan decision, or the required observable/layer-appropriate
  verification evidence is absent or incomplete.
- **`contradicts`**: the code does something that conflicts with stated intent or a
  constitution MUST principle.
- **`unrequested`**: the code contains work not called for by the spec, plan, or tasks
  (including changed files or surfaces outside the plan/source map). This is surfaced for
  awareness — converge does **not** delete code, it only appends a task to review/justify
  or remove it.

For evidence-specific assessment:

- Do not append a test task merely because changed behavior is visible,
  observable, affects several consumers, maps to several artifact statements,
  or could theoretically regress. Existing-suite execution, compilation,
  build, directed inspection, focused review, or temporary/manual evidence is
  sufficient when the plan records why it is proportionate to actual
  regression risk and that evidence passed after the latest relevant change.
- When maintained automated coverage is justified for frontend-visible
  behavior, require visible-surface evidence such as DOM assertions, Angular
  Material/CDK harness checks where appropriate, routed navigation assertions,
  or focus/keyboard checks. Component state, service spies, mocks, or
  implementation internals do not substitute for visible-surface proof in that
  case.
- Backend business rules, API contracts, authorization/security behavior, persistence,
  Flyway migrations, mobile/device-specific behavior, i18n-visible behavior, shared
  components, global styling, and operational safety are only satisfied when evidence
  exists at the responsible layer recorded in the plan or implied by the constitution.
- Technical Requirements and Verifiable Technical Outcomes are only satisfied when the
  implementation and evidence satisfy their stated outcome, acceptance scenarios, and
  validation evidence. Missing or partial TR/TO implementation or evidence produces
  a convergence finding.
- Absence of a new permanent automated test is not a convergence finding when
  the selected fresh evidence is sufficient. Append evidence tasks only when
  required by the constitution, explicitly required by the issue or plan, or
  justified by material regression risk. Apply the existing many-to-one
  consolidation rules to equivalent consumers.
- Validation and smoke evidence is partial when it is stale after later relevant changes,
  timed out, skipped, interrupted, or reported without the command/review/smoke result.

Each `Finding` records: a stable id, the `source-ref` it traces to, the `gap-type`, a
severity, and a short human-readable description with the evidence (the file/area observed).

**Edge cases:**

- **Little or no code yet**: treat the entire specified scope as `missing` remaining work
  rather than failing.
- **Nothing remains**: produce zero findings and follow the converged branch in Step 7.

### 5. Assign Severity

- **CRITICAL**: violates a constitution MUST principle, or a `missing`/`contradicts` gap
  that blocks baseline functionality of a P1 user story or P1 technical outcome.
- **HIGH**: a `missing` or `partial` gap on a core functional requirement or acceptance
  criterion, Technical Requirement, or Verifiable Technical Outcome.
- **MEDIUM**: a `partial` gap on a secondary requirement, or an `unrequested` addition with
  unclear justification.
- **LOW**: minor partial gaps, polish, or low-risk `unrequested` additions.

### 6. Present the In-Session Findings Summary

Before appending anything, output a compact, severity-graded summary (no file writes yet):

## Convergence Findings

| ID | Gap Type | Severity | Source | Evidence | Remaining Work |
|----|----------|----------|--------|----------|----------------|
| F1 | missing  | HIGH     | FR-008 | Example: no append-only guard detected in path/to/module.py when writing tasks.md | Add append-only enforcement |

**Summary metrics:**

- Requirements / acceptance criteria checked
- Technical Requirements and Verifiable Technical Outcomes checked
- Plan decisions checked
- Constitution principles checked (or "skipped — template")
- Findings by gap type (missing / partial / contradicts / unrequested)
- Findings by severity
- Unplanned touched surfaces checked (if git metadata was available)

### 7. Append Convergence Tasks (or report converged)

**If there are one or more actionable findings** (`tasks_appended` outcome):

Append to the **end** of `tasks.md`, per the append contract:

1. Scan all existing task IDs; let `M` be the maximum. Determine the next phase number `N`
   (highest existing phase + 1).
2. Write a single new section header `## Phase N: Convergence`.
3. Emit one checklist item per actionable finding, ordered CRITICAL/HIGH first, assigning
   zero-padded IDs `T{M+1:03d}, T{M+2:03d}, …`:

   ```markdown
   - [ ] T042 <imperative description> per <source-ref> (<gap-type>)
   ```

   `<source-ref>` traces the task to its origin: e.g. `FR-003`, `SC-002`,
   `US1/AC2`, `plan: storage decision`, `Constitution II`.

   `<gap-type>` is one of `missing`, `partial`, `contradicts`, `unrequested`.

   Constitution-violation tasks MUST be emitted first and described as
   `CRITICAL`.
4. Never reuse or renumber existing IDs. If a prior Convergence phase exists, add a new,
   separately-numbered one below it — do not touch the old one.

**If there are no actionable findings** (`converged` outcome):

- Do **not** modify `tasks.md` at all — no empty phase header.
- Report: **"✅ Converged — the implementation satisfies the spec, plan, and tasks."**
- Include the summary counts of what was checked.

### 8. Provide Next Actions (Handoff)

- On `tasks_appended`: state how many tasks were appended under which phase, and recommend
  running `/speckit-implement` to complete them; note that a follow-up converge
  run will find fewer or no remaining items.
- On `converged`: recommend proceeding to review / opening a PR. No further implement pass
  is needed for this feature's specified scope.
