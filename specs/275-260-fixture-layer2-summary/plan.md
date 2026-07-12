# Implementation Plan: #260 Fixture Layer 2 Summary

**Child issue**: #275

**Coordinator issue**: #272

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Immutable control-plane revision (`C2`)**: `db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control publication evidence (`C2r`)**: `76531c9aa0511c49dfd44eb196913a2600a044da` (separate; never a fingerprint input or workflow source)

**Dependency layer**: 2

**Hard dependencies**: #273 and #274; both merges and refreshed ancestry remain required

**Current factual state**: artifact `prepared`; launch/workflow
`waiting-for-dependency-merge`; implementation/delivery permissions `false`;
no child branch, worktree, authoritative fingerprint, dispatch, stable child
identity, `H`/`R`/`L`/`A`, PR, or result exists

## Summary

Child #275 currently remains waiting. Only after the coordinator observes user-owned merge commits for #273 and #274, refreshes its local branch from the remote coordinator branch, and proves both delivered commits in ancestry may it prepare the child Git context and run the H/R held-preflight plus L/A activation/release barrier. After the same stable child is released, it adds one harmless summary result that consumes both integrated markers and adds `layer2-summary-complete`.

## Technical Context

- **Format**: Markdown.
- **Dependencies**: Existing Git and PowerShell capabilities only.
- **Governing control revision**: exact immutable `C2` commit `db175fe0a1911e9ea2a1931ae808b9771f874b57`.
- **Publication evidence**: `C2r=76531c9aa0511c49dfd44eb196913a2600a044da` proves publication only; it is not the workflow source or a fingerprint input.
- **Storage, application runtime, schema, API, UI, and product behavior**: N/A.
- **Future remote comparison state**: exact activation/recording head `A` fetched from `origin/sidecar/272-coordinator-260-live-sidecar-fixture`, with current remote equality to `A` and ancestry proof that `A` contains factual launched evidence `L`.
- **Implementation scale**: Exactly one new fixture result file; two read-only dependency inputs.

## Constitution Check

- **Domain focus**: Compliant. This is workflow-only validation and adds no product abstraction.
- **Layering, backend authority, schema evolution, and stay invariants**: N/A.
- **Specification and planning discipline**: Compliant. Both hard dependencies, their integration proof, owned path, marker contract, and evidence are explicit before handoff.
- **Focused changes and proportional validation**: Compliant. One owned Markdown file is checked by dependency, source-map, whitespace, run-ID, and marker validation.
- **Operational safety**: Compliant. No secrets, product/operational data, deployment, cleanup, or unrelated GitHub mutation is in scope.

Post-design re-check: compliant. No unresolved product, architecture, persistence, security, shared-contract, or operational decision remains.

## Architecture and Technology Assessment

- **Assessment required**: No.
- **Reason**: One controlled Markdown sample uses existing repository and Git behavior and introduces no architecture, framework, dependency, shared infrastructure, persistence, or product decision.
- **Selected approach**: N/A.
- **Human approval**: Issue #260 explicitly approves this three-child topology, harmless scope, staged sidecar execution, and validation boundary.

## Handoff and Execution Design

1. Preserve the current `prepared` / `waiting-for-dependency-merge` state, permissions false, and absence of child branch, worktree, dispatch, and stable child identity while either dependency gate is incomplete.
2. Confirm current GitHub evidence reports both prerequisite PRs merge-committed into the coordinator branch; refresh the local coordinator from that remote and prove both delivered commits in ancestry.
3. Only then let the coordinator create and validate the exact #275 child
   branch/worktree and compute the canonical `sidecar-prepared-handoff-v1`
   fingerprint. No fingerprint computed before both dependency integrations and
   that exact Git context is authoritative.
4. Commit and normally push handoff-ready evidence `H`, then a later recording head `R` that stores `H`. Fetch the remote coordinator ref, require exact equality to `R`, and prove by ancestry that `R` contains `H`.
5. Dispatch once through the approved held/preflight-only capability and retain
   the returned stable exact child identity. During held preflight and until
   targeted durable continuation begins, that child may validate only the
   immutable control/run/issue/Git/dependency/handoff identity, fingerprint,
   `H`/`R`, and false permissions; it performs zero repository or GitHub
   mutation and makes no branch/worktree change.
6. After accepted dispatch, commit and normally push factual launched evidence `L`, then the later activation/recording head `A` that stores `L`. Fetch the current remote, require equality to `A`, and prove `A` contains `L` by ancestry.
7. Target only the same held child identity. Barrier-only continuation lets it
   fetch and incorporate `A` into its still-clean branch by normal fast-forward
   or normal merge while `A` records conditional permissions true but effective
   implementation/delivery authority remains false. It verifies `L`
   in ancestry plus the matching fingerprint and permission evidence, confirms
   the worktree stayed clean, and acknowledges release. Only that acknowledgment
   makes implementation and later delivery permission effective.
8. Read both integrated dependency result files and verify their run IDs and markers. Add only the owned summary result with the exact run ID, both consumed markers, and `layer2-summary-complete`.
9. Let the released sidecar child delivery workflow create exactly one scoped child commit, then run post-commit focused validation before normal push and PR creation.

## Exact Source Map

| Path | Ownership | Planned use |
|------|-----------|-------------|
| `specs/275-260-fixture-layer2-summary/samples/result.md` | Child #275 only | Add the harmless dependency summary. |
| `specs/273-260-fixture-layer1-a/samples/result.md` | Child #273 | Read-only dependency input. |
| `specs/274-260-fixture-layer1-b/samples/result.md` | Child #274 | Read-only dependency input. |

No other implementation path is approved.

## Validation Evidence Plan

The following validation is future-only and remains `not run` while #275 is waiting. Before the scoped child commit, require completed dependency proof, exact control revision, deterministic fingerprint, stable dispatch identity, `H`/`R` remote equality plus ancestry, `L`/`A` remote equality plus ancestry, clean incorporation of `A`, targeted release, and exactly one untracked owned path. Validate all result tokens directly. After the scoped commit and before push/PR delivery, run:

```powershell
$target = 'origin/sidecar/272-coordinator-260-live-sidecar-fixture'
$expected = 'specs/275-260-fixture-layer2-summary/samples/result.md'

