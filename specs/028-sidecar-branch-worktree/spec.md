# Feature Specification: Sidecar Branch Worktree Orchestration

**Feature Branch**: `chore/254-implement-sidecar-branch-worktree-orchestration`

**Created**: 2026-07-09

**Input**: GitHub issue #254, "[Workflow] Implement sidecar branch and worktree orchestration"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A valid future sidecar coordinator `parallel` run can create or enter one coordinator integration branch and one isolated coordinator checkout/worktree before writing sidecar artifacts.
  - **Why this priority**: Coordinator branch/worktree preparation is the safety boundary that prevents sidecar artifacts, sidecar commits, and untracked sidecar files from landing in local `main`.
  - **Acceptance Scenarios**:
    1. **Given** a valid coordinator run with planned artifact paths and deterministic Git resource names, **When** coordinator Git preparation runs, **Then** it fetches current `origin/main` without updating local `main`, creates the coordinator integration branch from current `origin/main`, creates or enters the isolated coordinator checkout/worktree, and records the actual local and remote coordinator branch refs and coordinator worktree path in the coordinator artifact.
    2. **Given** the active checkout is local `main`, **When** sidecar artifact writing would occur, **Then** writing is blocked until the workflow has safely created or entered the coordinator branch/worktree.
    3. **Given** the coordinator branch cannot be pushed to `origin` with a normal non-force push, **When** child PR delivery would be next, **Then** the workflow stops before child PR delivery and records the unsafe push blocker.
  - **Validation Evidence**: Temporary Git repository simulations for coordinator branch creation from `origin/main`, coordinator worktree isolation, normal non-force push before child PR delivery, unsafe push stop behavior, and `git diff --check`.

- **TO-002**: A valid future sidecar coordinator run can create one isolated child branch and checkout/worktree per active child in the first dependency-ready layer, with every child branch based on the coordinator integration branch.
  - **Why this priority**: Child implementation must start from the coordinator integration state and remain isolated from sibling child worktrees, the coordinator worktree, and local `main`.
  - **Acceptance Scenarios**:
    1. **Given** the coordinator branch exists locally and remotely and the first dependency-ready layer contains at least two active child issues, **When** child Git preparation runs, **Then** each child branch is created from the coordinator branch, each child receives its own isolated checkout/worktree, and no child branch targets `main` directly.
    2. **Given** child branches and worktrees are prepared, **When** the coordinator artifact is inspected, **Then** it records each child issue's branch name, local checkout/worktree path, base coordinator branch, and PR target plan.
    3. **Given** a child branch or worktree name/path already exists, **When** current sidecar state cannot prove it belongs to the same resumable run, **Then** the workflow stops before creating or reusing that resource.
  - **Validation Evidence**: Temporary Git repository simulations covering at least two child branches created from the coordinator branch, child checkout/worktree isolation, collision stops, and review for direct child branches from `main`.

- **TO-003**: Sidecar Git orchestration stops safely for dirty working trees, name/path collisions, unsafe remote coordinator branch state, and prohibited history-changing operations.
  - **Why this priority**: The workflow must be resumable and safe before it can fan out child execution; history rewriting, direct `main` writes, or ambiguous resource reuse would undermine the sidecar safety model.
  - **Acceptance Scenarios**:
    1. **Given** any checkout needed for sidecar branch or worktree operations is dirty, **When** the workflow evaluates the operation, **Then** it stops and reports the dirty paths before creating, switching, pushing, or writing sidecar resources.
    2. **Given** deterministic coordinator or child branch/worktree names collide with existing resources, **When** recorded sidecar state does not prove same-run ownership, **Then** the workflow stops without overwriting, deleting, rebasing, force-pushing, or merging into local `main`.
    3. **Given** implementation and validation reviewers inspect the sidecar flow, **When** they search the workflow sources, **Then** they find no sidecar use of rebase, force-push, history-rewriting remote updates, direct child branches from `main`, or sidecar writes to local `main`.
  - **Validation Evidence**: Dirty-working-tree simulation, branch/worktree collision simulation, unsafe coordinator branch push simulation, prohibited-operation text review, and `git diff --check`.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| Clean eligible coordinator state with no resource collisions | No | N/A | N/A | Deterministic branch/worktree names preserved | N/A |
