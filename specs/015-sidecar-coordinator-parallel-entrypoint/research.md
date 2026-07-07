# Research: Sidecar Coordinator Parallel Entrypoint

No unresolved researchable unknowns remain.

## Decision: Create a separate repo-local sidecar coordinator skill

**Rationale**: Issue #220 defines the sidecar workflow as a separate area and recommends sidecar skills such as `.agents/skills/catworld-parallel-coordinator/SKILL.md`. Issue #226 specifically asks for an independent coordinator entrypoint and excludes changes to existing normal implementation and coordinator/orchestration workflows.

**Alternatives considered**:

- Update `.agents/skills/catworld-implement-issue/SKILL.md`: rejected because #226 says not to change the existing normal implementation workflow and #220 says the sidecar workflow should exist beside it.
- Update `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`: rejected because #226 says not to change existing coordinator/orchestration workflows in this issue.
- Put the entrypoint only in documentation: rejected because #226 asks for a workflow entrypoint, not only routing documentation.

## Decision: Limit the new entrypoint to preflight and routing boundaries

**Rationale**: Issue #226 requires safe preflight, valid/invalid routing identification, source-of-truth review, dependency classification, and incomplete-context stops. It explicitly excludes child artifact generation, Git branch/worktree operations, PR creation, and product code changes. Later issues #227 through #234 own the missing sidecar execution pieces and adoption dry-run.

**Alternatives considered**:

- Implement child artifact or Git execution now: rejected because those surfaces are out of scope for #226.
- Delegate child issue implementation from this entrypoint now: rejected because the sidecar child implementation skill and Git/PR rules are scheduled for later child issues.

## Decision: Preserve existing workflow files unchanged

**Rationale**: The active issue and parent epic require the sidecar entrypoint to be additive. Existing sequential and coordinator/orchestration skills remain sources of truth for their current workflows.

**Alternatives considered**:

- Align existing skills immediately with the new sidecar skill: rejected because that would broaden #226 beyond the entrypoint and risk changing preserved workflows.

## Decision: Use a contract artifact for the entrypoint boundary

**Rationale**: The entrypoint is a repo-local workflow interface rather than an application API. A small contract file gives task generation and validation a stable checklist for trigger inputs, preflight outputs, stop conditions, and prohibited side effects without inventing product behavior.

**Alternatives considered**:

- Skip contracts entirely: rejected because this issue creates a workflow interface with correctness-sensitive routing behavior.
- Create formal API schemas: rejected because there is no runtime API, persistence model, or external system contract.
