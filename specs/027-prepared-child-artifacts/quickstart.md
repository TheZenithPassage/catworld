# Quickstart: Prepared Child Spec Kit Artifacts

Use this guide to validate issue #253 after implementation. Rerun affected
checks after any late edits to `.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`,
`docs/ARCHITECTURE.md`, or the #253 validation artifacts.

## Prerequisites

- Run commands from the repository root.
- Use the issue branch for #253, not `main`.
- Do not create real CatWorld sidecar branches, worktrees, pull requests, issue
  comments, labels, milestones, assignees, or state changes as part of this
  validation.

## Validation Commands

### Three-child artifact simulation

```powershell
powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario valid
```

Expected result:

- three child artifact paths are planned under `specs/<child-issue-number>-<child-slug>/`;
- each child includes planned `spec.md`, `plan.md`, and `tasks.md` content;
- the coordinator artifact status records each child artifact path and
  preparation status.

### Planning on main writes no files

```powershell
powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario plan-on-main
```

Expected result:

- child artifact paths and content are planned;
- the simulated `main` checkout writes zero child artifact files or directories.

### Writing after coordinator branch/worktree entry

```powershell
powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario write-after-branch
```

Expected result:

- child artifact writing is blocked while the simulated checkout is `main`;
- after entering a simulated coordinator branch/worktree, `spec.md`, `plan.md`,
  and `tasks.md` are written for each child.

### Missing shared contract stop

```powershell
powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario missing-shared-contract
```

Expected result:

- delegation stops;
- the output does not invent a seed, foundation, or shared-contract child issue.

### Sibling-scope stop

```powershell
powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario sibling-scope
```

Expected result:

- a child artifact that includes sibling scope is rejected;
- fan-out remains blocked before delegation.

### Existing artifact and duplicate child safety

```powershell
powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario existing-artifact
```

Expected result:

- same-run child artifact ownership can resume;
- unproven same-number artifact ownership stops before writing;
- duplicate child issue numbers stop before writing.

### Local main cleanliness

```powershell
powershell -ExecutionPolicy Bypass -File specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1 -Scenario main-cleanliness
```

Expected result:

- simulated local `main` remains clean after child artifact planning;
- no child sidecar artifact, sidecar commit, or untracked sidecar file is
  written to `main`.

### Source text review

```powershell
Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,docs/ARCHITECTURE.md -Pattern 'prepared child','spec.md','plan.md','tasks.md','shared implementation contract','sibling'
Select-String -Path .agents/skills/catworld-parallel-child-implementation/SKILL.md -Pattern 'prepared child','regenerate','spec.md','plan.md','tasks.md'
```

Expected result:

- coordinator workflow text requires prepared child artifacts before
  delegation;
- child workflow text requires consuming prepared artifacts instead of
  regenerating them independently;
- local `main` safety and shared-contract blockers remain explicit.

### Whitespace validation

```powershell
git diff --check
```

Expected result:

- no whitespace errors.
