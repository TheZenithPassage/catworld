# Tasks: Split Handoff Alignment

**Input**: Design documents from `specs/022-split-handoff-alignment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Automated application tests are not required because this feature changes workflow instructions and local validation artifacts only. Required evidence is local text checks, a sample split rewrite, manual contract review, and diff review.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Phase 1: Technical Outcome 1 - Sidecar-Compatible Split Handoff Shape (Priority: P1)

**Goal**: Explicit issue splitting can produce coordinator and child issue bodies with the sections required by #233 and #223.

**Verification**: The local sample split rewrite and `speckit-taskstoissues` instructions include coordinator sections for goal, preserved scope, child issues, dependencies, execution model, validation, and out of scope, plus child issue sections for parent coordinator, scope, dependencies, validation, and out of scope.

### Implementation and Evidence for Technical Outcome 1

- [X] T001 [TO1] Add explicit issue-split handoff rules for coordinator and child issue body sections in `.agents/skills/speckit-taskstoissues/SKILL.md`
- [X] T002 [P] [TO1] Create local sample coordinator and child issue bodies in `specs/022-split-handoff-alignment/samples/sample-split-handoff.md`
- [X] T003 [TO1] Run the required-section text check from `specs/022-split-handoff-alignment/quickstart.md` against `.agents/skills/speckit-taskstoissues/SKILL.md` and `specs/022-split-handoff-alignment/samples/sample-split-handoff.md`

**Checkpoint**: Split handoff output shape is objectively verifiable without creating real GitHub issues.

---

## Phase 2: Technical Outcome 2 - Routing and Scope Preservation (Priority: P1)

**Goal**: Explicit split output preserves the #220-#222 routing contract, keeps children directly sequential, and does not add or remove product scope.

**Verification**: The changed skill and sample state opt-in splitting, no automatic parallel activation, no required or invented `parallel-ready` label, direct child sequential execution, closed-child coordinator finalization through the existing sequential workflow, no closed-scope reimplementation, and no product-scope changes.

### Implementation and Evidence for Technical Outcome 2

- [X] T004 [TO2] Add opt-in, routing, no-label, direct-child sequential, closed-child final-pass, and scope-preservation guidance in `.agents/skills/speckit-taskstoissues/SKILL.md`
- [X] T005 [TO2] Add routing, scope-preservation, and optional PR wording examples to `specs/022-split-handoff-alignment/samples/sample-split-handoff.md`
- [X] T006 [TO2] Manually review `.agents/skills/speckit-taskstoissues/SKILL.md` and `specs/022-split-handoff-alignment/samples/sample-split-handoff.md` against `specs/022-split-handoff-alignment/contracts/split-handoff-contract.md`, `specs/012-coordinator-child-templates/contracts/issue-template-contract.md`, and `specs/013-pr-description-templates/contracts/pr-template-contract.md`

**Checkpoint**: The split handoff is sidecar-compatible while normal implementation and planning remain unchanged.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, freshness, and scope-drift review required by the CatWorld issue workflow.

- [X] T007 Confirm `.agents/skills/catworld-implement-issue/SKILL.md` has no diff by running the command in `specs/022-split-handoff-alignment/quickstart.md`
- [X] T008 Rerun the full quickstart validation in `specs/022-split-handoff-alignment/quickstart.md` after the latest relevant edits
- [X] T009 Review changed paths against `specs/022-split-handoff-alignment/plan.md` source map and remove or justify any unplanned touched surfaces

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (TO1)**: Starts immediately after task generation.
- **Phase 2 (TO2)**: Depends on Phase 1 because routing language applies to the generated coordinator and child handoff shape.
- **Phase 3 (Polish)**: Depends on TO1 and TO2 completion.

### Technical Outcome Dependencies

- **TO1**: No implementation dependencies.
- **TO2**: Depends on TO1 handoff shape being present.

### Within Each Technical Outcome

- T001 and T002 can run in parallel because they touch different files.
- T003 depends on T001 and T002.
- T004 depends on T001 because both edit the same skill file.
- T005 depends on T002 because both edit the same sample file.
- T006 depends on T004 and T005.
- T007-T009 run after all implementation tasks and must be rerun if late edits affect their evidence.

### Parallel Opportunities

- T002 can run in parallel with T001.

---

## Parallel Example: Technical Outcome 1

```text
Task: "Add explicit issue-split handoff rules for coordinator and child issue body sections in .agents/skills/speckit-taskstoissues/SKILL.md"
Task: "Create local sample coordinator and child issue bodies in specs/022-split-handoff-alignment/samples/sample-split-handoff.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001 and T002.
2. Complete T003 and verify the handoff shape locally.
3. Stop and confirm no real GitHub issues were created.

### Incremental Delivery

1. Deliver TO1 handoff shape.
2. Add TO2 routing and scope-preservation constraints.
3. Complete final validation and scope-drift review.

### Notes

- Do not edit `.agents/skills/catworld-implement-issue/SKILL.md`.
- Do not create, update, close, label, assign, milestone, or publicly comment on real GitHub issues during local validation.
- Do not add backend, frontend, migration, issue template, or PR template changes unless a later approved issue changes the scope.
