# Implementation Plan: Live Sidecar Dry Run

**Branch**: `chore/260-live-controlled-sidecar-dry-run` | **Date**: 2026-07-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/034-live-sidecar-dry-run/spec.md`

## Summary

Add one temporary routing-boundary exception for the exact controlled #260 fixture coordinator, correct the concrete launch-state circularity exposed by the first stopped live attempt with the explicitly approved two-phase held-dispatch barrier, then exercise the #250–#259 sidecar lifecycle with one coordinator, two independent first-layer children, and one child hard-dependent on both. Keep the #260 control/build-out checkout based on `origin/workflow/sidecar-buildout` separate from runtime coordinator and child worktrees based on `origin/main`. Commit and push an immutable corrected control-plane revision before reconciling the preserved runtime artifacts. Each first-layer child receives a canonical `sidecar-prepared-handoff-v1` identity fingerprint computed before evidence commits from immutable envelope inputs only; prepared artifact content is validated separately, and later evidence/recording heads are correlated separately. The child is dispatched once in preflight-only mode, remains unable to edit while factual launched evidence and a later activation record of its exact SHA are committed and pushed, and is released through the same stable child identity only after the targeted continuation incorporates the current activation head and verifies the launched evidence in ancestry. Stop at every user-owned merge checkpoint and preserve the historical failed attempt rather than rewriting it as passed.

## Technical Context

**Language/Version**: Markdown workflow and Spec Kit artifacts; Git 2.51.2.windows.1; PowerShell 7.5.8 with validation kept compatible with repository PowerShell conventions.

**Primary Dependencies**: Existing `AGENTS.md`, `docs/ARCHITECTURE.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, the focused #255 and #256 contracts/PowerShell simulations, remaining sidecar artifacts and validations under `specs/026-*` through `specs/033-*`, Git worktrees/refs, the connected GitHub issue/PR API, and the Codex stable named-subagent capability with targeted follow-up.

**Storage**: Tracked Markdown artifacts on the #260 build-out branch and fixture coordinator branch; one post-final-merge local cleanup journal beneath the repository Git common directory. No CatWorld database, Flyway, API payload, or browser storage change.

**Testing**: A harmless stable-agent capability proof; focused #255 dispatch-barrier and #256 child-release simulations covering success and failure states; live GitHub issue/branch/worktree/PR evidence at four mandatory checkpoints; other existing #250–#259 validation scripts where their fixtures remain applicable; direct run-specific Git/ref/ancestry/template/artifact checks for the live runtime; routing matrix review; PowerShell parsing; semantic cross-source audit; `git diff --check`.

**Target Platform**: The CatWorld GitHub repository and local Windows Git worktree environment. The #260 control context runs from `workflow/sidecar-buildout`; runtime fixture branches and final delivery use current `main`.

**Project Type**: CatWorld full-stack administration repository with repository-local Codex and Spec Kit workflow infrastructure; application runtime code is unaffected.

**Performance Goals**: N/A. The approved outcome is correctness of one small controlled run, not throughput or latency.

**Constraints**: One exact pre-#261 fixture exception; no general activation; no product code; no generic dispatch/state framework; no filesystem lock, queue, daemon, generic IPC, transaction abstraction, indefinite polling, or replacement-agent identity; no lifecycle duplication in the sequential skill; no merge, approval, auto-merge, rebase, force-push, history rewrite, remote cleanup, or unrelated GitHub mutation; four mandatory pauses; preserve every fixture resource and historical failure on defect; local `main` unchanged and clean.

**Scale/Scope**: One #260 build-out branch, one controlled coordinator issue, three controlled child issues, one coordinator branch/worktree, three child branches/worktrees across two dependency layers, three child PRs, one final runtime PR, one cleanup-eligibility journal, and one final #260 build-out PR.

## Constitution Check

*GATE 1 result: passed. The issue and attached user instructions resolve the temporary routing scope, fixture topology, bases, PR targets, merge ownership, validation vocabulary, defect handling, and delivery boundaries.*

*GATE 2 result: passed. The continuation prompt supplies explicit human approval for the smallest correction to the observed launch-state defect. The design reuses stable named-subagent dispatch and targeted continuation, changes only the bounded #255/#256/coordinator/child contract surfaces, and introduces no generic framework, product behavior, persistence mechanism, or unresolved decision.*

