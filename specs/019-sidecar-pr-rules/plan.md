# Implementation Plan: Sidecar PR Target and Closure Rules

**Branch**: `docs/230-add-sidecar-pr-target-and-closure-rules` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/019-sidecar-pr-rules/spec.md`

## Summary

Extend the opt-in sidecar coordinator workflow with explicit pull request target, issue-closing, GitHub mutation, and remote cleanup rules. The implementation will update sidecar coordinator and child workflow instructions, architecture documentation, and PR template guidance/samples so child PRs target the coordinator branch and use `Related to` wording only, the final coordinator PR targets `main` and may close the coordinator set, Codex reports readiness while the user merges, GitHub issue mutation and public comments require explicit approval, and normal sequential PR behavior remains unchanged.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2 and Angular 21.2.x / TypeScript 5.9.x exist in the repository, but this feature changes repository-local Codex workflow instructions, GitHub Markdown PR templates, documentation, and generated Spec Kit artifacts only.

**Primary Dependencies**: Existing repo-local Codex skills under `.agents/skills/`, especially `.agents/skills/catworld-parallel-coordinator/SKILL.md` and `.agents/skills/catworld-parallel-child-implementation/SKILL.md`; `.github/PULL_REQUEST_TEMPLATE/` templates from issue #224; `AGENTS.md` repository operation guardrails; `docs/ARCHITECTURE.md` Codex workflow routing documentation; issue #220 operational guardrails; completed issues #224 and #229.

**Storage**: N/A for CatWorld runtime persistence. The feature defines repository workflow guidance and local validation samples only; it does not change domain entities, database schema, browser storage, API payloads, or external service contracts.

**Testing**: Local sample PR descriptions for two sidecar child PRs, one final sidecar coordinator PR, and one closed-child coordinator final-pass PR; text checks for child PR closing keywords, child/final PR targets, issue mutation approval, remote cleanup approval, and normal sequential boundary wording; changed-file review confirming normal sequential workflow behavior is not changed; `git diff --check`.

**Target Platform**: Codex sessions and maintainers consuming CatWorld repository-local workflow skills, GitHub Markdown PR templates, and Spec Kit artifacts.

**Project Type**: CatWorld full-stack web administration system with repository-local Codex/Spec Kit workflow infrastructure.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Apply PR target, closure, GitHub mutation, and remote cleanup rules only to the sidecar coordinator parallel workflow; child PRs target the coordinator integration branch and not `main`; child PR descriptions use `Related to` wording only; the final coordinator PR targets `main` and may close the coordinator set; Codex reports readiness and the user performs merges; issue body, checklist, label, assignee, milestone, state, and public comment mutations require explicit user approval; remote branch deletion, remote pruning, and remote cleanup require explicit user approval; normal sequential PR behavior, direct child issue behavior outside `parallel`, and closed-child coordinator final-pass behavior remain unchanged.

**Scale/Scope**: Workflow-source changes to the sidecar coordinator skill, sidecar child implementation skill, `docs/ARCHITECTURE.md`, sidecar PR template guidance/samples, and generated feature artifacts for issue #230. No CatWorld product code, runtime configuration, migration, backend, frontend, live pull request operation, GitHub issue mutation, remote cleanup, or normal sequential workflow implementation changes.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, generic platform claims, or deployment assumptions.
- **Layered monolith responsibilities**: Compliant/N/A. No backend controller, service, repository, database, DTO, mapper, or application code changes.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, frontend protections, or database constraints change.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. The spec records technical outcomes, state-sensitive PR routing cases, scope boundaries, edge cases, out-of-scope behavior, dependencies, and no unresolved open questions. The selected sidecar-only PR delivery rules are specified by issue #230, issue #220, issue #224, and issue #229.
- **Architecture and technology assessment**: Assessment required because sidecar PR target, issue closure, and GitHub mutation rules are a material operational workflow decision and shared sidecar delivery capability. The assessment below references the human-authored issue contracts from #220 and #230 plus the completed sidecar template and Git-rule decisions from #224 and #229.
- **Focused changes and proportional validation**: Compliant. Planned changes are limited to workflow instructions, documentation/templates, local validation samples, and feature artifacts; validation uses local samples, text checks, changed-file review, and whitespace validation proportional to non-runtime operational workflow scope.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, deployment exposure, backup, recovery, or production operation changes. The plan explicitly keeps GitHub issue mutation, public comments, and remote cleanup behind explicit user approval while preserving repository workflow sources of truth.

Post-design re-check: compliant. Phase 1 artifacts confirm no runtime data model, API, persistence, authorization, UI, migration, or product behavior changes. The selected sidecar PR delivery contract records only workflow/documentation obligations and remains within the approved sidecar workflow from #220, #224, #229, and #230.

## Architecture and Technology Assessment

**Assessment required**: Yes. Sidecar PR target, issue closure, GitHub mutation, and remote cleanup rules are a material operational decision for the future parallel workflow and a shared delivery capability used by coordinator and child sidecar paths.

**Decision trigger**: significant shared capability; material operational decision; significant cross-cutting workflow concern; meaningful replacement risk if the rules changed normal sequential issue delivery.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar workflow skills, `docs/ARCHITECTURE.md`, and GitHub Markdown PR template guidance/samples with explicit PR target, closure, mutation, and cleanup authority. This fits #230, uses existing source-of-truth locations, and keeps normal sequential workflow delivery unchanged.
- Established library/framework/service: N/A. No external PR automation service, workflow engine, or dependency is needed for repository-local Codex skill instructions and GitHub Markdown templates.
- Focused custom implementation: Add scripts or automation to open PRs, choose targets, or mutate issues. Rejected because #230 is limited to sidecar coordinator delivery rules and validation samples; opening real PRs, merging, product implementation, and GitHub issue mutation without explicit user approval are out of scope.

**Selected approach**: Extend `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, and sidecar PR template guidance/samples with the approved sidecar PR delivery rules. Do not add PR automation scripts, dependencies, product code, issue mutations, or remote cleanup operations.

