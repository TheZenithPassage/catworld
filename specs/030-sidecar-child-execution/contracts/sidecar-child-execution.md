# Sidecar Child Execution Contract

This contract applies only to future activated sidecar coordinator parallel
execution after a coordinator has prepared exactly one child handoff. It does
not change normal sequential issue implementation, direct child issue delivery
outside `parallel`, or closed-child coordinator final passes.

## Required Prepared Handoff

A child executor may start only when the handoff provides all of these values
for exactly one child issue:

- child issue number, title, body, labels, dependencies, validation
  requirements, and out-of-scope boundaries;
- coordinator issue number, coordinator context, dependency layer, and
  coordinator source references;
- prepared child `spec.md`, `plan.md`, and `tasks.md` paths and summaries;
- shared contract references and constraints;
- dependency-ready evidence for the child;
- coordinator branch local and remote refs, coordinator push status, and
  coordinator checkout/worktree path;
- child branch ref, source coordinator branch ref, and child checkout/worktree
  path;
- branch/worktree collision and clean-state evidence;
- child PR target branch, which must be the coordinator branch;
- child PR issue-reference wording rules;
- validation commands or manual evidence and freshness requirements;
- final report requirements, blocker categories, and ready/draft rules.

Missing, contradictory, unreadable, or multi-child handoff data is a blocker.
The child executor must not create replacement planning artifacts, repair
coordinator artifact state, or infer missing branch/worktree context.

## Execution Rules

- The child executor implements exactly one child issue.
- Before editing, the child executor confirms the current checkout/worktree and
  current Git branch match the prepared child context.
- The child executor uses only prepared coordinator artifacts and must not run
  `speckit-specify`, `speckit-plan`, or `speckit-tasks` to replace them.
- The child executor implements only tasks listed in the prepared child
  `tasks.md`.
- Work outside the prepared child source map or out-of-scope boundaries blocks
  execution unless a later approved workflow updates the prepared artifacts.
- Required validation is rerun after relevant changes or reported as stale/not
  run.

## Delivery Rules

When the handoff and repository rules permit delivery, the child executor may:

- commit scoped child changes;
- push the child branch with a normal non-force push;
- open or update the child PR.

The child executor must not merge, approve, enable auto-merge, rebase,
force-push, delete remote branches, prune remotes, clean sidecar resources,
mutate GitHub issues, or post public comments.

The child PR target must be the coordinator branch. It must not be `main`.

The child PR body must include issue references only in this form:

```md
Related to #<child-issue>
Related to #<coordinator-issue>
```

The body must not use closing keywords for either issue.

The child PR is ready only when required validation is fresh and passed, the PR
target and issue wording are valid, and no unresolved blocker affects the
child. If required validation is failed, skipped, timed out, interrupted,
partial, stale, not run, or blocked, the child PR must be draft/not-ready unless
the non-passed evidence is explicitly outside readiness and the report explains
why.

## Final Report Rules

Child final reports must include:

- child issue and coordinator issue;
- prepared artifacts consumed;
- coordinator branch, child branch, child PR target, and checkout/worktree
  context;
- tasks completed and any tasks left incomplete;
- changed files compared with the prepared source map;
- validation commands, reviews, and manual evidence with explicit statuses;
- validation freshness;
- blockers, conflicts, unresolved decisions, stale evidence, or not-run
  evidence;
- commit hashes when available;
- child PR URL when available;
- PR readiness as ready or draft with the reason;
- current checkout branch.

Reports must never summarize failed, skipped, timed-out, interrupted, partial,
stale, or not-run validation as passed.
