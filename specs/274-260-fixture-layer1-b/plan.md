# Implementation Plan: #260 Fixture Layer 1B

**Child issue**: #274

**Coordinator issue**: #272

**Stable run ID**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

**Dependency layer**: 1

**Hard dependencies**: None

**Immutable control revision (C2)**: `db175fe0a1911e9ea2a1931ae808b9771f874b57`

**Control report head (C2r; separate evidence)**: `76531c9aa0511c49dfd44eb196913a2600a044da`

**Prepared-handoff fingerprint (authoritative)**: `37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba`

**Current state / permissions**: `handoff-ready` / `launched` / `release-pending`; recorded `true` / `true`, effective `false` / `false`

**Current barrier evidence / child identity**: exact H is
`78329c6f45793583d4d0e46a96ad54066989ba8d`; exact R is
`99f34e32de9702ae34301463e32ed3d8ff013932`; exact L is
`08f8588dab15ab0e1991733f43d4a74e44deda4e`; `A = SELF/HEAD` in this
activation/recording commit records conditional authority for stable identity
`/root/held_child_274_live`. Release remains absent. No
result has been implemented.

## Summary

Coordinator #272 prepares child #274 to add one harmless result file containing
the exact run ID and shared marker `layer1-b-complete`. Immutable control
revision C2 `db175fe0a1911e9ea2a1931ae808b9771f874b57` governs a two-phase held
dispatch: exact handoff-ready evidence/recording heads precede read-only
preflight, and exact launched evidence/activation heads plus same-child release
precede implementation and delivery.

## Technical Context

- **Format**: Markdown.
- **Dependencies**: Existing Git and PowerShell capabilities only.
- **Storage, application runtime, schema, API, UI, and product behavior**: N/A.
- **Remote comparison ref**:
  `origin/sidecar/272-coordinator-260-live-sidecar-fixture`.
- **Child branch**: `sidecar/274-260-fixture-layer1-b`.
- **Child worktree**:
  `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\274-260-fixture-layer1-b`.
- **Coordinator worktree**:
  `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\272-coordinator-260-live-sidecar-fixture`.
- **Control source**: immutable pushed revision
  C2 `db175fe0a1911e9ea2a1931ae808b9771f874b57`; runtime files do not copy its
  control-plane delta. C2r `76531c9aa0511c49dfd44eb196913a2600a044da`
  is separate report evidence and is not a fingerprint input.
- **Implementation scale**: Exactly one new fixture result file.

## Constitution Check

- **Domain focus**: Compliant. This is workflow-only validation and introduces
  no product abstraction.
- **Layering, backend authority, schema evolution, and stay invariants**: N/A;
  no application layer or product behavior changes.
- **Specification and planning discipline**: Compliant. The issue, coordinator,
  run identity, ownership, marker, dependency state, and validation evidence are
  explicit before handoff.
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
  its harmless scope, staged sidecar execution, and validation boundary.

## Handoff and Execution Design

1. The exact run, child/coordinator issues, layer, branch, worktree, control
   revision, artifact paths, one-file source map, and deterministic
   prepared-handoff fingerprint were verified. The fingerprint was recomputed
   from the exact ordered `sidecar-prepared-handoff-v1` payload immediately
   before exact H `78329c6f45793583d4d0e46a96ad54066989ba8d`.
2. Exact H `78329c6f45793583d4d0e46a96ad54066989ba8d` and recording head R
   `99f34e32de9702ae34301463e32ed3d8ff013932` are remote-durable; R stores
   H, remote equality to R passed, and H is R's direct parent.
3. Held dispatch returned unambiguous stable canonical identity
   `/root/held_child_274_live`, correlated the exact envelope, and remained
   clean, preflight-only, and unable to implement or deliver.
4. Exact L `08f8588dab15ab0e1991733f43d4a74e44deda4e` records factual
   launched evidence with permissions false and is remote-durable. This
   `A = SELF/HEAD` activation head stores L and records permissions true subject
   to child revalidation; effective child authority remains false.
5. Before release, require current remote equality to exact `A` plus ancestry
   proof that `A` contains `L`. Through targeted continuation of the same held
   child, fetch `A`, update the still-clean child branch by allowed fast-forward
   or normal merge without rebase/history rewriting while conditional
   permissions are recorded true but effective authority remains false, and
   verify the complete run/issue/Git/fingerprint/identity evidence.
6. Acknowledge release only through that targeted continuation of the same
   stable canonical child identity. Release acknowledgment enables work; only
   then may the child add the owned result with the exact run ID and marker
   `layer1-b-complete`.
7. Prove pre-commit status contains only the owned new file and validate its
   content directly. Let the prepared sidecar child workflow create one scoped
   commit, then run post-commit validation before normal push and PR creation.

The prepared tasks never independently authorize branch creation, editing,
commit, push, or PR operations. Before exact `A` incorporation and release
acknowledgment, effective implementation and delivery authority remains false
even when `A` records conditional permissions true and factual `launched`
exists.

## Prepared Fingerprint Contract

