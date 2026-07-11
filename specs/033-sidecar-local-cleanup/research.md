# Research: Sidecar Local Cleanup

## Decision 1: Durable cleanup state location

**Decision**: Store one local journal at `<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json`, resolving the common directory with `git rev-parse --git-common-dir` and normalizing the returned path.

**Rationale**: The Git common directory survives removal of linked sidecar worktrees and local branches, remains outside tracked worktree content, and requires no new service or framework. This is the user's explicitly approved decision.

**Alternatives considered**: Post-H2 remote/tracked commits, final-report-only evidence, and retaining a coordinator worktree as an artifact host were explicitly rejected. A database or external persistence service is disproportionate.

## Decision 2: Cleanup safety sequence

**Decision**: Reuse the precise #258 final-PR/H2 evidence contract and the existing coordinator resource ledger, require an exact stable cleanup `run_id` plus explicit current cleanup authority, validate all candidate worktrees for artifact-backed ownership and cleanliness before the first deletion, then remove worktrees before standard non-force deletion of their associated local branches.

**Rationale**: This preserves the approved sidecar evidence boundaries and makes dirty or unknown state fail closed without reimplementing #254, #257, or #258. Names and live Git state corroborate the tracked ledger but never manufacture ownership.

**Alternatives considered**: Name/prefix inference, per-resource preflight only after earlier deletions, filesystem deletion, force branch deletion, and duplicated finalization/resume harnesses were rejected as unsafe or out of scope.

## Decision 3: Journal update semantics

**Decision**: Write the eligible/in-progress journal before destructive execution and update it after each attempted local operation. Use a minimal result vocabulary that can represent blocked, partial, and completed outcomes truthfully.

**Rationale**: A small append-in-place state record is sufficient to show what was attempted without transaction infrastructure or elaborate crash recovery. If a required journal write cannot be made, cleanup stops.

**Alternatives considered**: Transaction logs, distributed locks, generic event sourcing, and comprehensive crash recovery were rejected by the approved scope.

## Decision 4: Validation shape

**Decision**: Use one PowerShell 5.1-compatible script, one shared temporary-Git fixture, and a table of the seven approved cases.

**Rationale**: It proves #259's correctness-sensitive local operations while leaving complete cross-workflow coverage to #260.

**Alternatives considered**: Duplicating #254/#257/#258 fixtures, multiple scripts, or an exhaustive sidecar end-to-end harness were rejected as disproportionate.
