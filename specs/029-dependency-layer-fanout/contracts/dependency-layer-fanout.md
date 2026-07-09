# Contract: Dependency-Layer Fan-Out and Child Handoffs

This contract defines the objective review target for issue #255. It describes
future sidecar workflow behavior and remains dormant for real product use until
#261 activates sidecar routing.

## Fan-Out Readiness

The sidecar coordinator may attempt child handoff launch only after:

- coordinator preflight, source-of-truth review, child issue inspection, and
  dependency classification have passed;
- coordinator and child artifacts are safely prepared;
- the coordinator branch/worktree exists and owns artifact writing;
- child branch/worktree state is ready for the first dependency-ready layer;
- shared implementation contract state is present and non-conflicting;
- the local Codex environment exposes an approved child-agent/subagent
  execution capability.

If child-agent/subagent execution is unavailable, the coordinator stops and
records a capability blocker. It must not silently use the sequential issue
workflow instead.

## Dependency Layers

Dependency layers are built from:

- child issue dependencies;
- hard dependency state;
- current coordinator branch merge state;
- shared implementation contract state;
- conflict risks;
- prepared artifact state;
- child branch/worktree state;
- current repository evidence.

The coordinator launches at most one dependency-ready layer at a time. Later
layers remain pending or waiting for dependency merges until prerequisite child
PRs are merged into the coordinator branch and current coordinator state records
that merge observation.

Children with unresolved shared-contract blockers or non-mechanical conflict
risks requiring user guidance are not launch-ready.

## Child Handoff

Each launched child agent receives exactly one child issue and one prepared
handoff. The handoff includes:

- coordinator issue context and relevant source references;
- child issue body, title, state, labels, dependencies, validation
  requirements, and out-of-scope boundaries;
- prepared child `spec.md`, `plan.md`, and `tasks.md` paths and content
  summaries;
- shared implementation contract references and constraints;
- dependency layer and readiness evidence;
- coordinator branch/worktree context;
- child branch/worktree context;
- child PR target rules;
- issue-reference wording rules;
- validation commands or manual evidence;
- explicit blocker, freshness, refresh, and cleanup reporting expectations.

The handoff must instruct the child agent not to:

- regenerate `spec.md`, `plan.md`, or `tasks.md`;
- redefine shared contracts;
- create sibling scope;
- mutate GitHub issues, labels, comments, milestones, or assignees;
- target `main` for sidecar child branches or child PRs.

## Coordinator Artifact Status

The coordinator artifact records every child with one of these launch states:

- `launched`: the child handoff was sent to a child agent for the current
  dependency-ready layer;
- `blocked`: the child cannot launch because a blocker affects it or the layer;
- `pending`: the child is not in the currently launched layer;
- `waiting-for-dependency-merge`: the child is in a later layer that depends on
  prerequisite child work being merged into the coordinator branch.

Every non-launched child must include a clear reason. The artifact must not
imply that child work, child branches, child worktrees, child PRs, validation,
or merges exist before those states are real.

## Validation Contract

Validation must include:

- simulation of a coordinator with three independent children that produces
  three child handoffs for one layer;
- simulation of hard dependencies where only the first layer launches;
- simulation of a shared-contract blocker that stops affected fan-out;
- simulation of unavailable child-agent capability that stops instead of
  falling back to sequential implementation;
- review of sample child handoff contents against the sidecar child skill
  requirements;
- review that coordinator artifacts record launched, blocked, pending, and
  waiting-for-dependency-merge states with non-launch reasons;
- `git diff --check`.
