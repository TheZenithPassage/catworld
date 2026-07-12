param(
    [ValidateSet(
        'valid-handoff',
        'missing-context',
        'wrong-checkout',
        'wrong-branch',
        'missing-delivery-permission',
        'delivery-denied',
        'pr-wording',
        'pr-target',
        'readiness',
        'final-report',
        'prohibited-operations',
        'held-preflight',
        'stable-child-identity',
        'durable-launched-release',
        'launch-push-failure',
        'refresh-verification-failure',
        'release-failure',
        'unexpected-remote-descendant',
        'activation-push-failure'
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

function Get-CanonicalPreparedHandoffPayload {
    param([pscustomobject] $Handoff)

    $hardDependencies = [int[]]@($Handoff.HardDependencies | ForEach-Object { [int]$_ } | Sort-Object)
    $relatedReferences = [string[]]@($Handoff.PrRelatedReferences | ForEach-Object { [string]$_ })

    [ordered]@{
        Schema = 'sidecar-prepared-handoff-v1'
        RunId = [string]$Handoff.RunId
        CoordinatorIssueNumber = [int]$Handoff.CoordinatorIssueNumber
        ChildIssueNumber = [int]$Handoff.ChildIssueNumber
        CoordinatorBranch = [string]$Handoff.CoordinatorBranch
        CoordinatorRemoteBranch = [string]$Handoff.CoordinatorRemoteBranch
        CoordinatorWorktree = [string]$Handoff.CoordinatorWorktree
        ChildBranch = [string]$Handoff.ChildBranch
        ChildWorktree = [string]$Handoff.ChildWorktree
        ControlRevision = [string]$Handoff.ControlRevision
        PreparedSpec = [string]$Handoff.PreparedSpec
        PreparedPlan = [string]$Handoff.PreparedPlan
        PreparedTasks = [string]$Handoff.PreparedTasks
        DependencyLayer = [int]$Handoff.DependencyLayer
        HardDependencies = $hardDependencies
        PrTargetBranch = [string]$Handoff.PrTargetBranch
        PrRelatedReferences = $relatedReferences
        ArtifactPreparationState = [string]$Handoff.ArtifactPreparationState
        LaunchState = [string]$Handoff.LaunchState
        ImplementationPermission = [bool]$Handoff.ImplementationPermission
        DeliveryPermission = [bool]$Handoff.DeliveryPermission
    }
}

function Get-PreparedHandoffFingerprint {
    param([pscustomobject] $Handoff)

    $payload = Get-CanonicalPreparedHandoffPayload -Handoff $Handoff
    $canonicalJson = $payload | ConvertTo-Json -Compress -Depth 4
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        ([System.BitConverter]::ToString(
            $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonicalJson))
        )).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $sha256.Dispose()
    }
}

function Assert-CanonicalPreparedHandoffFingerprint {
    param([pscustomobject] $Handoff)

    $expectedFields = @(
        'Schema', 'RunId', 'CoordinatorIssueNumber', 'ChildIssueNumber',
        'CoordinatorBranch', 'CoordinatorRemoteBranch', 'CoordinatorWorktree',
        'ChildBranch', 'ChildWorktree', 'ControlRevision', 'PreparedSpec',
        'PreparedPlan', 'PreparedTasks', 'DependencyLayer', 'HardDependencies',
        'PrTargetBranch', 'PrRelatedReferences', 'ArtifactPreparationState',
        'LaunchState', 'ImplementationPermission', 'DeliveryPermission'
    )
    $payload = Get-CanonicalPreparedHandoffPayload -Handoff $Handoff
    Assert-Condition (($payload.Keys -join ',') -ceq ($expectedFields -join ',')) 'Canonical prepared-handoff field order must match sidecar-prepared-handoff-v1.'
    Assert-Condition ($payload.CoordinatorIssueNumber -is [int]) 'Canonical coordinator issue number must be an integer.'
    Assert-Condition ($payload.ChildIssueNumber -is [int]) 'Canonical child issue number must be an integer.'
    Assert-Condition ($payload.DependencyLayer -is [int]) 'Canonical dependency layer must be an integer.'
    Assert-Condition ($payload.HardDependencies -is [int[]]) 'Canonical hard dependencies must be an integer array.'
    Assert-Condition ($payload.PrRelatedReferences -is [string[]]) 'Canonical PR references must be a string array.'
    Assert-Condition ($payload.ImplementationPermission -is [bool]) 'Canonical implementation permission must be Boolean.'
    Assert-Condition ($payload.DeliveryPermission -is [bool]) 'Canonical delivery permission must be Boolean.'
    Assert-Condition ($payload.ControlRevision -cmatch '^[0-9a-f]{40}$') 'Canonical control revision must be lowercase 40-hex.'
    Assert-Condition ($payload.PrTargetBranch -ceq $payload.CoordinatorBranch) 'Canonical child PR target must equal the coordinator branch.'
    $expectedReferences = @("Related to #$($payload.ChildIssueNumber)", "Related to #$($payload.CoordinatorIssueNumber)")
    Assert-Condition (($payload.PrRelatedReferences -join "`n") -ceq ($expectedReferences -join "`n")) 'Canonical PR references must be exactly child then coordinator Related to lines.'
    Assert-Condition ($payload.ArtifactPreparationState -ceq 'handoff-ready') 'Canonical artifact preparation state must be handoff-ready.'
    Assert-Condition ($payload.LaunchState -ceq 'pending') 'Canonical launch state must be pending.'
    Assert-Condition (-not $payload.ImplementationPermission) 'Canonical implementation permission must be false.'
    Assert-Condition (-not $payload.DeliveryPermission) 'Canonical delivery permission must be false.'
    $sortedDependencies = @($payload.HardDependencies | Sort-Object)
    Assert-Condition (($payload.HardDependencies -join ',') -ceq ($sortedDependencies -join ',')) 'Canonical hard dependencies must be sorted integers.'

    $recomputed = Get-PreparedHandoffFingerprint -Handoff $Handoff
    Assert-Condition ($Handoff.PreparedHandoffFingerprint -cmatch '^[0-9a-f]{64}$') 'Prepared-handoff fingerprint must be lowercase 64-hex.'
    Assert-Condition ($Handoff.PreparedHandoffFingerprint -ceq $recomputed) 'Prepared-handoff fingerprint must equal canonical v1 recomputation.'

    $excludedMutation = $Handoff | Select-Object *
    $excludedMutation.HandoffReadyCoordinatorSha = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    $excludedMutation.HandoffReadyRemoteHead = 'dddddddddddddddddddddddddddddddddddddddd'
    $excludedMutation.LaunchedCoordinatorSha = 'cccccccccccccccccccccccccccccccccccccccc'
    $excludedMutation.LaunchedRemoteActivationHead = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    $excludedMutation.DispatchTaskIdentity = 'excluded-agent-identity'
    $excludedMutation.PreparedHandoffFingerprint = 'excluded-self-value'
    Assert-Condition ((Get-PreparedHandoffFingerprint -Handoff $excludedMutation) -ceq $recomputed) 'H/R/L/A SHAs, agent identity, and fingerprint itself must not affect canonical v1.'

    $recomputed
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
    $childBaseSha = (Invoke-Git $root @('rev-parse', 'HEAD')).Output[0]

    $remotePath = Join-Path $root '.git\sidecar-origin.git'
    & git init --bare -q $remotePath
    if ($LASTEXITCODE -ne 0) { throw 'Failed to initialize fixture remote.' }
    Invoke-Git $root @('remote', 'add', 'origin', $remotePath) | Out-Null
    Invoke-Git $root @('push', '-q', '-u', 'origin', 'main') | Out-Null

    $coordinatorBranch = 'sidecar/9901-coordinator-child-execution-fixture'
    $childBranch = 'sidecar/9902-child-execution-fixture'
    Invoke-Git $root @('switch', '-q', '-c', $coordinatorBranch) | Out-Null
    $rootNormalized = $root -replace '\\', '/'
    $fingerprintHandoff = New-PreparedHandoff -BarrierState 'handoff-ready'
    $fingerprintHandoff.ExpectedCheckout = $root
    $fingerprintHandoff.ChildWorktree = $rootNormalized
    $fingerprintHandoff.CoordinatorWorktree = $rootNormalized
    $preparedFingerprint = Get-PreparedHandoffFingerprint -Handoff $fingerprintHandoff
    $coordinatorState = @(
        'RunId=sidecar-child-execution-fixture-run'
        'ChildIssueNumber=9902'
        "ChildBranch=$childBranch"
        "ExpectedCheckout=$rootNormalized"
        "PreparedHandoffFingerprint=$preparedFingerprint"
        'ArtifactPreparationState=handoff-ready'
        'LaunchStatus=pending'
        'ImplementationPermitted=false'
        'DeliveryPermitted=false'
    ) -join "`n"
    Set-Content -LiteralPath (Join-Path $root 'coordinator-state.md') -Value $coordinatorState -NoNewline
    Invoke-Git $root @('add', 'coordinator-state.md') | Out-Null
    Invoke-Git $root @('commit', '-q', '-m', 'record handoff-ready coordinator state') | Out-Null
    $handoffReadyCoordinatorSha = (Invoke-Git $root @('rev-parse', 'HEAD')).Output[0]
    Invoke-Git $root @('push', '-q', '-u', 'origin', $coordinatorBranch) | Out-Null
    $handoffReadyRecord = @(
        "HandoffReadyEvidenceSha=$handoffReadyCoordinatorSha"
        "PreparedHandoffFingerprint=$preparedFingerprint"
    ) -join "`n"
    Set-Content -LiteralPath (Join-Path $root 'coordinator-activation.md') -Value $handoffReadyRecord -NoNewline
    Invoke-Git $root @('add', 'coordinator-activation.md') | Out-Null
    Invoke-Git $root @('commit', '-q', '-m', 'record handoff-ready evidence identity') | Out-Null
    $handoffReadyRemoteHead = (Invoke-Git $root @('rev-parse', 'HEAD')).Output[0]
    Invoke-Git $root @('push', '-q', 'origin', $coordinatorBranch) | Out-Null
    Invoke-Git $root @('switch', '-q', 'main') | Out-Null
    Invoke-Git $root @('switch', '-q', '-c', $childBranch) | Out-Null
    Invoke-Git $root @('push', '-q', '-u', 'origin', $childBranch) | Out-Null

    [pscustomobject]@{
        Root = $root
        RemotePath = $remotePath
        CoordinatorBranch = $coordinatorBranch
        ChildBranch = $childBranch
        ChildBaseSha = $childBaseSha
        CoordinatorWorktree = $rootNormalized
        ChildWorktree = $rootNormalized
        HandoffReadyCoordinatorSha = $handoffReadyCoordinatorSha
        HandoffReadyRemoteHead = $handoffReadyRemoteHead
        PreparedHandoffFingerprint = $preparedFingerprint
    }
}

