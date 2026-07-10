param(
    [ValidateSet(
        'valid-handoff',
        'missing-context',
        'wrong-checkout',
        'pr-wording',
        'pr-target',
        'readiness',
        'final-report',
        'prohibited-operations'
    )]
    [string] $Scenario = 'valid-handoff'
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

function Invoke-Git {
    param(
        [string] $WorkingDirectory,
        [string[]] $Arguments,
        [switch] $AllowFailure
    )

    $previousErrorActionPreference = $ErrorActionPreference
    if ($AllowFailure) {
        $ErrorActionPreference = 'Continue'
    }

    try {
        $output = & git -C $WorkingDirectory @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0 -and -not $AllowFailure) {
        throw "git -C $WorkingDirectory $($Arguments -join ' ') failed with exit $exitCode`n$output"
    }

    [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($output)
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

function New-TempGitRepository {
    $root = Join-Path ([System.IO.Path]::GetTempPath()) ("catworld-sidecar-child-execution-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $root | Out-Null

    git -C $root init -q
    if ($LASTEXITCODE -ne 0) { throw 'Failed to initialize fixture repository.' }
    Invoke-Git $root @('branch', '-M', 'main') | Out-Null
    Invoke-Git $root @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
    Invoke-Git $root @('config', 'user.name', 'Sidecar Simulation') | Out-Null
    Set-Content -LiteralPath (Join-Path $root 'README.md') -Value 'fixture' -NoNewline
    Invoke-Git $root @('add', 'README.md') | Out-Null
    Invoke-Git $root @('commit', '-q', '-m', 'seed fixture') | Out-Null

    $coordinatorBranch = 'sidecar/9901-coordinator-child-execution-fixture'
    $childBranch = 'sidecar/9902-child-execution-fixture'
    Invoke-Git $root @('switch', '-q', '-c', $coordinatorBranch) | Out-Null
    Set-Content -LiteralPath (Join-Path $root 'coordinator-state.md') -Value 'coordinator state' -NoNewline
    Invoke-Git $root @('add', 'coordinator-state.md') | Out-Null
    Invoke-Git $root @('commit', '-q', '-m', 'record coordinator state') | Out-Null
    Invoke-Git $root @('switch', '-q', '-c', $childBranch) | Out-Null

    [pscustomobject]@{
        Root = $root
        CoordinatorBranch = $coordinatorBranch
        ChildBranch = $childBranch
    }
}

function New-PreparedHandoff {
    param(
        [bool] $Complete = $true,
        [string] $PrTargetBranch = 'sidecar/9901-coordinator-child-execution-fixture'
    )

    $childTitle = '[Workflow] Child execution fixture'
    $slug = ConvertTo-SidecarSlug -Title $childTitle
    $handoff = [ordered]@{
        ChildIssueNumber = 9902
        ChildIssueTitle = $childTitle
        ChildIssueBody = 'Implement one controlled child execution fixture.'
        CoordinatorIssueNumber = 9901
        CoordinatorContext = 'Coordinator #9901 child execution fixture'
        DependencyLayer = 1
        LaunchStatus = 'launched'
        PreparedSpec = "specs/9902-$slug/spec.md"
        PreparedPlan = "specs/9902-$slug/plan.md"
        PreparedTasks = "specs/9902-$slug/tasks.md"
        PreparedTaskIds = @('T001')
        SharedContract = 'Shared contract is present and non-conflicting.'
        ExpectedCheckout = '<fixture>'
        ExpectedBranch = 'sidecar/9902-child-execution-fixture'
        ChildBranch = 'sidecar/9902-child-execution-fixture'
        CoordinatorBranch = 'sidecar/9901-coordinator-child-execution-fixture'
        CoordinatorRemoteBranch = 'origin/sidecar/9901-coordinator-child-execution-fixture'
        PrTargetBranch = $PrTargetBranch
        PrIssueReferences = @('Related to #9902', 'Related to #9901')
        ValidationRequirements = @('prepared child validation', 'git diff --check')
        DeliveryPermitted = $true
        OutOfScope = @('Sibling child scope', 'GitHub issue mutation', 'main target')
        ProhibitedOperations = @('merge', 'approve', 'enable auto-merge', 'mutate GitHub issues', 'post public comments', 'delete remote branches', 'rebase', 'force-push', 'clean local sidecar resources')
    }

    if (-not $Complete) {
        $handoff.Remove('PreparedTasks')
        $handoff.Remove('SharedContract')
        $handoff.Remove('ValidationRequirements')
    }

    [pscustomobject]$handoff
}

function Test-HandoffCompleteness {
    param([pscustomobject] $Handoff)

    $required = @(
        'ChildIssueNumber',
        'CoordinatorIssueNumber',
        'DependencyLayer',
        'LaunchStatus',
        'PreparedSpec',
        'PreparedPlan',
        'PreparedTasks',
        'SharedContract',
        'ExpectedCheckout',
        'ExpectedBranch',
        'ChildBranch',
        'CoordinatorBranch',
        'PrTargetBranch',
        'PrIssueReferences',
        'ValidationRequirements',
        'OutOfScope',
        'ProhibitedOperations'
    )

    $missing = @()
    foreach ($field in $required) {
        if (-not $Handoff.PSObject.Properties.Name.Contains($field)) {
            $missing += $field
            continue
        }

        $value = $Handoff.$field
        if ($value -is [array]) {
            if ($value.Count -eq 0) { $missing += $field }
        } elseif ([string]::IsNullOrWhiteSpace([string]$value)) {
            $missing += $field
        }
    }

    $missing
}

function Test-ChildContext {
    param(
        [string] $Repository,
        [pscustomobject] $Handoff
    )

    $currentBranch = (Invoke-Git $Repository @('branch', '--show-current')).Output[0]
    $currentRoot = (Invoke-Git $Repository @('rev-parse', '--show-toplevel')).Output[0] -replace '\\', '/'
    $expectedRoot = $Handoff.ExpectedCheckout -replace '\\', '/'

    [pscustomobject]@{
        CurrentBranch = $currentBranch
        ExpectedBranch = $Handoff.ExpectedBranch
        BranchMatches = $currentBranch -eq $Handoff.ExpectedBranch
        CurrentRoot = $currentRoot
        ExpectedRoot = $expectedRoot
        CheckoutMatches = $currentRoot -eq $expectedRoot
    }
}

function Invoke-ChildExecution {
    param(
        [string] $Repository,
        [pscustomobject] $Handoff
    )

    $missing = @(Test-HandoffCompleteness -Handoff $Handoff)
    Assert-Condition ($missing.Count -eq 0) "Missing handoff context: $($missing -join ', ')"

    $context = Test-ChildContext -Repository $Repository -Handoff $Handoff
    Assert-Condition $context.CheckoutMatches 'Current checkout must match prepared child checkout.'
    Assert-Condition $context.BranchMatches 'Current branch must match prepared child branch.'
    Assert-Condition ($Handoff.ChildIssueNumber -is [int]) 'Handoff must identify exactly one child issue.'
    Assert-Condition ($Handoff.LaunchStatus -eq 'launched') 'Child must be launched by the coordinator.'
    Assert-Condition ($Handoff.PreparedTaskIds.Count -eq 1) 'Fixture child must execute exactly one prepared task.'
    Assert-Condition ($Handoff.PrTargetBranch -eq $Handoff.CoordinatorBranch) 'Child PR target must be the coordinator branch.'

    $workFile = "child-work-$($Handoff.ChildIssueNumber).md"
    Set-Content -LiteralPath (Join-Path $Repository $workFile) -Value "implemented child issue #$($Handoff.ChildIssueNumber)" -NoNewline
    $changedFiles = @(
        (Invoke-Git $Repository @('status', '--porcelain')).Output |
            ForEach-Object { ($_ -replace '^.{2}\s+', '').Trim() }
    )
    Assert-Condition ($changedFiles.Count -eq 1) 'Expected exactly one changed file in the child branch diff.'
    Assert-Condition ($changedFiles[0] -eq $workFile) 'Expected changed file to remain within prepared child task fixture.'

    [pscustomobject]@{
        Context = $context
        TasksExecuted = $Handoff.PreparedTaskIds
        ChangedFiles = $changedFiles
        PlanningRegenerationAttempted = $false
        SiblingScopeTouched = $false
    }
}

function New-ChildPrBody {
    param([pscustomobject] $Handoff)

    @"
Related to #$($Handoff.ChildIssueNumber)
Related to #$($Handoff.CoordinatorIssueNumber)

Adds controlled child execution fixture delivery.

Changes:
- Executes one prepared child task from the handoff
- Reports validation freshness and PR readiness

Validation:
- ``prepared child validation``
- ``git diff --check``
"@
}

function Test-PrBody {
    param([string] $Body)

    $closingPattern = '(?im)\b(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#\d+'
    $relatedReferences = @([regex]::Matches($Body, '(?im)^Related to #\d+\s*$') | ForEach-Object { $_.Value.Trim() })

    [pscustomobject]@{
        RelatedReferences = $relatedReferences
        HasTwoRelatedReferences = $relatedReferences.Count -eq 2
        HasClosingKeyword = $Body -match $closingPattern
    }
}

function Get-PrReadiness {
    param(
        [string[]] $ValidationStatuses,
        [bool] $HasBlocker = $false,
        [bool] $PrTargetValid = $true,
        [bool] $PrBodyValid = $true
    )

    $nonPassed = @($ValidationStatuses | Where-Object { $_ -ne 'passed' })
    $ready = $nonPassed.Count -eq 0 -and -not $HasBlocker -and $PrTargetValid -and $PrBodyValid
    [pscustomobject]@{
        Status = if ($ready) { 'ready' } else { 'draft' }
        Reason = if ($ready) { 'required validation is fresh and passed' } else { 'required validation is incomplete, stale, failed, blocked, or PR delivery rules are not satisfied' }
        ValidationStatuses = $ValidationStatuses
        NonPassedStatuses = $nonPassed
        HasBlocker = $HasBlocker
    }
}

function New-FinalReport {
    param(
        [pscustomobject] $Handoff,
        [string[]] $ChangedFiles,
        [pscustomobject] $Readiness
    )

    [pscustomobject]@{
        ChildIssue = "#$($Handoff.ChildIssueNumber)"
        CoordinatorIssue = "#$($Handoff.CoordinatorIssueNumber)"
        PreparedArtifacts = @($Handoff.PreparedSpec, $Handoff.PreparedPlan, $Handoff.PreparedTasks)
        ChangedFiles = $ChangedFiles
        Validation = @(
            [pscustomobject]@{ Command = 'prepared child validation'; Status = 'passed'; Freshness = 'fresh' },
            [pscustomobject]@{ Command = 'git diff --check'; Status = 'passed'; Freshness = 'fresh' }
        )
        PrUrl = 'https://github.com/TheZenithPassage/catworld/pull/9902'
        PrReadiness = $Readiness.Status
        ReadinessReason = $Readiness.Reason
        Blockers = @()
        RemainingRisks = @()
        CoordinatorBranch = $Handoff.CoordinatorBranch
        ChildBranch = $Handoff.ChildBranch
        PrTargetBranch = $Handoff.PrTargetBranch
        CommitHashes = @('0000000000000000000000000000000000009902')
        CurrentCheckoutBranch = $Handoff.ChildBranch
    }
}

function Assert-FinalReport {
    param([pscustomobject] $Report)

    $required = @(
        'ChildIssue',
        'CoordinatorIssue',
        'PreparedArtifacts',
        'ChangedFiles',
        'Validation',
        'PrUrl',
        'PrReadiness',
        'Blockers',
        'RemainingRisks',
        'CoordinatorBranch',
        'ChildBranch',
        'PrTargetBranch',
        'CommitHashes',
        'CurrentCheckoutBranch'
    )

    foreach ($field in $required) {
        Assert-Condition ($Report.PSObject.Properties.Name.Contains($field)) "Final report missing $field."
    }

    Assert-Condition ($Report.Validation.Count -gt 0) 'Final report must include validation evidence.'
    Assert-Condition (@($Report.Validation | Where-Object { [string]::IsNullOrWhiteSpace($_.Status) }).Count -eq 0) 'Each validation item must include an explicit status.'
}

switch ($Scenario) {
    'valid-handoff' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff
            $handoff.ExpectedCheckout = $fixture.Root
            $result = Invoke-ChildExecution -Repository $fixture.Root -Handoff $handoff
            $bodyCheck = Test-PrBody -Body (New-ChildPrBody -Handoff $handoff)
            $readiness = Get-PrReadiness -ValidationStatuses @('passed', 'passed') -PrBodyValid:(-not $bodyCheck.HasClosingKeyword) -PrTargetValid:($handoff.PrTargetBranch -eq $handoff.CoordinatorBranch)

            Assert-Condition ($readiness.Status -eq 'ready') 'Valid handoff with fresh passed validation should be ready.'
            Assert-Condition $bodyCheck.HasTwoRelatedReferences 'PR body must include child and coordinator related references.'
            Assert-Condition (-not $bodyCheck.HasClosingKeyword) 'PR body must not include closing keywords.'

            [pscustomobject]@{
                Scenario = 'valid-handoff'
                Result = 'passed'
                ChildIssue = "#$($handoff.ChildIssueNumber)"
                CoordinatorIssue = "#$($handoff.CoordinatorIssueNumber)"
                CheckoutMatches = $result.Context.CheckoutMatches
                BranchMatches = $result.Context.BranchMatches
                TasksExecuted = $result.TasksExecuted
                ChangedFiles = $result.ChangedFiles
                PlanningRegenerationAttempted = $result.PlanningRegenerationAttempted
                PrTargetBranch = $handoff.PrTargetBranch
                PrReadiness = $readiness.Status
            } | ConvertTo-Json -Depth 6
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'missing-context' {
        $handoff = New-PreparedHandoff -Complete:$false
        $missing = @(Test-HandoffCompleteness -Handoff $handoff)
        Assert-Condition ($missing.Count -gt 0) 'Expected incomplete handoff to report missing context.'

        [pscustomobject]@{
            Scenario = 'missing-context'
            Result = 'passed'
            ImplementationBlocked = $true
            MissingFields = $missing
            PlanningRegenerationAttempted = $false
        } | ConvertTo-Json -Depth 5
    }
    'wrong-checkout' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff
            $handoff.ExpectedCheckout = Join-Path $fixture.Root 'not-the-child-worktree'
            $context = Test-ChildContext -Repository $fixture.Root -Handoff $handoff

            Assert-Condition (-not $context.CheckoutMatches) 'Expected checkout mismatch to block child implementation.'
            Assert-Condition $context.BranchMatches 'Fixture branch should still match so the scenario isolates checkout mismatch.'

            [pscustomobject]@{
                Scenario = 'wrong-checkout'
                Result = 'passed'
                ImplementationBlocked = $true
                CheckoutMatches = $context.CheckoutMatches
                BranchMatches = $context.BranchMatches
                CurrentRoot = $context.CurrentRoot
                ExpectedRoot = $context.ExpectedRoot
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'pr-wording' {
        $handoff = New-PreparedHandoff
        $body = New-ChildPrBody -Handoff $handoff
        $check = Test-PrBody -Body $body

        Assert-Condition $check.HasTwoRelatedReferences 'Expected exactly two Related to issue references.'
        Assert-Condition ($check.RelatedReferences -contains 'Related to #9902') 'Expected child issue Related to reference.'
        Assert-Condition ($check.RelatedReferences -contains 'Related to #9901') 'Expected coordinator issue Related to reference.'
        Assert-Condition (-not $check.HasClosingKeyword) 'Expected no closing keywords.'

        [pscustomobject]@{
            Scenario = 'pr-wording'
            Result = 'passed'
            RelatedReferences = $check.RelatedReferences
            HasClosingKeyword = $check.HasClosingKeyword
            Body = $body
        } | ConvertTo-Json -Depth 5
    }
    'pr-target' {
        $valid = New-PreparedHandoff
        $invalid = New-PreparedHandoff -PrTargetBranch 'main'
        $validTarget = $valid.PrTargetBranch -eq $valid.CoordinatorBranch -and $valid.PrTargetBranch -ne 'main'
        $invalidTargetBlocked = $invalid.PrTargetBranch -ne $invalid.CoordinatorBranch -or $invalid.PrTargetBranch -eq 'main'

        Assert-Condition $validTarget 'Expected coordinator branch target to be valid.'
        Assert-Condition $invalidTargetBlocked 'Expected main target to be blocked.'

        [pscustomobject]@{
            Scenario = 'pr-target'
            Result = 'passed'
            ValidTarget = $valid.PrTargetBranch
            InvalidTarget = $invalid.PrTargetBranch
            MainTargetBlocked = $invalidTargetBlocked
        } | ConvertTo-Json -Depth 5
    }
    'readiness' {
        $nonPassedStatuses = @('failed', 'skipped', 'timed out', 'interrupted', 'partial', 'stale', 'blocked', 'not run')
        $passedReadiness = Get-PrReadiness -ValidationStatuses @('passed', 'passed')
        $draftResults = @($nonPassedStatuses | ForEach-Object {
            Get-PrReadiness -ValidationStatuses @('passed', $_)
        })

        Assert-Condition ($passedReadiness.Status -eq 'ready') 'Expected all-passed validation to be ready.'
        Assert-Condition (@($draftResults | Where-Object { $_.Status -ne 'draft' }).Count -eq 0) 'Expected every non-passed validation status to produce draft/not-ready.'
        Assert-Condition (@($draftResults | Where-Object { $_.NonPassedStatuses.Count -eq 0 }).Count -eq 0) 'Expected every draft result to preserve non-passed status.'

        [pscustomobject]@{
            Scenario = 'readiness'
            Result = 'passed'
            PassedValidationReadiness = $passedReadiness.Status
            DraftStatusesCovered = $nonPassedStatuses
            DraftResults = $draftResults
        } | ConvertTo-Json -Depth 6
    }
    'final-report' {
        $handoff = New-PreparedHandoff
        $readiness = Get-PrReadiness -ValidationStatuses @('passed', 'passed')
        $report = New-FinalReport -Handoff $handoff -ChangedFiles @('child-work-9902.md') -Readiness $readiness
        Assert-FinalReport -Report $report

        [pscustomobject]@{
            Scenario = 'final-report'
            Result = 'passed'
            Report = $report
        } | ConvertTo-Json -Depth 6
    }
    'prohibited-operations' {
        $handoff = New-PreparedHandoff
        $prohibited = @(
            'merge',
            'approve',
            'enable auto-merge',
            'mutate GitHub issues',
            'post public comments',
            'delete remote branches',
            'rebase',
            'force-push',
            'clean local sidecar resources'
        )
        $missing = @($prohibited | Where-Object { $handoff.ProhibitedOperations -notcontains $_ })
        Assert-Condition ($missing.Count -eq 0) "Missing prohibited operations: $($missing -join ', ')"

        [pscustomobject]@{
            Scenario = 'prohibited-operations'
            Result = 'passed'
            ProhibitedOperations = $handoff.ProhibitedOperations
            MissingProhibitions = $missing
        } | ConvertTo-Json -Depth 5
    }
}