| Dirty checkout required for sidecar Git operation | Yes | N/A | Report dirty paths as a blocker | Existing files preserved | User or later workflow must clean or switch context before retry |
| Existing branch/worktree proven by artifact state to belong to same resumable run | No | N/A | N/A | Existing resource identity preserved | Resume continues with recorded state |
| Existing branch/worktree not proven to belong to same resumable run | Yes | N/A | Report name/path collision blocker | Existing resource preserved | Retry only after explicit safe state is established |
| Coordinator branch push rejected or unsafe | Yes for child PR delivery | N/A | Report unsafe remote coordinator branch push blocker | Local branch preserved; remote state not rewritten | Retry only after safe non-force push is possible |
| Child branch base would be `main` instead of coordinator branch | Yes | N/A | Report invalid child branch base blocker | No child branch created | Retry with coordinator branch as base |

### Edge Cases

- Fetching current `origin/main` for future sidecar coordinator branch creation must not update, merge into, or make local `main` the delivery branch.
- The temporary #254 implementation branch and PR target are `workflow/sidecar-buildout`; future sidecar lifecycle text that says coordinator branches start from `origin/main` describes the activated sidecar workflow, not this build-out integration strategy.
- Deterministic branch and checkout/worktree names must be computed before resource creation so all collisions are detected before sidecar writes or child delivery.
- Existing local or remote coordinator branches, existing child branches, existing checkout/worktree paths, and existing artifact directories must stop execution unless durable sidecar state proves same-run ownership.
- The coordinator integration branch must exist on `origin` before any child PR delivery can occur.
- Child branch/worktree preparation must not start for hard-dependent layers that are not dependency-ready.
- Local `main` must remain clean and must not receive sidecar artifacts, sidecar commits, untracked sidecar files, child branches, or merges.
- Sidecar worktrees and local branches must not be deleted after individual child PR merges.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Sidecar coordinator workflow sources MUST fetch current `origin/main` for future sidecar coordinator branch creation without updating, merging into, committing on, or delivering from local `main`.
- **TR-002**: The workflow MUST compute deterministic coordinator branch, coordinator checkout/worktree, child branch, and child checkout/worktree names before creating or reusing any resource.
- **TR-003**: The workflow MUST create one coordinator integration branch from current `origin/main` for a valid future sidecar coordinator run.
- **TR-004**: The workflow MUST create or enter one isolated coordinator checkout/worktree before writing sidecar coordinator or child artifacts.
- **TR-005**: Sidecar artifacts MUST be written only inside the coordinator branch/worktree, never in local `main`.
- **TR-006**: The coordinator artifact MUST record actual local coordinator branch ref, remote coordinator branch ref, coordinator checkout/worktree path, child branch names, child checkout/worktree paths, and the base/target relationship for each sidecar child branch.
- **TR-007**: The workflow MUST push the coordinator integration branch to `origin` with a normal non-force push before any child PR delivery can occur.
- **TR-008**: If the coordinator branch cannot be pushed safely, the workflow MUST stop before child PR delivery and MUST NOT force-push or perform a history-rewriting remote update.
- **TR-009**: Child PR delivery readiness MUST depend on the remote coordinator branch existing.
- **TR-010**: Child branches MUST be created from the coordinator integration branch, never directly from `main`.
- **TR-011**: The workflow MUST create one isolated child checkout/worktree per active child branch in the dependency-ready layer.
- **TR-012**: The workflow MUST stop on branch, checkout/worktree, directory, or artifact path/name collisions unless current sidecar state proves the resource belongs to the same resumable run.
- **TR-013**: The workflow MUST stop on dirty working trees before sidecar branch creation, checkout/worktree creation or reuse, push, artifact writing, or child delivery actions that require clean state.
- **TR-014**: The sidecar flow MUST NOT rebase, force-push, force-with-lease, rewrite history, update local `main`, merge into local `main`, target child branches or child PRs directly at `main`, or delete sidecar worktrees/local branches after individual child PR merges.
- **TR-015**: The normal sequential branch workflow MUST remain unchanged.
- **TR-016**: Validation MUST include temporary Git repository simulations for coordinator branch creation from `origin/main`, coordinator branch non-force push before child PR delivery, at least two child branches from the coordinator branch, worktree isolation, name/path collisions, unsafe coordinator push stop behavior, prohibited-operation review, and `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld sidecar workflow documentation, sidecar-specific skills, sidecar helper/test code, and feature artifacts required for issue #254.
- **SB-002**: Feature MUST preserve dormant sidecar routing until #261 activates controlled sidecar coordinator execution.
- **SB-003**: Feature MUST distinguish the current build-out branch strategy from the future sidecar coordinator branch model.
- **SB-004**: Feature MUST NOT introduce CatWorld application runtime, frontend, backend, persistence, authorization, security, database migration, deployment, or product behavior changes.

### Out of Scope

- Launching child agents.
- Opening child or coordinator pull requests as part of sidecar execution.
- Refreshing active child branches after user merges.
- Cleanup after final coordinator PR merge.
- Activating sidecar routing for real product use before #261.
- Mutating GitHub issue state, labels, comments, milestones, or assignees.
- Changing the normal sequential issue implementation workflow.
- Changing CatWorld product code, runtime behavior, domain models, API contracts, frontend UI, persistence, authorization, or deployment behavior.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Sidecar Git Resource Plan**: Deterministic coordinator and child branch names plus coordinator and child checkout/worktree paths computed before resource creation.
- **Coordinator Git State**: Actual local and remote coordinator branch refs, coordinator checkout/worktree path, push status, and blockers recorded in the coordinator artifact.
- **Child Git State**: Child issue number, branch name, checkout/worktree path, base coordinator branch, PR target plan, isolation status, and blockers recorded in the coordinator artifact.
- **Collision State**: Existing branch, checkout/worktree, directory, or artifact path state that either proves same-run ownership or blocks execution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A temporary Git repository simulation verifies coordinator branch creation from current `origin/main` without updating local `main`.
- **SC-002**: A temporary Git repository simulation verifies the coordinator branch is pushed to `origin` with a normal non-force push before child PR delivery can occur.
- **SC-003**: A temporary Git repository simulation verifies at least two child branches are created from the coordinator branch, not from `main`.
- **SC-004**: Worktree/checkouts isolation verification proves active child worktrees are isolated from each other and from the coordinator worktree.
- **SC-005**: Collision simulations verify existing branch/worktree names and paths stop safely unless same-run ownership is proven.
- **SC-006**: Unsafe coordinator branch push simulation verifies the workflow stops before child PR delivery and does not force-push.
- **SC-007**: Prohibited-operation review verifies the sidecar flow contains no allowed or required use of rebase, force-push, history-rewriting update, direct child branch from `main`, sidecar write to local `main`, local `main` update, or sidecar branch/worktree deletion after individual child PR merges.
- **SC-008**: `git diff --check` reports no whitespace errors.

## Assumptions

- Issues #251, #252, and #253 are available on `workflow/sidecar-buildout` and define the executable lifecycle, coordinator artifact contract, and prepared child artifact contract that #254 extends.
- The active implementation branch for this issue starts from `origin/workflow/sidecar-buildout` and the delivery PR targets `workflow/sidecar-buildout`; future sidecar coordinator branches described by this feature still start from current `origin/main`.
- Branch and worktree operations are validated in temporary Git repositories rather than against real CatWorld sidecar coordinator resources.
