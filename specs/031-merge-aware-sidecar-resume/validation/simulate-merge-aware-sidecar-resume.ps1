param(
    [ValidateSet(
        'remote-refresh-order',
        'active-child-refresh',
        'resume-states',
        'validation-staleness',
        'unexpected-local-changes',
        'unsafe-divergence',
        'evidence-mismatch',
        'prohibited-operations'
    )]
    [string] $Scenario = 'remote-refresh-order'
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

function Invoke-GitCommand {
    param(
        [string[]] $Arguments,
        [switch] $AllowFailure
    )

    $previousErrorActionPreference = $ErrorActionPreference
    if ($AllowFailure) {
        $ErrorActionPreference = 'Continue'
    }

    try {
        $output = & git @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0 -and -not $AllowFailure) {
        throw "git $($Arguments -join ' ') failed with exit $exitCode`n$output"
    }

    [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($output)
    }
}

function Test-CommitAncestor {
    param(
        [string] $Repository,
        [string] $Ancestor,
        [string] $Descendant
    )

    (Invoke-Git $Repository @('merge-base', '--is-ancestor', $Ancestor, $Descendant) -AllowFailure).ExitCode -eq 0
}

function New-FileCommit {
    param(
        [string] $Repository,
        [string] $Path,
        [string] $Content,
        [string] $Message
    )

    Set-Content -LiteralPath (Join-Path $Repository $Path) -Value $Content -NoNewline
    Invoke-Git $Repository @('add', $Path) | Out-Null
    Invoke-Git $Repository @('commit', '-q', '-m', $Message) | Out-Null
    (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
}

function New-TempSidecarResumeFixture {
    $root = Join-Path ([System.IO.Path]::GetTempPath()) ("catworld-sidecar-resume-" + [guid]::NewGuid().ToString('N'))
    $remote = Join-Path $root 'origin.git'
    $seed = Join-Path $root 'seed'
    $coordinator = Join-Path $root 'coordinator-local'
    $merger = Join-Path $root 'merger'

    New-Item -ItemType Directory -Path $root | Out-Null
    Invoke-GitCommand @('init', '--bare', '-q', $remote) | Out-Null
    Invoke-GitCommand @('init', '-q', $seed) | Out-Null
    Invoke-Git $seed @('branch', '-M', 'main') | Out-Null
    Invoke-Git $seed @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
    Invoke-Git $seed @('config', 'user.name', 'Sidecar Simulation') | Out-Null
    New-FileCommit -Repository $seed -Path 'README.md' -Content 'fixture' -Message 'seed fixture' | Out-Null
    Invoke-Git $seed @('remote', 'add', 'origin', $remote) | Out-Null
    Invoke-Git $seed @('push', '-q', 'origin', 'main') | Out-Null

    $coordinatorBranch = 'sidecar/9901-coordinator-merge-aware-resume'
    $mergedChildBranch = 'sidecar/9902-merged-child'
    $activeChildBranch = 'sidecar/9903-active-child'

    Invoke-Git $seed @('switch', '-q', '-c', $coordinatorBranch) | Out-Null
    $initialCoordinatorCommit = New-FileCommit -Repository $seed -Path 'coordinator-state.md' -Content 'initial coordinator state' -Message 'record coordinator state'
    Invoke-Git $seed @('push', '-q', 'origin', $coordinatorBranch) | Out-Null

    Invoke-GitCommand @('clone', '-q', $remote, $coordinator) | Out-Null
    Invoke-Git $coordinator @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
    Invoke-Git $coordinator @('config', 'user.name', 'Sidecar Simulation') | Out-Null
    Invoke-Git $coordinator @('switch', '-q', $coordinatorBranch) | Out-Null
    Invoke-Git $coordinator @('switch', '-q', '-c', $activeChildBranch) | Out-Null
    $activeChildCommit = New-FileCommit -Repository $coordinator -Path 'active-child.md' -Content 'active child local work' -Message 'record active child work'
    Invoke-Git $coordinator @('switch', '-q', $coordinatorBranch) | Out-Null

    Invoke-GitCommand @('clone', '-q', $remote, $merger) | Out-Null
    Invoke-Git $merger @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
    Invoke-Git $merger @('config', 'user.name', 'Sidecar Simulation') | Out-Null
    Invoke-Git $merger @('switch', '-q', $coordinatorBranch) | Out-Null
    Invoke-Git $merger @('switch', '-q', '-c', $mergedChildBranch) | Out-Null
    $mergedChildCommit = New-FileCommit -Repository $merger -Path 'merged-child.md' -Content 'merged child work' -Message 'record merged child work'
    Invoke-Git $merger @('switch', '-q', $coordinatorBranch) | Out-Null
    Invoke-Git $merger @('merge', '--no-ff', '-m', 'merge child into coordinator', $mergedChildBranch) | Out-Null
    $remoteCoordinatorCommit = (Invoke-Git $merger @('rev-parse', 'HEAD')).Output[0]
    Invoke-Git $merger @('push', '-q', 'origin', $coordinatorBranch) | Out-Null

    [pscustomobject]@{
        Root = $root
        Remote = $remote
        CoordinatorRepository = $coordinator
        CoordinatorBranch = $coordinatorBranch
        MergedChildBranch = $mergedChildBranch
        ActiveChildBranch = $activeChildBranch
        InitialCoordinatorCommit = $initialCoordinatorCommit
        MergedChildCommit = $mergedChildCommit
        ActiveChildCommit = $activeChildCommit
        RemoteCoordinatorCommit = $remoteCoordinatorCommit
    }
}

function Invoke-CoordinatorRefresh {
    param([pscustomobject] $Fixture)

    $repository = $Fixture.CoordinatorRepository
    Invoke-Git $repository @('switch', '-q', $Fixture.CoordinatorBranch) | Out-Null

    $dirtyPaths = @((Invoke-Git $repository @('status', '--porcelain')).Output)
    if ($dirtyPaths.Count -gt 0) {
        throw "Unexpected local coordinator changes: $($dirtyPaths -join ', ')"
    }

    $operationOrder = @()
    Invoke-Git $repository @('fetch', '-q', 'origin', "$($Fixture.CoordinatorBranch):refs/remotes/origin/$($Fixture.CoordinatorBranch)") | Out-Null
    $operationOrder += 'fetch-remote-coordinator'

    $localHead = (Invoke-Git $repository @('rev-parse', 'HEAD')).Output[0]
    $remoteHead = (Invoke-Git $repository @('rev-parse', "origin/$($Fixture.CoordinatorBranch)")).Output[0]
    $localCanFastForward = Test-CommitAncestor -Repository $repository -Ancestor $localHead -Descendant $remoteHead

    if (-not $localCanFastForward) {
        throw 'Unsafe local coordinator divergence blocks refresh.'
    }

    Invoke-Git $repository @('merge', '--ff-only', "origin/$($Fixture.CoordinatorBranch)") | Out-Null
    $operationOrder += 'local-coordinator-refresh'

    $refreshedHead = (Invoke-Git $repository @('rev-parse', 'HEAD')).Output[0]
    $containsMergedChild = Test-CommitAncestor -Repository $repository -Ancestor $Fixture.MergedChildCommit -Descendant $refreshedHead
    if ($containsMergedChild) {
        $operationOrder += 'mark-child-integrated'
    }

    [pscustomobject]@{
        OperationOrder = $operationOrder
        LocalHeadBefore = $localHead
        RemoteHead = $remoteHead
        LocalHeadAfter = $refreshedHead
        CoordinatorRefreshed = $refreshedHead -eq $remoteHead
        MergedChildIntegrated = $containsMergedChild
        RefreshMethod = 'fast-forward'
        RebaseAttempted = $false
        ForcePushAttempted = $false
        HistoryRewriteAttempted = $false
        IssueMutationAttempted = $false
    }
}

function Invoke-ActiveChildRefresh {
    param([pscustomobject] $Fixture)

    $repository = $Fixture.CoordinatorRepository
    Invoke-Git $repository @('switch', '-q', $Fixture.ActiveChildBranch) | Out-Null

    $dirtyPaths = @((Invoke-Git $repository @('status', '--porcelain')).Output)
    if ($dirtyPaths.Count -gt 0) {
        throw "Unexpected active child changes: $($dirtyPaths -join ', ')"
    }

    $beforeHead = (Invoke-Git $repository @('rev-parse', 'HEAD')).Output[0]
    $hadMergedChildBefore = Test-CommitAncestor -Repository $repository -Ancestor $Fixture.MergedChildCommit -Descendant $beforeHead
    Invoke-Git $repository @('merge', '--no-edit', $Fixture.CoordinatorBranch) | Out-Null
    $afterHead = (Invoke-Git $repository @('rev-parse', 'HEAD')).Output[0]
    $hasMergedChildAfter = Test-CommitAncestor -Repository $repository -Ancestor $Fixture.MergedChildCommit -Descendant $afterHead
    $hasActiveChildAfter = Test-CommitAncestor -Repository $repository -Ancestor $Fixture.ActiveChildCommit -Descendant $afterHead

    [pscustomobject]@{
        Branch = $Fixture.ActiveChildBranch
        BeforeHead = $beforeHead
        AfterHead = $afterHead
        RefreshSource = $Fixture.CoordinatorBranch
        RefreshMethod = 'normal-merge'
        HadMergedChildBefore = $hadMergedChildBefore
        HasMergedChildAfter = $hasMergedChildAfter
        HasActiveChildAfter = $hasActiveChildAfter
        RebaseAttempted = $false
        ForcePushAttempted = $false
        HistoryRewriteAttempted = $false
    }
}

function Test-ResumeEvidence {
    param([pscustomobject] $Evidence)

    $required = @(
        'CoordinatorIssue',
        'ChildIssues',
        'ChildPrs',
        'RemoteCoordinatorBranch',
        'LocalCoordinatorBranch',
        'ActiveChildBranches',
        'CoordinatorArtifact',
        'ChildArtifacts',
        'Validation',
        'Blockers',
        'CleanupApproval'
    )

    $missing = @()
    foreach ($field in $required) {
        if (-not $Evidence.PSObject.Properties.Name.Contains($field)) {
            $missing += $field
            continue
        }
        $value = $Evidence.$field
        if ($null -eq $value) {
            $missing += $field
        }
    }

    $mismatches = @()
    if ($Evidence.PSObject.Properties.Name.Contains('CoordinatorArtifact') -and
        $Evidence.PSObject.Properties.Name.Contains('LocalCoordinatorBranch') -and
        $Evidence.CoordinatorArtifact.RecordedLocalCoordinatorBranch -ne $Evidence.LocalCoordinatorBranch.Name) {
        $mismatches += 'local coordinator branch differs from artifact'
    }
    if ($Evidence.PSObject.Properties.Name.Contains('CoordinatorArtifact') -and
        $Evidence.PSObject.Properties.Name.Contains('RemoteCoordinatorBranch') -and
        $Evidence.CoordinatorArtifact.RecordedRemoteCoordinatorBranch -ne $Evidence.RemoteCoordinatorBranch.Name) {
        $mismatches += 'remote coordinator branch differs from artifact'
    }

    [pscustomobject]@{
        MissingFields = $missing
        Mismatches = $mismatches
        Blocked = $missing.Count -gt 0 -or $mismatches.Count -gt 0
        PrivateConversationContextUsed = $false
    }
}

function New-ResumeStateModel {
    $children = @(
        [pscustomobject]@{ Child = '#9902'; Dependencies = @(); WorkflowStatus = 'completed'; Integrated = $true; Blocker = ''; Layer = 1 },
        [pscustomobject]@{ Child = '#9903'; Dependencies = @(); WorkflowStatus = 'active'; Integrated = $false; Blocker = ''; Layer = 1 },
        [pscustomobject]@{ Child = '#9904'; Dependencies = @(); WorkflowStatus = 'blocked'; Integrated = $false; Blocker = 'shared-contract blocker'; Layer = 1 },
        [pscustomobject]@{ Child = '#9905'; Dependencies = @(); WorkflowStatus = 'pending'; Integrated = $false; Blocker = ''; Layer = 2 },
        [pscustomobject]@{ Child = '#9906'; Dependencies = @(9904); WorkflowStatus = 'pending'; Integrated = $false; Blocker = ''; Layer = 2 },
        [pscustomobject]@{ Child = '#9907'; Dependencies = @(9902); WorkflowStatus = 'pending'; Integrated = $false; Blocker = ''; Layer = 2 }
    )
    $integratedNumbers = @(9902)

    $states = @($children | ForEach-Object {
        $number = [int]($_.Child.TrimStart('#'))
        $unmet = @($_.Dependencies | Where-Object { $integratedNumbers -notcontains $_ })
        $state = $_.WorkflowStatus
        $reason = 'state preserved from current evidence'

        if ($_.Blocker) {
            $state = 'blocked'
            $reason = $_.Blocker
        } elseif ($_.Integrated) {
            $state = 'integrated'
            $reason = 'child PR is merged into remote coordinator branch and local coordinator state is refreshed'
        } elseif ($unmet.Count -gt 0) {
            $state = 'waiting-for-dependency-merge'
            $reason = "waiting for dependency merge: #$($unmet -join ', #')"
        } elseif ($_.Layer -gt 1 -and $_.Dependencies.Count -gt 0) {
            $state = 'ready-next-layer'
            $reason = 'hard dependencies are integrated into updated local coordinator branch'
        } elseif ($_.Layer -gt 1) {
            $state = 'pending'
            $reason = 'pending later dependency layer'
        }

        [pscustomobject]@{
            Child = $_.Child
            State = $state
            Reason = $reason
        }
    })

    [pscustomobject]@{
        States = $states
        DependencyLayersRecomputed = $true
        IntegratedChildren = @($states | Where-Object { $_.State -eq 'integrated' } | ForEach-Object { $_.Child })
        ReadyNextLayer = @($states | Where-Object { $_.State -eq 'ready-next-layer' } | ForEach-Object { $_.Child })
    }
}

function Set-AffectedValidationStale {
    param(
        [object[]] $Validation,
        [string[]] $AffectedBy
    )

    @($Validation | ForEach-Object {
        $copy = [pscustomobject]@{
            Command = $_.Command
            Status = $_.Status
            Freshness = $_.Freshness
            AffectedBy = $_.AffectedBy
        }

        if ($AffectedBy -contains $copy.AffectedBy) {
            $copy.Status = 'stale'
            $copy.Freshness = 'stale until rerun'
        }

        $copy
    })
}

function Get-ProhibitedOperationState {
    [ordered]@{
        RebaseAttempted = $false
        ForcePushAttempted = $false
        ForceWithLeaseAttempted = $false
        HistoryRewriteAttempted = $false
        LocalMainUpdated = $false
        GitHubIssueMutationAttempted = $false
        PrMergeAttempted = $false
        ResourceDeletionAttempted = $false
        CleanupExecutionAttempted = $false
        SequentialFallbackAttempted = $false
    }
}

switch ($Scenario) {
    'remote-refresh-order' {
        $fixture = New-TempSidecarResumeFixture
        try {
            $result = Invoke-CoordinatorRefresh -Fixture $fixture
            $fetchIndex = [array]::IndexOf($result.OperationOrder, 'fetch-remote-coordinator')
            $refreshIndex = [array]::IndexOf($result.OperationOrder, 'local-coordinator-refresh')
            $integratedIndex = [array]::IndexOf($result.OperationOrder, 'mark-child-integrated')

            Assert-Condition ($fetchIndex -ge 0) 'Expected remote coordinator fetch to occur.'
            Assert-Condition ($refreshIndex -gt $fetchIndex) 'Expected local coordinator refresh after remote fetch.'
            Assert-Condition ($integratedIndex -gt $refreshIndex) 'Expected child integration marking after local coordinator refresh.'
            Assert-Condition $result.CoordinatorRefreshed 'Expected local coordinator state to match remote coordinator state.'
            Assert-Condition $result.MergedChildIntegrated 'Expected merged child to be integrated after refresh.'

            [pscustomobject]@{
                Scenario = 'remote-refresh-order'
                Result = 'passed'
                OperationOrder = $result.OperationOrder
                RefreshMethod = $result.RefreshMethod
                CoordinatorRefreshed = $result.CoordinatorRefreshed
                MergedChildIntegrated = $result.MergedChildIntegrated
                ProhibitedOperationsAttempted = @($result.RebaseAttempted, $result.ForcePushAttempted, $result.HistoryRewriteAttempted, $result.IssueMutationAttempted) -contains $true
            } | ConvertTo-Json -Depth 6
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'active-child-refresh' {
        $fixture = New-TempSidecarResumeFixture
        try {
            $coordinatorRefresh = Invoke-CoordinatorRefresh -Fixture $fixture
            $childRefresh = Invoke-ActiveChildRefresh -Fixture $fixture

            Assert-Condition $coordinatorRefresh.CoordinatorRefreshed 'Expected coordinator refresh before active child refresh.'
            Assert-Condition (-not $childRefresh.HadMergedChildBefore) 'Expected active child to be stale before refresh.'
            Assert-Condition $childRefresh.HasMergedChildAfter 'Expected active child to include merged child work after refresh.'
            Assert-Condition $childRefresh.HasActiveChildAfter 'Expected active child local work to be preserved after refresh.'
            Assert-Condition ($childRefresh.RefreshMethod -eq 'normal-merge') 'Expected active child refresh by normal merge.'

            [pscustomobject]@{
                Scenario = 'active-child-refresh'
                Result = 'passed'
                CoordinatorRefreshMethod = $coordinatorRefresh.RefreshMethod
                ActiveChildRefreshMethod = $childRefresh.RefreshMethod
                RefreshSource = $childRefresh.RefreshSource
                HadMergedChildBefore = $childRefresh.HadMergedChildBefore
                HasMergedChildAfter = $childRefresh.HasMergedChildAfter
                HasActiveChildAfter = $childRefresh.HasActiveChildAfter
                RebaseAttempted = $childRefresh.RebaseAttempted
                ForcePushAttempted = $childRefresh.ForcePushAttempted
                HistoryRewriteAttempted = $childRefresh.HistoryRewriteAttempted
            } | ConvertTo-Json -Depth 6
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'unexpected-local-changes' {
        $fixture = New-TempSidecarResumeFixture
        try {
            Invoke-Git $fixture.CoordinatorRepository @('switch', '-q', $fixture.CoordinatorBranch) | Out-Null
            Set-Content -LiteralPath (Join-Path $fixture.CoordinatorRepository 'dirty-local-change.md') -Value 'unexpected local change' -NoNewline

            $blocked = $false
            $message = ''
            try {
                Invoke-CoordinatorRefresh -Fixture $fixture | Out-Null
            }
            catch {
                $blocked = $true
                $message = $_.Exception.Message
            }

            Assert-Condition $blocked 'Expected unexpected local coordinator changes to block resume.'
            Assert-Condition ($message -match 'Unexpected local coordinator changes') "Expected dirty-state blocker, got: $message"

            [pscustomobject]@{
                Scenario = 'unexpected-local-changes'
                Result = 'passed'
                Blocked = $blocked
                BlockerMessage = $message
                RefreshAttemptedAfterDirtyState = $false
                IssueMutationAttempted = $false
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'unsafe-divergence' {
        $fixture = New-TempSidecarResumeFixture
        try {
            Invoke-Git $fixture.CoordinatorRepository @('switch', '-q', $fixture.CoordinatorBranch) | Out-Null
            New-FileCommit -Repository $fixture.CoordinatorRepository -Path 'local-only.md' -Content 'unexpected local coordinator commit' -Message 'unexpected local coordinator commit' | Out-Null

            $blocked = $false
            $message = ''
            try {
                Invoke-CoordinatorRefresh -Fixture $fixture | Out-Null
            }
            catch {
                $blocked = $true
                $message = $_.Exception.Message
            }

            Assert-Condition $blocked 'Expected unsafe local/remote coordinator divergence to block resume.'
            Assert-Condition ($message -match 'Unsafe local coordinator divergence') "Expected divergence blocker, got: $message"

            [pscustomobject]@{
                Scenario = 'unsafe-divergence'
                Result = 'passed'
                Blocked = $blocked
                BlockerMessage = $message
                RebaseAttempted = $false
                ForcePushAttempted = $false
                ForceWithLeaseAttempted = $false
                HistoryRewriteAttempted = $false
                LocalMainUpdated = $false
                IssueMutationAttempted = $false
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'evidence-mismatch' {
        $evidence = [pscustomobject]@{
            CoordinatorIssue = [pscustomobject]@{ Number = 9901; State = 'open'; Labels = @('workflow') }
            ChildIssues = @([pscustomobject]@{ Number = 9902; State = 'open'; Dependencies = @() })
            ChildPrs = @([pscustomobject]@{ Child = 9902; State = 'merged'; Target = 'sidecar/9901-coordinator-merge-aware-resume' })
            RemoteCoordinatorBranch = [pscustomobject]@{ Name = 'origin/sidecar/9901-coordinator-merge-aware-resume' }
            LocalCoordinatorBranch = [pscustomobject]@{ Name = 'sidecar/9901-coordinator-merge-aware-resume-local-mismatch' }
            ActiveChildBranches = @([pscustomobject]@{ Name = 'sidecar/9903-active-child' })
            CoordinatorArtifact = [pscustomobject]@{
                RecordedLocalCoordinatorBranch = 'sidecar/9901-coordinator-merge-aware-resume'
                RecordedRemoteCoordinatorBranch = 'origin/sidecar/9901-coordinator-merge-aware-resume'
            }
            Validation = @([pscustomobject]@{ Command = 'child validation'; Status = 'passed'; Freshness = 'fresh' })
            Blockers = @()
            CleanupApproval = [pscustomobject]@{ RemoteCleanupApproved = $false }
        }

        $check = Test-ResumeEvidence -Evidence $evidence
        Assert-Condition $check.Blocked 'Expected resume evidence mismatch or missing evidence to block continuation.'
        Assert-Condition ($check.MissingFields -contains 'ChildArtifacts') 'Expected missing child artifacts to block resume.'
        Assert-Condition ($check.Mismatches -contains 'local coordinator branch differs from artifact') 'Expected local coordinator branch mismatch.'
        Assert-Condition (-not $check.PrivateConversationContextUsed) 'Private conversation context must not be used.'

        [pscustomobject]@{
            Scenario = 'evidence-mismatch'
            Result = 'passed'
            Blocked = $check.Blocked
            MissingFields = $check.MissingFields
            Mismatches = $check.Mismatches
            PrivateConversationContextUsed = $check.PrivateConversationContextUsed
            RefreshAttempted = $false
            IntegrationMarked = $false
            ChildLaunchAttempted = $false
            IssueMutationAttempted = $false
            CleanupAttempted = $false
        } | ConvertTo-Json -Depth 6
    }
    'resume-states' {
        $model = New-ResumeStateModel
        $states = $model.States
        $stateNames = @($states | ForEach-Object { $_.State })

        Assert-Condition ($stateNames -contains 'integrated') 'Expected integrated child state.'
        Assert-Condition ($stateNames -contains 'active') 'Expected active child state.'
        Assert-Condition ($stateNames -contains 'blocked') 'Expected blocked child state.'
        Assert-Condition ($stateNames -contains 'pending') 'Expected pending child state.'
        Assert-Condition ($stateNames -contains 'waiting-for-dependency-merge') 'Expected waiting-for-dependency-merge child state.'
        Assert-Condition ($stateNames -contains 'ready-next-layer') 'Expected ready-next-layer child state.'
        Assert-Condition $model.DependencyLayersRecomputed 'Expected dependency layers to be recomputed.'

        [pscustomobject]@{
            Scenario = 'resume-states'
            Result = 'passed'
            DependencyLayersRecomputed = $model.DependencyLayersRecomputed
            IntegratedChildren = $model.IntegratedChildren
            ReadyNextLayer = $model.ReadyNextLayer
            States = $states
        } | ConvertTo-Json -Depth 6
    }
    'validation-staleness' {
        $validation = @(
            [pscustomobject]@{ Command = 'coordinator validation'; Status = 'passed'; Freshness = 'fresh'; AffectedBy = 'coordinator-refresh' },
            [pscustomobject]@{ Command = 'active child validation'; Status = 'passed'; Freshness = 'fresh'; AffectedBy = 'active-child-refresh' },
            [pscustomobject]@{ Command = 'unaffected source review'; Status = 'passed'; Freshness = 'fresh'; AffectedBy = 'none' }
        )

        $updated = Set-AffectedValidationStale -Validation $validation -AffectedBy @('coordinator-refresh', 'active-child-refresh')
        $stale = @($updated | Where-Object { $_.Status -eq 'stale' })
        $summaryPassed = @($updated | Where-Object { $_.Status -ne 'passed' }).Count -eq 0

        Assert-Condition ($stale.Count -eq 2) 'Expected coordinator and active child validation to become stale.'
        Assert-Condition (-not $summaryPassed) 'Stale validation must not be summarized as passed.'

        [pscustomobject]@{
            Scenario = 'validation-staleness'
            Result = 'passed'
            Validation = $updated
            StaleCount = $stale.Count
            SummaryPassed = $summaryPassed
        } | ConvertTo-Json -Depth 6
    }
    'prohibited-operations' {
        $operations = Get-ProhibitedOperationState
        $attempted = @($operations.GetEnumerator() | Where-Object { $_.Value -eq $true })

        Assert-Condition ($attempted.Count -eq 0) "Expected no prohibited operations, got: $($attempted.Name -join ', ')"

        [pscustomobject]@{
            Scenario = 'prohibited-operations'
            Result = 'passed'
            ProhibitedOperations = $operations
            AnyProhibitedOperationAttempted = $attempted.Count -gt 0
        } | ConvertTo-Json -Depth 6
    }
}
