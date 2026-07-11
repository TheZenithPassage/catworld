# Tasks: Live Sidecar Dry Run

**Input**: Design documents from `/specs/034-live-sidecar-dry-run/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/controlled-sidecar-dry-run.md

**Evidence**: The real staged GitHub run is the primary end-to-end evidence. Existing focused #250–#259 scripts remain regression evidence; direct Git/ref/artifact/template checks prove the live fixture.

**Organization**: Tasks are grouped by the five verifiable technical outcomes and preserve the four mandatory user-owned merge pauses.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel only when it touches disjoint files/state and all dependency gates are satisfied.
- **[Trace]**: Maps the task to TO1–TO5 in `spec.md`.
- Runtime paths containing created issue numbers are first recorded in `specs/034-live-sidecar-dry-run/dry-run-report.md`; later tasks use those exact recorded paths rather than inventing alternatives.

## Phase 1: Setup

**Purpose**: Establish the durable #260 control record before fixture mutation.

- [X] T001 Capture the original local-main SHA, fetched `origin/main` SHA, fetched `origin/workflow/sidecar-buildout` SHA, current #260 branch/head, clean status, Git common directory, and worktree inventory—including whether `main` has an attached worktree—in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T002 Record current issue #260/#261 evidence, #250–#259 issue and merged build-out PR states, absence of colliding fixture issues/PRs/branches, and the control/runtime context split in `specs/034-live-sidecar-dry-run/dry-run-report.md`

---

## Phase 2: Foundational Fixture Identity and Preflight

**Purpose**: Create the exact identity and deterministic resource plan that every routed operation must consume.

**⚠️ CRITICAL**: Do not write runtime sidecar artifacts or create runtime Git resources until all target issue/artifact/branch/worktree paths are computed and collision-free.

- [X] T003 Generate one stable run ID and create the bespoke controlled coordinator plus two independent layer-1 child issues and one hard-dependent layer-2 child issue; record every returned number, URL, body fingerprint, state, dependency, and authorization marker in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T004 Re-fetch and re-read the created issue set, prove the exact coordinator body marker and complete unique child topology, and record the current evidence in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T005 Compute every deterministic coordinator/child artifact path, branch, remote ref, normalized sibling worktree path, PR target, source ref, and same-run ownership association; prove collision absence and record the complete plan in `specs/034-live-sidecar-dry-run/dry-run-report.md`

**Checkpoint**: One exact current fixture identity and collision-free resource plan exist; no runtime artifact, branch, worktree, or PR is implied before creation.

---

## Phase 3: Technical Outcome 1 - Exact Temporary Routing Exception (Priority: P1)

**Goal**: Route only the recorded controlled #260 fixture into the existing sidecar workflow before #261 while preserving every other boundary.

**Verification**: The exact recorded coordinator with the required body marker routes with `parallel`; wrong/missing/ambiguous identity, ordinary coordinators, non-coordinators, direct children, coordinator-with-open-children without `parallel`, and #220–#234 follow their preserved outcomes.

### Implementation and Evidence for Technical Outcome 1

- [X] T006 [P] [TO1] Add the exact recorded fixture predicate and routing-authorized sidecar worktree boundary to `AGENTS.md` without changing unrelated repository operations
- [X] T007 [P] [TO1] Add only the exact pre-#261 fixture route to `.agents/skills/catworld-implement-issue/SKILL.md`, scope the open-child coordinator stop to non-`parallel` requests, and keep all sidecar lifecycle internals out of this file
- [X] T008 [P] [TO1] Define the routing-authorized-run predicate and align independent activation/launch/output gates in `.agents/skills/catworld-parallel-coordinator/SKILL.md` while preserving its lifecycle procedures
- [X] T009 [P] [TO1] Permit prepared child handoffs only from a routing-authorized run, including the exact pre-#261 fixture, in `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- [X] T010 [P] [TO1] Document the sole #260 exception and preserve #261 general activation semantics in `docs/ARCHITECTURE.md`
- [X] T011 [TO1] Validate the complete positive/negative routing matrix against current fixture evidence and record every canonical result in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T012 [TO1] Prove the sequential-skill diff contains routing-boundary hunks only, `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` is unchanged, and historical issue-scoped artifacts remain untouched; record the review in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T013 [TO1] Run `specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1 -Scenario prohibited-operations` after the routing edits and record the fresh result in `specs/034-live-sidecar-dry-run/dry-run-report.md`

