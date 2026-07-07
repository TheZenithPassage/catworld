# Implementation Plan: Sidecar Validation Reporting

**Branch**: `chore/231-add-sidecar-validation-blocker-and-conflict-reporting` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/020-sidecar-validation-reporting/spec.md`

## Summary

Extend the opt-in sidecar coordinator workflow with explicit validation,
blocker, conflict, stale-evidence, and readiness reporting rules. The
implementation will update sidecar coordinator and child workflow instructions,
architecture documentation, and local validation sample reports so sidecar
children and coordinator integration branches record commands run, failed,
skipped, stale, and not run; distinguish child-specific, coordinator-wide,
shared-contract, conflict, and human-only blockers; keep issue mutation and
public comments behind explicit user approval; and preserve normal sequential
reporting unchanged.

## Technical Context

**Language/Version**: Java 17 with Spring Boot 4.0.2 and Angular 21.2.x /
TypeScript 5.9.x exist in the repository, but this feature changes
repository-local Codex workflow instructions, documentation, generated Spec Kit
artifacts, and local Markdown validation samples only.

**Primary Dependencies**: Existing repo-local Codex skills under
`.agents/skills/`, especially
`.agents/skills/catworld-parallel-coordinator/SKILL.md` and
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`; `AGENTS.md`
repository operation guardrails; `docs/ARCHITECTURE.md` Codex workflow routing
documentation; completed sidecar issues #227, #228, #229, and #230; parent
epic #220.

**Storage**: N/A for CatWorld runtime persistence. The feature defines
repository workflow reporting guidance and local validation samples only; it
does not change domain entities, database schema, browser storage, API
payloads, or external service contracts.

**Testing**: Local sample reports for success, failure, stale validation,
blocker, conflict, human-only blocker, and closed-child coordinator final-pass
cases; text checks for explicit validation statuses, draft/ready readiness,
blocker categories, user-guidance conflict wording, GitHub issue mutation
approval, public comment approval, and normal sequential reporting boundaries;
changed-file review confirming normal sequential workflow reports are not
rewritten; `git diff --check`.

**Target Platform**: Codex sessions and maintainers consuming CatWorld
repository-local workflow skills, architecture documentation, and Spec Kit
artifacts.

**Project Type**: CatWorld full-stack web administration system with
repository-local Codex/Spec Kit workflow infrastructure.

**Performance Goals**: N/A. No runtime performance behavior changes.

**Constraints**: Apply validation, blocker, and conflict reporting rules only
to the sidecar coordinator parallel workflow; failed, timed-out, skipped,
interrupted, partial, stale, and not-run validation must not be summarized as
passed; stale validation after relevant branch updates must be rerun or
reported as stale; child PR readiness is ready only with fresh required
validation and no unresolved blockers; shared-contract and coordinator-wide
blockers stop affected sidecar work; non-trivial conflicts affecting contract,
scope, persistence, security, authorization, UX, or domain behavior require
user guidance; human-only blocker categories stop for human decision; GitHub
issue body, checklist, label, assignee, milestone, state, and public comment
mutations require explicit user approval; normal sequential reports and
closed-child coordinator final-pass reporting remain unchanged.

**Scale/Scope**: Workflow-source changes to the sidecar coordinator skill,
sidecar child implementation skill, `docs/ARCHITECTURE.md`, and generated
feature artifacts plus local sample reports for issue #231. No CatWorld product
code, runtime configuration, migration, backend, frontend, live pull request
operation, GitHub issue mutation, public comment, or normal sequential
workflow implementation changes.

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
  technical outcomes, state-sensitive reporting cases, blocker categories,
  scope boundaries, edge cases, out-of-scope behavior, dependencies, and no
  unresolved open questions. The selected sidecar-only reporting rules are
  specified by issue #231 and parent epic #220.
- **Architecture and technology assessment**: Assessment required because
  validation, blocker, conflict, and readiness reporting rules are a material
  operational workflow decision and shared sidecar execution/delivery
  capability. The assessment below references the human-authored issue
  contracts from #220 and #231 plus completed sidecar decisions from #227-#230.
