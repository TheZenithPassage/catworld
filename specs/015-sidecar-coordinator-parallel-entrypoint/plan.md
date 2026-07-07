# Implementation Plan: Sidecar Coordinator Parallel Entrypoint

**Branch**: `chore/226-add-sidecar-coordinator-parallel-skill-entrypoint` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/015-sidecar-coordinator-parallel-entrypoint/spec.md`

## Summary

Add the first sidecar coordinator parallel workflow entrypoint as a separate repo-local Codex skill. The entrypoint will be opt-in only for explicit coordinator `parallel` prompts, will run only safe preflight classification, will stop on invalid or incomplete coordinator context, and will leave the current sequential implementation workflow and existing coordinator/orchestration workflow unchanged.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2 and Angular 21.2.x / TypeScript 5.9.x exist in the repository, but this feature changes repository workflow infrastructure and documentation only.

**Primary Dependencies**: Existing repo-local Codex skills under `.agents/skills/`, `AGENTS.md` routing guardrails, `docs/ARCHITECTURE.md` workflow documentation, issue #220 sidecar architecture, issue #221 routing guardrails, issue #222 documentation placement, issue #225 sidecar artifact path rules, and issue #226 scope. No runtime or package dependency changes.

**Storage**: N/A. No persistence, schema, browser storage, API payload, external contract, operational data, or application data model changes.

**Testing**: Manual/local routing examples against #220-#222; text review that readiness is preflight-based and not label-based; changed-file review confirming existing workflow skill files remain unchanged; `git diff --check`. Backend/frontend app tests are not required because no product runtime code changes.

**Target Platform**: Codex sessions and maintainers consuming repository-local workflow skills and documentation.

**Project Type**: CatWorld full-stack web administration system with repository-local Codex/Spec Kit workflow infrastructure.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Activate only for explicit coordinator `parallel` prompts when repository routing guardrails allow sidecar use; keep issues #220 through #234 on current sequential workflow guardrails during sidecar build-out and adoption; stop on non-coordinator `parallel`; preserve direct coordinator routing from #220-#222; do not require or invent `parallel-ready`; perform preflight only; do not create child artifacts, branches, worktrees, PRs, GitHub issue mutations, or product code changes; do not modify `.agents/skills/catworld-implement-issue/SKILL.md` or `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.

**Scale/Scope**: One new sidecar coordinator skill entrypoint, a small workflow documentation update if needed to record the entrypoint boundary, and generated Spec Kit artifacts for issue #226.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, generic platform claims, or deployment assumptions.
- **Layered monolith responsibilities**: Compliant/N/A. No backend controller, service, repository, database, DTO, mapper, or application code changes.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, frontend-only protections, or database constraints change.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. The spec records objective technical outcomes, routing edge cases, exclusions, dependencies, and validation evidence. No product, security, persistence, shared-contract, UX, operational, or unresolved architecture decision remains open.
- **Architecture and technology assessment**: Assessment required because a new sidecar workflow entrypoint is a shared workflow capability. The assessment below references the prior human-approved direction in issues #220 and #226 and keeps the implementation separate from existing workflow internals.
- **Focused changes and proportional validation**: Compliant. Planned changes are limited to repo workflow surfaces and feature artifacts; validation is local routing review, text checks, changed-file review, and whitespace diff validation.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, deployment exposure, backups, recovery, or production operations change. The new skill and `docs/ARCHITECTURE.md` remain the relevant workflow sources of truth.

Post-design re-check: compliant. Phase 1 artifacts confirm no data, API, persistence, authorization, UI, runtime, or operational safety changes, and the selected sidecar skill approach remains the already approved direction from #220/#226.

## Architecture and Technology Assessment

**Assessment required**: Yes. Creating a sidecar coordinator entrypoint is a significant shared repository workflow capability, even though it does not affect product runtime behavior.

**Decision trigger**: significant shared capability; significant cross-cutting concern for Codex workflow routing; meaningful replacement/migration risk if the entrypoint were coupled to existing workflow internals.

**Options considered**:

- Existing platform/framework/project capability: Reuse `.agents/skills/catworld-implement-issue/SKILL.md` or `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`. This would reduce file count, but it conflicts with #220 and #226 because the sidecar workflow must exist beside the current sequential workflow and must not change existing workflow internals in this issue.
- Established library/framework/service: N/A. No external workflow engine, package, service, or plugin is needed for a repo-local Codex skill entrypoint.
- Focused custom implementation: Create a new repo-local skill at `.agents/skills/catworld-parallel-coordinator/SKILL.md` with explicit trigger boundaries, read-only preflight, stop conditions, and validation expectations. This directly fits #220's preferred sidecar skill shape and #226's independent entrypoint requirement.

