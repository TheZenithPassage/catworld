# Feature Specification: Dormant Coordinator Routing

**Feature Branch**: `chore/250-keep-legacy-coordinator-orchestration-dormant`

**Created**: 2026-07-08

**Input**: GitHub issue #250, "[Workflow] Keep legacy coordinator orchestration dormant during sidecar build-out"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Active CatWorld routing and workflow guidance no longer tells Codex to use the dormant legacy coordinator orchestration skill for real coordinator execution.
  - **Why this priority**: The sidecar coordinator model is being built under #249, and active routing must not invoke a conflicting legacy coordinator flow during that build-out.
  - **Acceptance Scenarios**:
    1. **Given** an active routing or workflow source that describes coordinator execution, **When** a maintainer reviews the source, **Then** it does not route real coordinator execution to `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
    2. **Given** a remaining reference to `catworld-orchestrate-coordinator-issue`, **When** a maintainer reviews its surrounding text, **Then** the reference is dormant, historical, or explicitly non-routing.
  - **Validation Evidence**: Required search command review and manual routing review.

- **TO-002**: Current sequential issue implementation remains the default active path while sidecar parallel work is incomplete.
  - **Why this priority**: Normal issues, direct child issues, and coordinator final passes must continue to use the existing sequential `catworld-implement-issue` workflow.
  - **Acceptance Scenarios**:
    1. **Given** a normal implementable issue or direct child issue, **When** active routing guidance is reviewed, **Then** it still points to `catworld-implement-issue`.
    2. **Given** a coordinator issue without a valid activated sidecar parallel request, **When** active routing guidance is reviewed, **Then** existing open-child and closed-child guardrails remain in force.
  - **Validation Evidence**: Manual routing review against `AGENTS.md` and active CatWorld workflow skills.

- **TO-003**: Sidecar parallel guidance remains opt-in future-facing and does not activate real product use before #261.
  - **Why this priority**: This issue must align active instructions with the sidecar-only model without enabling coordinator-parallel execution prematurely.
  - **Acceptance Scenarios**:
    1. **Given** explicit eligible `#<coordinator> parallel` guidance, **When** active sources are reviewed, **Then** they state that routing will use the sidecar coordinator workflow only after #261 activates it.
    2. **Given** sidecar child guidance, **When** active sources are reviewed, **Then** child agents are not instructed to invent shared contracts, plan product behavior, run automatic seed-first behavior, or make child PRs close child issues.
  - **Validation Evidence**: Required search command review and manual sidecar contradiction review.

### Edge Cases

- Active sources may contain historical or dormant references to the legacy orchestrate skill; those references are acceptable only when they cannot route real coordinator execution.
- The dormant legacy orchestrate skill itself may still contain old workflow text; this feature must not edit, stub, rewrite, reactivate, or delete that file without explicit user approval.
- Search terms such as `seed` or `parallel mode` may appear in valid contexts; the validation review must distinguish acceptable dormant or non-routing references from active instructions.
- Sidecar child implementation guidance may mention child issues and PRs, but it must not tell child PRs in a coordinator-parallel run to close issues; final coordinator PR guidance may close the coordinator issue and included child issues through closing keywords.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Active routing sources MUST NOT instruct Codex to use `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` for real coordinator execution.
- **TR-002**: The legacy orchestrate skill MUST remain dormant and MUST NOT be edited, deleted, rewritten, stubbed, or reactivated by this feature without explicit user approval.
- **TR-003**: Active guidance MUST preserve the current sequential `catworld-implement-issue` workflow as the default path for normal implementable issues, direct child issues, and closed-child coordinator final passes.
- **TR-004**: Active guidance MUST preserve existing coordinator guardrails while #249 and #261 remain incomplete: coordinator issues without `parallel` keep open-child and closed-child checks, non-coordinator `parallel` stops, and real sidecar product use is not activated.
- **TR-005**: Active guidance MUST state that explicit eligible coordinator `parallel` requests will route only to the sidecar coordinator workflow after #261 activates that path.
- **TR-006**: Active sidecar guidance MUST distinguish sidecar child PR issue references from final coordinator PR closure: child PRs MUST use `Related to` wording and MUST NOT close issues, while the final sidecar coordinator PR to `main` MAY close the coordinator issue and included child issues through closing keywords after merge.
- **TR-007**: Active sidecar guidance MUST NOT require automatic seed-first behavior.
- **TR-008**: Active sidecar guidance MUST NOT allow child agents to invent shared contracts or plan product behavior; child agents must use coordinator-provided artifacts and stop on unresolved decisions.
- **TR-009**: Validation MUST include the issue-required search command, manual review of active routing sources, confirmation that the dormant legacy file was not changed, and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld workflow and documentation routing sources.
- **SB-002**: Feature MUST distinguish active routing guidance from dormant legacy workflow text.
- **SB-003**: Feature MUST NOT introduce sidecar fan-out, worktree orchestration, or product feature behavior.

### Out of Scope

- Editing `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` without explicit user approval.
- Implementing sidecar fan-out.
- Activating sidecar parallel routing for real product work.
- Changing the internal sequential implementation workflow.
- Adding instructions that create branches or worktrees for sidecar execution.
- Opening or closing child issues from sidecar child pull requests.
- CatWorld product feature work.
- Editing #220 through #234.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The required search command shows no active routing reference that invokes `catworld-orchestrate-coordinator-issue` for real coordinator execution.
- **SC-002**: Manual review confirms normal issue and direct child issue routing still points to `catworld-implement-issue`.
- **SC-003**: Manual review confirms sidecar parallel is not activated for real product work before #261.
- **SC-004**: `git diff --check` reports no whitespace errors.
- **SC-005**: `git diff -- .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` is empty unless explicit user approval is obtained during this task.

## Assumptions

- The active routing and workflow sources are the issue-listed files plus validation-discovered active workflow sources that emit coordinator or child routing guidance: `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, `.agents/skills/catworld-parallel-coordinator/SKILL.md`, `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, `.agents/skills/speckit-taskstoissues/SKILL.md`, `docs/ARCHITECTURE.md`, and relevant issue or PR templates.
- No application runtime behavior, persistence, authorization, security boundary, or user-facing CatWorld product behavior changes are intended.
