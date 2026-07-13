# Feature Specification: Dependency-Layer Fan-Out and Child Handoffs

**Feature Branch**: `chore/255-implement-dependency-layer-fan-out-and-child-handoffs`

**Created**: 2026-07-09

**Input**: GitHub issue #255, "[Workflow] Implement dependency-layer fan-out and child handoffs"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A valid future sidecar coordinator `parallel` run launches child implementation agents only for the first dependency-ready layer.
  - **Why this priority**: Sidecar fan-out must unlock safe parallel child execution without starting hard-dependent or blocked work ahead of the coordinator integration state.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator issue with three independent child issues, prepared child artifacts, shared contract state, and branch/worktree state ready, **When** fan-out runs, **Then** the coordinator builds one dependency layer containing the three children and produces one child handoff for each child in that first layer.
    2. **Given** child issues with hard dependencies across multiple layers, **When** fan-out runs before any dependency has been merged into the coordinator branch, **Then** only the first dependency-ready layer is launched and later layers remain pending or waiting for dependency merges.
    3. **Given** dependency analysis identifies a child whose hard dependency has not been merged into the coordinator branch, **When** launch readiness is evaluated, **Then** that child is not launched and the coordinator records the dependency-merge wait reason.
  - **Validation Evidence**: Local coordinator simulations for three independent children and hard-dependent children, coordinator artifact inspection, and `git diff --check`.

- **TO-002**: Fan-out stops or blocks affected children instead of launching when required artifacts, shared-contract readiness, worktree state, conflict-risk resolution, or child-agent capability is missing.
  - **Why this priority**: Parallel execution is unsafe when a child lacks prepared context, unresolved shared decisions exist, non-mechanical conflict risks need user guidance, or Codex cannot actually hand work to child agents.
  - **Acceptance Scenarios**:
    1. **Given** a dependency-ready child lacks prepared `spec.md`, `plan.md`, `tasks.md`, shared contract, branch context, or worktree context, **When** fan-out readiness is evaluated, **Then** the child is not launched and the missing prerequisite is recorded.
    2. **Given** a child has an unresolved shared-contract blocker or a non-mechanical conflict risk, **When** fan-out evaluates the first layer, **Then** the affected child is blocked and the workflow does not parallelize it without user guidance.
    3. **Given** child-agent or subagent execution is unavailable in the local Codex environment, **When** fan-out reaches an otherwise launchable layer, **Then** the workflow stops and reports the capability blocker instead of silently switching to sequential implementation.
  - **Validation Evidence**: Simulations for missing prerequisites, shared-contract blockers, non-mechanical conflict risks, unavailable child-agent capability, coordinator artifact status review, and `git diff --check`.

- **TO-003**: Each launched child agent receives exactly one child issue and a complete prepared sidecar child handoff.
  - **Why this priority**: Child agents must implement only their assigned child scope from durable coordinator context, without regenerating planning artifacts, redefining shared contracts, creating sibling scope, mutating issues, or targeting `main`.
  - **Acceptance Scenarios**:
    1. **Given** a child is launch-ready, **When** the coordinator builds its handoff, **Then** the handoff includes coordinator context, child issue body, prepared `spec.md`, `plan.md`, `tasks.md`, shared contract, dependency layer, branch/worktree context, validation requirements, PR target rules, and out-of-scope boundaries.
    2. **Given** multiple children are launch-ready in the same layer, **When** handoffs are produced, **Then** each handoff names exactly one child issue and does not include sibling implementation scope as owned work.
    3. **Given** a child handoff is reviewed against the sidecar child skill requirements, **When** the handoff is inspected, **Then** it instructs the child agent not to regenerate planning artifacts, redefine shared contracts, create sibling scope, mutate GitHub issues, or target `main`.
  - **Validation Evidence**: Sample child handoff content review against `.agents/skills/catworld-parallel-child-implementation/SKILL.md`, coordinator artifact launch-status review, and `git diff --check`.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| First layer contains independent children with complete prepared artifacts, shared contract, branch/worktree state, and child-agent capability | No | N/A | N/A | Child issue identity, layer, and prepared handoff context preserved | N/A |
