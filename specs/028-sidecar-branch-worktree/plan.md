# Implementation Plan: Sidecar Branch Worktree Orchestration

**Branch**: `chore/254-implement-sidecar-branch-worktree-orchestration` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/028-sidecar-branch-worktree/spec.md`

## Summary

Make the dormant sidecar coordinator workflow execution-capable for approved
Git branch and worktree preparation without activating sidecar routing before
#261. The implementation will add exact coordinator and child branch/worktree
orchestration rules to the sidecar coordinator and child handoff sources,
record actual local/remote Git state in the coordinator artifact contract, add
focused temporary Git repository simulations for the issue-required safety
cases, and preserve the normal sequential issue workflow unchanged.

## Technical Context

**Language/Version**: Markdown workflow and Spec Kit artifact sources, with
PowerShell validation scripts and Git CLI simulations. Repository runtime
evidence remains Java 17 with Spring Boot 4.0.2 and Angular 21.2/TypeScript
5.9.2, but those runtimes are not affected by this feature.

**Primary Dependencies**: Existing CatWorld sidecar workflow skill text,
Spec Kit artifacts, `docs/ARCHITECTURE.md`, PowerShell, Git CLI, `rg`, and
`git diff --check`. Backend and frontend dependencies are unaffected.

**Storage**: N/A for application storage. This feature records repository
workflow Git state in sidecar artifacts only; no domain entities, persistence,
migrations, browser storage, API payloads, or external storage change.

**Testing**: Issue-required temporary Git repository simulations for
coordinator branch creation from `origin/main`, coordinator non-force push,
two child branches from the coordinator branch, checkout/worktree isolation,
dirty-working-tree and collision stops, unsafe coordinator push stop behavior,
prohibited-operation review, changed-file/source-map review, and
`git diff --check`.

**Target Platform**: CatWorld Codex workflow instructions consumed by future
implementation agents and maintainers during the sidecar build-out.

**Project Type**: CatWorld full-stack web administration system; this feature
affects repository workflow infrastructure only.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Preserve sequential defaults; keep sidecar product use dormant
until #261; do not confuse this #254 implementation branch and PR target
(`workflow/sidecar-buildout`) with future sidecar coordinator branches that
start from current `origin/main`; never update local `main`; never write
sidecar artifacts to local `main`; push the coordinator branch normally before
child PR delivery can occur; never rebase, force-push, or rewrite sidecar
history; never target child branches or child PRs directly at `main`; do not
launch child agents, open sidecar PRs, mutate GitHub issues, delete sidecar
branches/worktrees after individual child PR merges, or change CatWorld
product behavior.

**Scale/Scope**: Limited to issue #254 workflow artifacts and source map:
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, focused validation artifacts under
`specs/028-sidecar-branch-worktree/`, and optional local test/simulation
helpers if needed. The existing sequential implementation skill, legacy
coordinator orchestration skill, backend, frontend, migrations, real CatWorld
sidecar branches/worktrees, and GitHub issue state are not implementation
targets.

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
  technical outcomes, state-sensitive workflow cases, edge cases, explicit
  exclusions, dependency assumptions, and no unresolved open questions.
- **Architecture and technology assessment**: Pass. The Git branch/worktree
  orchestration is a material operational sidecar workflow capability, so the
  assessment below records the approved issue-driven approach and boundaries.
- **Focused changes and proportional validation**: Pass. Planned changes are
  limited to workflow source-of-truth text and focused local Git simulations
  required by issue #254.
- **Operational safety and sources of truth**: Pass. The feature updates
  workflow sources of truth and explicitly avoids secrets, real data,
  deployment exposure, backup/recovery changes, GitHub issue mutation, real
  sidecar PR delivery, force-pushes, history rewriting, and writes to local
  `main`.

Post-design re-check: Still compliant. The design artifacts keep the #261
activation gate, preserve sequential routing, extend the #251-#253 sidecar
workflow contracts with executable Git preparation state, and do not add
product code, runtime contracts, or application data changes.

## Architecture and Technology Assessment

**Assessment required**: Yes. Executable sidecar coordinator/child
branch/worktree orchestration is a significant shared sidecar capability and a
material Git operational decision, even though it is confined to dormant
workflow infrastructure until #261.

**Decision trigger**: significant shared capability; material operational
decision; significant cross-cutting workflow concern; correctness-sensitive
Git safety responsibility.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar
  coordinator and child skills, architecture documentation, coordinator
  artifact contract, and local PowerShell/Git simulation pattern already used
  by #252 and #253. This fits the approved issue scope and avoids introducing
  a new runtime or dependency.
- Established library/framework/service: N/A. Adding an external Git
  orchestration service, workflow engine, or dependency would exceed issue
  #254 and would add operational surface before sidecar activation.
- Focused custom implementation: Add a repository-local helper library or
  command wrapper for real sidecar branch/worktree operations. This could be
  useful later, but issue #254 can be completed through executable Codex skill
  procedures plus temporary Git simulations, matching the current workflow
  architecture and minimizing maintenance cost.

**Selected approach**: Update the existing sidecar coordinator and child
implementation skill instructions, `docs/ARCHITECTURE.md`, and the #254
contract/quickstart/validation script to define and prove executable Git
orchestration steps. Do not add product code, external dependencies, GitHub
mutation automation, or a new workflow framework.

**Why selected**: The approach directly satisfies #254, builds on the approved
#220/#229 sidecar Git model and #251-#253 artifact lifecycle, keeps the
workflow dormant until #261, and remains reversible because it is repository
workflow text plus local validation evidence.

**Confirmed medium-term use**: Supports later #249/#255-#261 sidecar build-out
issues by making coordinator/child Git state real enough for child PR delivery,
resume, validation freshness, and controlled activation gates.

**Maintenance and operational consequences**: Maintainers must keep sidecar
Git instructions aligned across the coordinator skill, child skill,
architecture documentation, and coordinator artifacts. Future sidecar
execution must keep normal non-force pushes, collision stops, clean-worktree
guards, and local `main` isolation intact.

**Reversibility and migration path**: Low to moderate cost. The Markdown
instructions and local validation script can be revised by later approved
sidecar issues or replaced by a dedicated helper if a future approved plan
justifies that change. Normal sequential workflow remains unaffected.

**Human approval**: Approved by the active issue #254 contract and the
still-applicable sidecar Git decision recorded by issue #229. Issue #254
explicitly requests executable local and remote Git branch/worktree operations
and issue #229 approved the sidecar Git model that this implementation makes
operational.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. This feature changes sidecar Git
orchestration from documented rules into execution-capable coordinator
workflow instructions while preserving normal sequential branch handling and
dormant sidecar routing.

**Old behavior/source of truth**: `AGENTS.md`,
`.agents/skills/catworld-implement-issue/SKILL.md`,
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, issue #229 Git state artifacts, and #251-#253
lifecycle/artifact contracts.

**New mechanism semantics**: The sidecar coordinator computes deterministic
names, verifies clean state and collisions, creates or enters one coordinator
branch/worktree from current `origin/main`, pushes the coordinator branch to
`origin` with a normal non-force push before child PR readiness, creates child
branches from the coordinator branch, creates one isolated child
checkout/worktree per active child, records actual branch/worktree state, and
stops on unsafe push or prohibited operation conditions.

**Mismatch risks**: Wording could accidentally activate sidecar routing before
#261, mutate local `main`, confuse this PR's `workflow/sidecar-buildout` base
with future coordinator branches, allow child branches from `main`, imply child
PR delivery before the remote coordinator branch exists, allow unproven
collision reuse, permit force-push/history rewriting, or modify normal
sequential workflow guidance.

**Mitigation**: Keep explicit #261 activation gates; record the temporary
build-out branch exception in feature artifacts; require clean-state and
collision checks before Git operations; require normal non-force coordinator
push before child PR delivery; prohibit child branches/PRs from targeting
`main`; preserve `.agents/skills/catworld-implement-issue/SKILL.md` and the
legacy coordinator orchestration skill unchanged.

**Proof required**: Temporary Git repository simulations, prohibited-operation
source review, changed-file scope review, explicit check that normal
sequential workflow files are not changed, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Coordinator branch from current `origin/main` and coordinator worktree isolation (TR-001, TR-003, TR-004, SC-001, SC-004) | Sidecar coordinator skill, architecture docs, temporary Git simulation | Simulation and source review | Rerun after coordinator Git wording or validation script edits |
| Coordinator branch normal non-force push before child PR delivery (TR-007, TR-008, TR-009, SC-002, SC-006) | Sidecar coordinator skill, contract, temporary bare remote simulation | Simulation and source review | Rerun after push/readiness wording changes |
| Child branches from coordinator branch and isolated child worktrees (TR-010, TR-011, SC-003, SC-004) | Sidecar coordinator and child skills, temporary Git simulation | Simulation and handoff text review | Rerun after child Git context edits |
| Deterministic names, collision handling, dirty-state stops (TR-002, TR-012, TR-013, SC-005) | Sidecar coordinator skill, validation script, contract artifact | Simulation and manual review | Rerun after naming/collision/dirty-state edits |
| Prohibited operations and local `main` safety (TR-005, TR-014, SC-007) | Sidecar skills, docs, source text review | `Select-String`/`rg` context review and changed-file review | Rerun before final report and after any workflow text edits |
| Normal sequential workflow unchanged (TR-015, SB-002) | Existing sequential skill and legacy coordinator skill | Changed-file review | Rerun before final report |
| Markdown whitespace health (SC-008) | Git diff | `git diff --check` | Run after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/028-sidecar-branch-worktree/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-branch-worktree-orchestration.md
├── checklists/
│   └── requirements.md
├── validation/
│   └── simulate-sidecar-branch-worktree.ps1
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
└── 028-sidecar-branch-worktree/
    ├── contracts/
    ├── quickstart.md
    └── validation/
        └── simulate-sidecar-branch-worktree.ps1
```

**Structure Decision**: Implement by editing the existing sidecar coordinator
and child implementation skill text, architecture documentation, plus the #254
Spec Kit artifacts and focused validation script. Do not add application
runtime code, migrations, frontend code, backend code, real sidecar worktrees,
real sidecar product branches, PR operations, GitHub issue mutations, normal
sequential workflow changes, or unapproved remote cleanup.

## Complexity Tracking

No constitutionally relevant complexity is introduced beyond the issue-approved
sidecar Git workflow capability. The executable Git safety rules are isolated
to dormant sidecar workflow infrastructure, validated with temporary
repositories, and preserve the normal sequential workflow.
