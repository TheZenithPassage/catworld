# Quickstart: Sidecar Branch Worktree Orchestration

Use this guide to validate issue #254 after implementation. Rerun affected
checks after any late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, or the #254 validation artifacts.

## Prerequisites

- Run commands from the repository root.
- Use the issue branch for #254, not `main`.
- Do not create real CatWorld sidecar branches, worktrees, pull requests,
  issue comments, labels, milestones, assignees, or state changes as part of
  this validation.
- The implementation PR for #254 targets `workflow/sidecar-buildout`; this is
  separate from the future sidecar coordinator branch model.

## Validation Commands

### Coordinator branch and worktree simulation

```powershell
powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario coordinator
```

Expected result:

- a temporary remote exposes `origin/main`;
- the coordinator branch is created from current `origin/main`;
- an isolated coordinator worktree is created;
- local `main` is not updated.

### Coordinator push gate simulation

```powershell
powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario push-gate
```

Expected result:

- the coordinator branch is pushed to `origin` with a normal non-force push;
- child PR delivery readiness is true only after the remote coordinator branch
  exists.

### Child branch and worktree simulation

```powershell
powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario children
```

Expected result:

- at least two child branches are created from the coordinator branch;
- each child has an isolated worktree;
- no child branch is created from `main`.

### Collision stop simulation

```powershell
powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario collision
```

Expected result:

- same-run branch/worktree ownership may resume;
- unproven branch/worktree name or path collisions stop before reuse or write.

### Dirty working tree stop simulation

```powershell
powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario dirty
```

Expected result:

- dirty working-tree paths are detected;
- branch/worktree operations are blocked before sidecar writes or child
  delivery.

### Unsafe coordinator push simulation

```powershell
powershell -ExecutionPolicy Bypass -File specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1 -Scenario unsafe-push
```

Expected result:

- a rejected normal coordinator branch push is detected;
- child PR delivery remains blocked;
- no force-push or history-rewriting push is attempted.

### Prohibited operation source review

```powershell
Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,docs/ARCHITECTURE.md -Pattern 'origin/main','non-force','worktree','dirty','collision','force-push','rebase','main'
Select-String -Path .agents/skills/catworld-parallel-child-implementation/SKILL.md -Pattern 'coordinator branch','child branch','worktree','main','force-push','rebase'
```

Expected result:

- coordinator workflow text requires coordinator and child branch/worktree
  preparation from the approved bases;
- unsafe operations remain prohibited;
- local `main` safety and child PR target boundaries remain explicit.

### Whitespace validation

```powershell
git diff --check
```

Expected result:

- no whitespace errors.
