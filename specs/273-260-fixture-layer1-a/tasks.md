# Tasks: #260 Fixture Layer 1A

**Input**: Coordinator-prepared `spec.md` and `plan.md` for child #273

**Coordinator**: #272

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Immutable control revision (`C2`)**:
`db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control report head (`C2r`, separate evidence)**:
`76531c9aa0511c49dfd44eb196913a2600a044da`

**Authoritative prepared-handoff fingerprint**:
`32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`

**Dependency layer**: 1; no hard dependencies

## Current Activation-Pending State (No Task Execution)

Artifact preparation is `handoff-ready`, launch is `launched`, workflow is
`release-pending`, and implementation/delivery permissions are recorded true
but effective false. Exact H is
`78329c6f45793583d4d0e46a96ad54066989ba8d`; exact R is
`99f34e32de9702ae34301463e32ed3d8ff013932`; exact L is
`08f8588dab15ab0e1991733f43d4a74e44deda4e`; `A = SELF/HEAD` in this
activation/recording commit records conditional authority for stable identity
`/root/held_child_273_live`. Release remains absent. `C2r` is separate
control-report evidence, not a fingerprint
input or a sidecar lifecycle head. The literal fingerprint is authoritative:
the actual child Git context exists, every canonical field was revalidated, and
coordinator #272 recomputed it immediately before `H`.

## Required Held-Dispatch Gate (Not Prepared Task Execution)

No checkbox task below may begin until current activation/release evidence
passes and the complete historical predispatch evidence remains recorded:

- the historical prepared-handoff record proves the actual coordinator/child
  branch and worktree context matched the exact planned Git identities, all
  three artifact contents passed separate validation, and coordinator #272
  recomputed the canonical fingerprint before creating `H`;
- the historical dispatch gate proves coordinator #272 committed/pushed exact
  handoff-ready evidence `H`, then committed/pushed recording head `R` containing
  literal H; immediately before dispatch, the fetched remote coordinator ref
  equaled exact R and proved H in ancestry;
- that historical predispatch lifecycle state was preparation `handoff-ready`,
  launch `pending`, workflow `held-preflight`, and implementation/delivery
  permissions false;
- the `sidecar-prepared-handoff-v1` PowerShell `[ordered]` payload has exactly
  these 21 fields in order: `Schema`, `RunId`, `CoordinatorIssueNumber`,
  `ChildIssueNumber`, `CoordinatorBranch`, `CoordinatorRemoteBranch`,
  `CoordinatorWorktree`, `ChildBranch`, `ChildWorktree`, `ControlRevision`,
  `PreparedSpec`, `PreparedPlan`, `PreparedTasks`, `DependencyLayer`,
  `HardDependencies`, `PrTargetBranch`, `PrRelatedReferences`,
  `ArtifactPreparationState`, `LaunchState`, `ImplementationPermission`, and
  `DeliveryPermission`;
- those fields use run
  `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`, coordinator/child integers
  `272`/`273`, coordinator branch/remote
  `sidecar/272-coordinator-260-live-sidecar-fixture` and
  `origin/sidecar/272-coordinator-260-live-sidecar-fixture`, coordinator
  worktree
  `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\272-coordinator-260-live-sidecar-fixture`,
  child branch/worktree `sidecar/273-260-fixture-layer1-a` and
  `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\273-260-fixture-layer1-a`, and `C2`
  `db175fe0a1911e9ea2a1931ae808b9771f874b57`;
- its remaining canonical-preimage values, which are identity inputs rather
  than current lifecycle values, are prepared paths
  `specs/273-260-fixture-layer1-a/spec.md`,
  `specs/273-260-fixture-layer1-a/plan.md`, and
  `specs/273-260-fixture-layer1-a/tasks.md`, layer integer `1`, ascending integer
  dependencies `[]`, PR target
  `sidecar/272-coordinator-260-live-sidecar-fixture`, ordered string references
  `Related to #273` then `Related to #272`, artifact state `handoff-ready`,
  launch `pending`, and Boolean permissions false/false;
