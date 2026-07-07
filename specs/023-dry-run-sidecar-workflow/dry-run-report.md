# Dry-run Report: Sidecar Coordinator Workflow

**Active issue**: #234 - [Workflow] Dry-run the opt-in sidecar coordinator workflow before adoption

**Date**: 2026-07-07

**Branch**: `chore/234-dry-run-sidecar-coordinator-workflow`

## Summary

The sidecar coordinator workflow dry-run completed with local controlled
fixtures and read-only source-of-truth review. No CatWorld product feature
implementation, GitHub issue mutation, public comment, real sidecar worktree,
real sidecar branch, remote cleanup, rebase, force-push, or history-rewriting
operation was performed.

The dry-run found no workflow-source correction required for the current local
evidence set. The sidecar workflow is ready for user review, but this report
does not declare the workflow adopted, default, or ready for product use. The
user must review the result and explicitly mark the sidecar workflow ready or
not ready.

## Live Issue Limitation

A read-only GitHub search found no existing low-risk controlled coordinator
issue outside the #220-#234 sidecar epic set. Issues #220 through #234 are
explicitly barred from parallel routing while the sidecar workflow is being
designed, validated, and adopted. Creating new GitHub dry-run issues would be
issue mutation and was not explicitly approved.

For the valid coordinator `parallel` path and related sidecar execution checks,
this dry-run uses local fixture issue numbers recorded in
`samples/fixture-issues.md`.

## Source-of-truth Review

| Source | Status | Evidence |
|--------|--------|----------|
| `AGENTS.md` | passed | Keeps the sequential workflow as default, bars #220-#234 from parallel mode, rejects non-coordinator `parallel`, and preserves closed-child coordinator final passes through the existing sequential workflow. |
| `.agents/skills/catworld-implement-issue/SKILL.md` | passed | Defines the normal sequential end-to-end workflow, coordinator boundary, #220-#234 guardrail, delivery rules, validation freshness, and changed-file review. |
| `.agents/skills/catworld-parallel-coordinator/SKILL.md` | passed | Defines sidecar coordinator routing, preflight readiness, artifact preparation, Git, PR, validation, blocker, resume, cleanup, and prohibited side-effect rules. |
| `.agents/skills/catworld-parallel-child-implementation/SKILL.md` | passed | Defines prepared child handoff requirements, child execution boundaries, validation reporting, branch/worktree constraints, and prohibited side effects. |
| `docs/ARCHITECTURE.md` | passed | Documents sequential/default routing, opt-in sidecar routing, artifact paths, Git rules, PR rules, validation reporting, resume state, and closed-child final-pass behavior. |
| `specs/014-sidecar-artifact-paths/` through `specs/022-split-handoff-alignment/` | passed | Prior sidecar feature artifacts align with the current sidecar skill and architecture documentation. |

No source-of-truth conflict was found. The sidecar coordinator skill still says
it does not run adoption dry-runs; that remains consistent because issue #234 is
implemented through the current sequential workflow and records adoption-gate
evidence outside sidecar execution.

## Routing Outcomes

Detailed routing evidence is in `samples/routing-outcomes.md`.

| Scenario | Fixture / Issue | Status | Result |
|----------|-----------------|--------|--------|
| Valid coordinator `parallel` | `DRY-9901` | passed | Routes to sidecar coordinator preflight/artifact preparation in dry-run mode, then stops before child implementation and delivery operations. |
| Invalid non-coordinator `parallel` | `DRY-9905` | rejected as expected | Stops with a routing error; parallel mode applies only to coordinator issues. |
| Invalid coordinator end-to-end while children are open | `DRY-9906` | blocked | Stops with coordinator routing error as expected; user must use valid sidecar `parallel` after adoption or implement child issues sequentially. |
| Valid closed-child coordinator final pass | `DRY-9908` | passed | Uses `.agents/skills/catworld-implement-issue/SKILL.md` as the existing sequential final pass and does not redo closed child scope. |
| Direct child end-to-end | `DRY-9911` | passed | Uses the existing sequential workflow directly. |
| Real issue #234 shorthand request | `#234` | passed | Routed sequentially because #220-#234 must not route through parallel mode. |

## Artifact, Branch, and PR Expectations

Detailed evidence is in `samples/sidecar-artifact-map.md`,
`samples/child-handoff.md`, and `samples/pr-wording.md`.