function New-PreparedHandoff {
    param(
        [bool] $Complete = $true,
        [string] $PrTargetBranch = 'sidecar/9901-coordinator-child-execution-fixture',
        [bool] $DeliveryPermitted = $true,
        [bool] $IncludeDeliveryPermission = $true,
        [ValidateSet('handoff-ready', 'accepted', 'durable', 'released')]
        [string] $BarrierState = 'released'
    )

    $childTitle = '[Workflow] Child execution fixture'
    $slug = ConvertTo-SidecarSlug -Title $childTitle
    $isDispatched = $BarrierState -ne 'handoff-ready'
    $isDurable = @('durable', 'released') -contains $BarrierState
    $isReleased = $BarrierState -eq 'released'
    $handoffReadySha = '1111111111111111111111111111111111111111'
    $handoffReadyRemoteHead = '3333333333333333333333333333333333333333'
    $launchedSha = if ($isDispatched) { '2222222222222222222222222222222222222222' } else { '' }
    $launchedRemoteActivationHead = if ($isDispatched) { '4444444444444444444444444444444444444444' } else { '' }
    $dispatchTaskIdentity = if ($isDispatched) { 'sidecar-child-9901-9902' } else { '' }
    $handoff = [ordered]@{
        RunId = 'sidecar-child-execution-fixture-run'
        ChildIssueNumber = 9902
        ChildIssueTitle = $childTitle
        ChildIssueBody = 'Implement one controlled child execution fixture.'
        CoordinatorIssueNumber = 9901
        CoordinatorContext = 'Coordinator #9901 child execution fixture'
        DependencyLayer = 1
        HardDependencies = @()
        ArtifactPreparationState = 'handoff-ready'
        LaunchState = 'pending'
        ImplementationPermission = $false
        DeliveryPermission = $false
        LaunchStatus = if ($isDispatched) { 'launched' } else { 'pending' }
        DispatchAccepted = $isDispatched
        DispatchTaskIdentity = $dispatchTaskIdentity
        ReleaseStatus = if ($isReleased) { 'released' } else { 'held' }
        ImplementationPermitted = $isDurable
        FactualLaunchedEvidenceDurable = $isDurable
        LaunchEvidenceDurable = $isDurable
        LaunchedCoordinatorHeadVerified = $isReleased
        HandoffReadyCoordinatorSha = $handoffReadySha
        HandoffReadyRemoteHead = $handoffReadyRemoteHead
        LaunchedCoordinatorSha = $launchedSha
        LaunchedRemoteActivationHead = $launchedRemoteActivationHead
        RemoteCoordinatorSha = if ($isDurable) { $launchedRemoteActivationHead } else { $handoffReadyRemoteHead }
        PreparedHandoffFingerprint = ''
        PreparedSpec = "specs/9902-$slug/spec.md"
        PreparedPlan = "specs/9902-$slug/plan.md"
        PreparedTasks = "specs/9902-$slug/tasks.md"
        PreparedTaskIds = @('T001')
        SharedContract = 'Shared contract is present and non-conflicting.'
        ExpectedCheckout = '<fixture>'
        ExpectedBranch = 'sidecar/9902-child-execution-fixture'
        ChildBranch = 'sidecar/9902-child-execution-fixture'
        ChildWorktree = '<fixture>'
        CoordinatorBranch = 'sidecar/9901-coordinator-child-execution-fixture'
        CoordinatorRemoteBranch = 'origin/sidecar/9901-coordinator-child-execution-fixture'
        CoordinatorWorktree = '<coordinator-fixture>'
        ControlRevision = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        PrTargetBranch = $PrTargetBranch
        PrIssueReferences = @('Related to #9902', 'Related to #9901')
        PrRelatedReferences = @('Related to #9902', 'Related to #9901')
        ValidationRequirements = @('prepared child validation', 'git diff --check')
        OutOfScope = @('Sibling child scope', 'GitHub issue mutation', 'main target')
        ProhibitedOperations = @('merge', 'approve', 'enable auto-merge', 'mutate GitHub issues', 'post public comments', 'delete remote branches', 'rebase', 'force-push', 'clean local sidecar resources')
    }

    if ($IncludeDeliveryPermission) {
        $handoff['DeliveryPermitted'] = $isDurable -and $DeliveryPermitted
    }

    $handoff['PreparedHandoffFingerprint'] = Get-PreparedHandoffFingerprint -Handoff ([pscustomobject]$handoff)

    if (-not $Complete) {
        $handoff.Remove('PreparedTasks')
        $handoff.Remove('SharedContract')
        $handoff.Remove('ValidationRequirements')
        $handoff.Remove('DeliveryPermitted')
    }

    [pscustomobject]$handoff
}

function Set-HandoffFixtureContext {
    param(
        [pscustomobject] $Fixture,
        [pscustomobject] $Handoff
    )

    $Handoff.ExpectedCheckout = $Fixture.Root
    $Handoff.ExpectedBranch = $Fixture.ChildBranch
    $Handoff.ChildBranch = $Fixture.ChildBranch
    $Handoff.ChildWorktree = $Fixture.ChildWorktree
    $Handoff.CoordinatorBranch = $Fixture.CoordinatorBranch
    $Handoff.CoordinatorRemoteBranch = "origin/$($Fixture.CoordinatorBranch)"
    $Handoff.CoordinatorWorktree = $Fixture.CoordinatorWorktree
    $Handoff.PrTargetBranch = $Fixture.CoordinatorBranch
    $Handoff.ArtifactPreparationState = 'handoff-ready'
    $Handoff.LaunchStatus = 'pending'
    $Handoff.DispatchAccepted = $false
    $Handoff.DispatchTaskIdentity = ''
    $Handoff.ReleaseStatus = 'held'
    $Handoff.ImplementationPermitted = $false
    $Handoff.FactualLaunchedEvidenceDurable = $false
    $Handoff.LaunchEvidenceDurable = $false
    $Handoff.LaunchedCoordinatorHeadVerified = $false
    $Handoff.HandoffReadyCoordinatorSha = $Fixture.HandoffReadyCoordinatorSha
    $Handoff.HandoffReadyRemoteHead = $Fixture.HandoffReadyRemoteHead
    $Handoff.LaunchedCoordinatorSha = ''
    $Handoff.LaunchedRemoteActivationHead = ''
    $Handoff.RemoteCoordinatorSha = $Fixture.HandoffReadyRemoteHead
    $Handoff.PreparedHandoffFingerprint = Get-PreparedHandoffFingerprint -Handoff $Handoff
    Assert-Condition ($Handoff.PreparedHandoffFingerprint -ceq $Fixture.PreparedHandoffFingerprint) 'Fixture and handoff canonical fingerprints must match.'
    if ($Handoff.PSObject.Properties.Name.Contains('DeliveryPermitted')) {
        $Handoff.DeliveryPermitted = $false
    }

    $Handoff
}

function Get-RemoteBranchSha {
    param(
        [string] $Repository,
        [string] $Branch
    )

    $result = Invoke-Git $Repository @('ls-remote', '--heads', 'origin', "refs/heads/$Branch")
    Assert-Condition ($result.Output.Count -eq 1) "Expected exactly one remote ref for $Branch."
    ($result.Output[0] -split '\s+')[0]
}

function Test-GitAncestor {
    param(
        [string] $Repository,
        [string] $Ancestor,
        [string] $Descendant
    )

    if ([string]::IsNullOrWhiteSpace($Ancestor) -or [string]::IsNullOrWhiteSpace($Descendant)) {
        return $false
    }

    (Invoke-Git $Repository @('merge-base', '--is-ancestor', $Ancestor, $Descendant) -AllowFailure).ExitCode -eq 0
}

function Add-UnexpectedCoordinatorRemoteDescendant {
    param(
        [string] $Repository,
        [pscustomobject] $Handoff
    )

    Assert-Condition (@((Invoke-Git $Repository @('status', '--porcelain')).Output).Count -eq 0) 'Unexpected-descendant fixture requires a clean child worktree.'
    Invoke-Git $Repository @('switch', '-q', $Handoff.CoordinatorBranch) | Out-Null
    Invoke-Git $Repository @('commit', '--allow-empty', '-q', '-m', 'simulate unexpected coordinator advance') | Out-Null
    $unexpectedHead = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
    Invoke-Git $Repository @('push', '-q', 'origin', $Handoff.CoordinatorBranch) | Out-Null
    Invoke-Git $Repository @('switch', '-q', $Handoff.ChildBranch) | Out-Null
    $unexpectedHead
}

function New-HeldChildIdentity {
    param([pscustomobject] $Handoff)

    [pscustomobject]@{
        TaskHandle = "sidecar-child-$($Handoff.CoordinatorIssueNumber)-$($Handoff.ChildIssueNumber)"
        RunId = $Handoff.RunId
        CoordinatorIssueNumber = $Handoff.CoordinatorIssueNumber
        ChildIssueNumber = $Handoff.ChildIssueNumber
        CoordinatorBranch = $Handoff.CoordinatorBranch
        ChildBranch = $Handoff.ChildBranch
        ExpectedCheckout = $Handoff.ExpectedCheckout -replace '\\', '/'
        CoordinatorWorktree = $Handoff.CoordinatorWorktree
        ChildWorktree = $Handoff.ChildWorktree
        ControlRevision = $Handoff.ControlRevision
        HandoffReadyCoordinatorSha = $Handoff.HandoffReadyCoordinatorSha
        HandoffReadyRemoteHead = $Handoff.HandoffReadyRemoteHead
        PreparedHandoffFingerprint = $Handoff.PreparedHandoffFingerprint
    }
}

function Assert-HeldChildIdentity {
    param(
        [pscustomobject] $Handoff,
        [pscustomobject] $Identity,
        [switch] $RequireRecordedIdentity
    )

    Assert-Condition (-not [string]::IsNullOrWhiteSpace($Identity.TaskHandle)) 'Held dispatch must return a stable child task identity.'
    Assert-Condition ($Identity.RunId -eq $Handoff.RunId) 'Held child run ID must match the prepared handoff.'
    Assert-Condition ($Identity.CoordinatorIssueNumber -eq $Handoff.CoordinatorIssueNumber) 'Held coordinator issue must match the prepared handoff.'
    Assert-Condition ($Identity.ChildIssueNumber -eq $Handoff.ChildIssueNumber) 'Held child issue must match the prepared handoff.'
    Assert-Condition ($Identity.CoordinatorBranch -eq $Handoff.CoordinatorBranch) 'Held coordinator branch must match the prepared handoff.'
    Assert-Condition ($Identity.ChildBranch -eq $Handoff.ChildBranch) 'Held child branch must match the prepared handoff.'
    Assert-Condition (($Identity.ExpectedCheckout -replace '\\', '/') -eq ($Handoff.ExpectedCheckout -replace '\\', '/')) 'Held child worktree must match the prepared handoff.'
    Assert-Condition ($Identity.CoordinatorWorktree -eq $Handoff.CoordinatorWorktree) 'Held coordinator worktree must match the prepared handoff.'
    Assert-Condition ($Identity.ChildWorktree -eq $Handoff.ChildWorktree) 'Held child worktree identity must match the prepared handoff.'
    Assert-Condition ($Identity.ControlRevision -eq $Handoff.ControlRevision) 'Held control revision must match the prepared handoff.'
    Assert-Condition ($Identity.HandoffReadyCoordinatorSha -eq $Handoff.HandoffReadyCoordinatorSha) 'Held child handoff-ready coordinator SHA must match the prepared handoff.'
    Assert-Condition ($Identity.HandoffReadyRemoteHead -eq $Handoff.HandoffReadyRemoteHead) 'Held child recorded handoff-ready remote head must match the prepared handoff.'
    Assert-Condition ($Identity.PreparedHandoffFingerprint -eq $Handoff.PreparedHandoffFingerprint) 'Held child prepared-handoff identity must match.'
    if ($RequireRecordedIdentity) {
        Assert-Condition ($Handoff.DispatchTaskIdentity -eq $Identity.TaskHandle) 'Release must target the exact stable child identity accepted at dispatch.'
    }
}

function Test-HeldPreflightCompleteness {
    param([pscustomobject] $Handoff)

    $required = @(
        'RunId',
        'ChildIssueNumber',
        'CoordinatorIssueNumber',
        'DependencyLayer',
        'ArtifactPreparationState',
        'LaunchState',
        'ImplementationPermission',
        'DeliveryPermission',
        'LaunchStatus',
        'ImplementationPermitted',
        'DeliveryPermitted',
        'HandoffReadyCoordinatorSha',
        'HandoffReadyRemoteHead',
        'PreparedHandoffFingerprint',
        'PreparedSpec',
        'PreparedPlan',
        'PreparedTasks',
        'ExpectedCheckout',
        'ExpectedBranch',
        'ChildBranch',
        'ChildWorktree',
        'CoordinatorBranch',
        'CoordinatorRemoteBranch',
        'CoordinatorWorktree',
        'ControlRevision',
        'PrTargetBranch',
        'PrRelatedReferences'
    )

    $missing = @($required | Where-Object {
        -not $Handoff.PSObject.Properties.Name.Contains($_) -or
        [string]::IsNullOrWhiteSpace([string]$Handoff.$_)
    })
    if (-not $Handoff.PSObject.Properties.Name.Contains('HardDependencies')) {
        $missing += 'HardDependencies'
    }
    $missing
}

