# Implementation Plan: Sidecar Resume State

**Branch**: `chore/232-add-resumable-state-tracking-for-sidecar-coordinator-runs` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/021-sidecar-resume-state/spec.md`

## Summary

Extend the opt-in sidecar coordinator workflow with resumable state tracking so
later Codex sessions can continue after pauses, user merges, blockers, failed
validation, or a new session without relying on private conversation context.
The implementation will update sidecar coordinator and child workflow
instructions, architecture documentation, a sidecar resume-state contract, and
local validation samples so coordinator artifacts record child artifact paths,
branches, local checkouts/worktrees, PRs, validation state, workflow status,
blockers, refresh-after-merge state, resume evidence that must be re-read,
stale validation, cleanup eligibility, and non-sidecar boundaries.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2 and Angular 21.2.x /
TypeScript 5.9.x exist in the repository, but this feature changes
repository-local Codex workflow instructions, architecture documentation,
generated Spec Kit artifacts, and local Markdown validation samples only.

**Primary Dependencies**: Existing repo-local Codex skills under
`.agents/skills/`, especially
`.agents/skills/catworld-parallel-coordinator/SKILL.md` and
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`; `AGENTS.md`
repository operation guardrails; `docs/ARCHITECTURE.md` Codex workflow routing
documentation; completed sidecar issues #227, #229, and #231; parent epic
#220.

**Storage**: N/A for CatWorld runtime persistence. The feature defines
workflow artifact state recorded in the sidecar coordinator artifact and local
Markdown validation samples; it does not change domain entities, database
schema, browser storage, API payloads, or external service contracts.

**Testing**: Local sample coordinator resume reports for completed, active,
blocked, pending, stale-validation, cleanup, and closed-child final-pass cases;
temporary Git simulation for merge-only active branch refresh; text checks for
resume-state fields, re-read evidence, stale validation, normal merge refresh,
cleanup eligibility, remote cleanup approval, and non-sidecar boundaries;
changed-file review confirming normal sequential workflow implementation is
unchanged; `git diff --check`.

**Target Platform**: Codex sessions and maintainers consuming CatWorld
repository-local workflow skills, architecture documentation, and Spec Kit
artifacts.

**Project Type**: CatWorld full-stack web administration system with
repository-local Codex/Spec Kit workflow infrastructure.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Apply resumable state tracking only to the sidecar coordinator
parallel workflow; later sessions must re-read GitHub and repository evidence
before continuing; stale validation or branch state must remain visible; active
sidecar branches/worktrees refresh from the coordinator branch by normal merge
only after child PR merges; rebase, force-push, history rewriting, local
cleanup after individual child PR merges, and remote cleanup without explicit
approval are prohibited; local cleanup is eligible only after the final
coordinator PR has merged into `main`; normal sequential issue state and
closed-child coordinator final-pass state remain unchanged.

**Scale/Scope**: Workflow-source changes to the sidecar coordinator skill,
sidecar child implementation skill, `docs/ARCHITECTURE.md`, and generated
feature artifacts plus local sample reports for issue #232. No CatWorld
product code, runtime configuration, migration, backend, frontend, live pull
request operation, GitHub issue mutation, public comment, remote cleanup, or
normal sequential workflow implementation changes.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited
  to CatWorld repository workflow infrastructure and does not introduce
  product-domain assumptions, cross-species abstractions, multi-tenancy,
  generic platform claims, or deployment assumptions.
- **Layered monolith responsibilities**: Compliant/N/A. No backend controller,
  service, repository, database, DTO, mapper, or application code changes.
- **Backend and database authority**: Compliant/N/A. No business rules,
  authorization, validation, calculations, frontend protections, or database
  constraints change.
- **Schema evolution**: Compliant/N/A. No schema changes or Flyway migrations.
- **Protected stay model**: Compliant/N/A. Stays and stay invariants are not
  affected.
- **Specification and planning discipline**: Compliant. The spec records
  technical outcomes, state-sensitive resume cases, scope boundaries, edge
  cases, out-of-scope behavior, dependencies, and no unresolved open questions.
  The selected sidecar-only resumability rules are specified by issue #232 and
  parent epic #220, and must remain aligned with #229 and #231.
