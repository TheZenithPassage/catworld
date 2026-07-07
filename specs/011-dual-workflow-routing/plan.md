# Implementation Plan: Dual Workflow Routing Documentation

**Branch**: `docs/222-document-dual-workflow-routing` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-dual-workflow-routing/spec.md`

## Summary

Document CatWorld's dual Codex workflow routing so the current sequential one-issue workflow remains the default, while the future sidecar coordinator parallel workflow is described as opt-in only. The implementation will update repository documentation, not `AGENTS.md`, implementation skills, product code, sidecar skills, or git orchestration logic.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2; Angular 21 / TypeScript 5.9 frontend exist in the repository but are not changed by this documentation-only feature.

**Primary Dependencies**: Existing repository documentation and workflow instructions: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, issue #220, issue #221, and issue #222. No new runtime or tooling dependency.

**Storage**: N/A - no persistence, schema, file storage, browser storage, or external data contract changes.

**Testing**: Manual documentation review against #220, #221, and #222; `git diff --check`; current diff/scope review. Product/backend/frontend tests are not required because no product behavior or executable application code changes.

**Target Platform**: Repository documentation consumed by Codex sessions and maintainers.

**Project Type**: CatWorld full-stack web administration system with repository-local Codex/Spec Kit workflow guidance.

**Performance Goals**: N/A - no runtime performance behavior changes.

**Constraints**: Keep longer explanatory workflow guidance out of `AGENTS.md`; do not edit `.agents/skills/catworld-implement-issue/SKILL.md`; do not create sidecar skills; do not implement git orchestration logic; do not describe product behavior as changed.

**Scale/Scope**: One documentation update plus feature planning artifacts for issue #222.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The change documents repository workflow for CatWorld and does not add product scope, cross-species abstraction, multi-tenancy, or platform claims.
- **Layered monolith responsibilities**: Compliant. No controller, service, repository, database, DTO, mapper, or application code changes.
- **Backend and database authority**: Compliant. No business rules, authorization, validation, calculations, frontend behavior, or database constraints change.
- **Schema evolution**: N/A. No schema changes or Flyway migrations.
- **Protected stay model**: N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. The spec records observable technical outcomes, scope, edge cases, exclusions, and validation. There are no unresolved product, security, persistence, shared-contract, architecture, UX, correctness-sensitive, or operational decisions.
- **Architecture and technology assessment**: Assessment required: No. This is a documentation-only change using existing docs and issue decisions, with no significant framework, dependency, shared infrastructure, persistence, security, shared contract, operational, or costly migration decision.
- **Focused changes and proportional validation**: Compliant. Planned changes are limited to documentation and feature artifacts, with manual review and diff/whitespace validation proportional to risk.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, deployment exposure, backups, or recovery procedures change. Repository documentation remains the relevant source of truth for workflow guidance.

Post-design re-check: Compliant. Phase 1 artifacts confirm no data model, external contract, product, persistence, security, or operational behavior changes.

## Architecture and Technology Assessment

**Assessment required**: No. Issue #222 requires documentation of an already specified routing contract and explicitly excludes sidecar skill creation, existing implementation skill edits, and git orchestration logic.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Use existing repository documentation. Fits the issue requirement to keep longer explanation out of `AGENTS.md`, has minimal maintenance cost, and keeps workflow guidance reviewable.
- Established library/framework/service: N/A. No executable workflow system or external service is needed.
- Focused custom implementation: N/A. The issue excludes sidecar skills and git orchestration logic.

**Selected approach**: Update existing repository documentation with a concise Codex workflow routing section and supporting validation artifacts.

**Why selected**: This directly satisfies #222 while preserving #220 and #221 guardrails and avoiding excluded implementation work.

**Confirmed medium-term use**: Supports the remaining #220 child issues by giving maintainers and future Codex sessions a stable explanation of default sequential routing, opt-in sidecar parallel routing, and coordinator finalization.

**Maintenance and operational consequences**: Documentation must stay aligned as later #223-#234 workflow issues add templates, sidecar skills, artifact paths, validation, and adoption gates.

**Reversibility and migration path**: Low cost. The documentation section can be edited or moved when the sidecar workflow is implemented and adopted.

**Human approval**: N/A - no significant architecture or technology decision is selected by this plan.

## Semantic Equivalence and Replacement Review

**Review required**: No. This feature does not replace UI primitives, shared components, interaction mechanisms, presentation mechanisms, data/contract mechanisms, workflow skills, or executable behavior.

**Old behavior/source of truth**: Existing routing guardrails in `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md`, plus issue #220 and #221.

**New mechanism semantics**: N/A - documentation explanation only.

**Mismatch risks**: Documentation could contradict routing guardrails or imply sidecar parallel mode is already available for #220-#234.

**Mitigation**: Manually review the final documentation against #220, #221, #222, `AGENTS.md`, and the implementation skill guardrails.

**Proof required**: Manual documentation review and changed-file scope review.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| TR-001 through TR-007 routing cases | Repository documentation | Manual review against #220, #221, #222, `AGENTS.md`, and `.agents/skills/catworld-implement-issue/SKILL.md` | Rerun after documentation edits |
| TR-011 parallel readiness and no-label rule | Repository documentation | Manual review against #222; confirm readiness comes from coordinator preflight, child issue inspection, dependency classification and source-of-truth review, with no required or invented `parallel-ready` label | Rerun after documentation edits |
| TR-008 and TR-009 exclusions | Changed-file scope and documentation review | `git diff --name-only`; manual review that implementation skills and `AGENTS.md` are not part of final diff | Rerun before final report |
| Documentation formatting | Git diff whitespace check | `git diff --check` | Rerun after final edits |
| Product behavior unchanged | Scope review | Manual review of changed paths and text; no product code changes | Rerun before final report |

## Project Structure

### Documentation (this feature)

```text
specs/011-dual-workflow-routing/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── README.md
└── tasks.md
```

### Source Code (repository root)

```text
docs/ARCHITECTURE.md
```

**Structure Decision**: Add the longer workflow routing explanation to `docs/ARCHITECTURE.md`, which already records repository architecture, CI, and project source-of-truth information. Do not edit `AGENTS.md` for the long explanation, and do not edit existing implementation skills.

## Complexity Tracking

No complexity exceptions are required.
