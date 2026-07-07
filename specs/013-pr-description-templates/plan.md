# Implementation Plan: PR Description Templates for Sidecar Coordinator Delivery

**Branch**: `docs/224-add-pr-templates-sidecar-coordinator-delivery` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-pr-description-templates/spec.md`

## Summary

Add sidecar coordinator PR description templates for child-to-coordinator PRs and final coordinator-to-main PRs. Implement them as non-default GitHub Markdown PR templates under `.github/PULL_REQUEST_TEMPLATE/`, plus concise usage guidance and local sample descriptions, so normal one-issue/one-PR descriptions and closed-child coordinator final-pass wording remain unchanged.

## Technical Context

**Language/Version**: Java 17 and Spring Boot 4.0.2 backend; Angular 21.2.x and TypeScript 5.9.x frontend. This feature changes repository workflow documentation/templates only.

**Primary Dependencies**: Existing GitHub Markdown pull request template support. No application dependency changes.

**Storage**: N/A. No persistence, schema, browser storage, or data model changes.

**Testing**: Manual PR-description sample generation/review required by issue #224; lightweight text checks for child-template closing keywords. Repository-wide app tests are not required because no backend or frontend runtime code changes.

**Target Platform**: GitHub repository pull request creation UI and local repository review.

**Project Type**: CatWorld full-stack web administration system with repository workflow infrastructure.

**Performance Goals**: N/A. No performance-sensitive behavior changes.

**Constraints**: Preserve normal one-issue/one-PR PR description behavior; reserve issue-closing wording for the final coordinator PR to `main` in sidecar parallel delivery; closed-child coordinator final pass uses normal sequential wording; do not open real PRs; do not change product code or normal workflow logic.

**Scale/Scope**: Two sidecar PR template files, concise PR template usage guidance, local sample descriptions, and Spec Kit artifacts for issue #224.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, or platform claims.
- **Layered monolith responsibilities**: Compliant/N/A. No backend application layers are changed.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, or database integrity behavior changes.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. Issue #224, parent #220, dependencies #222/#223, `AGENTS.md`, and `docs/ARCHITECTURE.md` define the workflow contract; the spec has no unresolved open questions.
- **Architecture and technology assessment**: No assessment required. The plan uses existing GitHub Markdown PR template capability and does not introduce a significant dependency, framework, shared infrastructure mechanism, material security/persistence/shared-contract decision, or costly replacement.
- **Focused changes and proportional validation**: Compliant. Scope is limited to PR templates, usage guidance, local validation samples, and feature artifacts; validation is text review plus local sample descriptions and manual review against #220-#223.
- **Operational safety and sources of truth**: Compliant. No secrets, operational data, deployment exposure, backup, or recovery behavior changes. The new templates become repository workflow source-of-truth artifacts for sidecar PR wording only.

Post-design re-check: still compliant. Phase 1 artifacts confirm no data model, API contract, persistence, authorization, UI, or operational safety changes.

## Architecture and Technology Assessment

**Assessment required**: No. This is a documentation/workflow-template addition using GitHub's existing repository PR template capability.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Use non-default `.github/PULL_REQUEST_TEMPLATE/*.md` Markdown PR templates. Fits the confirmed requirement to create sidecar PR descriptions, has no new dependency, and preserves normal sequential PR descriptions by avoiding a default PR template.
- Established library/framework/service: N/A. Adding tooling or services would exceed the issue scope.
- Focused custom implementation: N/A. Custom generation scripts or workflow automation would exceed the issue scope and risk changing normal workflow behavior.

**Selected approach**: Existing GitHub Markdown PR template files plus concise usage guidance and local sample descriptions.

**Why selected**: It directly satisfies the requested sidecar PR wording, keeps normal PR behavior unchanged, and avoids new runtime, tooling, or architecture decisions.

**Confirmed medium-term use**: Supports the #220 opt-in sidecar workflow epic after #222 routing documentation and #223 issue templates are in place.

**Maintenance and operational consequences**: Maintainers own the template wording as repository workflow documentation. There are no security, runtime, accessibility, persistence, or deployment consequences.

**Reversibility and migration path**: Low cost. Templates and usage guidance can be edited, removed, or later replaced by a future approved workflow automation if sidecar delivery rules change.

**Human approval**: N/A because no significant architecture or technology assessment is required.

## Semantic Equivalence and Replacement Review

**Review required**: No. This feature adds sidecar PR templates and local samples; it does not replace UI primitives, shared components, interaction mechanisms, data/contract mechanisms, or existing workflow implementation internals.

**Old behavior/source of truth**: Existing sequential routing and PR description guidance in `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, and `docs/ARCHITECTURE.md` remain the source of truth.

**New mechanism semantics**: N/A. The templates are authoring aids only.

**Mismatch risks**: Template wording could imply that child PRs close issues, that normal sequential PR wording changed, or that closed-child coordinator finalization should use sidecar final PR wording.

**Mitigation**: Keep sidecar child and final coordinator templates separate, avoid a default PR template, include explicit usage guidance, and validate sample descriptions against #220-#223.

**Proof required**: Local sample PR descriptions, text checks for child-template closing keywords, and manual review against #220, #221, #222, and #223.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Child PR template uses only `Related to` issue references for child and coordinator issues (TR-001, TR-002, TR-003) | Repository PR template files | Local sample description plus text check for closing keywords | Rerun after any child template wording change |
| Final coordinator PR template may close coordinator and child issues (TR-004, TR-005) | Repository PR template files | Local sample description plus manual review | Rerun after any final template wording change |
| Normal sequential PR behavior and closed-child final-pass wording remain unchanged (TR-006, TR-007, TR-009) | Usage guidance, `AGENTS.md`, workflow docs | Local final-pass sample plus manual review | Recheck after any usage guidance wording change |
| Alignment with #220-#223 routing and delivery contract (TR-008) | Issue bodies and repository workflow docs | Manual cross-check against fetched issue bodies and `docs/ARCHITECTURE.md` | Recheck after any template or sample wording change |

## Project Structure

### Documentation (this feature)

```text
specs/013-pr-description-templates/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pr-template-contract.md
├── samples/
│   ├── sidecar-child-pr.md
│   ├── sidecar-final-coordinator-pr.md
│   └── coordinator-final-pass-pr.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/
└── PULL_REQUEST_TEMPLATE/
    ├── README.md
    ├── sidecar-child-to-coordinator.md
    └── sidecar-final-coordinator-to-main.md
```

**Structure Decision**: Add non-default GitHub Markdown PR templates in `.github/PULL_REQUEST_TEMPLATE/` and validation samples under the active feature artifacts. No backend, frontend, migration, operations, or implementation-skill paths are in scope.

## Complexity Tracking

No constitution-significant complexity is introduced.
