# Implementation Plan: #260 Fixture Layer 1A

**Child issue**: #273

**Coordinator issue**: #272

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Immutable control revision (`C2`)**:
`db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control report head (`C2r`, separate evidence)**:
`76531c9aa0511c49dfd44eb196913a2600a044da`

**Expected prepared-handoff fingerprint**:
`32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`

**Dependency layer**: 1

**Hard dependencies**: None

**Current state**: artifact preparation `prepared`; launch `pending`; workflow
`pending`; implementation permission `false`; delivery permission `false`; no
`H`, `R`, `L`, `A`, or child-agent identity exists

## Summary

Coordinator #272 prepares child #273 to add one harmless result file containing
the exact run ID and shared marker `layer1-a-complete`. The child validates its
work against the exact freshly fetched remote coordinator branch and reports
the source-map result back to the sidecar child workflow for delivery handling.
Before any implementation, the corrected non-atomic held-dispatch barrier from
immutable control revision `C2`
`db175fe0a1911e9ea2a1931ae808b9771f874b57`
must preserve one canonical child identity across read-only preflight, durable
factual launch evidence, activation-head incorporation, and targeted release.

## Technical Context

- **Format**: Markdown.
- **Dependencies**: Existing Git and PowerShell capabilities only.
- **Storage, application runtime, schema, API, UI, and product behavior**: N/A.
- **Remote comparison ref**:
  `origin/sidecar/272-coordinator-260-live-sidecar-fixture`.
- **Child branch**: `sidecar/273-260-fixture-layer1-a`.
- **Child worktree**:
  `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\273-260-fixture-layer1-a`.
- **Implementation scale**: Exactly one new fixture result file.

## Constitution Check

- **Domain focus**: Compliant. This is workflow-only validation and introduces
  no product abstraction.
- **Layering, backend authority, schema evolution, and stay invariants**: N/A;
  no application layer or product behavior changes.
- **Specification and planning discipline**: Compliant. The issue, coordinator,
  run identity, immutable control revision, held-dispatch evidence and identity,
  ownership, marker, dependency state, and validation evidence are explicit
  before handoff.
- **Focused changes and proportional validation**: Compliant. One owned
  Markdown file is checked by exact source-map, whitespace, run-ID, and marker
  validation.
- **Operational safety**: Compliant. No secrets, operational data, deployment,
  cleanup, or unrelated Git/GitHub mutation is in scope.

Post-design re-check: compliant. No unresolved product, architecture,
persistence, security, shared-contract, or operational decision remains.

## Architecture and Technology Assessment

- **Assessment required**: No.
- **Reason**: Adding one controlled Markdown fixture result uses existing
  repository and Git capabilities and introduces no architecture, framework,
  dependency, shared infrastructure, persistence strategy, or product decision.
- **Selected approach**: N/A; no architecture decision is being made.
- **Human approval**: Issue #260 explicitly approves this controlled fixture,
  its harmless scope, staged sidecar execution, validation boundary, and the
  narrowly scoped non-atomic two-phase held child-dispatch barrier. No generic
  transaction, lock, queue, daemon, IPC service, or polling mechanism is added.

## Handoff and Execution Design

The artifact-preparation state, factual launch state, workflow state, and
permissions are separate. Their current values are `prepared`, `pending`,
`pending`, and false/false respectively. `H`, `R`, `L`, `A`, and a child-agent
identity are not yet assigned. Control report head `C2r`
`76531c9aa0511c49dfd44eb196913a2600a044da` is separate evidence, not a
lifecycle head or fingerprint input.

### Canonical planned handoff identity

The canonical payload contains exactly these 21 properties in this order:
`Schema`, `RunId`, `CoordinatorIssueNumber`, `ChildIssueNumber`,
`CoordinatorBranch`, `CoordinatorRemoteBranch`, `CoordinatorWorktree`,
`ChildBranch`, `ChildWorktree`, `ControlRevision`, `PreparedSpec`,
`PreparedPlan`, `PreparedTasks`, `DependencyLayer`, `HardDependencies`,
`PrTargetBranch`, `PrRelatedReferences`, `ArtifactPreparationState`,
`LaunchState`, `ImplementationPermission`, `DeliveryPermission`.

The exact planned values are:

- schema `sidecar-prepared-handoff-v1`, run
  `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`, coordinator integer `272`,
  and child integer `273`;
- coordinator branch `sidecar/272-coordinator-260-live-sidecar-fixture`, remote
  branch `origin/sidecar/272-coordinator-260-live-sidecar-fixture`, and
  worktree
  `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\272-coordinator-260-live-sidecar-fixture`;
- child branch `sidecar/273-260-fixture-layer1-a` and worktree
  `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\273-260-fixture-layer1-a`;
- control revision `db175fe0a1911e9ea2a1931ae808b9771f874b57`;
- prepared paths `specs/273-260-fixture-layer1-a/spec.md`,
  `specs/273-260-fixture-layer1-a/plan.md`, and
  `specs/273-260-fixture-layer1-a/tasks.md`;
- dependency layer integer `1`, ascending integer dependencies `[]`, PR target
  `sidecar/272-coordinator-260-live-sidecar-fixture`, and exact ordered string
  references `Related to #273`, then `Related to #272`;
