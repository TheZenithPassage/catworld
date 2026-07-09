# Data Model

This feature introduces no CatWorld domain entities, persistence model, API
payloads, schema changes, browser storage, external contracts, or application
runtime data.

It does define structured workflow state that sidecar coordinator artifacts
must record:

## Sidecar Git Resource Plan

- Coordinator issue number, title, and slug.
- Deterministic coordinator branch name.
- Deterministic coordinator checkout/worktree path.
- For each active child issue: issue number, title, slug, deterministic child
  branch name, and deterministic child checkout/worktree path.
- Collision status for each planned branch, checkout/worktree, directory, and
  artifact path.

## Coordinator Git State

- Source ref for future sidecar coordinator branch creation: current
  `origin/main`.
- Actual local coordinator branch ref.
- Actual remote coordinator branch ref after successful normal non-force push.
- Coordinator checkout/worktree path.
- Push status: `not attempted`, `pushed`, or `blocked`.
- Blocker details when push or checkout/worktree preparation is unsafe.

## Child Git State

- Child issue number and deterministic child branch name.
- Child branch source ref: coordinator integration branch.
- Child checkout/worktree path.
- Child PR target plan: coordinator integration branch.
- Isolation status from sibling child worktrees and the coordinator worktree.
- Workflow status: `planned`, `prepared`, `active`, `blocked`,
  `waiting-for-user-merge`, `merged-to-coordinator`, `refresh-needed`,
  `refreshed`, or `complete`.

## Validation Rules

- Existing resources can be reused only when current sidecar state proves
  same-run ownership.
- Unproven collisions stop before branch/worktree creation, artifact writing,
  push, or child delivery.
- Child branches must never use `main` as their base.
- Child PR delivery remains blocked until the remote coordinator branch exists.
