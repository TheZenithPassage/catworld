# Feature Specification: Sidecar Child Implementation Skill

**Feature Branch**: `chore/228-create-sidecar-child-implementation-skill`

**Created**: 2026-07-07

**Input**: User description: "GitHub issue #228: Create an independent child implementation skill for sidecar parallel execution without modifying the existing normal implementation skill. Parent epic: #220. Depends on #227."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A separate sidecar child implementation skill exists for executing one prepared child issue from coordinator-provided artifacts only.
  - **Why this priority**: Issue #228 is the first sidecar child execution surface in #220 and must keep child implementation scoped to already prepared context from #227.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar coordinator has prepared a child issue body, coordinator context, `spec.md`, `plan.md`, `tasks.md`, shared contract, validation requirements, and a child handoff, **When** the sidecar child implementation skill is selected, **Then** it executes only the prepared child issue scope and treats the prepared artifacts as the decision contract.
    2. **Given** a child handoff is missing the child issue body, coordinator context, prepared spec, plan, tasks, shared contract, validation requirements, target branch/worktree context, or dependency status, **When** the sidecar child implementation skill evaluates readiness, **Then** it stops and reports the missing context instead of generating new planning artifacts or guessing.
  - **Validation Evidence**: Local sample child handoff from prepared artifacts, manual review of readiness inputs, and text review of blocker behavior.

- **TO-002**: The sidecar child implementation skill cannot be confused with the normal issue implementation path.
  - **Why this priority**: #220 and #228 require sidecar child execution to live beside the current sequential workflow without changing direct child issue execution.
  - **Acceptance Scenarios**:
    1. **Given** a normal issue or direct child issue is requested outside coordinator `parallel` execution, **When** routing is evaluated, **Then** the request continues to use `.agents/skills/catworld-implement-issue/SKILL.md` rather than the sidecar child implementation skill.
    2. **Given** the sidecar child implementation skill is reviewed, **When** its applicability and non-applicability sections are checked, **Then** they explicitly exclude normal sequential issues, direct child issue execution outside `parallel`, and closed-child coordinator final passes.
  - **Validation Evidence**: Changed-file review confirming `.agents/skills/catworld-implement-issue/SKILL.md` is untouched, text review that the sidecar skill names its routing exclusions, and manual routing review against #220.

- **TO-003**: The sidecar child implementation skill preserves prepared shared contracts and validation requirements without expanding scope.
  - **Why this priority**: Parallel child work is only safe when each child executor honors the coordinator artifacts and reports conflicts instead of redefining shared decisions.
  - **Acceptance Scenarios**:
    1. **Given** prepared child artifacts contain a shared contract and validation plan, **When** the sidecar child implementation skill runs, **Then** it follows those artifacts and validation requirements without redefining shared contracts, creating new child scope, or generating replacement specs, plans, or tasks.
    2. **Given** prepared artifacts conflict with the child issue body, coordinator context, source-of-truth docs, or repository state, **When** the sidecar child implementation skill detects the conflict, **Then** it stops with a blocker report instead of silently choosing one source.
  - **Validation Evidence**: Local sample handoff including shared contract and validation requirements, blocker scenario review, and changed-file scope review.

### Edge Cases

