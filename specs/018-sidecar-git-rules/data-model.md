# Data Model

This feature introduces no CatWorld domain entities, persistence model, API payloads, schema changes, browser storage, or external service contracts.

It does define workflow artifact state that the sidecar coordinator artifact must be able to record.

## Coordinator Artifact Git State

| Field | Description | Validation Rule |
|-------|-------------|-----------------|
| `coordinator_issue` | Coordinator GitHub issue number and slug | Required for sidecar coordinator `parallel` execution |
| `coordinator_branch` | Deterministic coordinator integration branch created from current `origin/main` | Required; must not be `main`; collision stops unless clearly recoverable |
| `coordinator_checkout` | Optional local checkout/worktree path for coordinator integration work | Required when coordinator execution needs a local checkout; collision stops unless clearly recoverable |
| `child_branches` | Map of child issue number to deterministic child branch name | Each child branch starts from `coordinator_branch`; child branch must not target `main` |
| `child_checkouts` | Map of child issue number to isolated checkout/worktree path | Each active child implementation has one isolated local checkout/worktree |
| `child_pr_targets` | Map of child issue number to intended PR base branch | Must equal `coordinator_branch` for sidecar child PRs |
| `refresh_status` | For each active child, whether it has merged the latest coordinator branch state after another child PR merge | Refresh method must be normal merge only; rebase and history rewriting are disallowed |
| `cleanup_status` | Whether local sidecar cleanup is ineligible, eligible, or completed | Eligible only after the final coordinator PR has merged into `main`; limited to local sidecar resources |
| `remote_cleanup_approval` | Whether explicit user approval exists for remote branch deletion or pruning | Required before any remote cleanup; absent approval means remote cleanup is blocked |

## State Transitions

1. Coordinator preflight approves explicit sidecar `parallel` execution.
2. Coordinator branch and coordinator checkout/worktree are prepared or recorded from current `origin/main`.
3. Child branches and isolated child checkouts/worktrees are prepared or recorded from the coordinator branch.
4. Child PR guidance records the coordinator branch as the child PR base.
5. After the user merges a child PR into the coordinator branch, still-active child branches refresh by normal merge from the coordinator branch.
6. Local cleanup remains ineligible until the final coordinator PR has merged into `main`.
7. After final coordinator PR merge, local cleanup may remove only sidecar-created local branches/worktrees; remote cleanup remains blocked without explicit user approval.
