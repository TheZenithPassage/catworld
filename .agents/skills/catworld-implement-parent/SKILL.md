---
name: "catworld-implement-parent"
description: "Explicitly orchestrate one CatWorld parent GitHub issue by delegating its incomplete implementation children through the existing issue workflow, integrating their ready pull requests, and delivering one accumulated parent pull request. Use only when the user explicitly requests this parent-issue workflow; do not use for ordinary numbered issues or pull requests."
metadata:
  author: "catworld"
  source: "issue-379"
---

# CatWorld Implement Parent Issue

Use this skill only when the user explicitly invokes the parent-issue
orchestrator with exactly one parent issue number or URL. It coordinates child
implementations; it does not replace or change the single-issue shorthand route.

Every child owns its complete lifecycle through
`.agents/skills/catworld-implement-issue/SKILL.md`. Do not generate, share,
rewrite, consolidate, or optimize child Spec Kit artifacts from this workflow.

## Authority and boundaries

Before scheduling work, read:

- `AGENTS.md`;
- `.specify/memory/constitution.md`;
- `docs/ARCHITECTURE.md`;
- this skill; and
- the complete parent issue.

The parent issue and its discovered child issues define scope. Do not modify
issue bodies, sub-issue relationships, checklists, dependency declarations,
labels, milestones, assignees, or completion state. Do not modify the existing
single-issue or Spec Kit skills.

This workflow may create a parent integration branch, isolated child worktrees,
child issue branches through the single-issue workflow, normal commits, normal
non-force pushes, child PRs to the integration branch, and one final parent PR.
It must not:

- commit or push to the captured parent branch or `main`;
- merge the final parent PR or write its changes into the captured parent;
- enable auto-merge, approve a Codex-authored PR, or launch a Codex PR reviewer;
- amend, rebase-push, force-push, or otherwise rewrite published history;
- delete branches, prune remotes, or perform branch cleanup; or
- post public GitHub comments unless separately requested.

## 1. Establish the parent and integration branch

1. Require exactly one parent issue number or URL. Fetch the complete issue,
   including its body, state, sub-issue relationships when the GitHub interface
   exposes them, and metadata needed for a branch name. Stop if it does not
   exist, is a pull request, or cannot be read reliably.
2. Require a clean starting worktree with `git status --porcelain`. Stop and
   report every dirty path if it has output.
3. Before switching or creating a branch, capture independently:
   - `startingBaseSha` from `git rev-parse HEAD`; and
   - `startingBaseRef` from the current symbolic branch.
   For detached HEAD, require an explicit reliable intended base ref. Never
   infer it from reachability or default it to `main`.
4. Derive the parent integration branch as
   `<type>/<parent-number>-<short-description>-integration`, using the issue
   title prefix first and labels second for the conventional type. If that name
   equals `startingBaseRef`, stop for an independent intended parent ref.
5. If the integration branch already exists, require explicit permission to
   reuse it. Before reuse, inspect `git worktree list --porcelain`; stop if it is
   checked out in another worktree. Do not merge, rebase, or rewrite it merely
   to prepare the run.
6. Otherwise create and switch to the integration branch from exactly
   `startingBaseSha`. Keep the primary worktree on this branch throughout
   scheduling, integration, final delivery, and terminal stops.

Record `startingBaseSha`, fixed `startingBaseRef`, integration branch, parent
number, and parent title in the run state.

## 2. Discover implementation children

Determine the required child set once before scheduling:

1. When the GitHub interface exposes sub-issues for the parent, use those
   sub-issues as the authoritative child set.
2. Only when sub-issues are unavailable, parse explicit GitHub issue references
   from checklist items under the parent's `## Implementation issues` section.
   Do not treat references elsewhere as implementation children.
3. Fetch and read every discovered child completely. Verify each reference is
   an issue rather than a pull request.
4. Exclude children already completed at discovery. A closed issue is
   completed. When authoritative sub-issue/checklist completion metadata is
   available, honor that metadata as well; do not infer completion from a
   branch, commit, or PR alone.
5. The remaining open children are required for final delivery. Stop if no
   implementation children are discoverable. If all discovered children are
   already completed, report that there is no incomplete implementation work
   and stop without creating an empty final PR.

Preserve the discovered child list and completion classification in the final
report. Do not silently add, remove, or substitute children later in the run.

## 3. Build the hard-dependency DAG

Read dependency declarations from only:

- an explicit dependency section in the parent body; and
- explicit hard-dependency statements in a discovered child body.

Normalize each declaration to `prerequisite -> dependent` only when both ends
identify discovered implementation children. A reference, ordering in a list,
likely file overlap, shared surface, suggested sequence, or descriptive phrase
is not independently a hard dependency. Do not invent edges to avoid possible
merge conflicts.

