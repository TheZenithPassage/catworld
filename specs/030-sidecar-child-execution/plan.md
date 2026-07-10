# Implementation Plan: Sidecar Child Execution and PR Delivery

**Branch**: `chore/256-implement-sidecar-child-execution-and-child-pr-delivery` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/030-sidecar-child-execution/spec.md`

## Summary

Make the dormant sidecar child implementation workflow execution-capable after
a coordinator has prepared one child handoff, branch/worktree context, and PR
delivery rules. The implementation will extend the sidecar child skill,
coordinator handoff/source text, architecture documentation, and #256
validation artifacts so a child agent can validate its prepared checkout,
execute only prepared tasks, report validation honestly, and deliver a ready or
draft child PR against the coordinator branch without closing issues or
touching normal sequential workflow behavior.

## Technical Context

**Language/Version**: Markdown workflow and Spec Kit artifact sources, with
PowerShell validation scripts and Git/PR text simulations. Repository runtime
evidence remains Java 17 with Spring Boot 4.0.2 and Angular 21.2/TypeScript
5.9.2, but those runtimes are not affected by this feature.

**Primary Dependencies**: Existing CatWorld sidecar workflow skills, Spec Kit
artifacts, `docs/ARCHITECTURE.md`, PowerShell, Git CLI, `rg`, GitHub pull
request wording conventions, and `git diff --check`. Backend and frontend
dependencies are unaffected.

**Storage**: N/A for application storage. This feature records repository
workflow child execution, validation, and PR delivery state in sidecar
artifacts and reports only; no domain entities, persistence, migrations,
browser storage, API payloads, or external storage change.

**Testing**: Issue-required controlled local sample child handoff execution,
child PR body wording verification, child PR target verification, ready/draft
readiness verification for failed/skipped/stale/not-run validation, source
review proving `.agents/skills/catworld-implement-issue/SKILL.md` is not
modified, changed-file/source-map review, and `git diff --check`.

**Target Platform**: CatWorld Codex workflow instructions consumed by future
implementation agents and maintainers during the sidecar build-out.

**Project Type**: CatWorld full-stack web administration system; this feature
affects repository workflow infrastructure only.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Preserve sequential defaults; keep sidecar product use dormant
until #261; consume exactly one prepared child handoff; do not regenerate child
`spec.md`, `plan.md`, or `tasks.md`; confirm prepared child checkout and branch
before edits; implement only prepared child tasks; target child PRs at the
coordinator branch, not `main`; use `Related to` issue references only; draft
PRs unless required validation is fresh and passed; never merge, approve,
enable auto-merge, mutate GitHub issues, post public comments, delete remote
branches, rebase, force-push, or clean local sidecar resources; do not confuse
this #256 PR's `workflow/sidecar-buildout` base with the future sidecar
coordinator branch model.

**Scale/Scope**: Limited to issue #256 workflow artifacts and source map:
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`docs/ARCHITECTURE.md`, focused validation artifacts under
`specs/030-sidecar-child-execution/`, and optional local simulation helpers if
needed. The existing sequential implementation skill, legacy coordinator
orchestration skill, backend, frontend, migrations, real CatWorld sidecar
branches/worktrees, real child PR delivery during validation, and GitHub issue
state are not implementation targets.

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
  technical outcomes, validation/readiness matrix, PR wording/target
  constraints, edge cases, explicit exclusions, dependency assumptions, and no
  unresolved open questions.
- **Architecture and technology assessment**: Pass. Sidecar child execution
  and PR delivery is a significant workflow/operational capability, so the
  assessment below records the approved issue-driven approach and boundaries.
- **Focused changes and proportional validation**: Pass. Planned changes are
  limited to workflow source-of-truth text and focused local simulations
  required by issue #256.
- **Operational safety and sources of truth**: Pass. The feature updates
  workflow sources of truth and explicitly avoids secrets, real data,
  deployment exposure, backup/recovery changes, GitHub issue mutation, real
  validation PR mutation, force-pushes, history rewriting, and cleanup.

Post-design re-check: Still compliant. The design artifacts keep the #261
activation gate, preserve sequential routing, extend the #253-#255 prepared
artifact, Git, and handoff contracts with child execution/delivery behavior,
and do not add product code, runtime contracts, or application data changes.

## Architecture and Technology Assessment

**Assessment required**: Yes. Sidecar child execution and child PR delivery are
significant shared sidecar workflow capabilities and material Git/GitHub
operational decisions, even though real sidecar routing remains dormant until
#261.

**Decision trigger**: significant shared capability; material operational
decision; significant cross-cutting workflow concern; correctness-sensitive
GitHub delivery and validation-readiness responsibility.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar
  child and coordinator skills, architecture documentation, #253-#255
  contracts, and local PowerShell simulation pattern. This fits the approved
  issue scope and avoids introducing a new runtime, queue, or PR automation
  dependency.
- Established library/framework/service: N/A. Adding an external workflow
  engine, GitHub automation service, or dependency would exceed issue #256 and
  add operational surface before sidecar activation.
- Focused custom implementation: Add a repository-local executable helper for
  child PR creation and validation readiness. This could become useful later,
  but issue #256 can be completed through executable Codex skill procedures and
  focused local simulations, keeping the change reversible and aligned with the
  existing build-out pattern.

**Selected approach**: Update the existing sidecar child implementation skill,
coordinator handoff/delivery references, `docs/ARCHITECTURE.md`, and #256
contract, quickstart, and validation script to define child handoff execution,
checkout/branch confirmation, task-scope limits, validation freshness,
ready/draft PR delivery, coordinator-branch PR targeting, and related-only
issue wording. Do not add product code, external dependencies, GitHub issue
mutation automation, or a new workflow framework.

**Why selected**: The approach directly satisfies #256, builds on the approved
#253 prepared artifacts, #254 branch/worktree state, and #255 one-child handoff
rules, keeps the workflow dormant until #261, and remains reversible because it
is repository workflow text plus local validation evidence.

**Confirmed medium-term use**: Supports later #249/#257-#261 sidecar build-out
issues by making child implementation and child PR delivery strict enough for
resume, integrated coordinator validation, and controlled activation gates.

**Maintenance and operational consequences**: Maintainers must keep sidecar
child execution and PR delivery rules aligned across the child skill,
coordinator skill, architecture documentation, and sidecar contracts. Future
sidecar execution must preserve coordinator-branch PR targets, related-only
issue wording, honest readiness, no issue mutation, no prohibited Git
operations, and normal sequential workflow boundaries.

**Reversibility and migration path**: Low to moderate cost. The Markdown
instructions and local validation script can be revised by later approved
sidecar issues or replaced by a dedicated helper if a future approved plan
justifies that change. Normal sequential workflow remains unaffected.

**Human approval**: Approved by the active issue #256 contract and the
still-applicable sidecar decisions recorded by issues #249, #253, #254, and
#255. Issue #256 explicitly requests prepared child execution and child PR
delivery; issue #253 approved prepared child artifacts as the delegation gate;
issue #254 approved branch/worktree state as the execution context gate; issue
#255 approved exactly-one-child handoffs from the first dependency-ready layer.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. This feature changes sidecar child
execution and child PR delivery from guarded intent into execution-capable
workflow instructions while preserving normal sequential branch handling,
normal direct child issue routing, and dormant sidecar routing.

**Old behavior/source of truth**: `AGENTS.md`,
`.agents/skills/catworld-implement-issue/SKILL.md`,
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, and #253-#255 prepared artifact/Git/fan-out
contracts.

**New mechanism semantics**: The child workflow validates one prepared handoff,
confirms the expected child checkout and branch, consumes only prepared
`spec.md`, `plan.md`, `tasks.md`, shared contract, dependency state,
branch/worktree state, and validation requirements, executes only prepared
tasks, reports validation statuses explicitly, and when permitted commits,
pushes normally, and opens or updates a child PR targeting the coordinator
branch with related-only issue references and ready/draft status based on fresh
validation and blockers.

**Mismatch risks**: Wording could accidentally route direct child issues into
sidecar execution, let child agents regenerate planning artifacts, allow edits
outside prepared `tasks.md`, target child PRs at `main`, close child or
coordinator issues, treat stale/failed validation as ready, mutate GitHub
issues or public comments, perform prohibited Git operations, or modify the
normal sequential implementation skill.

**Mitigation**: Keep explicit routing boundaries; require prepared handoff and
checkout/branch proof; prohibit planning regeneration and sibling scope; require
coordinator-branch PR targets and `Related to` wording; draft PRs unless
required validation is fresh and passed; prohibit issue mutation, public
comments, merge/approval/auto-merge, force-push/rebase/cleanup; and preserve
`.agents/skills/catworld-implement-issue/SKILL.md` unchanged.

**Proof required**: Local child handoff execution simulation, PR wording/target
sample checks, validation-readiness draft/ready checks, prohibited-operation
source review, changed-file scope review, explicit check that normal sequential
workflow files are not changed, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Prepared handoff validation and checkout/branch confirmation (TR-001, TR-002, TR-004, SC-001) | Sidecar child skill and #256 simulation | Simulation and source review | Rerun after child handoff or context-validation edits |
| Prepared task-only execution without planning regeneration (TR-003, TR-005, SC-001, SC-005) | Sidecar child skill, prepared task fixture, source review | Simulation and text review | Rerun after task-scope wording changes |
| Child validation statuses and freshness (TR-006, TR-010, SC-004) | Sidecar child skill and #256 simulation | Simulation of passed, failed, skipped, timed-out, interrupted, partial, stale, blocked, and not-run validation states | Rerun after validation/readiness edits |
| Child PR target and related-only issue wording (TR-007, TR-008, TR-009, SC-002, SC-003) | Sidecar child skill, coordinator skill, architecture docs, PR sample checks | Simulation and source review | Rerun after PR delivery wording changes |
| Prohibited GitHub/Git side effects and final report contents (TR-011, TR-012) | Sidecar child skill, architecture docs, source text review | `Select-String`/`rg` context review and simulation report review | Rerun before final report and after any workflow text edits |
| Normal sequential workflow unchanged (TR-013, SB-003, SC-005) | Existing sequential skill and changed-file review | `git diff --name-only` and source review | Rerun before final report |
| Markdown whitespace health (SC-006) | Git diff | `git diff --check` | Run after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/030-sidecar-child-execution/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-child-execution.md
├── checklists/
│   └── requirements.md
├── validation/
│   └── simulate-sidecar-child-execution.ps1
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
└── 030-sidecar-child-execution/
    ├── contracts/
    ├── quickstart.md
    └── validation/
        └── simulate-sidecar-child-execution.ps1
```

**Structure Decision**: Implement by editing the existing sidecar child skill,
coordinator handoff/PR delivery references, architecture documentation, plus
the #256 Spec Kit artifacts and focused validation script. Do not add
application runtime code, migrations, frontend code, backend code, real sidecar
worktrees, real sidecar product branches, real validation PR operations,
GitHub issue mutations, normal sequential workflow changes, or unapproved
cleanup.

## Complexity Tracking

No constitutionally relevant complexity is introduced beyond the issue-approved
sidecar child execution and PR delivery workflow capability. The execution,
readiness, and PR wording rules are isolated to dormant sidecar workflow
infrastructure, validated with local simulations, and preserve the normal
sequential workflow.
