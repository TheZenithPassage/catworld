# Quickstart: Final Coordinator Validation and PR Delivery

## Prerequisites

- Work from the issue branch for #258 created from the latest
  `origin/workflow/sidecar-buildout`.
- Before final validation, fetch `origin/workflow/sidecar-buildout` and use its
  current SHA as the #258 implementation base/freshness/merge-base reference.
- Do not mutate GitHub issues, labels, comments, milestones, or assignees.
- Do not create or merge real sidecar coordinator PRs as validation fixtures.
- Keep the #261 activation gate, normal sequential workflow, parallel child
  skill, legacy coordinator skill, and cleanup implementation unchanged.
- Distinguish this build-out PR (`Related to #258`, target
  `workflow/sidecar-buildout`) from future final sidecar PRs (closing keywords,
  coordinator source, `main` target).
- Runtime scenarios still use fetched `origin/main` as the future final PR
  target-base reference; they must never substitute the build-out branch.

## Validation Commands

Verify all prepared children are integrated by refreshed coordinator ancestry:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario all-integrated
```

Expected: two or more child commits are present in refreshed coordinator HEAD,
all ledger rows are uniquely `integrated`, and final validation may begin.

Verify incomplete child states stop finalization:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario incomplete-children
```

Expected: unmerged, active, blocked, pending, dependency-incomplete, missing,
duplicate, and unexpected child states prevent validation and PR delivery.

Verify conflicting evidence stops finalization:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario evidence-mismatch
```

Expected: current GitHub/repository evidence wins over private context and a
mismatch with artifact state is reported as a blocker.

Verify required integrated command accounting:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario integrated-validation
```

Expected: prior attempts remain historical, every requirement has exactly one
current readiness result for the evaluated coordinator state, and child
evidence does not replace integrated runs.

Verify final readiness rejects every non-passing status:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario validation-readiness
```

Expected: `failed`, `skipped`, `timed out`, `interrupted`, `partial`, `stale`,
`blocked`, and `not run` each prevent any final PR create/update attempt.

Verify relevant branch changes stale earlier evidence:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario validation-staleness
```

Expected: advancing coordinator HEAD invalidates affected evidence until rerun.

Verify the approved two-head runtime finalization sequence:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario two-head-finalization
```

Expected: complete checks run at `H`; `H2` directly descends from `H`; only the
finalization artifact changes; artifact-affected checks rerun at `H2`;
unaffected `H` evidence has an explicit applicability reason; a normal
non-force push makes the fetched remote coordinator ref equal H2; rejected
pushes block without force; and no `H3` records the PR URL.

Verify unrelated integrated changes block delivery:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario scope-drift
```

Expected: fetched `origin/main` remains separate from unchanged local `main`;
its target-base SHA and merge base are recorded and rechecked; the PR-equivalent
merge-base diff is reconciled with combined source maps; and an injected
unrelated path blocks readiness.

Verify final PR rendering and ready-only delivery:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario final-pr-delivery
```

Expected: the actual final template renders child traceability, explicit fresh
passed validation, scope review, remaining risks, closing references,
coordinator source, `main` target, and ready state.

Verify an existing same-run final PR is not duplicated:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario existing-final-pr
```

Expected: current PR evidence is reused, any permitted update remains
validation-gated, and stale/inconsistent existing PR evidence stops with a
required user action rather than creating a duplicate or silently mutating
readiness.

Verify artifact and final report state:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario artifact-final-state
```

Expected: the artifact records `B`, literal `H`, `H2` as `SELF/HEAD`, expected
parent and sole-path delta proof, H results, the H2 rerun manifest, pending H2
readiness, template blob/render-input requirements, and applicability rationale; current
evidence/final reporting carries resolved H2 statuses, remote-source proof,
final scope/readiness, rendered-body fingerprint, and observed PR URL; cleanup remains
`ineligible` with reason `pending final PR merge`; and no `H3` stores the URL.

Verify closing keywords remain isolated to the final template:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario closing-keyword-isolation
```

