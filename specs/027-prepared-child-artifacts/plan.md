# Implementation Plan: Prepared Child Spec Kit Artifacts

**Branch**: `chore/253-generate-prepared-child-spec-kit-artifacts` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/027-prepared-child-artifacts/spec.md`

## Summary

Extend the existing sidecar coordinator workflow build-out so prepared child
Spec Kit artifacts become a validated coordinator responsibility before
delegation. The implementation will define child artifact generation inputs,
paths, scope boundaries, write-gate behavior, coordinator artifact status
tracking, child handoff requirements, and focused simulations without
activating sidecar routing before #261.

## Technical Context

**Language/Version**: Markdown workflow and Spec Kit artifact sources, with
PowerShell validation scripts. Repository runtime evidence remains Java 17 with
Spring Boot 4.0.2 and Angular 21.2/TypeScript 5.9.2, but those runtimes are not
affected by this feature.

**Primary Dependencies**: Existing CatWorld sidecar workflow skill text,
Spec Kit artifacts, `docs/ARCHITECTURE.md`, PowerShell, `rg`, and `git diff
--check`. Backend and frontend dependencies are unaffected.

**Storage**: N/A for application storage. This feature adds repository workflow
artifacts only; no domain entities, persistence, migrations, browser storage,
API payloads, or external storage change.

**Testing**: Issue-required local simulations for child artifact path/content,
planning on `main` without writes, writing only inside a coordinator
branch/worktree, missing shared-contract stop behavior, sibling-scope stop
behavior, local `main` cleanliness review, source-map review, and `git diff
--check`.

**Target Platform**: CatWorld Codex workflow instructions consumed by future
implementation agents and maintainers during the sidecar build-out.

**Project Type**: CatWorld full-stack web administration system; this feature
affects repository workflow infrastructure only.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Preserve sequential defaults; keep sidecar product use dormant
until #261; write child artifacts only after the coordinator branch/worktree is
active; never write sidecar child artifacts to local `main`; preserve exact
child issue scope; do not make human-only decisions; do not confuse the
temporary `workflow/sidecar-buildout` integration strategy with the future
sidecar coordinator branch model; do not launch child agents, open sidecar PRs,
mutate GitHub issues, change normal sequential Spec Kit naming, or change
CatWorld product behavior.

**Scale/Scope**: Limited to issue #253 workflow artifacts and source map:
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, focused validation artifacts under
`specs/027-prepared-child-artifacts/`, and optional local test/simulation
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
  by issue #253.
- **Operational safety and sources of truth**: Pass. The feature updates
  workflow sources of truth and explicitly avoids secrets, real data,
  deployment exposure, backup/recovery changes, real sidecar product execution,
  GitHub issue mutation, and writes to local `main`.

Post-design re-check: Still compliant. The design artifacts keep the #261
activation gate, preserve sequential routing, extend the #252 artifact write
gate to child artifacts, and do not add product code, runtime contracts, or
application data changes.

## Architecture and Technology Assessment

**Assessment required**: No. Issue #253 prescribes the required workflow
outcomes, child artifact paths, write boundary, stop conditions, and validation
simulations. The selected implementation uses existing Markdown workflow
sources and local PowerShell simulation evidence without choosing a new
architecture, library, framework, storage mechanism, shared application
capability, or production operational mechanism.

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
and add focused local simulation evidence for prepared child artifact sets.

**Why selected**: It satisfies #253 while preserving #250/#251/#252 dormant
routing, lifecycle, and artifact write-boundary rules.

**Confirmed medium-term use**: Supports later #249/#254 through #261 sidecar
build-out issues by making child handoff artifacts durable before child
branch/worktree handoff and child-agent launch.

**Maintenance and operational consequences**: Maintainers must keep the child
artifact contract aligned with later sidecar Git, child implementation,
handoff, resume, validation, and cleanup issues. No runtime, security,
accessibility, persistence, or deployment maintenance burden is introduced.

**Reversibility and migration path**: Low cost. The Markdown instructions and
local validation artifacts can be edited by later approved sidecar issues. No
runtime migration is needed.

**Human approval**: N/A because no constitution-triggered technology choice is
introduced beyond explicit issue #253 scope and the already approved sidecar
build-out direction.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. This feature changes child artifact
handling from a described future requirement into execution-capable workflow
text while preserving inactive routing and local `main` safety.

**Old behavior/source of truth**: `catworld-parallel-coordinator`,
`catworld-parallel-child-implementation`, `docs/ARCHITECTURE.md`, and prior
artifacts from #225/#227/#251/#252 define sidecar child artifact paths, child
handoff expectations, lifecycle planning/write separation, and coordinator
artifact state. Child `spec.md`, `plan.md`, and `tasks.md` generation before
delegation is not yet specified as a validated coordinator responsibility.

**New mechanism semantics**: The same sources define child artifacts planned
from approved issue and repository context, written only inside the coordinator
branch/worktree, recorded in the coordinator artifact by path and preparation
status, scope-validated before delegation, and supplied to child agents as
prepared context that they must consume rather than regenerate.

**Mismatch risks**: Text could imply sidecar routing is active before #261,
write child artifacts to local `main`, allow missing artifacts during fan-out,
let child agents regenerate artifacts from private context, make human-only
decisions inside generated artifacts, leak sibling child scope, ignore missing
shared contracts, overwrite unrelated same-number artifacts, or blur the
current build-out branch strategy with the future sidecar coordinator branch
model.

**Mitigation**: Keep #261 activation text explicit; separate planning from
writing; require the active coordinator branch/worktree before artifact file
writes; block delegation on missing artifacts or missing/conflicting shared
contracts; validate child-scope isolation; stop on unproven artifact
collisions or duplicate child numbers; and state that this implementation
branch targets `workflow/sidecar-buildout` while future sidecar coordinator
branches may start from `origin/main`.

**Proof required**: Local simulations for three-child artifact content,
planning on `main` without writes, write-gated child artifact creation, missing
shared-contract stop, sibling-scope stop, coordinator artifact preparation
status, local `main` cleanliness review, changed-file/source-map review, and
`git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Child artifact path and required files (TR-001, TR-002, SC-001) | Sidecar coordinator skill, architecture docs, contract artifact | Simulation and source text review | Rerun/review after artifact schema text or simulation edits |
| Child artifact source inputs and scope isolation (TR-007, TR-008, TR-009, SC-005) | Sidecar workflow text and local simulation | Simulation of valid and sibling-scope-invalid child artifacts | Rerun after scope-validation wording or simulation edits |
| Planning/write gate and local `main` cleanliness (TR-003, TR-004, TR-005, TR-006, SC-002, SC-003, SC-007) | Sidecar workflow text and local Git simulation | Simulation plus `git status --porcelain` evidence for temporary main | Rerun after write-boundary edits |
| Shared contract, missing artifact, duplicate number, and collision blockers (TR-010, TR-011, TR-012, SC-004) | Sidecar coordinator artifact contract and simulation | Simulation/review of stop conditions | Rerun after blocker or collision text edits |
| Coordinator artifact preparation status and child handoff rules (TR-013, TR-014, SC-006) | Coordinator and child workflow skills | Source review and simulation output | Recheck after handoff or status wording changes |
| Sidecar activation and scope boundaries (SB-002, SB-003) | `catworld-parallel-coordinator`, `docs/ARCHITECTURE.md`, issue plan | Source text review | Recheck after final workflow edits |
| Markdown whitespace health (SC-008) | Git diff | `git diff --check` | Run after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/027-prepared-child-artifacts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── prepared-child-artifacts.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.agents/
└── skills/
    ├── catworld-parallel-child-implementation/
    │   └── SKILL.md
    └── catworld-parallel-coordinator/
        └── SKILL.md
docs/
└── ARCHITECTURE.md
specs/
└── 027-prepared-child-artifacts/
    ├── contracts/
    ├── quickstart.md
    └── validation/
        └── simulate-prepared-child-artifacts.ps1
```

**Structure Decision**: Implement by editing the existing sidecar coordinator
and child implementation skill text, architecture documentation, plus the #253
Spec Kit artifacts and focused validation script. Do not add application
runtime code, migrations, frontend code, backend code, real sidecar worktrees,
real sidecar product branches, PR operations, GitHub issue mutations, normal
sequential Spec Kit naming changes, or changes to the existing sequential
implementation skill.

## Complexity Tracking

No constitutionally relevant complexity is introduced.
