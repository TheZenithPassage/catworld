# Research: Merge-Aware Sidecar Resume and Next-Layer Progression

## Decision: Extend existing sidecar workflow sources and local simulations

**Decision**: Implement #257 by updating the existing sidecar coordinator
skill, sidecar child handoff/resume references, architecture documentation, the
#257 contract, and a focused PowerShell/Git validation script.

**Rationale**: Issues #254, #255, and #256 already established the sidecar
build-out pattern: executable Codex skill procedures, architecture source text,
contracts, quickstarts, and local simulations. #257 extends the same dormant
workflow with stricter resume and refresh behavior; it does not require
product runtime code, new dependencies, or real GitHub PR mutation.

**Alternatives considered**:

- Add a repository-local resume helper command: useful later, but premature
  for #257 and higher maintenance than workflow text plus simulations.
- Add an external workflow engine or GitHub automation service: exceeds the
  issue scope and would introduce operational surface before sidecar routing is
  activated.

## Decision: Current evidence is authoritative for resume

**Decision**: Resume must re-read GitHub and repository evidence and compare it
with recorded coordinator artifacts before continuing. Private conversation
context is never sufficient.

**Rationale**: The user may merge child PRs between Codex sessions. Current
issue, PR, remote branch, local branch/worktree, artifact, validation, blocker,
and cleanup approval evidence are the only safe source of truth for whether
the coordinator can refresh and launch a next layer.

**Alternatives considered**:

- Trust recorded artifact state alone: insufficient after remote child PR
  merges or local branch changes.
- Trust conversation memory: explicitly prohibited by the issue and unsafe
  across sessions.

## Decision: Refresh order is remote coordinator, local coordinator, active child

**Decision**: After user-owned child PR merges, Codex must fetch the remote
coordinator branch, update local coordinator branch/worktree from that remote
state by fast-forward or normal merge only, and only then refresh active child
branches/worktrees from the updated local coordinator branch by normal merge
when needed.

**Rationale**: A child is integrated only when the merge is present in the
remote coordinator branch and local coordinator state has incorporated it.
Refreshing active children from stale local state would make dependency-layer
decisions unsafe.

**Alternatives considered**:

- Refresh active children directly from remote: this bypasses the coordinator
  branch/worktree as the artifact and dependency source of truth.
- Rebase active children onto coordinator: prohibited by approved sidecar Git
  rules and less auditable than merge-only refresh.

## Decision: Simulate PR merges with temporary Git repositories

**Decision**: Validation will use temporary local/bare Git repositories to
model remote coordinator, local coordinator, child branches, observed merge
state, local changes, divergence, conflicts, and stale validation.

**Rationale**: The issue requires Git simulation, and real PR merges or GitHub
issue mutation are out of scope. Local repositories can prove ordering and
prohibited operations without mutating GitHub state.

**Alternatives considered**:

- Use real GitHub PRs as validation fixtures: violates the no-mutation
  boundary for this issue.
- Use text-only review: insufficient for refresh ordering, dirty-state, and
  divergence behavior.
