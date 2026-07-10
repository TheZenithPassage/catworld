# Implementation Plan: Merge-Aware Sidecar Resume and Next-Layer Progression

**Branch**: `chore/257-merge-aware-sidecar-resume-next-layer-progression` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/031-merge-aware-sidecar-resume/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Make the dormant sidecar coordinator workflow resume safely after user-owned
child PR merges into the remote coordinator branch. The implementation will
extend the existing sidecar coordinator and child workflow source text,
architecture documentation, and #257 validation artifacts so resume re-reads
current GitHub/repository evidence, refreshes local coordinator state from the
remote coordinator branch before active child refresh, marks affected
validation stale, records merged/active/blocked/pending/ready-next-layer child
state, and continues only when hard dependencies are integrated into the
updated local coordinator branch.

## Technical Context

**Language/Version**: Markdown workflow and Spec Kit artifact sources, with
PowerShell validation scripts and Git CLI simulations. Repository runtime
evidence remains Java 17 with Spring Boot 4.0.2 and Angular 21.2/TypeScript
5.9.2, but those runtimes are not affected by this feature.

**Primary Dependencies**: Existing CatWorld sidecar workflow skills, Spec Kit
artifacts, `docs/ARCHITECTURE.md`, PowerShell, Git CLI, `rg`, GitHub issue/PR
evidence conventions, and `git diff --check`. Backend and frontend
dependencies are unaffected.

<!--
  Inspect the current repository for language, dependency, runtime, and tool
  versions. Do not hardcode stale examples into generated plans.
-->

**Storage**: N/A for application storage. This feature records repository
workflow resume, branch refresh, child integration, dependency-layer, blocker,
cleanup approval, and validation freshness state in sidecar artifacts only; no
domain entities, persistence, migrations, browser storage, API payloads, or
external storage change.

**Testing**: Issue-required temporary Git simulations covering remote
coordinator branch refresh before active child refresh, active child normal
merge from updated local coordinator state, completed/active/blocked/pending
child resume states, validation staleness after refresh, unexpected local
coordinator changes, unsafe divergence, conflicting resume evidence,
prohibited-operation review, changed-file/source-map review, and `git diff
--check`.

**Target Platform**: CatWorld Codex workflow instructions consumed by future
implementation agents and maintainers during the sidecar build-out.

**Project Type**: CatWorld full-stack web administration system; this feature
affects repository workflow infrastructure only.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Preserve sequential defaults; keep sidecar product use dormant
until #261; do not use private conversation context as resume evidence; stop
on evidence mismatch, missing artifacts, missing branch state, unexpected
local coordinator changes, unsafe divergence, unresolved human-only decisions,
or unsafe dependency state; after user-owned child PR merges, fetch the remote
coordinator branch before local coordinator refresh; update local coordinator
state from the remote coordinator branch by fast-forward or normal merge only;
refresh active child branches/worktrees from the updated local coordinator
branch only by normal merge when needed; never rebase, force-push, use
force-with-lease, rewrite history, merge into or update local `main`, delete
sidecar resources, mutate GitHub issues, post public comments, or merge PRs;
mark affected validation stale until rerun; do not confuse this #257 PR's
`workflow/sidecar-buildout` base with the future sidecar coordinator branch
model.

**Scale/Scope**: Limited to issue #257 workflow artifacts and source map:
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, focused validation artifacts under
`specs/031-merge-aware-sidecar-resume/`, and optional local simulation helpers
if needed. The existing sequential implementation skill, legacy coordinator
orchestration skill, backend, frontend, migrations, real CatWorld sidecar
branches/worktrees, real PR merges, and GitHub issue state are not
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
  technical outcomes, resume evidence requirements, state-sensitive refresh
  and dependency cases, edge cases, explicit exclusions, dependency
  assumptions, and no unresolved open questions.
- **Architecture and technology assessment**: Pass. Merge-aware sidecar resume
  and next-layer progression are significant sidecar workflow behavior and
  material Git operational decisions, so the assessment below records the
  approved issue-driven approach and boundaries.
- **Focused changes and proportional validation**: Pass. Planned changes are
  limited to workflow source-of-truth text and focused local simulations
  required by issue #257.
- **Operational safety and sources of truth**: Pass. The feature updates
  workflow sources of truth and explicitly avoids secrets, real data,
  deployment exposure, backup/recovery changes, GitHub issue mutation, real PR
  merges, force-pushes, history rewriting, local `main` updates, and cleanup.

Post-design re-check: Still compliant. The design artifacts keep the #261
activation gate, preserve sequential routing, extend the #254-#256 Git,
fan-out, and child delivery contracts with merge-aware resume behavior, and do
not add product code, runtime contracts, or application data changes.

## Architecture and Technology Assessment