**Selected approach**: Focused custom repo-local Codex skill at `.agents/skills/catworld-parallel-coordinator/SKILL.md`, with a concise `docs/ARCHITECTURE.md` note if needed to record the entrypoint boundary and adoption limits.

**Why selected**: It satisfies #226's entrypoint goal, follows #220's sidecar architecture, keeps #221/#222 routing guardrails intact, avoids changing existing workflow internals, and remains reversible because the sidecar entrypoint is isolated.

**Confirmed medium-term use**: Supports the remaining #220 child issues: coordinator/child artifact preparation (#227), child implementation skill (#228), Git rules (#229), PR and mutation rules (#230), validation and conflict handling (#231), resumable state tracking (#232), handoff alignment (#233), and dry-run/adoption gate (#234).

**Maintenance and operational consequences**: Maintainers must keep the new skill aligned with `AGENTS.md`, `docs/ARCHITECTURE.md`, and later sidecar child issues. The entrypoint must continue to stop before implementation until later issues add the missing sidecar execution pieces and adoption is validated.

**Reversibility and migration path**: Low to moderate cost. Because the entrypoint is isolated in one skill, it can be revised, renamed, replaced, or removed without rewriting the existing sequential implementation workflow.

**Human approval**: Approved by prior issue-scoped decisions. Issue #220 explicitly defines sidecar architecture as separate sidecar skills, and issue #226 explicitly requests the independent coordinator entrypoint. This plan does not add an agent-selected architecture beyond those approved issue decisions.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. The feature adds a new workflow entrypoint adjacent to existing routing, so validation must prove it does not alter established sequential or coordinator/orchestration behavior.

**Old behavior/source of truth**: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, `docs/ARCHITECTURE.md`, and issues #220-#222.

**New mechanism semantics**: A sidecar-only coordinator skill that may be selected only for explicit coordinator `parallel` prompts and that performs preflight classification before any future sidecar implementation work.

**Mismatch risks**: The new entrypoint could accidentally imply parallel mode is generally available, route non-coordinator issues to parallel, route direct coordinator finalization away from the sequential workflow, require a `parallel-ready` label, mutate GitHub state, create artifacts too early, or modify existing workflow files.

**Mitigation**: Encode trigger restrictions, invalid routing cases, direct coordinator routing, preflight evidence requirements, no-label rule, no-mutation rule, and out-of-scope execution work directly in the new skill. Validate changed files and manually review existing workflow skill files remain unchanged.

**Proof required**: Local routing examples from quickstart, text search for required and prohibited routing language, `git diff --name-only` scope review, `git diff --check`, and manual review against #220-#226.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| New sidecar coordinator entrypoint exists separately (TR-001) | `.agents/skills/catworld-parallel-coordinator/SKILL.md` | File existence and manual skill review | Rerun after skill edits |
| Explicit coordinator `parallel` activation and non-coordinator stop (TR-002, TR-003) | New sidecar skill text | Local routing examples and text search | Rerun after skill routing wording changes |
| Direct coordinator routing contract from #220-#222 (TR-004) | New sidecar skill plus `docs/ARCHITECTURE.md` | Manual review against #220, #221, #222 | Rerun after workflow wording changes |
| Preflight readiness, child inspection, dependency classification, source-of-truth review, incomplete-context stops (TR-005, TR-007) | New sidecar skill | Local routing/preflight examples and manual review | Rerun after preflight wording changes |
| No required `parallel-ready` label (TR-006) | New sidecar skill and workflow docs | Text search and manual review | Rerun after readiness wording changes |
| Existing workflows unchanged (TR-008) | Git diff and existing workflow skill files | `git diff --name-only`; manual review that `.agents/skills/catworld-implement-issue/SKILL.md` and `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` are absent from diff | Rerun before final report |
| No child artifacts, branches, worktrees, PRs, issue mutations, or product code changes (TR-009) | Changed-file scope review | `git status --short`; `git diff --name-only`; manual review | Rerun before final report |
| Text formatting for workflow files and artifacts (TR-010) | Git diff | `git diff --check` | Rerun after final text edits |

## Project Structure

### Documentation (this feature)

```text
specs/015-sidecar-coordinator-parallel-entrypoint/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-coordinator-entrypoint.md
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

**Structure Decision**: Add the new sidecar coordinator entrypoint as its own repo-local Codex skill and keep existing workflow skill files unchanged. Update `docs/ARCHITECTURE.md` only if needed to record that the sidecar coordinator entrypoint now exists as preflight-only workflow infrastructure while full sidecar adoption remains gated by later #220 child issues.

## Complexity Tracking

No constitution exception is required. The new sidecar skill is the minimal approved structure for issue #226 because #220 and #226 require a separate entrypoint and explicitly reject changing existing workflow internals.
