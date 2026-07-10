# Tasks: Final Coordinator Validation and PR Delivery

**Input**: Design documents from `specs/032-final-coordinator-delivery/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Required by issue #258 and the validation evidence plan. Evidence uses a focused PowerShell harness, temporary Git ancestry/two-head/freshness/diff fixtures, a current-delivery finalization artifact verifier, actual PR template rendering, state matrices, source reviews, source-map review, and `git diff --check`.

**Organization**: Tasks are grouped by the three dependency-driven verifiable technical outcomes.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel because it uses a different file and has no incomplete dependency
- **[Trace]**: Technical outcome served by the task (`TO1`, `TO2`, or `TO3`)
- Every task names its exact repository path

## Phase 1: Setup

**Purpose**: Add the shared #258 validation harness used by all outcome checks.

- [X] T001 Create `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1` with assertion helpers, GUID temporary Git fixture cleanup, coordinator/child state models, validation evidence models, PR/artifact models, actual template loaders, JSON evidence output, and a `ValidateSet` scenario dispatcher; create the parameter/schema skeleton for `specs/032-final-coordinator-delivery/validation/verify-finalization-evidence.ps1`

---

## Phase 2: Foundational

**Purpose**: Establish the shared lifecycle and source-of-truth framing before outcome-specific procedures.

- [X] T002 Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` metadata, issue history, lifecycle states 16–17, operation ownership, required current evidence, and transition boundaries for issue #258 while preserving the #261 dormant-routing gate
- [X] T003 [P] Update `docs/ARCHITECTURE.md` sidecar issue history, executable lifecycle states 16–17, operation ownership, and finalization boundary for issue #258 without changing product or sequential workflow behavior
- [X] T004 Add shared prepared-child ledger, historical/current validation record, integrated source-map review, two-head `H`/`H2` finalization state, final delivery state, cleanup-ineligibility state, and canonical status helpers to `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`; complete `specs/032-final-coordinator-delivery/validation/verify-finalization-evidence.ps1` with `-RepositoryPath`, fixed artifact path enforcement, clean-state check, full-SHA/schema validation, exactly-one-parent proof, B-ancestor-of-H plus `merge-base B H = B = declared merge_base_sha` proof, exact added-only delta, artifact absent-at-H/present-at-H2 proof, explicit-range diff check, SELF/no-literal-self rule, exact canonical H/H2 check ID sets, unique IDs/nonempty commands, H all-passed checks, status-free H2 rerun manifest, applicability coverage, fixed render-input requirements, risks/runtime cleanup assertions, exact target/issue wording, and structured JSON/nonzero outcomes

**Checkpoint**: Shared sources identify #258 finalization behavior and the harness can model every required state without live GitHub mutation.

---

## Phase 3: Technical Outcome 1 - Complete Integration Evidence (Priority: P1)

**Goal**: Finalization begins only after current evidence proves every prepared child is integrated in refreshed coordinator ancestry and no child remains non-terminal.

**Verification**: Run `all-integrated`, `incomplete-children`, and `evidence-mismatch`; verify only the complete, unique, ancestry-proven ledger enters integrated validation.

### Evidence for Technical Outcome 1