<!--
  Complete this section only when a constitution trigger applies. Use N/A for
  ordinary local changes where no significant architecture, framework, library,
  shared-infrastructure, or costly-to-replace decision is introduced. Do not
  create ceremonial comparison work for ordinary local changes; use
  "Assessment required: No" for small CRUD changes, routine use of an already
  approved framework, minor component organization, local utilities, and normal
  coding details.
-->

**Assessment required**: Yes. Merge-aware sidecar resume and next-layer
progression are significant shared sidecar workflow capabilities and material
Git/GitHub operational decisions, even though real sidecar routing remains
dormant until #261.

**Decision trigger**: significant shared capability; material operational
decision; significant cross-cutting workflow concern; correctness-sensitive Git
refresh, dependency-layer, and validation-freshness responsibility.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar
  coordinator and child skills, architecture documentation, #254-#256
  contracts, and local PowerShell/Git simulation pattern. This fits the
  approved issue scope and avoids introducing a new runtime, workflow engine,
  or GitHub automation dependency.
- Established library/framework/service: N/A. Adding an external workflow
  engine, GitHub Actions orchestration, queue, or Git automation service would
  exceed issue #257 and add operational surface before sidecar activation.
- Focused custom implementation: Add a repository-local executable helper for
  sidecar resume and branch refresh. This could become useful after adoption,
  but #257 can be completed through executable Codex skill procedures and
  focused local simulations, keeping the change reversible and aligned with
  the existing build-out pattern.

**Selected approach**: Update the existing sidecar coordinator skill, child
handoff/resume references, `docs/ARCHITECTURE.md`, and #257 contract,
quickstart, and validation script to define evidence re-read, remote
coordinator fetch, local coordinator refresh, active child refresh,
integration marking, validation staleness, dependency-layer recomputation, and
blocker handling. Do not add product code, external dependencies, GitHub issue
mutation automation, or a new workflow framework.

**Why selected**: The approach directly satisfies #257, builds on the approved
#254 branch/worktree orchestration, #255 fan-out state, and #256 child PR
delivery behavior, keeps the workflow dormant until #261, and remains
reversible because it is repository workflow text plus local validation
evidence.

**Confirmed medium-term use**: Supports later #249/#258-#261 sidecar build-out
issues by making resume strict enough for integrated coordinator validation,
final coordinator PR delivery, cleanup eligibility, and controlled activation
gates.

**Maintenance and operational consequences**: Maintainers must keep sidecar
resume, refresh, integration, and validation freshness rules aligned across
the coordinator skill, child skill, architecture documentation, and sidecar
contracts. Future sidecar execution must preserve remote-first coordinator
refresh, merge-only child refresh, no issue mutation, no prohibited Git
operations, honest stale validation reporting, and normal sequential workflow
boundaries.

**Reversibility and migration path**: Low to moderate cost. The Markdown
instructions and local validation script can be revised by later approved
sidecar issues or replaced by a dedicated helper if a future approved plan
justifies that change. Normal sequential workflow remains unaffected.

**Human approval**: Approved by the active issue #257 contract and the
still-applicable sidecar decisions recorded by issues #249, #254, #255, and
#256. Issue #257 explicitly requests merge-aware coordinator resume and
next-layer progression; issue #254 approved branch/worktree state as the Git
execution context; issue #255 approved dependency-layer state and child
handoffs; issue #256 approved child PR delivery to the coordinator branch.

## Semantic Equivalence and Replacement Review

<!--
  Complete this section when the feature replaces UI primitives, shared
  components, interaction mechanisms, presentation mechanisms, data/contract
  mechanisms, or other behavior-preserving mechanisms with mismatch risk.
  Examples: native input/label/button to Angular Material form-field/input/button,
  native error markup to a shared state component, native select to searchable
  selector, table/list replacement, dialog/overlay/routing/focus replacement,
  date/money/status/role/filtering presentation changes, or migration between
  validation/error-handling mechanisms. Use N/A for features with no replacement
  or migration risk.
-->

**Review required**: Yes, lightweight. This feature changes sidecar resume
from broad durable-state tracking into execution-capable merge-aware refresh
and next-layer progression instructions while preserving normal sequential
branch handling, normal direct child issue routing, and dormant sidecar
routing.

**Old behavior/source of truth**: `AGENTS.md`,
`.agents/skills/catworld-implement-issue/SKILL.md`,
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, and #252-#256 durable artifact, Git, fan-out, and
child delivery contracts.

**New mechanism semantics**: A resumed sidecar coordinator re-reads current
GitHub/repository evidence, compares it with recorded coordinator artifact
state, fetches the remote coordinator branch after user-owned child PR merges,
updates local coordinator branch/worktree by fast-forward or normal merge only,
marks child PRs integrated only after remote merge and local coordinator
refresh, refreshes still-active child branches from the updated local
coordinator branch by normal merge only when needed, marks affected validation
stale, recomputes dependency layers, and launches only dependency-ready
next-layer children.

