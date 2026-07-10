# Feature Specification: Merge-Aware Sidecar Resume and Next-Layer Progression

**Feature Branch**: `chore/257-merge-aware-sidecar-resume-next-layer-progression`

**Created**: 2026-07-10

**Input**: GitHub issue #257, "[Workflow] Implement merge-aware sidecar resume and next-layer progression"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A resumed sidecar coordinator run rebuilds its source of truth from current GitHub, repository, branch, worktree, artifact, validation, blocker, and cleanup approval evidence.
  - **Why this priority**: Resume must be trustworthy after time passes or child PRs are merged; private conversation context and stale artifact state cannot decide whether parallel work can continue.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar coordinator artifact exists for a paused run, **When** the coordinator is resumed, **Then** the workflow re-reads the coordinator issue body, state, labels, listed child issues, child issue bodies, child issue states, child labels, child dependencies, child PR states, child PR merge status, remote coordinator branch state, local coordinator branch/worktree state, active child branch state, coordinator artifact, child artifacts, validation freshness, blocker state, and cleanup approval state before deciding the next action.
    2. **Given** current GitHub, repository, branch, worktree, or artifact evidence conflicts with recorded coordinator artifact state, **When** resume evaluates the run, **Then** it stops and reports the mismatch instead of continuing from remembered conversation context.
    3. **Given** required coordinator or child artifacts, branch state, validation evidence, blocker state, or cleanup approval state are missing or unreadable, **When** resume evaluates the run, **Then** it stops and reports the missing evidence as a blocker.
  - **Validation Evidence**: Resume simulation covering completed, active, blocked, and pending children; mismatch simulations for recorded artifact state versus current evidence; missing-artifact and missing-branch-state simulations; and `git diff --check`.

- **TO-002**: Resume refreshes local coordinator and active child branch state safely after child PRs are merged into the remote coordinator branch.
  - **Why this priority**: Completed child work is only integrated when the remote coordinator branch has received it and the local coordinator checkout has been refreshed from that remote state.
  - **Acceptance Scenarios**:
    1. **Given** the user has merged one or more child PRs into the remote coordinator branch, **When** the sidecar coordinator resumes, **Then** it fetches the remote coordinator branch before refreshing local coordinator state.
    2. **Given** the local coordinator branch/worktree can be updated safely, **When** refresh runs, **Then** it updates from the remote coordinator branch using fast-forward or normal merge only and never rebases, force-pushes, or uses history rewriting.
    3. **Given** an active child branch/worktree still exists after coordinator refresh, **When** that child must be brought current, **Then** it refreshes from the updated local coordinator branch by normal merge only when needed and never from stale local coordinator state.
  - **Validation Evidence**: Temporary Git simulation with one remote coordinator branch, one local coordinator branch/worktree, two child branches, one child merged into the remote coordinator branch, local coordinator fetch/update before child refresh, active child normal-merge refresh, unsafe divergence and unexpected-local-change blockers, and `git diff --check`.

- **TO-003**: Resume recomputes child integration and dependency-layer state, marks affected validation stale, and continues only with dependency-ready next-layer children.
  - **Why this priority**: The coordinator must progress after observed merges without silently switching to sequential mode or launching children whose hard dependencies are not integrated.
  - **Acceptance Scenarios**:
    1. **Given** child PRs are merged into the remote coordinator branch and local coordinator state has been refreshed from that remote branch, **When** resume evaluates child states, **Then** it marks those children integrated only after both conditions are true.
    2. **Given** coordinator or active child branch refresh affects prior validation evidence, **When** resume records state, **Then** affected validation is marked stale until rerun.
    3. **Given** completed, active, blocked, pending, and dependency-ready child states exist after observed merges, **When** dependency layers are recomputed, **Then** only children whose hard dependencies are integrated into the updated local coordinator branch become ready for the next layer.
    4. **Given** unresolved human-only decisions, unsafe dependency state, stale validation, conflicts, missing artifacts, missing branch state, or unsafe divergence are present, **When** resume evaluates continuation, **Then** it stops and reports blockers without falling back to sequential mode.
  - **Validation Evidence**: Resume simulation with completed, active, blocked, and pending children; dependency-layer recomputation after observed merges; validation freshness review; unsafe dependency and blocker simulations; and `git diff --check`.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| Current GitHub, repository, branch, worktree, artifact, validation, blocker, and cleanup approval evidence matches recorded coordinator artifact state | No | Read-only GitHub calls may be made to refresh evidence | N/A | Current evidence is preserved as the resume source of truth | N/A |