**Checkpoint**: The sole fixture is routing-authorized; #261 remains inactive for all other requests.

---

## Phase 4: Approved Two-Phase Dispatch Correction and Preserved Resume

**Purpose**: Preserve the stopped first attempt, prove the actual held-child capability, correct only the bounded dispatch contract, and publish one immutable control-plane revision before runtime resume.

**Verification**: Historical failed evidence remains visible; one stable proof child performs zero repository actions across preflight and targeted continuation; #255/#256 focused simulations cover every approved success/failure transition; cross-source semantics and exact child-PR wording agree; the pushed control-plane SHA is recorded before runtime artifact reconciliation.

- [X] T014 Capture current agents/processes, branches/HEADs, every preserved worktree status, staged/unstaged paths, ten staged runtime blob IDs, current source refs, and planned remote branch/PR absence in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T015 Prove harmless stable held dispatch through one preflight-only `spawn_agent` identity and targeted `followup_task`, with unchanged control/runtime HEADs, statuses, and ten staged blob IDs before dispatch, before release, and after release; record the result in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T016 [TO2] Update the existing `specs/034-live-sidecar-dry-run/spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/controlled-sidecar-dry-run.md`, `tasks.md`, checklist, and report for the approved non-atomic barrier without regenerating or erasing prior evidence
- [X] T017 [P] [TO2] Align `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `docs/ARCHITECTURE.md` on handoff-ready-before-dispatch, canonical pre-evidence identity fingerprints with independent content validation, separate evidence/recording correlation, stable held identity, factual launched persistence, remote verification, targeted continuation/release, permissions, interruption, and failure semantics without changing the sequential lifecycle
- [X] T018 [P] [TO2] Extend only `specs/029-dependency-layer-fanout/contracts/dependency-layer-fanout.md`, its focused simulation, `specs/030-sidecar-child-execution/contracts/sidecar-child-execution.md`, and its focused simulation to prove the approved barrier, canonical fingerprint recomputation/exclusions, and all zero-edit/no-duplicate failure cases
- [X] T019 [TO2] Update only controlled fixture issue bodies #273, #274, and #275 so child PRs require exactly their child and #272 `Related to` lines and no other #260 reference in the PR body; re-read and fingerprint the resulting bodies in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T020 [TO2] Parse every changed PowerShell validator, run all #255/#256 scenarios including behind-child ancestry and evidence/recording separation, recompute the exact canonical v1 ordered payload and prove self-input/content-hash exclusions, run the applicable routing/prohibited-operation checks, perform the control-plane semantic/PR-wording/self-reference audit and `git diff --check`, and record fresh canonical results plus the preserved staged runtime artifacts' explicitly pending reconciliation state in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [X] T021 [TO2] Remove only the temporary managed Spec Kit pointer if required; commit and normally push the superseding immutable control-plane correction `C2`; fetch and verify remote equality; then use one bounded report-only commit to store exact `C2` and designate `C2` as the workflow source SHA consumed by every runtime handoff, preserving the earlier commits as historical and without opening the final #260 PR

**Checkpoint**: The corrected control plane is immutable and remotely verifiable; runtime artifacts may now be reconciled against its exact SHA.

---

## Phase 5: Technical Outcome 2 - Real First-Layer Fan-Out and Delivery (Priority: P2)

**Goal**: Prepare the real runtime sidecar from current `origin/main`, launch only the two independent children, and deliver two ready child PRs to the remote coordinator branch.

**Verification**: Coordinator/child artifacts are handoff-ready inside the coordinator worktree, the coordinator remote exists before child PR delivery, layer 2 remains waiting, both independent children deliver only their one-file harmless scope, and local `main` remains unchanged and clean.

### Runtime Preparation for Technical Outcome 2

- [ ] T022 [TO2] Re-read all required issue, source, artifact, ref, clean-state, collision, and same-run evidence; re-enter the preserved runtime coordinator branch/worktree at its recorded `origin/main` source without recreating or resetting it; record actual state in the coordinator artifact and `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T023 [TO2] Audit and minimally reconcile the ten preserved staged runtime artifacts in place for exact `C2`, canonical v1 identity fingerprints with independent content validation, excluded self/content/evidence fields, separately correlated barrier heads, factual states/permissions, exact two-line PR wording, source maps, validation, and original blocker history without regenerating the set
- [ ] T024 [TO2] Validate every reconciled artifact for issue scope, sibling isolation, shared-contract completeness, factual states, exact canonical field order/types/serialization and fingerprint recomputation, independent artifact content checks, separate barrier/handoff correlation fields, staged diff, premature-result absence, absence from local `main`, and cross-source agreement with coordinator skill, child skill, #255/#256 contracts, architecture, #260 artifacts, and current fixture bodies; record current results in the coordinator artifact and `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T025 [TO2] Commit the corrected runtime artifacts on the preserved coordinator branch, push normally, fetch it, prove local/remote equality, and record the remote-before-child-delivery evidence in the coordinator artifact and `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T026 [TO2] Create the two layer-1 child branches and isolated worktrees from the recorded coordinator source, record their exact actual ownership/state, and keep the layer-2 child unlaunched with reason `waiting-for-dependency-merge` in the coordinator artifact
- [ ] T027 [TO2] Compute each #273/#274 canonical `sidecar-prepared-handoff-v1` identity fingerprint `F` using exact `C2` before evidence creation and validate prepared content separately; record handoff-ready with launch pending, permissions false, `F`, and Git context; commit/push exact evidence `R`, then commit/push a bounded recording head `Rr` that stores `R`; correlate `F`/`R`/`Rr` separately, fetch and prove remote equality to `Rr` plus ancestry containment of `R`, while child branches remain clean and may be behind

