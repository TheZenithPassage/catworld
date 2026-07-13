# Implementation Plan: Sidecar Coordinator Artifacts

**Branch**: `chore/252-generate-real-sidecar-coordinator-orchestration-artifacts` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-sidecar-coordinator-artifacts/spec.md`

## Summary

Make issue #252's sidecar coordinator artifact handling execution-capable by
extending existing workflow source-of-truth text and adding focused dry-run
simulation coverage. The implementation will define a durable coordinator
orchestration artifact contract, require a branch/worktree write gate before
artifact files are written, support same-run resume versus collision stops,
and update factual state transitions without activating real sidecar routing
before #261.

## Technical Context

**Language/Version**: Markdown workflow and Spec Kit artifact sources, with
small repository-local validation scripts if useful. Repository runtime
evidence remains Java 17 with Spring Boot 4.0.2 and Angular 21.2/TypeScript
5.9.2, but those runtimes are not affected by this feature.

**Primary Dependencies**: Existing Spec Kit workflow artifacts, CatWorld agent
skills, `docs/ARCHITECTURE.md`, PowerShell, `rg`, and `git diff --check`.
Backend and frontend dependencies are unaffected.

**Storage**: N/A for application storage. This feature adds repository
workflow artifacts only; no domain entities, persistence, migrations, browser
storage, API payloads, or external storage change.

**Testing**: Issue-required local simulations for artifact path/content,
planning on `main` without writes, writing only inside a coordinator
branch/worktree, same-number resume/collision behavior, blocked coordinator
state, local `main` cleanliness review, source-map review, and
`git diff --check`.

**Target Platform**: CatWorld Codex workflow instructions consumed by future
implementation agents and maintainers during the sidecar build-out.

**Project Type**: CatWorld full-stack web administration system; this feature
affects repository workflow infrastructure only.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Preserve sequential defaults; keep sidecar product use dormant
until #261; do not write sidecar artifacts to local `main`; do not confuse this
temporary build-out branch strategy with future sidecar coordinator branches
starting from `origin/main`; do not implement child artifact generation,
general branch/worktree orchestration, child agent launch, sidecar PR opening,
GitHub issue mutation, or CatWorld product behavior.

**Scale/Scope**: Limited to issue #252 workflow artifacts and source map:
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`docs/ARCHITECTURE.md`, focused validation artifacts under
`specs/026-sidecar-coordinator-artifacts/`, and optional local test/simulation
helpers if needed. The existing sequential implementation skill and dormant
legacy coordinator orchestration skill are not implementation targets.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. This feature changes
  CatWorld repository workflow guidance only and does not introduce product
  scope, cross-species abstractions, multi-tenancy, platform claims, or
  permanent assumptions about one installation.
- **Layered monolith responsibilities**: Pass. No controller, service,
  repository, database, DTO, or mapper behavior changes.
- **Backend and database authority**: Pass. No business rule, authorization,
  validation, calculation, or database integrity behavior changes.
- **Schema evolution**: Pass. No schema changes or Flyway migrations.
- **Protected stay model**: Pass. Stay status and stay invariants are
  unaffected.
- **Specification and planning discipline**: Pass. The spec records objective
  technical outcomes, edge cases, explicit exclusions, dependency assumptions,
  and no unresolved open questions.
- **Architecture and technology assessment**: Pass. The feature does not add a
  framework, dependency, persistence strategy, shared application
  infrastructure, production operational mechanism, or costly replacement
  decision. It extends issue-approved sidecar workflow text and simulations.
- **Focused changes and proportional validation**: Pass. Planned changes are
  limited to workflow source-of-truth text and focused local evidence required
  by issue #252.
- **Operational safety and sources of truth**: Pass. The feature updates
  workflow sources of truth and explicitly avoids secrets, real data,
  deployment exposure, backup/recovery changes, real sidecar product execution,
  GitHub issue mutation, and writes to local `main`.

Post-design re-check: Still compliant. The design artifacts keep the #261
activation gate, preserve sequential routing, define the artifact write gate
without adding branch/worktree orchestration beyond issue #252, and do not add
product code, runtime contracts, or application data changes.

## Architecture and Technology Assessment

**Assessment required**: No. Issue #252 prescribes the required workflow
outcomes, artifact contents, write boundary, and validation simulations. The
selected implementation uses existing Markdown workflow sources and local
simulation evidence without choosing a new architecture, library, framework,
storage mechanism, shared application capability, or production operational
mechanism.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: Existing sidecar skills,
  architecture documentation, Spec Kit artifacts, and local PowerShell/Git
  simulation capability are sufficient for the confirmed build-out work.
- Established library/framework/service: N/A. Adding an external dependency or
  service would exceed the issue scope.
- Focused custom implementation: N/A for production behavior. Small local
  validation scripts or samples may be added only as test evidence and remain
  scoped to the repository workflow build-out.

**Selected approach**: Update existing sidecar workflow source-of-truth text
and add focused local simulation evidence.

**Why selected**: It satisfies #252 while preserving #250/#251 dormant routing
and lifecycle boundaries and avoiding premature sidecar activation.

**Confirmed medium-term use**: Supports later #253 through #261 sidecar
build-out issues by defining the durable coordinator artifact contract and
write gate they can consume.

**Maintenance and operational consequences**: Maintainers must keep the
coordinator artifact contract aligned with later sidecar Git, child artifact,
handoff, resume, validation, and cleanup issues. No runtime, security,
accessibility, persistence, or deployment maintenance burden is introduced.

**Reversibility and migration path**: Low cost. The Markdown instructions and
local validation artifacts can be edited by later approved sidecar issues. No
runtime migration is needed.

**Human approval**: N/A because no constitution-triggered technology choice is
introduced beyond explicit issue #252 scope and the already approved sidecar
build-out direction.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. This feature changes coordinator
artifact handling from description-only guidance to execution-capable workflow
text while preserving inactive routing and local `main` safety.

**Old behavior/source of truth**: `catworld-parallel-coordinator`,
`docs/ARCHITECTURE.md`, and prior artifacts from #225/#227/#251 define
sidecar artifact paths, preparation guidance, and lifecycle planning/write
separation, but coordinator artifact writing is not yet specified as a durable
execution artifact with resume/collision state.

**New mechanism semantics**: The same sources define a coordinator
orchestration artifact that is planned before the write gate, written only
inside the active coordinator branch/worktree, updated with factual run state,
and reused only when it is proven to belong to the same resumable run.

**Mismatch risks**: Text could imply sidecar routing is active before #261,
allow artifact writes to local `main`, imply branch/worktree/PR/validation
state exists before it does, overwrite unrelated same-number artifacts, launch
child work while blocked, or blur the current build-out branch strategy with
the future sidecar coordinator branch model.

**Mitigation**: Keep #261 activation text explicit; separate planning from
writing; require the active coordinator branch/worktree before artifact file
writes; record factual state only; stop on unproven collisions; keep blocked
coordinators from launching child work; and state that this implementation
branch targets `workflow/sidecar-buildout` while future sidecar coordinator
branches may start from `origin/main`.

**Proof required**: Local simulations for valid coordinator artifact content,
planning on `main` without writes, write-gated artifact creation, same-run
resume/collision handling, blocked coordinator state, local `main` cleanliness
review, changed-file/source-map review, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Coordinator artifact path and required sections (TR-001, TR-005, SC-001) | Sidecar coordinator skill, architecture docs, contract artifact | Simulation and source text review | Rerun/review after artifact schema text or simulation edits |
| Planning/write gate and local `main` cleanliness (TR-002, TR-003, TR-004, SC-002, SC-003, SC-006) | Sidecar workflow text and local Git simulation | Simulation plus `git status --porcelain` evidence for temporary main | Rerun after write-boundary edits |
| Existing same-number artifact resume/collision behavior (TR-008, SC-004) | Sidecar workflow text and local simulation | Simulation of same-run metadata and collision metadata | Rerun after resume/collision text edits |
| Blocked coordinator state (TR-006, TR-007, TR-009, SC-005) | Sidecar coordinator artifact contract and simulation | Simulation of blocker update without child launch | Rerun after blocker/status text edits |
| Sidecar activation and scope boundaries (TR-010, SB-002, SB-003) | `catworld-parallel-coordinator`, `docs/ARCHITECTURE.md`, issue plan | Source text review | Recheck after final workflow edits |
| Markdown whitespace health (SC-007) | Git diff | `git diff --check` | Run after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/026-sidecar-coordinator-artifacts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-coordinator-artifact.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.agents/
└── skills/
    └── catworld-parallel-coordinator/
        └── SKILL.md
docs/
└── ARCHITECTURE.md
specs/
└── 026-sidecar-coordinator-artifacts/
    ├── contracts/
    └── quickstart.md
```

**Structure Decision**: Implement by editing the existing sidecar coordinator
skill and architecture documentation, plus the #252 Spec Kit artifacts and
focused validation guide. Do not add application runtime code, migrations,
frontend code, backend code, real sidecar worktrees, real sidecar product
branches, PR operations, GitHub issue mutations, or changes to the existing
sequential implementation skill.

## Complexity Tracking

No constitutionally relevant complexity is introduced.
