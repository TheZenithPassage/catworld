# Implementation Plan: Dry-run Sidecar Coordinator Workflow

**Branch**: `chore/234-dry-run-sidecar-coordinator-workflow` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/023-dry-run-sidecar-workflow/spec.md`

## Summary

Run and record a controlled adoption dry-run for the opt-in sidecar coordinator
workflow without implementing product features, mutating GitHub issues, or
changing the normal sequential implementation skill. The implementation will
produce repository-tracked dry-run evidence under the active feature directory:
routing outcomes, source-of-truth review, artifact path and branch expectations,
sidecar child handoff evidence, Git/PR/cleanup/validation reporting checks, and
any adoption blockers or follow-up corrections. Existing sidecar skills and
architecture documentation are source-of-truth inputs and will only be changed
if the dry-run proves a concrete, in-scope workflow gap.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2 backend; Angular 21.2.x and TypeScript 5.9.x frontend. This feature changes repository-local Codex workflow evidence and Spec Kit artifacts only unless a workflow-source gap is proven.

**Primary Dependencies**: Existing repo-local Codex skills under `.agents/skills/`, especially `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `.agents/skills/catworld-implement-issue/SKILL.md`; `AGENTS.md` routing and delivery guardrails; `docs/ARCHITECTURE.md` Codex workflow routing documentation; sidecar feature artifacts from issues #225-#233; parent epic #220 and issue #234.

**Storage**: N/A for CatWorld runtime persistence. The feature records local Markdown dry-run evidence only; it does not change domain entities, database schema, browser storage, API payloads, or external service contracts.

**Testing**: Local dry-run report and samples covering routing outcomes, source-of-truth review, sidecar artifact path planning, dependency layering, child handoff, PR wording, validation reporting, resume/cleanup state, human-only blocker behavior, and a temporary Git normal-merge simulation. Additional evidence includes text checks against workflow source files, changed-file review, and `git diff --check`.

**Target Platform**: Codex sessions and maintainers reviewing CatWorld repository-local workflow skills, architecture documentation, and Spec Kit artifacts.

**Project Type**: CatWorld full-stack web administration system with repository-local Codex/Spec Kit workflow infrastructure.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Keep the dry-run separate from product feature implementation; do not declare the sidecar workflow default or adopted; do not change `.agents/skills/catworld-implement-issue/SKILL.md` internals; issues #220 through #234 must not route through parallel mode; do not create GitHub issues, mutate issue bodies/checklists/labels/assignees/milestones/state, post public comments, delete remote branches, prune remotes, rebase, force-push, or perform history rewriting without explicit user approval; record blockers instead of performing disallowed operations.

**Scale/Scope**: One feature artifact set for issue #234, local dry-run samples and report, and at most narrowly scoped workflow-source corrections if a gap is proven. No CatWorld product code, runtime configuration, migration, backend, frontend, live pull request operation, GitHub issue mutation, public comment, remote cleanup, or normal sequential workflow implementation changes.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The work is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, generic platform claims, or deployment assumptions.
- **Layered monolith responsibilities**: Compliant/N/A. No backend controller, service, repository, database, DTO, mapper, or application code changes.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, frontend protections, or database constraints change.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. The spec records technical outcomes, scope, edge cases, exclusions, validation-sensitive routing states, blockers, dependencies, and no unresolved open questions. The dry-run validates already approved sidecar workflow rules from #220 through #233 rather than introducing new product or architecture behavior.
- **Architecture and technology assessment**: No new assessment is required. Issue #234 does not introduce a new framework, dependency, persistence strategy, runtime architecture, shared application capability, or new sidecar operating model; it validates and records evidence for the already specified sidecar workflow and adoption gate.
- **Focused changes and proportional validation**: Compliant. Planned changes are limited to feature artifacts, local dry-run samples, and possible narrowly scoped workflow-source corrections if evidence proves a gap; validation uses source review, local simulations, text checks, changed-file review, and whitespace validation proportional to workflow-only scope.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, deployment exposure, backup, recovery, or production operation changes. The plan explicitly avoids unapproved GitHub issue mutation, public comments, remote cleanup, rebase, force-push, and history rewriting.

Post-design re-check: compliant. Phase 1 artifacts define only the dry-run evidence contract, local validation guide, and non-runtime evidence model. No runtime data model, API, persistence, authorization, UI, migration, deployment, or product behavior changes are introduced.

## Architecture and Technology Assessment

**Assessment required**: No. The active feature is an adoption dry-run and evidence record for approved sidecar workflow rules, not a new architecture, dependency, persistence, security, shared-contract, or operational workflow decision.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Use the existing sidecar skills, architecture documentation, prior sidecar feature artifacts, and local Markdown evidence under the active Spec Kit directory. This fits issue #234 and keeps prohibited external operations as recorded expectations.
- Established library/framework/service: N/A. No workflow engine, test harness dependency, GitHub automation service, or external tool is needed for this evidence-only adoption dry-run.
- Focused custom implementation: Add scripts to automate routing simulation, GitHub issue creation, branch/worktree management, or PR operations. Rejected because #234 is a controlled dry-run and the governing rules keep issue mutation, public comments, remote cleanup, and history-sensitive Git operations behind explicit approval.

**Selected approach**: N/A - no significant architecture or technology decision is selected. Implementation records local dry-run evidence and only changes workflow source text if the dry-run proves an in-scope gap.

**Why selected**: N/A.

**Confirmed medium-term use**: The dry-run evidence supports user review of whether the sidecar workflow is ready for adoption after #220-#234.

