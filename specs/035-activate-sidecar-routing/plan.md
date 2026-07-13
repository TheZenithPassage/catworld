# Implementation Plan: Activate Controlled Sidecar Routing

**Branch**: `chore/261-activate-controlled-sidecar-parallel-routing` | **Date**: 2026-07-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/035-activate-sidecar-routing/spec.md`

## Summary

Activate the already implemented and accepted sidecar coordinator workflow as a controlled explicit opt-in route for safe coordinator `parallel` requests. Replace the temporary #260/#272 fixture gate in active repository sources with the general safe-preflight predicate, preserve the exact eight-outcome routing matrix and #220-#234 exclusion, keep the sequential implementation skill limited to routing-boundary wording, update the one regression assertion that still requires dormancy, and leave `specs/034-live-sidecar-dry-run/` unchanged as historical evidence.

## Technical Context

**Language/Version**: Markdown workflow instructions and contracts; PowerShell validators compatible with the repository-prescribed Windows PowerShell 5.1 and PowerShell 7.5.x shells; Git command-line checks.

**Primary Dependencies**: Existing `AGENTS.md`, repository-local CatWorld and Spec Kit skills, `docs/ARCHITECTURE.md`, GitHub issue/PR templates, the accepted sidecar contracts and validators under `specs/026-*` through `specs/033-*`, Git, `rg`, Windows PowerShell, and PowerShell 7. No new package, library, service, or runtime dependency is introduced.

**Storage**: N/A for application data. The feature changes tracked repository workflow Markdown and one existing PowerShell regression assertion; there is no database, Flyway, API payload, browser storage, external data store, or runtime sidecar journal change.

**Testing**: Manual eight-row routing matrix against active sources; existing #252-#259 PowerShell regression scenarios on their prescribed shells; updated #258 prohibited-operation activation assertion; required stale-wording search; focused sequential-skill diff review; historical-path and changed-surface review; `git diff --check`.

**Target Platform**: CatWorld's repository-local Codex workflow on Windows, coordinated with GitHub issue and pull-request state. CatWorld application runtime and deployment targets are unaffected.

**Project Type**: CatWorld full-stack administration repository; this feature affects repository workflow infrastructure and source-of-truth documentation only.

**Performance Goals**: N/A. Issue #261 defines correctness and routing outcomes, not throughput or latency targets.

**Constraints**: Sidecar remains explicit opt-in and fail-closed; normal issues, direct child issues, and closed-child coordinator final passes remain sequential; #220-#234 remain excluded; the sequential skill receives routing-boundary changes only; `specs/034-live-sidecar-dry-run/` is immutable historical evidence; no product behavior, live dry-run, merge, cleanup, branch deletion, or issue mutation is allowed.

**Scale/Scope**: Eight routing outcomes across the active repository instructions, three routing/execution skills, one issue-generation skill, architecture documentation, coordinator/PR template guidance, and the one current sidecar regression assertion affected by activation.

## Constitution Check

*GATE 1: evaluated before Phase 0 research. GATE 2: re-evaluated after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. This is bounded CatWorld repository workflow governance and introduces no product, cross-species, multi-tenant, or speculative platform behavior.
- **Layered monolith responsibilities**: Pass. Controllers, services, repositories, DTOs, mappers, and database code are untouched.
- **Backend and database authority**: Pass. No product business rule, authorization rule, calculation, or persisted integrity contract changes.
- **Schema evolution**: Pass. No schema or Flyway migration is involved.
- **Protected stay model**: Pass. Stay status and invariants are unaffected.
- **Specification and planning discipline**: Pass. The specification defines all eight routing outcomes, unsafe-context behavior, exclusions, historical boundaries, validation evidence, and delivery constraints without unresolved questions.
- **Architecture and technology assessment**: Pass. The correctness-sensitive shared workflow decision is significant, but the selected sidecar design was explicitly approved through issue #260 and merged PR #280; the user's #261 request explicitly approves its general controlled activation. This plan does not alter that design or select a new dependency or mechanism.
- **Focused changes and proportional validation**: Pass. The source map is limited to active workflow authorities, one affected regression assertion, and #261 artifacts; validation covers the complete route matrix and the existing executable sidecar lifecycle.
- **Operational safety and sources of truth**: Pass. Active routing authorities become coherent, unsafe preflight remains fail-closed, accepted dry-run history remains immutable, and no live runtime resources, secrets, real data, GitHub issues, or cleanup state are changed.

Post-design re-check: Still compliant. The routing contract delegates lifecycle internals to the existing sidecar coordinator skill, the data-model review is non-applicable, the quickstart uses existing validators, and no new architecture or operational mechanism is introduced.

## Architecture and Technology Assessment

**Assessment required**: Yes. General activation is a correctness-sensitive shared operational workflow boundary, even though the underlying mechanism is already implemented and accepted.

**Decision trigger**: significant shared workflow capability; material operational routing decision; correctness-sensitive Git/GitHub execution authority.

**Options considered**:

- Existing platform/framework/project capability: Activate the assembled #252-#260 sidecar coordinator/child skills, artifact contracts, Git/worktree safety rules, templates, and validators behind the explicit safe-preflight route. This exactly matches the accepted evidence and adds no dependency.
- Established library/framework/service: A workflow engine, queue, orchestration service, state database, daemon, lock service, or other new infrastructure is unnecessary for a routing-source activation and would expand risk, maintenance, and lock-in.
- Focused custom implementation: Reimplementing or copying lifecycle logic into `AGENTS.md` or the sequential skill would create drift and violate the issue boundary. A focused wording update plus the existing sidecar entrypoint is sufficient.

**Selected approach**: Use existing project capability. Replace the temporary active fixture predicate with the general explicit-coordinator/safe-preflight predicate; route outward to the existing sidecar coordinator skill; keep all sidecar lifecycle internals in the sidecar skills; align active docs/templates and the affected #258 assertion.

**Why selected**: It is the smallest reversible change that activates the exact workflow accepted through #260 while preserving sequential defaults, fail-closed safety, current validators, and source ownership.

**Confirmed medium-term use**: Controlled explicit coordinator `parallel` work in CatWorld v1.2, as specified by issue #261 and parent epic #249.

**Maintenance and operational consequences**: Maintainers must keep routing predicates aligned across repository instructions, sidecar skills, architecture docs, and coordinator templates. Preflight remains authoritative; unsafe or ambiguous state stops. The change adds no service to operate or dependency to upgrade.

**Reversibility and migration path**: Low cost. A later reviewed workflow issue can disable or refine the active route by updating the same authorities. No application data or infrastructure migration is required.

**Human approval**: Approved. The user explicitly states that #260 was reviewed, accepted, and merged through PR #280, and explicitly requests #261 activation with the exact routing matrix and safety boundary. This plan preserves rather than changes the accepted approach.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. Active routing changes from a one-fixture pre-activation gate to the approved general controlled route while all non-eligible outcomes must remain equivalent.

**Old behavior/source of truth**: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `docs/ARCHITECTURE.md`, and coordinator template guidance currently admit only the exact #260/#272 fixture before #261 and describe other coordinator `parallel` requests as future or inactive.

**New mechanism semantics**: An explicit `parallel` request for a clearly identified coordinator outside #220-#234 enters the existing sidecar coordinator preflight. Safe preflight authorizes the existing lifecycle; unsafe, ambiguous, stale, incomplete, or contradictory context stops with an explicit blocker. All other routing rows remain unchanged.

**Mismatch risks**: The activation could accidentally make parallel default, permit non-coordinator/direct-child parallel requests, bypass preflight, route #220-#234, send coordinator requests without `parallel` into sidecar, leave fixture-only gates active, or duplicate sidecar internals in the sequential skill.

**Mitigation**: Define one contract matrix; use `AGENTS.md` as the top-level router; keep the sequential skill as an outward boundary only; define authorization and blockers in the sidecar coordinator skill; align child/template/architecture wording; update the stale #258 assertion; inspect the focused sequential diff.

**Proof required**: Eight-row routing review across active authorities, #220-#234 and ambiguity guardrail review, all applicable #252-#259 regressions, required stale-wording search, sequential-skill diff review, historical-path/source-map review, and whitespace validation.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Eight routing outcomes and explicit opt-in default (TR-001, TR-002) | `AGENTS.md`, sequential routing boundary, sidecar coordinator boundary | Manual matrix against [active-sidecar-routing.md](contracts/active-sidecar-routing.md) | Rerun after every routing-source edit |
| Safe-preflight authorization and unsafe-context blocker (TR-001, TR-003) | Sidecar coordinator skill and architecture source | Source review plus existing #252-#258 focused simulations | Rerun all applicable scenarios after any coordinator/child wording or assertion edit |
| Direct-child prepared-handoff boundary (TR-001, TR-006) | Sidecar child skill | Source review plus #253-#257 scenarios | Rerun after child-skill edits |
| Sequential workflow isolation (TR-004) | `catworld-implement-issue` | Base-relative focused diff and semantic review | Diff must contain routing-boundary wording only; review again after late edits |
| Stale/future/fixture wording (TR-003, TR-005, TR-006) | Active instructions, skills, architecture, and `.github` templates | Required `rg` search plus broader #261/fixture probe | Every remaining active match must be current or explicitly historical |
| Historical #260 evidence and #220-#234 exclusion (TR-007) | Git changed-path review and active routing sources | `git diff --name-only`/path assertion plus matrix review | `specs/034-live-sidecar-dry-run/` must have zero changed paths |
| Prohibited operations and no product scope (TR-009) | #258/#259 validators and source map | `prohibited-operations`, cleanup simulation, changed-path review | Simulations use temporary fixtures only; no real cleanup is performed |
| Branch base and ready PR contract (TR-010) | Git ancestry and GitHub PR metadata | Exact base SHA/ancestry check and post-create connector read | Re-read after push/PR creation; PR must target `workflow/sidecar-buildout` and use `Related to #261` |
| Whitespace and final scoped delta (TR-008) | Git | `git diff --check`, status, diff summary | Rerun after the last relevant edit and after staging |

## Project Structure

### Documentation (this feature)

```text
specs/035-activate-sidecar-routing/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── active-sidecar-routing.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
AGENTS.md
.agents/skills/
├── catworld-implement-issue/SKILL.md
├── catworld-parallel-coordinator/SKILL.md
├── catworld-parallel-child-implementation/SKILL.md
└── speckit-taskstoissues/SKILL.md
.github/
├── ISSUE_TEMPLATE/coordinator-parallel-planning.md
└── PULL_REQUEST_TEMPLATE/README.md
docs/ARCHITECTURE.md
specs/032-final-coordinator-delivery/validation/
└── simulate-final-coordinator-delivery.ps1
```

**Structure Decision**: Update only active workflow routing authorities, template guidance, and the existing #258 assertion whose dormant-gate expectation becomes invalid. Add #261 planning/contract artifacts under `specs/035-*`. Do not change product code, historical `specs/034-*` evidence, legacy coordinator orchestration, or older issue-scoped design documents.

## Complexity Tracking

No constitution exception or additional complexity is required. The plan reuses the accepted sidecar workflow and existing validation infrastructure.