function Invoke-HeldChildPreflight {
    param(
        [string] $Repository,
        [pscustomobject] $Handoff,
        [pscustomobject] $Identity
    )

    $headBefore = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
    $statusBefore = @((Invoke-Git $Repository @('status', '--porcelain')).Output)
    $missing = @(Test-HeldPreflightCompleteness -Handoff $Handoff)
    Assert-Condition ($missing.Count -eq 0) "Missing held-preflight context: $($missing -join ', ')"
    Assert-Condition ($statusBefore.Count -eq 0) 'Held preflight requires a clean child worktree.'
    $canonicalFingerprint = Assert-CanonicalPreparedHandoffFingerprint -Handoff $Handoff

    $context = Test-ChildContext -Repository $Repository -Handoff $Handoff
    Assert-Condition $context.CheckoutMatches 'Held child checkout must match prepared child checkout.'
    Assert-Condition $context.BranchMatches 'Held child branch must match prepared child branch.'
    Assert-HeldChildIdentity -Handoff $Handoff -Identity $Identity
    Assert-Condition ($Handoff.ArtifactPreparationState -eq 'handoff-ready') 'Held preflight requires handoff-ready preparation state.'
    Assert-Condition ($Handoff.LaunchStatus -ne 'launched') 'Launched must be absent before held dispatch acceptance is durably recorded.'
    Assert-Condition (-not $Handoff.ImplementationPermitted) 'Held preflight must prohibit implementation.'
    Assert-Condition (-not $Handoff.DeliveryPermitted) 'Held preflight must prohibit delivery.'
    $remoteSha = Get-RemoteBranchSha -Repository $Repository -Branch $Handoff.CoordinatorBranch
    Assert-Condition ($remoteSha -eq $Handoff.HandoffReadyRemoteHead) 'Current remote coordinator ref must equal the recorded handoff-ready head before dispatch.'
    $remoteContainsHandoffReadyEvidence = Test-GitAncestor -Repository $Repository -Ancestor $Handoff.HandoffReadyCoordinatorSha -Descendant $remoteSha
    $remoteContainsRecordedHead = Test-GitAncestor -Repository $Repository -Ancestor $Handoff.HandoffReadyRemoteHead -Descendant $remoteSha
    Assert-Condition $remoteContainsHandoffReadyEvidence 'Current remote coordinator ref must contain the exact pushed handoff-ready evidence commit by ancestry.'
    Assert-Condition $remoteContainsRecordedHead 'Current remote coordinator ref must contain the recorded handoff-ready bookkeeping head by ancestry.'

    $headAfter = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
    $statusAfter = @((Invoke-Git $Repository @('status', '--porcelain')).Output)
    Assert-Condition ($headAfter -eq $headBefore) 'Held preflight must not move the child branch.'
    Assert-Condition ($statusAfter.Count -eq 0) 'Held preflight must make zero repository edits.'

    [pscustomobject]@{
        DispatchAccepted = $true
        TaskHandle = $Identity.TaskHandle
        HeadBefore = $headBefore
        HeadAfter = $headAfter
        CurrentRemoteCoordinatorSha = $remoteSha
        HandoffReadyEvidenceSha = $Handoff.HandoffReadyCoordinatorSha
        HandoffReadyRecordedHead = $Handoff.HandoffReadyRemoteHead
        PreparedHandoffFingerprint = $canonicalFingerprint
        FingerprintRecomputed = $true
        BarrierFieldsExcludedFromFingerprint = $true
        RemoteContainsHandoffReadyEvidence = $remoteContainsHandoffReadyEvidence
        ChildHeadEqualsHandoffReadyEvidence = $headBefore -eq $Handoff.HandoffReadyCoordinatorSha
        ChangedFiles = @()
        ImplementationAttempted = $false
        DeliveryAttempted = $false
        CommitAttempted = $false
        PushAttempted = $false
        PrOpenOrUpdateAttempted = $false
    }
}

function Publish-LaunchedCoordinatorEvidence {
    param(
        [string] $Repository,
        [pscustomobject] $Handoff,
        [pscustomobject] $Identity,
        [bool] $PushSucceeds = $true,
        [bool] $ActivationPushSucceeds = $true,
        [bool] $DeliveryPermittedAfterLaunch = $true,
        [bool] $WriteMismatchedEvidence = $false
    )

    Assert-HeldChildIdentity -Handoff $Handoff -Identity $Identity
    Assert-Condition ($Handoff.LaunchStatus -ne 'launched') 'Coordinator must not preclaim launched before accepted dispatch.'
    Assert-Condition (-not $Handoff.ImplementationPermitted) 'Implementation must remain prohibited while launch evidence is not durable.'
    Assert-Condition (-not $Handoff.DeliveryPermitted) 'Delivery must remain prohibited while launch evidence is not durable.'
    Assert-Condition (@((Invoke-Git $Repository @('status', '--porcelain')).Output).Count -eq 0) 'Launch-state publication requires a clean fixture worktree.'

    Invoke-Git $Repository @('switch', '-q', $Handoff.CoordinatorBranch) | Out-Null
    $evidenceChildIssue = if ($WriteMismatchedEvidence) { 9999 } else { $Handoff.ChildIssueNumber }
    $rootNormalized = $Handoff.ExpectedCheckout -replace '\\', '/'
    $coordinatorState = @(
        "RunId=$($Handoff.RunId)"
        "ChildIssueNumber=$evidenceChildIssue"
        "ChildBranch=$($Handoff.ChildBranch)"
        "ExpectedCheckout=$rootNormalized"
        "PreparedHandoffFingerprint=$($Handoff.PreparedHandoffFingerprint)"
        'ArtifactPreparationState=handoff-ready'
        'LaunchStatus=launched'
        'ImplementationPermitted=false'
        'DeliveryPermitted=false'
        "DispatchTaskIdentity=$($Identity.TaskHandle)"
    ) -join "`n"
    Set-Content -LiteralPath (Join-Path $Repository 'coordinator-state.md') -Value $coordinatorState -NoNewline
    Invoke-Git $Repository @('add', 'coordinator-state.md') | Out-Null
    Invoke-Git $Repository @('commit', '-q', '-m', 'record factual launched child dispatch') | Out-Null
    $launchedSha = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]

    $evidencePushAttempted = $false
    $evidencePushSucceeded = $false
    if ($PushSucceeds -and -not $ActivationPushSucceeds) {
        $evidencePushAttempted = $true
        Invoke-Git $Repository @('push', '-q', 'origin', $Handoff.CoordinatorBranch) | Out-Null
        $evidencePushSucceeded = $true
    }

    $activatedCoordinatorState = @(
        "RunId=$($Handoff.RunId)"
        "ChildIssueNumber=$evidenceChildIssue"
        "ChildBranch=$($Handoff.ChildBranch)"
        "ExpectedCheckout=$rootNormalized"
        "PreparedHandoffFingerprint=$($Handoff.PreparedHandoffFingerprint)"
        'ArtifactPreparationState=handoff-ready'
        'LaunchStatus=launched'
        'ImplementationPermitted=true'
        "DeliveryPermitted=$($DeliveryPermittedAfterLaunch.ToString().ToLowerInvariant())"
        "DispatchTaskIdentity=$($Identity.TaskHandle)"
    ) -join "`n"
    Set-Content -LiteralPath (Join-Path $Repository 'coordinator-state.md') -Value $activatedCoordinatorState -NoNewline
    $activationState = @(
        "HandoffReadyEvidenceSha=$($Handoff.HandoffReadyCoordinatorSha)"
        "FactualLaunchedEvidenceSha=$launchedSha"
        "DispatchTaskIdentity=$($Identity.TaskHandle)"
    ) -join "`n"
    Set-Content -LiteralPath (Join-Path $Repository 'coordinator-activation.md') -Value $activationState -NoNewline
    Invoke-Git $Repository @('add', 'coordinator-state.md', 'coordinator-activation.md') | Out-Null
    Invoke-Git $Repository @('commit', '-q', '-m', 'record launched evidence activation head') | Out-Null
    $launchedRemoteActivationHead = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]

    $pushAttempted = $true
    if ($PushSucceeds -and $ActivationPushSucceeds) {
        Invoke-Git $Repository @('push', '-q', 'origin', $Handoff.CoordinatorBranch) | Out-Null
        $pushSucceeded = $true
    }
    else {
        $failedPush = Invoke-Git $Repository @('push', 'missing-origin', $Handoff.CoordinatorBranch) -AllowFailure
        Assert-Condition ($failedPush.ExitCode -ne 0) 'Launch or activation-push-failure fixture must exercise an actual failed push.'
        $pushSucceeded = $false
    }

    Invoke-Git $Repository @('switch', '-q', $Handoff.ChildBranch) | Out-Null
    $remoteSha = Get-RemoteBranchSha -Repository $Repository -Branch $Handoff.CoordinatorBranch

    $Handoff.LaunchStatus = 'launched'
    $Handoff.DispatchAccepted = $true
    $Handoff.DispatchTaskIdentity = $Identity.TaskHandle
    $Handoff.ReleaseStatus = 'held'
    $Handoff.LaunchedCoordinatorSha = $launchedSha
    $Handoff.LaunchedRemoteActivationHead = $launchedRemoteActivationHead
    $Handoff.RemoteCoordinatorSha = $remoteSha
    $remoteContainsLaunchedEvidence = Test-GitAncestor -Repository $Repository -Ancestor $launchedSha -Descendant $remoteSha
    $remoteContainsActivationHead = Test-GitAncestor -Repository $Repository -Ancestor $launchedRemoteActivationHead -Descendant $remoteSha
    $remoteEqualsActivationHead = $remoteSha -eq $launchedRemoteActivationHead
    $Handoff.FactualLaunchedEvidenceDurable = $remoteContainsLaunchedEvidence
    $Handoff.LaunchEvidenceDurable = $pushSucceeded -and $remoteEqualsActivationHead -and $remoteContainsLaunchedEvidence -and $remoteContainsActivationHead
    $Handoff.ImplementationPermitted = $Handoff.LaunchEvidenceDurable
    $Handoff.DeliveryPermitted = $Handoff.LaunchEvidenceDurable -and $DeliveryPermittedAfterLaunch
    $Handoff.LaunchedCoordinatorHeadVerified = $false

    [pscustomobject]@{
        DispatchAccepted = $true
        TaskHandle = $Identity.TaskHandle
        LaunchStatus = $Handoff.LaunchStatus
        LocalLaunchedCoordinatorSha = $launchedSha
        LocalLaunchedActivationHead = $launchedRemoteActivationHead
        RemoteCoordinatorSha = $remoteSha
        RemoteContainsLaunchedEvidence = $remoteContainsLaunchedEvidence
        RemoteContainsActivationHead = $remoteContainsActivationHead
        RemoteEqualsActivationHead = $remoteEqualsActivationHead
        FactualLaunchedEvidenceDurable = $Handoff.FactualLaunchedEvidenceDurable
        LaunchEvidenceDurable = $Handoff.LaunchEvidenceDurable
        EvidencePushAttempted = $evidencePushAttempted
        EvidencePushSucceeded = $evidencePushSucceeded
        PushAttempted = $pushAttempted
        PushSucceeded = $pushSucceeded
        ImplementationPermitted = $Handoff.ImplementationPermitted
        DeliveryPermitted = $Handoff.DeliveryPermitted
    }
}