- **Architecture and technology assessment**: Assessment required because
  resumable sidecar state is a material operational workflow decision and a
  shared sidecar execution capability. The assessment below references the
  human-authored issue contracts from #220, #229, #231, and #232.
- **Focused changes and proportional validation**: Compliant. Planned changes
  are limited to workflow instructions, documentation, local validation samples,
  and feature artifacts; validation uses local samples, a temporary Git
  simulation, text checks, changed-file review, and whitespace validation
  proportional to non-runtime operational workflow scope.
- **Operational safety and sources of truth**: Compliant. No secrets, real
  data, deployment exposure, backup, recovery, or production operation changes.
  The plan explicitly keeps remote cleanup behind user approval and preserves
  repository workflow sources of truth.

Post-design re-check: compliant. Phase 1 artifacts confirm no runtime data
model, API, persistence, authorization, UI, migration, or product behavior
changes. The selected sidecar resume-state contract records only workflow
artifact state and remains within the approved sidecar workflow from #220,
#227, #229, #231, and #232.

## Architecture and Technology Assessment

**Assessment required**: Yes. Sidecar resumable coordinator state is a material
operational decision for the future parallel workflow and a shared capability
used by coordinator and child sidecar paths.

**Decision trigger**: significant shared capability; material operational
decision; significant cross-cutting workflow concern; non-trivial correctness
responsibility for resume safety and validation freshness; meaningful
replacement risk if the rules changed normal sequential issue delivery.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar
  workflow skills and `docs/ARCHITECTURE.md` with explicit resume state,
  re-read evidence, refresh, stale-validation, and cleanup rules, and add
  feature-local Markdown samples for validation. This fits #232, uses existing
  source-of-truth locations, and keeps normal sequential workflow delivery
  unchanged.
- Established library/framework/service: N/A. No external workflow engine,
  state database, task runner, or dependency is needed for repository-local
  Codex skill instructions and Markdown validation samples.
- Focused custom implementation: Add scripts or automation to persist, resume,
  refresh, or clean sidecar state. Rejected for #232 because the issue defines
  state tracking and validation simulations, while sidecar adoption and
  execution remain gated by later work. Automation would add operational risk
  and exceed the approved scope.

**Selected approach**: Extend
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and
`docs/ARCHITECTURE.md` with the approved sidecar resume state, resume re-read,
merge-only refresh, stale validation, cleanup eligibility, and non-sidecar
boundary rules. Add `specs/021-sidecar-resume-state/samples/` Markdown samples
as local validation evidence. Do not add scripts, dependencies, product code,
GitHub issue mutations, public comments, or normal sequential state changes.

**Why selected**: The approach directly satisfies #232, preserves the isolated
sidecar architecture from #220 and the existing sidecar artifact/Git/validation
contracts from #227, #229, and #231, and remains reversible because it is
documentation/skill text plus local samples rather than executable automation.

