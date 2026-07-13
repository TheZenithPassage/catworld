# Implementation Plan: Final Coordinator Validation and PR Delivery

**Branch**: `chore/258-implement-final-coordinator-validation-pr-delivery` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/032-final-coordinator-delivery/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Complete the dormant sidecar coordinator lifecycle after all child work is
integrated. The implementation extends the existing coordinator skill,
architecture source of truth, final coordinator PR template, and feature-local
validation artifacts with an executable all-child terminal-state gate, fresh
integrated validation bound to the coordinator HEAD, integrated diff review,
ready-only final PR delivery from the coordinator branch to `main`, unique-PR
handling, an approved two-head finalization sequence, and factual final-delivery
reporting while cleanup remains ineligible pending the runtime final PR merge.

## Technical Context

**Language/Version**: Markdown workflow and Spec Kit artifact sources, with
PowerShell validation scripts and Git CLI simulations. Repository runtime
evidence remains Java 17 with Spring Boot 4.0.2 and Angular 21.2/TypeScript
5.9.2, but application runtimes are not affected by this feature.

**Primary Dependencies**: Existing CatWorld sidecar coordinator skill, sidecar
artifact/resume contracts, repository PR templates, `docs/ARCHITECTURE.md`,
PowerShell, Git CLI, `rg`, the connected GitHub delivery surface described by
the workflow, and `git diff --check`. No new runtime or external dependency is
introduced.

**Storage**: N/A for application storage. Structured state remains in the
existing coordinator artifact and GitHub PR evidence; there are no domain
entities, database tables, Flyway migrations, API payloads, or browser storage
changes.

**Testing**: A feature-local PowerShell harness with table-driven state checks,
temporary Git repositories for merged-child ancestry, `H`/`H2` direct-parent
and artifact-only delta evidence, validation freshness and scope-diff evidence,
actual final/child template rendering, a current-implementation finalization
artifact verifier, prohibited-operation review, changed-file/source-map review,
and `git diff --check`.

**Target Platform**: CatWorld Codex workflow instructions consumed by future
implementation agents and maintainers after sidecar routing activation.

**Project Type**: CatWorld full-stack web administration system; this feature
affects repository workflow infrastructure only.

**Performance Goals**: N/A. No application or workflow throughput target is
approved or required.

**Constraints**: Preserve the #261 activation gate and normal sequential
workflow; re-read current evidence; treat child workflow state and coordinator
ancestry—not GitHub issue open/closed state—as integration proof; stop unless
all prepared children are integrated and none is active, blocked, pending,
dependency-incomplete, missing, duplicate, or unexpected; preserve prior
validation attempts while recording exactly one current readiness result per
requirement and evaluated coordinator state; preserve the canonical `passed`,
`failed`, `skipped`, `timed out`,
`interrupted`, `partial`, `stale`, `blocked`, and `not run` statuses; open no
draft fallback when final readiness fails; fetch current `origin/main` without
updating local `main` and inspect the PR-equivalent merge-base diff for
unrelated scope for the future runtime contract; run complete integrated
validation at `H`; commit only the factual finalization artifact as direct child
`H2`; prove ancestry and the sole allowed delta; rerun every artifact-affected
check at `H2`; push H2 normally and verify the remote coordinator source ref is
exactly H2; create at most one ready final PR from the coordinator branch to
`main`; use closing keywords only there; do not
merge, approve, enable auto-merge, mutate issues separately, launch another
child layer after final validation starts, perform cleanup, rebase, force-push,
or rewrite history. Runtime cleanup remains `ineligible` with reason
`pending final PR merge`. This #258 build-out branch instead uses fetched
`origin/workflow/sidecar-buildout` as base/freshness/merge-base reference,
targets `workflow/sidecar-buildout`, and uses `Related to #258`; that temporary
delivery boundary must not replace future sidecar coordinator-to-`main`
behavior.

**Scale/Scope**: Limited to
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`docs/ARCHITECTURE.md`, the final coordinator PR template and template README,
and focused artifacts under `specs/032-final-coordinator-delivery/`. The
parallel child skill, normal sequential implementation skill, legacy
coordinator orchestration skill, routing activation, cleanup implementation,
application code, real sidecar PR merges, and GitHub issue state are outside
the implementation source map.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The change is limited to
  CatWorld repository workflow infrastructure and introduces no product,
  cross-species, multi-tenant, platform, or installation-specific claim.
- **Layered monolith responsibilities**: Pass. Controllers, services,
  repositories, DTOs, mappers, and database behavior are unaffected.