- [X] T005 [TO1] Implement the `all-integrated` temporary bare-remote/coordinator scenario with at least two child commits and refreshed coordinator ancestry assertions in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T006 [TO1] Implement the table-driven `incomplete-children` scenario for unmerged, merged-metadata-without-refreshed-ancestry, wrong-PR-target, active, blocked, pending, dependency-incomplete, missing, duplicate, and unexpected child states in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T007 [TO1] Implement the `evidence-mismatch` scenario proving current GitHub/repository evidence conflicts stop finalization without using private conversation context in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`

### Implementation for Technical Outcome 1

- [X] T008 [TO1] Add an executable finalization evidence re-read procedure to `.agents/skills/catworld-parallel-coordinator/SKILL.md` covering coordinator issue/branch, prepared children/dependencies, child PR target/merge state, refreshed coordinator ancestry, artifacts, validation, blockers, existing final PR, and cleanup evidence
- [X] T009 [TO1] Add the complete unique child-ledger terminal gate to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, explicitly distinguishing sidecar workflow integration from child GitHub issue open/closed state and stopping before validation/PR mutation on incomplete or conflicting evidence
- [X] T010 [TO1] Update `docs/ARCHITECTURE.md` with current-evidence finalization, ancestry-based integration, unique child accounting, open-child issue semantics, no-new-layer transition, and mismatch stop behavior
- [X] T011 [TO1] Reconcile `specs/032-final-coordinator-delivery/contracts/final-coordinator-delivery.md` with the implemented finalization evidence and child terminal-state fields without broadening issue #258
- [X] T012 [TO1] Run the `all-integrated`, `incomplete-children`, and `evidence-mismatch` scenarios in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1` and verify validation/PR delivery is attempted only for complete ancestry-proven state

**Checkpoint**: TO1 is objectively verified; incomplete, conflicting, or metadata-only child evidence cannot enter final validation.

---

## Phase 4: Technical Outcome 2 - Fresh Integrated Validation (Priority: P2)

**Goal**: Current coordinator readiness is supported only by exact, fresh, all-passed integrated validation with every required status recorded truthfully.

**Verification**: Run `integrated-validation`, `validation-readiness`, and `validation-staleness`; verify every required command has one current-HEAD record and every non-passing class blocks all final PR creation/update.

### Evidence for Technical Outcome 2

- [X] T013 [TO2] Implement the `integrated-validation` scenario with preserved historical attempts, exactly one current readiness result per requirement/evaluated state, consumed-child-evidence applicability, and mandatory integrated rerun assertions in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T014 [TO2] Implement the table-driven `validation-readiness` scenario covering `failed`, `skipped`, `timed out`, `interrupted`, `partial`, `stale`, `blocked`, and `not run`, including unavailable/dishonest-to-run reason mapping and no final PR attempt, in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T015 [TO2] Implement `validation-staleness` and `two-head-finalization` temporary Git scenarios that invoke the real `specs/032-final-coordinator-delivery/validation/verify-finalization-evidence.ps1`, prove the valid artifact-only sequence and external H2-status gate, and reject merge/multiple/wrong parent, extra delta path, H3, missing/wrong SELF marker, literal self SHA, failed external H2 rerun, missing applicability, dirty state, wrong target/wording, and rejected/mismatched normal remote H2 push in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`

### Implementation for Technical Outcome 2

- [X] T016 [TO2] Add the integrated coordinator validation procedure to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, including required-command discovery, preserved historical attempts, one current readiness result per requirement/evaluated state, `H`/`H2` freshness evidence, child-evidence consumption limits, and canonical status/reason mapping
- [X] T017 [TO2] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` readiness and resume rules so any failed, skipped, timed-out, interrupted, partial, stale, blocked, or not-run requirement opens no final PR and relevant later changes require affected revalidation
- [X] T018 [TO2] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` with the approved two-head sequence: complete checks at `H`; direct child `H2` containing only the factual finalization artifact; `B`/`H`/`SELF/HEAD` fields; direct-parent and sole-path proof; split `H` versus `H2` validation reporting and applicability rationale; cleanup `ineligible` with reason `pending final PR merge`; and no H3 URL write
- [X] T019 [TO2] Update `docs/ARCHITECTURE.md` with historical/current integrated command accounting, canonical statuses, the approved `H`/`H2` sequence, consumed-child and consumed-`H` evidence limits, artifact-affected reruns, ready-only/no-draft final behavior, cleanup ineligibility, and no H3 URL write
- [X] T020 [TO2] Reconcile `specs/032-final-coordinator-delivery/contracts/final-coordinator-delivery.md` and `specs/032-final-coordinator-delivery/data-model.md` with implemented validation and artifact state names while preserving the approved status vocabulary
- [X] T021 [TO2] Run the `integrated-validation`, `validation-readiness`, `validation-staleness`, and `two-head-finalization` scenarios in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1` and verify only current all-passed integrated evidence plus successful artifact-only H2 checks supports readiness

