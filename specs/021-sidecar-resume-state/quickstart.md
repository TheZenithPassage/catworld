# Quickstart: Sidecar Resume State Validation

Run these checks after implementing issue #232 and rerun any affected check
after later edits to sidecar workflow or resume-state text.

## Prerequisites

- Run commands from the CatWorld repository root.
- Do not run sidecar parallel execution for issue #232.
- Do not create real CatWorld sidecar branches or worktrees.
- Do not open real pull requests.
- Do not mutate GitHub issues, labels, assignees, milestones, issue state, or
  public comments.
- Do not delete local branches/worktrees or perform remote cleanup.

## 1. Review Local Resume Samples

Expected sample files:

```text
specs/021-sidecar-resume-state/samples/coordinator-resume-state.md
specs/021-sidecar-resume-state/samples/active-branch-refresh-report.md
specs/021-sidecar-resume-state/samples/cleanup-eligibility-report.md
specs/021-sidecar-resume-state/samples/coordinator-final-pass-state.md
```

Expected outcome:

- Resume state identifies completed, active, blocked, and pending child work.
- Child status entries include artifact path, branch, local checkout/worktree,
  PR, validation state, workflow status, blocker, refresh state, and cleanup
  eligibility fields.
- Resume guidance lists GitHub and repository evidence that must be re-read
  before continuing.
- Stale validation and stale branch/refresh state are visible and are not
  treated as passed or ready.
- Cleanup is ineligible after individual child PR merges and eligible only
  after final coordinator PR merge into `main`.
- Closed-child coordinator final-pass state uses normal sequential handling.

## 2. Temporary Git Refresh Simulation

This simulates one child PR merge into the coordinator branch, then refreshes
another active child branch from the coordinator branch using a normal merge.

```powershell
$repoRoot = (Get-Location).Path
$sim = Join-Path $env:TEMP "catworld-sidecar-resume-state-sim"
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

git switch -c sidecar/232-child-a sidecar/220-coordinator-parallel-workflow
"child-a" | Set-Content child-a.txt
git add child-a.txt
git commit -m "child a work"

git switch sidecar/220-coordinator-parallel-workflow
git switch -c sidecar/233-child-b sidecar/220-coordinator-parallel-workflow
"child-b" | Set-Content child-b.txt
git add child-b.txt
git commit -m "child b work"

git switch sidecar/220-coordinator-parallel-workflow
git merge --no-ff sidecar/232-child-a -m "merge child a into coordinator"

git switch sidecar/233-child-b
git merge --no-ff sidecar/220-coordinator-parallel-workflow -m "refresh child b from coordinator"

git log --oneline --graph --all
Set-Location $repoRoot
```

Expected outcome:

- The coordinator branch starts from `origin/main`.
- Both child branches start from the coordinator branch.
- The active child branch refresh uses `git merge`, not rebase.
- No force-push, remote cleanup, or CatWorld repository branch mutation is
  performed.

## 3. Required Text Checks

```powershell
Select-String -Path specs/021-sidecar-resume-state/samples/*.md -Pattern 'completed','active','blocked','pending','artifact path','checkout','validation','stale','refresh','cleanup'
Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,.agents/skills/catworld-parallel-child-implementation/SKILL.md,docs/ARCHITECTURE.md -Pattern 'resume','re-read','normal merge','stale','cleanup','final coordinator PR','remote cleanup','normal sequential state'
Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,.agents/skills/catworld-parallel-child-implementation/SKILL.md,docs/ARCHITECTURE.md -Pattern 'rebase','force-push','history-rewriting'
git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md
git diff --check
```

Expected outcome:

- Sample reports contain resume state, refresh state, validation freshness,
  cleanup eligibility, and non-sidecar boundary language.
- Sidecar workflow text contains required resume, re-read, merge-only refresh,
  stale validation, cleanup, remote approval, and normal-sequential boundary
  wording.
- Prohibited operations appear only as prohibitions.
- `.agents/skills/catworld-implement-issue/SKILL.md` has no diff.
- `git diff --check` reports no whitespace errors.

## 4. Manual Review Checklist

- Verify a later session can identify completed, active, blocked, and pending
  sidecar child work from the coordinator artifact.
- Verify resume does not require private conversation context.
- Verify stale validation or branch state is visible.
- Verify refresh-after-merge state is explicit for active branches/worktrees.
- Verify active branch/worktree refresh uses normal merge only.
- Verify no workflow text permits rebase, force-push, history rewriting, local
  cleanup after child PR merge, or remote cleanup without explicit user
  approval.
- Verify local cleanup is eligible only after final coordinator PR merge into
  `main` and only for local sidecar-created branches/worktrees.
- Verify closed-child coordinator final passes use normal sequential state
  handling.
- Review the implementation against issues #229 and #231.
