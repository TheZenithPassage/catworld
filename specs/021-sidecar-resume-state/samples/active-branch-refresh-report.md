# Sample: Active Branch Refresh After Child PR Merge

Coordinator issue: #220
Merged child: #229
Active child: #232
Blocked child: #233
Workflow: sidecar coordinator parallel

## Resume Event

The user merged child PR #301 for child issue #229 into the coordinator branch
`sidecar/220-coordinator-parallel-workflow`.

A later session resumes the coordinator run. Before acting, it re-reads the
coordinator issue, child issues, child PRs, coordinator artifact, child
artifacts, coordinator branch, active child branch, local checkout/worktree
state, validation evidence, blockers, cleanup eligibility, and remote cleanup
approval state.

## Refresh State

| Child | Workflow Status | Branch / Checkout | Refresh State | Required Action |
|-------|-----------------|-------------------|---------------|-----------------|
| #229 | complete | retained for traceability | not needed | No local cleanup after individual child PR merge |
| #232 | active | `sidecar/232-sidecar-resume-state` at `C:\worktrees\catworld-sidecar\232-sidecar-resume-state` | needed | Refresh from coordinator branch using normal merge only |
| #233 | blocked | `sidecar/233-sidecar-split-handoff` at `C:\worktrees\catworld-sidecar\233-sidecar-split-handoff` | not needed until blocker resolves | Stop for shared-contract blocker guidance |

## Validation Evidence

| Evidence | Status | Freshness | Notes |
|----------|--------|-----------|-------|
| #232 validation before #229 merge | stale | not fresh | Coordinator branch changed after the evidence was collected |
| Normal merge refresh from coordinator branch | passed | fresh | Refresh used `git merge` from the coordinator branch |
| #232 validation after refresh | not run | not fresh | Must be rerun before #232 can be reported ready |
| #233 blocker review | blocked | current | Shared-contract blocker still requires user guidance |

## Prohibited Operations Review

- No rebase was used for active child refresh.
- No force-push was used.
- No history-rewriting update was used.
- No local sidecar branch or worktree was deleted after the #229 child PR
  merge.
- No remote branch deletion, remote pruning, or remote cleanup occurred.

## Readiness

Child #232 is not ready because affected validation is stale/not run after the
refresh. Child #233 remains blocked. The coordinator branch cannot be reported
ready until active and blocked child state is resolved with fresh validation.
