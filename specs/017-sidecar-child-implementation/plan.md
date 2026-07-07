# Implementation Plan: Sidecar Child Implementation Skill

**Branch**: `chore/228-create-sidecar-child-implementation-skill` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/017-sidecar-child-implementation/spec.md`

## Summary

Create the sidecar child implementation skill requested by #228 as a separate repo-local Codex skill. The implementation will add `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, define the prepared child handoff inputs it requires, document readiness and blocker behavior, preserve the prepared artifact contract from #227, and keep the existing sequential issue implementation skill unchanged. Architecture documentation may be updated only to record the new sidecar child boundary and routing exclusions.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2 and Angular 21.2.x / TypeScript 5.9.x exist in the repository, but this feature changes repository-local Codex workflow instructions, documentation, and generated Spec Kit artifacts only.

**Primary Dependencies**: Existing repo-local Codex skills under `.agents/skills/`; `.agents/skills/catworld-parallel-coordinator/SKILL.md` artifact-preparation rules from #227; `AGENTS.md` routing guardrails; `docs/ARCHITECTURE.md` sidecar workflow documentation; issue #220 sidecar architecture; issue #225 artifact path rules; issue #228 child skill scope. No runtime or package dependency changes.

**Storage**: N/A. No persistence, schema, browser storage, API payload, external service contract, operational data, or CatWorld application data model changes.

**Testing**: Manual/local workflow sample for one sidecar child handoff; text checks for required prepared inputs, no planning-artifact generation, no shared-contract redefinition, blocker reports, direct child sequential routing, and closed-child coordinator final-pass exclusion; changed-file scope review confirming `catworld-implement-issue` is untouched; `git diff --check`. Backend/frontend runtime tests are not required because no product runtime code changes.

**Target Platform**: Codex sessions and maintainers consuming CatWorld repository-local workflow skills and Spec Kit artifacts.

**Project Type**: CatWorld full-stack web administration system with repository-local Codex/Spec Kit workflow infrastructure.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Add a new sidecar child implementation skill; require prepared artifacts from the sidecar coordinator before child implementation; do not generate new planning artifacts; do not redefine shared contracts; do not expand scope; preserve direct child sequential execution; preserve closed-child coordinator final-pass routing; leave `.agents/skills/catworld-implement-issue/SKILL.md` unchanged; do not introduce coordinator preflight, branch orchestration, PR rules, GitHub issue mutation, or product implementation beyond a future prepared child handoff.

**Scale/Scope**: One new sidecar skill file, generated Spec Kit artifacts, and a focused architecture documentation update if needed to keep workflow source-of-truth text aligned. No backend, frontend, migration, operations, dependency, branch/worktree orchestration, PR automation, or GitHub issue mutation surfaces are in scope.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld repository workflow infrastructure and does not introduce product-domain assumptions, cross-species abstractions, multi-tenancy, generic platform claims, or deployment assumptions.
- **Layered monolith responsibilities**: Compliant/N/A. No backend controller, service, repository, database, DTO, mapper, or application code changes.
- **Backend and database authority**: Compliant/N/A. No business rules, authorization, validation, calculations, frontend protections, or database constraints change.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not affected.
- **Specification and planning discipline**: Compliant. The spec records objective technical outcomes, required prepared inputs, exclusions, blocker behavior, validation expectations, and no unresolved open questions.
- **Architecture and technology assessment**: Assessment required because a new sidecar child implementation skill is a significant shared workflow capability in the future parallel path. The assessment below references the approved sidecar direction from #220, the prepared artifact model from #227, and #228's explicit instruction to create a separate child skill without changing the normal implementation skill.
- **Focused changes and proportional validation**: Compliant. Planned changes are limited to workflow instructions, workflow documentation, and feature artifacts; validation uses local sample handoff review, text checks, changed-file review, and whitespace validation proportional to the non-runtime scope.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, deployment exposure, backup, recovery, or production operation changes. Workflow sources of truth remain `AGENTS.md`, `docs/ARCHITECTURE.md`, sidecar skills, and feature artifacts.

Post-design re-check: compliant. Phase 1 artifacts confirm no data model, API, persistence, authorization, UI, runtime, dependency, or operational safety changes. The selected sidecar child skill surface remains the approved direction from #220/#227/#228 and no agent-selected significant decision remains pending.

## Architecture and Technology Assessment

**Assessment required**: Yes. Creating a new sidecar child implementation skill is a significant shared workflow capability that later parallel execution issues will depend on.

**Decision trigger**: significant shared capability; significant cross-cutting workflow concern; material shared-contract decision for how prepared coordinator artifacts constrain child executors; meaningful replacement risk if confused with the existing sequential implementation workflow.

**Options considered**:

