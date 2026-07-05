# Feature Specification: Coordinator Issue Orchestration Skill

**Feature Branch**: `chore/202-add-coordinator-issue-orchestration-skill`

**Created**: 2026-07-05

**Input**: GitHub issue #202, "[Workflow] Add coordinator issue orchestration skill"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes

- **TO-001**: CatWorld has a repo-local coordinator issue orchestration skill that tells Codex how to inspect a coordinator issue, its child issues, any referenced parent epic, and current `origin/main` before deciding execution order.
  - **Why this priority**: Coordinator issues are not intended to be implemented directly as one large PR, so Codex needs a separate workflow before it can safely coordinate child work.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator issue with one hard-dependent child issue, **When** the new skill is reviewed, **Then** it defines how to detect the coordinator issue, classify the hard dependency, delegate only ready concrete child implementation through `.agents/skills/catworld-implement-issue/SKILL.md`, and stop when a human merge into `main` is required before the next dependent child can continue.
    2. **Given** a coordinator issue with four independent child issues and explicit parallel mode, **When** the new skill is reviewed, **Then** it allows parallel execution only for independent or dependency-ready child issues, requires isolated execution environments, assigns exactly one child issue per sub-agent, and requires every sub-agent to use the existing single-issue implementation skill.
    3. **Given** a coordinator issue where one child issue should establish a shared pattern first, **When** the new skill is reviewed, **Then** it prevents blind parallelization and requires seed-first, sequential, or stop behavior unless the shared decision is already resolved by approved scope or current sources of truth.
    4. **Given** parallel mode is selected but isolated execution is unavailable, **When** the new skill is reviewed, **Then** it requires Codex to stop and report that parallel execution cannot run safely.
  - **Validation Evidence**: Manual workflow review against the issue scenarios and `git diff --check`.

- **TO-002**: Existing CatWorld agent instructions route coordinator issues to the new coordinator skill while preserving the existing single-issue implementation skill as the implementation path for normal issues and concrete child issues.
  - **Why this priority**: The new orchestration layer must not replace or duplicate the already approved single-issue workflow.
  - **Acceptance Scenarios**:
    1. **Given** a normal single GitHub issue, **When** `AGENTS.md` and the implementation skill are reviewed, **Then** they still direct Codex to use `.agents/skills/catworld-implement-issue/SKILL.md` for end-to-end single-issue implementation.
    2. **Given** a coordinator issue that lists child issues or execution waves, **When** `AGENTS.md` and the implementation skill are reviewed, **Then** they direct Codex to the coordinator orchestration skill instead of implementing the coordinator issue as one bundled PR.
  - **Validation Evidence**: Manual instruction review against the normal-single-issue validation scenario.

- **TO-003**: The workflow documentation preserves existing safety boundaries by referencing authoritative rules instead of restating or weakening them.
  - **Why this priority**: Coordinator orchestration can involve sub-agents, multiple branches, and multiple PRs, so it must inherit existing repository safety constraints without creating a second source of truth.
  - **Acceptance Scenarios**:
    1. **Given** the new and updated workflow files, **When** they are reviewed, **Then** no instruction allows direct commits to `main`, local merges into `main`, direct pushes to `main`, PR merge, auto-merge, force-push without explicit user request, branch cleanup, branch deletion, remote pruning, public GitHub comments, unapproved GitHub issue mutation, unresolved-decision guessing by sub-agents, or blind parallelization of hard-dependent child issues.
  - **Validation Evidence**: Manual safety-rule scan plus `git diff --check`.

### Edge Cases

- A coordinator-like issue cannot be classified because child issues cannot be found or read: the coordinator skill must stop and report the blocker.
- A referenced parent epic cannot be read: the coordinator skill must stop when the epic is required to understand dependencies, shared contracts, or scope.
- Child issues have a hard dependency on unmerged work: sequential mode must stop after the ready child PR and wait for human merge before continuing dependent work.
- Child issues are logically independent but likely touch the same contracts, migrations, services, DTOs, tests, components, or shared files: the coordinator skill must classify this as conflict risk and avoid unsafe parallelization.
- Multiple child issues need the same missing shared contract: the coordinator skill must select a seed child first, continue sequentially when the shared decision is already resolved, or stop and report that a separate shared-contract issue is needed.
- Parallel mode is requested without isolated execution environments: the coordinator skill must stop and report that parallel execution cannot run safely.
- The issue is a normal single concrete issue rather than a coordinator issue: the existing single-issue implementation skill remains the correct workflow.