### Parallel Child Execution for Technical Outcome 2

- [ ] T028 [P] [TO2] Dispatch layer-1-A once with its separately correlated `F`/`R`/`Rr` to a stable preflight-only child identity with permissions false and prove zero edits; after both accepted dispatches, persist/fetch factual launched evidence `L` and bounded activation/recording head `Lr`, target only that same identity, require clean incorporation of `Lr` plus ancestry verification of `L` and release acknowledgment, then implement only its prepared `samples/result.md`, validate, commit, normally push, and open one ready PR with exactly `Related to #273` and `Related to #272`
- [ ] T029 [P] [TO2] Dispatch layer-1-B once with its separately correlated `F`/`R`/`Rr` to a stable preflight-only child identity with permissions false and prove zero edits; after both accepted dispatches, persist/fetch factual launched evidence `L` and bounded activation/recording head `Lr`, target only that same identity, require clean incorporation of `Lr` plus ancestry verification of `L` and release acknowledgment, then implement only its prepared `samples/result.md`, validate, commit, normally push, and open one ready PR with exactly `Related to #274` and `Related to #272`
- [ ] T030 [TO2] Re-read both child PRs/refs/worktrees and dispatch identities; record each fingerprint separately from handoff-ready/launched evidence SHAs and their containing recording/activation heads, zero-edit proofs, releases, URLs, commits, targets, exact bodies, readiness, fresh validation, and current workflow states in the coordinator artifact and `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T031 [TO2] Prove local `main` still equals its original SHA and has no sidecar artifact or commit; if it has an attached worktree require empty status, otherwise record no-main-worktree evidence, clean statuses for every existing run checkout, and local-main tree inspection in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T032 [TO2] Stop at Mandatory Pause 1 and report the compact checkpoint from `specs/034-live-sidecar-dry-run/dry-run-report.md`, instructing the user to merge exactly one named first-layer PR with GitHub's merge-commit strategy and leave the other open

**Checkpoint**: Mandatory Pause 1. Do not poll or continue until the user reports exactly one first-layer merge.

---

## Phase 6: Technical Outcome 3 - Merge-Aware Resume and Dependent Layer (Priority: P3)

**Goal**: Prove remote-first coordinator refresh, active-child normal-merge refresh, completion of layer 1, and launch of the hard-dependent child.

**Verification**: Exactly one merged child commit is ancestry-proven before the active child refresh; affected validation is rerun; both prerequisites are later integrated before the dependent handoff; one ready dependent PR targets the coordinator branch.

### Partial Merge Resume for Technical Outcome 3

- [ ] T033 [TO3] After the user reports exactly one first-layer merge, re-read current coordinator/child issues, PRs, refs, artifacts, worktrees, validation, blockers, and cleanup state; record the resume evidence in the coordinator artifact and `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T034 [TO3] Fetch and refresh the local coordinator branch/worktree from its remote by fast-forward or normal merge, prove the reported child commit is in refreshed ancestry, and record the integrated/stale state before touching the active child
- [ ] T035 [TO3] Merge the refreshed coordinator head normally into the still-active child branch/worktree, prove the two-parent refresh evidence, rerun every affected focused validation, normally push the child update, and update its existing PR only as permitted
- [ ] T036 [TO3] Stop at Mandatory Pause 2 and report the merged-child proof, refreshed coordinator SHA, active-child refresh merge, rerun validation, remaining PR URL, and instruction to merge that PR with GitHub's merge-commit strategy