**Checkpoint**: TO2 is objectively verified; no non-passing, missing, stale, duplicated, or unbound validation evidence can support final delivery.

---

## Phase 5: Technical Outcome 3 - Traceable Ready Final PR (Priority: P3)

**Goal**: After clean integrated scope review, create or safely reuse one ready final coordinator PR to `main`, using the final template and factual artifact/report state without merging or cleanup.

**Verification**: Run `scope-drift`, `final-pr-delivery`, `existing-final-pr`, `artifact-final-state`, `closing-keyword-isolation`, and `prohibited-operations`; verify the final boundary alone targets `main` and uses closing keywords.

### Evidence for Technical Outcome 3

- [X] T022 [TO3] Implement the runtime `scope-drift` temporary Git scenario that fetches `origin/main` without updating local `main`, records and rechecks target-base SHA and merge base, compares the PR-equivalent coordinator diff with combined coordinator/child source maps, and blocks an injected unrelated path or relevant base movement in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T023 [TO3] Implement `final-pr-delivery` by rendering `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md` and asserting ready state, coordinator source, verified remote source ref at H2, `main` target, integrated-child traceability, explicit H/H2 fresh passed validation, scope review, remaining risks, and closing references in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T024 [TO3] Implement `existing-final-pr` and `artifact-final-state` scenarios proving same-run PR reuse/no duplication, stale/inconsistent PR stop without silent readiness mutation, allowed-update revalidation, machine-readable two-head artifact identity with exact canonical manifests, pending H2 readiness/template-blob/render-input requirements/risks/runtime-cleanup assertions, external resolved H2/final-scope/readiness/resolved-render/body-fingerprint/remote-ref evidence, observed GitHub URL/final report state, cleanup ineligibility, and no H3 in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`
- [X] T025 [TO3] Implement `closing-keyword-isolation` and `prohibited-operations` scenarios against the actual final/child templates and coordinator sources in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`

### Implementation for Technical Outcome 3

- [X] T026 [TO3] Add fetched-`origin/main` target-base SHA and merge-base recording/recheck, PR-equivalent diff inspection, and coordinator/child source-map reconciliation to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, without updating local `main`, with base movement or unexplained scope drift blocking final delivery and affected revalidation after correction
- [X] T027 [TO3] Replace generic final PR guidance in `.agents/skills/catworld-parallel-coordinator/SKILL.md` with executable normal non-force H2 push/remote-source verification, existing-PR re-read, stale/inconsistent existing-PR stop, unique same-run identity, final-template rendering after resolved H2 evidence, ready-only create/allowed-update, coordinator-source/`main`-target, child traceability, closing isolation, final reporting, and cleanup-ineligible procedures
- [X] T028 [TO3] Update `.agents/skills/catworld-parallel-coordinator/SKILL.md` prohibited side effects, preflight/final output, resume updates, and validation expectations to allow only the approved final PR operation while prohibiting merge, approval, auto-merge, issue mutation, new child layers, cleanup, deletion, rebase, force-push, and history rewriting
- [X] T029 [P] [TO3] Update `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md` with explicit `H` complete-check and `H2` artifact-affected-check entries, target-base/head freshness, integrated scope review, remaining risks, ready-only prerequisites, coordinator-source/`main` target, child traceability, closing semantics, and cleanup-ineligible notes
- [X] T030 [P] [TO3] Update `.github/PULL_REQUEST_TEMPLATE/README.md` to require ready-only final PR creation, no draft fallback, stale existing-PR stop, current evidence and same-run duplicate checks, approved two-head validation, target-base/head rechecks, scope review, final report URL/readiness without H3, and cleanup ineligibility
- [X] T031 [TO3] Update `docs/ARCHITECTURE.md` with executable final scope review, target-base/head rechecks, same-run PR identity and stale-stop behavior, actual final template contract, ready-only creation, final report URL/readiness without H3, closing isolation, and cleanup-ineligible behavior
- [X] T032 [TO3] Reconcile `specs/032-final-coordinator-delivery/contracts/final-coordinator-delivery.md` and `specs/032-final-coordinator-delivery/quickstart.md` with the implemented final PR fields and scenario names without adding live GitHub mutation to validation
- [X] T033 [TO3] Run `scope-drift`, `final-pr-delivery`, `existing-final-pr`, `artifact-final-state`, `closing-keyword-isolation`, and `prohibited-operations` in `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1` and verify only a clean all-passed run can reach one ready final PR

