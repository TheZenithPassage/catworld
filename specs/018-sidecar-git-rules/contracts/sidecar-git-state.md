# Contract: Sidecar Git State

The sidecar coordinator artifact must provide enough Git state for coordinator execution, child handoffs, refresh decisions, validation, and cleanup eligibility.

## Required Coordinator State

- Coordinator issue number, title, and slug.
- Coordinator branch name derived deterministically from the coordinator issue number and slug.
- Source ref for the coordinator branch: current `origin/main`.
- Coordinator checkout/worktree path when a local coordinator checkout is used.
- Collision status for the coordinator branch and checkout/worktree.

## Required Child State

For each child issue:

- Child issue number, title, and slug.
- Child branch name derived deterministically from the child issue number and slug.
- Child branch source ref: the coordinator branch.
- Child checkout/worktree path.
- Child PR target branch: the coordinator branch.
- Current status: `planned`, `active`, `merged-to-coordinator`, `refresh-needed`, `refreshed`, `blocked`, or `complete`.
- Last coordinator branch state merged into the child branch, when applicable.
- Validation notes required after refresh.

## Required Safety Rules

- Deterministic names must be computed before creating or reusing sidecar branches or checkouts.
- Branch, checkout, or directory collisions stop execution unless the resource is clearly recoverable as the intended sidecar resource.
- Sidecar child branches must not start from `main`.
- Sidecar child PRs must not target `main` directly.
- Still-active sidecar branches refresh from the coordinator branch by normal merge only.
- Rebase, force-push, and history-rewriting updates are disallowed for sidecar branches.
- Local sidecar worktrees and branches are not deleted after individual child PR merges.
- Local cleanup is eligible only after the final coordinator PR has merged into `main`.
- Local cleanup is limited to branches and worktrees created by the sidecar workflow.
- Remote branch deletion, remote pruning, or any remote cleanup requires explicit user approval.
- Direct child issue work outside `parallel` and closed-child coordinator final passes use the normal sequential Git workflow instead of this sidecar contract.