| Later dependency layer exists but first layer has not merged into the coordinator branch | Yes for later layer | N/A | Record waiting-for-dependency-merge status | Later-layer child state preserved | Retry after merge observation updates coordinator state |
| Child has unresolved shared-contract blocker | Yes for affected child; fan-out stops if blocker prevents safe layer launch | N/A | Record shared-contract blocker | Shared contract state preserved | Retry only after blocker is resolved in coordinator state |
| Child has non-mechanical conflict risk requiring user guidance | Yes for affected child | N/A | Record conflict-risk blocker | Conflict-risk details preserved | Retry only after user guidance or safe resolution is recorded |
| Dependency-ready child lacks prepared spec, plan, tasks, branch, worktree, or validation context | Yes for affected child | N/A | Record missing prerequisite | Existing artifacts and Git state preserved | Retry after missing prerequisite is prepared |
| Child-agent/subagent execution is unavailable | Yes for fan-out | N/A | Report capability blocker; no sequential fallback | Layer and child readiness state preserved | Retry only when capability is available |

### Edge Cases

- Dependency layers must be built from child issue dependencies, conflict risks, shared contract state, and current repository/coordinator branch state rather than issue ordering alone.
- Fan-out must start only the first dependency-ready layer and must not start multiple dependency layers at once.
- Hard-dependent child work must wait until its dependency has been merged into the coordinator branch and that merge observation is recorded in coordinator state.
- Children with unresolved shared-contract blockers or non-mechanical conflict risks must not be parallelized as a convenience fallback.
- Missing child artifacts, missing branch/worktree state, missing validation requirements, missing PR target rules, or missing out-of-scope boundaries must block the affected handoff.
- If child-agent or subagent execution is unavailable in the local Codex environment, the coordinator must stop instead of silently switching to sequential implementation.
- Coordinator artifact status must distinguish launched, blocked, pending, and waiting-for-dependency-merge children.
- The temporary #255 implementation branch and PR target are `workflow/sidecar-buildout`; future sidecar lifecycle text remains about the activated sidecar coordinator workflow and must not treat this build-out branch as the future coordinator branch model.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Sidecar coordinator fan-out MUST build dependency layers from child issue dependencies, conflict risks, shared contract state, and current repository/coordinator state.
- **TR-002**: The workflow MUST launch only children in the first dependency-ready layer and MUST NOT launch multiple dependency layers at once.
- **TR-003**: The workflow MUST NOT launch hard-dependent child work until its dependency has been merged into the coordinator branch and coordinator state records that merge observation.
- **TR-004**: The workflow MUST NOT parallelize children with unresolved shared-contract blockers.
- **TR-005**: The workflow MUST NOT parallelize children with non-mechanical conflict risks that require user guidance.
- **TR-006**: The workflow MUST stop and report a blocker when child-agent or subagent execution is unavailable in the local Codex environment, and MUST NOT silently switch to sequential implementation.
- **TR-007**: A child MUST be launchable only when its prepared sidecar child handoff, child `spec.md`, child `plan.md`, child `tasks.md`, shared contract, dependency layer, branch/worktree context, validation requirements, PR target rules, and out-of-scope boundaries are available.
- **TR-008**: Each launched child agent MUST receive exactly one child issue and the prepared handoff for that child.
- **TR-009**: Each child handoff MUST include coordinator context, child issue body, prepared `spec.md`, prepared `plan.md`, prepared `tasks.md`, shared contract, dependency layer, branch/worktree context, validation requirements, PR target rules, and out-of-scope boundaries.
- **TR-010**: Child handoff instructions MUST prohibit child agents from regenerating planning artifacts, redefining shared contracts, creating sibling scope, mutating GitHub issues, or targeting `main`.
- **TR-011**: The coordinator artifact MUST record which children were launched, blocked, pending, or waiting for dependency merges, with a clear reason for each child that was not launched.
- **TR-012**: Fan-out MUST preserve existing sequential issue implementation behavior and MUST NOT activate general sidecar coordinator routing before #261.
- **TR-013**: Validation MUST simulate a coordinator with three independent children, hard dependencies across layers, a shared-contract blocker, missing launch prerequisites, non-mechanical conflict risk, unavailable child-agent capability, sample child handoff contents against sidecar child skill requirements, coordinator artifact launch-status recording, and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld sidecar workflow documentation, sidecar-specific skills, sidecar orchestration helpers, local simulations, tests, and source-of-truth materials required for issue #255.
- **SB-002**: Feature MUST build on the prepared child artifact and branch/worktree orchestration contracts from issues #253 and #254 as available on `workflow/sidecar-buildout`.
- **SB-003**: Feature MUST preserve dormant sidecar routing until #261 activates controlled sidecar coordinator execution.
- **SB-004**: Feature MUST distinguish current build-out branch integration work from the future sidecar coordinator branch model.
- **SB-005**: Feature MUST NOT introduce CatWorld application runtime, frontend, backend, persistence, authorization, security, database migration, deployment, or product behavior changes.

