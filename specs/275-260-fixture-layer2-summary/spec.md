# Feature Specification: #260 Fixture Layer 2 Summary

**Child issue**: [#275](https://github.com/TheZenithPassage/catworld/issues/275)

**Coordinator issue**: [#272](https://github.com/TheZenithPassage/catworld/issues/272)

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Immutable control-plane revision (`C2`)**: `db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control publication evidence (`C2r`)**: `76531c9aa0511c49dfd44eb196913a2600a044da` (separate report-only evidence; not the workflow source or a fingerprint input)

**Dependency layer**: 2

**Hard dependencies**: #273 and #274

**Artifact preparation state**: `prepared`

**Current launch state**: `waiting-for-dependency-merge`

**Current workflow state**: `waiting-for-dependency-merge`

**Current implementation permission**: `false`

**Current delivery permission**: `false`

**Current child Git/dispatch/result state**: no branch, worktree, authoritative
fingerprint, dispatch, stable child identity, `H`/`R`/`L`/`A`, PR, or result
exists

## Goal

Create one harmless Markdown summary that proves the sidecar coordinator starts a second dependency layer only after both first-layer results are merge-committed and ancestry-proven integrated. The summary must consume both integrated markers and add its own `layer2-summary-complete` marker.

## Acceptance Scenarios

1. **Given** either #273 or #274 is not merge-committed into the remote coordinator branch or its delivered commit is absent from refreshed coordinator ancestry, **when** dependency readiness is evaluated, **then** #275 remains `waiting-for-dependency-merge` with permissions false and no branch, worktree, dispatch, or child edit.
2. **Given** both first-layer commits are ancestry-proven integrated after remote/local coordinator refresh and the exact #275 Git context then exists, **when** the future handoff is prepared, **then** its canonical `sidecar-prepared-handoff-v1` fingerprint is computed and revalidated from the exact 21-field pre-evidence payload; no authoritative fingerprint is claimed earlier.
3. **Given** that future fingerprint, **when** pushed handoff-ready evidence `H` and its later recording head `R` become current, **then** the fetched remote ref equals `R`, ancestry proves `R` contains `H`, and the fingerprint remains separate from `H`/`R` before held dispatch.
4. **Given** the exact prepared handoff is accepted with one stable child identity, **when** held preflight runs and until targeted durable continuation begins, **then** the same child verifies `C2`, run/issue/Git/dependency identity, fingerprint, `H`/`R`, and permissions false while performing zero repository or GitHub mutation.
5. **Given** held dispatch was accepted, **when** factual launched evidence `L` with permissions false and its later activation/recording head `A` are pushed, **then** `A` records permissions true subject to child revalidation, the current fetched remote ref equals `A`, ancestry proves `A` contains `L`, and targeted continuation lets only that same child cleanly incorporate `A` while effective authority remains false; release acknowledgment then makes the permissions effective for implementation and later delivery.
6. **Given** the summary result is added after release, **when** it is inspected, **then** it contains the exact run ID, its own marker, and references both integrated first-layer markers.
7. **Given** the summary has a scoped child commit, **when** it is compared with the exact incorporated activation head, **then** exactly the owned result path appears and the explicit-range whitespace check passes.

## Requirements

- **FR-001**: The implementation MUST add only `specs/275-260-fixture-layer2-summary/samples/result.md`.
- **FR-002**: The result MUST contain `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`, `layer1-a-complete`, `layer1-b-complete`, and `layer2-summary-complete`.
- **FR-003**: Before implementation, current PR and Git evidence MUST prove both #273 and #274 were merge-committed to the coordinator branch, the local coordinator was refreshed from that remote, and both delivered commits are in refreshed ancestry.
- **FR-004**: Future dispatch MUST use exact pushed handoff-ready evidence `H`, a later recording head `R` that stores `H`, current remote equality to `R`, ancestry containment of `H`, one canonical prepared-handoff fingerprint, and one stable exact child identity. During held preflight and until targeted durable continuation begins, implementation/delivery permissions MUST be false and the child MUST perform zero edits, staging, task execution, commits, pushes, PR operations, GitHub mutations, or branch/worktree changes.
- **FR-005**: After accepted dispatch, factual launched evidence `L` with permissions false and its later activation/recording head `A` MUST be normally pushed; `A` records permissions true subject to child revalidation. The current remote MUST equal `A` and contain `L` by ancestry. Targeted continuation MAY let only the same clean child fetch and incorporate `A` by normal fast-forward/merge while effective authority remains false; that child MUST verify exact control/run/issue/Git/handoff evidence and acknowledge release before either permission becomes effective.
- **FR-006**: The child MUST read both integrated dependency result paths and MUST NOT invent their marker values.
- **FR-007**: Post-commit validation MUST compare the child head with the exact incorporated activation head, prove the name-only diff contains only the owned summary, run explicit-range `git diff --check`, and verify all tokens.
- **FR-008**: The child MUST consume the coordinator-prepared artifacts and exact immutable `C2` revision `db175fe0a1911e9ea2a1931ae808b9771f874b57` and MUST NOT regenerate or redefine its specification, plan, tasks, dependencies, shared contract, or handoff fingerprint. `C2r=76531c9aa0511c49dfd44eb196913a2600a044da` is separate publication evidence and MUST NOT replace `C2` or enter the fingerprint.
- **FR-009**: Commit, normal push, and child-PR delivery are governed only by the released sidecar child handoff and child implementation skill. The future PR body MUST contain exactly `Related to #275` and `Related to #272`, each on its own line, and no other issue reference.
- **FR-010**: The future fingerprint MUST use canonical schema `sidecar-prepared-handoff-v1`: one PowerShell `[ordered]` object with exactly the 21 fields and order below, serialized by `ConvertTo-Json -Compress -Depth 4`, encoded as UTF-8, and hashed with SHA-256 to lowercase 64-hex without a prefix.
- **FR-011**: Prepared artifact content MUST be validated independently. Artifact content/blob hashes, the fingerprint itself, `H`, `R`, `L`, `A`, and child-agent/dispatch identity MUST NOT be fingerprint inputs. No current fingerprint is authoritative while dependencies remain unintegrated and the exact #275 branch/worktree does not exist.

## Future Canonical Prepared-Handoff Fingerprint

Compute and revalidate this identity only after #273 and #274 are integrated and
the exact #275 Git context exists. The ordered fields and types are:

1. `Schema` = `sidecar-prepared-handoff-v1` (string)
2. `RunId` (string)
3. `CoordinatorIssueNumber` (integer)
4. `ChildIssueNumber` (integer)
5. `CoordinatorBranch` (string)
6. `CoordinatorRemoteBranch` (string)
7. `CoordinatorWorktree` (string)
8. `ChildBranch` (string)
9. `ChildWorktree` (string)
10. `ControlRevision` (exact lowercase 40-hex `C2` string)
11. `PreparedSpec` (repository-relative path string)
12. `PreparedPlan` (repository-relative path string)
13. `PreparedTasks` (repository-relative path string)
14. `DependencyLayer` (integer)
15. `HardDependencies` (ascending integer array `[273, 274]`)
16. `PrTargetBranch` (string equal to the coordinator branch)
17. `PrRelatedReferences` (ordered string array `Related to #275`, `Related to #272`)
18. `ArtifactPreparationState` = `handoff-ready` (string)
19. `LaunchState` = `pending` (string)
20. `ImplementationPermission` = Boolean `false`
21. `DeliveryPermission` = Boolean `false`

The current `prepared`/`waiting-for-dependency-merge` artifact is not this
future payload and records no computed fingerprint.

## Source Map

The complete child implementation source map contains exactly one path:

- `specs/275-260-fixture-layer2-summary/samples/result.md`

The dependency files are read-only inputs:

- `specs/273-260-fixture-layer1-a/samples/result.md`
- `specs/274-260-fixture-layer1-b/samples/result.md`

## Out of Scope

- Early launch before both hard dependencies integrate.
- Any current claim that a fingerprint, child Git context, dispatch identity,
  `H`/`R`/`L`/`A`, PR, or result exists.
- Any branch/worktree creation, dispatch, permission grant, child edit, staging, task execution, commit, push, or PR action while the current state remains `waiting-for-dependency-merge` or before targeted release.
- Modification of either dependency result, any sibling/planning/coordinator artifact, workflow source, product code, test suite, or configuration.
- Issue mutation, comments, merge operations, rebase, force-push, auto-merge, cleanup, or remote cleanup.
- A child PR targeting `main`, using closing wording, or containing any issue reference other than #275 and #272.
