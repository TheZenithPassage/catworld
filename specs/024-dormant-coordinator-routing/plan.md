# Implementation Plan: Dormant Coordinator Routing

**Branch**: `chore/250-keep-legacy-coordinator-orchestration-dormant` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/024-dormant-coordinator-routing/spec.md`

## Summary

Align active CatWorld workflow routing sources with issue #250 by keeping the
legacy coordinator orchestration skill dormant, preserving the sequential
implementation workflow as the active default, and ensuring sidecar-parallel
guidance remains future-facing until #261 activates it. The approach is focused
Markdown/source-of-truth editing of active workflow documents and templates
only; no application runtime behavior, persistence, API contract, or product UI
changes are planned.

## Technical Context

**Language/Version**: Markdown workflow and GitHub template sources. Repository runtime evidence remains Java 17 with Spring Boot 4.0.2 and Angular 21.2/TypeScript 5.9.2, but those runtimes are not affected.

**Primary Dependencies**: Spec Kit workflow artifacts, CatWorld agent skills, GitHub issue/PR templates, `rg`, `git diff --check`. Backend and frontend dependencies are unaffected.

**Storage**: N/A. No domain entities, persistence, migrations, browser storage, or external data stores change.

**Testing**: Issue-required `rg` search, manual review of active routing sources, confirmation that the dormant legacy skill file is unchanged, and `git diff --check`.

**Target Platform**: CatWorld Codex workflow instructions and GitHub templates consumed by implementation agents and maintainers.

**Project Type**: CatWorld full-stack web administration system; this feature affects repository workflow infrastructure only.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Do not edit `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` without explicit user approval; do not activate sidecar parallel product use before #261; preserve normal issue, direct child issue, and closed-child coordinator final-pass routing through `catworld-implement-issue`.

**Scale/Scope**: Limited to active routing and workflow sources named in issue #250 plus validation-discovered active workflow sources that emit coordinator or child routing guidance: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `.agents/skills/speckit-taskstoissues/SKILL.md`, `docs/ARCHITECTURE.md`, and relevant `.github` issue/PR templates.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The feature changes workflow guidance only and does not add speculative product, platform, or cross-species abstractions.
- **Layered monolith responsibilities**: Pass. No controller, service, repository, database, DTO, or mapper behavior changes.
- **Backend and database authority**: Pass. No business rule, authorization, validation, or calculation behavior changes.
- **Schema evolution**: Pass. No schema changes or Flyway migrations.
- **Protected stay model**: Pass. Stay status and stay invariants are unaffected.
- **Specification and planning discipline**: Pass. The spec records observable technical outcomes, explicit exclusions, validation evidence, and no unresolved open questions.
- **Architecture and technology assessment**: Pass. No significant framework, dependency, shared infrastructure, persistence, security, operational, or costly replacement decision is introduced.
- **Focused changes and proportional validation**: Pass. Planned changes are limited to active workflow guidance and validated with targeted search, manual review, and whitespace checks.
- **Operational safety and sources of truth**: Pass. The feature updates repository workflow sources of truth and does not touch secrets, real data, deployment exposure, backup, or recovery procedures.

Post-design re-check: Still compliant. Design artifacts keep scope documentation-only, define no runtime contracts or data model changes, and preserve issue #250's dormant legacy-file boundary.

## Architecture and Technology Assessment

**Assessment required**: No. This feature performs scoped workflow-documentation alignment and introduces no significant architecture, framework, library, shared infrastructure, security, persistence, operational, or costly-to-replace technical decision.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: N/A. Existing Markdown workflow sources and GitHub templates are sufficient.
- Established library/framework/service: N/A. No new dependency is needed.
- Focused custom implementation: N/A. No code implementation mechanism is introduced.

**Selected approach**: N/A.

**Why selected**: N/A.

**Confirmed medium-term use**: N/A.

**Maintenance and operational consequences**: N/A beyond keeping active workflow sources consistent with issue #250 and future #261 activation.

**Reversibility and migration path**: N/A. Any future sidecar activation can update active routing sources under #261.

**Human approval**: N/A because no constitution-triggered architecture or technology assessment is required.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. The feature preserves active sequential routing semantics while neutralizing conflicting dormant or premature sidecar guidance.

**Old behavior/source of truth**: `AGENTS.md`, `catworld-implement-issue`, sidecar coordinator and child skills, `docs/ARCHITECTURE.md`, and GitHub issue/PR templates define current routing behavior.

**New mechanism semantics**: Same source types and same sequential workflow remain active. Explicit future coordinator `parallel` guidance must identify sidecar coordinator routing as future behavior after #261, not an active route now.

**Mismatch risks**: Accidentally reactivating the legacy coordinator skill, weakening normal/direct-child sequential routing, closing issues from sidecar child PRs, blocking final coordinator PR closing keywords for included child issues, requiring seed-first behavior, allowing child agents to invent shared contracts, or enabling sidecar product use before #261.

**Mitigation**: Edit only active routing and template text as needed; leave the legacy orchestrate skill untouched; validate with the issue search command, focused manual review, and a direct diff check against the legacy file.

**Proof required**: `rg` review for target terms, manual review of normal/direct-child/coordinator routing, manual review that sidecar parallel remains inactive before #261, `git diff -- .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Legacy orchestrate skill not used for real coordinator execution (TR-001, SC-001) | Active workflow docs and templates | Required `rg` search plus manual context review | Rerun after all relevant text edits |
| Dormant legacy file unchanged (TR-002, SC-005) | Git diff for `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` | `git diff -- ...` | Rerun before final validation |
| Sequential workflow remains default for normal and direct child issues (TR-003, SC-002) | `AGENTS.md` and `catworld-implement-issue` | Manual routing review | Rerun after any routing text edits |
| Coordinator guardrails and no premature sidecar activation (TR-004, TR-005, SC-003) | `AGENTS.md`, sidecar coordinator skill, architecture docs, templates | Manual routing review | Rerun after any sidecar text edits |
| Child PR references, final coordinator PR closure, no seed-first, and no child invention guidance (TR-006, TR-007, TR-008) | Sidecar coordinator/child skills and PR/issue templates | Required `rg` search plus manual context review | Rerun after all relevant text edits |
| Markdown whitespace health (SC-004) | Git diff | `git diff --check` | Run after final text edits |

## Project Structure

### Documentation (this feature)

```text
specs/024-dormant-coordinator-routing/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── active-routing.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
AGENTS.md
.agents/skills/catworld-implement-issue/SKILL.md
.agents/skills/catworld-parallel-coordinator/SKILL.md
.agents/skills/catworld-parallel-child-implementation/SKILL.md
docs/ARCHITECTURE.md
.agents/skills/speckit-taskstoissues/SKILL.md
.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md
.github/ISSUE_TEMPLATE/focused-child-issue.md
.github/PULL_REQUEST_TEMPLATE/README.md
.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md
.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md
```

**Structure Decision**: Implement by editing only active workflow/routing Markdown sources from the issue source map. Do not edit `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` without explicit user approval.

## Complexity Tracking

No constitutionally relevant complexity is introduced.
