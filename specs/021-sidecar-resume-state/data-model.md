# Data Model

This feature introduces no CatWorld domain entities, persistence model, API
payloads, schema changes, browser storage, or external service contracts.

It does define workflow artifact state that the sidecar coordinator artifact
must be able to record for resumable coordinator runs.

## Sidecar Coordinator Resume State

| Field | Description | Validation Rule |
|-------|-------------|-----------------|
| `coordinator_issue` | Coordinator GitHub issue number, title, and source references | Required for sidecar coordinator `parallel` execution |
| `coordinator_branch` | Coordinator integration branch used by sidecar execution | Required when sidecar Git state is prepared; must not be `main` |
| `coordinator_checkout` | Local coordinator checkout/worktree path when one exists | Must be recorded when used; missing or colliding state blocks resume until reconciled |
| `child_status_entries` | Status table or equivalent structured section for every child issue | Required; must include completed, active, blocked, pending, paused, or resume-needed status as applicable |
| `child_artifact_path` | Path to the prepared child artifact set | Required for every child status entry |
| `child_branch` | Child implementation branch when created | Required for active or completed child branch work; pending children may record `not started` |
| `child_checkout` | Local child checkout/worktree path when created | Required for active child work; pending children may record `not started` |
| `child_pr` | Child PR identifier or URL when opened | Required after a child PR exists; absent before PR creation |
| `validation_state` | Current validation status and freshness for the child | Must distinguish `passed`, `failed`, `skipped`, `timed out`, `interrupted`, `partial`, `stale`, `not run`, and `blocked` where applicable |
| `workflow_status` | Child workflow status such as `pending`, `active`, `blocked`, `paused`, `resume-needed`, `merged-to-coordinator`, or `complete` | Must be explicit enough for a later session to identify next action |
| `blockers` | Child-specific, coordinator-wide, shared-contract, conflict, or human-only blockers affecting the child | Required when blocked; must identify affected scope and needed action/decision |
| `refresh_state` | Whether an active branch/worktree has incorporated coordinator branch changes after child PR merges | Must identify `not needed`, `needed`, `in progress`, or `refreshed`; refresh method is normal merge only |
| `last_coordinator_state` | Coordinator branch state last known by the child branch/worktree | Required when refresh state is tracked for active work |
| `cleanup_eligibility` | Whether local sidecar cleanup is ineligible, eligible, or completed | Eligible only after final coordinator PR merge to `main`; limited to sidecar-created local branches/worktrees |
| `remote_cleanup_approval` | Whether explicit user approval exists for remote cleanup | Required before any remote branch deletion, remote pruning, or remote cleanup |

## State Transitions

1. Coordinator preflight and artifact preparation record a child status entry
   for every listed child issue.
2. Pending children record artifact path and status without implying a branch,
   checkout, PR, or validation exists.
3. Active children record branch, checkout/worktree, validation state, refresh
   state, and blockers when present.
4. When a child PR is merged into the coordinator branch, completed child state
   remains recorded and still-active child branches/worktrees that need the
   latest coordinator state move to `refresh_state: needed`.
5. Active child branches/worktrees are refreshed from the coordinator branch by
   normal merge only, then affected validation becomes `stale` or `not run`
   until rerun.
6. Blocked children record the blocker category, affected scope, and required
   next action or human decision.
7. Local cleanup remains ineligible after individual child PR merges.
8. After the final coordinator PR has merged into `main`, local cleanup becomes
   eligible only for local branches and worktrees created by the sidecar
   workflow.
9. Remote cleanup remains blocked unless explicit user approval exists.
10. Closed-child coordinator final passes use normal sequential state handling
    and do not use this sidecar resume state.
