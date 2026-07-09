# Research: Sidecar Branch Worktree Orchestration

## Decision: Implement #254 through existing sidecar workflow sources and local Git simulations

**Rationale**: CatWorld sidecar workflow behavior currently lives in
repo-local Codex skills, architecture documentation, and Spec Kit artifacts.
Issues #251 through #253 used those same sources plus PowerShell simulations
to make lifecycle and artifact preparation execution-capable without
activating routing before #261. Issue #254 can extend that pattern with exact
Git branch/worktree steps and temporary repository simulations.

**Alternatives considered**:

- Add a new Git orchestration framework or service: rejected because it exceeds
  issue #254 and adds operational surface before sidecar activation.
- Add a production-like command wrapper for real sidecar branch/worktree
  operations: deferred because the existing Codex skill runtime can execute
  the approved steps directly, and local simulations provide safer validation.
- Keep only documentation rules: rejected because #254 asks for executable
  branch/worktree orchestration behavior and actual Git-state recording rules.

## Decision: Coordinator branches are created from current `origin/main` in the future sidecar workflow

**Rationale**: Issue #254 and the prior #229 sidecar Git model require future
coordinator integration branches to start from current `origin/main` while
never updating local `main`. The active #254 implementation branch itself is
different: it starts from and targets `workflow/sidecar-buildout` per the
temporary build-out integration instructions.

**Alternatives considered**:

- Create future coordinator branches from local `main`: rejected because local
  `main` must not be updated or used as a delivery branch.
- Create child branches directly from `main`: rejected because sidecar child
  work must integrate through the coordinator branch.
- Create future coordinator branches from `workflow/sidecar-buildout`:
  rejected for the activated workflow because that branch is only the temporary
  build-out integration base for issues like #254.

## Decision: Validation uses disposable bare remotes and worktrees

**Rationale**: Issue #254 requires local and remote Git behavior evidence but
also prohibits mutating real CatWorld sidecar branches, worktrees, PRs, or
issue state during this build-out. Disposable repositories can prove branch
base, normal push, unsafe push, child branch base, worktree isolation, dirty
state, and collision behavior without touching project branches beyond this
issue branch.

**Alternatives considered**:

- Validate against real CatWorld branches/worktrees: rejected because this
  would create real sidecar resources before activation and would increase
  cleanup risk.
- Use text review only: rejected because the issue explicitly requires
  temporary Git repository simulations.
