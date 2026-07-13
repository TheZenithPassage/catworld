# Sidecar Coordinator Artifact Contract

This contract defines the objective review target for issue #252. It describes
future sidecar coordinator behavior and remains dormant for real product use
until #261 activates sidecar routing.

## Artifact Location

The coordinator artifact path is:

```text
specs/<coordinator-number>-coordinator-<slug>/
```

The path may be computed during preflight. Path computation is not permission
to write files. Artifact file writes are allowed only after Codex has created
or entered the active coordinator branch/worktree.

## Required Artifact Sections

The coordinator orchestration artifact must include:

- run identity or equivalent durable state sufficient to prove same-run resume;
- coordinator issue number, title, URL, labels, and state;
- inspected child issue list;
- parent epic and source references when relevant;
- child issue map;
- dependency layers;
- hard dependencies;
- conflict risks;
- independent candidates;
- unresolved blockers;
- shared implementation contract;
- child-owned surfaces;
- shared surfaces requiring caution;
- branch and worktree plan;
- PR target plan;
- validation plan;
- resume/status table;
- stop conditions;
- final coordinator PR plan.

## Write Gate

The workflow may plan artifact paths and content before branch/worktree
preparation, including while the active checkout is `main`.

The workflow must not write coordinator artifact files while the active checkout
is `main`. If the active checkout is `main`, Codex must stop or create/enter
the coordinator branch/worktree before writing. If Codex cannot create or enter
the coordinator branch/worktree safely, it must stop before modifying files.

Local `main` must remain clean: no sidecar artifacts, sidecar commits, or
untracked sidecar files.

## Existing Artifact Handling

Before writing, the workflow must check for existing coordinator artifacts with
the same coordinator number or target path.

An existing artifact can be resumed only when recorded factual metadata proves
it belongs to the same coordinator run. The artifact must match the coordinator
issue number, URL, title/source context, computed artifact path, and recorded
sidecar run identity or equivalent durable state.

If ownership cannot be proven, the workflow stops on collision before writing.
The workflow must not overwrite, merge, delete, rename, or silently reuse a
colliding artifact.

## Factual State Updates

The workflow must update the artifact when factual run state changes, including:

- blocked state;
- child handoff readiness;
- child PR creation;
- user merge observation;
- stale validation;
- next-layer readiness;
- final PR readiness;
- cleanup eligibility.

Updates must distinguish planned, ready, blocked, created, observed, stale,
passed, failed, pending, and eligible states. The artifact must not imply that
branches, worktrees, pull requests, validation results, merges, or cleanup
eligibility exist before they actually exist.

## Blocked Coordinator Behavior

When a coordinator is blocked and artifact writing is allowed, the artifact
records the blocker, affected scope, evidence read, and required user action
where applicable. A blocked coordinator must not launch child work.

## Validation Contract

Validation must include:

- a simulated valid coordinator with at least three child issues and required
  artifact sections;
- simulation that planning the artifact while current checkout is `main` writes
  no files;
- simulation that writing occurs only after entering a coordinator
  branch/worktree;
- simulation of existing same-number artifact same-run resume and collision
  stop behavior;
- simulation of blocked coordinator artifact state without child launch;
- verification that local `main` remains clean after artifact planning;
- `git diff --check`.