**Mismatch risks**: Wording could accidentally trust private conversation
context, mark merged child PRs integrated before local coordinator refresh,
refresh active children from stale local coordinator state, permit rebase or
history rewriting during refresh, treat stale validation as fresh, launch a
hard-dependent layer too early, silently fall back to sequential mode, mutate
GitHub issues, confuse this PR's `workflow/sidecar-buildout` base with the
future coordinator branch model, or modify normal sequential workflow guidance.

**Mitigation**: Keep explicit #261 activation gates; require current evidence
re-read; require evidence/artifact mismatch stops; require remote coordinator
fetch and local coordinator refresh before integration marking, active child
refresh, or next-layer launch; prohibit rebase, force-push, force-with-lease,
history rewriting, local `main` updates, issue mutation, PR merges, and
cleanup; require stale validation marking; preserve
`.agents/skills/catworld-implement-issue/SKILL.md` and the legacy coordinator
orchestration skill unchanged.

**Proof required**: Temporary Git repository simulations, resume state
simulations, validation-staleness checks, prohibited-operation source review,
changed-file scope review, explicit check that normal sequential workflow
files are not changed, and `git diff --check`.

## Validation Evidence Plan

<!--
  Identify evidence at the layer that can prove each affected behavior. Keep this
  proportional: backend-only and documentation-only work should not get heavy UI
  checks, while observable, contract-visible, authorization, persistence,
  migration, security, shared component, global style, mobile, i18n, and other
  correctness-sensitive work needs stronger evidence.
-->

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Remote coordinator fetch and local coordinator refresh before active child refresh (TR-004, TR-005, TR-008, SC-001) | Sidecar coordinator skill, architecture docs, #257 Git simulation | Simulation and source review | Rerun after coordinator refresh wording or validation script edits |
| Active child refresh from updated local coordinator branch by normal merge only (TR-009, TR-010, SC-002) | Sidecar coordinator/child skills and #257 Git simulation | Simulation and prohibited-operation review | Rerun after child refresh wording changes |
| Resume evidence re-read and artifact mismatch blockers (TR-001, TR-002, TR-003, SC-005) | Sidecar coordinator skill, contract, validation script | Simulation and source review | Rerun after evidence field or mismatch handling edits |
| Completed, active, blocked, pending, and ready-next-layer child state recording (TR-007, TR-008, TR-012, TR-013, TR-014, SC-003) | Coordinator artifact contract and #257 simulation | Simulation and artifact status review | Rerun after status vocabulary or dependency-layer edits |
| Validation freshness after coordinator or active child refresh (TR-011, TR-015, SC-004) | Sidecar coordinator/child skills and validation script | Simulation and source review | Rerun after validation/readiness edits |
| Prohibited operations and normal sequential workflow unchanged (TR-010, TR-016, SB-003, SC-006) | Existing sequential skill, legacy coordinator skill, sidecar skills, architecture docs | `rg`/changed-file review and simulation assertions | Rerun before final report and after any workflow text edits |
| Markdown whitespace health (SC-007) | Git diff | `git diff --check` | Run after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/031-merge-aware-sidecar-resume/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── merge-aware-sidecar-resume.md
├── checklists/
│   └── requirements.md
├── validation/
│   └── simulate-merge-aware-sidecar-resume.ps1
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
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
└── 031-merge-aware-sidecar-resume/
    ├── contracts/
    ├── quickstart.md
    └── validation/
        └── simulate-merge-aware-sidecar-resume.ps1
```

**Structure Decision**: Implement by editing the existing sidecar coordinator
skill, sidecar child resume/handoff references, architecture documentation,
plus the #257 Spec Kit artifacts and focused validation script. Do not add
application runtime code, migrations, frontend code, backend code, real
sidecar worktrees, real sidecar product branches, real PR merge operations,
GitHub issue mutations, normal sequential workflow changes, or unapproved
cleanup.

## Complexity Tracking

> **Complete ONLY for necessary complexity that still complies with the
> constitution. A constitutional conflict cannot be justified here; the plan
> must change or the constitution must be amended first.**

| Complexity | Why Needed | Simpler Alternative Rejected Because | Constitution Compliance |
|------------|------------|-------------------------------------|-------------------------|
No constitutionally relevant complexity is introduced beyond the issue-approved
merge-aware sidecar resume workflow capability. The evidence, refresh,
integration, and next-layer progression rules are isolated to dormant sidecar
workflow infrastructure, validated with local simulations, and preserve the
normal sequential workflow.
