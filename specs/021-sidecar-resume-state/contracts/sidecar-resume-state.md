# Contract: Sidecar Resume State

This contract defines the observable resumable state tracking rules for issue
#232. It applies only to opt-in sidecar coordinator parallel execution.

## Coordinator Resume Artifact

The sidecar coordinator artifact must include a status table or equivalent
structured section for every child issue. Each child entry must include these
fields when the value exists:

- child issue number and title;
- child artifact path;
- child branch;
- local child checkout or worktree;
- child PR;
- validation state and freshness;
- workflow status;
- blockers;
- refresh state after coordinator branch updates or child PR merges;
- cleanup eligibility state.

Pending children must be identifiable without implying that a branch, checkout,
PR, or validation result already exists.

## Required Workflow Statuses

The status vocabulary must be explicit enough for a later session to continue
without private conversation context. It must distinguish at least:

- `pending`;
- `active`;
- `blocked`;
- `paused`;
- `resume-needed`;
- `merged-to-coordinator`;
- `complete`.

Reports and artifacts may use clearer local wording, but they must preserve
these distinctions.

## Resume Re-Read Requirements

Before continuing a paused or resumed sidecar coordinator run, Codex must
re-read current evidence from GitHub and the repository, including:

- coordinator issue body, state, labels, and listed child issues;
- each relevant child issue body, state, labels, dependencies, and blockers;
- relevant child PRs and final coordinator PR state;
- coordinator artifact and child artifacts;
- coordinator branch state;
- active sidecar child branch state;
- local checkout/worktree existence and path state;
- validation evidence, status, and freshness;
- blockers, conflicts, and human-only decision state;
- cleanup eligibility and remote cleanup approval state.

Resume must not rely on private conversation context as the source of truth.

## Refresh After Child PR Merges

After the user merges a sidecar child PR into the coordinator branch:

- completed child state remains recorded in the coordinator artifact;
- still-active child branches or worktrees that need the new coordinator state
  must be marked `refresh needed`;
- refresh must use a normal merge from the coordinator branch;
- rebase, force-push, and history-rewriting updates are prohibited;
- affected validation is stale until rerun after the refresh.

## Validation State

Validation state must remain visible across pauses and resumes. Evidence must
not be treated as passed when it is:

- failed;
- skipped;
- timed out;
- interrupted;
- partial;
- stale;
- not run;
- blocked.

Readiness must account for stale validation after coordinator branch updates,
child branch refreshes, conflict resolution, or other relevant changes.

## Blockers

Child status entries must preserve blocker state when a child or coordinator
run is blocked. Blockers must identify:

- blocker category;
- affected child or coordinator scope;
- evidence;
- required next action or human decision.

Shared-contract blockers, conflict blockers, and human-only blockers follow
the sidecar reporting rules from issue #231.

## Cleanup Eligibility

Local sidecar branch and worktree cleanup is not eligible after individual
child PR merges.

Local cleanup becomes eligible only after the final coordinator PR has merged
into `main`, and only for local branches and worktrees created by the sidecar
workflow.

Remote branch deletion, remote pruning, and any remote cleanup require explicit
user approval. Recorded resume state must not treat missing approval as
permission.

## Non-Sidecar Boundaries

Normal sequential issue implementation keeps existing state handling.

Direct child issue work outside explicit sidecar `parallel` mode keeps normal
sequential state handling.

A closed-child coordinator final pass uses normal sequential state handling. It
may reference closed child issues for traceability, but it must not use
sidecar resumability state or present closed child scope as newly implemented
work.