**Checkpoint**: TO3 is objectively verified; the final coordinator boundary is traceable, unique, ready-only, coordinator-to-`main`, and user-merged.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Run fresh end-to-end evidence, scope review, and workflow-state cleanup required before delivery.

- [X] T034 Run every scenario exposed by `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1` and record each explicit pass/fail result after the latest relevant source and template changes
- [X] T035 [P] Run source review against `.agents/skills/catworld-parallel-coordinator/SKILL.md` for all-child integration, historical/current validation, `H`/`H2` direct ancestry and sole-artifact delta, artifact-affected reruns, target-base/merge-base/head rechecks, canonical statuses, scope drift, final template, runtime `main` target, closing isolation, final PR URL reporting without H3, cleanup ineligibility, and prohibited operations
- [X] T036 [P] Run source review against `docs/ARCHITECTURE.md`, `.github/PULL_REQUEST_TEMPLATE/README.md`, and `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md` for the same two-head executable finalization contract, runtime coordinator-to-`main` behavior, and temporary #258 build-out-to-`workflow/sidecar-buildout` distinction
- [X] T037 [P] Run `git diff --name-only <B>...HEAD -- .agents/skills/catworld-implement-issue/SKILL.md .agents/skills/catworld-parallel-child-implementation/SKILL.md .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` and confirm all out-of-scope workflow skills are unchanged
- [X] T038 Review `git diff --name-only` and `git status --short` against the source map in `specs/032-final-coordinator-delivery/plan.md`; justify or remove every unplanned path and confirm no application, routing activation, cleanup implementation, real sidecar resource, or GitHub issue mutation occurred
- [X] T039 Restore the temporary managed Spec Kit pointer in `AGENTS.md` to the `origin/workflow/sidecar-buildout` version without changing permanent repository instructions
- [X] T040 Run `git diff --check` after the final relevant edits and use explicit committed ranges `B...H`, `H..H2`, and `B...H2` during the delivery gates rather than relying on a clean-worktree-only check
- [X] T041 Rerun every scenario or source review affected by late changes to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `docs/ARCHITECTURE.md`, `.github/PULL_REQUEST_TEMPLATE/README.md`, `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`, or `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1`, or report it explicitly as stale/not revalidated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on the shared harness skeleton.
- **TO1 (Phase 3)**: Depends on foundational lifecycle/source framing.
- **TO2 (Phase 4)**: Depends on TO1 proving a complete integrated child set.
- **TO3 (Phase 5)**: Depends on TO1 and TO2; scope review and delivery occur only after complete integration and fresh all-passed validation.
- **Polish (Phase 6)**: Depends on all three outcomes.

### Technical Outcome Dependencies

- **TO1 (P1)**: Establishes current-evidence, complete-ledger, and ancestry gates.
- **TO2 (P2)**: Uses TO1's terminal integrated state to run and assess integrated validation.
- **TO3 (P3)**: Uses TO1 integration and TO2 readiness to review scope and perform final delivery.

### Within Each Technical Outcome

- Add the scenario expectations before or alongside the source procedure they prove.
- Keep edits to the shared coordinator skill and shared validation script sequential.
- Run each outcome's focused scenarios before treating that outcome complete.
- Rerun affected evidence after later source, template, contract, or fixture changes.

