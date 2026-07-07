# Tasks: Coordinator and Child Issue Templates

**Input**: Design documents from `specs/012-coordinator-child-templates/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/issue-template-contract.md, quickstart.md

**Tests**: Automated application tests are not required because this feature changes repository issue templates only. Required evidence is local sample body generation plus manual review against #220, #221, and #222.

**Organization**: Tasks are grouped by the single verifiable technical outcome TO-001.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which technical outcome this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Create the GitHub issue template directory required by the source map.

- [X] T001 Create the GitHub issue template directory at `.github/ISSUE_TEMPLATE/`

---

## Phase 2: Technical Outcome 1 - Coordinator and Child Issue Templates (Priority: P1)

**Goal**: Provide concise coordinator and child issue templates that preserve the #220-#222 routing contract and do not change the normal sequential workflow.

**Verification**: Local sample bodies can be generated from both templates and manually checked against the required sections and routing guardrails.

### Implementation for Technical Outcome 1

- [X] T002 [P] [TO1] Add the coordinator template in `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md`
- [X] T003 [P] [TO1] Add the focused child issue template in `.github/ISSUE_TEMPLATE/focused-child-issue.md`

### Evidence for Technical Outcome 1

- [X] T004 [TO1] Generate local sample bodies from `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md` and `.github/ISSUE_TEMPLATE/focused-child-issue.md` using the quickstart PowerShell command in `specs/012-coordinator-child-templates/quickstart.md`
- [X] T005 [TO1] Manually review `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md` and `.github/ISSUE_TEMPLATE/focused-child-issue.md` against issue #220, issue #221, and issue #222 routing requirements

**Checkpoint**: Both templates exist, generate usable bodies, and preserve the routing contract without activating parallel mode.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Confirm scope, freshness, and source-map alignment before delivery.

- [X] T006 Review changed files under `.github/ISSUE_TEMPLATE/` and `specs/012-coordinator-child-templates/` against `specs/012-coordinator-child-templates/plan.md`, then rerun or mark stale any affected validation after late edits

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Technical Outcome 1 (Phase 2)**: Depends on T001.
- **Polish (Phase 3)**: Depends on T002-T005.

### Technical Outcome Dependencies

- **TO-001**: No dependencies beyond T001.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001 because they modify different template files.

---

## Parallel Example: Technical Outcome 1

```text
Task: "Add the coordinator template in .github/ISSUE_TEMPLATE/coordinator-parallel-planning.md"
Task: "Add the focused child issue template in .github/ISSUE_TEMPLATE/focused-child-issue.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001.
2. Complete T002 and T003.
3. Complete T004 and T005.
4. Stop and validate the generated sample bodies.

### Incremental Delivery

1. Add the coordinator template and verify its body.
2. Add the child template and verify its body.
3. Run final scope and freshness review.

---

## Notes

- Do not add sidecar skill implementation, implementation-skill changes, PR description templates, or product issue changes.
- Do not add committing, pushing, or opening/updating pull requests as ordinary implementation tasks. Delivery operations are handled by the active CatWorld workflow after scoped tasks and required validation complete.
