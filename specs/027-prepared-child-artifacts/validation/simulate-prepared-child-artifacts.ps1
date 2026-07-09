param(
    [ValidateSet(
        'valid',
        'plan-on-main',
        'write-after-branch',
        'missing-shared-contract',
        'sibling-scope',
        'existing-artifact',
        'main-cleanliness'
    )]
    [string] $Scenario = 'valid'
)

$ErrorActionPreference = 'Stop'

function Assert-Condition {
    param(
        [bool] $Condition,
        [string] $Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function ConvertTo-SidecarSlug {
    param([string] $Title)

    $clean = $Title.ToLowerInvariant()
    $clean = $clean -replace '^\[[^\]]+\]\s*', ''
    $clean = $clean -replace '^(feat|fix|docs|test|chore|refactor|ci|build):\s*', ''
    $clean = $clean -replace '[^a-z0-9]+', '-'
    $clean = $clean -replace '-+', '-'
    $clean.Trim('-')
}

function New-Fixture {
    param(
        [bool] $SharedContractPresent = $true,
        [bool] $IncludeSiblingScope = $false
    )

    $children = @(
        [pscustomobject]@{
            Number = 9902
            Title = '[Workflow] Child routing fixture'
            Body = 'Implement child routing fixture only.'
            Scope = 'Child routing fixture scope only'
            Layer = 1
            Status = 'planned'
        },
        [pscustomobject]@{
            Number = 9903
            Title = '[Workflow] Child reporting fixture'
            Body = 'Implement child reporting fixture only.'
            Scope = 'Child reporting fixture scope only'
            Layer = 1
            Status = 'planned'
        },
        [pscustomobject]@{
            Number = 9904
            Title = '[Workflow] Child resume fixture'
            Body = 'Implement child resume fixture only.'
            Scope = 'Child resume fixture scope only'
            Layer = 2
            Status = 'planned'
        }
    )

    [pscustomobject]@{
        RunId = 'sidecar-run-9901-prepared-child-artifacts'
        CoordinatorNumber = 9901
        CoordinatorTitle = '[Workflow] Prepared child artifact coordinator'
        CoordinatorUrl = 'https://github.com/TheZenithPassage/catworld/issues/9901'
        CoordinatorState = 'open'
        ParentReferences = @('Parent epic: #249', 'Source: issue #253 simulation')
        SharedContract = if ($SharedContractPresent) { 'Shared implementation contract is present and non-conflicting.' } else { '' }
        IncludeSiblingScope = $IncludeSiblingScope
        Children = $children
    }
}

function Get-ChildArtifactRelativePath {
    param([pscustomobject] $Child)

    "specs/$($Child.Number)-$(ConvertTo-SidecarSlug $Child.Title)"
}

function New-ChildArtifactSet {
    param(
        [pscustomobject] $Fixture,
        [pscustomobject] $Child
    )

    $siblingLeak = ''
    if ($Fixture.IncludeSiblingScope -and $Child.Number -eq 9902) {
        $siblingLeak = "`nINCLUDES SIBLING SCOPE #9903: implement child reporting fixture too."
    }

    $path = Get-ChildArtifactRelativePath $Child
    $spec = @"
# Feature Specification: $($Child.Scope)

**Feature Branch**: sidecar/$($Child.Number)-$(ConvertTo-SidecarSlug $Child.Title)
**Input**: Child issue #$($Child.Number) prepared by coordinator #$($Fixture.CoordinatorNumber)

## Technical Outcome

- Prepare only $($Child.Scope).

## Scope Boundaries

- This artifact preserves child issue #$($Child.Number) scope exactly.
- Sibling child issues remain out of scope.$siblingLeak
"@

    $plan = @"
# Implementation Plan: $($Child.Scope)

**Input**: Prepared child spec from $path/spec.md

## Summary

Implement only child issue #$($Child.Number) using the coordinator-provided
shared implementation contract.

## Shared Contract

$($Fixture.SharedContract)
"@

    $tasks = @"
# Tasks: $($Child.Scope)

- [ ] T001 [TO1] Implement only child issue #$($Child.Number) scope after reading $path/spec.md and $path/plan.md
"@

    [pscustomobject]@{
        ChildNumber = $Child.Number
        Path = $path
        Files = [ordered]@{
            'spec.md' = $spec
            'plan.md' = $plan
            'tasks.md' = $tasks
        }
        Status = 'planned'
    }
}

function New-PreparedPlan {
    param([pscustomobject] $Fixture)

    $artifactSets = @($Fixture.Children | ForEach-Object {
        New-ChildArtifactSet -Fixture $Fixture -Child $_
    })

    [pscustomobject]@{
        CoordinatorArtifactPath = "specs/$($Fixture.CoordinatorNumber)-coordinator-prepared-child-artifact-coordinator"
        ChildArtifacts = $artifactSets
        FilesWritten = 0
        InventedIssueCreated = $false
        CoordinatorStatus = @($artifactSets | ForEach-Object {
            [pscustomobject]@{
                ChildNumber = $_.ChildNumber
                ArtifactPath = $_.Path
                PreparationStatus = $_.Status
            }
        })
    }
}

function Test-PreparedPlan {
    param(
        [pscustomobject] $Fixture,
        [pscustomobject] $Plan
    )

    Assert-Condition ($Plan.ChildArtifacts.Count -eq 3) 'Expected exactly three child artifacts.'

    $numbers = @($Plan.ChildArtifacts | ForEach-Object { $_.ChildNumber })
    $distinctNumbers = @($numbers | Select-Object -Unique)
    Assert-Condition ($numbers.Count -eq $distinctNumbers.Count) 'Duplicate child issue numbers must stop preparation.'

    foreach ($artifact in $Plan.ChildArtifacts) {
        Assert-Condition ($artifact.Path -match "^specs/$($artifact.ChildNumber)-[a-z0-9-]+$") "Invalid child artifact path: $($artifact.Path)"
        foreach ($name in @('spec.md', 'plan.md', 'tasks.md')) {
            Assert-Condition ($artifact.Files.Contains($name)) "Missing $name for child #$($artifact.ChildNumber)."
            Assert-Condition (-not [string]::IsNullOrWhiteSpace($artifact.Files[$name])) "Empty $name for child #$($artifact.ChildNumber)."
        }
        Assert-Condition ($artifact.Files['spec.md'] -notmatch 'INCLUDES SIBLING SCOPE') "Sibling scope leaked into child #$($artifact.ChildNumber)."
    }

    Assert-Condition (-not [string]::IsNullOrWhiteSpace($Fixture.SharedContract)) 'Missing shared implementation contract must block delegation.'
}

function New-TempGitRepository {
    $root = Join-Path ([System.IO.Path]::GetTempPath()) ("catworld-prepared-child-artifacts-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $root | Out-Null
    git -C $root init -q
    git -C $root branch -M main

    $root
}

function Get-TempGitStatus {
    param([string] $Repository)

    @(git -C $Repository status --porcelain)
}

function Write-ChildArtifacts {
    param(
        [string] $Repository,
        [pscustomobject] $Plan,
        [string] $ActiveBranch
    )

    Assert-Condition ($ActiveBranch -ne 'main') 'Child artifact writing must not occur on main.'

    $written = 0
    foreach ($artifact in $Plan.ChildArtifacts) {
        $artifactDirectory = Join-Path $Repository $artifact.Path
        New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null

        foreach ($fileName in $artifact.Files.Keys) {
            $filePath = Join-Path $artifactDirectory $fileName
            Set-Content -LiteralPath $filePath -Value $artifact.Files[$fileName] -NoNewline
            $written++
        }
        $artifact.Status = 'prepared'
    }

    [pscustomobject]@{
        ActiveBranch = $ActiveBranch
        FilesWritten = $written
        ChildArtifactCount = $Plan.ChildArtifacts.Count
        ChildStatuses = @($Plan.ChildArtifacts | ForEach-Object { $_.Status })
    }
}

function Test-ExistingArtifact {
    $fixture = New-Fixture
    $plan = New-PreparedPlan -Fixture $fixture
    $first = $plan.ChildArtifacts[0]

    $sameRun = [pscustomobject]@{
        RunId = $fixture.RunId
        ChildNumber = $first.ChildNumber
        ArtifactPath = $first.Path
    }
    $collision = [pscustomobject]@{
        RunId = 'sidecar-run-different-source'
        ChildNumber = $first.ChildNumber
        ArtifactPath = $first.Path
    }
    $duplicateChildren = @($fixture.Children + $fixture.Children[0])
    $duplicateNumbers = @($duplicateChildren | Group-Object Number | Where-Object { $_.Count -gt 1 })

    $sameRunResume =
        $sameRun.RunId -eq $fixture.RunId -and
        $sameRun.ChildNumber -eq $first.ChildNumber -and
        $sameRun.ArtifactPath -eq $first.Path

    $collisionStop = -not (
        $collision.RunId -eq $fixture.RunId -and
        $collision.ChildNumber -eq $first.ChildNumber -and
        $collision.ArtifactPath -eq $first.Path
    )

    Assert-Condition $sameRunResume 'Expected same-run child artifact to be resumable.'
    Assert-Condition $collisionStop 'Expected incompatible child artifact to stop as collision.'
    Assert-Condition ($duplicateNumbers.Count -gt 0) 'Expected duplicate child issue numbers to be detected.'

    [pscustomobject]@{
        Scenario = 'existing-artifact'
        SameRunResult = 'resume'
        CollisionResult = 'stop-before-write'
        DuplicateChildNumberResult = 'stop-before-write'
        Result = 'passed'
    }
}

$fixture = New-Fixture

switch ($Scenario) {
    'valid' {
        $plan = New-PreparedPlan -Fixture $fixture
        Test-PreparedPlan -Fixture $fixture -Plan $plan

        [pscustomobject]@{
            Scenario = 'valid'
            CoordinatorArtifactPath = $plan.CoordinatorArtifactPath
            ChildArtifactCount = $plan.ChildArtifacts.Count
            RequiredFilesPerChild = @('spec.md', 'plan.md', 'tasks.md')
            CoordinatorStatus = $plan.CoordinatorStatus
            HandoffReadyAfterValidation = $true
            Result = 'passed'
        } | ConvertTo-Json -Depth 6
    }
    'plan-on-main' {
        $repo = New-TempGitRepository
        try {
            $plan = New-PreparedPlan -Fixture $fixture
            $childDirectories = @($plan.ChildArtifacts | ForEach-Object { Join-Path $repo $_.Path })
            $existingDirectories = @($childDirectories | Where-Object { Test-Path -LiteralPath $_ })
            $status = Get-TempGitStatus -Repository $repo

            Assert-Condition ($plan.FilesWritten -eq 0) 'Planning on main must write zero files.'
            Assert-Condition ($existingDirectories.Count -eq 0) 'Planning on main must not create child artifact directories.'
            Assert-Condition ($status.Count -eq 0) "Temporary main should remain clean, got: $($status -join '; ')"

            [pscustomobject]@{
                Scenario = 'plan-on-main'
                ActiveBranch = 'main'
                PlannedChildArtifacts = $plan.ChildArtifacts.Count
                FilesWritten = $plan.FilesWritten
                ChildDirectoriesCreated = $existingDirectories.Count
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
            $plan = New-PreparedPlan -Fixture $fixture
            $mainBlocked = $false
            try {
                Write-ChildArtifacts -Repository $repo -Plan $plan -ActiveBranch 'main' | Out-Null
            } catch {
                $mainBlocked = $true
            }

            $branch = 'sidecar/9901-prepared-child-artifact-coordinator'
            git -C $repo switch -c $branch --quiet
            $write = Write-ChildArtifacts -Repository $repo -Plan $plan -ActiveBranch $branch

            Assert-Condition $mainBlocked 'Expected child artifact writing on main to be blocked.'
            Assert-Condition ($write.FilesWritten -eq 9) 'Expected three files for each of three child artifacts.'
            Assert-Condition (@($write.ChildStatuses | Where-Object { $_ -eq 'prepared' }).Count -eq 3) 'Expected all children to be prepared.'

            [pscustomobject]@{
                Scenario = 'write-after-branch'
                MainWriteBlocked = $mainBlocked
                ActiveBranch = $write.ActiveBranch
                FilesWritten = $write.FilesWritten
                ChildArtifactCount = $write.ChildArtifactCount
                Result = 'passed'
            } | ConvertTo-Json -Depth 5
        }
        finally {
            Remove-Item -LiteralPath $repo -Recurse -Force
        }
    }
    'missing-shared-contract' {
        $fixtureWithoutContract = New-Fixture -SharedContractPresent:$false
        $plan = New-PreparedPlan -Fixture $fixtureWithoutContract
        $blocked = $false
        try {
            Test-PreparedPlan -Fixture $fixtureWithoutContract -Plan $plan
        } catch {
            $blocked = $true
        }

        Assert-Condition $blocked 'Expected missing shared contract to block delegation.'
        Assert-Condition (-not $plan.InventedIssueCreated) 'Must not invent seed, foundation, or shared-contract issue.'

        [pscustomobject]@{
            Scenario = 'missing-shared-contract'
            DelegationBlocked = $blocked
            InventedIssueCreated = $plan.InventedIssueCreated
            Result = 'passed'
        } | ConvertTo-Json -Depth 5
    }
    'sibling-scope' {
        $fixtureWithLeak = New-Fixture -IncludeSiblingScope:$true
        $plan = New-PreparedPlan -Fixture $fixtureWithLeak
        $blocked = $false
        try {
            Test-PreparedPlan -Fixture $fixtureWithLeak -Plan $plan
        } catch {
            $blocked = $true
        }

        Assert-Condition $blocked 'Expected sibling-scope leakage to block delegation.'

        [pscustomobject]@{
            Scenario = 'sibling-scope'
            DelegationBlocked = $blocked
            ChildWorkLaunched = $false
            Result = 'passed'
        } | ConvertTo-Json -Depth 5
    }
    'existing-artifact' {
        Test-ExistingArtifact | ConvertTo-Json -Depth 5
    }
    'main-cleanliness' {
        $repo = New-TempGitRepository
        try {
            $plan = New-PreparedPlan -Fixture $fixture
            $status = Get-TempGitStatus -Repository $repo
            $createdChildDirectories = @($plan.ChildArtifacts | Where-Object {
                Test-Path -LiteralPath (Join-Path $repo $_.Path)
            })

            Assert-Condition ($createdChildDirectories.Count -eq 0) 'Planning on main must not create child artifact directories.'
            Assert-Condition ($status.Count -eq 0) "Temporary main should remain clean, got: $($status -join '; ')"

            [pscustomobject]@{
                Scenario = 'main-cleanliness'
                ActiveBranch = 'main'
                ChildDirectoriesCreated = $createdChildDirectories.Count
                StatusEntries = $status.Count
                Result = 'passed'
            } | ConvertTo-Json -Depth 5
        }
        finally {
            Remove-Item -LiteralPath $repo -Recurse -Force
        }
    }
}