**Maintenance and operational consequences**: Maintainers will review the dry-run result and any recorded follow-up fixes before marking the sidecar workflow ready or not ready. No new runtime ownership is introduced.

**Reversibility and migration path**: The dry-run evidence can be replaced or rerun with a live controlled coordinator issue later. Feature-local artifacts can be removed or superseded without affecting product code or the normal sequential workflow.

**Human approval**: N/A because no significant architecture or technology assessment is required. The user remains responsible for marking the sidecar workflow ready or not ready after reviewing the dry-run result.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. The dry-run must prove the sidecar workflow can coexist with the existing sequential workflow without replacing normal issue, direct child issue, or closed-child coordinator final-pass behavior.

**Old behavior/source of truth**: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, issue #220, issue #234, and sidecar feature artifacts from issues #225-#233.

**New mechanism semantics**: N/A. The feature records dry-run evidence for the existing sidecar workflow and adoption gate.

**Mismatch risks**: The dry-run could accidentally imply #220-#234 can route through parallel mode, treat a non-coordinator as a coordinator, use sidecar artifact preparation for a closed-child final pass, redo closed child scope, require a `parallel-ready` label, create unapproved seed/foundation/shared-contract issues, target sidecar child PRs to `main`, allow rebase/force-push/history rewriting, perform cleanup too early, mutate GitHub issues without approval, or treat stale/failed/not-run validation as passed.

**Mitigation**: Record every routing scenario, guardrail, disallowed operation, source reference, local fixture limitation, validation status, and blocker explicitly in the dry-run result. Keep the normal sequential implementation skill unchanged and verify that unchanged state before final reporting.

**Proof required**: Dry-run report, local fixture issue set, routing matrix, sidecar artifact/branch/PR target matrices, temporary Git normal-merge simulation, text checks against workflow sources and samples, changed-file review, `git diff -- .agents/skills/catworld-implement-issue/SKILL.md`, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Five routing outcomes from issue #234 (TR-003) | `AGENTS.md`, sidecar coordinator skill, normal implementation skill, dry-run report | Routing matrix with source references and local fixture issue numbers | Rerun after routing wording or fixture changes |
| Closed-child coordinator final pass uses current sequential workflow and does not redo closed child scope (TR-004) | Normal implementation skill, architecture docs, dry-run report | Source review and sample final-pass evidence | Recheck before final report |
| Coordinator reading, child discovery, source-of-truth inspection, artifact generation, dependency layering, and child handoff (TR-001, TR-002, TR-010) | Sidecar coordinator skill, prior artifacts, dry-run samples | Local fixture coordinator/child artifact map and handoff sample | Rerun after sample or source changes |
| Git rules: coordinator branch source, child branch source, normal merge refresh, no rebase, no force-push, no history rewriting (TR-005) | Sidecar coordinator/child skills, temporary Git fixture | Temporary local Git simulation plus text review | Rerun after Git-rule wording or simulation changes |
| PR wording and targets, cleanup timing, GitHub mutation restrictions, and no direct child PR to `main` (TR-005, TR-009) | Sidecar skills, PR samples, dry-run report | Local PR wording samples and approval-boundary review | Rerun after PR/cleanup wording changes |
| Validation reporting, stale evidence, blockers, conflicts, and human-only blocker behavior (TR-005, TR-010) | Sidecar skills, validation/reporting samples, dry-run report | Sample reports and text review | Rerun after validation/reporting wording changes |
| No required `parallel-ready` label and no unapproved seed/foundation/shared-contract issue (TR-005, TR-009) | Sidecar coordinator skill, architecture docs, dry-run report | Text checks and source review | Rerun after readiness or shared-contract wording changes |
| Normal sequential implementation skill remains unchanged (TR-006, TR-007) | Git diff | `git diff -- .agents/skills/catworld-implement-issue/SKILL.md` | Recheck before final report |
| Overall formatting and scope review | Git diff and feature artifacts | `git diff --check`; changed-file/source-map review | Rerun after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/023-dry-run-sidecar-workflow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── dry-run-report.md
├── contracts/
│   └── dry-run-evidence.md
├── samples/
│   ├── fixture-issues.md
│   ├── routing-outcomes.md
│   ├── sidecar-artifact-map.md
│   ├── child-handoff.md
│   ├── pr-wording.md
│   ├── validation-reporting.md
│   └── git-merge-simulation.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.agents/skills/
├── catworld-parallel-coordinator/
│   └── SKILL.md          # review source; edit only if dry-run proves a gap
├── catworld-parallel-child-implementation/
│   └── SKILL.md          # review source; edit only if dry-run proves a gap
└── catworld-implement-issue/
    └── SKILL.md          # review-only, expected unchanged

docs/
└── ARCHITECTURE.md       # review source; edit only if dry-run proves a gap
```

**Structure Decision**: Keep the dry-run evidence under `specs/023-dry-run-sidecar-workflow/` so the test remains separate from product feature implementation and live sidecar execution. Treat sidecar skills and `docs/ARCHITECTURE.md` as source-of-truth inputs; change them only for concrete gaps discovered by the dry-run. Do not touch backend, frontend, migrations, operations, PR automation, GitHub issue state, public comments, `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, or normal sequential implementation internals.

## Complexity Tracking

No constitution exception is required. The dry-run uses local fixtures and recorded evidence because the issue forbids product implementation and the repository guardrails require explicit approval for live GitHub mutations, remote cleanup, force-push, rebase, and related external side effects.
