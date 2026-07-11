# Sidecar Child Execution Contract

This contract applies only to future activated sidecar coordinator parallel
execution after a coordinator has prepared exactly one child handoff. It does
not change normal sequential issue implementation, direct child issue delivery
outside `parallel`, or closed-child coordinator final passes. The dispatch
barrier below is a narrow two-phase handoff protocol. It is not an atomic
transaction, lock, queue, daemon, polling loop, or generic state subsystem.

## Required Prepared Handoff

A child executor may be accepted in held, preflight-only mode only when the
handoff provides all of these values for exactly one child issue:

- child issue number, title, body, labels, dependencies, validation
  requirements, and out-of-scope boundaries;
- coordinator issue number, coordinator context, dependency layer, and
  coordinator source references;
- prepared child `spec.md`, `plan.md`, and `tasks.md` paths and summaries;
- shared contract references and constraints;
- dependency-ready evidence for the child;
- artifact preparation state `handoff-ready`, factual non-launched state
  (normally `pending`), implementation permission `false`, and delivery
  permission `false`;
- exact pushed coordinator commit containing the handoff-ready evidence, the
  later recorded remote coordinator head, and a stable prepared-handoff
  identity or fingerprint; the current remote coordinator ref must equal that
  later recording head while Git ancestry separately proves that the recording
  head contains the exact earlier evidence commit;
- coordinator branch local and remote refs, coordinator push status, and
  coordinator checkout/worktree path;
- child branch ref, source coordinator branch ref, and child checkout/worktree
  path;
- branch/worktree collision and clean-state evidence;
- child PR delivery permission state, including whether commit, push, and PR
  open/update are permitted for this handoff;
- child PR target branch, which must be the coordinator branch;
- child PR issue-reference wording rules;
- validation commands or manual evidence and freshness requirements;
- final report requirements, blocker categories, and ready/draft rules.

Missing, contradictory, unreadable, or multi-child handoff data is a blocker.
The child executor must not create replacement planning artifacts, repair
coordinator artifact state, or infer missing branch/worktree context.

## Two-Phase Held Dispatch Barrier

The same logical child must retain one stable identity from accepted dispatch
through release. Correlate that identity with the existing run ID, child issue,
child branch, child worktree, handoff-ready evidence SHA and containing record
head, and prepared-handoff identity. A later unrelated child invocation is not
the held child.

The barrier proceeds in this order:

1. The coordinator commits and normally pushes complete `handoff-ready`
   evidence, then creates and pushes one later bookkeeping commit that records
   the evidence SHA. It verifies current remote equality to that recording head
   and separately verifies that the head contains the exact evidence commit by
   ancestry. A tracked artifact never records its own commit SHA.
2. The approved child-agent capability accepts the exact child dispatch and
   returns an unambiguous stable child/task identity while the child remains
   held in preflight-only mode.
3. Held preflight may validate only run and child identity, branch and worktree
   identity, prepared artifact paths and content, dependency layer, current
   remote equality to the recorded handoff-ready head, containment of the exact
   pushed handoff-ready evidence commit by ancestry, and the fact that
   implementation and delivery remain prohibited. It must make zero repository
   or GitHub edits. A clean child branch may still be behind that evidence
   commit at this point.
4. After accepted dispatch, the coordinator factually records `launched` for
   that exact child in a commit, then records that exact factual launched-
   evidence SHA in a later activation/bookkeeping commit when required. It
   normally pushes the current activation head and verifies both fetched remote
   equality to that head and ancestry containment of the factual launched-
   evidence commit. Only that durable activation may grant implementation
   permission and the recorded delivery permission.
5. The held child fetches the current launched activation head, updates its
   still-clean branch by a normal fast-forward or normal merge without
   rewriting history, and verifies that the incorporated head contains the
   exact factual launched-evidence commit plus the matching run ID, child issue,
   branch, worktree, prepared-handoff identity, `launched`, and current
   implementation and delivery permissions.
6. The coordinator releases only the same held child identity. The child must
   confirm that its worktree stayed clean through the barrier. Only then may it
   execute prepared implementation tasks.