- A sidecar child handoff lacks one required input: stop before implementation and name the missing input.
- Prepared `spec.md`, `plan.md`, or `tasks.md` is absent, incomplete, or inconsistent with the child issue body: stop and report the conflict instead of running Spec Kit generation.
- The prepared shared contract is missing, ambiguous, or conflicts with repository source-of-truth documentation: stop for coordinator/user guidance.
- The child issue dependency layer indicates an unmet dependency: stop before implementation and report the dependency blocker.
- The child handoff attempts to target `main` directly or lacks explicit coordinator branch/worktree context: stop because #220 requires sidecar child PRs to target the coordinator branch.
- A closed-child coordinator final pass is requested: route through the existing sequential workflow, not the sidecar child implementation skill.
- A normal issue or direct child issue is requested without a valid coordinator `parallel` handoff: route through the current sequential workflow.
- A child executor discovers implementation needs that exceed prepared scope: stop and report the scope gap rather than expanding the child issue.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The implementation MUST add a new sidecar child implementation skill at `.agents/skills/catworld-parallel-child-implementation/SKILL.md`.
- **TR-002**: The sidecar child implementation skill MUST apply only to sidecar coordinator `parallel` child handoffs produced from prepared coordinator artifacts.
- **TR-003**: The sidecar child implementation skill MUST require the child issue body, coordinator context, prepared `spec.md`, prepared `plan.md`, prepared `tasks.md`, shared contract, validation requirements, dependency status, and target coordinator branch/worktree context before implementation.
- **TR-004**: The sidecar child implementation skill MUST treat prepared child artifacts as the child implementation decision contract and MUST NOT generate its own planning artifacts.
- **TR-005**: The sidecar child implementation skill MUST NOT redefine shared contracts, expand child issue scope, create additional child issues, or invent missing coordinator decisions.
- **TR-006**: The sidecar child implementation skill MUST stop with a blocker report when required context is missing, prepared artifacts conflict, dependencies are unresolved, shared contracts are unsafe, target branch/worktree context is missing, or requested work exceeds prepared scope.
- **TR-007**: The implementation MUST leave `.agents/skills/catworld-implement-issue/SKILL.md` unchanged.
- **TR-008**: Direct child issue execution outside coordinator `parallel` mode MUST continue to use `.agents/skills/catworld-implement-issue/SKILL.md`.
- **TR-009**: Closed-child coordinator final passes MUST continue through the current sequential workflow and MUST NOT route into the sidecar child implementation skill.
- **TR-010**: The sidecar child implementation skill MUST NOT introduce coordinator preflight, branch orchestration, PR routing, GitHub issue mutation, product implementation behavior outside the child handoff, or CatWorld product architecture changes.
- **TR-011**: Validation MUST produce one local sample child handoff from prepared artifacts, confirm the new skill does not call or modify the normal implementation skill, and confirm coordinator final pass is not routed to this skill.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld repository workflow infrastructure.
- **SB-002**: Feature MUST build on the #227 prepared artifact model and the #220 sidecar architecture.
- **SB-003**: Feature MUST distinguish sidecar child implementation from coordinator preflight, artifact preparation, branch/worktree orchestration, PR handling, GitHub issue mutation, cleanup, adoption dry-run behavior, and normal sequential issue implementation.
- **SB-004**: Feature MUST NOT change CatWorld product behavior, application architecture, persistence, authorization, APIs, frontend behavior, operations, or runtime dependencies.

### Out of Scope

- Coordinator preflight.
- Coordinator and child artifact preparation.
- Branch or worktree orchestration.
- Pull request creation, update, targeting, closure, or mutation rules.
- GitHub issue mutation.
- Product code changes outside a future prepared child handoff.
- Changes to `.agents/skills/catworld-implement-issue/SKILL.md`.
- Routing closed-child coordinator final passes into the sidecar child skill.
- Direct child issue execution outside coordinator `parallel` mode.

### Open Questions

- None. Issues #220, #227, and #228 define the required sidecar child skill boundary and required inputs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `.agents/skills/catworld-parallel-child-implementation/SKILL.md` exists and clearly identifies itself as the sidecar child implementation skill.
- **SC-002**: The new skill lists the required prepared inputs: child issue body, coordinator context, prepared spec, plan, tasks, shared contract, validation requirements, dependency status, and target coordinator branch/worktree context.
- **SC-003**: The new skill explicitly forbids generating planning artifacts, redefining shared contracts, expanding scope, or routing normal/direct child issue execution through the sidecar child path.
- **SC-004**: A local sample handoff demonstrates how prepared artifacts are passed to one child implementation and how missing/conflicting context produces a blocker report.
- **SC-005**: Changed-file review confirms `.agents/skills/catworld-implement-issue/SKILL.md` is unchanged.
- **SC-006**: Manual routing review confirms closed-child coordinator final passes remain in the existing sequential workflow.
- **SC-007**: Changed-file review confirms no branch orchestration, PR automation, GitHub issue mutation, CatWorld product runtime code, or product architecture changes are introduced by #228.

## Assumptions

- The artifact-preparation behavior delivered by #227 is the source for sidecar child handoffs and prepared child artifacts.
- The sidecar child skill may define readiness checks and implementation execution rules, but later issues #229 through #234 remain responsible for sidecar Git execution, PR targeting, validation hardening, resumable state tracking, handoff alignment, and adoption dry-run behavior.
