# Quickstart: Dependency-Layer Fan-Out and Child Handoffs

## Prerequisites

- Run from the issue branch created from `origin/workflow/sidecar-buildout`.
- Ensure PowerShell and Git are available.
- Review the governing source files before validating:
  - `specs/029-dependency-layer-fanout/spec.md`
  - `specs/029-dependency-layer-fanout/plan.md`
  - `specs/029-dependency-layer-fanout/contracts/dependency-layer-fanout.md`
  - `.agents/skills/catworld-parallel-coordinator/SKILL.md`
  - `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
  - `docs/ARCHITECTURE.md`

## Validation Commands

Run each fan-out simulation after implementation:

```powershell
.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario independent
.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario hard-dependencies
.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario shared-contract-blocker
.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario missing-prerequisites
.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario conflict-risk-blocker
.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario unavailable-child-agent
.\specs\029-dependency-layer-fanout\validation\simulate-dependency-layer-fanout.ps1 -Scenario handoff-content
```

Expected outcomes:

- `independent` reports three launched children and three prepared handoffs in
  one dependency-ready layer.
- `hard-dependencies` reports only the first layer launched and later children
  pending or waiting for dependency merges.
- `shared-contract-blocker` reports blocked fan-out for affected children and
  no unsafe launch.
- `missing-prerequisites` reports blocked children with missing handoff,
  branch/worktree, validation, PR target, or out-of-scope context and no
  handoffs.
- `conflict-risk-blocker` reports non-mechanical conflict-risk blockers and no
  unsafe handoffs.
- `unavailable-child-agent` reports a capability blocker and no sequential
  fallback.
- `handoff-content` reports required child handoff fields and prohibitions.

Run source reviews:

```powershell
Select-String -Path .agents\skills\catworld-parallel-coordinator\SKILL.md,docs\ARCHITECTURE.md -Pattern "first dependency-ready layer|waiting-for-dependency-merge|child-agent|sequential fallback|shared-contract blocker"
Select-String -Path .agents\skills\catworld-parallel-child-implementation\SKILL.md -Pattern "exactly one child issue|regenerate|target .*main|GitHub issue mutation"
git diff --check
```

Expected outcomes:

- Coordinator and architecture text describe one-layer fan-out, capability
  blockers, dependency-merge waits, and blocker statuses.
- Child skill text requires one child issue and rejects regeneration, `main`
  targets, and issue mutation without approval.
- `git diff --check` reports no whitespace errors.

Validation must be rerun after relevant late edits. Any affected evidence that
is not rerun must be reported as `not revalidated` or `stale`, not passed.