- **Domain focus and sustainable evolution**: Compliant/N/A. The work validates CatWorld repository workflow infrastructure and does not add product-domain abstractions.
- **Layered monolith responsibilities**: Compliant/N/A. Application layering is unchanged.
- **Backend and database authority**: Compliant/N/A. No business rule, authorization, API, or database behavior changes.
- **Schema evolution**: Compliant/N/A. No schema or Hibernate behavior changes.
- **Protected stay model**: Compliant/N/A. Stay data and invariants are unaffected.
- **Specification and planning discipline**: Compliant. The spec defines staged states, negative routing cases, exact Git/GitHub boundaries, validation freshness, failure behavior, and exclusions with no unresolved question.
- **Architecture and technology assessment**: Compliant. The temporary routing exception, live GitHub execution, and bounded two-phase child-dispatch barrier are assessed below and explicitly human-approved by the original and continuation #260 instructions.
- **Focused changes and proportional validation**: Compliant. The live run is the primary validation; code changes are limited to routing wording and evidence artifacts, with existing focused validations reused instead of duplicated.
- **Operational safety and sources of truth**: Compliant. Current GitHub/ref/ancestry evidence is authoritative, secrets are not introduced, local `main` is protected, destructive cleanup requires separate authority, and all user-owned merges remain outside Codex.

Post-design re-check: compliant. The contract preserves the general dormant route, runtime/control branch split, exact issue identity, factual `launched` meaning, current-evidence resume, H/H2 freeze, and cleanup authority. Held preflight and targeted continuation are bounded to child dispatch; no application, deployment, generic queue, lock, IPC, transaction, or persistence surface is added.

## Architecture and Technology Assessment

**Assessment required**: Yes. A pre-#261 exception and a live cross-branch GitHub workflow are correctness-sensitive shared operational decisions.

**Decision trigger**: material operational decision; significant shared workflow capability; correctness-sensitive Git/GitHub routing, child execution authority, and delivery.

**Options considered**:

- Existing platform/framework/project capability: Reuse the assembled #250–#259 sidecar skills, artifacts, Git worktree model, templates, validations, GitHub connector, and Codex named-subagent capability. `spawn_agent` returns a stable canonical task identity and `followup_task` targets that same identity after its preflight-only turn.
- Established library/framework/service: A workflow engine, orchestration service, filesystem lock, state database, queue, daemon, IPC service, or transaction framework would exceed the bounded dispatch problem and add new failure modes.
- Focused custom implementation: Define a two-phase barrier in existing coordinator/child contracts and extend only the #255/#256 simulations. A fire-and-forget child, a second unrelated subagent, or private-session-only launch bookkeeping cannot preserve the required identity and durable-state invariants.

**Selected approach**: Keep the current #260 build-out checkout as the governing/control context, preserve the five routing-source changes, and add a narrow two-phase barrier only to the coordinator skill, child skill, #255/#256 contracts and focused simulations, architecture, and #260 artifacts. Before any evidence commit, the coordinator computes canonical fingerprint `sidecar-prepared-handoff-v1` from the exact ordered run/issues, Git context, control revision, prepared paths, dependency, PR, state, and false-permission inputs using PowerShell ordered JSON and SHA-256. Artifact content is validated separately so an artifact that records the fingerprint never depends on its own blob. The coordinator then commits/pushes `handoff-ready` evidence, resolves that commit's SHA, and pushes one bounded recording update that stores it; dispatches a child with implementation/delivery false; accepts launch only from an unambiguous stable canonical child identity; commits/pushes factual `launched` evidence; resolves that SHA and pushes one bounded activation/recording update; then targets only that same identity with continuation. Evidence, recording/activation heads, fingerprint, and child identity remain separate fields. Current remote equality applies to each recording head, while ancestry proves it contains the corresponding earlier evidence commit. The child remains read-only in held preflight; targeted durable continuation may perform only the clean activation-head incorporation and verification before release acknowledgment enables implementation. This is explicitly not atomic, and no tracked commit is required to contain its own SHA.

**Why selected**: The harmless capability proof demonstrated one logical child can retain a stable canonical identity across a preflight-only turn and targeted continuation with zero repository actions. The barrier closes the observed circularity without redefining `launched`, adding a generic subsystem, or weakening any Git/GitHub safety gate.

**Confirmed medium-term use**: The evidence informs the explicit #261 activation decision. The exception itself is only for the single #260 fixture and does not become a reusable route.

