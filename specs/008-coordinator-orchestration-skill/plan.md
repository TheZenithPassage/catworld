# Implementation Plan: Coordinator Issue Orchestration Skill

**Branch**: `chore/202-add-coordinator-issue-orchestration-skill` | **Date**: 2026-07-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-coordinator-orchestration-skill/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a repo-local CatWorld coordinator issue orchestration skill at `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, then update only the governing workflow instructions needed to route coordinator issues to that skill while preserving `.agents/skills/catworld-implement-issue/SKILL.md` as the concrete single-child implementation path. The approach is documentation/workflow-only, follows existing repo-local skill conventions, and keeps existing Git safety rules authoritative by reference.

## Technical Context

**Language/Version**: Markdown workflow documentation and Spec Kit artifacts. Repository evidence also shows Java 17 / Spring Boot 4.0.2 backend and Angular 21 / TypeScript 5.9 frontend, but those application surfaces are not in scope.

**Primary Dependencies**: Existing repo-local skill structure under `.agents/skills/`, `AGENTS.md`, and Spec Kit workflow artifacts under `specs/`. No new runtime, build, backend, frontend, or database dependencies.

**Storage**: N/A. No persistence, schema, browser storage, external data model, or database behavior changes.

**Testing**: Manual workflow review against issue #202 validation scenarios plus `git diff --check`. Backend and frontend application suites are intentionally out of scope unless application files are unexpectedly changed.

**Target Platform**: CatWorld repository agent workflow used by Codex and repo-local skills. No deployed application runtime change.

**Project Type**: CatWorld full-stack web administration system with this feature limited to repository workflow documentation.

**Performance Goals**: N/A. No performance-sensitive runtime behavior changes.

**Constraints**: Documentation/workflow-only; do not change backend, frontend, product behavior, database behavior, `.specify/memory/constitution.md`, or Spec Kit agent-context scripts; do not add shorthand prompt routing; keep child implementation delegated to the existing single-issue implementation skill; reference existing Git safety authorities instead of duplicating the full rules.

**Scale/Scope**: One new coordinator skill, targeted references in `AGENTS.md`, targeted routing clarification in `.agents/skills/catworld-implement-issue/SKILL.md`, and the active Spec Kit artifacts for issue #202.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The change is CatWorld repository workflow guidance and does not introduce product abstractions, cross-species scope, multi-tenancy, or platform claims.
- **Layered monolith responsibilities**: Pass. No controller, service, repository, DTO, mapper, or database code changes.
- **Backend and database authority**: Pass. No business rule, authorization, validation, calculation, or frontend-only protection changes.
- **Schema evolution**: Pass. No schema changes or Flyway migrations.
- **Protected stay model**: Pass. Stay status, dates, cancellation data, and stay invariants are untouched.
- **Specification and planning discipline**: Pass. The spec records objective workflow outcomes, explicit exclusions, edge cases, and no unresolved open questions.
- **Architecture and technology assessment**: Pass. No assessment trigger applies because this uses the existing repo-local skill mechanism and adds no significant application architecture, framework, library, persistence, security, shared runtime contract, operational mechanism, or costly-to-replace dependency.
- **Focused changes and proportional validation**: Pass. Planned validation is proportional to documentation/workflow risk: scenario review, safety-rule scan, changed-path review, and `git diff --check`.
- **Operational safety and sources of truth**: Pass. No secrets, real data, deployment exposure, backup, or recovery behavior changes. The new and updated workflow documentation become the source of truth for coordinator issue orchestration.

## Architecture and Technology Assessment

**Assessment required**: No. This feature uses the existing repo-local skill/documentation mechanism and does not introduce or replace significant application architecture, libraries, shared runtime infrastructure, persistence, security, authorization, UX, or operational mechanisms.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Use existing `.agents/skills/<skill-name>/SKILL.md` repo-local skill pattern. This fully fits the issue and requires no new tooling.
- Established library/framework/service: N/A. The issue requests repository workflow instructions, not a new tool or service.
- Focused custom implementation: N/A for application code. The only custom work is writing the requested Markdown skill and targeted instruction updates.

**Selected approach**: Existing repo-local skill pattern.

**Why selected**: Issue #202 explicitly requests `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`; the repository already uses this pattern for CatWorld and Spec Kit workflows.

**Confirmed medium-term use**: Coordinator issues that split implementation into concrete child sub-issues. No broader product or platform reuse is claimed.

**Maintenance and operational consequences**: Maintainers must keep the coordinator skill aligned with `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, and future explicitly approved multi-agent workflow changes. No runtime operations are affected.

**Reversibility and migration path**: Low. The workflow can be updated or retired by editing repo-local Markdown instructions and any future references.

**Human approval**: N/A because no constitution-triggering architecture or technology assessment is required. Issue #202 supplies the requested workflow shape and file scope.

## Semantic Equivalence and Replacement Review

**Review required**: No. The feature does not replace UI primitives, shared components, interaction mechanisms, presentation mechanisms, data contracts, or runtime behavior.

**Old behavior/source of truth**: Existing end-to-end single-issue workflow in `.agents/skills/catworld-implement-issue/SKILL.md` and repository instructions in `AGENTS.md`.

**New mechanism semantics**: A new coordinator orchestration skill delegates concrete child implementation to the existing single-issue skill and does not alter application behavior.

**Mismatch risks**: Instruction ambiguity could accidentally encourage coordinator issues to be bundled into one PR, hard-dependent child issues to be parallelized, or sub-agents to make unresolved decisions.

**Mitigation**: State coordinator detection, sequential and parallel modes, dependency classifications, shared-contract rule, sub-agent stop conditions, and authoritative safety references in the new skill; add only targeted routing references to existing instructions.

**Proof required**: Manual workflow review against issue #202 scenarios and prohibited-instruction scan; `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| New coordinator skill responsibilities (TR-001 through TR-010) | Repo-local workflow documentation | Manual review against five issue scenarios | Rerun after any change to the new skill or routing instructions |
| Existing workflow routing (TR-011 and TR-012) | `AGENTS.md` and single-issue implementation skill | Manual review verifying normal issues and child issues still use `.agents/skills/catworld-implement-issue/SKILL.md` | Rerun after any instruction edit |
| Explicit exclusions and safety preservation (TR-013) | Changed-path and instruction review | Manual scan for prohibited behavior and out-of-scope files | Rerun after any late file change |
| Whitespace and patch hygiene (TR-014) | Git diff | `git diff --check` | Rerun after any late edit |

## Project Structure

### Documentation (this feature)

```text
specs/008-coordinator-orchestration-skill/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
AGENTS.md
.agents/skills/catworld-implement-issue/SKILL.md
.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md
specs/008-coordinator-orchestration-skill/
```

**Structure Decision**: Add one repo-local skill beside existing CatWorld skills, update only the two existing instruction files allowed by issue #202, and keep all planning artifacts under the generated feature directory.

## Complexity Tracking

> **Complete ONLY for necessary complexity that still complies with the
> constitution. A constitutional conflict cannot be justified here; the plan
> must change or the constitution must be amended first.**

| Complexity | Why Needed | Simpler Alternative Rejected Because | Constitution Compliance |
|------------|------------|-------------------------------------|-------------------------|
| N/A | N/A | N/A | N/A |