Private conversation state is not evidence that the launched update is
durable. Current remote and repository evidence is authoritative.

## Barrier Failure Rules

- Rejected dispatch records no `launched`, records the factual blocker, and
  permits no child edit or delivery.
- Ambiguous dispatch is not retried blindly. No replacement child is launched,
  no `launched` state is recorded, all affected children remain unreleased,
  and execution stops with the ambiguity preserved.
- A launch-evidence or later activation-record commit or normal push failure
  after accepted dispatch keeps the exact child held. Factual dispatch remains
  accepted, but the remote must not be described as containing whichever
  evidence or activation state was not pushed and verified; no child edit or
  delivery may occur.
- A child refresh or launched-evidence verification failure keeps the child
  unreleased and permits no implementation edit or delivery.
- An unexpected remote descendant of the recorded handoff-ready or launched
  activation head fails the equality/freshness gate even when evidence ancestry
  is valid. The child stays held and performs no implementation or delivery.
- A release failure after launched evidence is durable retains factual
  `launched`, reports the child blocked or resume-needed, and permits no child
  implementation or delivery.
- An interruption with `launched` recorded but no verifiable active child is
  ambiguous. Do not infer that the child is running or dispatch a replacement.
- A failure after release retains factual `launched` and reports the child as
  blocked, paused, or resume-needed from current branch, worktree, validation,
  and child-agent evidence. Partial work is never reported as completed.

## Execution Rules

- The child executor implements exactly one child issue.
- Before editing, the child executor confirms the current checkout/worktree and
  current Git branch match the prepared child context; the held-dispatch
  identity matches exactly; the current remote activation head is durable and
  incorporated; that head contains the exact factual launched-evidence commit;
  the launched evidence is verified; implementation permission is true; and
  the exact held child has been released.
- The child executor uses only prepared coordinator artifacts and must not run
  `speckit-specify`, `speckit-plan`, or `speckit-tasks` to replace them.
- The child executor implements only tasks listed in the prepared child
  `tasks.md`.
- Work outside the prepared child source map or out-of-scope boundaries blocks
  execution unless a later approved workflow updates the prepared artifacts.
- Required validation is rerun after relevant changes or reported as stale/not
  run.

## Delivery Rules

When the durable launched handoff explicitly permits delivery, the exact held
child has been released, and repository rules also permit delivery, the child
executor may:

- commit scoped child changes;
- push the child branch with a normal non-force push;
- open or update the child PR.

If delivery permission is missing, the handoff is incomplete and execution
blocks before prepared tasks run. Before durable launched evidence and release,
delivery is prohibited regardless of any private or planned permission. If the
durable launched handoff has implementation permission true but delivery
permission false, prepared task execution may complete after release, but the
child executor must not commit, push, open or update a PR, mutate issues, or
fall back to another workflow; the final report must state that delivery was
not permitted.

The child executor must not merge, approve, enable auto-merge, rebase,
force-push, delete remote branches, prune remotes, clean sidecar resources,
mutate GitHub issues, or post public comments.

The child PR target must be the coordinator branch. It must not be `main`.

The child PR body must contain exactly these two issue references, each as its
own `Related to` line, and no other issue reference anywhere in the body:

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
- stable held child/task identity, run ID, exact handoff-ready evidence SHA and
  recorded remote head, exact factual launched-evidence SHA and current remote
  activation head, release result, and proof the worktree remained clean
  through the barrier;
- prepared artifacts consumed;
- coordinator branch, child branch, child PR target, and checkout/worktree
  context;
- tasks completed and any tasks left incomplete;
- changed files compared with the prepared source map;
- validation commands, reviews, and manual evidence with explicit statuses;
- validation freshness;
- blockers, conflicts, unresolved decisions, stale evidence, or not-run
  evidence;
- delivery permission state and any skipped delivery reason;
- commit hashes when available;
- child PR URL when available;
- PR readiness as ready or draft with the reason;
- current checkout branch.

Reports must never summarize failed, skipped, timed-out, interrupted, partial,
stale, blocked, or not-run validation as passed.