## Requirements *(mandatory)*

### Technical Requirements

- **TR-001**: The repository MUST add `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` as a repo-local skill for coordinator issue orchestration.
- **TR-002**: The coordinator skill MUST define when it applies, including coordinator issues, issues that say not to implement directly as one large PR, issues listing child or sub-issues, issues defining waves, dependency order, or parallel execution, and issues that mainly coordinate smaller implementation issues.
- **TR-003**: The coordinator skill MUST require Codex to inspect the full coordinator issue, all linked child issues, any referenced parent epic, and current `origin/main` before selecting execution mode or delegating work.
- **TR-004**: The coordinator skill MUST classify child relationships as hard dependency, recommended order, conflict risk, independent, or optional follow-up, with testable definitions for each classification.
- **TR-005**: Sequential mode MUST be the safe default, select only the first ready child issue, implement only that child issue through `.agents/skills/catworld-implement-issue/SKILL.md`, keep one child issue per PR by default, stop when human merge is required, and continue only when the next child is independent of unmerged work or its dependency is already merged into `main`.
- **TR-006**: Parallel mode MUST run only when explicitly selected by the caller, use isolated execution environments, parallelize only independent or dependency-ready child issues, never parallelize hard-dependent child issues, assign exactly one child issue per sub-agent, and require every sub-agent to use `.agents/skills/catworld-implement-issue/SKILL.md`.
- **TR-007**: The coordinator skill MUST prevent separate agents from inventing competing shared contracts and MUST require seed-first, sequential, or stop behavior when multiple child issues need the same missing shared contract.
- **TR-008**: The coordinator skill MUST define the minimum context passed to each sub-agent, including child issue number and body, coordinator issue number and relevant body, parent epic when relevant, dependency assumptions, known shared contracts, out-of-scope boundaries, required validation, and final report expectations.
- **TR-009**: The coordinator skill MUST state that sub-agents are implementation executors, not product or architecture decision makers, and must stop on ambiguity, missing context, unresolved decisions, non-mechanical conflicts, or scope mismatch.
- **TR-010**: The coordinator skill MUST reference `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md` as authoritative for implementation work and existing Git safety rules instead of duplicating the full safety rule set.
- **TR-011**: `AGENTS.md` MUST reference when the coordinator skill should be used, while preserving the existing end-to-end single-issue implementation instruction.
- **TR-012**: `.agents/skills/catworld-implement-issue/SKILL.md` MUST remain the workflow for normal concrete issues and child issue implementation, and MUST route coordinator issues to the new coordinator skill rather than bundling coordinator work into one PR by default.
- **TR-013**: The change MUST NOT add shorthand prompt routing, change backend behavior, frontend behavior, product behavior, database behavior, `.specify/memory/constitution.md`, or Spec Kit agent-context scripts.
- **TR-014**: Validation MUST include manual review against the five issue-specified scenarios and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature MUST remain documentation/workflow-only.

### Out of Scope

- Prompt shorthand routing such as interpreting `148` or `148 parallel`.
- Backend implementation changes.
- Frontend implementation changes.
- Product behavior changes.
- Database behavior changes.
- Changes to `.specify/memory/constitution.md`.
- Changes to Spec Kit agent-context scripts unless a direct contradiction is discovered.
- Automatic GitHub issue mutation.
- Automatic PR merge or auto-merge.
- Branch cleanup, branch deletion, remote pruning, force-push workflows, direct commits to `main`, local merges into `main`, or direct pushes to `main`.
- Replacing the existing single-issue implementation skill.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` exists and covers coordinator detection, dependency classification, sequential mode, parallel mode, shared-contract handling, sub-agent handoff, and final reporting.
- **SC-002**: `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md` preserve the existing single-issue workflow and route coordinator issues to the coordinator orchestration skill.
- **SC-003**: Manual review confirms the workflow handles a hard-dependent coordinator, four independent children, a shared-pattern seed child, unavailable isolation for parallel mode, and a normal single issue.
- **SC-004**: Manual safety review confirms no changed instruction allows the prohibited Git, GitHub, decision-making, or blind-parallelization behaviors listed in issue #202 validation.
- **SC-005**: `git diff --check` reports no whitespace errors.

## Assumptions

- No product or application runtime behavior changes are required because issue #202 explicitly limits the work to documentation and workflow instructions.
