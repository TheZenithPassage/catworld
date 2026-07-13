# Contract: Sidecar Branch Worktree Orchestration

This contract defines the objective review target for issue #254. It describes
future sidecar workflow behavior and remains dormant for real product use until
#261 activates sidecar routing.

## Coordinator Branch and Worktree Contract

- Fetch current `origin/main` before creating a future sidecar coordinator
  branch.
- Do not update, merge into, commit on, or deliver from local `main`.
- Compute deterministic coordinator branch and checkout/worktree names before
  creating, switching, pushing, writing artifacts, or reusing resources.
- Create one coordinator integration branch from current `origin/main`.
- Create or enter one isolated coordinator checkout/worktree before writing
  sidecar coordinator or child artifacts.
- Write sidecar artifacts only inside the coordinator branch/worktree.
- Push the coordinator integration branch to `origin` with a normal non-force
  push before child PR delivery can occur.
- Record the local coordinator branch ref, remote coordinator branch ref, push
  status, and coordinator checkout/worktree path in the coordinator artifact.

## Child Branch and Worktree Contract

- Child branch/worktree preparation starts only for a dependency-ready layer.
- Compute deterministic child branch and checkout/worktree names before
  creating or reusing any child resource.
- Create each active child branch from the coordinator integration branch, not
  from `main`.
- Create one isolated child checkout/worktree per active child branch.
- Record each child branch name, checkout/worktree path, base coordinator
  branch, isolation status, and child PR target plan in the coordinator
  artifact.
- Child PR delivery remains blocked until the remote coordinator branch exists.

## Collision and Dirty-State Contract

- Check required worktrees for dirty state before creating, switching, pushing,
  writing sidecar artifacts, or preparing child delivery.
- Stop and report dirty paths when a required worktree is dirty.
- Stop on branch, checkout/worktree, directory, or artifact path/name
  collisions unless durable sidecar state proves same-run ownership.
- Do not guess, overwrite, delete, silently reuse, or automatically rename
  colliding resources.

## Prohibited Operations

The sidecar branch/worktree flow must not:

- update local `main`;
- merge into local `main`;
- create child branches from `main`;
- target sidecar child PRs directly at `main`;
- rebase sidecar branches;
- force-push sidecar branches;
- use `--force-with-lease` for sidecar branches;
- perform history-rewriting remote updates;
- delete local sidecar branches or worktrees after individual child PR merges;
- mutate GitHub issues, labels, comments, milestones, assignees, or issue
  state without explicit user approval in a workflow that permits it.

## Validation Contract

Validation must include:

- temporary Git repository simulation covering coordinator branch creation from
  fetched current `origin/main` while local `main` is stale and remains
  unchanged, clean, and free of sidecar artifact writes;
- temporary Git repository simulation covering normal non-force push of the
  coordinator branch to `origin` before child PR delivery;
- temporary Git repository simulation covering at least two child branches
  created from the coordinator branch;
- checkout/worktree isolation verification;
- collision simulation that creates real existing coordinator branch,
  coordinator worktree path, child branch, and child worktree path collisions
  in the temporary repository;
- dirty-working-tree simulation;
- unsafe coordinator branch push simulation that stops before child PR
  delivery;
- prohibited-operation review for rebase, force-push, history rewriting,
  direct child branch from `main`, sidecar write to local `main`, local `main`
  updates, and sidecar branch/worktree deletion after individual child PR
  merges;
- `git diff --check`.