The exact ordered 21-field PowerShell payload and all literal values are defined
in `spec.md`. It is serialized only with
`ConvertTo-Json -Compress -Depth 4`; SHA-256 is computed over its UTF-8 bytes
and rendered as lowercase 64-hex. The authoritative recomputed value is
`37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba`.
The payload binds schema, run and issue integers, coordinator branch/remote/
worktree, child branch/worktree, C2, the exact three prepared artifact paths,
layer `1`, sorted empty integer dependency array, PR target, ordered child then
coordinator `Related to` lines, `handoff-ready`, `pending`, and both Boolean
permissions `false`.

Prepared artifact content is validated separately. Artifact-content hashes,
the fingerprint itself, C2r, `H`, `R`, `L`, `A`, and child/task/agent identity
are excluded from the fingerprint and retained as separate correlation evidence.

## Barrier State Model

| Point | Preparation | Launch | Workflow | Implementation / Delivery | Required evidence |
|-------|-------------|--------|----------|---------------------------|-------------------|
| Initial artifact at `421b2ac250c05c59eb3cade06b4056e02a6c8415` | `prepared` | `pending` | `pending` | false / false | Immutable control revision and planned fingerprint before child Git creation |
| Current A activation evidence; release pending | `handoff-ready` | `launched` | `release-pending` | recorded true / effective false | H/R/L literal; `A = SELF/HEAD`; `/root/held_child_274_live` |
| Remote handoff ready | `handoff-ready` | `pending` | `held-preflight` | false / false | Exact `H`; current remote equals later `R`; `R` stores and contains `H` |
| Held dispatch accepted | `handoff-ready` | `pending` | `held-preflight` | false / false | Stable canonical child identity; zero-edit proof |
| Factual launch pushed, activation pending | `handoff-ready` | `launched` | `held` | false / false | Exact `L`; failure to push `A` retains launch but grants no permission |
| Activation durable and incorporated | `handoff-ready` | `launched` | `held` | recorded true / effective false | Targeted same-child continuation; clean incorporation; current remote equals `A`; `A` stores and contains `L`; release still required |
| Same child released | `handoff-ready` | `launched` | `released` | true / true, subject to tasks and validation | Clean incorporation of `A`, verified `L`, targeted release acknowledgment |

## Exact Source Map

| Path | Ownership | Planned change |
|------|-----------|----------------|
| `specs/274-260-fixture-layer1-b/samples/result.md` | Child #274 only | Add the harmless layer-1 result with the stable run ID and `layer1-b-complete` marker. |

No other implementation path is approved.

## Validation Evidence Plan

Before release, record exact `H`, `R`, `L`, `A`, stable canonical child/task
identity, and the zero-edit status/HEAD proof. At held preflight, `git ls-remote`
must equal `R` while `git merge-base --is-ancestor H R` succeeds; do not require
the child `HEAD` itself to equal or contain `H`. Before release, fetch current
coordinator evidence, require exact remote equality to `A`, require
`git merge-base --is-ancestor L A`, incorporate `A` while clean, and verify the
same canonical identity and fingerprint.

Run the following focused implementation check only after release
acknowledgment, from the prepared child checkout after the scoped child commit
and before normal push or PR creation:

```powershell
$target = 'origin/sidecar/272-coordinator-260-live-sidecar-fixture'
$expected = 'specs/274-260-fixture-layer1-b/samples/result.md'

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
    'layer1-b-complete'
)) {
    if (-not $result.Contains($token)) { throw "Missing token: $token" }
}
```

Report each command or review as `passed`, `failed`, `skipped`, `timed out`,
`interrupted`, `partial`, `stale`, `blocked`, or `not run`. Only fresh passing
evidence supports ready child delivery.

## Child PR Contract

The ready PR targets `sidecar/272-coordinator-260-live-sidecar-fixture`. Its only
issue-reference lines are exactly:

```md
Related to #274
Related to #272
```

The PR body contains no other issue reference and no closing wording. The run's
control traceability remains in the issue, artifacts, run ID, fingerprint, and
immutable control revision rather than another PR-body reference.

## Risks and Stops

- Stop if the handoff, checkout, branch, issue identities, run ID, dependency
  state, control revision, fingerprint, source map, or coordinator ref is
  missing or inconsistent.
- Stop if exact `H`/`R` or `L`/`A` identities are missing, if current remote is
  not exactly `R` at preflight or exactly `A` at release, or if the required
  ancestry proof fails even when another descendant contains the evidence.
- Stop on rejected or ambiguous dispatch, duplicate/replacement child attempt,
  canonical identity mismatch, lost held child, or non-zero pre-release edit.
- Stop on any failed `H`, `R`, `L`, or `A` commit/push, child refresh, activation
  incorporation, evidence verification, clean-state check, or release. Retain
  factual `launched` when dispatch occurred; do not infer permission or retry a
  replacement blindly.
- Stop if any path other than the owned result differs from the fetched remote
  coordinator ref.
- Stop rather than changing sibling scope, shared workflow sources, product
  code, or the approved marker.
- Stop on a wrong PR target, any issue reference beyond the exact child and
  coordinator lines, closing wording, stale validation, or non-ready evidence.