Expected: the final template uses `Closes`, while the child template uses only
`Related to` and never targets `main`.

Verify prohibited operations remain blocked:

```powershell
.\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario prohibited-operations
```

Expected: no merge, approval, auto-merge, issue mutation, public comment, new
child layer, cleanup, deletion, rebase, force-push, force-with-lease, history
rewrite, sequential fallback, or routing activation is permitted.

## Current #258 H/H2 Delivery Verification

After every implementation task is complete, the temporary `AGENTS.md` pointer
is restored, implementation is committed as `H`, and the complete required
suite passes at exactly `H`:

1. Create `H2` as a direct child containing only
   `specs/032-final-coordinator-delivery/finalization.md`.
2. In that artifact record literal build-out base `B`, literal `H`, `H2` as
   `SELF/HEAD`, expected parent `H`, the sole allowed delta path, checks run at
   `H`, commands required to rerun at `H2`, and applicability reasons. Do not
   preclaim the post-commit H2 results in the artifact; record their actual
   statuses in the final report.
3. Run the verifier at `H2`:

```powershell
.\specs\032-final-coordinator-delivery\validation\verify-finalization-evidence.ps1 -RepositoryPath . -ArtifactPath specs/032-final-coordinator-delivery/finalization.md -ExpectedBaseSha <B> -ExpectedImplementationHeadSha <H>
```

Expected: actual `HEAD` is the resolved H2, `HEAD^` is `H`, `H..HEAD` contains
only the finalization artifact, artifact fields match, and required H2 commands
are listed without preclaiming their post-commit results. The exact canonical H
and H2 check ID sets and render-input requirement set from the contract are
present with no omissions, extras, or duplicates.

Then rerun every artifact-affected check, including artifact schema/evidence
validation, `git diff --check <H>..HEAD`, and the full feature range check
`git diff --check <B>...HEAD`. Record actual post-H2 statuses externally. Push
H2 normally to the #258 remote work branch, fetch that ref, and prove it equals
local HEAD. Fetch `origin/workflow/sidecar-buildout` again and recheck `B`, merge
base, ancestry, local/remote `HEAD = H2`, validation freshness, and existing
#258 PR state. Stop on any rejected push, relevant movement, or inconsistency;
never force. Do not create H3/H4 or write the returned PR URL into the branch.

Confirm out-of-scope skills remain unchanged:

```powershell
git diff --name-only <B>...HEAD -- .agents/skills/catworld-implement-issue/SKILL.md .agents/skills/catworld-parallel-child-implementation/SKILL.md .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md
```

Expected: no output.

Review the executable coordinator finalization source:

```powershell
Select-String -Path .agents\skills\catworld-parallel-coordinator\SKILL.md -Pattern "complete child|SELF/HEAD|pending H2 checks|artifact-only|origin/main|merge base|remote coordinator|ready final|pending final PR merge|no draft|H3"
```

Expected: matches cover terminal child accounting, approved two-head evidence,
normal remote H2 verification, ready-only runtime delivery to `main`, cleanup
ineligibility, and prohibited fallback/extra-commit behavior.

Review architecture and runtime template alignment:

```powershell
Select-String -Path docs\ARCHITECTURE.md,.github\PULL_REQUEST_TEMPLATE\README.md,.github\PULL_REQUEST_TEMPLATE\sidecar-final-coordinator-to-main.md -Pattern 'SELF/HEAD|pending H2 checks|origin/main|workflow/sidecar-buildout|Related to #258|Target branch: `main`|Remaining risks|pending final PR merge'
```

Expected: runtime sources preserve coordinator-to-`main` final delivery, and
their explicit build-out notes distinguish the temporary #258 implementation
target without substituting it into the runtime contract.

Run final whitespace validation:

```powershell
git diff --check
```

Expected: no whitespace errors.

Rerun every affected scenario after relevant late edits. Report any check that
cannot be rerun as stale or not revalidated rather than passed.