**Maintenance and operational consequences**: Until the dry-run and #260 delivery complete, maintainers must keep exact fixture identity aligned across routing sources and evidence. The first correction `C1=a19af010dfe63eaf27b68717ce9b38042372f973` and its report head `C1r=0dd0e867cc52320875a1dd6c2928024f4e512c21` remain historical publication evidence but are superseded before runtime use by the fingerprint finding. Runtime resume requires a normally pushed/fetched superseding correction `C2` plus a later report-only recording head `C2r`; every runtime fingerprint and handoff records exact `C2`. Runtime worktrees still start from `origin/main`, so they consume the named control revision for workflow instructions without copying its build-out delta. On parent interruption, a held/unreleased child remains unable to edit; if the same canonical child identity cannot be verified on resume, the run stops rather than redispatching.

**Reversibility and migration path**: Low cost. #261 may replace the one-fixture exception with general controlled routing after acceptance. The barrier is localized to dispatch and may remain as a safety invariant; it does not require data migration or infrastructure teardown.

**Human approval**: The original #260 instructions approved the controlled fixture. The 2026-07-11 continuation explicitly approves the stable-identity two-phase dispatch barrier, directs the exact affected surfaces and failure semantics, and forbids another approval request for this bounded decision.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. One request that would ordinarily hit the dormant pre-#261 stop is temporarily routed into the existing executable sidecar lifecycle.

**Old behavior/source of truth**: `AGENTS.md`, the two sidecar skills, the sequential issue skill, and `docs/ARCHITECTURE.md` currently require all pre-#261 coordinator `parallel` requests to stop.

**New mechanism semantics**: The general stop remains. Only the exact coordinator issue number/URL recorded by #260, with an issue body explicitly declaring the controlled #260 fixture and current evidence passing all existing preflight gates, is a routing-authorized run. Prepared child handoffs from that run are likewise authorized. Title, branch prefix, or private context never establishes identity.

**Mismatch risks**: A broad phrase could activate ordinary coordinators, permit direct-child `parallel`, bypass #220–#234 exclusions, leave the child skill blocked, authorize arbitrary worktree operations, or let the five routing sources disagree.

**Mitigation**: Hard-record the exact fixture identity after issue creation; define one routing-authorized-run predicate; scope coordinator-with-open-child stopping to non-`parallel` requests; keep lifecycle text out of the sequential skill; authorize worktrees only for a routing-authorized run; validate positive and negative routes against current issue evidence.

**Proof required**: Exact-fixture positive route; missing-marker, wrong-number, duplicate/ambiguous-record, ordinary-coordinator, non-coordinator, direct-child, no-`parallel`, and #220–#234 negative cases; a zero-lifecycle-diff review for the sequential skill; unchanged legacy coordinator skill; existing final-delivery prohibited-operation scenario; `git diff --check`.

### Child-dispatch semantic correction

**Old behavior/source of truth**: The coordinator defined `launched` only after a prepared handoff was sent, while the child required the durable coordinator artifact to already record `launched` before any handoff validation. The focused #255/#256 simulations supplied launch state only in memory and did not prove the durable transition.

**New mechanism semantics**: Canonical identity fingerprint `sidecar-prepared-handoff-v1` is computed before `handoff-ready` evidence from exactly specified ordered inputs and excludes artifact content/blob hashes plus every not-yet-created evidence or recording SHA. Artifact content is validated independently. Exact `handoff-ready` evidence and a later remote recording head that stores and contains its SHA then precede dispatch and are correlated separately with that fingerprint. One stable child identity performs read-only preflight with implementation/delivery false. Successful dispatch makes `launched` factual, but the child stays held until exact launched evidence and a later activation/recording head that stores and contains its SHA are normally pushed and verified. Targeted continuation lets only that same child cleanly incorporate and verify the activation head before release acknowledgment enables prepared implementation. The extra recording commits solve commit-SHA self-reference only; the protocol remains a sequenced barrier, not an atomic transaction or state subsystem.

**Mismatch risks**: Preclaiming launch, allowing a held child to edit, releasing a different child identity, treating local unpushed state as durable, retrying an ambiguous dispatch, losing launch facts after release failure, or letting a third `Related to #260` line leak into child PR bodies.

