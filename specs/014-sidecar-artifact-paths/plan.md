# Implementation Plan: Sidecar Artifact Paths

**Branch**: `chore/225-define-sidecar-artifact-paths` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/014-sidecar-artifact-paths/spec.md`

## Summary

Add sidecar-only artifact path guidance to the repository workflow documentation. The documentation will define coordinator and child Spec Kit artifact path shapes, identify the GitHub issue number as the uniqueness key, keep normal sequential Spec Kit behavior unchanged, keep closed-child coordinator final passes on the existing sequential workflow, and require future sidecar artifact preparation to stop safely on collisions or duplicate child issue numbers.

## Technical Context

**Language/Version**: Java 17 and Spring Boot 4.0.2 backend; Angular 21.2.x and TypeScript 5.9.x frontend. This feature changes repository workflow documentation only.

**Primary Dependencies**: Existing Markdown repository documentation and Spec Kit artifact conventions. No application dependency changes.

**Storage**: N/A. No persistence, schema, browser storage, API payload, or data model changes.

**Testing**: Manual workflow documentation review, PowerShell path simulation for one coordinator and three child artifact paths, repeated-run collision simulation, duplicate child issue detection simulation, and `git diff --check`. Repository-wide app tests are not required because no backend or frontend runtime code changes.

**Target Platform**: CatWorld repository documentation consumed by maintainers and future Codex workflow sessions.

**Project Type**: CatWorld full-stack web administration system with repository workflow infrastructure.

**Performance Goals**: N/A. No performance-sensitive behavior changes.

**Constraints**: Artifact path guidance applies only to sidecar coordinator parallel execution; normal sequential Spec Kit behavior remains unchanged; closed-child coordinator final pass remains in the existing sequential workflow; do not generate artifacts; do not replace Spec Kit; do not modify existing implementation skill behavior.

**Scale/Scope**: One workflow documentation subsection plus feature artifacts for issue #225.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, or platform claims.
- **Layered monolith responsibilities**: Compliant/N/A. No backend application layers are changed.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, or database integrity behavior changes.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. Issue #225, parent #220, dependencies #221/#222, `AGENTS.md`, and `docs/ARCHITECTURE.md` define the workflow contract; the spec has no unresolved open questions.
- **Architecture and technology assessment**: No assessment required. The plan adds repository workflow documentation and does not introduce a significant dependency, framework, shared infrastructure mechanism, material security/persistence/shared-contract decision, operational mechanism, or costly replacement.
- **Focused changes and proportional validation**: Compliant. Scope is limited to workflow documentation and feature artifacts; validation is text review plus local path and collision simulations.
- **Operational safety and sources of truth**: Compliant. No secrets, operational data, deployment exposure, backup, or recovery behavior changes. `docs/ARCHITECTURE.md` remains the source of truth for the longer workflow explanation.

Post-design re-check: still compliant. Phase 1 artifacts confirm no data model, API contract, persistence, authorization, UI, runtime, or operational safety changes.

## Architecture and Technology Assessment

**Assessment required**: No. This is a documentation-only workflow clarification using existing repository Markdown documentation.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Use `docs/ARCHITECTURE.md`, the existing repository workflow documentation source established by #222. Fits the confirmed requirement, keeps longer explanation out of `AGENTS.md`, and avoids changing implementation skills.
- Established library/framework/service: N/A. Adding tooling or services would exceed the issue scope.
- Focused custom implementation: N/A. Custom artifact generation or validation scripts would exceed the issue scope and risk implementing sidecar behavior prematurely.

**Selected approach**: Existing repository Markdown workflow documentation in `docs/ARCHITECTURE.md`, plus generated Spec Kit planning and validation artifacts.

**Why selected**: It directly satisfies #225, follows #222's source-of-truth placement, keeps normal sequential behavior unchanged, and avoids new runtime, tooling, or architecture decisions.

**Confirmed medium-term use**: Supports the #220 opt-in sidecar workflow epic after #221 and #222 established routing guardrails and documentation placement.

**Maintenance and operational consequences**: Maintainers own the wording as repository workflow documentation. There are no security, runtime, accessibility, persistence, or deployment consequences.

**Reversibility and migration path**: Low cost. The documentation can be edited, removed, or later replaced by a future approved sidecar workflow implementation issue.

**Human approval**: N/A because no significant architecture or technology assessment is required.

## Semantic Equivalence and Replacement Review

**Review required**: No. This feature adds workflow documentation only; it does not replace UI primitives, shared components, interaction mechanisms, data/contract mechanisms, or existing workflow implementation internals.

**Old behavior/source of truth**: Existing sequential routing and workflow guidance in `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, and `docs/ARCHITECTURE.md` remain authoritative.

**New mechanism semantics**: N/A. The path guidance is documentation for a future sidecar workflow, not an implemented mechanism.

**Mismatch risks**: Documentation could imply sidecar artifact paths apply to normal sequential Spec Kit behavior, that closed-child coordinator final passes require sidecar naming, or that collisions may be overwritten/reused.

**Mitigation**: State the sidecar-only boundary, preserve normal sequential behavior, preserve final-pass sequential behavior, and make collision handling a stop condition.

**Proof required**: Manual review against issues #220, #221, #222, and #225; local path uniqueness and repeated-run collision simulations.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Sidecar coordinator and child artifact path patterns (TR-001, TR-002, TR-003, TR-004) | Repository workflow documentation | Manual review plus path simulation | Rerun after any artifact path wording change |
| Sidecar-only boundary, normal sequential behavior, and closed-child coordinator final pass behavior (TR-005, TR-006, TR-007) | `docs/ARCHITECTURE.md`, `AGENTS.md`, issue bodies | Manual review against #220, #221, #222, and #225 | Recheck after any workflow wording change |
| Collision and duplicate child issue stop rules (TR-008, TR-009, TR-010) | Repository workflow documentation | Repeated-run collision simulation and duplicate-number simulation | Rerun after any collision wording change |
| Changed workflow docs and feature artifacts formatting | Git diff | `git diff --check` | Rerun after any text edit |

## Project Structure

### Documentation (this feature)

```text
specs/014-sidecar-artifact-paths/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
docs/
└── ARCHITECTURE.md
```

**Structure Decision**: Add the sidecar artifact path contract to the existing `docs/ARCHITECTURE.md` Codex workflow routing section, because issue #222 established it as the longer source-of-truth explanation. No backend, frontend, migration, operations, or implementation-skill paths are in scope.

## Complexity Tracking

No constitution-significant complexity is introduced.
