# Implementation Plan: Dependency-Layer Fan-Out and Child Handoffs

**Branch**: `chore/255-implement-dependency-layer-fan-out-and-child-handoffs` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/029-dependency-layer-fanout/spec.md`

## Summary

Make the dormant sidecar coordinator workflow execution-capable for one
dependency-ready fan-out layer after prepared child artifacts and Git
branch/worktree state are ready. The implementation will extend the existing
sidecar coordinator and child handoff source-of-truth text, add a #255 fan-out
contract and focused local simulation script, record per-child launch states in
coordinator artifacts, and preserve the current sequential workflow and #261
activation gate.

## Technical Context

**Language/Version**: Markdown workflow and Spec Kit artifact sources, with
PowerShell validation scripts. Repository runtime evidence remains Java 17
with Spring Boot 4.0.2 and Angular 21.2/TypeScript 5.9.2, but those runtimes
are not affected by this feature.

**Primary Dependencies**: Existing CatWorld sidecar workflow skill text,
Spec Kit artifacts, `docs/ARCHITECTURE.md`, PowerShell, Git CLI, `rg`,
`tool_search` for multi-agent capability discovery, an approved
child-agent/subagent launch capability when available in an activated future
sidecar run, and `git diff --check`. Backend and frontend dependencies are
unaffected.

**Storage**: N/A for application storage. This feature records repository
workflow fan-out and handoff state in sidecar artifacts only; no domain
entities, persistence, migrations, browser storage, API payloads, or external
storage change.

**Testing**: Issue-required local coordinator simulations for three independent
children, hard dependencies across layers, shared-contract blockers, missing
prerequisites, non-mechanical conflict risks, unavailable child-agent
capability, sample child handoff content review against the sidecar child
skill, coordinator artifact status review, prohibited fallback review,
changed-file/source-map review, and `git diff --check`.

**Target Platform**: CatWorld Codex workflow instructions consumed by future
implementation agents and maintainers during the sidecar build-out.

**Project Type**: CatWorld full-stack web administration system; this feature
affects repository workflow infrastructure only.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Preserve sequential defaults; keep sidecar product use dormant
until #261; start only one dependency-ready layer; never launch hard-dependent
children before dependencies are merged into the coordinator branch; never
parallelize unresolved shared-contract blockers or non-mechanical conflict
risks; stop when child-agent capability is unavailable; pass exactly one child
issue and prepared handoff to each child agent; do not regenerate child
planning artifacts; do not mutate GitHub issues; do not target `main` from
sidecar child work; do not confuse this #255 PR's `workflow/sidecar-buildout`
base with the future sidecar coordinator branch model.

**Scale/Scope**: Limited to issue #255 workflow artifacts and source map:
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, focused validation artifacts under
`specs/029-dependency-layer-fanout/`, and optional local simulation helpers if
needed. The existing sequential implementation skill, legacy coordinator
orchestration skill, backend, frontend, migrations, real CatWorld sidecar
branches/worktrees, real child-agent launches, and GitHub issue state are not
implementation targets.

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
  technical outcomes, state-sensitive fan-out cases, handoff contents, edge
  cases, explicit exclusions, dependency assumptions, and no unresolved open
  questions.
- **Architecture and technology assessment**: Pass. Dependency-layer fan-out
  and child-agent launch capability are significant sidecar workflow behavior,
  so the assessment below records the approved issue-driven approach and
  boundaries.
- **Focused changes and proportional validation**: Pass. Planned changes are
  limited to workflow source-of-truth text and focused local simulations
  required by issue #255.
- **Operational safety and sources of truth**: Pass. The feature updates
  workflow sources of truth and explicitly avoids secrets, real data,
  deployment exposure, backup/recovery changes, GitHub issue mutation, real
  child-agent launches during build-out, force-pushes, history rewriting, and
  writes to local `main`.

Post-design re-check: Still compliant. The design artifacts keep the #261
activation gate, preserve sequential routing, extend the #253-#254 prepared
artifact and branch/worktree contracts with fan-out and handoff readiness, and
do not add product code, runtime contracts, or application data changes.

## Architecture and Technology Assessment

**Assessment required**: Yes. Dependency-layer fan-out plus child-agent launch
readiness is a significant shared sidecar capability and a correctness-sensitive
workflow execution responsibility, even though it remains dormant for real
product use until #261.

**Decision trigger**: significant shared capability; material operational
decision; significant cross-cutting workflow concern; correctness-sensitive
delegation responsibility.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar
  coordinator and child skills, architecture documentation, coordinator
  artifact contracts, and local PowerShell simulation pattern already used by
  #252, #253, and #254. Use the currently exposed Codex multi-agent spawn
  capability only in a future activated sidecar run, after the workflow has
  verified it is available.
- Established library/framework/service: N/A. Adding an external queue,
  workflow engine, GitHub Actions runner, or automation service would exceed
  issue #255 and would add operational surface before sidecar activation.
- Focused custom implementation: Add a repository-local helper library or
  executable command for layer scheduling and child launch. This could become
  useful after adoption, but #255 can be completed with executable Codex skill
  procedures plus focused local simulations, matching the current build-out
  architecture and avoiding premature framework cost.

**Selected approach**: Update the existing sidecar coordinator and child
implementation skill instructions, `docs/ARCHITECTURE.md`, and #255 contract,
quickstart, and validation script to define dependency-layer fan-out,
capability detection, child handoff contents, and coordinator artifact launch
statuses. In the future activated workflow, use the available Codex multi-agent
spawn capability for child agents; if that capability is unavailable, stop and
report the blocker instead of falling back to sequential execution. Do not add
product code, external dependencies, GitHub mutation automation, or a new
workflow framework.

**Why selected**: The approach directly satisfies #255, builds on the approved
#253 prepared child artifact gate and #254 branch/worktree gate, keeps the
workflow dormant until #261, and remains reversible because it is repository
workflow text plus local validation evidence.

**Confirmed medium-term use**: Supports later #249/#256-#261 sidecar build-out
issues by making one-layer child delegation, launch-status recording, and
handoff context strict enough for PR delivery, resume, validation freshness,
and controlled activation gates.

**Maintenance and operational consequences**: Maintainers must keep sidecar
fan-out rules aligned across the coordinator skill, child skill, architecture
documentation, and coordinator artifacts. Future sidecar execution must keep
one-layer launch, no sequential fallback, no issue mutation, no `main` child
targets, and exact prepared handoff consumption intact.

**Reversibility and migration path**: Low to moderate cost. The Markdown
instructions and local validation script can be revised by later approved
sidecar issues or replaced by a dedicated helper if a future approved plan
justifies that change. Normal sequential workflow remains unaffected.

**Human approval**: Approved by the active issue #255 contract and the
still-applicable sidecar lifecycle decisions recorded by issues #249, #253, and
#254. Issue #255 explicitly requests dependency-layer fan-out and child
handoffs; issue #253 approved prepared child artifacts as the delegation gate;
issue #254 approved branch/worktree state as the launch context gate.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. This feature changes sidecar fan-out
from documented lifecycle intent into execution-capable coordinator workflow
instructions while preserving normal sequential branch handling and dormant
sidecar routing.

**Old behavior/source of truth**: `AGENTS.md`,
`.agents/skills/catworld-implement-issue/SKILL.md`,
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, and #251-#254 lifecycle/artifact/Git contracts.

**New mechanism semantics**: The sidecar coordinator builds dependency layers
from child dependencies, shared contract state, conflict risks, prepared
artifact state, and coordinator branch/worktree state; launches only the first
dependency-ready layer through available child-agent capability; records
launched, blocked, pending, and waiting-for-dependency-merge child states; and
builds exactly one complete prepared handoff per launched child.

**Mismatch risks**: Wording could accidentally activate sidecar routing before
#261, launch multiple dependency layers, treat hard-dependent children as ready
before dependency merges, parallelize shared-contract blockers or
non-mechanical conflicts, silently fall back to sequential execution when
child-agent capability is unavailable, give a child sibling scope, let a child
regenerate planning artifacts, permit GitHub issue mutation, or target child
work at `main`.

**Mitigation**: Keep explicit #261 activation gates; require capability
detection before launch; require all prepared child artifacts and branch/worktree
context before handoff; require one child issue per handoff; record non-launch
reasons in the coordinator artifact; prohibit sequential fallback, sibling
scope, planning regeneration, issue mutation, and `main` child targets; preserve
`.agents/skills/catworld-implement-issue/SKILL.md` and the legacy coordinator
orchestration skill unchanged.

**Proof required**: Local fan-out simulations, handoff content review against
the sidecar child skill, coordinator artifact status review, changed-file scope
review, explicit check that normal sequential workflow files are not changed,
and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Three independent children launch in one dependency-ready layer (TR-001, TR-002, TR-008, SC-001) | Sidecar coordinator skill and #255 simulation | Simulation and source review | Rerun after fan-out or handoff readiness edits |
| Hard dependencies wait for dependency merge into coordinator branch (TR-003, SC-002) | Sidecar coordinator skill, architecture docs, simulation | Simulation and source review | Rerun after dependency-layer wording changes |
| Missing prerequisites, shared-contract blockers, and non-mechanical conflict risks stop affected fan-out (TR-004, TR-005, TR-007, SC-003) | Sidecar coordinator skill, coordinator artifact contract, simulation | Simulation and blocker report review | Rerun after blocker/conflict wording changes |
| Unavailable child-agent/subagent capability stops without sequential fallback (TR-006, SC-004) | Sidecar coordinator skill and simulation | Simulation and text review | Rerun after capability-detection edits |
| Prepared handoff contents and one-child scope (TR-007, TR-008, TR-009, TR-010, SC-005) | Sidecar coordinator and child implementation skills, fan-out contract | Sample handoff review against child skill requirements | Rerun after handoff field edits |
| Coordinator artifact launched/blocked/pending/waiting status recording (TR-011, SC-006) | Coordinator artifact contract and simulation | Simulation and source review | Rerun after artifact status vocabulary edits |
| Normal sequential workflow unchanged and sidecar routing dormant (TR-012, SB-003) | Existing sequential skill, legacy coordinator skill, architecture docs | Changed-file review | Rerun before final report |
| Markdown whitespace health (SC-007) | Git diff | `git diff --check` | Run after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/029-dependency-layer-fanout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dependency-layer-fanout.md
├── checklists/
│   └── requirements.md
├── validation/
│   └── simulate-dependency-layer-fanout.ps1
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
└── 029-dependency-layer-fanout/
    ├── contracts/
    ├── quickstart.md
    └── validation/
        └── simulate-dependency-layer-fanout.ps1
```

**Structure Decision**: Implement by editing the existing sidecar coordinator
and child implementation skill text, architecture documentation, plus the #255
Spec Kit artifacts and focused validation script. Do not add application
runtime code, migrations, frontend code, backend code, real sidecar worktrees,
real sidecar product branches, PR operations, GitHub issue mutations, normal
sequential workflow changes, or unapproved remote cleanup.

## Complexity Tracking

No constitutionally relevant complexity is introduced beyond the issue-approved
sidecar fan-out workflow capability. The dependency-layer and child handoff
rules are isolated to dormant sidecar workflow infrastructure, validated with
local simulations, and preserve the normal sequential workflow.