function Invoke-HeldChildRelease {
    param(
        [string] $Repository,
        [pscustomobject] $Handoff,
        [pscustomobject] $Identity,
        [ValidateSet('none', 'refresh', 'verification', 'release')]
        [string] $Failure = 'none'
    )

    $headBefore = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
    $statusBefore = @((Invoke-Git $Repository @('status', '--porcelain')).Output)
    Assert-Condition ($statusBefore.Count -eq 0) 'Held child worktree must remain clean before release.'
    $canonicalFingerprint = Assert-CanonicalPreparedHandoffFingerprint -Handoff $Handoff
    Assert-HeldChildIdentity -Handoff $Handoff -Identity $Identity -RequireRecordedIdentity
    Assert-Condition $Handoff.DispatchAccepted 'Release requires accepted held dispatch.'
    Assert-Condition ($Handoff.LaunchStatus -eq 'launched') 'Release requires factual launched state.'
    Assert-Condition $Handoff.LaunchEvidenceDurable 'Release requires durable launched evidence.'
    Assert-Condition $Handoff.ImplementationPermitted 'Release requires current implementation permission.'

    if ($Failure -eq 'refresh') {
        $failedFetch = Invoke-Git $Repository @('fetch', 'missing-origin', $Handoff.CoordinatorBranch) -AllowFailure
        Assert-Condition ($failedFetch.ExitCode -ne 0) 'Refresh-failure fixture must exercise an actual failed fetch.'
        return [pscustomobject]@{
            Released = $false
            Result = 'refresh failed; exact child remains held'
            HeadBefore = $headBefore
            HeadAfter = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
            ChangedFiles = @()
            ImplementationAttempted = $false
            DeliveryAttempted = $false
        }
    }

    $remoteTrackingRef = "refs/remotes/origin/$($Handoff.CoordinatorBranch)"
    Invoke-Git $Repository @('fetch', '-q', 'origin', "refs/heads/$($Handoff.CoordinatorBranch):$remoteTrackingRef") | Out-Null
    $remoteSha = (Invoke-Git $Repository @('rev-parse', $remoteTrackingRef)).Output[0]
    Assert-Condition ($remoteSha -eq $Handoff.LaunchedRemoteActivationHead) 'Current remote coordinator ref must equal the recorded launched activation head before release.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.LaunchedCoordinatorSha -Descendant $remoteSha) 'Fetched remote coordinator head must contain the exact factual launched-evidence commit.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.LaunchedRemoteActivationHead -Descendant $remoteSha) 'Fetched remote coordinator head must contain the recorded launched activation head.'
    $remoteEvidence = (Invoke-Git $Repository @('show', "${remoteTrackingRef}:coordinator-state.md")).Output -join "`n"
    $remoteActivation = (Invoke-Git $Repository @('show', "${remoteTrackingRef}:coordinator-activation.md")).Output -join "`n"
    $expectedEvidence = @(
        "RunId=$($Handoff.RunId)"
        "ChildIssueNumber=$($Handoff.ChildIssueNumber)"
        "ChildBranch=$($Handoff.ChildBranch)"
        "ExpectedCheckout=$(($Handoff.ExpectedCheckout -replace '\\', '/'))"
        "PreparedHandoffFingerprint=$($Handoff.PreparedHandoffFingerprint)"
        'ArtifactPreparationState=handoff-ready'
        'LaunchStatus=launched'
        'ImplementationPermitted=true'
        "DispatchTaskIdentity=$($Identity.TaskHandle)"
    )
    $expectedActivation = @(
        "HandoffReadyEvidenceSha=$($Handoff.HandoffReadyCoordinatorSha)"
        "FactualLaunchedEvidenceSha=$($Handoff.LaunchedCoordinatorSha)"
        "DispatchTaskIdentity=$($Identity.TaskHandle)"
    )
    $missingEvidence = @(
        @($expectedEvidence | Where-Object { $remoteEvidence -notmatch "(?m)^$([regex]::Escape($_))$" })
        @($expectedActivation | Where-Object { $remoteActivation -notmatch "(?m)^$([regex]::Escape($_))$" })
    )
    if ($Failure -eq 'verification' -or $missingEvidence.Count -gt 0) {
        return [pscustomobject]@{
            Released = $false
            Result = 'launched evidence verification failed; exact child remains held'
            MissingEvidence = $missingEvidence
            HeadBefore = $headBefore
            HeadAfter = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
            ChangedFiles = @()
            ImplementationAttempted = $false
            DeliveryAttempted = $false
        }
    }

    Invoke-Git $Repository @('merge', '--ff-only', '-q', $remoteTrackingRef) | Out-Null
    $headAfterRefresh = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
    Assert-Condition ($headAfterRefresh -eq $remoteSha) 'Child branch must incorporate the current remote launched activation head.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.LaunchedCoordinatorSha -Descendant $headAfterRefresh) 'Incorporated child head must contain the exact factual launched-evidence commit.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.LaunchedRemoteActivationHead -Descendant $headAfterRefresh) 'Incorporated child head must contain the launched activation head.'
    Assert-Condition (@((Invoke-Git $Repository @('status', '--porcelain')).Output).Count -eq 0) 'Child worktree must remain clean after launched-head incorporation.'
    $Handoff.RemoteCoordinatorSha = $remoteSha
    $Handoff.LaunchedCoordinatorHeadVerified = $true

    if ($Failure -eq 'release') {
        $Handoff.ReleaseStatus = 'blocked-resume-needed'
        return [pscustomobject]@{
            Released = $false
            Result = 'release failed after durable launched evidence'
            HeadBefore = $headBefore
            HeadAfter = $headAfterRefresh
            ChangedFiles = @()
            ImplementationAttempted = $false
            DeliveryAttempted = $false
        }
    }

    $Handoff.ReleaseStatus = 'released'
    [pscustomobject]@{
        Released = $true
        Result = 'exact held child released'
        TaskHandle = $Identity.TaskHandle
        HeadBefore = $headBefore
        HeadAfter = $headAfterRefresh
        FactualLaunchedEvidenceSha = $Handoff.LaunchedCoordinatorSha
        CurrentRemoteActivationHead = $remoteSha
        PreparedHandoffFingerprint = $canonicalFingerprint
        FingerprintRecomputed = $true
        BarrierFieldsExcludedFromFingerprint = $true
        LaunchedCoordinatorHeadVerified = $true
        ChangedFiles = @()
        ImplementationAttempted = $false
        DeliveryAttempted = $false
    }
}

function Complete-HeldDispatch {
    param(
        [pscustomobject] $Fixture,
        [pscustomobject] $Handoff,
        [bool] $DeliveryPermittedAfterLaunch = $true
    )

    Set-HandoffFixtureContext -Fixture $Fixture -Handoff $Handoff | Out-Null
    $identity = New-HeldChildIdentity -Handoff $Handoff
    $preflight = Invoke-HeldChildPreflight -Repository $Fixture.Root -Handoff $Handoff -Identity $identity
    $publication = Publish-LaunchedCoordinatorEvidence -Repository $Fixture.Root -Handoff $Handoff -Identity $identity -PushSucceeds:$true -DeliveryPermittedAfterLaunch:$DeliveryPermittedAfterLaunch
    $release = Invoke-HeldChildRelease -Repository $Fixture.Root -Handoff $Handoff -Identity $identity
    Assert-Condition $release.Released 'Complete held dispatch must release the exact child.'

    [pscustomobject]@{
        Identity = $identity
        Preflight = $preflight
        Publication = $publication
        Release = $release
    }
}