- **Focused changes and proportional validation**: Compliant. Planned changes
  are limited to workflow instructions, documentation, local validation samples,
  and feature artifacts; validation uses local samples, text checks,
  changed-file review, and whitespace validation proportional to non-runtime
  operational workflow scope.
- **Operational safety and sources of truth**: Compliant. No secrets, real
  data, deployment exposure, backup, recovery, or production operation changes.
  The plan explicitly keeps GitHub issue mutation and public comments behind
  explicit user approval while preserving repository workflow sources of truth.

Post-design re-check: compliant. Phase 1 artifacts confirm no runtime data
model, API, persistence, authorization, UI, migration, or product behavior
changes. The selected sidecar reporting contract records only workflow and
sample-report obligations and remains within the approved sidecar workflow from
#220 and #227-#231.

## Architecture and Technology Assessment

**Assessment required**: Yes. Sidecar validation, blocker, conflict, stale
evidence, and readiness reporting are a material operational decision for the
future parallel workflow and a shared capability used by coordinator and child
sidecar paths.

**Decision trigger**: significant shared capability; material operational
decision; significant cross-cutting workflow concern; non-trivial correctness
responsibility for reporting validation truthfully; meaningful replacement risk
if the rules changed normal sequential issue delivery.

**Options considered**:

- Existing platform/framework/project capability: Extend the existing sidecar
  workflow skills and `docs/ARCHITECTURE.md` with explicit reporting rules, and
  add feature-local Markdown sample reports for validation. This fits #231,
  uses existing source-of-truth locations, and keeps normal sequential workflow
  delivery unchanged.
- Established library/framework/service: N/A. No external reporting service,
  workflow engine, or dependency is needed for repository-local Codex skill
  instructions and Markdown validation samples.
- Focused custom implementation: Add scripts or automation to generate reports,
  collect validation, or mutate GitHub issues. Rejected because #231 defines
  workflow reporting rules and local samples, while GitHub issue mutation and
  public comments require explicit user approval and normal sequential
  reporting must remain unchanged.

**Selected approach**: Extend
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and
`docs/ARCHITECTURE.md` with the approved sidecar validation, blocker, conflict,
stale-evidence, readiness, and human-only blocker rules. Add
`specs/020-sidecar-validation-reporting/samples/` Markdown reports as local
validation evidence. Do not add report-generation scripts, dependencies,
product code, issue mutations, public comments, or normal sequential report
changes.

**Why selected**: The approach directly satisfies #231, preserves the isolated
sidecar architecture from #220 and the existing sidecar artifacts/Git/PR
contracts from #227-#230, and remains reversible because it is
documentation/skill text plus local samples rather than executable automation.

