# Implementation Plan: Sidecar Git Rules

**Branch**: `chore/229-add-sidecar-git-execution-rules` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/018-sidecar-git-rules/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extend the opt-in sidecar coordinator workflow so future parallel execution has explicit Git branch, checkout/worktree, refresh, PR-target, and cleanup boundaries. The implementation will update the sidecar coordinator and child implementation skills plus architecture documentation to record coordinator/child branch state, require child branches and PRs to target the coordinator branch, refresh active child branches by normal merge only, prohibit rebase/force-push/history rewriting, and preserve normal sequential Git flow for direct child work and closed-child coordinator final passes.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2 and Angular 21.2.x / TypeScript 5.9.x exist in the repository, but this feature changes repository-local Codex workflow instructions and generated Spec Kit artifacts only.

**Primary Dependencies**: Existing repo-local Codex skills under `.agents/skills/`, especially `.agents/skills/catworld-parallel-coordinator/SKILL.md` and `.agents/skills/catworld-parallel-child-implementation/SKILL.md`; `AGENTS.md` routing guardrails; `docs/ARCHITECTURE.md` Codex workflow routing documentation; issue #220 operational guardrails; completed issues #226, #227, and #228.

**Storage**: N/A for CatWorld runtime persistence. The feature defines workflow artifact state recorded in the coordinator artifact; it does not change domain entities, database schema, browser storage, API payloads, or external service contracts.

**Testing**: Manual/local Git workflow simulation in a temporary repository for one coordinator branch and two child branches; text checks for child PR target, merge-only refresh, cleanup timing, and closed-child coordinator final-pass boundaries; changed-file review confirming normal sequential workflow implementation is unchanged; `git diff --check`.

**Target Platform**: Codex sessions and maintainers consuming CatWorld repository-local workflow skills and Spec Kit artifacts.

**Project Type**: CatWorld full-stack web administration system with repository-local Codex/Spec Kit workflow infrastructure.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Apply Git rules only to the sidecar coordinator parallel workflow; coordinator branch starts from current `origin/main`; child branches start from the coordinator branch; each active child uses an isolated local checkout/worktree; names are deterministic from issue numbers and slugs; collisions stop unless clearly recoverable; child PRs target the coordinator branch; active child refresh after child PR merge uses normal merge only; rebase, force-push, and history rewriting are prohibited; local cleanup is eligible only after final coordinator PR merge to `main`; remote cleanup requires explicit user approval; direct child issue work and closed-child coordinator final passes keep normal sequential Git flow.

**Scale/Scope**: Workflow-source changes to the sidecar coordinator skill, sidecar child implementation skill, `docs/ARCHITECTURE.md`, and generated feature artifacts for issue #229. No CatWorld product code, runtime configuration, migration, backend, frontend, pull request operation, GitHub issue mutation, or normal sequential workflow implementation changes.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, generic platform claims, or deployment assumptions.
- **Layered monolith responsibilities**: Compliant/N/A. No backend controller, service, repository, database, DTO, mapper, or application code changes.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, frontend protections, or database constraints change.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. The spec records technical outcomes, state-sensitive workflow cases, scope boundaries, edge cases, out-of-scope behavior, dependencies, and no unresolved open questions. The selected sidecar-only Git model is specified by issue #229 and parent epic #220.
- **Architecture and technology assessment**: Assessment required because sidecar Git execution rules are a material operational workflow decision and shared sidecar execution capability. The assessment below references the human-authored issue contracts from #220 and #229 and the prior sidecar skills from #226-#228.
- **Focused changes and proportional validation**: Compliant. Planned changes are limited to workflow instructions and feature artifacts; validation uses local Git simulations, text checks, changed-file review, and whitespace validation proportional to non-runtime operational workflow scope.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, deployment exposure, backup, recovery, or production operation changes. The plan explicitly keeps remote cleanup behind user approval and preserves repository workflow sources of truth.

Post-design re-check: compliant. Phase 1 artifacts confirm no runtime data model, API, persistence, authorization, UI, migration, or product behavior changes. The selected sidecar Git state contract records only workflow artifact state and remains within the approved sidecar workflow from #220 and #229.

## Architecture and Technology Assessment

**Assessment required**: Yes. Sidecar Git branch, checkout/worktree, refresh, PR-target, and cleanup rules are a material operational decision for the future parallel workflow and a shared capability used by both coordinator and child sidecar skills.

**Decision trigger**: significant shared capability; material operational decision; significant cross-cutting workflow concern; meaningful replacement risk if the rules changed normal sequential issue delivery.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar workflow skills and `docs/ARCHITECTURE.md` with explicit Git state, branch, checkout, refresh, PR-target, and cleanup rules. This fits #229, uses existing source-of-truth locations, and keeps normal sequential workflow delivery unchanged.
- Established library/framework/service: N/A. No external Git orchestration service, workflow engine, or dependency is needed for repository-local Codex skill instructions.
- Focused custom implementation: Add scripts that create branches/worktrees automatically. This would exceed #229 because the issue defines execution rules and validation simulations, not live branch orchestration or PR opening, and it would add operational risk before #230-#234 are complete.