- exact `ConvertTo-Json -Compress -Depth 4` serialization, UTF-8 bytes,
  SHA-256, and lowercase 64-hex rendering produces
  `32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`;
  artifact content/blob hashes, artifact self-identity or the fingerprint
  itself, `C2r`, `H`, `R`, `L`, `A`, and agent/dispatch identity are not inputs,
  and artifact contents remain separately validated;
- one real preflight-only dispatch returns an unambiguous stable canonical
  child/task identity correlated to that exact handoff; the child may be clean
  and behind `R`, performs zero repository/GitHub mutation, and acknowledges
  acceptance with both permissions false;
- only after accepted dispatch, coordinator #272 commits/pushes factual launched
  evidence `L` with permissions false and later activation/recording head `A`;
  the fetched current remote ref equals exact `A` and proves `L` in ancestry;
  `A` records permissions true subject to child revalidation while effective
  child authority remains false;
- only that same canonical child receives targeted continuation after durable
  `L`/`A`, performs the barrier-only fetch and clean incorporation of `A` by
  normal fast-forward or merge with conditional permissions recorded true but
  effective authority still false, verifies the
  exact correlated evidence, and then acknowledges release; only that release
  acknowledgement enables implementation and delivery.

Rejected or ambiguous dispatch, evidence/recording commit or push failure,
refresh/incorporation/ancestry/identity/permission verification failure, release
failure, or interruption with no verifiable exact child stops before T001 with
zero implementation and zero delivery. Never retry ambiguity or replace a
launched child blindly. Release failure retains factual `launched` as blocked or
resume-needed.

## Phase 1: Released Handoff Verification

- [ ] T001 After exact-child release, verify the handoff and current checkout identify child #273, coordinator #272, the exact run ID, immutable `C2`, separate non-input `C2r`, `sidecar/273-260-fixture-layer1-a`, exact recorded worktree, layer 1, no hard dependencies, literal `H`/`R` and `L`/`A`, the accepted canonical identity and recomputed fingerprint `32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`, and `specs/273-260-fixture-layer1-a/samples/result.md` as the sole owned implementation path.
- [ ] T002 Verify the incorporated child head contains exact `A` and factual `L`, the current fetched `origin/sidecar/272-coordinator-260-live-sidecar-fixture` ref still equals `A`, required ancestry remains current, `A` recorded conditional permissions true while effective authority stayed false through barrier-only incorporation, release is acknowledged and only then made those permissions effective, and the worktree is clean; record `A` as the target SHA used by validation.

## Phase 2: Owned Result and Pre-Commit Check

- [ ] T003 Add only `specs/273-260-fixture-layer1-a/samples/result.md` as harmless Markdown containing the exact stable run ID and `layer1-a-complete`.
- [ ] T004 Prove pre-commit worktree status contains only the new owned result and validate both required tokens directly; do not treat the uncommitted file as post-commit diff evidence.

## Phase 3: Scoped Commit and Focused Readiness Validation

The prepared sidecar child delivery workflow may now create one scoped commit containing only the owned result. Before normal push or PR creation:

- [ ] T005 Compare committed `HEAD` with the exact fetched remote coordinator ref and prove the name-only diff contains exactly `specs/273-260-fixture-layer1-a/samples/result.md`.
- [ ] T006 Run explicit-range `git diff --check` from the exact fetched remote coordinator ref through committed `HEAD` for the owned result path.
- [ ] T007 Verify the committed owned result contains both `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb` and `layer1-a-complete`.

## Phase 4: Source-Map Review and Final Report

- [ ] T008 Review the final changed-file set against the one-path source map and report the fetched target SHA, changed path, explicit validation statuses, blockers, and risks to the sidecar child workflow.

## Delivery Boundary

Branch creation is coordinator-owned. The scoped commit, normal push, and child
PR are permitted only after the complete held-dispatch gate and through the
released prepared sidecar handoff. The PR must target
`sidecar/272-coordinator-260-live-sidecar-fixture` and contain exactly these two
issue-reference lines, with no other issue reference anywhere in its body:

```md
Related to #273
Related to #272
```

The PR body contains no #260 reference and no closing keyword. It remains ready
only with current exact-child release/delivery evidence, completed scoped tasks,
fresh passing validation, correct target/wording, and no blocker.