**Mitigation and proof**: Exact stable identity correlation; pre/post worktree/blob checks; explicit permission fields; normal-push/fetched-ref gates; failure scenarios for rejected/ambiguous dispatch, launch push, child refresh/verification, and release; focused #255/#256 regressions; final cross-source search and semantic audit.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Exact #260 exception and preserved routing outcomes (TR-003–TR-004) | Five active routing sources plus current fixture issue evidence | Routing matrix, targeted source diff, `rg` review | Rerun after any routing wording or fixture identity change |
| Build-out/runtime base separation and unchanged local `main` (TR-001–TR-002, TR-010) | Git refs, worktree list, branch ancestry, local-main tree | Fetched SHA, merge-base/ancestry, conditional attached-worktree status or explicit no-main-worktree proof, clean run checkouts, artifact-path review | Recheck before every stage and after each remote refresh |
| Coordinator/child artifact and handoff readiness (TR-007, TR-009, TR-011) | Coordinator artifact plus prepared child specs/plans/tasks | Schema/content/source-map review and clean-state gate | Rerun after artifact or source-context changes |
| Two-phase child dispatch (TR-022–TR-025) | Coordinator/child skills, #255/#256 contracts and simulations, live stable child-agent identities | Canonical v1 ordered-payload recomputation; self-input exclusion; independent artifact-content validation; separate evidence/recording correlation; harmless capability proof; held zero-edit cases; behind-child preflight; remote equality plus evidence ancestry; failure matrix; targeted continuation | Rerun after any barrier wording, fingerprint input/serialization, simulation, artifact, source revision, or dispatch-state change |
| First-layer fan-out and child delivery (TR-005, TR-011–TR-012) | Live child agents, branches, worktrees, GitHub PRs | Commit/push results, PR URLs/targets/body/readiness, focused validation | Fresh at Mandatory Pause 1; later coordinator movement stales affected child evidence |
| Partial merge resume and active-child refresh (TR-013–TR-016) | Remote/local refs, ancestry, normal merge commit, child validation | Fetch/refresh transcript, ancestry proof, stale/fresh record | Collected only after current user merge report; stop at Mandatory Pause 2 |
| Dependent layer ordering (TR-005, TR-015) | Dependency ledger, coordinator ancestry, child handoff | Both prerequisite integration proofs and one dependent PR | Stop at Mandatory Pause 3 |
| H/H2 finalization and final PR (TR-016–TR-018) | Runtime coordinator artifact, Git refs, template, GitHub PR evidence | Complete H checks, direct-parent/sole-path proof, H2 reruns, remote equality, final PR URL | Re-fetch and recheck immediately before PR creation; stop at Mandatory Pause 4 |
| Post-merge cleanup eligibility and final #260 delivery (TR-019–TR-021) | GitHub merge evidence, local-main proof, cleanup journal, #260 build-out diff | Journal schema/state, issue validation, `git diff --check`, build-out PR URL | Perform only after user reports final runtime merge; no destructive cleanup without separate authority |

## Project Structure

### Documentation (this feature)

```text
specs/034-live-sidecar-dry-run/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── controlled-sidecar-dry-run.md
├── checklists/
│   └── requirements.md
├── dry-run-report.md
└── tasks.md
```

### Source Code (repository root)

```text
AGENTS.md
.agents/skills/catworld-implement-issue/SKILL.md
.agents/skills/catworld-parallel-coordinator/SKILL.md
.agents/skills/catworld-parallel-child-implementation/SKILL.md
docs/ARCHITECTURE.md
specs/029-dependency-layer-fanout/contracts/dependency-layer-fanout.md
specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1
specs/030-sidecar-child-execution/contracts/sidecar-child-execution.md
specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1
specs/034-live-sidecar-dry-run/

<runtime coordinator worktree>/
├── specs/<fixture-coordinator>-coordinator-<slug>/
├── specs/<first-child>-<slug>/
│   └── samples/result.md
├── specs/<second-child>-<slug>/
│   └── samples/result.md
└── specs/<dependent-child>-<slug>/
    └── samples/result.md
```

**Structure Decision**: Keep the #260 control/build-out checkout on its own branch for routing, corrected dispatch contracts, focused #255/#256 validation, and accepted evidence. Create all live coordinator/child artifacts and harmless fixture changes only in isolated runtime worktrees based on current `origin/main`. Do not copy the build-out delta into the runtime branch; handoffs identify the immutable pushed control-plane SHA as governing context and the runtime path as execution context.

## Complexity Tracking

No constitutional exception or generic framework is required. The added complexity is one bounded two-phase dispatch barrier implemented through the existing stable named-subagent and targeted-follow-up capability. The three-child topology remains the minimum approved topology that demonstrates held first-layer fan-out, partial merge with an active-child refresh, and a hard-dependent next layer.
