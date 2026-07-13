# Data Model

No CatWorld application data model changes are introduced. This feature adds no
domain entities, persistence model, API payloads, schema changes, browser
storage, or external application contracts.

The only structured data is sidecar workflow state already represented in
coordinator artifacts, child artifacts, and handoffs. Issue #257 extends those
workflow concepts:

- **Coordinator Resume Evidence**: Current GitHub and repository evidence read
  before continuation, including coordinator issue, child issues, child PRs,
  remote/local branch state, worktree state, artifacts, validation freshness,
  blockers, and cleanup approval.
- **Coordinator Refresh State**: Whether the remote coordinator branch has been
  fetched, whether local coordinator branch/worktree state matches or has been
  updated from the remote branch by fast-forward or normal merge, and whether
  local changes, divergence, conflicts, or stale evidence block resume.
- **Child Integration State**: Per-child status derived from child issue state,
  child PR state, whether the PR merge is present in the remote coordinator
  branch, and whether local coordinator state has been refreshed from that
  remote branch.
- **Active Child Refresh State**: Per-active-child indication that refresh is
  not needed, needed, refreshed by normal merge from the updated local
  coordinator branch, stale, conflicted, or unsafe.
- **Dependency Layer State**: Recomputed grouping of integrated, active,
  blocked, pending, waiting-for-dependency-merge, and ready-next-layer children
  after observed merges and refresh.
- **Validation Freshness State**: Per-validation evidence using `passed`,
  `failed`, `skipped`, `timed out`, `interrupted`, `partial`, `stale`,
  `blocked`, or `not run`, with affected evidence marked stale after
  coordinator or active child refresh until rerun.
- **Blocker and Cleanup Approval State**: Durable blocker categories and
  cleanup approval evidence that resume reads and preserves. Cleanup execution
  remains out of scope.

These states are workflow/reporting artifacts, not application persistence.
