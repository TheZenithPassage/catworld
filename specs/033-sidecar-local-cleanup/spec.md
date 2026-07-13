# Feature Specification: Sidecar Local Cleanup

**Feature Branch**: `chore/259-sidecar-cleanup-execution`

**Created**: 2026-07-11

**Input**: User description: "Implement issue #259 with a minimal local cleanup journal under the Git common directory. Cleanup stays ineligible until the final coordinator PR is confirmed merged into `main`; only clean, same-run-owned local worktrees and branches may be removed; cleanup results remain local and must never mutate H2, remotes, pull requests, issues, or comments."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes

- **TO-001**: Sidecar cleanup remains ineligible until current evidence confirms that the same-run final coordinator PR merged into `main`.
  - **Why this priority**: Premature cleanup could delete active worktrees, validation evidence, or recoverable branch state.
  - **Acceptance Scenarios**:
    1. **Given** the final coordinator PR has not been confirmed merged into `main`, **when** cleanup is evaluated, **then** cleanup is blocked and no local resource is removed.
    2. **Given** current GitHub and repository evidence confirms that the final coordinator PR merged into `main`, **when** cleanup is evaluated, **then** cleanup becomes eligible but local deletion still requires explicit current cleanup authority.
  - **Validation Evidence**: Table-driven cases for blocked-before-final-merge and eligible-after-final-merge states.

- **TO-002**: Eligible cleanup removes only clean local worktrees and branches explicitly owned by the same sidecar run.
  - **Why this priority**: A branch name, directory name, or sidecar-looking path is not sufficient authority to delete local state.
  - **Acceptance Scenarios**:
    1. **Given** every candidate worktree is clean and every candidate resource has exact same-run ownership evidence, **when** cleanup executes, **then** owned worktrees are removed before their associated local branches.
    2. **Given** any candidate worktree is dirty, **when** preflight runs, **then** the entire cleanup stops before the first deletion.
    3. **Given** any candidate resource has unknown or inconsistent ownership, **when** preflight runs, **then** the entire cleanup stops before the first deletion.
    4. **Given** one local removal succeeds and a later removal fails, **when** cleanup stops, **then** the partial result and attempted operations are recorded truthfully.
  - **Validation Evidence**: One shared temporary-Git fixture with table-driven dirty, unknown-ownership, successful cleanup, and partial-failure cases.

- **TO-003**: Cleanup eligibility and execution state survive sidecar worktree removal in a minimal local journal without changing repository history or remote state.
  - **Why this priority**: H2 and the finalization artifact must remain immutable while cleanup still leaves durable local evidence.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar run ID, **when** cleanup state is read or written, **then** the journal path is resolved beneath the repository's Git common directory as `catworld-sidecar/runs/<run-id>/cleanup-state.json`.
    2. **Given** cleanup is blocked, attempted, partially completed, or completed, **when** the journal is updated, **then** it contains only the approved minimal fields and factual current state.
    3. **Given** default cleanup runs, **when** commands and changed surfaces are reviewed, **then** no H3/H4, remote deletion, remote pruning, GitHub issue/comment mutation, PR merge/approval, or auto-merge operation exists.
  - **Validation Evidence**: Journal-schema assertions, prohibited-operation review, and `git diff --check`.

### Input/State Validation Matrix

| State | Cleanup Eligible? | Local Deletion Allowed? | Journal Result |
|-------|-------------------|-------------------------|----------------|
| Final coordinator PR is known not merged | No | No | `eligibility = ineligible`, `result = ineligible` |
| Final coordinator merge evidence is missing or inconsistent | No | No | `eligibility = ineligible`, `result = blocked`, with skipped reason |
| Final coordinator PR confirmed merged into `main`, but cleanup authority absent | Yes | No | `eligibility = eligible`, `result = not_started`, with authority reason |
| Any candidate worktree is dirty | Yes | No | `eligibility = eligible`, `result = blocked`, with dirty-worktree reason |
| Any candidate resource has unknown or conflicting ownership | Yes | No | `eligibility = eligible`, `result = blocked`, with ownership reason |
| All candidates are clean, same-run-owned, and cleanup is authorized | Yes | Yes; worktree before associated branch | `eligibility = eligible`, `result = completed`, with attempted operations |
| A later local removal fails after an earlier success | Yes | Stop after the failed operation | `eligibility = eligible`, `result = partial`, with exact attempted operations and failure reason |

### Edge Cases

- `git rev-parse --git-common-dir` fails or resolves to an inconsistent repository location.
- The journal cannot be created or updated before destructive work begins.
- A local branch cannot be removed safely after its worktree was removed.

## Requirements *(mandatory)*

### Technical Requirements

