---
name: "catworld-parallel-coordinator"
description: "Preflight CatWorld coordinator issues and prepare sidecar artifacts and Git state for explicit opt-in parallel execution without changing the existing sequential implementation workflow."
compatibility: "Requires the CatWorld repository, GitHub issue context, and the sidecar workflow guardrails from issues #220-#229"
metadata:
  author: "catworld"
  source: "issues-226-229"
---

# CatWorld Parallel Coordinator

Use this sidecar entrypoint only for an explicit CatWorld coordinator issue
request that includes the `parallel` keyword, after the repository routing
guardrails allow sidecar parallel use.

This skill began as the preflight-only sidecar entrypoint introduced by issue
#226. Issue #227 extends the same sidecar skill with coordinator and child
artifact preparation before delegation. Issue #229 adds the sidecar Git
execution model: coordinator and child branch state, isolated checkout/worktree
state, merge-only refresh rules, and cleanup boundaries. It still does not
open pull requests, mutate GitHub issues, run adoption dry-runs, or replace the
normal sequential implementation workflow. Later #220 child issues may extend
PR handling, state tracking, adoption, and delivery pieces.

## Routing Boundary

- Normal implementable issues use the existing sequential workflow.
- Direct child issues use the existing sequential workflow.
- `parallel` on a non-coordinator issue is invalid. Stop and report that
  parallel mode applies only to coordinator issues.
- `parallel` on a direct child issue is invalid. Stop and report that direct
  child issues run through the existing sequential workflow.
- Issues #220 through #234 must not route through parallel mode while the
  sidecar workflow is being designed, validated, and adopted. Use the current
  sequential workflow guardrails for those issues.
- Coordinator end-to-end requests without `parallel` are not handled by this
  sidecar entrypoint. Apply the existing routing contract:
  - if any listed child issue is still open, stop with the existing coordinator
    routing error;
  - if all listed child issues are closed, use the existing sequential
    end-to-end workflow for the coordinator final pass;
  - the closed-child coordinator final pass is not a separate workflow and must
    not redo closed child scope.

## Required Context

Before any preflight decision, read:

- `AGENTS.md`;
- `.specify/memory/constitution.md`;
- `docs/ARCHITECTURE.md`;
- the full coordinator issue body, title, state, labels, and listed child
  issue references;
- each listed child issue body, title, state, labels, dependencies, and
  source-of-truth references;
- applicable feature artifacts under `specs/` when they exist for the
  coordinator or child issues.

If any required context cannot be read, stop before implementation and report
the missing context.

## Coordinator Classification

Classify the issue as a coordinator only when the issue body clearly identifies
coordinator or epic behavior and lists child issues or sub-issues whose work
must be inspected before execution.

Stop with a routing error when:

- the issue is a normal implementable issue;
- the issue is a direct child issue;
- the issue appears to be a coordinator but child issues cannot be found;
- the issue cannot be classified after reading it.

## Preflight Readiness

Parallel readiness is a preflight result, not an issue label. Do not require,
invent, add, or route based on a required `parallel-ready` label.

Determine readiness through:

- coordinator issue inspection;
- child issue inspection;
- dependency classification;
- source-of-truth review.

Classify child issue relationships before any future parallel execution:

- **Hard dependency**: one child requires another child's result before it can
  be implemented safely. Do not parallelize blindly.
- **Conflict risk**: children likely touch the same source files, shared
  workflow rules, shared contracts, migrations, authorization, persistence,
  global styles, or other cross-cutting surfaces. Stop or require explicit
  sequencing before parallel execution.
- **Independent candidate**: children appear to touch disjoint source maps and
  have no unresolved dependency or source-of-truth conflict. This is only a
  preflight classification in issue #226, not permission to launch execution.
- **Incomplete context**: child issue data, feature artifacts, source maps, or
  governing documentation are missing or contradictory. Stop.

## Source-of-Truth Review

Compare the coordinator and child issue bodies against:

- `AGENTS.md` routing guardrails;
- the CatWorld constitution;
- `docs/ARCHITECTURE.md` workflow routing and sidecar artifact path guidance;
- relevant `spec.md`, `plan.md`, and `tasks.md` artifacts when present;
- issue #220 sidecar architecture and issues #221, #222, #225, #226, #227,
  #228, and #229 when their routing, entrypoint, artifact, child handoff, or
  Git execution contracts apply.

Stop when source-of-truth documents conflict, contain unresolved blocking
decisions, require pending human approval, or would require changing approved
scope.

## Sidecar Artifact Preparation

Run artifact preparation only after coordinator classification, required
context loading, source-of-truth review, dependency classification, and routing
guardrails allow the sidecar coordinator path. Do not run artifact preparation
for normal implementable issues, direct child issues, or closed-child
coordinator final passes that enter the existing sequential workflow.

Before creating or describing artifacts, apply the #225 path contract:

- coordinator artifacts use `specs/<coordinator-number>-coordinator-<slug>/`;
- child implementation artifacts use `specs/<child-issue-number>-<child-slug>/`;
- existing target paths, same-number prefixes, and duplicate child issue
  numbers are stop conditions.

Compute the coordinator target path and every child target path before writing
or reusing any artifact. Stop instead of overwriting, merging, deleting,
silently reusing, or automatically renaming artifacts when any target path
collides or any child issue number is duplicated.

### Coordinator Orchestration Artifact

Prepare a coordinator orchestration artifact in the coordinator artifact path,
or describe the exact artifact path and content when the current workflow is
running in a dry or read-only preparation mode. The coordinator artifact must
include:

- coordinator issue number, title, classification, and source references;
- child issue map with each child issue number, title, state, dependencies,
  source references, artifact path, and current preparation status;
- dependency layers that identify hard dependencies, independent candidates,
  conflict risks, and incomplete-context blockers;
- shared contract section that records cross-child contracts, source-of-truth
  references, and unresolved shared-contract blockers;
- sidecar Git state section that records coordinator branch, coordinator
  checkout/worktree, child branch, child checkout/worktree, child PR target,
  refresh status, cleanup status, and remote-cleanup approval state;
- validation plan for coordinator-level and child-level evidence;
- status table for each child issue, including readiness, blockers, dependency
  layer, artifact path, and required validation.

Stop before delegation when the coordinator artifact cannot be prepared safely
because coordinator context, child context, dependencies, source-of-truth
evidence, artifact paths, or shared contracts are missing, contradictory, or
unsafe.

### Child Implementation Artifacts

For each listed child issue, prepare or describe an issue-numbered child
artifact set:

```text
specs/<child-issue-number>-<child-slug>/
├── spec.md
├── plan.md
└── tasks.md
```

Each child artifact set must derive from:

- the coordinator orchestration artifact;
- the child issue title, body, dependencies, validation requirements, and
  explicit out-of-scope boundaries;
- the child dependency layer and any hard-dependency or conflict-risk notes;
- the shared contract section;
- applicable source-of-truth documentation and existing feature artifacts.

Validate every child artifact set against the coordinator issue, child issue
body, relevant source-of-truth documentation, and shared contract before
delegation. Stop before delegation when any child artifact expands beyond
approved child scope, omits required validation, conflicts with another child,
or relies on an unresolved shared contract.

### Shared Contract and Child Issue Boundaries

Do not invent or create seed, foundation, or shared-contract child issues. If a
missing shared contract or foundation issue appears necessary and it does not
already exist, stop before delegation and ask for user guidance. Create such an
issue only when the user explicitly approves that issue mutation in a workflow
that permits it.

This artifact-preparation path is not used when all listed child issues are
closed and the coordinator enters the existing sequential final pass. The final
pass must not redo closed child scope.

Issue #227 adds artifact preparation only. Issue #229 adds sidecar Git
execution rules. Neither issue adds pull request handling, GitHub issue
mutation, adoption dry-runs, or CatWorld product code changes.

## Sidecar Git Execution Rules

Apply these rules only after routing guardrails allow an explicit coordinator
`parallel` request and after coordinator preflight, source-of-truth review,
dependency classification, artifact preparation, and shared-contract validation
have succeeded. Issues #220 through #234 still use the current sequential
workflow guardrails while the sidecar workflow is being designed, validated,
and adopted.

### Deterministic Names and Collision Checks

Compute every sidecar branch and checkout/worktree name before creating,
switching to, merging into, or reusing any Git resource.

- Coordinator branch name component: `<coordinator-number>-coordinator-<slug>`.
- Child branch name component: `<child-issue-number>-<child-slug>`.
- Coordinator checkout/worktree directory name component:
  `<coordinator-number>-coordinator-<slug>`.
- Child checkout/worktree directory name component:
  `<child-issue-number>-<child-slug>`.
- Slugs use the #225 slug rule: lowercase, hyphen-separated title text after
  removing issue title prefixes such as `[Workflow]`, `[Epic]`, `feat:`, or
  `docs:`.

The coordinator artifact must record the final full branch names and full local
checkout/worktree paths. The parent directory for local sidecar checkouts is
workflow context, but each sidecar directory name must use the deterministic
component above.

Stop instead of guessing, overwriting, deleting, or auto-renaming when a branch,
checkout, worktree, directory, or artifact name collides. Reuse is clearly
recoverable only when the coordinator artifact or explicit user-provided
context proves the resource is the intended sidecar resource for the same issue
and slug.

### Coordinator Branch and Checkout

Coordinator parallel work uses exactly one coordinator integration branch
created from current `origin/main`. Do not update local `main`, merge unrelated
work into `main`, or use `main` as a sidecar delivery branch.

When a coordinator checkout/worktree is needed, it must be isolated from every
active child checkout/worktree and recorded in the coordinator artifact.

### Child Branches and Checkouts

Each sidecar child implementation branch starts from the coordinator branch,
not from `main`. Each active child implementation uses an isolated local
checkout/worktree recorded in the coordinator artifact and supplied in the
child handoff.