### Complete Layer 1 and Launch Layer 2 for Technical Outcome 3

- [ ] T037 [TO3] After the user reports the remaining first-layer merge, re-read current evidence, refresh the coordinator from its remote, prove both first-layer commits in ancestry, and record both children uniquely integrated
- [ ] T038 [TO3] Recompute dependency layers from current evidence and mark only the dependent child ready-next-layer after both hard dependencies are integrated; preserve all stale/blocker states honestly in the coordinator artifact
- [ ] T039 [TO3] Create the dependent child branch/worktree from refreshed coordinator state, compute its immutable pre-evidence fingerprint using exact `C2`, commit/push handoff-ready evidence and its later exact-SHA recording head as separate correlated fields, dispatch one stable preflight-only child, persist/push factual launched evidence and its later exact-SHA activation/recording head, release only that identity after clean activation-head incorporation and launched-evidence ancestry verification, implement only its prepared `samples/result.md` while consuming both layer-1 markers, validate, commit/push, and open one ready PR with exactly `Related to #275` and `Related to #272`
- [ ] T040 [TO3] Re-read and record the dependent PR URL, commit, target, exact body, dispatch identity, fingerprint, separately correlated barrier heads, readiness, validation, and still-ineligible cleanup state in the coordinator artifact and `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T041 [TO3] Stop at Mandatory Pause 3 and instruct the user to merge the dependent PR with GitHub's merge-commit strategy

**Checkpoint**: Mandatory Pause 3. Do not poll or continue until the user reports the dependent PR merged.

---

## Phase 7: Technical Outcome 4 - Integrated H/H2 Finalization and Final PR (Priority: P4)

**Goal**: Prove complete integration and deliver exactly one ready runtime coordinator PR to `main`.

**Verification**: Every child is uniquely integrated; complete runtime checks pass at H; H2 is a direct sole-artifact child with fresh affected checks and remote equality; one ready final PR uses the current approved template and final-only closing authority.

### Integrated Validation for Technical Outcome 4

- [ ] T042 [TO4] After the user reports the dependent merge, re-read all current issues, PRs, refs, artifacts, worktrees, validation, blockers, existing final PRs, and cleanup state; refresh the local coordinator from its remote and build the complete unique terminal child ledger in the coordinator artifact
- [ ] T043 [TO4] Fetch current `origin/main` as runtime B without updating local `main`, compute the PR-equivalent merge base, reconcile every merge-base-to-H path with the coordinator/child source maps, and record the passed scope state or stop on drift
- [ ] T044 [TO4] Run the complete required live integrated validation at literal H, including child target/merge/ancestry accounting, all three result markers and dependent references, artifact schema/content, prohibited operations, local-main proof, and explicit-range `git diff --check`; record exactly one current canonical result per requirement in the coordinator artifact

### Two-Head Finalization and Delivery for Technical Outcome 4

- [ ] T045 [TO4] Update only the recorded coordinator finalization artifact with literal B, literal H, `H2 = SELF/HEAD`, expected parent H, complete H results, status-free H2 rerun manifest, applicability reasons, template identity/render inputs, remaining risks, pending-H2 readiness, and cleanup ineligibility; commit it as H2
- [ ] T046 [TO4] Prove H2 has exactly parent H and only the allowed artifact delta, run every H2-affected check and applicability review, recheck base/scope/template/existing-PR evidence, normally push H2, fetch the remote coordinator ref, and prove equality without creating H3
- [ ] T047 [TO4] Render the approved final coordinator template from the recorded control context with current runtime evidence and open exactly one ready PR from the runtime coordinator branch to `main` using closing keywords only for the controlled fixture issue set
- [ ] T048 [TO4] Stop immediately at Mandatory Pause 4 and report H/H2, complete and affected validation, final PR URL/source/target/readiness, remaining risks, and the exact user merge action in `specs/034-live-sidecar-dry-run/dry-run-report.md`

**Checkpoint**: Mandatory Pause 4. Do not poll, merge, or claim completion until the user reports the final runtime PR merged.

---

## Phase 8: Technical Outcome 5 - Post-Merge Evidence, Cleanup Eligibility, and #260 Delivery (Priority: P5)

**Goal**: Confirm runtime acceptance, prove local-main isolation, journal cleanup eligibility without deletion, and deliver the accepted #260 build-out evidence.

**Verification**: Current GitHub and `origin/main` evidence confirms the final merge; local `main` is unchanged/clean; the journal is eligible/not-started with exactly eight fields and no attempts; the focused #260 branch validates and has one ready PR to `workflow/sidecar-buildout` using `Related to #260`.