function Test-HandoffCompleteness {
    param([pscustomobject] $Handoff)

    $required = @(
        'RunId',
        'ChildIssueNumber',
        'CoordinatorIssueNumber',
        'DependencyLayer',
        'HardDependencies',
        'ArtifactPreparationState',
        'LaunchState',
        'ImplementationPermission',
        'DeliveryPermission',
        'LaunchStatus',
        'DispatchAccepted',
        'DispatchTaskIdentity',
        'ReleaseStatus',
        'ImplementationPermitted',
        'FactualLaunchedEvidenceDurable',
        'LaunchEvidenceDurable',
        'LaunchedCoordinatorHeadVerified',
        'HandoffReadyCoordinatorSha',
        'HandoffReadyRemoteHead',
        'LaunchedCoordinatorSha',
        'LaunchedRemoteActivationHead',
        'RemoteCoordinatorSha',
        'PreparedHandoffFingerprint',
        'PreparedSpec',
        'PreparedPlan',
        'PreparedTasks',
        'PreparedTaskIds',
        'SharedContract',
        'ExpectedCheckout',
        'ExpectedBranch',
        'ChildBranch',
        'ChildWorktree',
        'CoordinatorBranch',
        'CoordinatorRemoteBranch',
        'CoordinatorWorktree',
        'ControlRevision',
        'PrTargetBranch',
        'PrIssueReferences',
        'PrRelatedReferences',
        'ValidationRequirements',
        'DeliveryPermitted',
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
            if ($value.Count -eq 0 -and $field -ne 'HardDependencies') { $missing += $field }
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
    Assert-CanonicalPreparedHandoffFingerprint -Handoff $Handoff | Out-Null

    $context = Test-ChildContext -Repository $Repository -Handoff $Handoff
    Assert-Condition $context.CheckoutMatches 'Current checkout must match prepared child checkout.'
    Assert-Condition $context.BranchMatches 'Current branch must match prepared child branch.'
    Assert-Condition ($Handoff.ChildIssueNumber -is [int]) 'Handoff must identify exactly one child issue.'
    Assert-Condition ($Handoff.ArtifactPreparationState -eq 'handoff-ready') 'Child requires handoff-ready prepared artifacts.'
    Assert-Condition $Handoff.DispatchAccepted 'Child implementation requires accepted held dispatch.'
    Assert-Condition ($Handoff.LaunchStatus -eq 'launched') 'Child must be launched by the coordinator.'
    Assert-Condition (-not [string]::IsNullOrWhiteSpace($Handoff.DispatchTaskIdentity)) 'Child implementation requires the stable accepted dispatch identity.'
    Assert-Condition $Handoff.FactualLaunchedEvidenceDurable 'Child implementation requires factual launched evidence on the remote.'
    Assert-Condition $Handoff.LaunchEvidenceDurable 'Child implementation requires durable launched coordinator evidence.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.LaunchedCoordinatorSha -Descendant $Handoff.RemoteCoordinatorSha) 'Recorded current remote head must contain the factual launched-evidence commit.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.LaunchedRemoteActivationHead -Descendant $Handoff.RemoteCoordinatorSha) 'Recorded current remote head must contain the launched activation head.'
    Assert-Condition $Handoff.LaunchedCoordinatorHeadVerified 'Child must verify the launched remote coordinator head before editing.'
    Assert-Condition ($Handoff.ReleaseStatus -eq 'released') 'Only the exact released held child may implement prepared tasks.'
    Assert-Condition $Handoff.ImplementationPermitted 'Durable launched evidence must explicitly permit implementation.'
    Assert-Condition ($Handoff.PreparedTaskIds.Count -eq 1) 'Fixture child must execute exactly one prepared task.'
    Assert-Condition ($Handoff.PrTargetBranch -eq $Handoff.CoordinatorBranch) 'Child PR target must be the coordinator branch.'
    $remoteSha = Get-RemoteBranchSha -Repository $Repository -Branch $Handoff.CoordinatorBranch
    Assert-Condition ($remoteSha -eq $Handoff.RemoteCoordinatorSha) 'Current remote coordinator ref must still equal the incorporated activation head.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.LaunchedCoordinatorSha -Descendant $remoteSha) 'Current remote coordinator ref must contain factual launched evidence before editing.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.RemoteCoordinatorSha -Descendant 'HEAD') 'Child branch must contain the current remote activation head before editing.'
    Assert-Condition (Test-GitAncestor -Repository $Repository -Ancestor $Handoff.LaunchedCoordinatorSha -Descendant 'HEAD') 'Child branch must contain factual launched evidence before editing.'

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
    param(
        [string] $Body,
        [int] $ChildIssueNumber = 9902,
        [int] $CoordinatorIssueNumber = 9901
    )

    $closingPattern = '(?im)\b(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#\d+'
    $relatedReferences = @([regex]::Matches($Body, '(?im)^Related to #\d+\s*$') | ForEach-Object { $_.Value.Trim() })
    $allIssueReferences = @([regex]::Matches($Body, '#\d+') | ForEach-Object { $_.Value })
    $expectedRelatedReferences = @("Related to #$ChildIssueNumber", "Related to #$CoordinatorIssueNumber")
    $hasExactRelatedReferences =
        $relatedReferences.Count -eq 2 -and
        $allIssueReferences.Count -eq 2 -and
        $relatedReferences[0] -eq $expectedRelatedReferences[0] -and
        $relatedReferences[1] -eq $expectedRelatedReferences[1]

    [pscustomobject]@{
        RelatedReferences = $relatedReferences
        AllIssueReferences = $allIssueReferences
        HasTwoRelatedReferences = $relatedReferences.Count -eq 2
        HasExactRelatedReferences = $hasExactRelatedReferences
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

function Invoke-ChildDeliverySimulation {
    param(
        [pscustomobject] $Handoff,
        [pscustomobject] $Readiness
    )

    Assert-Condition ($Handoff.PSObject.Properties.Name.Contains('DeliveryPermitted')) 'Missing handoff context: DeliveryPermitted'

    $barrierComplete =
        $Handoff.LaunchStatus -eq 'launched' -and
        $Handoff.LaunchEvidenceDurable -and
        $Handoff.ImplementationPermitted -and
        $Handoff.LaunchedCoordinatorHeadVerified -and
        $Handoff.ReleaseStatus -eq 'released'
    if (-not $barrierComplete) {
        return [pscustomobject]@{
            DeliveryPermitted = $false
            DeliveryAttempted = $false
            CommitAttempted = $false
            PushAttempted = $false
            PrOpenOrUpdateAttempted = $false
            IssueMutationAttempted = $false
            FallbackWorkflowAttempted = $false
            Result = 'delivery blocked by held dispatch barrier'
            PrReadiness = 'not-ready'
            ReadinessReason = 'durable launched evidence, verification, and exact-child release are required before delivery'
        }
    }

    if (-not $Handoff.DeliveryPermitted) {
        return [pscustomobject]@{
            DeliveryPermitted = $false
            DeliveryAttempted = $false
            CommitAttempted = $false
            PushAttempted = $false
            PrOpenOrUpdateAttempted = $false
            IssueMutationAttempted = $false
            FallbackWorkflowAttempted = $false
            Result = 'delivery not permitted by prepared handoff'
            PrReadiness = 'not-ready'
            ReadinessReason = 'delivery was not permitted by prepared handoff'
        }
    }

    [pscustomobject]@{
        DeliveryPermitted = $true
        DeliveryAttempted = $true
        CommitAttempted = $true
        PushAttempted = $true
        PrOpenOrUpdateAttempted = $true
            IssueMutationAttempted = $false
            FallbackWorkflowAttempted = $false
            Result = 'delivery permitted by prepared handoff'
            PrReadiness = $Readiness.Status
            ReadinessReason = $Readiness.Reason
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
        RunId = $Handoff.RunId
        DispatchTaskIdentity = $Handoff.DispatchTaskIdentity
        HandoffReadyCoordinatorSha = $Handoff.HandoffReadyCoordinatorSha
        HandoffReadyRemoteHead = $Handoff.HandoffReadyRemoteHead
        LaunchedCoordinatorSha = $Handoff.LaunchedCoordinatorSha
        LaunchedRemoteActivationHead = $Handoff.LaunchedRemoteActivationHead
        CurrentRemoteCoordinatorHead = $Handoff.RemoteCoordinatorSha
        FactualLaunchedEvidenceDurable = $Handoff.FactualLaunchedEvidenceDurable
        LaunchedCoordinatorHeadVerified = $Handoff.LaunchedCoordinatorHeadVerified
        ReleaseStatus = $Handoff.ReleaseStatus
        WorktreeCleanThroughBarrier = $true
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
        'RunId',
        'DispatchTaskIdentity',
        'HandoffReadyCoordinatorSha',
        'HandoffReadyRemoteHead',
        'LaunchedCoordinatorSha',
        'LaunchedRemoteActivationHead',
        'CurrentRemoteCoordinatorHead',
        'FactualLaunchedEvidenceDurable',
        'LaunchedCoordinatorHeadVerified',
        'ReleaseStatus',
        'WorktreeCleanThroughBarrier',
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

function Invoke-ExpectedExecutionBlock {
    param(
        [string] $Repository,
        [pscustomobject] $Handoff,
        [string] $ExpectedBlockerPrefix
    )

    $commitBefore = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]
    $implementationBlocked = $false
    $blockerMessage = $null

    try {
        Invoke-ChildExecution -Repository $Repository -Handoff $Handoff | Out-Null
    }
    catch {
        $implementationBlocked = $true
        $blockerMessage = $_.Exception.Message
    }

    $workFile = Join-Path $Repository "child-work-$($Handoff.ChildIssueNumber).md"
    $changedFiles = @((Invoke-Git $Repository @('status', '--porcelain')).Output)
    $commitAfter = (Invoke-Git $Repository @('rev-parse', 'HEAD')).Output[0]

    Assert-Condition $implementationBlocked 'Expected execution to block before implementation.'
    Assert-Condition ($blockerMessage -like "$ExpectedBlockerPrefix*") "Expected blocker '$ExpectedBlockerPrefix' but got '$blockerMessage'."
    Assert-Condition (-not (Test-Path -LiteralPath $workFile)) 'Blocked execution must not create the prepared task output file.'
    Assert-Condition ($changedFiles.Count -eq 0) 'Blocked execution must leave the fixture worktree unchanged.'
    Assert-Condition ($commitBefore -eq $commitAfter) 'Blocked execution must not create commits.'

    [pscustomobject]@{
        ImplementationBlocked = $implementationBlocked
        TasksExecuted = @()
        ChangedFiles = @()
        CommitAttempted = $false
        PushAttempted = $false
        PrOpenOrUpdateAttempted = $false
        IssueMutationAttempted = $false
        FallbackWorkflowAttempted = $false
        BlockerMessage = $blockerMessage
    }
}

switch ($Scenario) {
    'valid-handoff' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff
            $barrier = Complete-HeldDispatch -Fixture $fixture -Handoff $handoff -DeliveryPermittedAfterLaunch:$true
            $result = Invoke-ChildExecution -Repository $fixture.Root -Handoff $handoff
            $bodyCheck = Test-PrBody -Body (New-ChildPrBody -Handoff $handoff) -ChildIssueNumber $handoff.ChildIssueNumber -CoordinatorIssueNumber $handoff.CoordinatorIssueNumber
            $readiness = Get-PrReadiness -ValidationStatuses @('passed', 'passed') -PrBodyValid:($bodyCheck.HasExactRelatedReferences -and -not $bodyCheck.HasClosingKeyword) -PrTargetValid:($handoff.PrTargetBranch -eq $handoff.CoordinatorBranch)

            Assert-Condition ($readiness.Status -eq 'ready') 'Valid handoff with fresh passed validation should be ready.'
            Assert-Condition $bodyCheck.HasExactRelatedReferences 'PR body must contain only the exact child and coordinator Related to lines.'
            Assert-Condition (-not $bodyCheck.HasClosingKeyword) 'PR body must not include closing keywords.'
            Assert-Condition ($barrier.Preflight.ChangedFiles.Count -eq 0) 'Valid held preflight must make zero edits.'
            Assert-Condition $barrier.Publication.LaunchEvidenceDurable 'Valid execution requires durable launched evidence.'
            Assert-Condition $barrier.Release.Released 'Valid execution requires exact-child release.'

            [pscustomobject]@{
                Scenario = 'valid-handoff'
                Result = 'passed'
                ChildIssue = "#$($handoff.ChildIssueNumber)"
                CoordinatorIssue = "#$($handoff.CoordinatorIssueNumber)"
                CheckoutMatches = $result.Context.CheckoutMatches
                BranchMatches = $result.Context.BranchMatches
                TasksExecuted = $result.TasksExecuted
                ChangedFiles = $result.ChangedFiles
                DispatchTaskIdentity = $barrier.Identity.TaskHandle
                HandoffReadyCoordinatorSha = $handoff.HandoffReadyCoordinatorSha
                LaunchedCoordinatorSha = $handoff.LaunchedCoordinatorSha
                LaunchedCoordinatorHeadVerified = $handoff.LaunchedCoordinatorHeadVerified
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
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -Complete:$false
            $handoff.ExpectedCheckout = $fixture.Root
            $missing = @(Test-HandoffCompleteness -Handoff $handoff)
            Assert-Condition ($missing.Count -gt 0) 'Expected incomplete handoff to report missing context.'
            Assert-Condition ($missing -contains 'DeliveryPermitted') 'Expected incomplete handoff to report missing delivery permission.'
            $block = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Missing handoff context:'

            [pscustomobject]@{
                Scenario = 'missing-context'
                Result = 'passed'
                ImplementationBlocked = $block.ImplementationBlocked
                MissingFields = $missing
                TasksExecuted = $block.TasksExecuted
                ChangedFiles = $block.ChangedFiles
                CommitAttempted = $block.CommitAttempted
                PushAttempted = $block.PushAttempted
                PrOpenOrUpdateAttempted = $block.PrOpenOrUpdateAttempted
                IssueMutationAttempted = $block.IssueMutationAttempted
                FallbackWorkflowAttempted = $block.FallbackWorkflowAttempted
                PlanningRegenerationAttempted = $false
                BlockerMessage = $block.BlockerMessage
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'wrong-checkout' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff
            $handoff.ExpectedCheckout = Join-Path $fixture.Root 'not-the-child-worktree'
            $context = Test-ChildContext -Repository $fixture.Root -Handoff $handoff

            Assert-Condition (-not $context.CheckoutMatches) 'Expected checkout mismatch to block child implementation.'
            Assert-Condition $context.BranchMatches 'Fixture branch should still match so the scenario isolates checkout mismatch.'
            $block = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Current checkout must match prepared child checkout.'

            [pscustomobject]@{
                Scenario = 'wrong-checkout'
                Result = 'passed'
                ImplementationBlocked = $block.ImplementationBlocked
                CheckoutMatches = $context.CheckoutMatches
                BranchMatches = $context.BranchMatches
                CurrentRoot = $context.CurrentRoot
                ExpectedRoot = $context.ExpectedRoot
                TasksExecuted = $block.TasksExecuted
                ChangedFiles = $block.ChangedFiles
                CommitAttempted = $block.CommitAttempted
                PushAttempted = $block.PushAttempted
                PrOpenOrUpdateAttempted = $block.PrOpenOrUpdateAttempted
                IssueMutationAttempted = $block.IssueMutationAttempted
                FallbackWorkflowAttempted = $block.FallbackWorkflowAttempted
                BlockerMessage = $block.BlockerMessage
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'wrong-branch' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff
            $handoff.ExpectedCheckout = $fixture.Root
            Invoke-Git $fixture.Root @('switch', '-q', $fixture.CoordinatorBranch) | Out-Null
            $commitBefore = (Invoke-Git $fixture.Root @('rev-parse', 'HEAD')).Output[0]
            $context = Test-ChildContext -Repository $fixture.Root -Handoff $handoff

            Assert-Condition $context.CheckoutMatches 'Fixture checkout should still match so the scenario isolates branch mismatch.'
            Assert-Condition (-not $context.BranchMatches) 'Expected branch mismatch to block child implementation.'
            $block = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Current branch must match prepared child branch.'
            $commitAfter = (Invoke-Git $fixture.Root @('rev-parse', 'HEAD')).Output[0]
            Assert-Condition ($commitBefore -eq $commitAfter) 'Wrong branch must not create commits.'

            [pscustomobject]@{
                Scenario = 'wrong-branch'
                Result = 'passed'
                ImplementationBlocked = $block.ImplementationBlocked
                CheckoutMatches = $context.CheckoutMatches
                BranchMatches = $context.BranchMatches
                CurrentBranch = $context.CurrentBranch
                ExpectedBranch = $context.ExpectedBranch
                TasksExecuted = $block.TasksExecuted
                ChangedFiles = $block.ChangedFiles
                CommitAttempted = $block.CommitAttempted
                PushAttempted = $block.PushAttempted
                PrOpenOrUpdateAttempted = $block.PrOpenOrUpdateAttempted
                IssueMutationAttempted = $block.IssueMutationAttempted
                FallbackWorkflowAttempted = $block.FallbackWorkflowAttempted
                BlockerMessage = $block.BlockerMessage
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'missing-delivery-permission' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -IncludeDeliveryPermission:$false
            $handoff.ExpectedCheckout = $fixture.Root
            $missing = @(Test-HandoffCompleteness -Handoff $handoff)
            Assert-Condition ($missing -contains 'DeliveryPermitted') 'Expected missing delivery permission to block incomplete handoff.'
            $block = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Missing handoff context: DeliveryPermitted'

            [pscustomobject]@{
                Scenario = 'missing-delivery-permission'
                Result = 'passed'
                ImplementationBlocked = $block.ImplementationBlocked
                MissingFields = $missing
                TasksExecuted = $block.TasksExecuted
                ChangedFiles = $block.ChangedFiles
                CommitAttempted = $block.CommitAttempted
                PushAttempted = $block.PushAttempted
                PrOpenOrUpdateAttempted = $block.PrOpenOrUpdateAttempted
                IssueMutationAttempted = $block.IssueMutationAttempted
                FallbackWorkflowAttempted = $block.FallbackWorkflowAttempted
                BlockerMessage = $block.BlockerMessage
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'delivery-denied' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -DeliveryPermitted:$false
            Complete-HeldDispatch -Fixture $fixture -Handoff $handoff -DeliveryPermittedAfterLaunch:$false | Out-Null
            $commitBefore = (Invoke-Git $fixture.Root @('rev-parse', 'HEAD')).Output[0]
            $execution = Invoke-ChildExecution -Repository $fixture.Root -Handoff $handoff
            $bodyCheck = Test-PrBody -Body (New-ChildPrBody -Handoff $handoff)
            $readiness = Get-PrReadiness -ValidationStatuses @('passed', 'passed') -PrBodyValid:(-not $bodyCheck.HasClosingKeyword) -PrTargetValid:($handoff.PrTargetBranch -eq $handoff.CoordinatorBranch)
            $delivery = Invoke-ChildDeliverySimulation -Handoff $handoff -Readiness $readiness
            $commitAfter = (Invoke-Git $fixture.Root @('rev-parse', 'HEAD')).Output[0]

            Assert-Condition ($execution.TasksExecuted.Count -eq 1) 'Delivery-denied scenario should still complete prepared task execution.'
            Assert-Condition (-not $delivery.DeliveryAttempted) 'Delivery-denied scenario must not attempt delivery.'
            Assert-Condition (-not $delivery.CommitAttempted) 'Delivery-denied scenario must not attempt commit.'
            Assert-Condition (-not $delivery.PushAttempted) 'Delivery-denied scenario must not attempt push.'
            Assert-Condition (-not $delivery.PrOpenOrUpdateAttempted) 'Delivery-denied scenario must not attempt PR open/update.'
            Assert-Condition (-not $delivery.IssueMutationAttempted) 'Delivery-denied scenario must not mutate issues.'
            Assert-Condition (-not $delivery.FallbackWorkflowAttempted) 'Delivery-denied scenario must not use fallback workflow.'
            Assert-Condition ($commitBefore -eq $commitAfter) 'Delivery-denied scenario must not create commits.'
            Assert-Condition ($delivery.Result -eq 'delivery not permitted by prepared handoff') 'Delivery-denied result must report that delivery was not permitted.'
            Assert-Condition ($delivery.PrReadiness -eq 'not-ready') 'Delivery-denied scenario must not report a ready PR.'

            [pscustomobject]@{
                Scenario = 'delivery-denied'
                Result = 'passed'
                DeliveryPermitted = $handoff.DeliveryPermitted
                TasksExecuted = $execution.TasksExecuted
                ChangedFiles = $execution.ChangedFiles
                DeliveryResult = $delivery.Result
                DeliveryAttempted = $delivery.DeliveryAttempted
                CommitAttempted = $delivery.CommitAttempted
                PushAttempted = $delivery.PushAttempted
                PrOpenOrUpdateAttempted = $delivery.PrOpenOrUpdateAttempted
                IssueMutationAttempted = $delivery.IssueMutationAttempted
                FallbackWorkflowAttempted = $delivery.FallbackWorkflowAttempted
                PrReadiness = $delivery.PrReadiness
                ReadinessReason = $delivery.ReadinessReason
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
        $check = Test-PrBody -Body $body -ChildIssueNumber $handoff.ChildIssueNumber -CoordinatorIssueNumber $handoff.CoordinatorIssueNumber
        $extraReferenceCheck = Test-PrBody -Body ($body + "`nRelated to #260") -ChildIssueNumber $handoff.ChildIssueNumber -CoordinatorIssueNumber $handoff.CoordinatorIssueNumber

        Assert-Condition $check.HasTwoRelatedReferences 'Expected exactly two Related to issue references.'
        Assert-Condition $check.HasExactRelatedReferences 'Expected only the exact child and coordinator Related to references.'
        Assert-Condition ($check.RelatedReferences -contains 'Related to #9902') 'Expected child issue Related to reference.'
        Assert-Condition ($check.RelatedReferences -contains 'Related to #9901') 'Expected coordinator issue Related to reference.'
        Assert-Condition (-not $check.HasClosingKeyword) 'Expected no closing keywords.'
        Assert-Condition (-not $extraReferenceCheck.HasExactRelatedReferences) 'Any third issue reference must invalidate child PR wording.'

        [pscustomobject]@{
            Scenario = 'pr-wording'
            Result = 'passed'
            RelatedReferences = $check.RelatedReferences
            AllIssueReferences = $check.AllIssueReferences
            HasExactRelatedReferences = $check.HasExactRelatedReferences
            ThirdIssueReferenceBlocked = -not $extraReferenceCheck.HasExactRelatedReferences
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
    'held-preflight' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $fixture -Handoff $handoff | Out-Null
            $identity = New-HeldChildIdentity -Handoff $handoff
            $preflight = Invoke-HeldChildPreflight -Repository $fixture.Root -Handoff $handoff -Identity $identity
            $block = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Missing handoff context:'
            $delivery = Invoke-ChildDeliverySimulation -Handoff $handoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))

            Assert-Condition ($preflight.HeadBefore -eq $preflight.HeadAfter) 'Held preflight must not move HEAD.'
            Assert-Condition (-not $preflight.ChildHeadEqualsHandoffReadyEvidence) 'Held preflight must allow a clean child branch behind handoff-ready evidence.'
            Assert-Condition $preflight.RemoteContainsHandoffReadyEvidence 'Held preflight must prove remote ancestry contains handoff-ready evidence.'
            Assert-Condition ($preflight.ChangedFiles.Count -eq 0) 'Held preflight must make zero edits.'
            Assert-Condition (-not $preflight.ImplementationAttempted) 'Held preflight must not attempt implementation.'
            Assert-Condition (-not $preflight.DeliveryAttempted) 'Held preflight must not attempt delivery.'
            Assert-Condition $preflight.FingerprintRecomputed 'Held preflight must recompute the canonical prepared-handoff fingerprint.'
            Assert-Condition ($preflight.PreparedHandoffFingerprint -ceq $handoff.PreparedHandoffFingerprint) 'Held preflight recomputation must equal the prepared fingerprint.'
            Assert-Condition $preflight.BarrierFieldsExcludedFromFingerprint 'Held preflight must keep barrier evidence and agent identity separate from the fingerprint.'
            Assert-Condition ($handoff.LaunchStatus -eq 'pending') 'Held preflight must not preclaim launched.'
            Assert-Condition (-not $handoff.ImplementationPermitted) 'Implementation must be false before durable launched evidence.'
            Assert-Condition (-not $handoff.DeliveryPermitted) 'Delivery must be false before durable launched evidence.'
            Assert-Condition $block.ImplementationBlocked 'Prepared tasks must remain blocked during held preflight.'
            Assert-Condition (-not $delivery.DeliveryAttempted) 'Delivery must remain blocked during held preflight.'

            [pscustomobject]@{
                Scenario = 'held-preflight'
                Result = 'passed'
                DispatchAccepted = $preflight.DispatchAccepted
                TaskHandle = $preflight.TaskHandle
                LaunchStatus = $handoff.LaunchStatus
                HeadUnchanged = $preflight.HeadBefore -eq $preflight.HeadAfter
                ChildHeadWasBehindHandoffReadyEvidence = -not $preflight.ChildHeadEqualsHandoffReadyEvidence
                RemoteContainsHandoffReadyEvidence = $preflight.RemoteContainsHandoffReadyEvidence
                PreparedHandoffFingerprint = $preflight.PreparedHandoffFingerprint
                FingerprintRecomputed = $preflight.FingerprintRecomputed
                BarrierFieldsExcludedFromFingerprint = $preflight.BarrierFieldsExcludedFromFingerprint
                ChangedFiles = $preflight.ChangedFiles
                ImplementationAttempted = $preflight.ImplementationAttempted
                DeliveryAttempted = $preflight.DeliveryAttempted
                CommitAttempted = $preflight.CommitAttempted
                PushAttempted = $preflight.PushAttempted
                PrOpenOrUpdateAttempted = $preflight.PrOpenOrUpdateAttempted
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'stable-child-identity' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $fixture -Handoff $handoff | Out-Null
            $identity = New-HeldChildIdentity -Handoff $handoff
            Invoke-HeldChildPreflight -Repository $fixture.Root -Handoff $handoff -Identity $identity | Out-Null
            Publish-LaunchedCoordinatorEvidence -Repository $fixture.Root -Handoff $handoff -Identity $identity -PushSucceeds:$true | Out-Null
            $wrongIdentity = New-HeldChildIdentity -Handoff $handoff
            $wrongIdentity.TaskHandle = "$($identity.TaskHandle)-replacement"
            $headBefore = (Invoke-Git $fixture.Root @('rev-parse', 'HEAD')).Output[0]
            $wrongIdentityBlocked = $false
            $blockerMessage = $null
            try {
                Invoke-HeldChildRelease -Repository $fixture.Root -Handoff $handoff -Identity $wrongIdentity | Out-Null
            }
            catch {
                $wrongIdentityBlocked = $true
                $blockerMessage = $_.Exception.Message
            }
            $headAfter = (Invoke-Git $fixture.Root @('rev-parse', 'HEAD')).Output[0]
            $delivery = Invoke-ChildDeliverySimulation -Handoff $handoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))

            Assert-Condition $wrongIdentityBlocked 'A different child invocation must not be treated as the accepted held child.'
            Assert-Condition ($blockerMessage -like 'Release must target the exact stable child identity*') 'Wrong identity must fail the exact release correlation check.'
            Assert-Condition ($handoff.DispatchTaskIdentity -eq $identity.TaskHandle) 'Recorded dispatch identity must remain the originally accepted task handle.'
            Assert-Condition ($handoff.ReleaseStatus -eq 'held') 'Wrong identity must leave the accepted child held.'
            Assert-Condition ($headBefore -eq $headAfter) 'Wrong identity must not update the child branch.'
            Assert-Condition (@((Invoke-Git $fixture.Root @('status', '--porcelain')).Output).Count -eq 0) 'Wrong identity must make zero repository edits.'
            Assert-Condition (-not $delivery.DeliveryAttempted) 'Wrong identity must not enable delivery.'

            [pscustomobject]@{
                Scenario = 'stable-child-identity'
                Result = 'passed'
                AcceptedTaskHandle = $identity.TaskHandle
                RejectedTaskHandle = $wrongIdentity.TaskHandle
                WrongIdentityBlocked = $wrongIdentityBlocked
                ReleaseStatus = $handoff.ReleaseStatus
                HeadUnchanged = $headBefore -eq $headAfter
                ChangedFiles = @()
                DeliveryAttempted = $delivery.DeliveryAttempted
                BlockerMessage = $blockerMessage
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'durable-launched-release' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $fixture -Handoff $handoff | Out-Null
            $identity = New-HeldChildIdentity -Handoff $handoff
            $preflight = Invoke-HeldChildPreflight -Repository $fixture.Root -Handoff $handoff -Identity $identity
            $publication = Publish-LaunchedCoordinatorEvidence -Repository $fixture.Root -Handoff $handoff -Identity $identity -PushSucceeds:$true
            $preReleaseBlock = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Child must verify the launched remote coordinator head before editing.'
            $preReleaseDelivery = Invoke-ChildDeliverySimulation -Handoff $handoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))
            $release = Invoke-HeldChildRelease -Repository $fixture.Root -Handoff $handoff -Identity $identity
            $execution = Invoke-ChildExecution -Repository $fixture.Root -Handoff $handoff

            Assert-Condition ($preflight.ChangedFiles.Count -eq 0) 'Held child must make zero edits before durable launched evidence.'
            Assert-Condition (-not $preflight.ChildHeadEqualsHandoffReadyEvidence) 'Fixture child must begin behind the handoff-ready evidence commit.'
            Assert-Condition (Test-GitAncestor -Repository $fixture.Root -Ancestor $preflight.HeadBefore -Descendant $handoff.HandoffReadyCoordinatorSha) 'Behind fixture child head must be an ancestor of handoff-ready evidence.'
            Assert-Condition $preflight.RemoteContainsHandoffReadyEvidence 'Preflight must prove the current remote ref contains handoff-ready evidence by ancestry.'
            Assert-Condition $publication.LaunchEvidenceDurable 'Launched evidence must be pushed before release.'
            Assert-Condition ($publication.LocalLaunchedCoordinatorSha -ne $publication.LocalLaunchedActivationHead) 'Factual launched evidence and its recordable activation head must be separate commits.'
            Assert-Condition $publication.RemoteContainsLaunchedEvidence 'Current remote activation head must contain factual launched evidence by ancestry.'
            Assert-Condition $publication.RemoteEqualsActivationHead 'Current remote must equal the exact launched activation head.'
            Assert-Condition ($publication.RemoteCoordinatorSha -eq $publication.LocalLaunchedActivationHead) 'Fixture remote must advance to the launched activation head.'
            Assert-Condition $preReleaseBlock.ImplementationBlocked 'Implementation must remain blocked before exact-child release.'
            Assert-Condition (-not $preReleaseDelivery.DeliveryAttempted) 'Delivery must remain blocked before exact-child release.'
            Assert-Condition $release.Released 'The exact accepted child must be released.'
            Assert-Condition ($release.TaskHandle -eq $identity.TaskHandle) 'Release must preserve the accepted stable child identity.'
            Assert-Condition $release.FingerprintRecomputed 'Pre-release validation must recompute the canonical prepared-handoff fingerprint.'
            Assert-Condition ($release.PreparedHandoffFingerprint -ceq $preflight.PreparedHandoffFingerprint) 'Pre-release recomputation must equal the held-preflight fingerprint after H/R/L/A and identity changes.'
            Assert-Condition $release.BarrierFieldsExcludedFromFingerprint 'Pre-release validation must keep H/R/L/A evidence and agent identity separate from the fingerprint.'
            Assert-Condition ($release.HeadAfter -eq $handoff.RemoteCoordinatorSha) 'Child must incorporate the current launched activation head before editing.'
            Assert-Condition (Test-GitAncestor -Repository $fixture.Root -Ancestor $handoff.LaunchedCoordinatorSha -Descendant $release.HeadAfter) 'Incorporated activation head must contain the exact factual launched-evidence commit.'
            Assert-Condition $handoff.LaunchedCoordinatorHeadVerified 'Child must verify launched evidence before editing.'
            Assert-Condition ($execution.ChangedFiles.Count -eq 1) 'Implementation may begin only after successful release.'

            [pscustomobject]@{
                Scenario = 'durable-launched-release'
                Result = 'passed'
                TaskHandle = $identity.TaskHandle
                HandoffReadyCoordinatorSha = $handoff.HandoffReadyCoordinatorSha
                HandoffReadyRemoteHead = $handoff.HandoffReadyRemoteHead
                LaunchedCoordinatorSha = $handoff.LaunchedCoordinatorSha
                LaunchedRemoteActivationHead = $handoff.LaunchedRemoteActivationHead
                RemoteCoordinatorSha = $handoff.RemoteCoordinatorSha
                ChildHeadWasBehindHandoffReadyEvidence = -not $preflight.ChildHeadEqualsHandoffReadyEvidence
                RemoteContainsHandoffReadyEvidence = $preflight.RemoteContainsHandoffReadyEvidence
                PreflightChangedFiles = $preflight.ChangedFiles
                PreReleaseImplementationBlocked = $preReleaseBlock.ImplementationBlocked
                PreReleaseDeliveryAttempted = $preReleaseDelivery.DeliveryAttempted
                PreparedHandoffFingerprint = $release.PreparedHandoffFingerprint
                PreflightFingerprintRecomputed = $preflight.FingerprintRecomputed
                ReleaseFingerprintRecomputed = $release.FingerprintRecomputed
                BarrierFieldsExcludedFromFingerprint = $release.BarrierFieldsExcludedFromFingerprint
                LaunchedCoordinatorHeadVerified = $handoff.LaunchedCoordinatorHeadVerified
                ReleaseStatus = $handoff.ReleaseStatus
                TasksExecuted = $execution.TasksExecuted
                ChangedFiles = $execution.ChangedFiles
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'launch-push-failure' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $fixture -Handoff $handoff | Out-Null
            $identity = New-HeldChildIdentity -Handoff $handoff
            $preflight = Invoke-HeldChildPreflight -Repository $fixture.Root -Handoff $handoff -Identity $identity
            $publication = Publish-LaunchedCoordinatorEvidence -Repository $fixture.Root -Handoff $handoff -Identity $identity -PushSucceeds:$false
            $block = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Child implementation requires factual launched evidence on the remote.'
            $delivery = Invoke-ChildDeliverySimulation -Handoff $handoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))
            $childHead = (Invoke-Git $fixture.Root @('rev-parse', 'HEAD')).Output[0]

            Assert-Condition $publication.DispatchAccepted 'Failed launch push occurs after factual dispatch acceptance.'
            Assert-Condition ($publication.LaunchStatus -eq 'launched') 'Factual launched state must be retained after accepted dispatch.'
            Assert-Condition (-not $publication.PushSucceeded) 'Scenario must retain the failed launch push.'
            Assert-Condition (-not $publication.FactualLaunchedEvidenceDurable) 'Failed launch push must not claim factual launched evidence is remote-durable.'
            Assert-Condition (-not $publication.LaunchEvidenceDurable) 'Failed push must not claim durable remote launched evidence.'
            Assert-Condition ($publication.RemoteCoordinatorSha -eq $handoff.HandoffReadyRemoteHead) 'Remote coordinator ref must remain at the handoff-ready record head after failed launch push.'
            Assert-Condition (Test-GitAncestor -Repository $fixture.Root -Ancestor $handoff.HandoffReadyCoordinatorSha -Descendant $publication.RemoteCoordinatorSha) 'Failed launch push must preserve remote ancestry containing handoff-ready evidence.'
            Assert-Condition ($handoff.ReleaseStatus -eq 'held') 'Failed launch push must keep the child held.'
            Assert-Condition (-not $handoff.ImplementationPermitted) 'Failed launch push must keep implementation prohibited.'
            Assert-Condition (-not $handoff.DeliveryPermitted) 'Failed launch push must keep delivery prohibited.'
            Assert-Condition $block.ImplementationBlocked 'Failed launch push must block prepared task execution.'
            Assert-Condition (-not $delivery.DeliveryAttempted) 'Failed launch push must perform no delivery.'
            Assert-Condition ($childHead -eq $fixture.ChildBaseSha) 'Failed launch push must not update the behind child branch.'
            Assert-Condition ($childHead -ne $handoff.HandoffReadyCoordinatorSha) 'Failed launch push fixture must preserve a child behind handoff-ready evidence.'
            Assert-Condition ($preflight.ChangedFiles.Count -eq 0) 'Held child must remain unedited through failed launch push.'

            [pscustomobject]@{
                Scenario = 'launch-push-failure'
                Result = 'passed'
                TaskHandle = $identity.TaskHandle
                LaunchStatus = $handoff.LaunchStatus
                LaunchEvidenceDurable = $handoff.LaunchEvidenceDurable
                LocalLaunchedCoordinatorSha = $publication.LocalLaunchedCoordinatorSha
                LocalLaunchedActivationHead = $publication.LocalLaunchedActivationHead
                RemoteCoordinatorSha = $publication.RemoteCoordinatorSha
                ReleaseStatus = $handoff.ReleaseStatus
                ChangedFiles = @()
                ImplementationAttempted = -not $block.ImplementationBlocked
                DeliveryAttempted = $delivery.DeliveryAttempted
                PushAttempted = $publication.PushAttempted
                PushSucceeded = $publication.PushSucceeded
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'refresh-verification-failure' {
        $refreshFixture = New-TempGitRepository
        $verificationFixture = $null
        try {
            $refreshHandoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $refreshFixture -Handoff $refreshHandoff | Out-Null
            $refreshIdentity = New-HeldChildIdentity -Handoff $refreshHandoff
            Invoke-HeldChildPreflight -Repository $refreshFixture.Root -Handoff $refreshHandoff -Identity $refreshIdentity | Out-Null
            Publish-LaunchedCoordinatorEvidence -Repository $refreshFixture.Root -Handoff $refreshHandoff -Identity $refreshIdentity -PushSucceeds:$true | Out-Null
            $refreshResult = Invoke-HeldChildRelease -Repository $refreshFixture.Root -Handoff $refreshHandoff -Identity $refreshIdentity -Failure 'refresh'
            $refreshDelivery = Invoke-ChildDeliverySimulation -Handoff $refreshHandoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))

            $verificationFixture = New-TempGitRepository
            $verificationHandoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $verificationFixture -Handoff $verificationHandoff | Out-Null
            $verificationIdentity = New-HeldChildIdentity -Handoff $verificationHandoff
            Invoke-HeldChildPreflight -Repository $verificationFixture.Root -Handoff $verificationHandoff -Identity $verificationIdentity | Out-Null
            Publish-LaunchedCoordinatorEvidence -Repository $verificationFixture.Root -Handoff $verificationHandoff -Identity $verificationIdentity -PushSucceeds:$true -WriteMismatchedEvidence:$true | Out-Null
            $verificationResult = Invoke-HeldChildRelease -Repository $verificationFixture.Root -Handoff $verificationHandoff -Identity $verificationIdentity
            $verificationDelivery = Invoke-ChildDeliverySimulation -Handoff $verificationHandoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))

            Assert-Condition (-not $refreshResult.Released) 'Failed refresh must keep the exact child unreleased.'
            Assert-Condition ($refreshResult.HeadBefore -eq $refreshResult.HeadAfter) 'Failed refresh must not update the child branch.'
            Assert-Condition ($refreshResult.ChangedFiles.Count -eq 0) 'Failed refresh must perform no implementation edit.'
            Assert-Condition (-not $refreshDelivery.DeliveryAttempted) 'Failed refresh must perform no delivery.'
            Assert-Condition ($refreshHandoff.LaunchStatus -eq 'launched') 'Failed refresh must retain factual launched state.'
            Assert-Condition (-not $verificationResult.Released) 'Failed verification must keep the exact child unreleased.'
            Assert-Condition ($verificationResult.MissingEvidence.Count -gt 0) 'Verification failure must preserve the exact launched-evidence mismatch.'
            Assert-Condition ($verificationResult.HeadBefore -eq $verificationResult.HeadAfter) 'Failed verification must not update the child branch.'
            Assert-Condition ($verificationResult.ChangedFiles.Count -eq 0) 'Failed verification must perform no implementation edit.'
            Assert-Condition (-not $verificationDelivery.DeliveryAttempted) 'Failed verification must perform no delivery.'
            Assert-Condition ($verificationHandoff.LaunchStatus -eq 'launched') 'Failed verification must retain factual launched state.'

            [pscustomobject]@{
                Scenario = 'refresh-verification-failure'
                Result = 'passed'
                RefreshFailure = $refreshResult
                RefreshLaunchStatus = $refreshHandoff.LaunchStatus
                RefreshDeliveryAttempted = $refreshDelivery.DeliveryAttempted
                VerificationFailure = $verificationResult
                VerificationLaunchStatus = $verificationHandoff.LaunchStatus
                VerificationDeliveryAttempted = $verificationDelivery.DeliveryAttempted
            } | ConvertTo-Json -Depth 6
        }
        finally {
            if ($refreshFixture -and (Test-Path -LiteralPath $refreshFixture.Root)) {
                Remove-Item -LiteralPath $refreshFixture.Root -Recurse -Force
            }
            if ($verificationFixture -and (Test-Path -LiteralPath $verificationFixture.Root)) {
                Remove-Item -LiteralPath $verificationFixture.Root -Recurse -Force
            }
        }
    }
    'release-failure' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $fixture -Handoff $handoff | Out-Null
            $identity = New-HeldChildIdentity -Handoff $handoff
            Invoke-HeldChildPreflight -Repository $fixture.Root -Handoff $handoff -Identity $identity | Out-Null
            Publish-LaunchedCoordinatorEvidence -Repository $fixture.Root -Handoff $handoff -Identity $identity -PushSucceeds:$true | Out-Null
            $release = Invoke-HeldChildRelease -Repository $fixture.Root -Handoff $handoff -Identity $identity -Failure 'release'
            $block = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Only the exact released held child may implement prepared tasks.'
            $delivery = Invoke-ChildDeliverySimulation -Handoff $handoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))

            Assert-Condition (-not $release.Released) 'Release failure must not release the held child.'
            Assert-Condition ($handoff.LaunchStatus -eq 'launched') 'Release failure must retain factual launched state.'
            Assert-Condition $handoff.LaunchEvidenceDurable 'Release failure occurs after launched evidence is durable.'
            Assert-Condition $handoff.LaunchedCoordinatorHeadVerified 'Release failure retains successful launched-head verification.'
            Assert-Condition ($handoff.ReleaseStatus -eq 'blocked-resume-needed') 'Release failure must record blocked or resume-needed state.'
            Assert-Condition ($release.HeadAfter -eq $handoff.RemoteCoordinatorSha) 'Release failure retains the incorporated current activation head.'
            Assert-Condition (Test-GitAncestor -Repository $fixture.Root -Ancestor $handoff.LaunchedCoordinatorSha -Descendant $release.HeadAfter) 'Release failure activation head must retain factual launched-evidence ancestry.'
            Assert-Condition ($release.ChangedFiles.Count -eq 0) 'Release failure must perform no implementation edit.'
            Assert-Condition $block.ImplementationBlocked 'Release failure must block prepared task execution.'
            Assert-Condition (-not $delivery.DeliveryAttempted) 'Release failure must perform no delivery.'
            Assert-Condition (-not (Test-Path -LiteralPath (Join-Path $fixture.Root "child-work-$($handoff.ChildIssueNumber).md"))) 'Release failure must not create child task output.'

            [pscustomobject]@{
                Scenario = 'release-failure'
                Result = 'passed'
                TaskHandle = $identity.TaskHandle
                LaunchStatus = $handoff.LaunchStatus
                LaunchEvidenceDurable = $handoff.LaunchEvidenceDurable
                LaunchedCoordinatorHeadVerified = $handoff.LaunchedCoordinatorHeadVerified
                ReleaseStatus = $handoff.ReleaseStatus
                ChangedFiles = $release.ChangedFiles
                ImplementationBlocked = $block.ImplementationBlocked
                DeliveryAttempted = $delivery.DeliveryAttempted
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
    'unexpected-remote-descendant' {
        $preflightFixture = New-TempGitRepository
        $releaseFixture = $null
        try {
            $preflightHandoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $preflightFixture -Handoff $preflightHandoff | Out-Null
            $preflightIdentity = New-HeldChildIdentity -Handoff $preflightHandoff
            $preflightChildHead = (Invoke-Git $preflightFixture.Root @('rev-parse', 'HEAD')).Output[0]
            $unexpectedPreflightHead = Add-UnexpectedCoordinatorRemoteDescendant -Repository $preflightFixture.Root -Handoff $preflightHandoff
            $preflightBlocked = $false
            $preflightBlocker = $null
            try {
                Invoke-HeldChildPreflight -Repository $preflightFixture.Root -Handoff $preflightHandoff -Identity $preflightIdentity | Out-Null
            }
            catch {
                $preflightBlocked = $true
                $preflightBlocker = $_.Exception.Message
            }

            Assert-Condition $preflightBlocked 'Unexpected remote descendant must block held preflight.'
            Assert-Condition ($preflightBlocker -like 'Current remote coordinator ref must equal the recorded handoff-ready head*') 'Preflight must fail the exact Rr equality gate.'
            Assert-Condition ($unexpectedPreflightHead -ne $preflightHandoff.HandoffReadyRemoteHead) 'Unexpected preflight head must differ from recorded Rr.'
            Assert-Condition (Test-GitAncestor -Repository $preflightFixture.Root -Ancestor $preflightHandoff.HandoffReadyCoordinatorSha -Descendant $unexpectedPreflightHead) 'Unexpected descendant must still contain H so equality is tested separately from ancestry.'
            Assert-Condition ((Invoke-Git $preflightFixture.Root @('rev-parse', 'HEAD')).Output[0] -eq $preflightChildHead) 'Blocked preflight must not move the child branch.'
            Assert-Condition (@((Invoke-Git $preflightFixture.Root @('status', '--porcelain')).Output).Count -eq 0) 'Blocked preflight must make zero child worktree edits.'

            $releaseFixture = New-TempGitRepository
            $releaseHandoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $releaseFixture -Handoff $releaseHandoff | Out-Null
            $releaseIdentity = New-HeldChildIdentity -Handoff $releaseHandoff
            Invoke-HeldChildPreflight -Repository $releaseFixture.Root -Handoff $releaseHandoff -Identity $releaseIdentity | Out-Null
            Publish-LaunchedCoordinatorEvidence -Repository $releaseFixture.Root -Handoff $releaseHandoff -Identity $releaseIdentity -PushSucceeds:$true | Out-Null
            $releaseChildHead = (Invoke-Git $releaseFixture.Root @('rev-parse', 'HEAD')).Output[0]
            $unexpectedReleaseHead = Add-UnexpectedCoordinatorRemoteDescendant -Repository $releaseFixture.Root -Handoff $releaseHandoff
            $releaseBlocked = $false
            $releaseBlocker = $null
            try {
                Invoke-HeldChildRelease -Repository $releaseFixture.Root -Handoff $releaseHandoff -Identity $releaseIdentity | Out-Null
            }
            catch {
                $releaseBlocked = $true
                $releaseBlocker = $_.Exception.Message
            }
            $releaseDelivery = Invoke-ChildDeliverySimulation -Handoff $releaseHandoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))

            Assert-Condition $releaseBlocked 'Unexpected remote descendant must block held-child release.'
            Assert-Condition ($releaseBlocker -like 'Current remote coordinator ref must equal the recorded launched activation head*') 'Release must fail the exact Lr equality gate.'
            Assert-Condition ($unexpectedReleaseHead -ne $releaseHandoff.LaunchedRemoteActivationHead) 'Unexpected release head must differ from recorded Lr.'
            Assert-Condition (Test-GitAncestor -Repository $releaseFixture.Root -Ancestor $releaseHandoff.LaunchedCoordinatorSha -Descendant $unexpectedReleaseHead) 'Unexpected descendant must still contain L so equality is tested separately from ancestry.'
            Assert-Condition ((Invoke-Git $releaseFixture.Root @('rev-parse', 'HEAD')).Output[0] -eq $releaseChildHead) 'Blocked release must not move the child branch.'
            Assert-Condition ($releaseHandoff.ReleaseStatus -eq 'held') 'Unexpected descendant must leave the exact child held.'
            Assert-Condition (-not $releaseDelivery.DeliveryAttempted) 'Unexpected descendant must perform no delivery.'
            Assert-Condition (@((Invoke-Git $releaseFixture.Root @('status', '--porcelain')).Output).Count -eq 0) 'Blocked release must make zero child worktree edits.'

            [pscustomobject]@{
                Scenario = 'unexpected-remote-descendant'
                Result = 'passed'
                PreflightRecordedHead = $preflightHandoff.HandoffReadyRemoteHead
                PreflightUnexpectedHead = $unexpectedPreflightHead
                PreflightBlocked = $preflightBlocked
                PreflightChangedFiles = @()
                ActivationRecordedHead = $releaseHandoff.LaunchedRemoteActivationHead
                ActivationUnexpectedHead = $unexpectedReleaseHead
                ReleaseBlocked = $releaseBlocked
                ReleaseStatus = $releaseHandoff.ReleaseStatus
                ReleaseChangedFiles = @()
                DeliveryAttempted = $releaseDelivery.DeliveryAttempted
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($preflightFixture -and (Test-Path -LiteralPath $preflightFixture.Root)) {
                Remove-Item -LiteralPath $preflightFixture.Root -Recurse -Force
            }
            if ($releaseFixture -and (Test-Path -LiteralPath $releaseFixture.Root)) {
                Remove-Item -LiteralPath $releaseFixture.Root -Recurse -Force
            }
        }
    }
    'activation-push-failure' {
        $fixture = New-TempGitRepository
        try {
            $handoff = New-PreparedHandoff -BarrierState 'handoff-ready'
            Set-HandoffFixtureContext -Fixture $fixture -Handoff $handoff | Out-Null
            $identity = New-HeldChildIdentity -Handoff $handoff
            $preflight = Invoke-HeldChildPreflight -Repository $fixture.Root -Handoff $handoff -Identity $identity
            $publication = Publish-LaunchedCoordinatorEvidence -Repository $fixture.Root -Handoff $handoff -Identity $identity -PushSucceeds:$true -ActivationPushSucceeds:$false
            $block = Invoke-ExpectedExecutionBlock -Repository $fixture.Root -Handoff $handoff -ExpectedBlockerPrefix 'Child implementation requires durable launched coordinator evidence.'
            $delivery = Invoke-ChildDeliverySimulation -Handoff $handoff -Readiness (Get-PrReadiness -ValidationStatuses @('passed'))
            $releaseBlocked = $false
            $releaseBlocker = $null
            try {
                Invoke-HeldChildRelease -Repository $fixture.Root -Handoff $handoff -Identity $identity | Out-Null
            }
            catch {
                $releaseBlocked = $true
                $releaseBlocker = $_.Exception.Message
            }
            $remoteState = (Invoke-Git $fixture.Root @('show', "$($publication.RemoteCoordinatorSha):coordinator-state.md")).Output -join "`n"

            Assert-Condition $publication.EvidencePushAttempted 'Activation-failure fixture must first push factual launched evidence L.'
            Assert-Condition $publication.EvidencePushSucceeded 'Factual launched evidence L push must succeed.'
            Assert-Condition $publication.FactualLaunchedEvidenceDurable 'Factual launched evidence must remain remote-durable.'
            Assert-Condition (-not $publication.PushSucceeded) 'Later activation/recording head push must fail.'
            Assert-Condition (-not $publication.RemoteEqualsActivationHead) 'Remote must not be described as equal to failed Lr.'
            Assert-Condition ($publication.RemoteCoordinatorSha -eq $publication.LocalLaunchedCoordinatorSha) 'Remote must remain at factual launched evidence L after failed Lr push.'
            Assert-Condition ($publication.RemoteCoordinatorSha -ne $publication.LocalLaunchedActivationHead) 'Failed Lr must remain only local.'
            Assert-Condition ($remoteState -match '(?m)^LaunchStatus=launched$') 'Remote L must retain factual launched state.'
            Assert-Condition ($remoteState -match '(?m)^ImplementationPermitted=false$') 'Remote L must keep implementation permission false until Lr.'
            Assert-Condition ($remoteState -match '(?m)^DeliveryPermitted=false$') 'Remote L must keep delivery permission false until Lr.'
            Assert-Condition (-not $handoff.LaunchEvidenceDurable) 'Failed Lr push must not activate implementation or delivery.'
            Assert-Condition (-not $handoff.ImplementationPermitted -and -not $handoff.DeliveryPermitted) 'Failed Lr push must retain false permissions.'
            Assert-Condition ($handoff.LaunchStatus -eq 'launched') 'Failed Lr push must retain factual launched state.'
            Assert-Condition ($handoff.ReleaseStatus -eq 'held') 'Failed Lr push must keep the exact child held.'
            Assert-Condition $releaseBlocked 'Failed Lr push must block release.'
            Assert-Condition ($releaseBlocker -like 'Release requires durable launched evidence*') 'Release must fail at the durable activation gate.'
            Assert-Condition $block.ImplementationBlocked 'Failed Lr push must block implementation.'
            Assert-Condition (-not $delivery.DeliveryAttempted) 'Failed Lr push must perform no delivery.'
            Assert-Condition ($preflight.ChangedFiles.Count -eq 0) 'Held child must remain unedited through failed Lr push.'
            Assert-Condition (@((Invoke-Git $fixture.Root @('status', '--porcelain')).Output).Count -eq 0) 'Failed Lr push must leave the child worktree clean.'

            [pscustomobject]@{
                Scenario = 'activation-push-failure'
                Result = 'passed'
                TaskHandle = $identity.TaskHandle
                LaunchStatus = $handoff.LaunchStatus
                FactualLaunchedEvidenceSha = $handoff.LaunchedCoordinatorSha
                LocalActivationHead = $handoff.LaunchedRemoteActivationHead
                RemoteCoordinatorSha = $handoff.RemoteCoordinatorSha
                FactualLaunchedEvidenceDurable = $handoff.FactualLaunchedEvidenceDurable
                ActivationDurable = $handoff.LaunchEvidenceDurable
                ReleaseStatus = $handoff.ReleaseStatus
                ReleaseBlocked = $releaseBlocked
                ChangedFiles = @()
                DeliveryAttempted = $delivery.DeliveryAttempted
            } | ConvertTo-Json -Depth 5
        }
        finally {
            if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
                Remove-Item -LiteralPath $fixture.Root -Recurse -Force
            }
        }
    }
}
