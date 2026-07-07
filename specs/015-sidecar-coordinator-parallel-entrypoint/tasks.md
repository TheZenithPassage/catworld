# Tasks: Sidecar Coordinator Parallel Entrypoint

**Input**: Design documents from `specs/015-sidecar-coordinator-parallel-entrypoint/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sidecar-coordinator-entrypoint.md, quickstart.md

**Tests**: No backend/frontend runtime tests are required because this feature changes repository workflow infrastructure and documentation only. Required evidence is local routing example review, text checks, changed-file scope review, manual review against issues #220-#226, and `git diff --check`.

**Organization**: Tasks are grouped by the three verifiable technical outcomes in `spec.md`.

## Phase 1: Technical Outcome 1 - Separate Sidecar Coordinator Entrypoint (Priority: P1)

**Goal**: Add a separate sidecar coordinator skill entrypoint that activates only for explicit coordinator `parallel` prompts and preserves existing sequential and coordinator/orchestration workflows.

**Verification**: `.agents/skills/catworld-parallel-coordinator/SKILL.md` exists, contains the trigger/routing contract, and local routing examples show coordinator `parallel` enters sidecar preflight while non-coordinator `parallel` stops.

- [X] T001 [TO1] Create `.agents/skills/catworld-parallel-coordinator/SKILL.md` with skill frontmatter, purpose, required context, and sidecar-only trigger boundary
- [X] T002 [TO1] Add routing outcomes for explicit coordinator `parallel` when routing guardrails allow sidecar use, #220-#234 sequential guardrails, non-coordinator `parallel` stop, direct child `parallel` stop, direct coordinator open-child stop, and closed-child sequential final pass in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T003 [TO1] Add prohibited side effects covering no child implementation, no branch/worktree operations, no PR creation, no GitHub issue mutation, no product code changes, and no changes to existing workflow internals in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T004 [TO1] Update `docs/ARCHITECTURE.md` to record that the sidecar coordinator entrypoint exists as preflight-only infrastructure while full sidecar adoption remains gated by later #220 child issues
- [X] T005 [TO1] Validate local routing examples from `specs/015-sidecar-coordinator-parallel-entrypoint/quickstart.md` against `.agents/skills/catworld-parallel-coordinator/SKILL.md` and `docs/ARCHITECTURE.md`

**Checkpoint**: TO1 is complete when the separate entrypoint exists, local routing examples match the contract, and existing workflow skill files remain untouched.

---

## Phase 2: Technical Outcome 2 - Preflight-Based Parallel Readiness (Priority: P1)

**Goal**: Define preflight readiness through coordinator issue inspection, child issue inspection, dependency classification, and source-of-truth review, with incomplete-context stop conditions and no required `parallel-ready` label.

**Verification**: The new skill states all required preflight inputs and stop conditions, and text review confirms any `parallel-ready` reference rejects label-based readiness.

- [X] T006 [TO2] Add read-only preflight steps for coordinator issue inspection, listed child issue inspection, dependency classification, and source-of-truth review in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T007 [TO2] Add stop conditions for missing coordinator context, missing child issue context, unresolved dependencies, source-of-truth conflicts, and unsafe hard-dependent child work in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T008 [TO2] Add the explicit rule that the entrypoint must not require, invent, add, or route based on a required `parallel-ready` label in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T009 [TO2] Run the quickstart readiness text checks for `explicit.*parallel`, `non-coordinator`, `child issue inspection`, `dependency classification`, `source-of-truth`, `stop before implementation`, and `parallel-ready` against `.agents/skills/catworld-parallel-coordinator/SKILL.md`

**Checkpoint**: TO2 is complete when readiness is visibly preflight-based and label independence is proven by text review.

---

## Phase 3: Technical Outcome 3 - Sidecar Artifact Path Awareness Without Generation (Priority: P2)

**Goal**: Acknowledge #225 sidecar artifact path rules in the entrypoint while keeping child artifact generation out of scope for #226.

**Verification**: The skill references the sidecar coordinator and child artifact path patterns as future preflight context and explicitly prohibits creating artifacts in this issue.

- [X] T010 [TO3] Add #225 sidecar artifact path awareness for `specs/<coordinator-number>-coordinator-<slug>/` and `specs/<child-issue-number>-<child-slug>/` in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T011 [TO3] Add the rule that #226 must not create coordinator artifacts, child artifacts, sidecar worktrees, or sidecar branches in `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- [X] T012 [TO3] Validate changed files with `git diff --name-only` to confirm no sidecar artifact directories, sidecar worktrees, sidecar branches, or product code paths were created

**Checkpoint**: TO3 is complete when artifact path rules are referenced only as preflight context and no artifact generation happened.

---

## Phase 4: Polish & Cross-Cutting Validation

**Purpose**: Confirm scope, formatting, and freshness after all workflow edits.

- [X] T013 Run `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` and confirm no output
- [X] T014 Run `git diff --check` and confirm no whitespace errors
- [X] T015 Review `git status --short` and `git diff --name-only` against `specs/015-sidecar-coordinator-parallel-entrypoint/plan.md` source map and document any justified workflow documentation changes
- [X] T016 Rerun affected quickstart checks after any late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `docs/ARCHITECTURE.md`, or `specs/015-sidecar-coordinator-parallel-entrypoint/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (TO1)**: Start first; it creates the new entrypoint and baseline routing contract.
- **Phase 2 (TO2)**: Depends on T001 because preflight rules live in the new skill; can proceed after the skill file exists.
- **Phase 3 (TO3)**: Depends on T001 and the #225 source-of-truth rules; can proceed after the skill file exists.
- **Phase 4 (Polish)**: Depends on all desired technical outcomes.

### Technical Outcome Dependencies

- **TO1**: No implementation dependency beyond approved issues and existing docs.
- **TO2**: Depends on the new skill file from TO1 but is otherwise independently reviewable.
- **TO3**: Depends on the new skill file from TO1 and the completed #225 artifact path contract.

### Parallel Opportunities

- After T001 creates the skill file, T006-T008 and T010-T011 touch the same file and should be coordinated sequentially to avoid conflicts.
- T004 in `docs/ARCHITECTURE.md` can be drafted while skill wording is being finalized, but must be reviewed after T002-T003 to keep the source-of-truth text aligned.
- T012 and T013 can run in parallel after implementation edits are complete because they inspect different scope concerns.

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001-T005.
2. Stop and validate that the new entrypoint exists separately and handles routing examples correctly.

### Incremental Delivery

1. Deliver TO1: sidecar entrypoint and routing boundary.
2. Deliver TO2: preflight readiness and no-label rule.
3. Deliver TO3: artifact path awareness without generation.
4. Run Phase 4 validation and refresh any stale checks.

### Notes

- Do not add tasks for branch cleanup, branch deletion, remote pruning, force-push, merge, auto-merge, issue mutation, or public comments.
- Delivery operations are handled by the CatWorld issue workflow after scoped implementation and validation complete.
