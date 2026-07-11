# Feature Specification: #260 Fixture Layer 1A

**Child issue**: [#273](https://github.com/TheZenithPassage/catworld/issues/273)

**Coordinator issue**: [#272](https://github.com/TheZenithPassage/catworld/issues/272)

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Immutable control revision (`C2`)**:
`db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control report head (`C2r`, separate evidence)**:
`76531c9aa0511c49dfd44eb196913a2600a044da`

**Authoritative prepared-handoff fingerprint**:
`32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`

**Dependency layer**: 1

**Hard dependencies**: None

**Current prepared state**: artifact preparation `handoff-ready`; launch
`launched`; workflow `held`; implementation permission `false`;
delivery permission `false`

**Barrier evidence**: `H = 78329c6f45793583d4d0e46a96ad54066989ba8d`;
`R = 99f34e32de9702ae34301463e32ed3d8ff013932`; `L = SELF/HEAD` in
this launched-evidence commit; `A` remains pending; stable child-agent identity
is `/root/held_child_273_live`

## Goal

Create one harmless Markdown result that proves child #273 can execute as an
independent first-layer child in the controlled #260 sidecar run. The result
must contain the stable run ID and the shared marker `layer1-a-complete`.

## Acceptance Scenarios

1. **Given** the prepared trio names immutable control revision `C2`, the exact
   actual/planned Git and PR identities, and the canonical v1 payload, **when**
   the authoritative fingerprint is recomputed immediately before H, **then** it equals
   `32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`
   while `C2r` remains separate evidence and the current state is
   `handoff-ready` / `launched` / `held` with both permissions false, literal
   H/R, `L = SELF/HEAD`, no A, and stable identity
   `/root/held_child_273_live`.
2. **Given** coordinator #272 has committed and pushed exact handoff-ready
   evidence `H` and a later recording head `R` containing `H`, **when** current
   fetched remote equality to `R` and ancestry from `H` are proven, **then** one
   real child #273 dispatch may enter held preflight with launch still
   `pending` and both permissions false.
3. **Given** that held dispatch, **when** child #273 verifies the exact run,
   issue, branch, worktree, control revision, prepared artifacts, dependency
   layer, literal `H`, current `R`, and deterministic prepared-handoff
   fingerprint, **then** it returns one stable canonical identity and performs
   zero repository or GitHub mutation.
4. **Given** unambiguous held-dispatch acceptance, **when** coordinator #272
   commits/pushes factual launched evidence `L` and later activation head `A`,
   **then** the fetched remote ref equals `A`, `A` contains `L` by ancestry, and
   the same child remains non-editing until targeted release.
5. **Given** exact durable `L`/`A` evidence, **when** targeted continuation lets
   that same child incorporate `A` by an allowed normal fast-forward or merge
   while `A` records conditional permissions true but effective authority
   remains false, verifies the
   correlated launch evidence while clean, and acknowledges release, **then**
   and only then are implementation and delivery enabled subject to their
   normal completion gates.
6. **Given** the owned result file is added, **when** it is inspected, **then**
   it contains both `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`
   and `layer1-a-complete`.
7. **Given** the exact remote coordinator branch has been fetched, **when** the
   child diff is compared with that ref, **then** exactly the owned result file
   appears and the explicit-range whitespace check passes.
8. **Given** rejected or ambiguous dispatch, failed evidence/recording push,
   failed refresh or ancestry/identity verification, failed release, or an
   interruption with no verifiable exact held child, **when** the workflow
   evaluates the failure, **then** implementation and delivery stop with the
   factual state preserved and no replacement child is inferred or launched.

## Requirements

- **FR-001**: The implementation MUST add only
  `specs/273-260-fixture-layer1-a/samples/result.md`.
- **FR-002**: The result MUST be harmless workflow-fixture Markdown and MUST
  contain the exact stable run ID and marker `layer1-a-complete`.
- **FR-003**: Child #273 MUST remain a layer-1 independent candidate with no
  hard dependencies and no reliance on sibling #274.
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
  child implementation skill. The scoped commit occurs only at the prepared
  delivery gate between pre-commit checks and post-commit readiness validation.
- **FR-008**: The handoff MUST name immutable control revision `C2`
  `db175fe0a1911e9ea2a1931ae808b9771f874b57`, exact child branch
  `sidecar/273-260-fixture-layer1-a`, and exact child worktree
  `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\273-260-fixture-layer1-a`.
- **FR-009**: The current state MUST remain artifact preparation
  `handoff-ready`, launch `launched`, workflow `held`, and
  implementation/delivery permissions false. Exact H is
  `78329c6f45793583d4d0e46a96ad54066989ba8d`, exact R is
  `99f34e32de9702ae34301463e32ed3d8ff013932`, and this `L = SELF/HEAD`
  launched-evidence commit records accepted stable identity
  `/root/held_child_273_live`. A and release remain absent.
- **FR-010**: The canonical `sidecar-prepared-handoff-v1` fingerprint MUST use
  exactly the 21 ordered fields, serialization, UTF-8 encoding, and lowercase
  SHA-256 procedure below. Its authoritative value, recomputed from the actual
  Git context immediately before H, is
  `32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`
  and remains independent of H/R/L/A and agent identity.
- **FR-011**: A held dispatch MUST be accepted only with one unambiguous stable
  canonical child/task identity correlated to the exact fingerprint, `H`, and
  `R`. During held preflight and before durable `L`/`A` continuation, that child
  MUST NOT edit, stage, execute prepared tasks, commit, push, open/update a PR,
  mutate GitHub, or change branch/worktree state. The later targeted continuation
  grants only the bounded fetch/incorporation checks required before release.
- **FR-012**: Only after accepted dispatch may coordinator #272 record factual
  `launched`. Exact launched evidence `L` and later activation/recording head
  `A` MUST be normally pushed and fetched; the current remote ref MUST equal
  `A`, and `A` MUST contain `L` by ancestry. The exact child MUST incorporate
  `A`, verify all correlated evidence and a clean worktree, and acknowledge
  targeted release before implementation or delivery becomes effective.
- **FR-013**: Rejection MUST record no `launched` and a factual blocker;
  ambiguity MUST create no retry or duplicate; failed launch/record push,
  refresh, incorporation, ancestry/identity verification, or pre-release
  interruption MUST keep the child held; release failure MUST retain factual
  `launched` as blocked or resume-needed. Every such failure permits zero child
  implementation or delivery, and an unverifiable launched child MUST NOT be
  replaced blindly.
- **FR-014**: A future child PR MUST target
  `sidecar/272-coordinator-260-live-sidecar-fixture` and contain exactly these
  issue-reference lines: `Related to #273` and `Related to #272`. It MUST contain
  no other issue reference anywhere in the PR body, including no #260 reference,
  and MUST use no closing keyword.

## Canonical Prepared-Handoff Fingerprint v1

The canonical preimage is the JSON produced from this exact 21-property
PowerShell `[ordered]` object. Integer literals are integers,
`HardDependencies` is an ascending integer array (empty here),
`PrRelatedReferences` is the exact child-then-coordinator string array, and the
permission values are Booleans:

```powershell
$canonicalPreparedHandoff = [ordered]@{
    Schema = 'sidecar-prepared-handoff-v1'
    RunId = 'sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb'
    CoordinatorIssueNumber = 272
    ChildIssueNumber = 273
    CoordinatorBranch = 'sidecar/272-coordinator-260-live-sidecar-fixture'
    CoordinatorRemoteBranch = 'origin/sidecar/272-coordinator-260-live-sidecar-fixture'
    CoordinatorWorktree = 'C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\272-coordinator-260-live-sidecar-fixture'
    ChildBranch = 'sidecar/273-260-fixture-layer1-a'
    ChildWorktree = 'C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\273-260-fixture-layer1-a'
    ControlRevision = 'db175fe0a1911e9ea2a1931ae808b9771f874b57'
    PreparedSpec = 'specs/273-260-fixture-layer1-a/spec.md'
    PreparedPlan = 'specs/273-260-fixture-layer1-a/plan.md'
    PreparedTasks = 'specs/273-260-fixture-layer1-a/tasks.md'
    DependencyLayer = 1
    HardDependencies = [int[]]@()
    PrTargetBranch = 'sidecar/272-coordinator-260-live-sidecar-fixture'
    PrRelatedReferences = [string[]]@('Related to #273', 'Related to #272')
    ArtifactPreparationState = 'handoff-ready'
    LaunchState = 'pending'
    ImplementationPermission = $false
    DeliveryPermission = $false
}

$canonicalJson = $canonicalPreparedHandoff | ConvertTo-Json -Compress -Depth 4
$utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($canonicalJson)
$sha256 = [System.Security.Cryptography.SHA256]::Create()
try {
    $fingerprint = -join (
        $sha256.ComputeHash($utf8Bytes) |
            ForEach-Object { $_.ToString('x2') }
    )
} finally {
    $sha256.Dispose()
}
```

The result MUST be the lowercase 64-hex value
`32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`.
The separate control report head `C2r`
`76531c9aa0511c49dfd44eb196913a2600a044da`, artifact content/blob hashes,
the fingerprint itself or another artifact self-identity, `H`, `R`, `L`, `A`,
and any child-agent or dispatch identity are never inputs. Prepared artifact
content is validated separately from this identity fingerprint.

The literal fingerprint in these handoff-ready artifacts is authoritative
runtime identity evidence: coordinator #272 verified the actual branch and
worktree context against every planned Git field and recomputed the exact
canonical payload immediately before exact H
`78329c6f45793583d4d0e46a96ad54066989ba8d`.

## Dispatch State Contract

| Barrier point | Preparation | Launch | Workflow | Implementation / delivery |
|---------------|-------------|--------|----------|---------------------------|
| Initial artifact state at `421b2ac250c05c59eb3cade06b4056e02a6c8415` | `prepared` | `pending` | `pending` | false / false |
| Current L launched evidence; A pending | `handoff-ready` | `launched` | `held` | false / false |
| Future remote `H`/`R` verified | `handoff-ready` | `pending` | `held-preflight` | false / false |
| Stable dispatch accepted | `handoff-ready` | factual dispatch accepted; durable record still `pending` | `held-preflight` | false / false |
| Future remote `L`/`A` verified | `handoff-ready` | `launched` | `release-pending` | recorded true / effective false; child revalidation and release remain required |
| Targeted continuation incorporated `A` cleanly | `handoff-ready` | `launched` | `release-pending` | recorded true / effective false; release acknowledgement is still required |
| Exact child released | `handoff-ready` | `launched` | `released` then `active` | true / true, still subject to task, validation, target, wording, and blocker gates |

## Source Map

The complete child implementation source map contains exactly one path:

- `specs/273-260-fixture-layer1-a/samples/result.md`

## Out of Scope

- Any sibling or coordinator artifact change.
- Any workflow-source, application, product, test-suite, or configuration
  change.
- Issue mutation, public comments, merge operations, rebase, force-push,
  auto-merge, cleanup, or remote cleanup.
- A PR targeting `main` or issue-closing wording from the child branch.