Sidecar child PR guidance must target the coordinator branch. A sidecar child
PR must not target `main` directly.

### Refresh After Child PR Merges

After the user merges a child PR into the coordinator branch, every still-active
sidecar child branch or worktree that needs the latest coordinator state is
updated from the coordinator branch using a normal merge.

Do not rebase sidecar branches. Do not force-push sidecar branches. Do not use
history-rewriting updates for sidecar branches.

### Cleanup

Do not delete local sidecar branches or worktrees after individual child PR
merges. Local cleanup is eligible only after the final coordinator PR has been
merged into `main`, and only for local branches and worktrees created by the
sidecar workflow.

Remote branch deletion, remote pruning, or any remote cleanup requires explicit
user approval.

Direct child issue work outside `parallel` keeps the normal sequential Git
workflow. A closed-child coordinator final pass also keeps the normal
sequential Git workflow and is outside this sidecar coordinator branch model.

## Prohibited Side Effects

This entrypoint must not:

- create, modify, close, label, assign, milestone, or comment on GitHub issues;
- rebase, force-push, or perform history-rewriting updates for sidecar
  branches;
- push sidecar branches, open pull requests, update pull requests, delete
  remote branches, prune remotes, or perform remote cleanup unless a later
  approved sidecar rule permits the operation and explicit user approval exists
  where repository rules require it;
- delete local sidecar branches or worktrees after individual child PR merges;
- clean local sidecar branches or worktrees before the final coordinator PR has
  been merged into `main`;
- create sidecar artifacts outside the approved artifact-preparation phase or
  when any artifact-preparation stop condition applies;
- run artifact preparation for closed-child coordinator final passes;
- invent or create seed, foundation, or shared-contract child issues without
  explicit user approval in a workflow that permits issue mutation;
- delegate child implementation work;
- open, update, merge, approve, or enable auto-merge on pull requests;
- modify CatWorld product code;
- modify `.agents/skills/catworld-implement-issue/SKILL.md`;
- modify `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`;
- introduce a required `parallel-ready` label.

## Preflight Output

Report a concise preflight result with:

- coordinator issue number and classification;
- listed child issues inspected;
- child dependency and conflict classification;
- source-of-truth documents reviewed;
- artifact-preparation status, including coordinator path, child paths, and
  whether artifacts were prepared, described, blocked, or not applicable;
- sidecar Git status, including coordinator branch, coordinator checkout or
  worktree path, child branch names, child checkout or worktree paths, child PR
  target branch, refresh status, cleanup eligibility, and unresolved
  collision/approval blockers when Git state has been prepared or described;
- readiness status: `blocked`, `not adopted`, or `preflight-ready`;
- specific stop reasons or remaining prerequisites;
- confirmation that no child implementation, PR operation, issue mutation,
  product code change, prohibited Git operation, or unapproved cleanup was
  performed.

Stop after preflight and artifact preparation. Do not launch child execution
even if the coordinator appears preflight-ready and artifacts are prepared.

## Validation Expectations

Validation for this entrypoint must include:

- local routing examples for explicit coordinator `parallel`, non-coordinator
  `parallel`, direct child `parallel`, open-child coordinator end-to-end, and
  closed-child coordinator final-pass requests;
- review that readiness is based on preflight, child issue inspection,
  dependency classification, and source-of-truth review;
- simulation of one coordinator with at least three child issues, including the
  coordinator artifact path and each child artifact path;
- review that coordinator artifacts require a child issue map, dependency
  layers, shared contract section, validation plan, and status table;
- review that child artifacts require issue-numbered `spec.md`, `plan.md`, and
  `tasks.md` preparation before delegation;
- simulation of one coordinator branch and two child branches using a temporary
  local Git repository, with the coordinator branch created from `origin/main`
  and each child branch created from the coordinator branch;
- simulation of a child PR merge into the coordinator branch followed by
  refreshing another active child branch from the coordinator branch using a
  normal merge;
- review that sidecar child PR guidance targets the coordinator branch and not
  `main`;
- review that sidecar workflow text disallows rebase, force-push, and
  history-rewriting updates;
- simulation or manual review showing local cleanup remains ineligible after an
  individual child PR merge and becomes eligible only after the final
  coordinator PR has merged into `main`;
- review that remote branch deletion, remote pruning, and remote cleanup require
  explicit user approval;
- blocker simulation proving missing shared contracts stop for user guidance;
- review that seed, foundation, and shared-contract child issues are not
  invented or created without explicit user approval;
- review that closed-child coordinator final passes do not use artifact
  preparation or sidecar Git rules;
- review that no required `parallel-ready` label is introduced;
- changed-file review proving the existing sequential implementation skill and
  existing coordinator/orchestration skill are unchanged;
- changed-file review proving no product code, real CatWorld sidecar worktrees,
  real CatWorld sidecar branches, PR operations, or GitHub issue mutations are
  part of issue #229 validation.
