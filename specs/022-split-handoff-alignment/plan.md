# Implementation Plan: Split Handoff Alignment

**Branch**: `chore/233-align-explicit-issue-split-handoff` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/022-split-handoff-alignment/spec.md`

## Summary

Align the explicit tasks-to-issues split handoff with CatWorld's sidecar coordinator format by updating the `speckit-taskstoissues` instruction surface. The implementation will add coordinator rewrite and child issue body requirements that preserve the source issue scope, keep splitting opt-in, retain direct sequential child implementation, and avoid any change to normal planning, normal implementation, or `.agents/skills/catworld-implement-issue/SKILL.md`.

## Technical Context

**Language/Version**: Java 17 and Spring Boot 4.0.2 backend; Angular 21.2.x and TypeScript 5.9.x frontend. This feature changes repository workflow instructions and Spec Kit artifacts only.

**Primary Dependencies**: Existing Markdown-based Codex skill instructions under `.agents/skills/`, existing GitHub issue templates from #223, and existing PR template wording contracts from #224. No application dependency changes.

**Storage**: N/A. No persistence, schema, browser storage, or structured application data changes.

**Testing**: Local sample split rewrite and manual/text review required by issue #233; repository-wide backend or frontend tests are not required because no runtime code changes.

**Target Platform**: CatWorld repository workflow instructions consumed by Codex sessions and maintainers.

**Project Type**: CatWorld full-stack web administration system with repository workflow infrastructure.

**Performance Goals**: N/A. No performance-sensitive behavior changes.

**Constraints**: Splitting remains opt-in; normal specification, planning, implementation, and one-issue/one-PR delivery remain unchanged; the split output must preserve source issue scope; `catworld-implement-issue` must not change; validation must not create real product issues.

**Scale/Scope**: One explicit issue-split instruction surface, feature design artifacts, and local sample validation output for issue #233.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The work is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, or platform claims.
- **Layered monolith responsibilities**: Compliant/N/A. No backend controller, service, repository, mapper, DTO, or entity code changes.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, or database integrity behavior changes.
- **Schema evolution**: Compliant/N/A. No Flyway migration or schema behavior changes.
- **Protected stay model**: Compliant/N/A. Stay status, cancellation, overlap, ownership, duplicate-cat, and date invariants are not affected.
- **Specification and planning discipline**: Compliant. Issue #233, parent #220, and dependencies #223/#224 define the behavior; referenced #220-#222 routing guardrails are recorded in the spec and contract; no unresolved open questions remain.
- **Architecture and technology assessment**: No assessment required. The work updates an existing Markdown instruction surface and local validation artifacts. It introduces no significant dependency, framework, persistence strategy, shared runtime infrastructure, material security decision, or costly replacement.
- **Focused changes and proportional validation**: Compliant. Scope is limited to explicit split handoff instructions and feature artifacts; validation is local sample output plus manual/text review against #220-#224.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, production exposure, backup, recovery, or deployment behavior changes. The edited skill remains a repository workflow source of truth.

Post-design re-check: still compliant. Phase 1 artifacts confirm no data model, API contract, persistence, authorization, UI, runtime, or operational safety changes.

## Architecture and Technology Assessment

**Assessment required**: No. This is a constrained workflow-instruction alignment using existing Markdown skill files and already approved sidecar template contracts.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Update `.agents/skills/speckit-taskstoissues/SKILL.md`, the existing explicit task-to-issue split instruction surface. Fits the confirmed requirement, avoids new dependencies, and keeps normal implementation skill internals untouched.
- Established library/framework/service: N/A. External tooling or services would exceed the issue scope.
- Focused custom implementation: N/A. Adding scripts or automation would exceed the requested instruction handoff alignment and could change GitHub mutation behavior.

**Selected approach**: Update the existing `speckit-taskstoissues` Markdown instructions and validate with a local sample handoff.

**Why selected**: It targets the explicit issue-splitting surface, reuses #223/#224 contracts, and keeps normal implementation/planning behavior unchanged.

**Confirmed medium-term use**: Supports issue #234's controlled dry-run by making explicit split output compatible with the sidecar coordinator workflow after #220-#232.

**Maintenance and operational consequences**: Maintainers own the instruction wording as workflow documentation. There are no runtime, security, accessibility, persistence, or deployment consequences.

**Reversibility and migration path**: Low cost. The Markdown instructions can be edited or reverted if future approved sidecar adoption changes the split handoff format.

**Human approval**: N/A because no significant architecture or technology assessment is required.

## Semantic Equivalence and Replacement Review

**Review required**: No. This feature adds alignment requirements to an existing explicit split instruction surface and does not replace UI primitives, shared components, interaction mechanisms, data contracts, or runtime behavior.

**Old behavior/source of truth**: Existing sequential routing guardrails in `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `docs/ARCHITECTURE.md`, issue template contract from #223, and PR template contract from #224.

**New mechanism semantics**: N/A. No new execution mechanism is introduced; the handoff remains instruction-driven.

**Mismatch risks**: Wording could imply that splitting is automatic, that child issues require sidecar execution, that coordinator finalization reimplements closed child scope, that `parallel-ready` labels are required, or that product scope can be added during splitting.

**Mitigation**: Add explicit opt-in, routing, scope-preservation, child sequential workflow, and no-label language to the handoff instructions; validate a local sample against #220-#224.

**Proof required**: Text review of `speckit-taskstoissues`, local sample split rewrite, manual review against #220 routing contract and #223/#224 contracts, and diff review confirming `catworld-implement-issue` is unchanged.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Explicit split handoff is opt-in and does not affect normal planning/implementation (TR-001, TR-002) | `.agents/skills/speckit-taskstoissues/SKILL.md` | Text review and local sample | Rerun after any skill wording change |
| Coordinator rewrite body includes goal, preserved scope, child issues, dependencies, execution model, validation, and out of scope (TR-003) | Skill instructions and sample output | Local sample split rewrite plus text review | Rerun after any skill or sample wording change |
| Child issue bodies reference coordinator and remain directly implementable through normal sequential workflow (TR-004) | Skill instructions and sample output | Local sample split rewrite plus manual review | Rerun after any skill or sample wording change |
| Routing contract from #220-#222 is preserved, including closed-child final pass and no closed-scope reimplementation (TR-005, TR-006) | Skill instructions, sample output, `docs/ARCHITECTURE.md` | Manual cross-check against issue bodies and docs | Recheck after any routing wording change |
| Scope preservation and #223/#224 compatibility (TR-007, TR-010) | Skill instructions, contracts, sample output | Manual review against `issue-template-contract.md` and `pr-template-contract.md` | Recheck after any handoff output wording change |
| `catworld-implement-issue` remains unchanged (TR-008) | Git diff | `git diff -- .agents/skills/catworld-implement-issue/SKILL.md` | Recheck before final report |

## Project Structure

### Documentation (this feature)

```text
specs/022-split-handoff-alignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── split-handoff-contract.md
├── samples/
│   └── sample-split-handoff.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.agents/
└── skills/
    └── speckit-taskstoissues/
        └── SKILL.md
```

**Structure Decision**: Update only the explicit task-to-issues split handoff skill and local feature artifacts. No backend, frontend, migration, issue template, PR template, `AGENTS.md`, or `catworld-implement-issue` path is in scope.

## Complexity Tracking

No constitution-significant complexity is introduced.