- artifact preparation `handoff-ready`, launch `pending`, and Boolean
  implementation/delivery permissions false/false.

Build those fields as the exact PowerShell `[ordered]` object recorded in
`spec.md`, serialize with `ConvertTo-Json -Compress -Depth 4`, hash its UTF-8
bytes with SHA-256, and render lowercase 64-hex. The expected/planned result is
`32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`.
Artifact content/blob hashes, artifact self-identity or the fingerprint itself,
`C2r`, `H`, `R`, `L`, `A`, and agent/dispatch identity are not inputs;
prepared artifact content is validated separately.

The literal fingerprint remains expected/planned until the actual branch and
worktree context exists. Coordinator #272 must match every actual Git identity
to the planned value and recompute the canonical fingerprint immediately before
creating `H`.

1. After actual child Git context exists, validate exact child/run/branch/
   worktree/artifact identities, validate the artifact contents separately, and
   recompute the canonical fingerprint. Any mismatch stops before `H`.
2. Commit/push future handoff-ready evidence `H` while launch remains `pending`
   and implementation/delivery permissions remain false. Resolve literal `H`
   only after commit creation.
3. In one later bounded recording commit `R`, store exact `H` and the already
   recomputed prepared-handoff fingerprint. Push/fetch `R`, require the current
   remote coordinator ref to equal `R`, and prove `H` is its ancestor. Neither
   `H` nor `R` changes or enters the fingerprint preimage.
4. The exact child branch/worktree may still be clean and behind `R`. Dispatch
   it once through the stable preflight-only capability. It may read and verify
   the immutable identity and evidence only; it performs zero repository or
   GitHub mutation, changes no branch/worktree state, and executes no prepared
   task. Its workflow state is the standard `held-preflight`.
5. Accept dispatch only when it returns one unambiguous stable canonical
   child/task identity correlated to that exact handoff and the child
   acknowledges preflight with implementation/delivery permissions false.
   Rejection records a factual blocker; ambiguity stops without retry or
   duplicate.
6. After both first-layer held dispatches are accepted, coordinator #272 records
   factual `launched` and the exact stable identities in evidence commit `L`,
   then uses one later activation/recording commit `A` to store exact `L`, the
   release-pending state, and permissions true subject to child revalidation.
   Push/fetch normally, require the current remote ref to equal `A`, and prove
   `L` is its ancestor. Effective child authority remains false.
7. Only after durable remote `L`/`A` evidence, target the same #273 canonical
   identity with exact `H`, `R`, `L`, `A`, and the fingerprint. This targeted
   continuation grants only barrier work: fetch current evidence, incorporate
   `A` into the still-clean child branch by allowed fast-forward or normal
   merge, and verify the correlated run/child/Git/launch evidence and clean
   state. Although `A` records conditional permissions true, effective
   implementation/delivery authority remains false throughout incorporation.
8. The exact child then acknowledges release. Only that acknowledgement enables
   implementation and delivery permissions; prepared task execution may begin,
   and delivery remains subject to its additional gates.
