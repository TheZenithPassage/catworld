# Quickstart: Sidecar Git Rules Validation

Run these checks after implementing issue #229 and rerun any affected check after later edits to sidecar workflow text.

## Prerequisites

- Run commands from the CatWorld repository root.
- Use a temporary Git repository for branch simulation; do not create sidecar execution branches in the CatWorld repository for this validation.

## 1. Temporary Git Simulation

This simulates one coordinator branch and two child branches, then simulates one child merge into the coordinator branch and refreshes the other active child with a normal merge.

```powershell
$sim = Join-Path $env:TEMP "catworld-sidecar-git-rules-sim"
Remove-Item -LiteralPath $sim -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $sim | Out-Null
Set-Location $sim
git init -b main
git config user.email "codex@example.invalid"
git config user.name "Codex Validation"
"base" | Set-Content workflow.txt
git add workflow.txt
git commit -m "seed main"
git branch origin/main

git switch -c sidecar/220-coordinator-parallel-workflow origin/main
"coordinator" | Add-Content workflow.txt
git commit -am "prepare coordinator"

git switch -c sidecar/229-child-a sidecar/220-coordinator-parallel-workflow
"child-a" | Set-Content child-a.txt
git add child-a.txt
git commit -m "child a work"

git switch sidecar/220-coordinator-parallel-workflow
git switch -c sidecar/230-child-b sidecar/220-coordinator-parallel-workflow
"child-b" | Set-Content child-b.txt
git add child-b.txt
git commit -m "child b work"

git switch sidecar/220-coordinator-parallel-workflow
git merge --no-ff sidecar/229-child-a -m "merge child a into coordinator"

git switch sidecar/230-child-b
git merge --no-ff sidecar/220-coordinator-parallel-workflow -m "refresh child b from coordinator"

git log --oneline --graph --all
```

Expected outcome:

- `sidecar/220-coordinator-parallel-workflow` starts from `origin/main`.
- Both child branches start from `sidecar/220-coordinator-parallel-workflow`.
- The active child branch refresh uses `git merge`, not rebase.
- No force-push, remote cleanup, or CatWorld repository branch mutation is performed.

Return to the CatWorld repository root before continuing.

## 2. Required Text Checks

```powershell
Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,docs/ARCHITECTURE.md -Pattern "coordinator branch","origin/main","normal merge","force-push","rebase","remote cleanup","closed-child coordinator final pass"
Select-String -Path .agents/skills/catworld-parallel-child-implementation/SKILL.md -Pattern "coordinator branch","target.*main","normal merge","force-push","rebase"
git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md
git diff --check
```

Expected outcome:

- Sidecar coordinator and architecture docs state coordinator branch, child branch, normal merge refresh, cleanup timing, and closed-child final-pass exclusions.
- Sidecar child skill states its target branch/worktree context comes from sidecar Git rules and must not target `main`.
- `.agents/skills/catworld-implement-issue/SKILL.md` is unchanged.
- `git diff --check` reports no whitespace errors.

## 3. Manual Review Checklist

- Verify no workflow text permits sidecar rebase, sidecar force-push, history-rewriting updates, or direct sidecar child PRs to `main`.
- Verify collision handling stops unless branch/checkout reuse is clearly recoverable as the intended sidecar resource.
- Verify cleanup before final coordinator PR merge is disallowed.
- Verify remote branch deletion, remote pruning, and remote cleanup require explicit user approval.
- Verify direct child issue work outside `parallel` and closed-child coordinator final passes keep the normal sequential Git workflow.
