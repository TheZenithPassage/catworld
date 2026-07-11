# Feature Specification: #260 Fixture Layer 1B

**Child issue**: [#274](https://github.com/TheZenithPassage/catworld/issues/274)

**Coordinator issue**: [#272](https://github.com/TheZenithPassage/catworld/issues/272)

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Dependency layer**: 1

**Hard dependencies**: None

**Immutable control revision (C2)**: `db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control report head (C2r; separate evidence)**: `76531c9aa0511c49dfd44eb196913a2600a044da`

**Child branch**: `sidecar/274-260-fixture-layer1-b`

**Child worktree**: `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\274-260-fixture-layer1-b`

**Prepared-handoff fingerprint (authoritative)**: `37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba`

**Current preparation / launch / workflow state**: `handoff-ready` / `launched` / `held`

**Current implementation / delivery permission**: `false` / `false`

**Current barrier evidence / child identity**: exact H is
`78329c6f45793583d4d0e46a96ad54066989ba8d`; exact R is
`99f34e32de9702ae34301463e32ed3d8ff013932`; `L = SELF/HEAD` in this
launched-evidence commit records stable identity `/root/held_child_274_live`.
`A` remains pending. The
result is not implemented.

## Goal

Create one harmless Markdown result that proves child #274 can execute as an
independent first-layer child in the controlled #260 sidecar run. The result
must contain the stable run ID and the shared marker `layer1-b-complete`.

## Acceptance Scenarios

1. **Given** exact handoff-ready evidence `H` and a later recording head `R`
   that stores `H`, **when** the held child preflights, **then** the current
   remote coordinator ref equals `R`, ancestry proves `R` contains `H`, the
   deterministic fingerprint and exact Git identity match, permissions remain
   false, and the clean child makes zero edits even when its branch is behind.
2. **Given** a real held dispatch returns one stable canonical child identity,
   **when** coordinator #272 records factual launched evidence `L` and a later
   activation head `A`, **then** that same child remains held and non-editing
   until current remote equality to `A` and ancestry containment of `L` pass.
3. **Given** exact `L` and `A` are remotely durable, **when** targeted
   continuation of the same held child incorporates `A` by an allowed
   fast-forward or normal merge while `A` records permissions true subject to
   revalidation but effective authority remains false, verifies the matching
   handoff evidence, and acknowledges
   release, **then** and only then may the released child enable work and
   implement the owned result file.
4. **Given** the owned result file is added, **when** it is inspected, **then**
   it contains both `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`
   and `layer1-b-complete`.
5. **Given** the exact remote coordinator branch has been fetched, **when** the
   child diff is compared with that ref, **then** exactly the owned result file
   appears and the explicit-range whitespace check passes.
6. **Given** implementation, validation, and delivery gates pass, **when** the
   ready child PR is rendered, **then** its only issue-reference lines are
   `Related to #274` and `Related to #272`, with no closing wording and no other
   issue reference anywhere in the PR body.

## Requirements

- **FR-001**: The implementation MUST add only
  `specs/274-260-fixture-layer1-b/samples/result.md`.
- **FR-002**: The result MUST be harmless workflow-fixture Markdown and MUST
  contain the exact stable run ID and marker `layer1-b-complete`.
- **FR-003**: Child #274 MUST remain a layer-1 independent candidate with no
  hard dependencies and no reliance on sibling #273.
- **FR-004**: Validation MUST compare the child head with the freshly fetched
  `origin/sidecar/272-coordinator-260-live-sidecar-fixture` ref.
- **FR-005**: After the prepared sidecar child delivery workflow creates one
  scoped commit and before normal push/PR creation, validation MUST prove the
  name-only diff contains exactly the owned result path, run an explicit-range
  `git diff --check`, and verify both required tokens.
- **FR-006**: The child MUST consume these coordinator-prepared artifacts and
  MUST NOT regenerate or redefine its specification, plan, tasks, or shared
  marker.
- **FR-007**: Commit, push, and child-PR delivery are governed by the sidecar
  child implementation skill. The scoped commit occurs only after the exact
  held child incorporates and verifies `A`, proves `L` in ancestry, and
  acknowledges release.
- **FR-008**: The handoff MUST consume immutable control revision C2
  `db175fe0a1911e9ea2a1931ae808b9771f874b57` and MUST stop if that revision or
  its corrected coordinator/child contract cannot be verified. Control report
  head C2r `76531c9aa0511c49dfd44eb196913a2600a044da` is separate evidence and is not
  a prepared-handoff fingerprint input.
- **FR-009**: Preparation state, factual launch state, workflow state,
  implementation permission, and delivery permission MUST remain separate.
  `prepared` or `handoff-ready` MUST NOT imply `launched` or permission.
- **FR-010**: Before dispatch, exact handoff-ready evidence `H` and a later
  recording head `R` that stores `H` MUST be normally pushed. Current remote
  equality to `R` and ancestry containment of `H` MUST both pass.
- **FR-011**: The dispatch envelope MUST bind the exact run, issues, branch,
  worktree, control revision, artifact root, owned path, dependency layer,
  deterministic fingerprint, `H`, and `R`. Dispatch MUST return one stable
  canonical child/task identity used unchanged through release.
- **FR-012**: Held preflight MUST be read-only: no file edit, staging, prepared
  task, commit, push, PR action, or GitHub mutation. A clean child branch MAY be
  behind `H` and `R` during preflight.
- **FR-013**: After accepted dispatch, factual launched evidence `L` with
  permissions false and a later activation head `A` that stores `L` and records
  permissions true subject to child revalidation MUST be normally pushed.
  Current remote equality to `A` and ancestry containment of `L` MUST both pass
  while effective child authority remains false.
- **FR-014**: Targeted continuation of the same held child MUST incorporate `A`
  while clean with conditional permissions recorded true but effective
  authority false, verify `L` and all correlated
  identity fields, then acknowledge release. Only that release acknowledgment
  enables implementation or delivery work.
- **FR-015**: Rejected or ambiguous dispatch, identity mismatch, unexpected
  remote descendant, failed `H`/`R`/`L`/`A` commit or push, failed refresh or
  ancestry verification, dirty barrier state, or failed release MUST stop with
  zero child implementation or delivery. Factual `launched` MUST not be rolled
  back merely because `A` or release fails.
- **FR-016**: The child PR MUST target
  `sidecar/272-coordinator-260-live-sidecar-fixture` and contain exactly these
  issue-reference lines: `Related to #274` and `Related to #272`. It MUST NOT
  contain another issue reference or closing wording.

## Prepared Dispatch Identity

The `sidecar-prepared-handoff-v1` fingerprint payload is this exact PowerShell
`[ordered]` object. Field order and the shown string, integer, array, and Boolean
types are part of the contract:

```powershell
$payload = [ordered]@{
    Schema = 'sidecar-prepared-handoff-v1'
    RunId = 'sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb'
    CoordinatorIssueNumber = [int]272
    ChildIssueNumber = [int]274
    CoordinatorBranch = 'sidecar/272-coordinator-260-live-sidecar-fixture'
    CoordinatorRemoteBranch = 'origin/sidecar/272-coordinator-260-live-sidecar-fixture'
    CoordinatorWorktree = 'C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\272-coordinator-260-live-sidecar-fixture'
    ChildBranch = 'sidecar/274-260-fixture-layer1-b'
    ChildWorktree = 'C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\274-260-fixture-layer1-b'
    ControlRevision = 'db175fe0a1911e9ea2a1931ae808b9771f874b57'
    PreparedSpec = 'specs/274-260-fixture-layer1-b/spec.md'
    PreparedPlan = 'specs/274-260-fixture-layer1-b/plan.md'
    PreparedTasks = 'specs/274-260-fixture-layer1-b/tasks.md'
    DependencyLayer = [int]1
    HardDependencies = [int[]]@()
    PrTargetBranch = 'sidecar/272-coordinator-260-live-sidecar-fixture'
    PrRelatedReferences = [string[]]@('Related to #274', 'Related to #272')
    ArtifactPreparationState = 'handoff-ready'
    LaunchState = 'pending'
    ImplementationPermission = $false
    DeliveryPermission = $false
}

$canonicalJson = $payload | ConvertTo-Json -Compress -Depth 4
$sha256 = [System.Security.Cryptography.SHA256]::Create()
try {
    $fingerprint = ([System.BitConverter]::ToString(
        $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonicalJson))
    )).Replace('-', '').ToLowerInvariant()
}
finally {
    $sha256.Dispose()
}
```

The authoritative lowercase 64-hex value, recomputed from the actual Git
context immediately before H, is
`37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba`.
Exact H is `78329c6f45793583d4d0e46a96ad54066989ba8d`; exact R is
`99f34e32de9702ae34301463e32ed3d8ff013932`; this launched-evidence
commit is `L = SELF/HEAD`. The fingerprint remains independent of H/R/L/A and
stable child identity.

Prepared artifact content is validated separately. Artifact-content hashes,
the fingerprint itself, C2r, `H`, `R`, `L`, `A`, and stable child/task/agent
identity are not fingerprint inputs; they remain separate correlation evidence.
No evidence commit is required to contain its own SHA.

## Source Map

The complete child implementation source map contains exactly one path:

- `specs/274-260-fixture-layer1-b/samples/result.md`

## Out of Scope

- Any sibling or coordinator artifact change.
- Any workflow-source, application, product, test-suite, or configuration
  change.
- Issue mutation, public comments, merge operations, rebase, force-push,
  auto-merge, cleanup, or remote cleanup.
- A PR targeting `main` or issue-closing wording from the child branch.
- Preclaiming `launched`, implementation permission, delivery permission,
  release, result content, validation, commit, push, or PR state.