9. Add the owned result with the exact stable run ID and marker
   `layer1-a-complete`, prove pre-commit status contains only that new file, and
   validate its content directly.
10. Let the released sidecar child workflow create one scoped commit, then run
   the post-commit focused validation before normal push and PR creation.

The prepared tasks do not independently authorize branch, commit, push, or PR
operations. Preflight executes none of them. They occur only after durable
`L`/`A` evidence, clean activation-head incorporation, exact-identity release,
and the validated sidecar child implementation skill at the explicit task
boundary below.

## Exact Source Map

| Path | Ownership | Planned change |
|------|-----------|----------------|
| `specs/273-260-fixture-layer1-a/samples/result.md` | Child #273 only | Add the harmless layer-1 result with the stable run ID and `layer1-a-complete` marker. |

No other implementation path is approved.

## Validation Evidence Plan

Run from the prepared child checkout after the scoped child commit and before
normal push or PR creation:

```powershell
$target = 'origin/sidecar/272-coordinator-260-live-sidecar-fixture'
$expected = 'specs/273-260-fixture-layer1-a/samples/result.md'

git fetch origin 'refs/heads/sidecar/272-coordinator-260-live-sidecar-fixture:refs/remotes/origin/sidecar/272-coordinator-260-live-sidecar-fixture'
git rev-parse --verify 'refs/remotes/origin/sidecar/272-coordinator-260-live-sidecar-fixture'

$changed = @(git diff --name-only "${target}...HEAD")
if ($LASTEXITCODE -ne 0) { throw 'Name-only diff failed.' }
if ($changed.Count -ne 1 -or $changed[0] -cne $expected) {
    throw "Unexpected child diff: $($changed -join ', ')"
}

git diff --check "${target}...HEAD" -- $expected
if ($LASTEXITCODE -ne 0) { throw 'Explicit-range diff check failed.' }

$result = Get-Content -LiteralPath $expected -Raw
foreach ($token in @(
    'sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb',
    'layer1-a-complete'
)) {
    if (-not $result.Contains($token)) { throw "Missing token: $token" }
}
```

Report each command or review as `passed`, `failed`, `skipped`, `timed out`,
`interrupted`, `partial`, `stale`, `blocked`, or `not run`. Only fresh passing
evidence supports ready child delivery.

## Risks and Stops

- Stop if the handoff, checkout, branch, issue identities, run ID, dependency
  state, immutable `C2`, separate `C2r` evidence, source map, or remote
  coordinator ref is missing or inconsistent.
- The current absence of `H`, `R`, `L`, `A`, and child-agent identity is the
  factual prepared state. Once a future barrier phase begins, stop if its
  required evidence is missing, the current remote ref does not equal the named
  current recording/activation head, or required ancestry fails.
- Stop before `H` if actual Git context differs from the planned canonical
  values or recomputation does not produce
  `32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`.
  Never repair the fingerprint by adding artifact hashes, self-identity,
  `C2r`, `H`/`R`/`L`/`A`, or agent identity to its preimage.
- Rejected dispatch records no `launched` and blocks factually. Ambiguous
  dispatch is not retried and creates no replacement. A launch or recording
  commit/push failure keeps the exact child held with no edit or delivery.
- Stop held on refresh, activation-head incorporation, clean-state,
  launched-evidence ancestry, permission, or identity verification failure.
  The bounded incorporation occurs with conditional permissions recorded true
  in `A` but effective child authority false.
  Release failure retains factual `launched` but permits no implementation or
  delivery. After interruption, an unverifiable launched child is not inferred
  active and is never replaced blindly.
- Stop if any path other than the owned result differs from the fetched remote
  coordinator ref.
- Stop rather than changing sibling scope, shared workflow sources, product
  code, or the approved marker.

## Child PR Contract

The future PR targets `sidecar/272-coordinator-260-live-sidecar-fixture`. Its
body contains exactly these two issue-reference lines and no other issue
reference anywhere in the body:

```md
Related to #273
Related to #272
```

It contains no #260 reference and no closing keyword. Ready status additionally
requires released exact-child evidence, completed scope, fresh passing
validation, correct target/wording, and no blocker.