| Private conversation context contains state not supported by current evidence | Yes for decisions based on that context | No mutation calls | Report unsupported or stale resume evidence | Artifact and repository evidence remain authoritative | Retry after current evidence is present in artifacts or repository state |
| Current evidence conflicts with recorded coordinator artifact state | Yes | No mutation calls | Report evidence mismatch blocker | Existing artifact state preserved for review | Retry only after mismatch is resolved by explicit artifact or repository correction |
| Required coordinator artifact, child artifact, branch state, validation evidence, blocker state, or cleanup approval state is missing | Yes | No mutation calls | Report missing evidence blocker | Existing local and remote state preserved | Retry after the missing evidence is restored or explicitly resolved |
| Child PR is merged into the remote coordinator branch but local coordinator state has not yet been refreshed from that remote branch | Yes for integration marking and next-layer launch | No mutation calls | Report coordinator refresh required | Child remains not integrated locally | Fetch and refresh local coordinator state from the remote coordinator branch |
| Local coordinator branch/worktree can fast-forward or normal-merge from the remote coordinator branch cleanly | No | No mutation calls | N/A | Local coordinator state updates from the remote coordinator branch | Mark affected validation stale until rerun |
| Local coordinator branch/worktree has unexpected local changes, unsafe divergence, or merge conflicts | Yes | No mutation calls | Report unsafe coordinator refresh blocker | Local and remote state preserved for review | Retry only after local state is cleaned or conflict is resolved by the user-approved workflow |
| Active child branch/worktree is stale after coordinator refresh and can normal-merge the updated local coordinator branch cleanly | No | No mutation calls | N/A | Active child state updates from refreshed local coordinator state | Mark affected validation stale until rerun |
| Active child branch/worktree refresh would require rebase, force-push, history rewriting, or has conflicts | Yes | No mutation calls | Report unsafe active-child refresh blocker | Active child state preserved for review | Retry only after safe normal-merge path is available or conflicts are resolved |
| Completed child PR is merged into remote coordinator branch and local coordinator state has been refreshed from that branch | No | No mutation calls | N/A | Child state may be marked integrated | Recompute dependency layers |
| Hard dependency is not integrated into the updated local coordinator branch | Yes for dependent child launch | No mutation calls | Report dependency waiting state | Dependent child remains pending | Retry after dependency is integrated and local coordinator state is refreshed |
| A next dependency layer is ready, no blockers remain, and affected validation requirements are known stale or fresh as recorded | No | Child-agent launch may occur only through the prepared sidecar fan-out workflow | N/A | Ready-next-layer state is recorded in the coordinator artifact | Rerun stale validation before claiming it passed |

### Edge Cases

- Resume must not use private conversation context as the source of truth for coordinator, child, branch, validation, blocker, or cleanup approval state.
- Evidence mismatches between GitHub, repository state, branch/worktree state, and recorded artifacts must stop the run.
- Child PR merge status alone is insufficient to mark a child integrated; the merged PR must be present in the remote coordinator branch and local coordinator state must be refreshed from that remote branch.
- Local coordinator refresh must stop on unexpected local changes, unsafe divergence, missing branch state, or conflicts.
- Active child branches/worktrees must refresh from the updated local coordinator branch, not from stale local coordinator state.
- Coordinator and active child refresh must never use rebase, force-push, force-with-lease, history rewriting, or direct updates to `main`.
- Validation affected by remote coordinator refresh or active child refresh must be stale until rerun.
- Dependency layers must be recomputed from current child issue dependencies, observed integration state, active/blocked/pending state, and updated local coordinator state.
- The workflow must stop rather than launch next-layer work when hard dependencies, shared-contract state, validation freshness, human-only decisions, or branch safety are unresolved.
- Cleanup approval state is evidence that resume must read and preserve; cleanup execution remains out of scope.
- The temporary #257 implementation branch and PR target are `workflow/sidecar-buildout`; future sidecar lifecycle text that says coordinator branches start from `origin/main` still describes the activated sidecar workflow, not this build-out branch strategy.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Resume MUST re-read current evidence from GitHub and the repository before choosing a continuation action, including coordinator issue body, state, labels, listed child issues, child issue bodies, child issue states, child labels, child dependencies, child PR states, child PR merge status, remote coordinator branch state, local coordinator branch/worktree state, active child branch state, coordinator artifact, child artifacts, validation evidence and freshness, blocker state, and cleanup approval state.
- **TR-002**: Resume MUST NOT use private conversation context as a source of truth for coordinator or child state.
- **TR-003**: Resume MUST stop and report a blocker when current evidence conflicts with recorded coordinator artifact state.
- **TR-004**: After the user merges child PRs into the remote coordinator branch, resume MUST fetch the remote coordinator branch before updating local coordinator state or active child state.
- **TR-005**: Resume MUST update the local coordinator branch/worktree from the remote coordinator branch using fast-forward or normal merge only.
- **TR-006**: Resume MUST stop and report a blocker when the local coordinator branch/worktree has unexpected local changes, unsafe divergence, missing branch state, stale evidence, or conflicts.
- **TR-007**: Resume MUST detect which child PRs were merged into the remote coordinator branch.
- **TR-008**: Resume MUST mark completed children integrated only when their PRs are merged into the coordinator branch and local coordinator state has been refreshed from the remote coordinator branch.
- **TR-009**: Still-active child branches/worktrees MUST refresh from the updated local coordinator branch and MUST use a normal merge only when refresh is needed.
- **TR-010**: Coordinator and child refresh MUST NOT rebase, force-push, use force-with-lease, rewrite history, merge into local `main`, update local `main`, or delete local or remote sidecar resources.
- **TR-011**: Resume MUST mark validation evidence affected by remote coordinator refresh or active child refresh as stale until rerun.
- **TR-012**: Resume MUST recompute dependency layers after observed child PR merges and integration state changes.
- **TR-013**: Resume MUST launch the next dependency-ready layer only after hard dependencies are integrated into the updated local coordinator branch.
- **TR-014**: The coordinator artifact MUST reflect remote coordinator branch state, local coordinator branch state, merged children, active children, blocked children, pending children, ready-next-layer children, validation freshness, blocker state, and cleanup approval state after resume evaluation.
- **TR-015**: Resume MUST stop and report blockers for conflicts, stale validation that prevents readiness, missing artifacts, missing branch state, unresolved human-only decisions, unsafe dependency state, unsafe divergence, or unavailable required child-agent capability.
- **TR-016**: Resume MUST NOT silently switch to sequential mode when sidecar resume is unsafe.
- **TR-017**: Validation MUST include temporary Git simulation with one remote coordinator branch, one local coordinator branch/worktree, two child branches, one child merged into the remote coordinator branch, local coordinator fetch/update before active child refresh, active child normal-merge refresh from updated local coordinator state, completed/active/blocked/pending child states, validation staleness after refresh, unexpected local coordinator changes, unsafe divergence, conflicting resume evidence, and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld sidecar workflow skills, sidecar-specific source-of-truth documentation, local simulations, tests, and related workflow artifacts required for issue #257.
- **SB-002**: Feature MUST build on sidecar branch/worktree orchestration, dependency-layer fan-out, and child execution/PR delivery behavior from issues #254, #255, and #256 as available on `workflow/sidecar-buildout`.
- **SB-003**: Feature MUST preserve normal sequential issue implementation behavior outside explicit sidecar `parallel` coordinator workflow activation.
- **SB-004**: Feature MUST distinguish current build-out branch integration work from the future activated sidecar coordinator branch model.
- **SB-005**: Feature MUST NOT introduce CatWorld application runtime, frontend, backend, persistence, authorization, security, database migration, deployment, or product behavior changes.

