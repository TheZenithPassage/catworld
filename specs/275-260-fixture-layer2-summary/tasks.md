# Tasks: #260 Fixture Layer 2 Summary

**Input**: Coordinator-prepared `spec.md` and `plan.md` for child #275

**Coordinator**: #272

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Immutable control-plane revision (`C2`)**: `db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control publication evidence (`C2r`)**: `76531c9aa0511c49dfd44eb196913a2600a044da` (separate; never a fingerprint input or workflow source)

**Dependency layer**: 2; hard dependencies #273 and #274

**Current factual state**: artifact `prepared`; launch/workflow
`waiting-for-dependency-merge`; implementation/delivery permissions `false`;
no child branch, worktree, authoritative fingerprint, dispatch, stable child
identity, `H`/`R`/`L`/`A`, PR, or result exists

## Required Future Release Gate (Not Prepared Task Execution)

No checkbox task below may execute while #275 is waiting or during held
preflight. Coordinator #272 must first integrate both dependencies, create the
exact Git context, compute the canonical fingerprint, persist H/R, accept one
stable held dispatch, persist L/A, target only that child for barrier
incorporation, and obtain release acknowledgment. Only then may the released
child execute T001-T013; T001-T006 verify the durable gate evidence before T007
begins scoped implementation work.

## Phase 1: Released Verification of Dependency Wait Evidence

- [ ] T001 Verify the historical prepared artifact remained `waiting-for-dependency-merge` with permissions false and no premature child branch/worktree/fingerprint/dispatch/identity/`H`/`R`/`L`/`A`/PR/result; require exact `C2`, separate non-input `C2r`, issue/run/layer/owned-path identity, and both hard dependencies.
- [ ] T002 Verify both prerequisite PRs have user-owned merge commits in the remote coordinator branch, the local coordinator was refreshed from that remote, and both delivered commits are present in refreshed ancestry before any #275 Git preparation or dispatch occurred.

## Phase 2: Released Verification of Handoff and Held Preflight

- [ ] T003 Recompute and independently revalidate canonical `sidecar-prepared-handoff-v1` from the accepted pre-H values: exact 21-field ordered PowerShell payload, `ConvertTo-Json -Compress -Depth 4`, UTF-8, SHA-256, lowercase 64-hex; require exact `C2`, validate content separately, and exclude content/blob hashes, self-value, `C2r`, H/R/L/A, and agent identity.
- [ ] T004 Verify exact pushed handoff-ready evidence `H`, later recording head `R`, and the recorded proof that the fetched remote equaled `R` immediately before dispatch; prove `R` contains `H` by ancestry and record both literal SHAs. Do not require the current post-release remote ref to remain at historical `R`.
- [ ] T005 Verify one stable child identity was accepted in held/preflight-only mode and the durable preflight evidence matches control/run/issue/Git/dependency identity, fingerprint, H/R, and false permissions while proving zero file edits, staging, prepared task execution, commits, pushes, PR operations, GitHub mutations, or branch/worktree changes.

## Phase 3: Factual Launch, Activation, and Release Evidence

- [ ] T006 Verify accepted dispatch produced exact pushed factual launched evidence `L` with permissions false and later activation/recording head `A` that records permissions true subject to child revalidation, current remote equality to `A`, and ancestry containment of `L`; verify targeted continuation let only the same child cleanly incorporate `A` while effective authority remained false, then recorded release acknowledgment before implementation/later-delivery permission became effective.

## Phase 4: Owned Summary and Pre-Commit Check

- [ ] T007 Read both integrated dependency result files and verify their exact run ID plus `layer1-a-complete` and `layer1-b-complete` markers without modifying either file.
- [ ] T008 Add only `specs/275-260-fixture-layer2-summary/samples/result.md` as harmless Markdown containing the exact run ID, both consumed first-layer markers, and `layer2-summary-complete`.
- [ ] T009 Before commit, prove worktree status contains only the new owned result and validate its required tokens without treating the uncommitted state as post-commit diff evidence.

## Phase 5: Scoped Commit and Focused Readiness Validation

The released sidecar child delivery workflow may now create one scoped commit containing only the owned result. Before normal push or PR creation:

- [ ] T010 Compare committed `HEAD` with exact incorporated activation head `A` and prove the name-only diff contains exactly `specs/275-260-fixture-layer2-summary/samples/result.md`.
- [ ] T011 Run explicit-range `git diff --check` from exact activation head `A` through committed `HEAD` for the owned result.
- [ ] T012 Verify both dependency results and the owned summary contain the expected run ID/marker contract, and verify the owned summary references both integrated markers.

## Phase 6: Source-Map Review and Final Report

- [ ] T013 Review the final changed-file set against the one-path writable source map and report exact `C2`, separate `C2r` evidence, prerequisite PR/commit/refreshed-ancestry evidence, canonical-v1 recomputation and exclusions, independently validated artifact content, stable dispatch identity, separately correlated `H`/`R` and `L`/`A`, current equality/ancestry checks, zero-edit preflight, barrier-only incorporation, release, permissions, changed path, validation statuses, blockers, and risks.

## Delivery Boundary

Branch creation is coordinator-owned. The scoped commit, normal push, and child PR are permitted only after the same stable held child incorporates `A`, verifies `L` in ancestry, receives targeted release, and retains current delivery permission plus fresh passing evidence. The PR must target the coordinator branch and its body must contain exactly these two issue-reference lines and no other issue reference:

```md
Related to #275
Related to #272
```

The child PR must use no closing keyword and must not target `main`.
