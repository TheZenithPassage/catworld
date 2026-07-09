# Prepared Child Artifact Contract

This contract applies only to future sidecar coordinator `parallel` execution
after #261 activates the sidecar route. During the current build-out it is a
source-of-truth contract and validation target, not permission to launch child
agents.

## Child Artifact Identity

Each listed child issue in a valid coordinator run has exactly one planned child
artifact directory:

```text
specs/<child-issue-number>-<child-slug>/
```

The child issue number is the uniqueness key. The slug is derived from the child
issue title using the sidecar artifact slug rule: lowercase, hyphen-separated,
and stripped of issue type prefixes such as `[Workflow]`, `feat:`, `fix:`, or
`docs:`.

Each child artifact directory contains:

- `spec.md`;
- `plan.md`;
- `tasks.md`.

## Required Inputs

Prepared child artifacts derive from current, read-only evidence:

- coordinator issue body, title, state, labels, and source references;
- child issue body, title, state, labels, dependencies, and source references;
- parent epic context when relevant;
- coordinator orchestration artifact;
- shared implementation contract;
- dependency layer classification;
- repository source-of-truth documentation;
- current repository state.

The coordinator must not use private conversation context as the source for
child artifacts.

## Write Boundary

Child artifact paths and contents may be planned before coordinator
branch/worktree preparation. Planning does not create files or directories.

Child artifact files and directories may be written only after Codex has
created or entered the coordinator branch/worktree. If the active checkout is
`main`, Codex must stop or create/enter the coordinator branch/worktree before
writing child artifacts. If Codex cannot create or enter the coordinator
branch/worktree safely, it must stop before modifying files.

Local `main` must remain clean: no child sidecar artifacts, sidecar commits, or
untracked sidecar files.

## Scope and Decision Boundaries

Prepared child artifacts must preserve the child issue scope exactly. They must
not include sibling child scope, reopen closed sibling scope, or create
implementation tasks for work owned by another child.

Prepared child artifacts must not make human-only product, architecture,
security, persistence, UX, domain, GitHub, deployment, or workflow decisions.
When a child requires an unresolved human-only decision, the coordinator records
the blocker and stops affected delegation.

Missing or conflicting shared implementation contract state blocks delegation.
The coordinator must not invent a seed, foundation, or shared-contract child
issue to resolve the blocker.

## Collision and Resume Rules

Before writing child artifacts, the coordinator checks:

- duplicate child issue numbers in the coordinator set;
- existing target child artifact directories;
- existing same-number child artifact prefixes under `specs/`;
- current sidecar run identity and coordinator artifact state.

The coordinator may resume a child artifact path only when durable current
sidecar state proves it belongs to the same resumable coordinator run. If
ownership cannot be proven, preparation stops before writing. The coordinator
does not overwrite, merge, delete, rename, or silently reuse collided child
artifact paths.

## Coordinator Artifact Status

The coordinator artifact records each child artifact path and preparation
status. Status values distinguish at least:

- `planned`: path and content are planned but not written;
- `blocked`: preparation cannot proceed and the blocker is recorded;
- `prepared`: `spec.md`, `plan.md`, and `tasks.md` have been written in the
  coordinator branch/worktree;
- `handoff-ready`: prepared artifacts have passed required validation and can be
  included in a dependency-ready child handoff.

## Delegation Gate

Fan-out cannot start for a dependency-ready child unless:

- `spec.md`, `plan.md`, and `tasks.md` are safely prepared;
- the coordinator artifact records the child artifact path and preparation
  status;
- shared implementation contract state is present and non-conflicting;
- child scope validation confirms no sibling scope leakage;
- branch/worktree context is valid under the sidecar Git rules;
- handoff context includes the prepared artifact path and instructs the child
  executor to consume, not regenerate, the artifacts.
