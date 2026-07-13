# Quickstart: Validate Controlled Sidecar Routing Activation

## Prerequisites

- Work from `chore/261-activate-controlled-sidecar-parallel-routing`.
- Confirm the branch was created from refreshed
  `origin/workflow/sidecar-buildout` at accepted #260 merge
  `db3fb14604e94219e7d47879bd93c6f92b198050`.
- Run from the repository root with Git, `rg`, Windows PowerShell, and
  PowerShell 7 available.
- Do not run a live sidecar dry-run or perform real cleanup.

```powershell
git merge-base --is-ancestor db3fb14604e94219e7d47879bd93c6f92b198050 HEAD
if ($LASTEXITCODE -ne 0) { throw 'The #261 branch does not descend from the accepted #260 base.' }
```

## Complete Routing Matrix

Review `AGENTS.md`, the sequential routing boundary, both sidecar skills,
`docs/ARCHITECTURE.md`, the coordinator template, and both sidecar PR templates
against
`contracts/active-sidecar-routing.md`. Record one current result for each row:

1. normal issue -> sequential;
2. direct child issue -> sequential;
3. non-coordinator with `parallel` -> stop;
4. direct child with `parallel` -> stop;
5. coordinator without `parallel`, open children -> stop;
6. coordinator without `parallel`, all children closed -> sequential final pass;
7. coordinator with `parallel`, safe preflight -> sidecar coordinator;
8. coordinator with `parallel`, unsafe preflight -> explicit blocker.

Re-review these seven protected guards after the last relevant change:

1. sequential remains the default, including the #220-#234 exclusion and
   explicit `sequential` requests;
2. ambiguous, multiple-issue, unsafe-preflight, and unavailable-child-agent
   states fail closed without sequential fallback;
3. the two-phase held-dispatch barrier still blocks implementation and delivery
   before durable launch evidence and targeted release;
4. stale or otherwise non-passing required validation cannot support readiness;
5. exact child ancestry and the two-head `H`/`H2` finalization gates remain
   authoritative;
6. cleanup still requires exact same-run ownership, explicit authority, and H2
   ancestry in current fetched `origin/main`;
7. the user remains the only merge authority, sidecar child and final PRs
   require **"Create a merge commit"**, and Codex cannot merge, approve, enable
   auto-merge, or change merge settings.

## Existing Sidecar Regressions

Run the existing focused scenarios on their prescribed shells. Every invocation
must exit zero and return its scenario/case result as `passed`.

Parse all executable validation sources first:

```powershell
$validators = @(
  'specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1',
  'specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1',
  'specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1',
  'specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1',
  'specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1',
  'specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1',
  'specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1',
  'specs/032-final-coordinator-delivery/validation/verify-finalization-evidence.ps1',
  'specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1'
)
foreach ($file in $validators) {
  $tokens = $null
  $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile(
    (Resolve-Path $file), [ref]$tokens, [ref]$errors
  ) | Out-Null
  if ($errors.Count) { throw "$file parser errors: $($errors.Message -join '; ')" }
}
```

### #252 coordinator artifacts: Windows PowerShell and PowerShell 7

```powershell
$scenarios = 'valid','plan-on-main','write-after-branch','existing-artifact','blocked','main-cleanliness'
foreach ($scenario in $scenarios) {
  powershell -NoProfile -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario $scenario
  if ($LASTEXITCODE -ne 0) { throw "#252 Windows PowerShell failed: $scenario" }
  pwsh -NoProfile -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario $scenario
  if ($LASTEXITCODE -ne 0) { throw "#252 PowerShell 7 failed: $scenario" }
}
```

### #253 and #254: Windows PowerShell

```powershell
$suites = [ordered]@{
  'specs/027-prepared-child-artifacts/validation/simulate-prepared-child-artifacts.ps1' = @('valid','plan-on-main','write-after-branch','missing-shared-contract','sibling-scope','existing-artifact','main-cleanliness')
  'specs/028-sidecar-branch-worktree/validation/simulate-sidecar-branch-worktree.ps1' = @('coordinator','push-gate','children','collision','dirty','unsafe-push')
}
foreach ($suite in $suites.GetEnumerator()) {
  foreach ($scenario in $suite.Value) {
    powershell -NoProfile -ExecutionPolicy Bypass -File $suite.Key -Scenario $scenario
    if ($LASTEXITCODE -ne 0) { throw "Focused regression failed: $($suite.Key) $scenario" }
  }
}
```

### #255 through #258: PowerShell 7