### Out of Scope

- Child implementation internals.
- Opening sidecar child, coordinator, or final integration pull requests as part of sidecar execution.
- Refreshing branches after user merges.
- Final coordinator validation.
- Product feature implementation outside prepared child scope.
- Mutating GitHub issue state, labels, comments, milestones, or assignees.
- Activating sidecar routing for real product use before #261.
- Changing normal sequential issue implementation behavior.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Dependency Layer**: A set of child issues whose hard dependencies are satisfied by the current coordinator branch state and whose shared-contract and conflict-risk state permits same-layer launch.
- **Child Launch Status**: Per-child coordinator artifact state indicating launched, blocked, pending, or waiting for dependency merge, plus the factual reason for non-launch.
- **Prepared Child Handoff**: Durable execution prompt/context for exactly one child issue, including coordinator context, child issue body, prepared Spec Kit artifacts, shared contract, dependency layer, branch/worktree context, validation requirements, PR target rules, and out-of-scope boundaries.
- **Child-Agent Capability State**: Local Codex environment capability proving whether a child agent/subagent can actually be launched.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A coordinator simulation with three independent children verifies three child handoffs are produced for one dependency-ready layer.
- **SC-002**: A hard-dependency simulation verifies only the first layer is launched and later layers are recorded as pending or waiting for dependency merges.
- **SC-003**: Shared-contract blocker, missing-prerequisite, and conflict-risk simulations verify affected fan-out stops or blocks affected children without parallelizing unsafe work.
- **SC-004**: An unavailable child-agent capability simulation verifies the workflow stops and reports the blocker instead of falling back to sequential implementation.
- **SC-005**: Sample child handoff review verifies each launched child receives exactly one child issue plus the required coordinator context, child issue body, prepared artifacts, shared contract, dependency layer, branch/worktree context, validation requirements, PR target rules, and out-of-scope boundaries.
- **SC-006**: Coordinator artifact review verifies launched, blocked, pending, and waiting-for-dependency-merge statuses are recorded with clear non-launch reasons.
- **SC-007**: `git diff --check` reports no whitespace errors.

## Assumptions

- Issues #253 and #254 are available on `workflow/sidecar-buildout` and define the prepared child artifact and branch/worktree state contracts that #255 extends.
- Child-agent/subagent availability is detected from the local Codex environment at fan-out time rather than assumed.
- The active implementation branch for this issue starts from `origin/workflow/sidecar-buildout` and the delivery PR targets `workflow/sidecar-buildout`; future sidecar coordinator branches described by this feature still follow the activated sidecar workflow model rather than this temporary build-out branch strategy.