**Confirmed medium-term use**: Supports later #220 child issues for resumable
state tracking and cleanup policy (#232), explicit split handoff alignment
(#233), and controlled dry-run/adoption gate (#234).

**Maintenance and operational consequences**: Maintainers must keep sidecar
coordinator skill, child implementation skill, architecture docs, and sample
reports aligned. Future sidecar execution must enforce explicit validation
status, freshness, readiness, blocker, conflict, and human-only decision
reporting before any child PR or final coordinator PR is described as ready.

**Reversibility and migration path**: Low to moderate cost. The rules can be
revised or moved into a future dedicated sidecar reporting/delivery skill
before adoption, while normal sequential workflow remains unaffected because
this feature does not change `.agents/skills/catworld-implement-issue/SKILL.md`
or add executable automation.

**Human approval**: Approved by the active issue contract and prior
issue-scoped decisions. Issue #220 defines sidecar operational guardrails,
issues #227-#230 establish the sidecar artifact, child handoff, Git, and PR
surfaces, and issue #231 explicitly approves adding these sidecar validation,
blocker, conflict, and reporting rules.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. This feature adds sidecar reporting rules that must
not replace or alter normal sequential validation/final reporting, direct child
issue delivery outside `parallel`, or closed-child coordinator final-pass
reporting.

**Old behavior/source of truth**: `AGENTS.md`,
`.agents/skills/catworld-implement-issue/SKILL.md`,
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, and issues #220 and #227-#231.

**New mechanism semantics**: Sidecar child and coordinator reports record
required validation evidence with explicit statuses and freshness; distinguish
child-specific, coordinator-wide, shared-contract, conflict, and human-only
blockers; mark child PR readiness as ready or draft based on fresh evidence and
unresolved blockers; and require user guidance for material conflicts and
human-only blocker categories. Normal sequential reports remain unchanged.

**Mismatch risks**: The wording could accidentally imply failed validation can
be summarized as passed, stale validation can support readiness, child-specific
blockers block unrelated children, shared-contract blockers may be bypassed,
Codex may resolve material conflicts or human-only decisions, GitHub issue
mutation/public comments are allowed without explicit approval, normal
sequential reporting has changed, or closed-child coordinator final passes
should present closed child issue scope as newly implemented work.

**Mitigation**: Encode explicit sidecar-only boundaries, status vocabulary,
freshness rules, readiness rules, blocker categories, conflict stop rules,
human-only blocker categories, mutation approval rules, and normal workflow
exclusions in sidecar skills and architecture documentation. Keep the normal
sequential implementation skill unchanged.

**Proof required**: Local sample reports, text searches for required and
prohibited reporting wording, manual review against #220 operational
guardrails, changed-file scope review, explicit diff review showing
`.agents/skills/catworld-implement-issue/SKILL.md` is unchanged, and
`git diff --check`.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Sidecar reports list commands/reviews/artifacts with explicit statuses and never summarize non-passed validation as passed (TR-001-TR-003, TR-013) | Sidecar skills, architecture docs, local samples | Sample success/failure reports and text review | Rerun after validation wording changes |
| Stale validation after branch updates or relevant changes is marked stale or rerun (TR-004, TR-013) | Sidecar skills, architecture docs, local stale sample | Sample stale report and text review | Rerun after freshness wording changes |
| Child PR readiness distinguishes ready versus draft based on fresh validation and blockers (TR-005) | Sidecar coordinator/child skills, local samples | Ready/draft sample review and text review | Rerun after readiness wording changes |
| Child-specific, coordinator-wide, shared-contract, conflict, and human-only blocker reporting (TR-006-TR-009, TR-014) | Sidecar skills, architecture docs, local blocker/conflict samples | Sample blocker, conflict, and human-only reports; manual issue review | Rerun after blocker/conflict wording changes |
| GitHub issue mutation and public comments require explicit user approval (TR-010) | Sidecar skills, architecture docs, samples | Text checks and manual approval-boundary review | Rerun after mutation or public-comment wording changes |
| Normal sequential reporting and closed-child coordinator final-pass reporting remain unchanged (TR-011, TR-012, TR-015) | Sidecar skills, docs, normal workflow scope review | Local final-pass sample, text review, changed-file review | Rerun before final report |
| Required validation scope and issue alignment (TR-013-TR-016) | Quickstart, samples, fetched issue bodies, git diff | Local sample files, manual review against #220, `git diff --check` | Rerun after final edits |

## Project Structure

### Documentation (this feature)

```text
specs/020-sidecar-validation-reporting/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidecar-validation-reporting.md
├── samples/
│   ├── sidecar-success-report.md
│   ├── sidecar-failure-report.md
│   ├── sidecar-stale-validation-report.md
│   ├── sidecar-blocker-report.md
│   ├── sidecar-conflict-report.md
│   ├── sidecar-human-only-blocker-report.md
│   └── coordinator-final-pass-report.md
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
workflow source of truth, and add local validation sample reports under the
feature artifact directory. Do not touch backend, frontend, migrations,
operations, Git automation scripts, PR automation, GitHub issue state, public
comments, `.agents/skills/catworld-implement-issue/SKILL.md`, or
`.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.

## Complexity Tracking

No constitution exception is required. The shared operational workflow
reporting rules are explicitly requested by #231, are isolated to the sidecar
workflow surface approved by #220 and #227-#230, and preserve normal sequential
validation/reporting behavior.