- **TR-001**: Cleanup MUST remain ineligible until current evidence identifies one unique same-run final coordinator PR whose expected coordinator source and H2 head, `main` base, merged state, and merge evidence in current `origin/main` evidence all agree; known-unmerged state remains ineligible, while missing, stale, or inconsistent evidence MUST block cleanup.
- **TR-002**: Cleanup requires an exact stable `run_id` already recorded for the coordinator run. Targets MUST be limited to exact local branches and worktrees explicitly recorded as owned by that run and corroborated by normalized path, exact branch, repository Git common directory, and live Git association. Unknown ownership or inconsistent live state MUST block the complete batch before its first deletion; cleanup MUST NOT infer ownership from names or live state alone.
- **TR-003**: Before cleanup starts, every candidate worktree MUST be checked for staged, unstaged, and untracked changes. Any dirty candidate MUST block the complete cleanup batch before its first deletion.
- **TR-004**: Cleanup MUST remove each eligible owned worktree before attempting standard non-force deletion of its associated local branch. A failed operation MUST stop unsupported continuation.
- **TR-005**: Cleanup MUST record eligibility, skipped reasons, attempted operations, partial failure, and final result in a local journal at `<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json`.
- **TR-006**: The Git common directory MUST be resolved with `git rev-parse --git-common-dir`; the journal MUST remain outside tracked worktree content and MUST survive removal of sidecar worktrees and local branches.
- **TR-007**: The journal schema MUST contain only `schema_version`, `run_id`, `eligibility`, `owned_resources`, `skipped_reasons`, `attempted_operations`, `result`, and `updated_at_utc` as top-level fields.
- **TR-008**: Cleanup MUST update the journal before destructive execution and after each attempted local operation so a stopped run does not claim unattempted work or successful completion.
- **TR-009**: H2 and `specs/032-final-coordinator-delivery/finalization.md` MUST remain immutable, and cleanup MUST NOT create H3/H4 or any other repository commit.
- **TR-010**: Cleanup MUST NOT delete or otherwise clean up remote branches, prune remotes or remote-tracking refs, mutate GitHub issues or comments, merge or approve pull requests, or enable auto-merge. Read-only evidence collection and an already-required final-merge evidence refresh are not remote cleanup.
- **TR-011**: Validation MUST use one shared temporary-Git fixture and table-driven cases covering only: blocked before final merge, eligible after final merge, dirty-worktree block, unknown-ownership block, successful worktree-then-branch cleanup, truthful partial failure, and prohibited remote/GitHub operations.
- **TR-012**: Implementation MUST remain proportional: one focused validation script, no generic persistence framework, concurrency/distributed locking, transaction infrastructure, elaborate crash recovery, filesystem-security subsystem, duplicated #254/#257/#258 harnesses, or exhaustive end-to-end regression suite.
- **TR-013**: The temporary build-out branch and PR target MUST NOT alter the future sidecar model in which runtime coordinator branches start from current `origin/main` and final coordinator PRs target `main`.
- **TR-014**: Cleanup eligibility MUST NOT trigger automatic deletion; destructive local cleanup MUST require explicit current cleanup authority consistent with repository operation rules.

### Scope Boundaries

- **SB-001**: This feature changes repository-local sidecar workflow instructions, architecture documentation, and focused issue artifacts only.
- **SB-002**: Normal sequential issue implementation, direct-child work outside explicit sidecar `parallel`, closed-child coordinator final passes, and pre-#261 routing remain unchanged.
- **SB-003**: Issue #260 owns complete end-to-end and cross-workflow validation; #259 provides only the focused cleanup validation listed in TR-011.

### Out of Scope

- Generic persistence, transaction, locking, crash-recovery, or filesystem-security infrastructure.
- Remote branch deletion, remote pruning, remote-tracking ref cleanup, or other remote cleanup.
- GitHub issue/comment mutation, PR merging or approval, and auto-merge.
- H3/H4 or any mutation of the #258 finalization artifact.
- Product code, application behavior, or sequential workflow changes.
- Activation of sidecar routing before #261.
- Complete end-to-end or cross-workflow regression validation reserved for #260.
- Cleanup of real sidecar resources during implementation validation.

### Key Entities

- **Cleanup Journal**: Minimal local JSON state for one sidecar run, stored beneath the Git common directory and identified by `run_id`.
- **Owned Resource**: Exact local branch or worktree identity with sufficient same-run evidence to authorize cleanup.
- **Attempted Operation**: One factual worktree or branch removal attempt and its outcome.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Focused validation proves cleanup is blocked before final merge and eligible after confirmed final merge.
- **SC-002**: Dirty-worktree and unknown-ownership cases perform zero cleanup deletions and record exact skipped reasons.
- **SC-003**: Successful cleanup removes an owned clean worktree before its associated non-force local branch deletion.
- **SC-004**: A simulated later-operation failure records a partial result and the exact attempted operations without claiming completion.
- **SC-005**: The local journal contains exactly the eight approved top-level fields and remains under the Git common directory.
- **SC-006**: Source review finds no prohibited remote/GitHub operation and confirms H2 and the #258 finalization artifact are unchanged.
- **SC-007**: One focused validation script uses a shared temporary-Git fixture and table-driven cases, and `git diff --check` reports no whitespace errors.

## Assumptions

- The repository's Git common directory remains available after sidecar-created worktrees and local branches are removed.
- Current GitHub and repository evidence required to confirm the final merge is available to the coordinator before local cleanup begins.
