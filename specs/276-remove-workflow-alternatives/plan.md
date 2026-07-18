# Implementation Plan: Remove Workflow Alternatives

**Branch**: `chore/302-remove-alternate-implementation-workflows` | **Date**: 2026-07-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/276-remove-workflow-alternatives/spec.md`

## Summary

Reduce CatWorld's repository-local implementation machinery to the already existing `catworld-implement-issue` workflow and the six Spec Kit phases it invokes. Simplify routing and retained workflow instructions first, prune hook and template-resolution fallbacks from retained support, then delete all exact alternate-workflow paths, update manifests and architecture documentation, and validate the final dependency closure and protected surfaces before one normal PR to `main`.

## Technical Context

**Language/Version**: Markdown, JSON, YAML, and PowerShell 7.5.8 repository support files; Spec Kit metadata version 0.11.9

**Primary Dependencies**: Git 2.51.2, ripgrep 15.1.0, PowerShell scripts under `.specify/scripts/powershell`, and the repository-local Codex skill format

**Storage**: N/A. No domain entities, persistence, API payloads, schema, browser storage, or external data contracts change.

**Testing**: Repository path and content audits using `git diff --check`, `git diff --name-only`, `git status --short`, `rg`, PowerShell directory/path checks, JSON manifest parsing, SHA-256 verification, and retained setup-script smoke checks

**Target Platform**: CatWorld's GitHub repository and repository-aware Codex execution environment on Windows/PowerShell; product runtime and deployment targets are unaffected

**Project Type**: CatWorld full-stack web administration repository; this feature is limited to repository instructions and implementation-workflow support

**Performance Goals**: N/A. Issue #302 defines structural pass/fail outcomes rather than runtime performance targets.

**Constraints**: One atomic cleanup branch and PR; exactly one user-facing workflow and six internal phases; no replacement orchestration or dormant compatibility; exact literal deletions; protected product, dependency, migration, test, and CI surfaces remain unchanged; no history rewrite, merge, issue mutation, worktree cleanup, branch deletion, or remote pruning

**Scale/Scope**: Reduce 15 top-level skill directories to exactly 7; remove all 50 existing issue-listed deletion targets; retain the single new `specs/276-remove-workflow-alternatives` artifact directory

## Constitution Check

*GATE 1 result: PASS. The specification is complete, the deletion and retention contracts are explicit, and there are no researchable unknowns or unresolved material product decisions.*

*GATE 2 result: PASS. Issue #302 explicitly approves the single-workflow approach, exact retained closure, deletion inventory, protected surfaces, and delivery boundary. The plan does not select a different approach.*

- **Domain focus and sustainable evolution**: PASS. The change is confined to CatWorld repository tooling, removes speculative orchestration, and adds no platform or cross-species abstraction.
- **Layered monolith responsibilities**: PASS — unaffected. No controller, service, repository, DTO, mapper, or database code changes.
- **Backend and database authority**: PASS — unaffected. No product rule, authorization, validation, or calculation changes.
- **Schema evolution**: PASS — N/A. No schema or Flyway change.
- **Protected stay model**: PASS — unaffected. Stay behavior and invariants are outside scope.
- **Specification and planning discipline**: PASS. The spec states objective outcomes, exact boundaries, edge cases, protected surfaces, validation evidence, and no unresolved question.
- **Architecture and technology assessment**: PASS. The cross-cutting repository-workflow decision is assessed below and is explicitly human-approved by issue #302.
- **Focused changes and proportional validation**: PASS. Changes are limited to workflow instructions/support, exact workflow-only artifacts, manifests, and one named documentation block; changed-path and retained-reference audits guard scope.
- **Operational safety and sources of truth**: PASS. No secrets, credentials, production data, deployment, backup, or recovery behavior changes; active repository sources of truth are simplified and product sources remain protected.

## Architecture and Technology Assessment

**Assessment required**: Yes. Collapsing repository-wide implementation routing and deleting costly accumulated workflow machinery is a significant cross-cutting source-of-truth decision with meaningful migration/removal cost.

**Decision trigger**: significant shared capability; significant cross-cutting concern; meaningful replacement or migration cost

**Options considered**:

- Existing platform/framework/project capability: Retain the established `catworld-implement-issue` skill and its six invoked Spec Kit phases, pruning their unused hook/template extension branches. This exactly fits the approved one-issue, one-branch, one-PR requirement without a new dependency or abstraction.
- Established library/framework/service: Not selected. Replacing repository-local routing with another service or framework would add an unrequested dependency and violate the issue's prohibition on replacement workflow abstractions.
- Focused custom implementation: Not selected. A new custom orchestrator, compatibility layer, dormant fallback, or mode shim would reproduce the complexity being removed and is explicitly forbidden by issue #302.

**Selected approach**: Use the existing single CatWorld workflow and six internal phase skills as the complete dependency closure; delete every alternative executor and support path; simplify retained support to core templates only.

**Why selected**: It is the smallest correct design for the confirmed repository need, directly implements issue #302, preserves normal delivery safety, and removes rather than migrates unsupported alternatives.

**Confirmed medium-term use**: Every concrete CatWorld issue implementation continues through `catworld-implement-issue`; the six Spec Kit phases remain internal steps of that workflow.

**Maintenance and operational consequences**: Maintainers have one routing source in `AGENTS.md`, one end-to-end workflow skill, six internal phases, core PowerShell/template support, and two accurate manifests. Sidecar resumption, coordinator fan-out, hook dispatch, preset/extension template composition, and specialized child/final delivery are no longer available.

**Reversibility and migration path**: Removed content remains recoverable from Git history, but any future workflow expansion requires a new explicit specification and approved architecture decision rather than a dormant compatibility path.

**Human approval**: Approved. GitHub issue #302, supplied as the implementation contract by the user, explicitly selects this approach, lists the exact retained and deleted surfaces, rejects replacement abstractions, and remains applicable without modification.

## Semantic Equivalence and Replacement Review

**Review required**: No. No UI primitive, product interaction, data/contract mechanism, authorization mechanism, persistence mechanism, or presentation mechanism is replaced. Alternate repository workflows are intentionally removed rather than behavior-preservingly migrated.

**Old behavior/source of truth**: N/A for semantic equivalence. Existing workflow sources are deletion targets; issue #302 defines the new supported behavior.

**New mechanism semantics**: N/A. The already existing normal implementation workflow remains and is narrowed to its approved core behavior.

**Mismatch risks**: N/A for product semantics. Repository-closure risks are handled by explicit routing, reference, path, manifest, and protected-surface validation.

**Mitigation**: N/A beyond the Validation Evidence Plan.

**Proof required**: N/A for UI/product equivalence; repository structural proof is required below.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Single issue-reference route and no mode/coordinator semantics (TR-001–TR-003) | `AGENTS.md` and `catworld-implement-issue/SKILL.md` | Focused diff review plus stale-term `rg` audit | Rerun after every retained-instruction edit |
| Exactly seven retained skills and no hook/extension fallback (TR-004–TR-008) | `.agents/skills` and retained `.specify` scripts | Top-level directory listing, path absence checks, and targeted reference search | Rerun after all deletions and late cleanup |
| Core template resolution and setup-script viability (TR-005–TR-007) | Six phase skills and four retained PowerShell scripts | Static reference review plus `setup-plan.ps1 -Json`, `setup-tasks.ps1 -Json`, and prerequisite smoke checks against the active feature | Rerun if retained skills, scripts, templates, or feature state change |
| Accurate retained integration inventories (TR-007) | Two `.specify/integrations/*.manifest.json` files | Parse JSON; assert every entry exists and its lowercase SHA-256 matches current file bytes | Run after all retained-file edits and hash updates |
| Exact alternate-workflow assets absent (TR-008–TR-011) | Repository tree | Literal `Test-Path` audit against issue inventory and `git status --short` | Run after deletions; do not use numeric-prefix wildcards |
| No stale active workflow reference (TR-012) | Whole retained repository | Required case-insensitive `rg` search with individual hit classification | Rerun after the latest relevant content edit |
| Product, dependency, migration, test, and CI surfaces preserved (TR-010, TR-013) | Git changed-path set and architecture document | `git diff --name-only`, `git status --short`, protected-prefix rejection, and focused documentation diff review | Run immediately before commit and compare final branch to `origin/main` after commit |
| Whitespace and patch integrity (TR-014) | Git diff | `git diff --check` before commit and `git diff origin/main...HEAD --check` after commit | Final evidence must postdate all content changes |
| Normal branch/PR delivery only (TR-015) | Git and GitHub | Branch, commit, normal push, ready/draft PR metadata, and checkout verification | Collect after validation; do not merge or perform hygiene |

## Project Structure

### Documentation (this feature)

```text
specs/276-remove-workflow-alternatives/
├── checklists/
│   └── requirements.md
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

No `contracts/` directory is required because this internal repository cleanup changes no public API, command schema, data contract, or product interface.

### Source Map (repository root)

```text
AGENTS.md                                           # simplify to one issue route
.agents/skills/
├── catworld-implement-issue/SKILL.md              # retain normal workflow only
├── speckit-{specify,plan,tasks,analyze,implement,converge}/SKILL.md
│                                                   # remove hooks/dangling optional paths
└── [8 exact workflow/optional skill directories]  # delete

.specify/
├── init-options.json                              # retain
├── integration.json                               # retain
├── integrations/*.manifest.json                   # prune and refresh hashes
├── memory/constitution.md                          # retain
├── scripts/powershell/{common,check-prerequisites,setup-plan,setup-tasks}.ps1
│                                                   # retain; core-only resolution
├── templates/{spec,plan,tasks}-template.md         # retain
└── [workflows, extensions, optional assets]        # exact deletion targets

.github/
├── ISSUE_TEMPLATE/                                 # delete 2 exact workflow templates
└── PULL_REQUEST_TEMPLATE/                          # delete 3 exact workflow templates

docs/ARCHITECTURE.md                                # remove only lines 526–1771 block

specs/
├── 008-coordinator-orchestration-skill/            # literal deletion
├── 011-* through 035-* issue-listed directories   # exact deletions
├── 148-coordinator-.../                            # exact deletion
├── 272-* through 275-* issue-listed directories   # exact deletions
├── 008-creator-attribution/                        # preserve collision
├── 196-*, 197-*, 198-*                            # preserve product specs
└── 276-remove-workflow-alternatives/               # retain this feature
```

**Structure Decision**: Edit only the retained routing/support sources named above, delete literal issue-listed paths, and retain the current product source tree untouched. `docs/ARCHITECTURE.md` is modified surgically at the heading boundaries. Template resolution in `common.ps1` becomes core-only because no override, preset, or extension directory belongs to the approved closure; unused composition code is removed instead of retained as a dormant fallback. The current `AGENTS.md` has no `SPECKIT START`/`SPECKIT END` markers, so planning does not add an active-plan pointer that issue #302 explicitly removes from the future workflow.

## Complexity Tracking

No constitutional violation or added complexity requires justification. The plan removes alternate execution mechanisms and introduces no new module, dependency, abstraction, or compatibility layer.