- **Backend and database authority**: Pass. No business rule, authorization,
  calculation, validation, or integrity behavior moves into client-only logic.
- **Schema evolution**: Pass. No schema or Flyway change exists.
- **Protected stay model**: Pass. Stay status and invariants are unaffected.
- **Specification and planning discipline**: Pass. The specification defines
  objective workflow outcomes, state gates, exhaustive validation statuses,
  failure behavior, source/target and issue-reference contracts, scope limits,
  edge cases, and no unresolved open questions.
- **Architecture and technology assessment**: Pass. Final sidecar delivery is a
  significant shared and correctness-sensitive Git/GitHub workflow capability;
  the assessment below records the issue-approved extension of existing skills,
  templates, artifact state, and local simulation patterns.
- **Focused changes and proportional validation**: Pass. The source map is
  narrow, while temporary Git ancestry/freshness/diff simulations and template
  contract tests match the operational risk.
- **Operational safety and sources of truth**: Pass. Current GitHub and
  repository evidence remain authoritative; the design prohibits issue
  mutation, PR merge/approval/auto-merge, history rewriting, cleanup, secrets,
  real data, and deployment changes.

Post-design re-check: Still compliant. The contract and quickstart retain the
#261 activation gate, use established sidecar artifact and validation models,
apply the human-approved two-head sequence, separate this build-out PR from
future final coordinator delivery, and add no product code, persistence,
external service, or unapproved framework.

## Architecture and Technology Assessment

**Assessment required**: Yes. Executable final coordinator validation and PR
delivery are a significant shared sidecar capability and a material,
correctness-sensitive Git/GitHub operational decision.

**Decision trigger**: significant shared capability; significant cross-cutting
workflow concern; material operational decision; correctness-sensitive
integration, validation-freshness, diff-scope, and PR-delivery responsibility.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar
  coordinator skill, architecture documentation, coordinator artifact state,
  PR templates, and established PowerShell/Git simulation pattern. This matches
  #258 and keeps the capability reviewable in current repository sources.
- Established library/framework/service: Add a workflow engine, GitHub Action,
  bot, queue, or external state service. This exceeds #258, introduces new
  credentials and operational ownership, and is premature before activation.
- Focused custom implementation: Add a repository-local executable finalizer
  command. It could be useful after adoption, but would duplicate current skill
  contracts and create a new command surface without a confirmed need.

**Selected approach**: Extend the existing coordinator skill and architecture
source text, enrich the existing final PR template/README, add a #258 contract
and quickstart, and validate behavior through one focused PowerShell harness
using temporary Git fixtures and in-memory GitHub/PR models. Finalization uses
two heads: complete validation at integrated head `H`, followed by direct child
`H2` containing only the factual finalization artifact. The workflow proves
the parent and sole-path delta, reruns all artifact-affected checks at `H2`, and
pushes H2 normally with remote-source verification before delivery. It does not
create another branch commit to record the PR URL.

**Why selected**: This is the smallest approach that makes lifecycle states 16
and 17 executable, reuses approved #230/#231/#232/#252/#257 contracts, resolves
the branch-bound artifact freshness cycle without an `H3`/`H4` loop, avoids
live GitHub mutation during tests, and remains easy to revise before or after
#261 activation.

**Confirmed medium-term use**: Completes the final validation and delivery
boundary required by parent epic #249 and provides the prerequisite behavior
for #259 cleanup eligibility, #260 end-to-end validation, and #261 activation.

**Maintenance and operational consequences**: Maintainers must keep the
coordinator skill, architecture text, final template, artifact fields, and
validation vocabulary aligned. Final readiness remains conservative: current
base/head ancestry, complete validation at `H`, sole-artifact delta and affected
reruns at `H2`, clean scope, unique PR identity, and current GitHub state must
agree before creation or an allowed update, and the remote coordinator ref must
equal H2 after a normal non-force push. The artifact uses `SELF/HEAD` to
identify `H2`; its resolved SHA is reported after commit because a commit cannot
embed its own literal SHA without creating a prohibited additional commit.

**Reversibility and migration path**: Low to moderate cost. Markdown contracts,
templates, and the local simulation can be revised by later approved sidecar
issues or replaced by a dedicated executable helper without application-data
migration. Normal sequential workflow remains isolated.

**Human approval**: Approved explicitly by the user on 2026-07-10 after the
branch-bound artifact freshness cycle was identified. The approval requires the
two-head `H`/`H2` sequence, complete-check versus artifact-affected-check
reporting, direct-parent and sole-artifact delta proof, no `H3`/`H4` loop, base
and head rechecks, and strict separation between the current #258 build-out base
and the future runtime sidecar base. This approval supplements the active issue
#258 contract and still-applicable decisions from #249, #230, #231, #232, #252,
and #257. No materially different option may be substituted without fresh
human approval.

