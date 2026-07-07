# Tasks: Dual Workflow Routing Documentation

**Input**: Design documents from `specs/011-dual-workflow-routing/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Documentation-only feature. Required evidence is manual review against issues #220, #221, and #222, `git diff --check`, and final changed-file scope review.

**Organization**: Tasks are grouped by verifiable technical outcomes.

## Phase 1: Technical Outcome 1 - Routing Cases (Priority: P1)

**Goal**: Document the routing cases for normal issues, direct child issues, coordinator issues, and explicit `parallel` requests.

**Verification**: Manual review confirms the documentation lets a new Codex session choose the correct workflow for every routing case named in #220 and #222.

- [X] T001 [TO1] Add a Codex workflow routing section to docs/ARCHITECTURE.md covering normal issue, direct child issue, coordinator `parallel`, non-coordinator `parallel`, open-sub-issue coordinator end-to-end, and closed-sub-issue coordinator final-pass routing.
- [X] T002 [TO1] Review docs/ARCHITECTURE.md against issue #220 and issue #222 to confirm every required routing case is represented.

**Checkpoint**: Routing cases are documented and reviewable independently.

---

## Phase 2: Technical Outcome 2 - Sidecar Addition Boundary (Priority: P2)

**Goal**: Document the sidecar coordinator parallel workflow as an opt-in addition with its own future skills.

**Verification**: Manual review confirms the documentation does not describe the sidecar workflow as a replacement and does not require changes to `catworld-implement-issue`.

- [X] T003 [TO2] Update docs/ARCHITECTURE.md to state that sidecar coordinator parallel execution is opt-in only, future-owned by sidecar skills, and not a change to `.agents/skills/catworld-implement-issue/SKILL.md`.
- [X] T004 [TO2] Review docs/ARCHITECTURE.md against issue #221 to confirm the existing sequential workflow and guardrails remain preserved.

**Checkpoint**: Sidecar boundary is documented without changing implementation skills.

---

## Phase 3: Technical Outcome 3 - Coordinator Finalization Boundary (Priority: P3)

**Goal**: Document what closed-sub-issue coordinator finalization may and may not do.

**Verification**: Manual review confirms coordinator finalization is not a separate workflow and cannot reimplement closed child scope.

- [X] T005 [TO3] Update docs/ARCHITECTURE.md to state that closed-sub-issue coordinator finalization uses the existing sequential workflow, is not separate workflow, must not reimplement closed sub-issue scope, and may verify preserved scope, run validation, complete remaining coordinator-level work, deliver only if repository changes remain, or report no diff.
- [X] T006 [TO3] Review docs/ARCHITECTURE.md to confirm it does not describe any CatWorld product behavior, roles, persistence, authorization, APIs, frontend behavior, or operations as changed.

**Checkpoint**: Coordinator finalization boundaries are documented and product behavior remains unchanged.

---

## Final Phase: Validation & Scope Review

**Purpose**: Prove the documentation change is focused and fresh after final edits.

- [X] T007 Run `git diff --check` from the repository root.
- [X] T008 Run `git diff --name-only` from the repository root and confirm changed paths are limited to docs/ARCHITECTURE.md and issue #222 Spec Kit artifacts, aside from any temporary active-plan context that must be restored.
- [X] T009 Review the final diff to confirm AGENTS.md and .agents/skills/catworld-implement-issue/SKILL.md are not changed for the longer explanation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (TO1)**: No dependencies.
- **Phase 2 (TO2)**: Depends on Phase 1 because the sidecar boundary references the routing cases.
- **Phase 3 (TO3)**: Depends on Phase 1 because coordinator finalization is one routing case with extra constraints.
- **Final Phase**: Depends on all documentation edits.

### Parallel Opportunities

- No implementation tasks are marked [P] because all documentation edits target docs/ARCHITECTURE.md and should be sequential.
- Review tasks T002, T004, and T006 can be performed after their corresponding edits, but final scope checks T007 through T009 must run after all relevant edits.

## Implementation Strategy

### First Verifiable Increment

Complete T001 and T002, then stop to confirm the routing matrix is represented.

### Incremental Delivery

1. Document routing cases and validate against #220/#222.
2. Document sidecar addition boundary and validate against #221.
3. Document coordinator finalization boundary and confirm no product behavior changed.
4. Run final whitespace and scope review.

## Notes

- Each task uses exact file paths.
- Delivery operations are handled by the CatWorld issue workflow after implementation and validation, not by tasks.md.
