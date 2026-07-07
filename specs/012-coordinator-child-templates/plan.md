# Implementation Plan: Coordinator and Child Issue Templates

**Branch**: `docs/223-add-coordinator-child-issue-templates` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/012-coordinator-child-templates/spec.md`

## Summary

Add two concise GitHub issue templates for opt-in coordinator parallel planning: one coordinator template and one focused child template. Implement them as standard repository Markdown issue templates under `.github/ISSUE_TEMPLATE/`, preserving the current sequential workflow as the default and making clear that templates alone do not activate parallel mode.

## Technical Context

**Language/Version**: Java 17 and Spring Boot 4.0.2 backend; Angular 21.2.x and TypeScript 5.9.x frontend. This feature changes repository workflow documentation/templates only.

**Primary Dependencies**: Existing GitHub issue template support. No application dependency changes.

**Storage**: N/A. No persistence, schema, browser storage, or data model changes.

**Testing**: Manual template-body generation/review required by issue #223; repository-wide app tests are not required because no backend or frontend runtime code changes.

**Target Platform**: GitHub repository issue creation UI and local repository review.

**Project Type**: CatWorld full-stack web administration system with repository workflow infrastructure.

**Performance Goals**: N/A. No performance-sensitive behavior changes.

**Constraints**: Preserve the normal sequential issue workflow; do not activate sidecar parallel execution; do not change implementation skills; do not add PR description templates; keep templates concise.

**Scale/Scope**: Two issue templates plus Spec Kit artifacts for issue #223.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, or platform claims.
- **Layered monolith responsibilities**: Compliant/N/A. No backend application layers are changed.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, or database integrity behavior changes.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. Issue #223, parent #220, and dependencies #221/#222 define the routing contract; the spec has no unresolved open questions.
- **Architecture and technology assessment**: No assessment required. The plan uses existing GitHub Markdown issue template capability and does not introduce a significant dependency, framework, shared infrastructure mechanism, material security/persistence/shared-contract decision, or costly replacement.
- **Focused changes and proportional validation**: Compliant. Scope is limited to issue templates and feature artifacts; validation is local sample body generation plus manual review against #220-#222.
- **Operational safety and sources of truth**: Compliant. No secrets, operational data, deployment exposure, backup, or recovery behavior changes. The new templates become repository workflow source-of-truth artifacts.

Post-design re-check: still compliant. Phase 1 artifacts confirm no data model, API contract, persistence, authorization, UI, or operational safety changes.

## Architecture and Technology Assessment

**Assessment required**: No. This is a documentation/workflow-template addition using GitHub's existing repository issue template capability.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Use `.github/ISSUE_TEMPLATE/*.md` issue templates. Fits the confirmed requirement to create issue bodies from templates, has no new dependency, and is reversible by editing or removing template files.
- Established library/framework/service: N/A. Adding tooling or services would exceed the issue scope.
- Focused custom implementation: N/A. Custom generation scripts or workflow automation would exceed the issue scope and risk changing normal workflow behavior.

**Selected approach**: Existing GitHub Markdown issue template files.

**Why selected**: It directly satisfies the requested local template bodies, keeps the change concise, and avoids new runtime, tooling, or architecture decisions.

**Confirmed medium-term use**: Supports the #220 opt-in sidecar workflow epic by providing issue-authoring templates after the #221/#222 routing documentation is in place.

**Maintenance and operational consequences**: Maintainers own the template wording as repository workflow documentation. There are no security, runtime, accessibility, persistence, or deployment consequences.

**Reversibility and migration path**: Low cost. Templates can be edited, removed, or later replaced by GitHub issue forms if a future approved issue requires richer structured issue creation.

**Human approval**: N/A because no significant architecture or technology assessment is required.

## Semantic Equivalence and Replacement Review

**Review required**: No. This feature adds new issue templates and does not replace UI primitives, shared components, interaction mechanisms, data/contract mechanisms, or existing workflow implementation internals.

**Old behavior/source of truth**: Existing sequential routing guardrails in `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, and docs added by #222 remain the source of truth.

**New mechanism semantics**: N/A. The templates are authoring aids only.

**Mismatch risks**: Template wording could imply that parallel mode is active, that templates change routing, or that coordinator finalization should redo closed child issue scope.

**Mitigation**: Include explicit routing guardrail language in both templates and validate generated sample bodies against #220-#222.

**Proof required**: Manual review of the templates and generated sample bodies against #220, #221, and #222.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Coordinator template sections and routing text (TR-001, TR-003, TR-005, TR-006, TR-007, TR-009) | Repository issue template files | Local sample body generation plus manual review | Rerun after any template wording change |
| Child template sections and sequential child execution text (TR-002, TR-003, TR-004, TR-007, TR-009) | Repository issue template files | Local sample body generation plus manual review | Rerun after any template wording change |
| Alignment with #220-#222 routing contract (TR-008) | Issue bodies and repository workflow docs | Manual cross-check against fetched issue bodies | Recheck after any template wording change |

## Project Structure

### Documentation (this feature)

```text
specs/012-coordinator-child-templates/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── issue-template-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/
└── ISSUE_TEMPLATE/
    ├── coordinator-parallel-planning.md
    └── focused-child-issue.md
```

**Structure Decision**: Add standard GitHub Markdown issue templates in `.github/ISSUE_TEMPLATE/`. No backend, frontend, migration, operations, or implementation-skill paths are in scope.

## Complexity Tracking

No constitution-significant complexity is introduced.
