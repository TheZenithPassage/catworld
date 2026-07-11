# Implementation Plan: Sidecar Local Cleanup

**Branch**: `chore/259-sidecar-cleanup-execution` | **Date**: 2026-07-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/033-sidecar-local-cleanup/spec.md`

## Summary

Extend the future sidecar coordinator cleanup phase with a small local JSON journal stored at `<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json`. The coordinator will reuse current final-merge evidence and existing same-run branch/worktree ownership records, fail closed before deletion when evidence is missing, ownership is unknown, or any candidate worktree is dirty, remove owned worktrees before non-force local branch deletion, and record attempted operations and truthful partial/final outcomes. H2 and the #258 finalization artifact remain immutable. Implementation is limited to the coordinator workflow source, architecture documentation, feature artifacts, and one compact table-driven PowerShell validation script.

## Technical Context

**Language/Version**: Markdown workflow instructions plus PowerShell 5.1-compatible focused validation; Git CLI behavior supplies repository and worktree evidence.

**Primary Dependencies**: Existing `.agents/skills/catworld-parallel-coordinator/SKILL.md`; existing sidecar run identity, final-merge evidence, and branch/worktree ownership contracts from issues #252, #254, #257, and #258; Git CLI commands including `git rev-parse --git-common-dir`, `git worktree list --porcelain`, `git status --porcelain`, `git worktree remove`, and non-force `git branch -d`.

**Storage**: One untracked local JSON journal per sidecar run beneath the Git common directory. No CatWorld database, Flyway migration, browser storage, API payload, remote branch, or tracked finalization artifact changes.

**Testing**: One feature-local PowerShell script with one shared temporary-Git fixture and table-driven cases for the seven explicitly approved cleanup scenarios; source/prohibited-operation checks; `git diff --check`.

**Target Platform**: Future activated CatWorld sidecar coordinator runs in a local Git repository; validation runs in the repository's supported PowerShell environment.

**Project Type**: CatWorld full-stack administration repository with repository-local Codex and Spec Kit workflow infrastructure; application runtime code is unaffected.

**Performance Goals**: N/A. No throughput or latency requirement is approved; the journal contains only one run's small local resource ledger and operation history.

**Constraints**: Keep cleanup coordinator-owned, explicitly authorized, and local-only; eligibility alone never triggers deletion; preserve H2 and `specs/032-final-coordinator-delivery/finalization.md`; create no H3/H4; use exactly the approved eight top-level journal fields; preflight all candidate worktrees before deletion; worktree removal precedes associated local branch deletion; no remote or GitHub mutation; one focused validation script; stop and report before continuing if implementation grows beyond a few thousand added lines or requires another validation script.

**Scale/Scope**: One sidecar run journal and its explicitly owned local branch/worktree set. Issue #260 owns full end-to-end and cross-workflow validation.

## Constitution Check

*GATE 1 result: passed. The active issue and user-approved local-journal decision resolve the only material operational decision before design.*

*GATE 2 result: passed. The design below applies the approved decision without introducing a framework, dependency, remote persistence, or tracked post-H2 commit.*

- **Domain focus and sustainable evolution**: Compliant/N/A. This is CatWorld repository workflow infrastructure and introduces no product-domain abstraction.
- **Layered monolith responsibilities**: Compliant/N/A. Backend application layering is unchanged.
- **Backend and database authority**: Compliant/N/A. No product rule, API, authorization rule, or database behavior changes.
- **Schema evolution**: Compliant/N/A. No database schema or Hibernate behavior changes.
- **Protected stay model**: Compliant/N/A. Stay data and invariants are unaffected.
- **Specification and planning discipline**: Compliant. The spec defines lifecycle gates, state-sensitive outcomes, exact exclusions, the local journal location/schema, and focused validation with no unresolved question.
- **Architecture and technology assessment**: Compliant. Assessment is required for the material operational evidence-location decision and is completed below using the user's explicit approval.
- **Focused changes and proportional validation**: Compliant. Changes are limited to sidecar cleanup instructions, architecture documentation, feature artifacts, and one compact fixture-driven script; #260 coverage remains excluded.
- **Operational safety and sources of truth**: Compliant. The journal is local and untracked, finalization history stays immutable, unknown or dirty state fails closed, and all remote/GitHub mutations remain prohibited.

Post-design re-check: compliant. The contract and data model keep the journal minimal, reuse current evidence instead of duplicating prior harnesses, and add no application, persistence, remote cleanup, or routing surface.

## Architecture and Technology Assessment

**Assessment required**: Yes. Durable post-H2 cleanup evidence and local deletion rules are a material operational decision in the shared sidecar coordinator lifecycle.

**Decision trigger**: material operational decision; significant shared workflow capability; correctness-sensitive destructive local operation.

**Options considered**:

- Existing platform/framework/project capability: Store one minimal JSON journal under the Git common directory resolved by `git rev-parse --git-common-dir`. This survives sidecar worktree/branch removal, stays outside tracked content, uses the existing run ID and resource ledger, and needs no service or new framework.
- Established library/framework/service: A database, remote artifact store, locking service, or workflow engine would add dependencies, persistence operations, and maintenance well beyond #259. It is not justified.
- Focused custom implementation: Mutating tracked coordinator artifacts after H2, writing cleanup evidence only to final reporting, or retaining a coordinator worktree as the artifact host were considered and explicitly rejected by the user. A large cleanup framework or standalone runtime subsystem would also exceed the approved scope.

**Selected approach**: Add a minimal local journal at `<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json`, with exactly the approved eight top-level fields. Cleanup requires an exact stable run ID and consumes the existing coordinator resource ledger plus the precise #258 final-PR/H2 evidence contract; the journal never creates ownership or merge evidence. The coordinator skill describes direct evidence checks, journal writes, and local Git cleanup commands; one feature-local script validates the contract in temporary repositories.

**Why selected**: It satisfies durable local evidence without changing H2, tracked files, local `main`, or remote state. It reuses existing Git and sidecar evidence, remains reviewable, and is the smallest design that can truthfully record partial cleanup after worktree removal.

**Confirmed medium-term use**: Issue #260 will consume this cleanup behavior in complete sidecar end-to-end validation, and #261 may activate the already approved sidecar route after build-out acceptance.

**Maintenance and operational consequences**: Maintainers must keep the coordinator cleanup procedure, architecture description, journal contract, and focused validation aligned. Journal contents are local operational evidence, not product data or a remotely synchronized source of truth. No locking or elaborate crash recovery is promised.

**Reversibility and migration path**: Low cost. The versioned local schema can be replaced or migrated by a later explicitly approved issue. Removing this mechanism requires only workflow/documentation changes and optional local journal cleanup; no database or remote migration exists.

**Human approval**: Approved explicitly by the user on 2026-07-11: use the minimal local cleanup journal at `<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json`, keep its schema minimal, preserve H2, and avoid options A/B/C and unapproved infrastructure.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. #258 temporarily kept post-H2 cleanup facts in current evidence/final reporting; #259 adds a local durable cleanup journal while preserving the final-delivery freeze.

**Old behavior/source of truth**: `.agents/skills/catworld-parallel-coordinator/SKILL.md` and `docs/ARCHITECTURE.md` make cleanup eligible after final merge but keep post-H2 eligibility external and contain no local cleanup execution steps.

**New mechanism semantics**: Current GitHub/repository evidence still decides eligibility and existing coordinator artifacts still prove resource ownership. The new journal records only cleanup eligibility/execution facts outside tracked worktrees; it does not replace GitHub merge evidence or the coordinator ownership contract.

**Mismatch risks**: Workflow text could accidentally imply the journal proves final merge or ownership by itself, write inside tracked content, mutate H2, delete unowned/dirty resources, delete a branch before its worktree, claim completion after a failure, or introduce remote cleanup.

**Mitigation**: Require independent current merge and ownership evidence, normalize the Git common directory, reject inconsistent state before mutation, preflight all worktrees, journal before/after attempts, use worktree-first/non-force branch order, and source-check prohibited operations and protected paths.

**Proof required**: The seven table-driven cases, journal top-level schema/path assertions, command-order and partial-result assertions, source/prohibited-operation review, protected-path scope review, and `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Unique same-run final-PR/H2/`main` merge eligibility and explicit-authority gate (TR-001, TR-014) | Coordinator workflow contract and table-driven simulation | Blocked-before/eligible-after cases plus source review that eligibility is not automatic deletion | Rerun after eligibility, evidence, or authority wording changes |
| Exact run ID, artifact-backed ownership, and clean-worktree preflight (TR-002–TR-003) | Coordinator workflow contract plus shared temporary Git fixture | Unknown-ownership and dirty-worktree cases | Rerun after ownership/cleanliness changes |
| Worktree-before-branch execution and truthful partial state (TR-004, TR-008) | Temporary Git fixture and local journal | Successful and injected partial-failure cases | Rerun after operation ordering or result logic changes |
| Journal path and eight-field schema (TR-005–TR-007) | Git common-directory fixture and JSON assertions | Path/schema/state assertions across table cases | Rerun after journal contract changes |
| H2/finalization immutability and prohibited operations (TR-009–TR-010) | Source map, coordinator cleanup section, Git diff | Protected-path and prohibited-pattern review | Rerun after any workflow/doc edit |
| Proportional #259 scope (TR-011–TR-013) | Changed-file/line-count review | One-script, fixture reuse, source-map, and #260-boundary review | Review before delivery; stop if threshold exceeded |

## Project Structure

### Documentation (this feature)

```text
specs/033-sidecar-local-cleanup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-cleanup-journal.md
├── checklists/
│   └── requirements.md
├── validation/
│   └── simulate-sidecar-cleanup.ps1
└── tasks.md
```

### Source Code (repository root)

```text
.agents/skills/catworld-parallel-coordinator/SKILL.md
docs/ARCHITECTURE.md
specs/033-sidecar-local-cleanup/
AGENTS.md  # temporary managed Spec Kit pointer only; restored before delivery
```

**Structure Decision**: Keep runtime behavior as executable coordinator-skill instructions and architecture source-of-truth text. Add no reusable runtime cleanup script or application module; use the single feature-local script only as focused validation.

## Complexity Tracking

No constitutional exception or additional complexity is required. If implementation requires more than one focused validation script, a generic subsystem, or more than a few thousand added lines, stop rather than justify expansion here.
