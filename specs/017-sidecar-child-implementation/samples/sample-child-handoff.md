# Sample Sidecar Child Handoff

This sample is local validation evidence for issue #228. It is not a real
GitHub issue, branch, worktree, pull request, or implementation request.

## Handoff Summary

- **Coordinator issue**: `#900` - `[Workflow] Sample coordinator parallel workflow`
- **Child issue**: `#901` - `[Workflow] Sample child implementation`
- **Dependency layer**: independent candidate after coordinator artifact preparation
- **Target coordinator branch**: `chore/900-sample-coordinator`
- **Target sidecar worktree**: `../catworld-sidecar-901`
- **Pull request target**: coordinator branch only; never `main`

## Required Child Issue Context

- **Child body summary**: Add one prepared workflow validation note to a sample
  documentation file.
- **Labels**: `chore`, `workflow`
- **State**: open
- **Dependencies**: none beyond prepared coordinator artifacts.
- **Out of scope**: branch orchestration, pull request handling, GitHub issue
  mutation, product runtime code, and changes outside the prepared source map.

## Coordinator Context

- The coordinator classified this child as ready for implementation.
- The coordinator artifact contains a child issue map, dependency layers,
  shared contract section, validation plan, and status table.
- The shared contract states that child implementations consume prepared
  artifacts and must not redefine shared workflow routing.

## Prepared Artifacts

- **Prepared spec**: `specs/901-sample-child-implementation/spec.md`
  - Summary: child executor adds only the sample validation note.
- **Prepared plan**: `specs/901-sample-child-implementation/plan.md`
  - Assessment required: No for the sample documentation note.
  - Source map: `docs/sample-sidecar-child.md`.
- **Prepared tasks**: `specs/901-sample-child-implementation/tasks.md`
  - T001 add the sample validation note.
  - T002 run `git diff --check`.
  - T003 review changed files against the prepared source map.

## Shared Contract References

- Coordinator shared contract: `specs/900-coordinator-sample/contracts/shared-workflow.md`
- Child implementation contract: `specs/017-sidecar-child-implementation/contracts/sidecar-child-implementation.md`

The child executor must not redefine the shared contract, create additional
child issues, generate replacement planning artifacts, or expand the child
scope.

## Validation Requirements

- Run `git diff --check`.
- Run `git diff --name-only` and confirm changed files are limited to the
  prepared source map.
- Confirm `.agents/skills/catworld-implement-issue/SKILL.md` is untouched.
- Report validation freshness after the latest relevant change.

## Expected Child Final Report

The child final report must include:

- child issue and coordinator issue;
- target branch and worktree context;
- prepared artifacts consumed;
- changed files;
- validation statuses;
- blockers or not-revalidated evidence;
- confirmation that delivery operations were not attempted unless later
  approved sidecar Git/PR rules are present in the handoff.

## Missing-Context Blocker Example

If the handoff omitted the prepared `plan.md`, the child executor must stop
before implementation and report:

```text
Blocked: prepared child plan.md is missing from the sidecar child handoff.
The child skill cannot generate or replace planning artifacts. Return to the
coordinator artifact-preparation step or provide the prepared plan.
```

## Conflict Blocker Example

If the prepared tasks ask the child to open a pull request targeting `main`,
the child executor must stop before implementation and report:

```text
Blocked: prepared child tasks conflict with the sidecar routing contract.
Sidecar child PRs must target the coordinator branch, and PR rules are owned by
later approved sidecar workflow instructions.
```
