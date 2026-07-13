# Implementation Plan: Sidecar Run Lifecycle

**Branch**: `docs/251-define-executable-sidecar-run-lifecycle` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/025-sidecar-run-lifecycle/spec.md`

## Summary

Define issue #251's future sidecar coordinator lifecycle as concrete executable
workflow behavior while preserving the current dormant build-out boundary. The
implementation is limited to workflow source-of-truth Markdown: sidecar skills,
architecture documentation, and relevant routing/template text. It must not
activate sidecar routing before #261, must not create real sidecar branches or
worktrees, and must not change CatWorld product runtime behavior.

## Technical Context

**Language/Version**: Markdown workflow and GitHub template sources. Repository runtime evidence remains Java 17 with Spring Boot 4.0.2 and Angular 21.2/TypeScript 5.9.2, but those runtimes are not affected by this feature.

**Primary Dependencies**: Spec Kit workflow artifacts, CatWorld agent skills, GitHub issue/PR templates, `rg`, and `git diff --check`. Backend and frontend dependencies are unaffected.

**Storage**: N/A. No domain entities, persistence, migrations, browser storage, external storage, or structured application data change.

**Testing**: Issue-required manual routing matrix, manual lifecycle matrices, issue-required `rg` search, inactive/adoption-gate wording review, changed-file/source-map review, and `git diff --check`.

**Target Platform**: CatWorld Codex workflow instructions and GitHub templates consumed by implementation agents and maintainers.

**Project Type**: CatWorld full-stack web administration system; this feature affects repository workflow infrastructure only.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Preserve sequential defaults; keep sidecar product use dormant until #261; do not remove inactive/adoption-gate wording that belongs to #261; do not implement branch/worktree commands, launch child agents, open real PRs, mutate GitHub issues, or declare sidecar adoption.

**Scale/Scope**: Limited to issue #251 workflow lifecycle documentation and the sidecar source map: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, `.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md`, `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`, and `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`. The dormant legacy orchestrate skill is review-only unless a blocker requires explicit user approval.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. This feature changes workflow guidance only and does not add product scope, speculative platform behavior, cross-species abstractions, or permanent assumptions about one installation.
- **Layered monolith responsibilities**: Pass. No controller, service, repository, database, DTO, or mapper behavior changes.
- **Backend and database authority**: Pass. No business rule, authorization, validation, calculation, or database integrity behavior changes.
- **Schema evolution**: Pass. No schema changes or Flyway migrations.
- **Protected stay model**: Pass. Stay status and stay invariants are unaffected.
- **Specification and planning discipline**: Pass. The spec records objective technical outcomes, edge cases, explicit exclusions, validation matrices, and no unresolved open questions.
- **Architecture and technology assessment**: Pass. The feature does not introduce a framework, dependency, persistence strategy, shared application infrastructure, production operational mechanism, or costly replacement decision. It documents issue-approved future workflow behavior without activating it.
- **Focused changes and proportional validation**: Pass. Planned changes are limited to workflow source-of-truth text and validated with targeted searches, manual matrices, and whitespace checks.
- **Operational safety and sources of truth**: Pass. The feature updates workflow sources of truth and explicitly avoids secrets, real data, deployment exposure, backup/recovery changes, real sidecar branches/worktrees, and GitHub issue mutations.

Post-design re-check: Still compliant. Design artifacts preserve the dormant #261 activation gate, keep local `main` clean in the lifecycle contract, and do not add product code, runtime contracts, or data model changes.

## Architecture and Technology Assessment

**Assessment required**: No. Issue #251 prescribes the lifecycle outcomes and activation boundary; implementation records them in existing Markdown workflow sources without selecting a new architecture, technology, dependency, persistence mechanism, shared application capability, or production operational mechanism.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Existing workflow Markdown sources, sidecar skills, architecture docs, and GitHub templates are sufficient.
- Established library/framework/service: N/A. No new dependency or service is needed.
- Focused custom implementation: N/A. No executable automation or branch/worktree command implementation is introduced.

**Selected approach**: Update existing workflow source-of-truth documents and templates only.

**Why selected**: It satisfies #251 while preserving #250's dormant-routing boundary and #261's activation gate.

**Confirmed medium-term use**: Future #261 sidecar activation and later controlled sidecar dry-run work can consume the documented lifecycle.

**Maintenance and operational consequences**: Maintainers must keep the sidecar lifecycle docs aligned when #261 activates routing or later issues implement real branch/worktree/agent execution. Until then, the text remains build-out guidance only.

**Reversibility and migration path**: Later activation or correction can update the same workflow docs and sidecar skills under a follow-up issue. No runtime migration is needed.

**Human approval**: N/A because no constitution-triggered technology choice is introduced beyond the explicit issue #251 scope and prior sidecar build-out decisions.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. This feature replaces vague or phase-specific sidecar build-out guidance with an executable lifecycle description while preserving the current inactive routing semantics.

**Old behavior/source of truth**: `AGENTS.md`, `catworld-implement-issue`, `catworld-parallel-coordinator`, `catworld-parallel-child-implementation`, `docs/ARCHITECTURE.md`, and sidecar templates define dormant sidecar routing and partial sidecar rules from #226 through #232 and #250.

**New mechanism semantics**: Same sources define the future lifecycle as stateful behavior with entry conditions, stop conditions, allowed next states, Codex-owned/user-owned operation boundaries, dependency layers, artifact write boundaries, resume/refresh behavior, validation, final PR delivery, and cleanup eligibility.

**Mismatch risks**: Text could accidentally activate sidecar product use before #261, weaken sequential default routing, allow artifact writes on `main`, blur Codex-owned operations and user-owned merges, launch hard-dependent layers together, imply real branch/worktree commands exist, or remove necessary inactive/adoption-gate wording.

**Mitigation**: Keep #261 activation language explicit; state current build-out and post-#261 behavior separately; document artifact planning/write boundaries; require user-owned merges; preserve dependency layers; avoid real command implementation; and validate remaining inactive wording.

**Proof required**: Manual routing matrix, manual lifecycle matrix, issue-required search, local `main` cleanliness review for the planned lifecycle, inactive/adoption-gate wording review, source-map review, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Routing states and #261 activation boundary (TR-011, TR-012, SC-001) | Active workflow docs and sidecar skills | Manual routing matrix plus required `rg` search | Rerun/review after any routing text edit |
| Lifecycle state machine (TR-001, TR-002, TR-003, TR-004, SC-001) | Sidecar coordinator skill and architecture docs | Manual lifecycle matrix against contract artifact | Rerun/review after lifecycle text edits |
| Artifact planning/write boundary and local `main` cleanliness (TR-005, TR-006, TR-007, TR-008, SC-002, SC-003, SC-004) | Sidecar workflow docs | Manual lifecycle matrix and source text review | Rerun/review after artifact or branch/worktree text edits |
| Child branch refresh and dependency layers (TR-004, TR-009, TR-010) | Sidecar coordinator/child skills and architecture docs | Manual dependency-layer and refresh review | Rerun/review after child handoff or refresh text edits |
| Child PR, waiting, resume, final coordinator PR, cleanup eligibility (TR-003, TR-009, TR-011) | Sidecar skills, architecture docs, PR templates | Manual routing/lifecycle review | Rerun/review after PR or resume text edits |
| Inactive/adoption-gate wording (TR-013, SC-005) | Active workflow docs and sidecar skills | Required `rg` search plus manual classification | Rerun after final text edits |
| Markdown whitespace health (SC-006) | Git diff | `git diff --check` | Run after final text edits |

## Project Structure

### Documentation (this feature)

```text
specs/025-sidecar-run-lifecycle/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-lifecycle.md
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
.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md
.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md
.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md
```

**Structure Decision**: Implement by editing existing workflow Markdown sources only. Do not add executable branch/worktree automation, application runtime code, migrations, frontend code, backend code, or new GitHub automation.

## Complexity Tracking

No constitutionally relevant complexity is introduced.
