# Sidecar Child Implementation Contract

## Purpose

The sidecar child implementation skill executes exactly one child issue from a coordinator-prepared handoff. It is not a replacement for the normal sequential issue implementation workflow.

## Applicability

Use the sidecar child implementation skill only when all of these are true:

- a sidecar coordinator parallel workflow has prepared child artifacts;
- the child handoff identifies exactly one child issue;
- the handoff includes the required inputs listed below;
- the target is a coordinator branch/worktree context, not `main`;
- the child issue is dependency-ready according to the prepared dependency status.

Do not use the sidecar child skill for:

- normal implementable issues;
- direct child issue end-to-end requests outside coordinator `parallel` mode;
- coordinator final passes after all child issues are closed;
- coordinator preflight or artifact preparation;
- branch orchestration, PR routing, GitHub issue mutation, cleanup, or adoption dry-run behavior.

## Required Handoff Inputs

Each sidecar child handoff must include:

- child issue number, title, body, labels, state, dependencies, and out-of-scope boundaries;
- coordinator issue number, title, relevant coordinator body excerpts, child issue map, and dependency layer;
- prepared child `spec.md` path and content summary;
- prepared child `plan.md` path and content summary, including decision/approval state;
- prepared child `tasks.md` path and task set;
- shared contract references and constraints from the coordinator artifacts;
- validation requirements and freshness expectations;
- target coordinator branch and worktree context;
- expected final report format and delivery boundaries.

## Stop Conditions

The child skill must stop before implementation when:

- any required handoff input is missing;
- prepared artifacts conflict with the child issue, coordinator context, source-of-truth docs, or repository state;
- the child dependency status is unresolved or blocked;
- shared contracts are missing, ambiguous, unsafe, or need a human decision;
- the requested target is `main` or target branch/worktree context is absent;
- the child scope would expand beyond prepared artifacts;
- the handoff asks the child skill to generate specs, plans, tasks, coordinator artifacts, branches, pull requests, or GitHub issue mutations.

## Execution Contract

When ready, the child skill:

1. Reads all governing context named in the handoff.
2. Verifies the prepared spec, plan, tasks, shared contract, validation requirements, and dependency status.
3. Executes only the prepared child tasks.
4. Runs the required validation for the child scope.
5. Reports blockers, validation status, changed files, branch/worktree state, and any coordinator integration notes.

The child skill must not redefine shared contracts, invent missing decisions, or generate replacement planning artifacts.

## Validation Contract

Validation for #228 must prove:

- one local sample child handoff can be produced from prepared artifacts;
- the sidecar child skill requires the prepared inputs above;
- missing or conflicting context produces a blocker report;
- `.agents/skills/catworld-implement-issue/SKILL.md` is not modified or called as part of sidecar child execution;
- closed-child coordinator final passes remain in the existing sequential workflow.