## Branch Context and Two-Head Delivery Decision

| Context | Base and Freshness Reference | Head/Target | Issue Wording |
|---------|------------------------------|-------------|---------------|
| Current #258 build-out delivery | Fetched `origin/workflow/sidecar-buildout` (`B`) | `chore/258-implement-final-coordinator-validation-pr-delivery` at `H2` -> `workflow/sidecar-buildout` | `Related to #258` only |
| Future activated sidecar runtime | Fetched `origin/main` runtime target-base SHA | Coordinator branch at runtime `H2` -> `main` | Final coordinator closing keywords allowed |

For the current #258 delivery:

1. Fetch and record `B = origin/workflow/sidecar-buildout` before final
   validation. If it advanced from the branch's starting reference, refresh the
   #258 branch only by allowed normal non-history-rewriting integration, stop on
   non-mechanical conflicts, and rerun affected checks.
2. Finish all implementation and documentation work, restore the temporary
   `AGENTS.md` pointer, commit that complete implementation as `H`, and execute
   the complete required implementation validation at exactly `H`.
3. Create direct child `H2` containing only
   `specs/032-final-coordinator-delivery/finalization.md`. That artifact records
   literal `B`, literal `H`, `H2` as `SELF/HEAD`, expected parent `H`, the sole
   allowed delta path, complete checks run at `H`, artifact-affected commands to
   rerun at `H2`, readiness `pending H2 checks`, scope result from `H`, required
   post-H2 scope/base rechecks, final template blob identity, complete render-
   input requirements, and
   the applicability rationale for unaffected `H` evidence. Resolved H2 status,
   final scope/readiness, and rendered-body fingerprint stay external.
4. Prove `H2^ = H`, prove `H..H2` changes only the finalization artifact, and
   rerun the H2 artifact schema/evidence check plus every check affected by the
   delta, including `git diff --check`. Do not claim the full suite ran at `H2`
   unless it actually did.
5. Push H2 normally to the #258 remote work branch, fetch that ref, and verify
   it equals H2. A rejected push or mismatch blocks without force or history
   rewriting.
6. Fetch `origin/workflow/sidecar-buildout` again and recheck `B`, merge base,
   ancestry, local and remote `HEAD = H2`, validation freshness, and existing
   #258 PR evidence. Any movement or inconsistency that affects evidence stops
   delivery; do not create H3 to refresh after this gate.
7. Open the #258 PR to `workflow/sidecar-buildout` with `Related to #258`.
   Report the GitHub-returned URL without writing it back to the branch. No
   H3/H4 finalization commit is allowed.

The future runtime workflow uses the same two-head correctness shape, but its
base is freshly fetched `origin/main`, its source is the coordinator branch,
its target is `main`, and its final PR alone may use closing keywords. The
runtime contract never substitutes `workflow/sidecar-buildout` for `main`.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, lightweight. The feature turns generic lifecycle
states and final-PR guidance into an executable finalization procedure while
preserving existing sidecar and sequential boundaries.

**Old behavior/source of truth**: `AGENTS.md`,
`.agents/skills/catworld-implement-issue/SKILL.md`,
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, `.github/PULL_REQUEST_TEMPLATE/*`, and sidecar
contracts from specs 019, 020, 025, 026, 030, and 031.

**New mechanism semantics**: A finalizing coordinator re-reads evidence,
proves every prepared child PR is present in refreshed coordinator ancestry,
rejects every non-terminal child state, freezes new-layer progression, preserves
historical validation while recording one current result per requirement/state,
runs complete integrated validation at `H`, commits only the factual artifact as
direct child `H2`, proves the sole-path delta, reruns artifact-affected checks,
pushes H2 normally and verifies the remote coordinator ref,
reviews the merge-base diff against fetched `origin/main`, renders the final
template, detects an existing same-run PR, and creates one ready
coordinator-to-`main` PR only when every gate passes.

**Mismatch risks**: Wording could treat open child issues as incomplete or
closed issues as integrated, consume stale child validation, omit `blocked`,
allow a draft fallback, open duplicate PRs, use closing keywords in child or
build-out PRs, target the wrong base, mark cleanup eligible before merge,
claim `H` checks ran at `H2`, accept a non-artifact `H..H2` delta, create an
`H3` URL-recording loop, or change sequential/routing/cleanup behavior.