### Parallel Opportunities

- T003 may update architecture framing in parallel with T002's coordinator-skill framing.
- T029 and T030 may update separate final-template files in parallel after TO2 is complete.
- T035, T036, and T037 are independent final source reviews after implementation.
- Outcome implementation remains sequential because TO2 depends on TO1 and TO3 depends on both.

---

## Parallel Example: Final PR Contract Files

```powershell
Task: "Update final sidecar coordinator template in .github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md"
Task: "Update template selection/readiness guidance in .github/PULL_REQUEST_TEMPLATE/README.md"
```

## Parallel Example: Final Reviews

```powershell
Task: "Review .agents/skills/catworld-parallel-coordinator/SKILL.md finalization source"
Task: "Review docs/ARCHITECTURE.md and final PR template sources"
Task: "Verify out-of-scope workflow skill diffs are empty"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Create the validation harness and foundational lifecycle framing.
2. Implement TO1 complete integration evidence.
3. Stop and run `all-integrated`, `incomplete-children`, and `evidence-mismatch`.

### Incremental Delivery

1. Add TO1 integration evidence and validate.
2. Add TO2 integrated validation/freshness gates and validate.
3. Add TO3 scope review and final PR delivery and validate.
4. Run all scenarios, source reviews, source-map review, pointer restoration, and whitespace checks.

### Parallel Team Strategy

The coordinator skill and validation harness are shared sequential surfaces.
Parallel work is limited to independent documentation/template files and final
read-only reviews; outcome integration remains dependency-ordered.

---

## Notes

- Do not modify `.agents/skills/catworld-implement-issue/SKILL.md`.
- Do not modify `.agents/skills/catworld-parallel-child-implementation/SKILL.md`.
- Do not modify `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- Do not activate #261 routing or implement #259 cleanup.
- Do not add application backend, frontend, persistence, migration, authorization, security, deployment, or UI behavior changes.
- Do not create real sidecar coordinator PRs, merge PRs, mutate GitHub issues, post public comments, force-push, delete branches/worktrees, or perform cleanup as implementation validation.
- The implementation delivery PR for #258 must use `Related to #258` and target `workflow/sidecar-buildout`; only the simulated future final sidecar PR targets `main` and uses closing keywords.

## Delivery Sequence Outside Ordinary Implementation Tasks

Commit, push, and PR delivery remain responsibilities of the active CatWorld
issue workflow rather than checklist tasks. For this #258 delivery, that
workflow must:

1. Fetch and record `B = origin/workflow/sidecar-buildout`; use it as the
   implementation freshness and merge-base reference, never `origin/main`.
2. If `B` advanced, integrate it only by an allowed normal
   non-history-rewriting update, stop on non-mechanical conflict, and rerun
   affected validation.
3. Commit all completed implementation work as `H` and run the complete
   required implementation suite at exactly `H`.
4. Create direct child `H2` containing only
   `specs/032-final-coordinator-delivery/finalization.md`, with literal `B`,
   literal `H`, `H2` as `SELF/HEAD`, direct-parent and sole-path evidence,
   checks run at `H`, commands required to rerun at `H2`, pending H2 readiness,
   template blob/render-input requirements, and applicability rationale. Actual H2 results
   remain external.
5. Run `specs/032-final-coordinator-delivery/validation/verify-finalization-evidence.ps1`
   and every artifact-affected check at `H2`, including explicit-range
   `git diff --check H..H2` and `git diff --check B...H2`.
6. Push H2 normally to the remote #258 work branch, fetch it, and verify the
   remote source ref equals H2; rejection or mismatch blocks without force.
7. Re-fetch and recheck `B`, merge base, ancestry, local/remote `HEAD = H2`,
   validation freshness, and existing #258 PR evidence. Stop on movement or
   inconsistency.
8. Open the PR to `workflow/sidecar-buildout` with `Related to #258`. Report the
   returned URL without another commit. Do not create H3/H4.
