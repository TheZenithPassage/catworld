# Implementation Plan: Sidecar Artifact Preparation

**Branch**: `chore/227-add-coordinator-child-artifact-preparation` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/016-sidecar-artifact-preparation/spec.md`

## Summary

Extend the sidecar coordinator skill from #226 so explicit sidecar coordinator preparation can create or require safe coordinator and child implementation artifacts before any future delegation. The implementation will add an artifact-preparation contract to the existing sidecar skill, define coordinator and child artifact contents using #225 paths, add stop conditions for missing shared contracts or unsafe artifacts, and preserve the normal sequential Spec Kit workflow, closed-child coordinator final pass, Git/PR boundaries, issue-mutation boundaries, and CatWorld product code unchanged.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2 and Angular 21.2.x / TypeScript 5.9.x exist in the repository, but this feature changes repository-local Codex workflow instructions and generated Spec Kit artifacts only.

**Primary Dependencies**: Existing repo-local Codex skills under `.agents/skills/`, especially `.agents/skills/catworld-parallel-coordinator/SKILL.md`; `AGENTS.md` routing guardrails; `docs/ARCHITECTURE.md` sidecar workflow documentation; issue #220 sidecar architecture; issue #225 artifact path rules; issue #226 sidecar entrypoint. No runtime or package dependency changes.

**Storage**: N/A. No persistence, schema, browser storage, API payload, external service contract, operational data, or CatWorld application data model changes.

**Testing**: Manual/local workflow simulation for one coordinator and at least three child issues; text checks for artifact path, shared-contract blocker, no seed/foundation issue creation, and closed-child final-pass exclusions; changed-file scope review confirming `catworld-implement-issue` is untouched; `git diff --check`. Backend/frontend runtime tests are not required because no product runtime code changes.

**Target Platform**: Codex sessions and maintainers consuming CatWorld repository-local workflow skills and Spec Kit artifacts.

**Project Type**: CatWorld full-stack web administration system with repository-local Codex/Spec Kit workflow infrastructure.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Extend only the sidecar coordinator skill from #226; use #225 artifact path naming; prepare coordinator and child implementation artifacts before delegation; validate child artifacts against coordinator, child issues, source-of-truth docs, and shared contract; stop before delegation when artifacts or shared contracts are unsafe; do not invent seed/foundation/shared-contract child issues; do not use this path for closed-child coordinator final passes; keep normal sequential Spec Kit flow unchanged; do not change product code, branch/worktree rules, PR rules, or GitHub issue mutation behavior.

**Scale/Scope**: One existing sidecar skill file plus generated Spec Kit artifacts for issue #227. `docs/ARCHITECTURE.md` may be updated only if needed to keep the workflow source of truth aligned with the skill.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, generic platform claims, or deployment assumptions.
- **Layered monolith responsibilities**: Compliant/N/A. No backend controller, service, repository, database, DTO, mapper, or application code changes.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, frontend protections, or database constraints change.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. The spec records objective technical outcomes, scope boundaries, edge cases, out-of-scope behavior, and no unresolved open questions. The selected implementation surface is specified by issue #227 and builds on approved issues #225 and #226.
- **Architecture and technology assessment**: Assessment required because artifact preparation is a significant shared workflow capability in the sidecar coordination path. The assessment below references the already-approved sidecar direction from #220, the artifact path contract from #225, the isolated sidecar skill from #226, and #227's explicit instruction to extend only that skill.
- **Focused changes and proportional validation**: Compliant. Planned changes are limited to workflow instructions and feature artifacts; validation uses local simulations, text checks, changed-file review, and whitespace validation proportional to the non-runtime scope.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, deployment exposure, backup, recovery, or production operation changes. Workflow sources of truth remain `AGENTS.md`, `docs/ARCHITECTURE.md`, the sidecar skill, and feature artifacts.

Post-design re-check: compliant. Phase 1 artifacts confirm no data model, API, persistence, authorization, UI, runtime, or operational safety changes. The selected sidecar skill extension remains the approved direction from #220/#225/#226/#227 and no agent-selected significant decision remains pending.

## Architecture and Technology Assessment

**Assessment required**: Yes. Preparing coordinator and child artifacts before future delegation is a significant shared workflow capability in the sidecar coordinator path.

**Decision trigger**: significant shared capability; significant cross-cutting workflow concern; material shared-contract decision for how future child implementers receive prepared artifacts; meaningful replacement risk if coupled into the existing sequential workflow.

**Options considered**:

- Existing platform/framework/project capability: Extend `.agents/skills/catworld-parallel-coordinator/SKILL.md`, the isolated sidecar coordinator skill created by #226. This directly fits #227's "extend only" scope and keeps current sequential workflows unchanged.
- Established library/framework/service: N/A. No external workflow engine, package, service, or plugin is needed for repo-local Codex skill instructions.
- Focused custom implementation: Add a separate artifact generator script or a new artifact-preparation skill. This could isolate generation details, but it would exceed #227's explicit instruction to extend only the new sidecar coordinator skill and risk adding an unapproved workflow surface before child implementation and Git rules exist.

**Selected approach**: Extend `.agents/skills/catworld-parallel-coordinator/SKILL.md` with an artifact-preparation phase, coordinator/child artifact expectations, validation gates, and stop conditions. Add only aligned workflow documentation if needed.

**Why selected**: It satisfies #227 directly, uses #225 artifact naming, builds on #226's isolated entrypoint, keeps `.agents/skills/catworld-implement-issue/SKILL.md` untouched, and remains reversible because the sidecar rules stay in one workflow skill.

**Confirmed medium-term use**: Supports later #220 child issues for child implementation skill creation (#228), Git branch/worktree rules (#229), PR and mutation rules (#230), validation/conflict handling (#231), resumable state tracking (#232), handoff alignment (#233), and adoption dry-run (#234).

**Maintenance and operational consequences**: Maintainers must keep the sidecar skill, `AGENTS.md`, `docs/ARCHITECTURE.md`, and future #220 child issue artifacts aligned. The skill must continue to stop before delegation until later approved issues add child execution, Git, PR, mutation, state, and adoption behavior.

**Reversibility and migration path**: Low to moderate cost. The artifact-preparation wording can be revised, split into a future dedicated skill, or removed without rewriting the existing sequential implementation workflow because the change is isolated to the sidecar skill surface.

**Human approval**: Approved by prior issue-scoped decisions and the active issue contract. Issue #220 approves a sidecar workflow beside the sequential workflow, issue #225 approves sidecar artifact path rules, issue #226 approves `.agents/skills/catworld-parallel-coordinator/SKILL.md` as the sidecar entrypoint, and issue #227 explicitly requires extending only that skill for coordinator and child artifact preparation.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. This feature changes the sidecar skill from preflight-only awareness to artifact-preparation guidance, so validation must prove it does not replace or alter the normal sequential Spec Kit workflow or closed-child coordinator final-pass routing.

**Old behavior/source of truth**: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `docs/ARCHITECTURE.md`, and issues #220, #225, #226.

**New mechanism semantics**: The sidecar coordinator skill defines a preparation phase that creates or requires coordinator orchestration and child implementation artifacts using #225 paths, validates them against source-of-truth and shared contracts, and stops before delegation when unsafe.

**Mismatch risks**: The skill could imply the normal sequential workflow now uses sidecar artifacts, change the closed-child coordinator final pass, create unapproved seed/foundation/shared-contract issues, skip shared-contract blockers, perform child implementation or Git/PR operations too early, or mutate existing workflow files.

**Mitigation**: Encode explicit boundaries and stop conditions in the sidecar skill, keep `.agents/skills/catworld-implement-issue/SKILL.md` untouched, keep product code out of scope, and validate using text checks plus changed-file review.

**Proof required**: Local simulation from quickstart, text searches for required preparation and blocker language, `git diff --name-only` scope review, `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md`, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Artifact-preparation phase before delegation (TR-001) | `.agents/skills/catworld-parallel-coordinator/SKILL.md` | Text review and local simulation | Rerun after sidecar skill edits |
| Coordinator orchestration artifact contents (TR-002) | Sidecar skill and contract artifact | Text search for child issue map, dependency layers, shared contract, validation plan, status table | Rerun after artifact wording changes |
| Child `spec.md`, `plan.md`, `tasks.md` preparation (TR-003) | Sidecar skill and contract artifact | Local three-child simulation and artifact path review | Rerun after child artifact wording changes |
| #225 path rules and collision behavior (TR-004, TR-006) | Sidecar skill, `docs/ARCHITECTURE.md`, quickstart | Path simulation and collision-stop text review | Rerun after path or collision wording changes |
| Validation against coordinator, child issues, source-of-truth docs, and shared contract (TR-005) | Sidecar skill and contract artifact | Text review and missing/shared-contract blocker simulation | Rerun after validation wording changes |
| No seed/foundation/shared-contract child issue invention (TR-007) | Sidecar skill | Text search and manual review | Rerun after issue-creation wording changes |
| Normal sequential flow and closed-child final pass unchanged (TR-008, TR-009) | Existing workflow skills and sidecar skill | Changed-file review and routing-boundary text review | Rerun before final report |
| Required validation scope (TR-010) | Quickstart, git diff | `git diff --name-only`; `git diff --check`; manual simulation | Rerun after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/016-sidecar-artifact-preparation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-artifact-preparation.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.agents/skills/
└── catworld-parallel-coordinator/
    └── SKILL.md

docs/
└── ARCHITECTURE.md
```

**Structure Decision**: Extend the existing sidecar coordinator skill introduced by #226 and update `docs/ARCHITECTURE.md` only if needed to keep the longer workflow source of truth aligned. Do not touch backend, frontend, migration, operations, Git automation, PR automation, GitHub issue mutation, `.agents/skills/catworld-implement-issue/SKILL.md`, or `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.

## Complexity Tracking

No constitution exception is required. The shared workflow capability is the approved sidecar skill extension requested by #227 and remains isolated from existing sequential workflows.