**Selected approach**: Extend `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and `docs/ARCHITECTURE.md` with sidecar Git execution rules and coordinator artifact Git-state requirements. Do not add Git automation scripts, dependencies, or product code.

**Why selected**: The approach directly satisfies #229, preserves the isolated sidecar architecture from #220/#226-#228, gives both coordinator and child handoffs the same branch/worktree contract, and remains reversible because it is documentation/skill text rather than executable branch automation.

**Confirmed medium-term use**: Supports later #220 child issues for sidecar PR target and GitHub mutation rules (#230), validation/blockers/conflicts (#231), resumable state tracking and cleanup policy (#232), explicit split handoff alignment (#233), and controlled dry-run/adoption gate (#234).

**Maintenance and operational consequences**: Maintainers must keep the sidecar coordinator skill, child implementation skill, `docs/ARCHITECTURE.md`, and later #220 child artifacts aligned. Future sidecar execution must enforce the recorded state contract before any Git, PR, or cleanup operation and must continue to avoid rebase, force-push, history rewriting, and unapproved remote cleanup.

**Reversibility and migration path**: Low to moderate cost. The rules can be revised or split into a future dedicated sidecar Git skill before adoption, while normal sequential workflow remains unaffected because this feature does not change `.agents/skills/catworld-implement-issue/SKILL.md` or add executable automation.

**Human approval**: Approved by the active issue contract and prior issue-scoped decisions. Issue #220 defines the sidecar operational guardrails, and issue #229 explicitly approves adding these sidecar Git execution rules. Issues #226-#228 establish the sidecar coordinator and child skill surfaces that this issue extends.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. This feature adds sidecar Git execution rules that must not replace or alter normal sequential branch preparation, direct child issue delivery, or closed-child coordinator final-pass behavior.

**Old behavior/source of truth**: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, and issue #220 routing/operational guardrails.

**New mechanism semantics**: Sidecar coordinator execution owns a coordinator integration branch from current `origin/main`; each child branch starts from the coordinator branch in an isolated checkout/worktree; child PRs target the coordinator branch; active children refresh from coordinator by normal merge; cleanup is local-only and eligible only after final coordinator PR merge.

**Mismatch risks**: The wording could accidentally imply sidecar rules apply to normal issue work, closed-child coordinator final passes, or issues #220-#234 during build-out; permit direct child PRs to `main`; omit collision stop conditions; permit rebase/force-push/history rewriting; or allow local/remote cleanup too early.

**Mitigation**: Encode explicit sidecar-only boundaries, normal workflow exclusions, collision stop rules, prohibited operations, and cleanup timing in both sidecar skills and architecture documentation. Keep the normal sequential implementation skill unchanged.

**Proof required**: Local Git simulation from `quickstart.md`, text searches for required and prohibited sidecar Git rules, changed-file scope review, explicit diff review showing `.agents/skills/catworld-implement-issue/SKILL.md` is unchanged, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Coordinator branch from current `origin/main`; child branches from coordinator branch; isolated checkout/worktree state (TR-001-TR-006) | Sidecar coordinator skill, child skill, docs, temporary Git simulation | Text review and local simulation | Rerun after sidecar Git wording changes |
| Child PRs target coordinator branch, not `main` (TR-007) | Sidecar skills and docs | Text search/manual review | Rerun after PR-target wording changes |
| Active child branch refresh uses normal merge only; no rebase, force-push, or history rewriting (TR-008-TR-009, TR-016) | Sidecar skills, docs, temporary Git simulation | Local merge simulation and prohibited-term context review | Rerun after refresh/recovery wording changes |
| Local cleanup timing and remote cleanup approval (TR-010-TR-012) | Sidecar coordinator skill, child skill, docs, quickstart | Cleanup eligibility simulation and manual review | Rerun after cleanup wording changes |
| Direct child issue work and closed-child coordinator final passes keep normal sequential flow (TR-013-TR-014) | Sidecar skills, docs, normal workflow scope review | Text review and changed-file review | Rerun before final report |
| Required validation scope (TR-015-TR-016) | Quickstart, git diff, text searches | `git diff --check`, local simulation, manual review | Rerun after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/018-sidecar-git-rules/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-git-state.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.agents/skills/
├── catworld-parallel-coordinator/
│   └── SKILL.md
└── catworld-parallel-child-implementation/
    └── SKILL.md

docs/
└── ARCHITECTURE.md
```

**Structure Decision**: Update the two sidecar skills that own coordinator and child sidecar execution boundaries, and update `docs/ARCHITECTURE.md` as the longer workflow source of truth. Do not touch backend, frontend, migration, operations, Git automation scripts, PR automation, GitHub issue mutation, `.agents/skills/catworld-implement-issue/SKILL.md`, or `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.

## Complexity Tracking

No constitution exception is required. The shared operational workflow rules are explicitly requested by #229, are isolated to the sidecar workflow surface approved by #220/#226-#228, and preserve normal sequential workflow behavior.