**Why selected**: The approach directly satisfies #230, preserves the isolated sidecar architecture from #220 and the existing PR template contract from #224, aligns with sidecar Git rules from #229, and remains reversible because it is documentation/template/skill text rather than executable GitHub automation.

**Confirmed medium-term use**: Supports later #220 child issues for sidecar validation/blockers/conflicts (#231), resumable state tracking and cleanup policy (#232), explicit split handoff alignment (#233), and controlled dry-run/adoption gate (#234).

**Maintenance and operational consequences**: Maintainers must keep sidecar coordinator skill, child implementation skill, architecture docs, PR templates, and sample descriptions aligned. Future sidecar execution must enforce the recorded PR target and mutation contract before any PR, issue, comment, merge, or remote cleanup operation.

**Reversibility and migration path**: Low to moderate cost. The rules can be revised or moved into a future dedicated sidecar PR/delivery skill before adoption, while normal sequential workflow remains unaffected because this feature does not change `.agents/skills/catworld-implement-issue/SKILL.md` or add executable automation.

**Human approval**: Approved by the active issue contract and prior issue-scoped decisions. Issue #220 defines sidecar operational guardrails, issue #224 approves the sidecar PR template wording split, issue #229 approves sidecar Git target and cleanup boundaries, and issue #230 explicitly approves adding these sidecar PR target, closure, and GitHub mutation rules.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. This feature adds sidecar PR delivery rules that must not replace or alter normal sequential PR target/closure behavior, direct child issue delivery outside `parallel`, or closed-child coordinator final-pass behavior.

**Old behavior/source of truth**: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `.github/PULL_REQUEST_TEMPLATE/`, `docs/ARCHITECTURE.md`, and issues #220, #224, #229, and #230.