| Evidence | Status | Result |
|----------|--------|--------|
| Coordinator artifact path | passed | `specs/9901-coordinator-controlled-workflow-dry-run/` is the expected coordinator artifact path for `DRY-9901`; it was described, not created, to keep the dry-run separate from real sidecar execution. |
| Child artifact paths | passed | `specs/9902-child-routing-fixture/`, `specs/9903-child-reporting-fixture/`, and `specs/9904-child-resume-fixture/` are distinct issue-numbered child paths. |
| Coordinator branch | passed | `sidecar/9901-coordinator-controlled-workflow-dry-run` starts from current `origin/main` in real sidecar execution; the temporary local simulation used a local `main` equivalent. |
| Child branches | passed | Child branches start from the coordinator branch, not from `main`. |
| Child PR targets | passed | Child PR samples target the coordinator branch and use `Related to` issue references only. |
| Final coordinator PR target | passed | Final coordinator PR sample targets `main` and may close the coordinator set. |
| Closed-child final-pass PR | passed | Sample uses normal sequential PR behavior, not the sidecar child/final PR model. |

## Git, Cleanup, Mutation, and Readiness Evidence

| Guardrail | Status | Evidence |
|-----------|--------|----------|
| Active child refresh uses normal merge only | passed | Temporary Git simulation recorded in `samples/git-merge-simulation.md`. |
| No rebase, force-push, or history rewriting | passed | Simulation used only `git merge --no-ff`; sidecar source text prohibits rebase, force-push, and history-rewriting updates. |
| No child PR targets `main` | passed | Child PR samples target `sidecar/9901-coordinator-controlled-workflow-dry-run`. |
| Cleanup after individual child PR merge | passed | Reported as ineligible; local branches/worktrees are retained after child PR merges. |
| Cleanup after final coordinator PR merge | passed | Reported as eligible only for local sidecar-created resources after final coordinator PR merges into `main`. |
| Remote branch deletion, remote pruning, and remote cleanup | passed | Reported as requiring explicit user approval. |
| GitHub issue mutation, labels, assignees, milestones, checklists, state changes, and public comments | passed | Reported as requiring explicit user approval and not performed. |
| `parallel-ready` label | passed | No required `parallel-ready` label is introduced or used for readiness. |
| Seed, foundation, or shared-contract child issues | passed | Missing shared contracts stop for user guidance; no unapproved child issues are invented or created. |
| Human-only blockers | passed | Validation sample records material dependency, architecture, production exposure, deployment, secrets, Git/GitHub workflow, and unresolved product/security/contract/validation/operational/scope decisions as human-only blockers. |

## Validation Results

| Check | Status | Evidence |
|-------|--------|----------|
| Dry-run fixture issue numbers recorded | passed | `samples/fixture-issues.md` |
| Five routing outcomes recorded | passed | `samples/routing-outcomes.md` |
| Artifact paths and branch names recorded | passed | `samples/sidecar-artifact-map.md` |
| Child handoff evidence recorded | passed | `samples/child-handoff.md` |
| PR target and wording evidence recorded | passed | `samples/pr-wording.md` |
| Validation reporting and blockers recorded | passed | `samples/validation-reporting.md` |
| Temporary Git merge simulation | passed | `samples/git-merge-simulation.md` |
| Workflow-source corrections | passed | No correction required by this dry-run. |
| Focused quickstart text check | passed | `rg -n 'parallel-ready|force-push|rebase|history-rewriting|Related to|Closes|seed|foundation|shared-contract|human-only|normal merge|main' .agents/skills docs/ARCHITECTURE.md specs/023-dry-run-sidecar-workflow` returned expected source and evidence matches. |
| Child PR body issue-closing check | passed | Targeted check found `child-pr-body-ok`; child PR body uses `Related to` only. |
| Normal sequential implementation skill diff | passed | `git diff -- .agents/skills/catworld-implement-issue/SKILL.md` produced no output. |
| Whitespace validation | passed | `git diff --check` produced no output. |
| Changed-file scope review | passed | Changed files are limited to `specs/023-dry-run-sidecar-workflow/`, the active feature artifact directory. |
| Freshness after late evidence edits | passed | Focused text checks, child PR body check, status vocabulary check, sequential-skill diff, and whitespace validation were rerun after the final PR wording and status vocabulary edits. |

## Blockers, Gaps, and Corrections

| Item | Status | Result |
|------|--------|--------|
| Live controlled coordinator issue outside #220-#234 | blocked | No existing issue found read-only; fixture issues used instead. This is not a workflow-source gap, but a limitation of the dry-run evidence. |
| Workflow-source corrections | passed | None required. |
| Adoption decision | blocked | Human review is required before the sidecar workflow can be marked ready or not ready. |

## Adoption Gate

This report supports user review of the sidecar workflow. It does not declare
the sidecar workflow adopted, default, or ready for product work.

Recommended next decision for the user: review this report and mark the
sidecar workflow ready or not ready. If live GitHub dry-run evidence is desired
before adoption, approve creation or reuse of a low-risk controlled coordinator
issue outside the #220-#234 range.
