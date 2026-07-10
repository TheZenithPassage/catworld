param(
    [ValidateSet(
        'independent',
        'hard-dependencies',
        'shared-contract-blocker',
        'unavailable-child-agent',
        'handoff-content'
    )]
    [string] $Scenario = 'independent'
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

function New-Child {
    param(
        [int] $Number,
        [string] $Title,
        [int[]] $Dependencies = @(),
        [string] $SharedContractState = 'ready',
        [string] $ConflictRisk = 'none'
    )

    $slug = ConvertTo-SidecarSlug -Title $Title

    [pscustomobject]@{
        Number = $Number
        Title = $Title
        Body = "Implement child issue #$Number scope only."
        State = 'open'
        Labels = @('workflow', 'chore')
        Dependencies = @($Dependencies)
        SourceReferences = @("Issue #$Number", 'Parent epic #249')
        ArtifactPath = "specs/$Number-$slug"
        SpecPath = "specs/$Number-$slug/spec.md"
        PlanPath = "specs/$Number-$slug/plan.md"
        TasksPath = "specs/$Number-$slug/tasks.md"
        SharedContractState = $SharedContractState
        ConflictRisk = $ConflictRisk
        PreparedArtifacts = $true
        BranchReady = $true
        WorktreeReady = $true
        ValidationRequirementsReady = $true
        PrTargetRulesReady = $true
        OutOfScopeReady = $true
    }
}

function New-Fixture {
    param(
        [ValidateSet('independent', 'hard-dependencies', 'shared-contract-blocker')]
        [string] $Kind = 'independent',
        [bool] $ChildAgentAvailable = $true
    )

    $mergedChildIssues = @()
    $children = switch ($Kind) {
        'independent' {
            @(
                New-Child -Number 9902 -Title '[Workflow] Child routing fixture'
                New-Child -Number 9903 -Title '[Workflow] Child reporting fixture'
                New-Child -Number 9904 -Title '[Workflow] Child resume fixture'
            )
        }
        'hard-dependencies' {
            $mergedChildIssues = @(9899)
            @(
                New-Child -Number 9902 -Title '[Workflow] Child routing fixture'
                New-Child -Number 9903 -Title '[Workflow] Child reporting fixture' -Dependencies @(9902)
                New-Child -Number 9904 -Title '[Workflow] Child resume fixture' -Dependencies @(9903)
                New-Child -Number 9905 -Title '[Workflow] Child later ready fixture' -Dependencies @(9899)
            )
        }
        'shared-contract-blocker' {
            @(
                New-Child -Number 9902 -Title '[Workflow] Child routing fixture' -SharedContractState 'blocked'
                New-Child -Number 9903 -Title '[Workflow] Child reporting fixture' -SharedContractState 'blocked'
                New-Child -Number 9904 -Title '[Workflow] Child resume fixture' -SharedContractState 'blocked'
            )
        }
    }

    [pscustomobject]@{
        RunId = 'sidecar-run-9901-dependency-layer-fanout'
        CoordinatorNumber = 9901
        CoordinatorTitle = '[Workflow] Dependency layer fan-out coordinator'
        CoordinatorUrl = 'https://github.com/TheZenithPassage/catworld/issues/9901'
        CoordinatorState = 'open'
        CoordinatorLabels = @('workflow', 'coordinator')
        CoordinatorBranch = 'sidecar/9901-dependency-layer-fanout-coordinator'
        CoordinatorRemoteBranch = 'origin/sidecar/9901-dependency-layer-fanout-coordinator'
        CoordinatorWorktree = '<sidecar-parent>/9901-dependency-layer-fanout-coordinator'
        SharedContract = 'Shared implementation contract is present and non-conflicting.'
        ParentReferences = @('Parent epic: #249', 'Source: issue #255 simulation')
        MergedChildIssues = @($mergedChildIssues)
        ChildAgentAvailable = $ChildAgentAvailable
        Children = @($children)
    }
}

function Test-ChildPrerequisites {
    param(
        [pscustomobject] $Fixture,
        [pscustomobject] $Child
    )

    $missing = @()
    if (-not $Child.PreparedArtifacts) { $missing += 'prepared child artifacts' }
    if (-not $Child.BranchReady) { $missing += 'child branch context' }
    if (-not $Child.WorktreeReady) { $missing += 'child worktree context' }
    if (-not $Child.ValidationRequirementsReady) { $missing += 'validation requirements' }
    if (-not $Child.PrTargetRulesReady) { $missing += 'PR target rules' }
    if (-not $Child.OutOfScopeReady) { $missing += 'out-of-scope boundaries' }
    if ([string]::IsNullOrWhiteSpace($Fixture.SharedContract)) { $missing += 'shared implementation contract' }

    $missing
}

function New-PreparedHandoff {
    param(
        [pscustomobject] $Fixture,
        [pscustomobject] $Child,
        [int] $DependencyLayer
    )

    [pscustomobject]@{
        ChildIssueNumber = $Child.Number
        ChildIssueTitle = $Child.Title
        ChildIssueBody = $Child.Body
        ChildIssueState = $Child.State
        ChildIssueLabels = $Child.Labels
        ChildDependencies = $Child.Dependencies
        ChildSourceReferences = $Child.SourceReferences
        CoordinatorIssueNumber = $Fixture.CoordinatorNumber
        CoordinatorContext = "Coordinator #$($Fixture.CoordinatorNumber): $($Fixture.CoordinatorTitle)"
        CoordinatorSourceReferences = $Fixture.ParentReferences
        PreparedSpec = $Child.SpecPath
        PreparedPlan = $Child.PlanPath
        PreparedTasks = $Child.TasksPath
        PreparedArtifactPath = $Child.ArtifactPath
        SharedContract = $Fixture.SharedContract
        DependencyLayer = $DependencyLayer
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorRemoteBranch = $Fixture.CoordinatorRemoteBranch
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
        ChildBranch = "sidecar/$($Child.Number)-$(ConvertTo-SidecarSlug $Child.Title)"
        ChildWorktree = "<sidecar-parent>/$($Child.Number)-$(ConvertTo-SidecarSlug $Child.Title)"
        ValidationRequirements = @('Run prepared child validation', 'Run git diff --check')
        PrTargetRules = 'Child PR targets the coordinator branch and uses Related to wording only.'
        OutOfScopeBoundaries = @('Sibling child scope', 'GitHub issue mutation', 'main-targeted child PR')
        Prohibitions = @(
            'Do not regenerate spec.md, plan.md, or tasks.md.',
            'Do not redefine shared contracts.',
            'Do not create sibling scope.',
            'Do not mutate GitHub issues, labels, comments, milestones, or assignees.',
            'Do not target main for sidecar child branches or child PRs.'
        )
    }
}

function Get-ReadyLayer {
    param([pscustomobject] $Fixture)

    $merged = @($Fixture.MergedChildIssues)
    $candidates = @($Fixture.Children | Where-Object {
        $unmet = @($_.Dependencies | Where-Object { $merged -notcontains $_ })
        $unmet.Count -eq 0
    })

    if ($candidates.Count -eq 0) {
        return $null
    }

    $minDependencyCount = (@($candidates | ForEach-Object { $_.Dependencies.Count }) | Measure-Object -Minimum).Minimum
    @($candidates | Where-Object { $_.Dependencies.Count -eq $minDependencyCount })
}

function Invoke-FanOut {
    param([pscustomobject] $Fixture)

    $statuses = @()
    $handoffs = @()
    $fanOutStopped = $false
    $capabilityBlocker = ''

    if (-not $Fixture.ChildAgentAvailable) {
        $fanOutStopped = $true
        $capabilityBlocker = 'Child-agent/subagent execution capability is unavailable.'
    }

    $readyLayer = if ($fanOutStopped) { @() } else { @(Get-ReadyLayer -Fixture $Fixture) }
    $readyNumbers = @($readyLayer | ForEach-Object { $_.Number })

    foreach ($child in $Fixture.Children) {
        $status = 'pending'
        $reason = 'Pending because it belongs to a later dependency-ready layer; only the first dependency-ready layer launches now.'
        $layer = if ($child.Dependencies.Count -eq 0) { 1 } else { $child.Dependencies.Count + 1 }

        $unmetDependencies = @($child.Dependencies | Where-Object { $Fixture.MergedChildIssues -notcontains $_ })
        if ($capabilityBlocker) {
            $status = 'blocked'
            $reason = $capabilityBlocker
        } elseif ($unmetDependencies.Count -gt 0) {
            $status = 'waiting-for-dependency-merge'
            $reason = "Waiting for dependency merge: #$($unmetDependencies -join ', #')"
        } elseif ($readyNumbers -contains $child.Number) {
            $missing = @(Test-ChildPrerequisites -Fixture $Fixture -Child $child)
            if ($missing.Count -gt 0) {
                $status = 'blocked'
                $reason = "Missing prerequisite: $($missing -join ', ')"
            } elseif ($child.SharedContractState -ne 'ready') {
                $status = 'blocked'
                $reason = 'Shared-contract blocker requires resolution before fan-out.'
            } elseif ($child.ConflictRisk -ne 'none') {
                $status = 'blocked'
                $reason = 'Non-mechanical conflict risk requires user guidance.'
            } else {
                $status = 'launched'
                $reason = 'Launched in the first dependency-ready layer.'
                $handoffs += New-PreparedHandoff -Fixture $Fixture -Child $child -DependencyLayer $layer
            }
        }

        $statuses += [pscustomobject]@{
            Child = "#$($child.Number)"
            Layer = $layer
            Status = $status
            Reason = $reason
        }
    }

    [pscustomobject]@{
        FanOutStopped = $fanOutStopped
        CapabilityBlocker = $capabilityBlocker
        SequentialFallbackAttempted = $false
        FirstDependencyReadyLayer = @($readyNumbers)
        LaunchStatuses = $statuses
        Handoffs = $handoffs
    }
}

function Assert-HandoffContent {
    param([pscustomobject] $Handoff)

    $requiredFields = @(
        'CoordinatorContext',
        'ChildIssueBody',
        'PreparedSpec',
        'PreparedPlan',
        'PreparedTasks',
        'SharedContract',
        'DependencyLayer',
        'CoordinatorBranch',
        'CoordinatorRemoteBranch',
        'CoordinatorWorktree',
        'ChildBranch',
        'ChildWorktree',
        'ValidationRequirements',
        'PrTargetRules',
        'OutOfScopeBoundaries',
        'Prohibitions'
    )

    foreach ($field in $requiredFields) {
        $value = $Handoff.$field
        if ($value -is [array]) {
            Assert-Condition ($value.Count -gt 0) "Handoff field $field must not be empty."
        } else {
            Assert-Condition (-not [string]::IsNullOrWhiteSpace([string]$value)) "Handoff field $field must not be empty."
        }
    }

    Assert-Condition ($Handoff.ChildIssueNumber -eq 9902) 'Handoff must name exactly one child issue.'
    $prohibitionText = $Handoff.Prohibitions -join "`n"
    Assert-Condition ($prohibitionText -match 'regenerate') 'Handoff must prohibit planning artifact regeneration.'
    Assert-Condition ($prohibitionText -match 'shared contracts') 'Handoff must prohibit shared contract redefinition.'
    Assert-Condition ($prohibitionText -match 'sibling scope') 'Handoff must prohibit sibling scope.'
    Assert-Condition ($prohibitionText -match 'GitHub issues') 'Handoff must prohibit issue mutation.'
    Assert-Condition ($prohibitionText -match 'main') 'Handoff must prohibit main-targeted child work.'

    $requiredFields
}

switch ($Scenario) {
    'independent' {
        $fixture = New-Fixture -Kind 'independent'
        $result = Invoke-FanOut -Fixture $fixture

        Assert-Condition ($result.Handoffs.Count -eq 3) 'Expected three handoffs for independent first layer.'
        Assert-Condition (@($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' }).Count -eq 3) 'Expected three launched children.'
        Assert-Condition (-not $result.FanOutStopped) 'Fan-out should not stop for independent ready children.'

        [pscustomobject]@{
            Scenario = 'independent'
            Result = 'passed'
            FirstDependencyReadyLayer = $result.FirstDependencyReadyLayer
            LaunchedChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' } | ForEach-Object { $_.Child })
            HandoffCount = $result.Handoffs.Count
            LaunchStatuses = $result.LaunchStatuses
        } | ConvertTo-Json -Depth 6
    }
    'hard-dependencies' {
        $fixture = New-Fixture -Kind 'hard-dependencies'
        $result = Invoke-FanOut -Fixture $fixture
        $pendingChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'pending' })
        $pendingChild = @($pendingChildren)[0]
        $pendingFixtureChild = @($fixture.Children | Where-Object { "#$($_.Number)" -eq $pendingChild.Child })[0]
        $pendingUnmetDependencies = @($pendingFixtureChild.Dependencies | Where-Object { $fixture.MergedChildIssues -notcontains $_ })
        $pendingHandoffs = @($result.Handoffs | Where-Object { "#$($_.ChildIssueNumber)" -eq $pendingChild.Child })
        $launchedLayers = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' } | ForEach-Object { $_.Layer })
        $firstLaunchedLayer = ($launchedLayers | Measure-Object -Minimum).Minimum

        Assert-Condition ($result.Handoffs.Count -eq 1) 'Expected exactly one handoff for the first hard-dependency layer.'
        Assert-Condition (@($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' }).Count -eq 1) 'Expected only the first dependency-ready layer to launch.'
        Assert-Condition (@($result.LaunchStatuses | Where-Object { $_.Status -eq 'waiting-for-dependency-merge' }).Count -eq 2) 'Expected two children waiting for dependency merges.'
        Assert-Condition ($pendingChildren.Count -eq 1) 'Expected one later ready child to remain pending.'
        Assert-Condition ($pendingChild.Layer -gt $firstLaunchedLayer) 'Expected pending child to belong to a later dependency-ready layer.'
        Assert-Condition (-not [string]::IsNullOrWhiteSpace($pendingChild.Reason)) 'Expected pending child to include a non-empty reason.'
        Assert-Condition ($pendingChild.Reason -match 'later dependency-ready layer') 'Expected pending reason to explain that a later layer was not launched.'
        Assert-Condition ($pendingUnmetDependencies.Count -eq 0) 'Expected pending child to have no unmet dependency merges.'
        Assert-Condition (@(Test-ChildPrerequisites -Fixture $fixture -Child $pendingFixtureChild).Count -eq 0) 'Expected pending child to be otherwise handoff-ready.'
        Assert-Condition ($pendingHandoffs.Count -eq 0) 'Expected no handoff for the later pending child.'

        [pscustomobject]@{
            Scenario = 'hard-dependencies'
            Result = 'passed'
            FirstDependencyReadyLayer = $result.FirstDependencyReadyLayer
            LaunchedChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' } | ForEach-Object { $_.Child })
            PendingChildren = @($pendingChildren | ForEach-Object { $_.Child })
            PendingReasons = @($pendingChildren | ForEach-Object { $_.Reason })
            WaitingForDependencyMerge = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'waiting-for-dependency-merge' } | ForEach-Object { $_.Child })
            LaunchStatuses = $result.LaunchStatuses
        } | ConvertTo-Json -Depth 6
    }
    'shared-contract-blocker' {
        $fixture = New-Fixture -Kind 'shared-contract-blocker'
        $result = Invoke-FanOut -Fixture $fixture

        Assert-Condition ($result.Handoffs.Count -eq 0) 'Expected no handoffs while shared-contract blockers remain.'
        Assert-Condition (@($result.LaunchStatuses | Where-Object { $_.Status -eq 'blocked' }).Count -eq 3) 'Expected all affected children to be blocked.'

        [pscustomobject]@{
            Scenario = 'shared-contract-blocker'
            Result = 'passed'
            LaunchedChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' } | ForEach-Object { $_.Child })
            BlockedChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'blocked' } | ForEach-Object { $_.Child })
            HandoffCount = $result.Handoffs.Count
            LaunchStatuses = $result.LaunchStatuses
        } | ConvertTo-Json -Depth 6
    }
    'unavailable-child-agent' {
        $fixture = New-Fixture -Kind 'independent' -ChildAgentAvailable:$false
        $result = Invoke-FanOut -Fixture $fixture

        Assert-Condition $result.FanOutStopped 'Expected fan-out to stop when child-agent capability is unavailable.'
        Assert-Condition ($result.Handoffs.Count -eq 0) 'Expected no handoffs when child-agent capability is unavailable.'
        Assert-Condition (-not $result.SequentialFallbackAttempted) 'Sequential fallback must not be attempted.'

        [pscustomobject]@{
            Scenario = 'unavailable-child-agent'
            Result = 'passed'
            FanOutStopped = $result.FanOutStopped
            CapabilityBlocker = $result.CapabilityBlocker
            SequentialFallbackAttempted = $result.SequentialFallbackAttempted
            HandoffCount = $result.Handoffs.Count
            LaunchStatuses = $result.LaunchStatuses
        } | ConvertTo-Json -Depth 6
    }
    'handoff-content' {
        $fixture = New-Fixture -Kind 'independent'
        $result = Invoke-FanOut -Fixture $fixture
        $handoff = @($result.Handoffs)[0]
        $requiredFields = Assert-HandoffContent -Handoff $handoff

        [pscustomobject]@{
            Scenario = 'handoff-content'
            Result = 'passed'
            ChildIssueNumber = $handoff.ChildIssueNumber
            RequiredFieldCount = $requiredFields.Count
            RequiredFields = $requiredFields
            Prohibitions = $handoff.Prohibitions
            PrTargetRules = $handoff.PrTargetRules
        } | ConvertTo-Json -Depth 6
    }
}