Compare duplicate declarations before scheduling:

- Identical declarations agree.
- A declaration that reverses another declaration, says a named prerequisite is
  both required and explicitly not required, or otherwise assigns incompatible
  directions is contradictory. Stop scheduling affected work and report the
  exact source statements instead of choosing one.
- A reference to an unknown issue does not silently enlarge the child set. Stop
  if it is expressed as a required implementation dependency; otherwise report
  the unusable declaration and do not manufacture an edge.

Run cycle detection over the explicit edges after excluding already completed
children. A cycle is a terminal stop for normal final delivery; report the
cycle path. Completed child prerequisites count as satisfied. An incomplete
child is dependency-ready only when every explicit prerequisite is completed
or has been successfully integrated into the parent branch.

## 4. Launch dependency-ready children

At each scheduling point, identify every not-yet-launched ready child and launch
all of them concurrently. Do not impose an arbitrary concurrency cap. If the
runtime has fewer available agent slots than ready children, launch as many as
capacity permits and keep the remainder in a FIFO-ready queue. Capacity queueing
must not add DAG edges, change readiness, or serialize later independent work
once capacity becomes available.

For each child launch:

1. Capture the current parent integration `HEAD`.
2. Create a unique isolated Git worktree from that exact commit without
   switching the primary worktree. Choose a deterministic path that includes
   the parent and child issue numbers, verify it does not pre-exist, and record
   it in run state. Do not reuse another child's worktree.
3. Start one fresh subagent whose filesystem working directory is that isolated
   worktree. Give it exactly one child issue and no sibling implementation.
4. The handoff must direct the child to:
   - read the repository `AGENTS.md`, constitution, architecture, and
     `.agents/skills/catworld-implement-issue/SKILL.md`;
   - fetch and read the complete child issue independently;
   - use the parent integration branch as the explicit reliable intended PR
     base, even though its isolated worktree starts at a detached commit;
   - follow `catworld-implement-issue` unchanged through its complete Spec Kit,
     implementation, convergence, validation, synchronization, commit, push,
     and delivery lifecycle;
   - request external review explicitly so the child workflow records zero
     independent review rounds and does not launch `catworld_pr_reviewer` or
     perform automatic review remediation;
   - deliver a ready PR targeting the parent integration branch; and
   - avoid merging its own PR, modifying issues, cleaning branches/worktrees,
     or touching the primary worktree.
5. Do not pass parent-generated specs, plans, tasks, implementation advice, or
   sibling artifacts. Parent context may be supplied only to identify the
   reliable PR base and explain dependency-approved behavior already integrated
   into that base.

Track each child as queued, running, blocked, failed, delivered, or integrated,
including its worktree, branch, PR, validation result, and remote head SHA.

## 5. Monitor and qualify child results

Wait for child agents and process completions while continuing to fill available
capacity from the ready queue. A child is eligible for integration only when
its single-issue workflow reports all of the following and live GitHub evidence
agrees:

- implementation completed without an unresolved stop;
- required and change-affected validation passed after the latest relevant
  child change;
- its branch was pushed normally;
- a non-draft, ready PR targets the exact parent integration branch;
- the PR head matches the child's reported remote head; and
- the child branch/worktree is clean.

Do not wait for a Codex review gate and do not launch a reviewer. Child PRs are
integration artifacts in this workflow. A draft PR, failed or incomplete
validation, missing PR/head evidence, wrong base, or unsafe repository state is
not eligible and blocks that child.

When a child is blocked or fails, do not start any of its descendants.
Independent running or ready children may continue. Preserve their useful
results, but a required blocked child prevents normal final ready delivery.

## 6. Integrate eligible children

Integrate one eligible child at a time from the primary worktree while it remains
on the parent integration branch:

1. Fetch the exact child branch or PR head and confirm the observed PR is still
   ready, still targets the integration branch, and still has the expected head.
2. Attempt a normal non-fast-forward merge of that child head into the parent
   integration branch. Do not squash, rebase, cherry-pick, amend, or force.
3. If the merge succeeds, record the merge commit and integration order, push
   the parent integration branch normally when remote coordination requires it,
   mark the child integrated, and immediately recompute dependency readiness.
   Newly ready children become launch candidates without waiting for unrelated
   siblings.
4. Do not update, merge into, or restart still-open sibling branches merely
   because the integration branch advanced.

### Conflict remediation

When the child cannot merge cleanly because the parent integration branch has
advanced:

1. Abort only the uncommitted merge attempt, leaving the parent integration
   branch clean and checked out.
2. In that child's isolated worktree, confirm the child issue branch is active
   and clean, fetch the current parent integration branch, and merge it normally
   into the child branch.