git fetch origin 'refs/heads/sidecar/272-coordinator-260-live-sidecar-fixture:refs/remotes/origin/sidecar/272-coordinator-260-live-sidecar-fixture'
$targetSha = git rev-parse --verify 'refs/remotes/origin/sidecar/272-coordinator-260-live-sidecar-fixture'
if ($LASTEXITCODE -ne 0) { throw 'Remote coordinator ref resolution failed.' }

if ($targetSha -cne $activationHeadA) { throw 'Current remote does not equal activation head A.' }
git merge-base --is-ancestor $launchedEvidenceL $activationHeadA
if ($LASTEXITCODE -ne 0) { throw 'Activation head A does not contain launched evidence L.' }
git merge-base --is-ancestor $activationHeadA HEAD
if ($LASTEXITCODE -ne 0) { throw 'Child head does not incorporate activation head A.' }

$changed = @(git diff --name-only "${target}...HEAD")
if ($LASTEXITCODE -ne 0) { throw 'Name-only diff failed.' }
if ($changed.Count -ne 1 -or $changed[0] -cne $expected) {
    throw "Unexpected child diff: $($changed -join ', ')"
}

git diff --check "${target}...HEAD" -- $expected
if ($LASTEXITCODE -ne 0) { throw 'Explicit-range diff check failed.' }

foreach ($path in @(
    'specs/273-260-fixture-layer1-a/samples/result.md',
    'specs/274-260-fixture-layer1-b/samples/result.md',
    $expected
)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing result: $path" }
}
```

The future handoff supplies literal `$launchedEvidenceL` and `$activationHeadA`, exact prerequisite PR/commit/ancestry checks, `H`/`R`, the deterministic fingerprint, stable held identity, permissions and release evidence, and token checks for all three results. Report every item with the canonical validation vocabulary. Only fresh passing evidence plus the exact two-line child PR contract support ready delivery.

## Risks and Stops

- Stop if either prerequisite lacks current merge-commit or refreshed-ancestry proof.
- Stop if current waiting state is preclaimed as launched or if any branch/worktree, dispatch, permission, edit, or delivery is implied before both dependency gates pass.
- Stop if exact `C2`, issue/run/Git identity, canonical fingerprint, stable child identity, `H`/`R` equality and ancestry, `L`/`A` equality and ancestry, clean activation-head incorporation, permissions, release, dependency marker, source map, or remote coordinator ref is missing or inconsistent. `C2r` is checked only as separate publication evidence and never substituted for `C2`.
- Stop if any fingerprint is treated as current before both dependencies are integrated and the exact #275 Git context exists, or if artifact content/blob hashes, fingerprint self-value, `H`/`R`/`L`/`A`, or agent identity enters the payload.
- Stop if any path other than the owned result differs from the fetched remote coordinator ref.
- Stop rather than changing a dependency, sibling scope, workflow source, product code, or shared marker.
- Stop if the future child PR body is not exactly `Related to #275` and `Related to #272` on separate lines with no other issue reference.

## Future Canonical Fingerprint Contract

After dependency integration and exact Git-context creation, build one
PowerShell `[ordered]` object with exactly these 21 fields in order:
`Schema`, `RunId`, `CoordinatorIssueNumber`, `ChildIssueNumber`,
`CoordinatorBranch`, `CoordinatorRemoteBranch`, `CoordinatorWorktree`,
`ChildBranch`, `ChildWorktree`, `ControlRevision`, `PreparedSpec`,
`PreparedPlan`, `PreparedTasks`, `DependencyLayer`, `HardDependencies`,
`PrTargetBranch`, `PrRelatedReferences`, `ArtifactPreparationState`,
`LaunchState`, `ImplementationPermission`, `DeliveryPermission`.

Use schema literal `sidecar-prepared-handoff-v1`; integer issue/layer values;
ascending integer dependencies `[273, 274]`; exact repository-relative prepared
paths; exact child-then-coordinator PR reference array; `handoff-ready`;
`pending`; Boolean false permissions; and exact lowercase 40-hex `C2`. Serialize
with `ConvertTo-Json -Compress -Depth 4`, encode UTF-8, SHA-256 hash, and render
64 lowercase hex without a prefix. Validate prepared artifact content
independently. Exclude artifact content/blob hashes, the fingerprint itself,
`H`, `R`, `L`, `A`, `C2r`, and child-agent/dispatch identity.