```powershell
$suites = [ordered]@{
  'specs/029-dependency-layer-fanout/validation/simulate-dependency-layer-fanout.ps1' = @('independent','hard-dependencies','shared-contract-blocker','missing-prerequisites','conflict-risk-blocker','unavailable-child-agent','handoff-content','held-dispatch-barrier','handoff-recording-failure','launch-activation-failure','rejected-dispatch','ambiguous-dispatch')
  'specs/030-sidecar-child-execution/validation/simulate-sidecar-child-execution.ps1' = @('valid-handoff','missing-context','wrong-checkout','wrong-branch','missing-delivery-permission','delivery-denied','pr-wording','pr-target','readiness','final-report','prohibited-operations','held-preflight','stable-child-identity','durable-launched-release','launch-push-failure','refresh-verification-failure','release-failure','unexpected-remote-descendant','activation-push-failure')
  'specs/031-merge-aware-sidecar-resume/validation/simulate-merge-aware-sidecar-resume.ps1' = @('remote-refresh-order','merge-method-ancestry','active-child-refresh','resume-states','validation-staleness','unexpected-local-changes','unsafe-divergence','evidence-mismatch','missing-branch-state','human-only-blocker','unsafe-dependency-state','prohibited-operations')
  'specs/032-final-coordinator-delivery/validation/simulate-final-coordinator-delivery.ps1' = @('all-integrated','incomplete-children','evidence-mismatch','integrated-validation','validation-readiness','validation-staleness','two-head-finalization','scope-drift','final-pr-delivery','existing-final-pr','artifact-final-state','closing-keyword-isolation','prohibited-operations')
}
foreach ($suite in $suites.GetEnumerator()) {
  foreach ($scenario in $suite.Value) {
    pwsh -NoProfile -File $suite.Key -Scenario $scenario
    if ($LASTEXITCODE -ne 0) { throw "Focused regression failed: $($suite.Key) $scenario" }
  }
}
```

### #259 cleanup simulation: Windows PowerShell temporary fixture only

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File specs/033-sidecar-local-cleanup/validation/simulate-sidecar-cleanup.ps1
if ($LASTEXITCODE -ne 0) { throw '#259 cleanup simulation failed.' }
```

The #259 command validates a table-driven temporary fixture. It must not touch
the accepted live #260 run, its journal, branches, worktrees, or remote refs. Its
blocked-before-merge case also proves that merged metadata with H2 absent from
current `origin/main` ancestry attempts no cleanup.
The complete suite contains 82 unique scenarios/cases; the six #252 scenarios
run once in each prescribed shell.

## Required Stale-Wording Search

```powershell
rg -n "not implemented yet|future sidecar|after adoption|Stop after preflight|do not launch child execution" AGENTS.md .agents/skills docs/ARCHITECTURE.md .github
```

Expected: no active match that defers or forbids controlled use. Any match must
be demonstrably historical and non-authoritative.

Also inspect fixture and activation references in active sources:

```powershell
rg -n -i "#272|sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb|before #261|after #261|until #261|#261 activates|future activated|not active|dormant" AGENTS.md .agents/skills docs/ARCHITECTURE.md .github
```

Expected: no active temporary fixture gate or future-only activation blocker.

## Sequential-Skill Boundary Review

```powershell
git diff --unified=0 origin/workflow/sidecar-buildout -- .agents/skills/catworld-implement-issue/SKILL.md
```

Expected: only routing-boundary/current-capability wording changes. The diff
must add no sidecar lifecycle, artifact, Git/worktree orchestration, fan-out,
child execution, PR delivery, resume, finalization, or cleanup internals, and it
must not alter normal/direct-child sequential implementation behavior.

Confirm the protected sequential sections remain byte-equivalent after newline
normalization:

```powershell
$path = '.agents/skills/catworld-implement-issue/SKILL.md'
$base = (git show "origin/workflow/sidecar-buildout:$path") -join "`n"
$current = Get-Content -Raw $path
function Get-Section([string] $text, [string] $heading) {
  $pattern = '(?ms)^## ' + [regex]::Escape($heading) + '\r?\n.*?(?=^## |\z)'
  $match = [regex]::Match($text, $pattern)
  if (-not $match.Success) { throw "Missing section: $heading" }
  (($match.Value -replace "`r`n", "`n") -replace "`r", "`n").TrimEnd()
}
$protected = 'Required Inputs','Repository Boundaries','Branch Preparation','Workflow','Stop Conditions','Completion Report','Done When'
foreach ($heading in $protected) {
  if ((Get-Section $base $heading) -cne (Get-Section $current $heading)) {
    throw "Sequential internals changed: $heading"
  }
}
git diff --exit-code origin/workflow/sidecar-buildout -- .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md
if ($LASTEXITCODE -ne 0) { throw 'Legacy coordinator workflow changed.' }
```

## Final Scope and Whitespace Checks

```powershell
git diff --name-only origin/workflow/sidecar-buildout -- specs/034-live-sidecar-dry-run
git diff --check origin/workflow/sidecar-buildout --
git status --short
git diff --stat origin/workflow/sidecar-buildout --
```

Expected: the historical-path command is empty, whitespace checks pass, and all
changed paths belong to the plan source map. Rerun every affected check after
the last relevant change; otherwise report it as stale or not revalidated.