- Existing platform/framework/project capability: Add a repo-local Codex skill at `.agents/skills/catworld-parallel-child-implementation/SKILL.md`. This directly fits #228 and the #220 sidecar architecture while preserving the existing sequential skill.
- Established library/framework/service: N/A. No external workflow engine, package, service, plugin, or dependency is needed for repository-local Codex skill instructions.
- Focused custom implementation: Modify `.agents/skills/catworld-implement-issue/SKILL.md` to support sidecar child execution. Rejected because #228 explicitly requires the existing normal implementation skill to remain unchanged, and #220 requires the sidecar workflow to exist beside the current sequential path.

**Selected approach**: Create `.agents/skills/catworld-parallel-child-implementation/SKILL.md` as the sidecar child implementation entrypoint and update `docs/ARCHITECTURE.md` only as needed to document the boundary.

**Why selected**: It satisfies #228 directly, preserves normal direct child sequential execution, keeps sidecar child execution dependent on #227 prepared artifacts, and remains isolated from later Git/PR/state/adoption issues.

**Confirmed medium-term use**: Supports later #220 child issues for sidecar Git execution (#229), PR target and mutation rules (#230), validation/blocker hardening (#231), resumable state tracking (#232), explicit split handoff alignment (#233), and adoption dry-run (#234).

**Maintenance and operational consequences**: Maintainers must keep the sidecar coordinator, sidecar child skill, architecture docs, and later sidecar Git/PR/state rules aligned. Until later issues add execution orchestration, the child skill must stop when branch/worktree context or prepared artifacts are missing.

**Reversibility and migration path**: Low to moderate cost. The new sidecar child skill can be revised, renamed, or retired without changing the existing sequential implementation skill because the new behavior is isolated in a separate workflow file.

**Human approval**: Approved by prior issue-scoped decisions and the active issue contract. Issue #220 approves a separate sidecar workflow beside the sequential workflow, issue #227 approves prepared coordinator and child artifacts before delegation, and issue #228 explicitly requires the independent child implementation skill at the selected path while preserving the normal implementation skill.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. The new sidecar child skill must not replace the normal sequential implementation path or the closed-child coordinator final pass.

**Old behavior/source of truth**: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `docs/ARCHITECTURE.md`, and issues #220, #227, and #228.

**New mechanism semantics**: The sidecar child skill consumes a coordinator-prepared child handoff and executes exactly one child issue from prepared spec, plan, tasks, shared contract, validation requirements, dependency status, and target coordinator branch/worktree context. It stops when those inputs are missing or conflicting.

**Mismatch risks**: The new skill could appear usable for normal direct child issues, closed-child coordinator final passes, unprepared child issues, planning artifact generation, shared-contract invention, branch orchestration, PR targeting, GitHub issue mutation, or product implementation beyond prepared child scope.

**Mitigation**: Encode applicability, non-applicability, required inputs, stop conditions, prohibited side effects, implementation workflow, validation expectations, and final reporting directly in the new sidecar skill. Keep `.agents/skills/catworld-implement-issue/SKILL.md` untouched and validate changed files.

**Proof required**: Local sample child handoff, text searches for required inputs and routing exclusions, `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md`, changed-file scope review, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| New sidecar child skill exists (TR-001) | `.agents/skills/catworld-parallel-child-implementation/SKILL.md` | File existence and text review | Rerun after skill edits |
| Sidecar-only applicability and required handoff inputs (TR-002, TR-003) | Sidecar child skill and contract artifact | Text review and local sample handoff | Rerun after handoff wording changes |
| No planning artifact generation or shared-contract redefinition (TR-004, TR-005) | Sidecar child skill | Text search and manual review | Rerun after workflow wording changes |
| Blocker reports for missing/conflicting context (TR-006) | Sidecar child skill and sample handoff | Blocker scenario review | Rerun after stop-condition wording changes |
| Sequential workflow unchanged (TR-007, TR-008) | Existing implementation skill and routing docs | `git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md`; text review | Rerun before final report |
| Closed-child coordinator final pass excluded (TR-009) | Sidecar child skill and architecture docs | Text review | Rerun after routing wording changes |
| No coordinator preflight, Git/PR/issue mutation, or product runtime scope (TR-010) | Changed-file review | `git diff --name-only`; manual scope map review | Rerun before final report |
| Required validation scope (TR-011) | Quickstart/sample and git diff | Local sample handoff review; `git diff --check` | Rerun after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/017-sidecar-child-implementation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-child-implementation.md
├── checklists/
│   └── requirements.md
├── samples/
│   └── sample-child-handoff.md
└── tasks.md
```

### Source Code (repository root)

```text
.agents/skills/
└── catworld-parallel-child-implementation/
    └── SKILL.md

docs/
└── ARCHITECTURE.md
```

**Structure Decision**: Add the new sidecar child skill under `.agents/skills/`, matching the existing repo-local skill structure. Update `docs/ARCHITECTURE.md` only to record the new sidecar child boundary. Do not touch backend, frontend, migration, operations, Git automation, PR automation, GitHub issue mutation, `.agents/skills/catworld-implement-issue/SKILL.md`, or `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.

## Complexity Tracking

No constitution exception is required. The shared workflow capability is the approved sidecar child skill requested by #228 and remains isolated from existing sequential workflows.