3. Resolve conflicts only when the correct result follows deterministically
   from the child issue, parent issue, already integrated behavior, `AGENTS.md`,
   constitution, architecture, and current repository sources of truth.
4. Stop that child without guessing when resolution requires a new product,
   architecture, authorization, persistence, shared-contract, UX,
   correctness-sensitive, operational, or scope decision.
5. After deterministic resolution, rerun every child-required validation and
   every check affected by the conflict. Apply the single-issue workflow's
   permanent-test and scope gates to any remediation.
6. Create a normal conflict-resolution commit, push the child branch normally,
   recapture its remote head and ready PR evidence, and retry integration from
   the primary worktree.

Record conflicted paths, resolution commits, validation evidence, and whether a
decision stop occurred. Never conceal conflict remediation inside the parent
merge or use history rewriting to make a child integrate.

## 7. Complete and deliver the parent

Do not begin final delivery until every required incomplete child discovered at
the start is integrated. Never silently omit a failed, blocked, draft, or
incomplete child.

1. Confirm no child subagent can resume working-tree mutations and the parent
   integration branch is active and clean.
2. Run validation explicitly required by the parent issue and all
   integration-relevant validation for the accumulated implementation. Rerun
   evidence made stale by the last integration or conflict remediation. Report
   each result as passed, failed, skipped, timed out, interrupted, partial,
   stale, or not revalidated; only passed evidence counts as success.
3. Inspect the complete `startingBaseSha..HEAD` diff and changed-file list.
   Separate expected accumulated child changes from integration-only changes.
   Stop when an unexpected integration-only change cannot be justified by the
   parent, children, conflict records, and sources of truth.
4. Synchronize with the fixed captured parent before first final delivery:
   - fetch only `origin/<startingBaseRef>`;
   - stop if it is missing or `startingBaseSha` is not its ancestor;
   - if the integration branch lacks the current remote parent, merge that
     remote parent normally;
   - resolve only deterministic conflicts within approved parent/child scope;
   - rerun all affected parent and integration validation after the merge.
5. Push only the parent integration branch normally to `origin`.
6. Open one ready, non-draft PR from the integration branch to the fixed
   `startingBaseRef`, or update the matching existing PR. The PR must summarize
   the accumulated implementation, list the child issues/PRs, state the
   validation performed, and request external review.
7. Capture the final PR number, URL, ready status, and remote head SHA. Do not
   launch `catworld_pr_reviewer`, do not wait for or perform automatic review
   remediation, and do not merge the final PR. Record:
   - `independent review rounds: 0`;
   - `reviewed remote head SHAs: none`;
   - `final review result: not run — external review requested`; and
   - `automatic remediation commits: none`.

If final integration validation fails outside safely correctable approved
scope, or any required child remains incomplete, stop normal final delivery.
Do not downgrade the final result by opening a ready PR that omits required work.

## 8. Final report

Keep the parent integration branch checked out and report:

- parent issue, `startingBaseSha`, fixed `startingBaseRef`, parent integration
  branch, final local/remote head, and parent synchronization result;
- every discovered child with completion classification, branch, PR URL/status,
  final child head, validation status, and final workflow state;
- dependency edges, launch batches or capacity queueing, and integration order;
- every integration or synchronization merge commit and resolved conflict;
- parent and integration validation commands with explicit statuses;
- unexpected integration-only changes or scope findings;
- final PR URL and ready status, or the exact blocker preventing delivery;
- independent review fields fixed to zero/none/external review requested;
- retained worktree paths and branch state, without branch cleanup;
- `git status --short`, concise accumulated diff summary, and current checkout.

## Terminal stops

Stop normal final delivery for any of these conditions:

- dirty starting worktree or unreliable starting base;
- existing integration branch without reuse permission or in another worktree;
- missing or unreadable parent, no discoverable children, or no incomplete work;
- contradictory dependency declarations, unknown required dependency, or cycle;
- required child failure, unsafe stop, incomplete validation, draft/wrong-base PR,
  missing remote evidence, or unclean delivered state;
- conflict resolution requiring a new material decision;
- unexpected integration-only scope drift;
- missing/incompatible current remote parent; or
- final required validation that cannot pass within approved scope.

Independent work may finish after a child blocks, but descendants of that child
must not start and no final ready parent PR may omit it.

## Done when

- Every required incomplete child ran in an isolated worktree through the
  unchanged single-issue lifecycle and explicit external-review path.
- Every dependency-ready child was launched concurrently or capacity-queued
  without changing DAG semantics.
- Every required child ready PR was integrated through normal history-preserving
  merges, with deterministic conflict remediation validated and recorded.
- The accumulated parent branch passed fresh required validation and was
  delivered as one ready PR to the fixed original base.
- No Codex reviewer, automatic remediation, final merge, history rewrite,
  branch cleanup, or issue mutation occurred.
