---
name: "catworld-parallel-coordinator"
description: "Preflight CatWorld coordinator issues and prepare sidecar artifacts for explicit opt-in parallel execution without changing the existing sequential implementation workflow."
compatibility: "Requires the CatWorld repository, GitHub issue context, and the sidecar workflow guardrails from issues #220-#227"
metadata:
  author: "catworld"
  source: "issues-226-227"
---

# CatWorld Parallel Coordinator

Use this sidecar entrypoint only for an explicit CatWorld coordinator issue
request that includes the `parallel` keyword, after the repository routing
guardrails allow sidecar parallel use.

This skill began as the preflight-only sidecar entrypoint introduced by issue
#226. Issue #227 extends the same sidecar skill with coordinator and child
artifact preparation before delegation. It still does not implement child
execution, Git worktree or branch operations, pull request handling, resumable
state, cleanup, adoption dry-runs, or delivery. Later #220 child issues may
extend those execution pieces, but this entrypoint must stop before child
implementation.

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
- issue #220 sidecar architecture and issues #221, #222, #225, #226, and #227
  when their routing, entrypoint, or artifact contracts apply.

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

Issue #227 adds artifact preparation only. It does not add child execution, Git
branch or worktree operations, pull request handling, GitHub issue mutation, or
CatWorld product code changes.

## Prohibited Side Effects

This entrypoint must not:

- create, modify, close, label, assign, milestone, or comment on GitHub issues;
- create, switch, merge, rebase, push, delete, or prune Git branches;
- create, update, delete, or clean worktrees;
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
- readiness status: `blocked`, `not adopted`, or `preflight-ready`;
- specific stop reasons or remaining prerequisites;
- confirmation that no child implementation, Git operation, PR operation, issue
  mutation, or product code change was performed.

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
- blocker simulation proving missing shared contracts stop for user guidance;
- review that seed, foundation, and shared-contract child issues are not
  invented or created without explicit user approval;
- review that closed-child coordinator final passes do not use artifact
  preparation;
- review that no required `parallel-ready` label is introduced;
- changed-file review proving the existing sequential implementation skill and
  existing coordinator/orchestration skill are unchanged;
- changed-file review proving no product code, sidecar worktrees, sidecar
  branches, PR operations, or GitHub issue mutations are part of issue #227.