**New mechanism semantics**: Sidecar child PRs target the coordinator branch and reference child/coordinator issues with `Related to` only. The final sidecar coordinator PR targets `main` and may close the coordinator set. Codex reports readiness while the user performs merges. GitHub issue mutations, public comments, remote branch deletion, remote pruning, and remote cleanup require explicit user approval.

**Mismatch risks**: The wording could accidentally imply sidecar child PRs may target `main`, child PRs may close issues, the final coordinator PR should not close the coordinator set, normal sequential PR behavior has changed, closed-child coordinator final passes use sidecar final PR routing, Codex may merge PRs, or GitHub issue/public-comment/remote-cleanup mutation is permitted without explicit approval.

**Mitigation**: Encode explicit sidecar-only boundaries, PR target rules, closure wording rules, user-merge responsibilities, GitHub mutation approval requirements, remote cleanup approval requirements, and normal workflow exclusions in both sidecar skills and architecture/template documentation. Keep the normal sequential implementation skill unchanged.

**Proof required**: Local sample PR descriptions, text searches for required and prohibited wording, manual review against #224/#229/#220, changed-file scope review, explicit diff review showing `.agents/skills/catworld-implement-issue/SKILL.md` is unchanged, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Sidecar child PRs target coordinator branch and not `main` (TR-001, TR-002, TR-014) | Sidecar skills, architecture docs, PR template guidance, samples | Local sample descriptions and text review | Rerun after sidecar PR target wording changes |
| Sidecar child PR descriptions use `Related to` only and contain no closing keywords (TR-003, TR-004, TR-014) | PR templates, contract, samples | Text check for `Closes`, `Fixes`, `Resolves`; manual wording review | Rerun after child template or sample wording changes |
| Final sidecar coordinator PR targets `main` and may close coordinator set (TR-005, TR-006, TR-015) | PR templates, contract, samples, docs | Local final PR sample and manual review | Rerun after final template or coordinator delivery wording changes |
| Codex reports readiness and user performs merges (TR-007) | Sidecar coordinator skill, docs, template notes | Text review | Rerun after delivery authority wording changes |
| GitHub issue mutation, public comments, and remote cleanup require explicit user approval (TR-008, TR-009, TR-016) | Sidecar skills, docs, contract, quickstart checks | Text checks and manual approval-boundary review | Rerun after mutation or cleanup wording changes |
| Normal sequential PR behavior, direct child issue behavior, and closed-child coordinator final-pass behavior remain unchanged (TR-010, TR-011, TR-012, TR-017) | Sidecar skills, PR template README/samples, docs, normal workflow scope review | Local final-pass sample, text review, changed-file review | Rerun before final report |
| Required validation scope and issue alignment (TR-013-TR-018) | Quickstart, samples, fetched issue bodies, git diff | Local sample files, manual review against #224/#229/#220, `git diff --check` | Rerun after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/019-sidecar-pr-rules/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-pr-delivery.md
├── samples/
│   ├── sidecar-child-pr-231.md
│   ├── sidecar-child-pr-232.md
│   ├── sidecar-final-coordinator-pr.md
│   └── coordinator-final-pass-pr.md
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

.github/
└── PULL_REQUEST_TEMPLATE/
    ├── README.md
    ├── sidecar-child-to-coordinator.md
    └── sidecar-final-coordinator-to-main.md

docs/
└── ARCHITECTURE.md
```

**Structure Decision**: Update the two sidecar skills that own coordinator and child sidecar workflow boundaries, update `docs/ARCHITECTURE.md` as the longer workflow source of truth, and align the existing sidecar PR templates plus local validation samples with the #230 delivery contract. Do not touch backend, frontend, migrations, operations, Git automation scripts, PR automation, GitHub issue state, `.agents/skills/catworld-implement-issue/SKILL.md`, or `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.

## Complexity Tracking

No constitution exception is required. The shared operational workflow rules are explicitly requested by #230, are isolated to the sidecar workflow surface approved by #220/#224/#229, and preserve normal sequential PR behavior.
