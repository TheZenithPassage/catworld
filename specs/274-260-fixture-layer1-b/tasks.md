# Tasks: #260 Fixture Layer 1B

**Input**: Coordinator-prepared `spec.md` and `plan.md` for child #274

**Coordinator**: #272

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Dependency layer**: 1; no hard dependencies

**Immutable control revision (C2)**: `db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control report head (C2r; separate evidence)**: `76531c9aa0511c49dfd44eb196913a2600a044da`

**Prepared-handoff fingerprint (authoritative)**: `37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba`

**Current state / permissions**: `handoff-ready` / `pending` / `held-preflight`; `false` / `false`

**Current barrier evidence / child identity**: exact H is
`78329c6f45793583d4d0e46a96ad54066989ba8d`; `R = SELF/HEAD` in this recording
commit stores literal H. `L`, `A`, and the stable child/task/agent identity remain pending. No
result has been implemented.

## Required Release Gate (Not Prepared Task Execution)

No checkbox task below may be executed or marked by the child during held
preflight. Coordinator #272 establishes the actual Git context, canonical
fingerprint, H/R evidence, accepted stable identity, L/A evidence, barrier-only
incorporation, and release. Only after the same child acknowledges release may
it execute T001-T018; T001-T009 then verify the already durable gate evidence
before T010 creates the owned result.

## Phase 1: Released Verification of Prepared Identity and Handoff Evidence

- [ ] T001 After exact-child release, verify child #274, coordinator #272, the exact run ID, layer 1, sorted empty hard-dependency array, coordinator branch and remote, exact coordinator and child worktrees, child branch `sidecar/274-260-fixture-layer1-b`, immutable C2 `db175fe0a1911e9ea2a1931ae808b9771f874b57`, exact prepared `spec.md`/`plan.md`/`tasks.md` paths, and `specs/274-260-fixture-layer1-b/samples/result.md` as the sole owned implementation path. Treat C2r `76531c9aa0511c49dfd44eb196913a2600a044da` as separate evidence, not a fingerprint input.
- [ ] T002 Recompute the exact ordered 21-field `sidecar-prepared-handoff-v1` payload from the accepted pre-H inputs using `ConvertTo-Json -Compress -Depth 4`, UTF-8 SHA-256, and lowercase 64-hex; prove the coordinator established exact fingerprint `37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba` before `H`. Validate prepared artifact content separately and exclude artifact-content hashes, fingerprint self, C2r, `H`/`R`/`L`/`A`, and child/task/agent identity from the hash.
- [ ] T003 Verify the released handoff preserves exact handoff-ready evidence `H` and later recording head `R`, plus the recorded proof that the fetched remote coordinator ref equaled `R` immediately before dispatch; require `R` to store `H` and prove `git merge-base --is-ancestor H R` succeeds. Do not require the current post-release remote ref to remain at historical `R`.

## Phase 2: Accepted Dispatch and Held-Preflight Evidence

- [ ] T004 Verify the unambiguous stable canonical child/task identity recorded from the accepted real held dispatch and correlate it with the exact run, issues, branch, worktree, control revision, fingerprint, `H`, and `R`; reject replacement or duplicate identity evidence.
- [ ] T005 Verify the durable held-preflight record proves the exact checkout/branch/artifacts/layer, false implementation/delivery permissions, unchanged HEAD and empty status before/after, zero file edits, staging changes, prepared-task attempts, commits, pushes, PR actions, or GitHub mutations, and the allowed behind-child state.

## Phase 3: Factual Launch, Activation, and Release Evidence

- [ ] T006 Verify coordinator #272 recorded factual launched evidence `L` with permissions false and later activation head `A` that stores `L` and records permissions true subject to child revalidation while the exact child remained held and non-editing; verify effective authority stayed false and failure semantics retain factual launch when applicable without release or delivery.
- [ ] T007 Require the current remote coordinator ref to equal exact `A`, require `A` to store exact `L`, and prove `git merge-base --is-ancestor L A` succeeds; an unexpected descendant is a freshness failure even if it contains `L`.
- [ ] T008 Verify targeted continuation addressed the same held child, fetched exact `A`, kept the worktree clean, incorporated `A` by allowed fast-forward or normal merge without rebase/history rewriting, and matched run, child/coordinator issues, branch, worktree, control revision, fingerprint, stable identity, factual `launched`, conditional permissions recorded true, and effective authority still false through incorporation.
- [ ] T009 Verify that targeted continuation recorded release acknowledgment for the same canonical identity and only that acknowledgment enabled implementation/delivery. Stop if dispatch was rejected/ambiguous, identity differs, refresh/verification failed, the worktree is dirty, release failed, or active-child state is unavailable or ambiguous.

## Phase 4: Owned Result and Pre-Commit Check

- [ ] T010 Only after T009, add `specs/274-260-fixture-layer1-b/samples/result.md` as harmless Markdown containing the exact stable run ID and `layer1-b-complete`.
- [ ] T011 Prove pre-commit worktree status contains only the new owned result and validate both required tokens directly; do not treat the uncommitted file as post-commit diff evidence.

## Phase 5: Scoped Commit and Focused Readiness Validation

Only after exact activation-head incorporation and release acknowledgment may the prepared sidecar child delivery workflow create one scoped commit containing the owned result. Before normal push or PR creation:

- [ ] T012 Create one scoped commit containing only the owned result through the validated sidecar child workflow; perform no amend, rebase, force-push, sibling edit, coordinator-artifact edit, or issue mutation.
- [ ] T013 Freshly fetch `refs/heads/sidecar/272-coordinator-260-live-sidecar-fixture` into its remote-tracking ref, record the target SHA, compare committed `HEAD` with that exact ref, and prove the name-only diff contains exactly `specs/274-260-fixture-layer1-b/samples/result.md`.
- [ ] T014 Run explicit-range `git diff --check` from the exact fetched remote coordinator ref through committed `HEAD` for the owned result path.
- [ ] T015 Verify the committed owned result contains both `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb` and `layer1-b-complete`.

## Phase 6: Delivery and Final Report

- [ ] T016 Review the final changed-file set against the one-path source map and require every validation item to have an explicit current status; stale or non-passing evidence cannot support ready delivery.
- [ ] T017 Normally push only `sidecar/274-260-fixture-layer1-b` and open one ready PR targeting `sidecar/272-coordinator-260-live-sidecar-fixture` whose only issue-reference lines are exactly `Related to #274` and `Related to #272`; include no other issue reference or closing wording.
- [ ] T018 Report immutable control revision, fingerprint, exact `H`/`R`/`L`/`A`, current-remote equality and ancestry results, canonical child identity, zero-edit held proof, activation incorporation, release acknowledgment, fetched validation target, child commit, changed path, validation statuses, PR URL/base/head/body/readiness, blockers, and risks.

## Delivery Boundary

Branch creation is coordinator-owned and complete at exact initial coordinator
head `421b2ac250c05c59eb3cade06b4056e02a6c8415`. The current artifacts are
handoff-ready/held-preflight with launch pending and permissions false. H is
`78329c6f45793583d4d0e46a96ad54066989ba8d`; `R = SELF/HEAD`. `L`, `A`, child
identity, and result remain pending. Held
preflight performs zero mutation. Targeted continuation
after durable `L`/`A` performs only clean activation-head incorporation while
conditional permissions are recorded true but effective authority remains
false; same-child release acknowledgment makes them effective and enables work.
Afterwards, the scoped commit, normal push, and ready child PR remain permitted
only through the validated prepared handoff and fresh passing evidence.

The child PR targets the coordinator branch and contains exactly:

```md
Related to #274
Related to #272
```

No other issue reference or closing wording is permitted in the PR body. On any barrier, identity, Git, validation, scope, push, or PR mismatch, stop and preserve factual state; do not retry blindly, substitute another child, fall back to another workflow, or roll factual `launched` back to pending.