### Out of Scope

- Final coordinator PR to `main`.
- Cleanup execution.
- Remote branch deletion.
- Merging PRs.
- GitHub issue mutation, including state, labels, comments, milestones, or assignees.
- Product code changes outside prepared child work.
- Activating sidecar coordinator routing before the separately scoped activation issue.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Coordinator Resume Evidence**: The current GitHub, repository, branch, worktree, artifact, validation, blocker, and cleanup approval data used to decide whether a paused coordinator run can continue.
- **Coordinator Branch State**: Remote and local coordinator branch/worktree refs, merge relationship, cleanliness, divergence, and refresh result.
- **Child Integration State**: Per-child status derived from child issue state, child dependencies, child PR state, PR merge status into the coordinator branch, and local coordinator refresh state.
- **Active Child Refresh State**: Per-active-child branch/worktree state showing whether it is already current with the refreshed local coordinator branch, refreshed by normal merge, blocked by conflict, or unsafe to update.
- **Dependency Layer State**: Recomputed grouping of integrated, active, blocked, pending, and ready-next-layer child issues after observed merges and refresh.
- **Validation Freshness State**: Per-validation evidence showing whether checks are fresh, stale, failed, skipped, timed out, interrupted, partial, blocked, or not run after the latest coordinator or child refresh.
- **Blocker and Cleanup Approval State**: Durable state identifying resume blockers, unresolved human-only decisions, and whether cleanup has been approved; cleanup approval is read and preserved but not executed by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A temporary Git simulation verifies resume fetches and updates local coordinator state from the remote coordinator branch before any active child branch refresh.
- **SC-002**: A temporary Git simulation verifies an active child branch refreshes from the updated local coordinator branch by normal merge only.
- **SC-003**: Resume simulation verifies completed, active, blocked, and pending child states are recorded and dependency layers are recomputed after observed merges.
- **SC-004**: Validation freshness verification confirms evidence affected by remote coordinator refresh or active child refresh is marked stale until rerun.
- **SC-005**: Blocker simulations verify unexpected local coordinator changes, unsafe divergence, missing artifacts or branch state, unresolved human-only decisions, unsafe dependency state, and conflicting resume evidence stop the run.
- **SC-006**: Source review confirms no sidecar resume path uses rebase, force-push, force-with-lease, history rewriting, direct local `main` updates, remote branch deletion, GitHub issue mutation, or silent sequential fallback.
- **SC-007**: `git diff --check` reports no whitespace errors.

## Assumptions

- Issues #254, #255, and #256 are integrated into `workflow/sidecar-buildout` and provide sidecar branch/worktree orchestration, dependency-layer fan-out, and child PR delivery behavior that #257 extends, even though issue closure is intentionally deferred.
- Local simulations may represent remote coordinator branches, child branches, and PR merge observations when exercising real GitHub PR merging would mutate repository state outside this issue's allowed delivery.
- The active implementation branch for this issue starts from `origin/workflow/sidecar-buildout` and the delivery PR targets `workflow/sidecar-buildout`; future sidecar coordinator branches described by this feature still follow the activated sidecar workflow model rather than this temporary build-out branch strategy.