### Post-Merge Evidence for Technical Outcome 5

- [ ] T049 [TO5] After the user reports the final runtime merge, re-read current final PR, issue, ref, H2, and `origin/main` evidence; prove the expected merge and record the external final state in `specs/034-live-sidecar-dry-run/dry-run-report.md` without modifying frozen H2
- [ ] T050 [TO5] Prove local `main` remains at its original SHA with no direct sidecar artifact or commit; if it has an attached worktree require empty status, otherwise record no-main-worktree evidence, clean statuses for every existing run checkout, and local-main tree inspection in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T051 [TO5] Evaluate cleanup eligibility through the approved Git-common-directory journal and, absent separate destructive authority, record `eligible/not_started`, exactly eight top-level fields, empty attempted operations, and the missing-authority reason without deleting any local or remote resource

### Final #260 Build-Out Delivery for Technical Outcome 5

- [ ] T052 [TO5] Complete the accepted staged evidence, actual issue/branch/worktree/PR URLs, validation history/freshness, defects or remaining risks, and cleanup journal outcome in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T053 [TO5] Run every applicable existing #250–#259 focused regression named by the final evidence plan plus the complete #260 routing/live-evidence reviews; record fresh canonical results in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T054 [TO5] Review all changed paths against `specs/034-live-sidecar-dry-run/plan.md` and justify or remove any unplanned surface while keeping the managed Spec Kit pointer absent from committed delivery state
- [ ] T055 [TO5] Run final `git diff --check`, status, diff-summary, constitution, contract, routing, protected-operation, and validation-freshness checks on the #260 build-out branch; record results in `specs/034-live-sidecar-dry-run/dry-run-report.md`
- [ ] T056 [TO5] Commit the accepted post-runtime #260 evidence as a follow-up control-plane commit, normally push `chore/260-live-controlled-sidecar-dry-run`, and open one ready PR to `workflow/sidecar-buildout` using `Related to #260`; record and report the actual URL without merging it

