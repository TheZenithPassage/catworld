---
name: "catworld-parallel-coordinator"
description: "Preflight CatWorld coordinator issues for explicit opt-in sidecar parallel execution without changing the existing sequential implementation workflow."
compatibility: "Requires the CatWorld repository, GitHub issue context, and the sidecar workflow guardrails from issues #220-#226"
metadata:
  author: "catworld"
  source: "issue-226"
---

# CatWorld Parallel Coordinator

Use this sidecar entrypoint only for an explicit CatWorld coordinator issue
request that includes the `parallel` keyword, after the repository routing
guardrails allow sidecar parallel use.

This skill is a preflight-only sidecar entrypoint introduced by issue #226. It
does not implement child artifacts, child execution, Git worktree or branch
operations, pull request handling, resumable state, cleanup, adoption dry-runs,
or delivery. Later #220 child issues may extend the sidecar workflow, but this
entrypoint must stop before implementation.

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
- issue #220 sidecar architecture and issues #221, #222, and #225 when their
  routing or artifact contracts apply.

Stop when source-of-truth documents conflict, contain unresolved blocking
decisions, require pending human approval, or would require changing approved
scope.

## Sidecar Artifact Awareness

When reasoning about future sidecar artifacts, apply the #225 path contract:

- coordinator artifacts use `specs/<coordinator-number>-coordinator-<slug>/`;
- child implementation artifacts use `specs/<child-issue-number>-<child-slug>/`;
- existing target paths, same-number prefixes, and duplicate child issue
  numbers are stop conditions for future artifact preparation.

Issue #226 does not create coordinator artifacts, child artifacts, sidecar
worktrees, sidecar branches, or sidecar execution state.

## Prohibited Side Effects

This entrypoint must not:

- create, modify, close, label, assign, milestone, or comment on GitHub issues;
- create, switch, merge, rebase, push, delete, or prune Git branches;
- create, update, delete, or clean worktrees;
- create sidecar coordinator or child artifacts;
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
- readiness status: `blocked`, `not adopted`, or `preflight-ready`;
- specific stop reasons or remaining prerequisites;
- confirmation that no implementation, Git operation, artifact generation, PR
  operation, issue mutation, or product code change was performed.

In issue #226, stop after reporting preflight. Do not launch child execution
even if the coordinator appears preflight-ready.

## Validation Expectations

Validation for this entrypoint must include:

- local routing examples for explicit coordinator `parallel`, non-coordinator
  `parallel`, direct child `parallel`, open-child coordinator end-to-end, and
  closed-child coordinator final-pass requests;
- review that readiness is based on preflight, child issue inspection,
  dependency classification, and source-of-truth review;
- review that no required `parallel-ready` label is introduced;
- changed-file review proving the existing sequential implementation skill and
  existing coordinator/orchestration skill are unchanged;
- changed-file review proving no product code, child artifacts, sidecar
  worktrees, sidecar branches, PR operations, or GitHub issue mutations are
  part of issue #226.
