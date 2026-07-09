param(
    [ValidateSet(
        'valid',
        'plan-on-main',
        'write-after-branch',
        'existing-artifact',
        'blocked',
        'main-cleanliness'
    )]
    [string] $Scenario = 'valid'
)

$ErrorActionPreference = 'Stop'

$RequiredSections = @(
    'Coordinator Issue',
    'Inspected Child Issues',
    'Parent And Source References',
    'Child Issue Map',
    'Dependency Layers',
    'Hard Dependencies',
    'Conflict Risks',
    'Independent Candidates',
    'Unresolved Blockers',
    'Shared Implementation Contract',
    'Child-Owned Surfaces',
    'Shared Surfaces Requiring Caution',
    'Branch And Worktree Plan',
    'PR Target Plan',
    'Validation Plan',
    'Resume/Status Table',
    'Stop Conditions',
    'Final Coordinator PR Plan'
)

function Assert-Condition {
    param(
        [bool] $Condition,
        [string] $Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function New-Fixture {
    $children = @(
        [pscustomobject]@{
            Number = 9902
            Title = 'Child routing fixture'
            State = 'open'
            Layer = 1
            Status = 'handoff-planned'
        },
        [pscustomobject]@{
            Number = 9903
            Title = 'Child reporting fixture'
            State = 'open'
            Layer = 1
            Status = 'handoff-planned'
        },
        [pscustomobject]@{
            Number = 9904
            Title = 'Child resume fixture'
            State = 'open'
            Layer = 2
            Status = 'blocked'
        }
    )

    [pscustomobject]@{
        RunId = 'sidecar-run-9901-controlled-workflow-dry-run'
        CoordinatorNumber = 9901
        CoordinatorTitle = 'Controlled workflow dry-run coordinator'
        CoordinatorUrl = 'https://github.com/TheZenithPassage/catworld/issues/9901'
        CoordinatorLabels = @('workflow', 'coordinator')
        CoordinatorState = 'open'
        Slug = 'controlled-workflow-dry-run'
        ParentReferences = @('Parent epic: #249', 'Source: issue #252 simulation')
        Children = $children
    }
}

function Get-ArtifactRelativePath {
    param([pscustomobject] $Fixture)

    "specs/$($Fixture.CoordinatorNumber)-coordinator-$($Fixture.Slug)"
}

function New-CoordinatorArtifactText {
    param(
        [pscustomobject] $Fixture,
        [string] $WorkflowState = 'planned',
        [string] $Blocker = ''
    )

    $childList = ($Fixture.Children | ForEach-Object {
        "- #$($_.Number) - $($_.Title) [$($_.State)]"
    }) -join "`n"

    $childMap = ($Fixture.Children | ForEach-Object {
        "| #$($_.Number) | $($_.Title) | layer $($_.Layer) | $($_.Status) |"
    }) -join "`n"

    $blockerText = if ($Blocker) { "- $Blocker" } else { "- None." }

    @"
# Sidecar Coordinator Orchestration Artifact

## Run Identity

- Run ID: $($Fixture.RunId)
- Artifact path: $(Get-ArtifactRelativePath $Fixture)
- Workflow state: $WorkflowState

## Coordinator Issue

- Number: #$($Fixture.CoordinatorNumber)
- Title: $($Fixture.CoordinatorTitle)
- URL: $($Fixture.CoordinatorUrl)
- Labels: $($Fixture.CoordinatorLabels -join ', ')
- State: $($Fixture.CoordinatorState)

## Inspected Child Issues

$childList

## Parent And Source References

- $($Fixture.ParentReferences -join "`n- ")

## Child Issue Map

| Issue | Title | Dependency Layer | Status |
|-------|-------|------------------|--------|
$childMap

## Dependency Layers

- Layer 1: #9902, #9903.
- Layer 2: #9904 after layer 1 integration.

## Hard Dependencies

- #9904 waits for layer 1 integration evidence.

## Conflict Risks

- Shared workflow text requires cautious sequencing.

## Independent Candidates

- #9902 and #9903 are independent candidates for the first layer.

## Unresolved Blockers

$blockerText

## Shared Implementation Contract

- Use prepared coordinator artifacts as the durable source of truth.
- Do not invent seed, foundation, or shared-contract child issues.

## Child-Owned Surfaces

- Child workflow source maps are recorded per child before handoff.

## Shared Surfaces Requiring Caution

- `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- `docs/ARCHITECTURE.md`

## Branch And Worktree Plan

- Coordinator branch: planned, not created until branch/worktree preparation.
- Coordinator worktree: planned, not created until branch/worktree preparation.

## PR Target Plan

- Child PRs target the future coordinator branch.
- Final coordinator PR targets `main` after integrated validation.

## Validation Plan

- Run artifact path/content, write-gate, existing-artifact, blocked-state, and cleanliness simulations.

## Resume/Status Table

| Issue | Artifact | Branch | Worktree | PR | Validation | Workflow Status | Blockers | Refresh | Cleanup |
|-------|----------|--------|----------|----|------------|-----------------|----------|---------|---------|
| #9902 | planned | not created | not created | not created | not run | pending | none | not needed | ineligible |
| #9903 | planned | not created | not created | not created | not run | pending | none | not needed | ineligible |
| #9904 | planned | not created | not created | not created | not run | blocked | shared contract needed | not needed | ineligible |

## Stop Conditions

- Stop if artifact writing would occur on `main`.
- Stop if the coordinator branch/worktree cannot be entered safely.
- Stop if an existing same-number artifact cannot be proven to belong to this run.

## Final Coordinator PR Plan

- Open only after all child PRs are integrated and validation is fresh.
"@
}

function Test-RequiredSections {
    param([string] $Content)

    $missing = @()
    foreach ($section in $RequiredSections) {
        if ($Content -notmatch "(?m)^## $([regex]::Escape($section))$") {
            $missing += $section
        }
    }

    $missing
}

function New-TempGitRepository {
    $root = Join-Path ([System.IO.Path]::GetTempPath()) ("catworld-sidecar-artifact-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $root | Out-Null
    git -C $root init -q
    git -C $root branch -M main

    $root
}

function Get-TempGitStatus {
    param([string] $Repository)

    @(git -C $Repository status --porcelain)
}

function New-PlanResult {
    param(
        [pscustomobject] $Fixture,
        [string] $ActiveBranch
    )

    [pscustomobject]@{
        ActiveBranch = $ActiveBranch
        ArtifactPath = Get-ArtifactRelativePath $Fixture
        Content = New-CoordinatorArtifactText -Fixture $Fixture
        WriteAllowed = $ActiveBranch -ne 'main'
        FilesWritten = 0
    }
}

function Write-CoordinatorArtifact {
    param(
        [string] $Repository,
        [pscustomobject] $Fixture,
        [string] $ActiveBranch,
        [string] $WorkflowState = 'written',
        [string] $Blocker = ''
    )

    Assert-Condition ($ActiveBranch -ne 'main') 'Artifact writing must not occur on main.'

    $artifactPath = Join-Path $Repository (Get-ArtifactRelativePath $Fixture)
    New-Item -ItemType Directory -Force -Path $artifactPath | Out-Null

    $artifactFile = Join-Path $artifactPath 'coordinator-orchestration.md'
    $content = New-CoordinatorArtifactText -Fixture $Fixture -WorkflowState $WorkflowState -Blocker $Blocker
    Set-Content -Path $artifactFile -Value $content -NoNewline

    [pscustomobject]@{
        ActiveBranch = $ActiveBranch
        ArtifactPath = Get-ArtifactRelativePath $Fixture
        ArtifactFile = $artifactFile
        FilesWritten = 1
        Content = $content
    }
}

function Test-ExistingArtifact {
    $fixture = New-Fixture
    $sameRun = [pscustomobject]@{
        RunId = $fixture.RunId
        CoordinatorNumber = $fixture.CoordinatorNumber
        CoordinatorUrl = $fixture.CoordinatorUrl
        ArtifactPath = Get-ArtifactRelativePath $fixture
    }
    $collision = [pscustomobject]@{
        RunId = 'sidecar-run-9901-different-source'
        CoordinatorNumber = $fixture.CoordinatorNumber
        CoordinatorUrl = 'https://github.com/TheZenithPassage/catworld/issues/9901'
        ArtifactPath = Get-ArtifactRelativePath $fixture
    }

    $sameRunResume =
        $sameRun.RunId -eq $fixture.RunId -and
        $sameRun.CoordinatorNumber -eq $fixture.CoordinatorNumber -and
        $sameRun.CoordinatorUrl -eq $fixture.CoordinatorUrl -and
        $sameRun.ArtifactPath -eq (Get-ArtifactRelativePath $fixture)

    $collisionStop = -not (
        $collision.RunId -eq $fixture.RunId -and
        $collision.CoordinatorNumber -eq $fixture.CoordinatorNumber -and
        $collision.CoordinatorUrl -eq $fixture.CoordinatorUrl -and
        $collision.ArtifactPath -eq (Get-ArtifactRelativePath $fixture)
    )

    Assert-Condition $sameRunResume 'Expected same-run artifact to be resumable.'
    Assert-Condition $collisionStop 'Expected incompatible artifact to stop as collision.'

    [pscustomobject]@{
        Scenario = 'existing-artifact'
        SameRunResult = 'resume'
        CollisionResult = 'stop-before-write'
    }
}

$fixture = New-Fixture

switch ($Scenario) {
    'valid' {
        $content = New-CoordinatorArtifactText -Fixture $fixture
        $missing = Test-RequiredSections -Content $content
        Assert-Condition ($missing.Count -eq 0) "Missing required sections: $($missing -join ', ')"

        [pscustomobject]@{
            Scenario = 'valid'
            ArtifactPath = Get-ArtifactRelativePath $fixture
            RequiredSections = $RequiredSections.Count
            MissingSections = $missing.Count
            ChildIssueCount = $fixture.Children.Count
            Result = 'passed'
        } | ConvertTo-Json -Depth 5
    }
    'plan-on-main' {
        $repo = New-TempGitRepository
        try {
            $plan = New-PlanResult -Fixture $fixture -ActiveBranch 'main'
            $status = Get-TempGitStatus -Repository $repo

            Assert-Condition (-not $plan.WriteAllowed) 'Planning on main must not allow writes.'
            Assert-Condition ($plan.FilesWritten -eq 0) 'Planning on main must write zero files.'
            Assert-Condition ($status.Count -eq 0) "Temporary main should remain clean, got: $($status -join '; ')"

            [pscustomobject]@{
                Scenario = 'plan-on-main'
                ActiveBranch = $plan.ActiveBranch
                ArtifactPath = $plan.ArtifactPath
                WriteAllowed = $plan.WriteAllowed
                FilesWritten = $plan.FilesWritten
                MainStatusEntries = $status.Count
                Result = 'passed'
            } | ConvertTo-Json -Depth 5
        }
        finally {
            Remove-Item -LiteralPath $repo -Recurse -Force
        }
    }
    'write-after-branch' {
        $repo = New-TempGitRepository
        try {
            $branch = 'sidecar/9901-coordinator-controlled-workflow-dry-run'
            git -C $repo switch -c $branch --quiet

            $write = Write-CoordinatorArtifact -Repository $repo -Fixture $fixture -ActiveBranch $branch
            $missing = Test-RequiredSections -Content $write.Content

            Assert-Condition (Test-Path -LiteralPath $write.ArtifactFile) 'Expected coordinator artifact file to exist.'
            Assert-Condition ($write.FilesWritten -eq 1) 'Expected exactly one coordinator artifact file write.'
            Assert-Condition ($missing.Count -eq 0) "Missing required sections: $($missing -join ', ')"

            [pscustomobject]@{
                Scenario = 'write-after-branch'
                ActiveBranch = $write.ActiveBranch
                ArtifactPath = $write.ArtifactPath
                FilesWritten = $write.FilesWritten
                MissingSections = $missing.Count
                Result = 'passed'
            } | ConvertTo-Json -Depth 5
        }
        finally {
            Remove-Item -LiteralPath $repo -Recurse -Force
        }
    }
    'existing-artifact' {
        Test-ExistingArtifact | ConvertTo-Json -Depth 5
    }
    'blocked' {
        $repo = New-TempGitRepository
        try {
            $branch = 'sidecar/9901-coordinator-controlled-workflow-dry-run'
            git -C $repo switch -c $branch --quiet
            $blocker = 'Shared implementation contract is missing; stop before child handoff.'
            $write = Write-CoordinatorArtifact -Repository $repo -Fixture $fixture -ActiveBranch $branch -WorkflowState 'blocked' -Blocker $blocker

            Assert-Condition ($write.Content -match [regex]::Escape($blocker)) 'Expected blocker to be recorded.'
            Assert-Condition ($write.Content -match 'not created') 'Blocked artifact must not imply branches, worktrees, or PRs exist.'

            [pscustomobject]@{
                Scenario = 'blocked'
                WorkflowState = 'blocked'
                BlockerRecorded = $true
                ChildWorkLaunched = $false
                FilesWritten = $write.FilesWritten
                Result = 'passed'
            } | ConvertTo-Json -Depth 5
        }
        finally {
            Remove-Item -LiteralPath $repo -Recurse -Force
        }
    }
    'main-cleanliness' {
        $repo = New-TempGitRepository
        try {
            $plan = New-PlanResult -Fixture $fixture -ActiveBranch 'main'
            $artifactDirectory = Join-Path $repo $plan.ArtifactPath
            $status = Get-TempGitStatus -Repository $repo

            Assert-Condition (-not (Test-Path -LiteralPath $artifactDirectory)) 'Planning on main must not create the artifact directory.'
            Assert-Condition ($status.Count -eq 0) "Temporary main should remain clean, got: $($status -join '; ')"

            [pscustomobject]@{
                Scenario = 'main-cleanliness'
                ActiveBranch = 'main'
                ArtifactDirectoryExists = Test-Path -LiteralPath $artifactDirectory
                StatusEntries = $status.Count
                Result = 'passed'
            } | ConvertTo-Json -Depth 5
        }
        finally {
            Remove-Item -LiteralPath $repo -Recurse -Force
        }
    }
}