**Mitigation**: Require ancestry and durable workflow-state proof; canonical
status mapping; one current readiness result per requirement/state while prior
attempts remain historical; complete checks at `H`; direct-parent and
sole-artifact proof plus affected reruns at `H2`; ready-only/no-PR failure
behavior; explicit template/source/base checks; same-run PR detection;
post-open GitHub evidence/final reporting without an `H3`; unchanged #261,
sequential, child, and cleanup boundaries; and source-map assertions.

**Proof required**: Feature-local temporary Git and state simulations, actual
template rendering, prohibited-operation searches, unchanged sequential/child
skill checks, changed-file/source-map review, and fresh `git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Complete child accounting and integration ancestry (TR-001–TR-005, SC-001) | Coordinator skill, artifact contract, temporary Git fixture | `all-integrated`, `incomplete-children`, and `evidence-mismatch` simulations | Rerun after child-state, ancestry, or evidence wording/script changes |
| Required integrated command accounting and canonical statuses (TR-006–TR-011, SC-002–SC-003) | Coordinator skill and #258 validation model | `integrated-validation`, `validation-readiness`, and `validation-staleness` simulations | Bind complete evidence to `H`; preserve history and rerun affected checks after relevant changes |
| Two-head ancestry, artifact-only delta, complete canonical H/H2 manifests, split validation, remote-source verification, and no self-reference loop (TR-010, TR-018, SC-006) | Coordinator skill, artifact contract, temporary Git fixture, current-delivery verifier | `two-head-finalization` simulation and `verify-finalization-evidence.ps1` | Complete checks run at `H`; artifact-affected checks rerun at `H2`; verifier rejects omitted canonical IDs; H2 is pushed normally and remote ref verified; resolved H2 SHA/statuses reported externally |
| Integrated coordinator scope review and target-base freshness (TR-012, SC-004) | Coordinator/child source maps and Git diff | `scope-drift` temporary Git simulation plus changed-file review | Re-fetch/recheck target base and merge base immediately before delivery |
| Final PR source, target, template, traceability, closing isolation, unique identity, and ready-only gating (TR-013–TR-017, SC-005) | Coordinator skill and actual PR templates | `final-pr-delivery`, `existing-final-pr`, and `closing-keyword-isolation` simulations | Re-render templates after template or delivery wording changes |
| Factual final-delivery artifact/report state and cleanup ineligible pending merge (TR-018, SC-006) | Coordinator artifact and final report contract | `artifact-final-state` simulation | Do not introduce an H3; re-read GitHub PR evidence for observed URL/state |
| Prohibited operations and non-sidecar boundaries (TR-019, SC-007) | Coordinator skill, architecture docs, unchanged sequential/child/legacy skills | `prohibited-operations` and source-map review | Rerun after workflow source changes |
| Markdown and PowerShell whitespace health (TR-020, SC-008) | Git diff | `git diff --check` | Run after final relevant edits |

## Project Structure

### Documentation (this feature)

```text
specs/032-final-coordinator-delivery/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── final-coordinator-delivery.md
├── checklists/
│   └── requirements.md
├── validation/
│   ├── simulate-final-coordinator-delivery.ps1
│   └── verify-finalization-evidence.ps1
├── tasks.md
└── finalization.md       # Created only in H2 for current #258 delivery
```

### Source Code (repository root)

```text
.agents/
└── skills/
    └── catworld-parallel-coordinator/
        └── SKILL.md
.github/
└── PULL_REQUEST_TEMPLATE/
    ├── README.md
    └── sidecar-final-coordinator-to-main.md
docs/
└── ARCHITECTURE.md
specs/
└── 032-final-coordinator-delivery/
    ├── contracts/
    ├── quickstart.md
    └── validation/
        ├── simulate-final-coordinator-delivery.ps1
        └── verify-finalization-evidence.ps1
```

**Structure Decision**: Extend the existing sidecar coordinator source of
truth and final template, with the #258 contract, focused validation harness,
and current-delivery H2 evidence verifier. The H2-only `finalization.md` is
created by the delivery workflow after complete validation at H. Do not modify
the sequential implementation skill, parallel child
skill, legacy coordinator skill, routing activation, cleanup implementation,
application code, or GitHub issue state.

## Complexity Tracking

| Complexity | Why Needed | Simpler Alternative Rejected Because | Constitution Compliance |
|------------|------------|-------------------------------------|-------------------------|

No constitutionally relevant new complexity is introduced beyond the
issue-approved final sidecar coordinator capability. The implementation reuses
existing workflow sources, templates, state concepts, and local simulation
patterns without adding a framework, service, dependency, or product runtime.