**Checkpoint**: #260 is delivered for review; no fixture or build-out PR has been merged by Codex and no cleanup beyond eligibility evaluation has occurred.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational identity (Phase 2)**.
- **TO1 routing (Phase 3)** depends on the exact created fixture identity from Phase 2.
- **Dispatch correction (Phase 4)** depends on TO1 and the preserved stopped state.
- **TO2 first layer (Phase 5)** depends on the immutable corrected control-plane revision and full artifact/Git preflight.
- **TO3 resume (Phase 6)** depends on user-owned merge states and the preceding mandatory pause.
- **TO4 finalization (Phase 7)** depends on every prepared child being uniquely integrated.
- **TO5 post-merge/delivery (Phase 8)** depends on the user-owned final runtime merge.

### Technical Outcome Dependencies

- **TO1 (P1)**: Depends on foundational fixture identity; independently verifiable through the routing matrix.
- **TO2 (P2)**: Depends on TO1; ends at Mandatory Pause 1.
- **TO3 (P3)**: Depends on the two staged first-layer user merges; ends at Mandatory Pause 3.
- **TO4 (P4)**: Depends on the dependent user merge; ends at Mandatory Pause 4.
- **TO5 (P5)**: Depends on the final runtime user merge.

### Parallel Opportunities

- T006–T010 may be edited in parallel because they touch separate routing source files, then converge in T011–T013.
- T017 and T018 may proceed in parallel on disjoint correction surfaces before the semantic audit.
- T028 and T029 are the required held first-layer child fan-out and run in parallel from independent worktrees and disjoint owned files only after the handoff-ready remote gate.
- No later-layer, finalization, checkpoint, or GitHub mutation task is parallelized across a dependency or user-owned merge boundary.

---

## Parallel Example: Technical Outcome 2

```text
Task: "Execute prepared layer-1-A handoff in its recorded worktree; deliver only its one result file and ready PR to the coordinator branch"
Task: "Execute prepared layer-1-B handoff in its recorded worktree; deliver only its one result file and ready PR to the coordinator branch"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Capture clean control evidence and create the exact fixture issue identity.
2. Apply and validate the narrow TO1 routing exception.
3. Prepare the runtime coordinator/child artifacts and Git state.
4. Deliver both layer-1 child PRs and stop at Mandatory Pause 1.

### Incremental Delivery

1. TO1 proves safe routing without general activation.
2. TO2 proves real fan-out and child PR delivery.
3. TO3 proves remote-first resume, active-child refresh, and dependency progression.
4. TO4 proves integrated H/H2 finalization and final runtime PR delivery.
5. TO5 proves post-merge isolation/cleanup boundaries and delivers #260 evidence.

## Notes

- Every mandatory pause is a hard stop; user merge instructions must specify merge-commit strategy for child PRs.
- A concrete defect stops the run immediately with all state preserved.
- Do not mark a task complete when its evidence is stale, partial, blocked, not run, or otherwise non-passing.
- Commit/push/PR steps appear here only where they are the behavior under live #260 validation or the explicitly required final #260 delivery; they are not generic implementation boilerplate.