**Confirmed medium-term use**: Supports later #220 child issues for explicit
split handoff alignment (#233), controlled dry-run/adoption gate (#234), and
future sidecar execution sessions that must resume safely after pauses, user
merges, blockers, or validation failures.

**Maintenance and operational consequences**: Maintainers must keep sidecar
coordinator skill, child implementation skill, architecture docs, resume-state
contract, and local samples aligned. Future sidecar execution must re-read
current GitHub/repository evidence before continuing and must keep stale
validation, refresh requirements, blockers, and cleanup eligibility visible.

**Reversibility and migration path**: Low to moderate cost. The state contract
can be revised or moved into a future dedicated sidecar state artifact before
adoption, while normal sequential workflow remains unaffected because this
feature does not change `.agents/skills/catworld-implement-issue/SKILL.md` or
add executable automation.

**Human approval**: Approved by the active issue contract and prior
issue-scoped decisions. Issue #220 defines sidecar operational guardrails,
issue #229 approves merge-only refresh and cleanup boundaries, issue #231
approves stale validation and reporting rules, and issue #232 explicitly
approves adding resumable state tracking for sidecar coordinator runs.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. This feature adds sidecar resume state rules that
must not replace or alter normal sequential state handling, direct child issue
delivery outside `parallel`, or closed-child coordinator final-pass handling.

**Old behavior/source of truth**: `AGENTS.md`,
`.agents/skills/catworld-implement-issue/SKILL.md`,
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, and issues #220, #227, #229, #231, and #232.

**New mechanism semantics**: Sidecar coordinator artifacts record child status
entries with artifact path, branch, local checkout/worktree, PR, validation
state, workflow status, blocker, refresh state, and cleanup eligibility. Resume
requires re-reading current GitHub and repository evidence before continuing.
Active sidecar branches/worktrees refresh from the coordinator branch by normal
merge only after child PR merges, and affected validation remains stale until
rerun.

**Mismatch risks**: The wording could accidentally imply private conversation
context is enough to resume; stale validation or stale branch state can support
readiness; active branches can refresh by rebase or history rewriting; local
cleanup can happen after individual child PR merges; remote cleanup can happen
without explicit approval; sidecar resume state applies to normal sequential
issue work; or closed-child coordinator final passes use sidecar resumability
state.

**Mitigation**: Encode explicit sidecar-only boundaries, resume re-read
requirements, child status fields, stale validation and refresh state, normal
merge-only refresh, cleanup eligibility timing, remote cleanup approval rules,
and normal workflow exclusions in sidecar skills and architecture
documentation. Keep the normal sequential implementation skill unchanged.

**Proof required**: Local resume-state samples, temporary Git normal-merge
simulation, cleanup eligibility simulation, closed-child coordinator final-pass
sample, text searches for required and prohibited wording, manual review
against #229 and #231, changed-file scope review, explicit diff review showing
`.agents/skills/catworld-implement-issue/SKILL.md` is unchanged, and
`git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Coordinator artifact child status fields and workflow statuses (TR-001-TR-003) | Sidecar coordinator skill, architecture docs, resume-state contract, local samples | Sample resume artifact and text review | Rerun after status-table wording changes |
| Resume re-read evidence and stale branch/validation visibility (TR-004-TR-006) | Sidecar skills, docs, contract, stale sample | Sample resume-after-merge report and text review | Rerun after resume/freshness wording changes |
| Normal merge-only active branch/worktree refresh; no rebase, force-push, or history rewriting (TR-007-TR-008, TR-016-TR-017) | Sidecar skills, docs, temporary Git simulation | Local merge simulation and prohibited-operation review | Rerun after refresh wording changes |
| Cleanup eligibility and remote cleanup approval (TR-009-TR-012, TR-018) | Sidecar skills, docs, cleanup sample | Cleanup sample and manual review | Rerun after cleanup wording changes |
| Normal sequential state and closed-child coordinator final-pass boundaries (TR-013-TR-014, TR-019) | Sidecar skills, docs, normal workflow scope review | Closed-child final-pass sample, changed-file review | Rerun before final report |
| Manual issue alignment (TR-020) | Fetched issues #229 and #231, feature artifacts, git diff | Manual review and `git diff --check` | Rerun after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/021-sidecar-resume-state/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-resume-state.md
├── samples/
│   ├── coordinator-resume-state.md
│   ├── active-branch-refresh-report.md
│   ├── cleanup-eligibility-report.md
│   └── coordinator-final-pass-state.md
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

docs/
└── ARCHITECTURE.md
```

**Structure Decision**: Update the two sidecar skills that own coordinator and
child sidecar workflow boundaries, update `docs/ARCHITECTURE.md` as the longer
workflow source of truth, and add local validation samples under the feature
artifact directory. Do not touch backend, frontend, migrations, operations, Git
automation scripts, PR automation, GitHub issue state, public comments,
`.agents/skills/catworld-implement-issue/SKILL.md`, or
`.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.

## Complexity Tracking

No constitution exception is required. The shared operational workflow state
rules are explicitly requested by #232, are isolated to the sidecar workflow
surface approved by #220 and #227/#229/#231, and preserve normal sequential
state handling.
