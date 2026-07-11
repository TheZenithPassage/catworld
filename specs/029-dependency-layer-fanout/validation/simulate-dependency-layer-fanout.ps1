param(
    [ValidateSet(
        'independent',
        'hard-dependencies',
        'shared-contract-blocker',
        'missing-prerequisites',
        'conflict-risk-blocker',
        'unavailable-child-agent',
        'handoff-content',
        'held-dispatch-barrier',
        'handoff-recording-failure',
        'launch-activation-failure',
        'rejected-dispatch',
        'ambiguous-dispatch'
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
        [ValidateSet('independent', 'hard-dependencies', 'shared-contract-blocker', 'missing-prerequisites', 'conflict-risk-blocker', 'held-dispatch')]
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
        'missing-prerequisites' {
            $artifactChild = New-Child -Number 9902 -Title '[Workflow] Child missing artifacts fixture'
            $artifactChild.PreparedArtifacts = $false

            $gitChild = New-Child -Number 9903 -Title '[Workflow] Child missing git context fixture'
            $gitChild.BranchReady = $false
            $gitChild.WorktreeReady = $false

            $handoffChild = New-Child -Number 9904 -Title '[Workflow] Child missing handoff context fixture'
            $handoffChild.ValidationRequirementsReady = $false
            $handoffChild.PrTargetRulesReady = $false
            $handoffChild.OutOfScopeReady = $false

            @($artifactChild, $gitChild, $handoffChild)
        }
        'conflict-risk-blocker' {
            @(
                New-Child -Number 9902 -Title '[Workflow] Child routing fixture' -ConflictRisk 'non-mechanical shared workflow conflict'
                New-Child -Number 9903 -Title '[Workflow] Child reporting fixture' -ConflictRisk 'non-mechanical shared workflow conflict'
                New-Child -Number 9904 -Title '[Workflow] Child resume fixture' -ConflictRisk 'non-mechanical shared workflow conflict'
            )
        }
        'held-dispatch' {
            @(
                New-Child -Number 9902 -Title '[Workflow] Child routing fixture'
                New-Child -Number 9903 -Title '[Workflow] Child reporting fixture'
                New-Child -Number 9904 -Title '[Workflow] Child summary fixture' -Dependencies @(9902, 9903)
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
        HandoffReadyEvidenceSha = '1111111111111111111111111111111111111111'
        HandoffReadyRecordingHead = '2222222222222222222222222222222222222222'
        LaunchedEvidenceSha = '3333333333333333333333333333333333333333'
        LaunchedActivationHead = '4444444444444444444444444444444444444444'
        HandoffReadyEvidencePushed = $true
        HandoffReadyRemoteVerified = $true
        LaunchedEvidencePushed = $true
        LaunchedRemoteVerified = $true
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

    $childBranch = "sidecar/$($Child.Number)-$(ConvertTo-SidecarSlug $Child.Title)"
    $childWorktree = "<sidecar-parent>/$($Child.Number)-$(ConvertTo-SidecarSlug $Child.Title)"
    $validationRequirements = @('Run prepared child validation', 'Run git diff --check')
    $prTargetRules = 'Child PR targets the coordinator branch and uses Related to wording only.'
    $outOfScopeBoundaries = @('Sibling child scope', 'GitHub issue mutation', 'main-targeted child PR')
    $prohibitions = @(
        'Do not regenerate spec.md, plan.md, or tasks.md.',
        'Do not redefine shared contracts.',
        'Do not create sibling scope.',
        'Do not mutate GitHub issues, labels, comments, milestones, or assignees.',
        'Do not target main for sidecar child branches or child PRs.'
    )
    $fingerprintSource = [ordered]@{
        RunId = $Fixture.RunId
        ChildIssueNumber = $Child.Number
        ChildIssueTitle = $Child.Title
        ChildIssueBody = $Child.Body
        ChildIssueState = $Child.State
        ChildIssueLabels = @($Child.Labels)
        ChildDependencies = @($Child.Dependencies)
        ChildSourceReferences = @($Child.SourceReferences)
        CoordinatorIssueNumber = $Fixture.CoordinatorNumber
        CoordinatorContext = "Coordinator #$($Fixture.CoordinatorNumber): $($Fixture.CoordinatorTitle)"
        CoordinatorSourceReferences = @($Fixture.ParentReferences)
        PreparedSpec = $Child.SpecPath
        PreparedPlan = $Child.PlanPath
        PreparedTasks = $Child.TasksPath
        PreparedArtifactPath = $Child.ArtifactPath
        SharedContract = $Fixture.SharedContract
        DependencyLayer = $DependencyLayer
        ArtifactPreparationState = 'handoff-ready'
        InitialLaunchState = 'pending'
        ImplementationPermission = $false
        DeliveryPermission = $false
        HeldDispatchRequired = $true
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorRemoteBranch = $Fixture.CoordinatorRemoteBranch
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
        ChildBranch = $childBranch
        ChildWorktree = $childWorktree
        ValidationRequirements = $validationRequirements
        PrTargetRules = $prTargetRules
        OutOfScopeBoundaries = $outOfScopeBoundaries
        Prohibitions = $prohibitions
    } | ConvertTo-Json -Compress -Depth 8
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $fingerprintBytes = [System.Text.Encoding]::UTF8.GetBytes($fingerprintSource)
        $preparedHandoffFingerprint = ([System.BitConverter]::ToString($sha256.ComputeHash($fingerprintBytes))).Replace('-', '').ToLowerInvariant()
    } finally {
        $sha256.Dispose()
    }

    [pscustomobject]@{
        RunId = $Fixture.RunId
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
        ArtifactPreparationState = 'handoff-ready'
        InitialLaunchState = 'pending'
        HandoffReadyEvidenceSha = $Fixture.HandoffReadyEvidenceSha
        HandoffReadyRecordingHead = $Fixture.HandoffReadyRecordingHead
        PreparedHandoffFingerprint = $preparedHandoffFingerprint
        ImplementationPermission = $false
        DeliveryPermission = $false
        HeldDispatchRequired = $true
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorRemoteBranch = $Fixture.CoordinatorRemoteBranch
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
        ChildBranch = $childBranch
        ChildWorktree = $childWorktree
        ValidationRequirements = $validationRequirements
        PrTargetRules = $prTargetRules
        OutOfScopeBoundaries = $outOfScopeBoundaries
        Prohibitions = $prohibitions
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

function New-FanOutPreparation {
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
        $artifactPreparationState = 'not-ready'
        $layer = if ($child.Dependencies.Count -eq 0) { 1 } else { $child.Dependencies.Count + 1 }

        $unmetDependencies = @($child.Dependencies | Where-Object { $Fixture.MergedChildIssues -notcontains $_ })
        if ($capabilityBlocker) {
            $status = 'blocked'
            $reason = $capabilityBlocker
            $artifactPreparationState = 'blocked'
        } elseif ($unmetDependencies.Count -gt 0) {
            $status = 'waiting-for-dependency-merge'
            $reason = "Waiting for dependency merge: #$($unmetDependencies -join ', #')"
        } elseif ($readyNumbers -contains $child.Number) {
            $missing = @(Test-ChildPrerequisites -Fixture $Fixture -Child $child)
            if ($missing.Count -gt 0) {
                $status = 'blocked'
                $reason = "Missing prerequisite: $($missing -join ', ')"
                $artifactPreparationState = 'blocked'
            } elseif ($child.SharedContractState -ne 'ready') {
                $status = 'blocked'
                $reason = 'Shared-contract blocker requires resolution before fan-out.'
                $artifactPreparationState = 'blocked'
            } elseif ($child.ConflictRisk -ne 'none') {
                $status = 'blocked'
                $reason = 'Non-mechanical conflict risk requires user guidance.'
                $artifactPreparationState = 'blocked'
            } else {
                $status = 'pending'
                $reason = 'Prepared and handoff-ready; held dispatch has not yet been accepted.'
                $artifactPreparationState = 'handoff-ready'
                $handoffs += New-PreparedHandoff -Fixture $Fixture -Child $child -DependencyLayer $layer
            }
        }

        $statuses += [pscustomobject]@{
            Child = "#$($child.Number)"
            Layer = $layer
            Status = $status
            ArtifactPreparationState = $artifactPreparationState
            ImplementationPermission = $false
            DeliveryPermission = $false
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

function Invoke-HeldDispatch {
    param(
        [pscustomobject] $Fixture,
        [pscustomobject] $Preparation,
        [hashtable] $DispatchOutcomes = @{}
    )

    $statuses = @($Preparation.LaunchStatuses | ForEach-Object {
        [pscustomobject]@{
            Child = $_.Child
            Layer = $_.Layer
            Status = $_.Status
            ArtifactPreparationState = $_.ArtifactPreparationState
            ImplementationPermission = $_.ImplementationPermission
            DeliveryPermission = $_.DeliveryPermission
            Reason = $_.Reason
        }
    })
    $dispatches = @()
    $events = @()
    $sequence = 0
    $fanOutStopped = $Preparation.FanOutStopped
    $ambiguityDetected = $false

    if ($Preparation.Handoffs.Count -gt 0) {
        Assert-Condition $Fixture.HandoffReadyEvidencePushed 'Handoff-ready evidence H must be pushed before recording-head verification.'
        Assert-Condition (-not [string]::IsNullOrWhiteSpace($Fixture.HandoffReadyEvidenceSha)) 'Handoff-ready evidence SHA must be exact.'
        Assert-Condition (-not [string]::IsNullOrWhiteSpace($Fixture.HandoffReadyRecordingHead)) 'Handoff-ready recording head must be exact.'
        Assert-Condition ($Fixture.HandoffReadyEvidenceSha -ne $Fixture.HandoffReadyRecordingHead) 'A later recording head must store the earlier handoff-ready evidence SHA without self-reference.'

        if (-not $Fixture.HandoffReadyRemoteVerified) {
            $fanOutStopped = $true
            foreach ($status in @($statuses | Where-Object { $_.ArtifactPreparationState -eq 'handoff-ready' })) {
                $status.Reason = 'Handoff-ready evidence H is durable but recording head R push or verification failed; dispatch is prohibited.'
            }
            $sequence++
            $events += [pscustomobject]@{
                Sequence = $sequence
                Event = 'handoff-ready-recording-failed'
                Child = ''
                EvidenceSha = $Fixture.HandoffReadyEvidenceSha
                ExpectedRemoteHead = $Fixture.HandoffReadyRecordingHead
                RemoteHead = ''
                RemoteEqualsRecordingHead = $false
                EvidenceIsAncestor = $false
            }

            return [pscustomobject]@{
                FanOutStopped = $fanOutStopped
                CapabilityBlocker = $Preparation.CapabilityBlocker
                SequentialFallbackAttempted = $false
                FirstDependencyReadyLayer = $Preparation.FirstDependencyReadyLayer
                PreparationStatuses = $Preparation.LaunchStatuses
                LaunchStatuses = $statuses
                Handoffs = $Preparation.Handoffs
                Dispatches = @()
                Events = $events
                HandoffReadyEvidenceSha = $Fixture.HandoffReadyEvidenceSha
                HandoffReadyRecordingHead = ''
                ExpectedHandoffReadyRecordingHead = $Fixture.HandoffReadyRecordingHead
                HandoffReadyEvidencePushed = $true
                HandoffReadyRecordingVerified = $false
                LaunchedEvidenceSha = ''
                LaunchedActivationHead = ''
                LaunchedEvidencePushed = $false
                LaunchedActivationVerified = $false
                DuplicateDispatchAttempted = $false
                ChildRepositoryEditCount = 0
                DeliveryAttemptCount = 0
                ReleaseAttemptCount = 0
            }
        }

        $sequence++
        $events += [pscustomobject]@{
            Sequence = $sequence
            Event = 'handoff-ready-recording-verified'
            Child = ''
            EvidenceSha = $Fixture.HandoffReadyEvidenceSha
            RemoteHead = $Fixture.HandoffReadyRecordingHead
            RemoteEqualsRecordingHead = $true
            EvidenceIsAncestor = $true
        }
    }

    foreach ($handoff in $Preparation.Handoffs) {
        if ($ambiguityDetected) {
            break
        }

        $outcome = if ($DispatchOutcomes.ContainsKey($handoff.ChildIssueNumber)) {
            [string]$DispatchOutcomes[$handoff.ChildIssueNumber]
        } else {
            'accepted'
        }
        Assert-Condition (@('accepted', 'rejected', 'ambiguous') -contains $outcome) "Unsupported held-dispatch outcome: $outcome"

        $sequence++
        $dispatchIdentity = if ($outcome -eq 'accepted') {
            "held-child:$($Fixture.RunId):#$($handoff.ChildIssueNumber)"
        } else {
            ''
        }
        $dispatch = [pscustomobject]@{
            Child = "#$($handoff.ChildIssueNumber)"
            Outcome = $outcome
            DispatchAccepted = ($outcome -eq 'accepted')
            StableDispatchIdentity = $dispatchIdentity
            PreparedHandoffFingerprint = $handoff.PreparedHandoffFingerprint
            HandoffReadyEvidenceSha = $handoff.HandoffReadyEvidenceSha
            HandoffReadyRecordingHead = $handoff.HandoffReadyRecordingHead
            DuplicateDispatchAttempted = $false
            ChildRepositoryEditsBeforeRelease = 0
            ChildHeld = ($outcome -eq 'accepted')
            LaunchedRecorded = $false
            LaunchedRemoteVerified = $false
            ChildIncorporatedActivationHead = $false
            LaunchedEvidenceAncestryVerified = $false
            DeliveryAttempted = $false
            ReleaseAttempted = $false
            Released = $false
            ImplementationStarted = $false
        }
        $dispatches += $dispatch
        $events += [pscustomobject]@{
            Sequence = $sequence
            Event = "dispatch-$outcome"
            Child = $dispatch.Child
            RemoteHead = $Fixture.HandoffReadyRecordingHead
        }

        if ($outcome -eq 'rejected') {
            $status = @($statuses | Where-Object { $_.Child -eq $dispatch.Child })[0]
            $status.Status = 'blocked'
            $status.Reason = 'Held dispatch was definitely rejected; no child was released.'
        } elseif ($outcome -eq 'ambiguous') {
            $status = @($statuses | Where-Object { $_.Child -eq $dispatch.Child })[0]
            $status.Status = 'pending'
            $status.Reason = 'Held dispatch outcome is ambiguous; no retry, launch claim, or release is allowed.'
            $fanOutStopped = $true
            $ambiguityDetected = $true
        }
    }

    $acceptedDispatches = @($dispatches | Where-Object { $_.DispatchAccepted })
    if (-not $ambiguityDetected -and $acceptedDispatches.Count -gt 0) {
        Assert-Condition $Fixture.LaunchedEvidencePushed 'Factual launched evidence L must be pushed after accepted dispatch.'
        Assert-Condition (-not [string]::IsNullOrWhiteSpace($Fixture.LaunchedEvidenceSha)) 'Launched evidence SHA must be exact.'
        $sequence++
        $events += [pscustomobject]@{
            Sequence = $sequence
            Event = 'factual-launched-state-recorded'
            Child = ($acceptedDispatches.Child -join ',')
            RemoteHead = ''
        }

        foreach ($dispatch in $acceptedDispatches) {
            $status = @($statuses | Where-Object { $_.Child -eq $dispatch.Child })[0]
            $status.Status = 'launched'
            $status.Reason = 'Held dispatch was accepted and factual launched evidence is remotely durable.'
            $dispatch.LaunchedRecorded = $true
        }

        Assert-Condition (-not [string]::IsNullOrWhiteSpace($Fixture.LaunchedActivationHead)) 'Launched activation head must be exact.'
        Assert-Condition ($Fixture.LaunchedEvidenceSha -ne $Fixture.LaunchedActivationHead) 'A later activation head must store the earlier launched evidence SHA without self-reference.'
        if (-not $Fixture.LaunchedRemoteVerified) {
            $fanOutStopped = $true
            $sequence++
            $events += [pscustomobject]@{
                Sequence = $sequence
                Event = 'launched-activation-failed'
                Child = ($acceptedDispatches.Child -join ',')
                EvidenceSha = $Fixture.LaunchedEvidenceSha
                ExpectedRemoteHead = $Fixture.LaunchedActivationHead
                RemoteHead = ''
                RemoteEqualsActivationHead = $false
                EvidenceIsAncestor = $false
            }

            foreach ($dispatch in $acceptedDispatches) {
                $status = @($statuses | Where-Object { $_.Child -eq $dispatch.Child })[0]
                $status.Reason = 'Factual launched evidence L is durable, but activation head A push or verification failed; the exact child remains held with effective permissions false.'
            }
        } else {
            $sequence++
            $events += [pscustomobject]@{
                Sequence = $sequence
                Event = 'launched-activation-verified'
                Child = ($acceptedDispatches.Child -join ',')
                EvidenceSha = $Fixture.LaunchedEvidenceSha
                RemoteHead = $Fixture.LaunchedActivationHead
                RemoteEqualsActivationHead = $true
                EvidenceIsAncestor = $true
            }

            foreach ($dispatch in $acceptedDispatches) {
                $status = @($statuses | Where-Object { $_.Child -eq $dispatch.Child })[0]
                $status.ImplementationPermission = $true
                $status.DeliveryPermission = $true
                $dispatch.LaunchedRemoteVerified = $true

                $sequence++
                $events += [pscustomobject]@{
                    Sequence = $sequence
                    Event = 'child-activation-head-incorporated'
                    Child = $dispatch.Child
                    EvidenceSha = $Fixture.LaunchedEvidenceSha
                    RemoteHead = $Fixture.LaunchedActivationHead
                    EvidenceIsAncestor = $true
                }
                $dispatch.ChildIncorporatedActivationHead = $true
                $dispatch.LaunchedEvidenceAncestryVerified = $true

                $sequence++
                $events += [pscustomobject]@{
                    Sequence = $sequence
                    Event = 'exact-held-child-released'
                    Child = $dispatch.Child
                    RemoteHead = $Fixture.LaunchedActivationHead
                }
                $dispatch.ReleaseAttempted = $true
                $dispatch.Released = $true
                $dispatch.ChildHeld = $false

                $sequence++
                $events += [pscustomobject]@{
                    Sequence = $sequence
                    Event = 'prepared-implementation-started'
                    Child = $dispatch.Child
                    RemoteHead = $Fixture.LaunchedActivationHead
                }
                $dispatch.ImplementationStarted = $true
            }
        }
    }

    [pscustomobject]@{
        FanOutStopped = $fanOutStopped
        CapabilityBlocker = $Preparation.CapabilityBlocker
        SequentialFallbackAttempted = $false
        FirstDependencyReadyLayer = $Preparation.FirstDependencyReadyLayer
        PreparationStatuses = $Preparation.LaunchStatuses
        LaunchStatuses = $statuses
        Handoffs = $Preparation.Handoffs
        Dispatches = $dispatches
        Events = $events
        HandoffReadyEvidenceSha = $Fixture.HandoffReadyEvidenceSha
        HandoffReadyRecordingHead = if ($Fixture.HandoffReadyRemoteVerified) { $Fixture.HandoffReadyRecordingHead } else { '' }
        ExpectedHandoffReadyRecordingHead = $Fixture.HandoffReadyRecordingHead
        HandoffReadyEvidencePushed = $Fixture.HandoffReadyEvidencePushed
        HandoffReadyRecordingVerified = $Fixture.HandoffReadyRemoteVerified
        LaunchedEvidenceSha = if ($acceptedDispatches.Count -gt 0 -and -not $ambiguityDetected -and $Fixture.LaunchedEvidencePushed) { $Fixture.LaunchedEvidenceSha } else { '' }
        LaunchedActivationHead = if ($acceptedDispatches.Count -gt 0 -and -not $ambiguityDetected -and $Fixture.LaunchedRemoteVerified) { $Fixture.LaunchedActivationHead } else { '' }
        ExpectedLaunchedActivationHead = $Fixture.LaunchedActivationHead
        LaunchedEvidencePushed = ($acceptedDispatches.Count -gt 0 -and -not $ambiguityDetected -and $Fixture.LaunchedEvidencePushed)
        LaunchedActivationVerified = ($acceptedDispatches.Count -gt 0 -and -not $ambiguityDetected -and $Fixture.LaunchedRemoteVerified)
        DuplicateDispatchAttempted = (@($dispatches | Where-Object { $_.DuplicateDispatchAttempted }).Count -gt 0)
        ChildRepositoryEditCount = (@($dispatches | Measure-Object -Property ChildRepositoryEditsBeforeRelease -Sum).Sum)
        DeliveryAttemptCount = @($dispatches | Where-Object { $_.DeliveryAttempted }).Count
        ReleaseAttemptCount = @($dispatches | Where-Object { $_.ReleaseAttempted }).Count
    }
}

function Invoke-FanOut {
    param([pscustomobject] $Fixture)

    $preparation = New-FanOutPreparation -Fixture $Fixture
    Invoke-HeldDispatch -Fixture $Fixture -Preparation $preparation
}

function Assert-HandoffContent {
    param([pscustomobject] $Handoff)

    $requiredFields = @(
        'CoordinatorContext',
        'RunId',
        'ChildIssueBody',
        'PreparedSpec',
        'PreparedPlan',
        'PreparedTasks',
        'SharedContract',
        'DependencyLayer',
        'ArtifactPreparationState',
        'InitialLaunchState',
        'HandoffReadyEvidenceSha',
        'HandoffReadyRecordingHead',
        'PreparedHandoffFingerprint',
        'ImplementationPermission',
        'DeliveryPermission',
        'HeldDispatchRequired',
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
    Assert-Condition (-not $Handoff.ImplementationPermission) 'Prepared handoff must deny implementation before durable launched evidence.'
    Assert-Condition (-not $Handoff.DeliveryPermission) 'Prepared handoff must deny delivery before durable launched evidence.'
    Assert-Condition $Handoff.HeldDispatchRequired 'Prepared handoff must require held dispatch.'
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
    'missing-prerequisites' {
        $fixture = New-Fixture -Kind 'missing-prerequisites'
        $result = Invoke-FanOut -Fixture $fixture
        $blockedStatuses = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'blocked' })
        $reasonText = ($blockedStatuses | ForEach-Object { $_.Reason }) -join "`n"

        Assert-Condition ($result.FirstDependencyReadyLayer.Count -eq 3) 'Expected all missing-prerequisite children to be dependency-ready.'
        Assert-Condition ($result.Handoffs.Count -eq 0) 'Expected no handoffs while launch prerequisites are missing.'
        Assert-Condition ($blockedStatuses.Count -eq 3) 'Expected all missing-prerequisite children to be blocked.'
        Assert-Condition (@($blockedStatuses | Where-Object { [string]::IsNullOrWhiteSpace($_.Reason) }).Count -eq 0) 'Expected every blocked missing-prerequisite child to include a reason.'
        Assert-Condition ($reasonText -match 'prepared child artifacts') 'Expected missing prepared child artifacts to be recorded.'
        Assert-Condition ($reasonText -match 'child branch context') 'Expected missing child branch context to be recorded.'
        Assert-Condition ($reasonText -match 'child worktree context') 'Expected missing child worktree context to be recorded.'
        Assert-Condition ($reasonText -match 'validation requirements') 'Expected missing validation requirements to be recorded.'
        Assert-Condition ($reasonText -match 'PR target rules') 'Expected missing PR target rules to be recorded.'
        Assert-Condition ($reasonText -match 'out-of-scope boundaries') 'Expected missing out-of-scope boundaries to be recorded.'

        [pscustomobject]@{
            Scenario = 'missing-prerequisites'
            Result = 'passed'
            FirstDependencyReadyLayer = $result.FirstDependencyReadyLayer
            BlockedChildren = @($blockedStatuses | ForEach-Object { $_.Child })
            BlockedReasons = @($blockedStatuses | ForEach-Object { $_.Reason })
            HandoffCount = $result.Handoffs.Count
            LaunchStatuses = $result.LaunchStatuses
        } | ConvertTo-Json -Depth 6
    }
    'conflict-risk-blocker' {
        $fixture = New-Fixture -Kind 'conflict-risk-blocker'
        $result = Invoke-FanOut -Fixture $fixture
        $blockedStatuses = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'blocked' })

        Assert-Condition ($result.FirstDependencyReadyLayer.Count -eq 3) 'Expected all conflict-risk children to be dependency-ready.'
        Assert-Condition ($result.Handoffs.Count -eq 0) 'Expected no handoffs while non-mechanical conflict risks remain.'
        Assert-Condition ($blockedStatuses.Count -eq 3) 'Expected all conflict-risk children to be blocked.'
        Assert-Condition (@($blockedStatuses | Where-Object { [string]::IsNullOrWhiteSpace($_.Reason) }).Count -eq 0) 'Expected every conflict-risk child to include a reason.'
        Assert-Condition (@($blockedStatuses | Where-Object { $_.Reason -match 'Non-mechanical conflict risk' }).Count -eq 3) 'Expected every blocked child to record the conflict-risk reason.'

        [pscustomobject]@{
            Scenario = 'conflict-risk-blocker'
            Result = 'passed'
            FirstDependencyReadyLayer = $result.FirstDependencyReadyLayer
            BlockedChildren = @($blockedStatuses | ForEach-Object { $_.Child })
            BlockedReasons = @($blockedStatuses | ForEach-Object { $_.Reason })
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
    'held-dispatch-barrier' {
        $fixture = New-Fixture -Kind 'held-dispatch'
        $preparation = New-FanOutPreparation -Fixture $fixture
        $result = Invoke-HeldDispatch -Fixture $fixture -Preparation $preparation
        $preparedLayer = @($preparation.LaunchStatuses | Where-Object { $_.ArtifactPreparationState -eq 'handoff-ready' })
        $laterChildBeforeDispatch = @($preparation.LaunchStatuses | Where-Object { $_.Child -eq '#9904' })[0]
        $laterChildAfterDispatch = @($result.LaunchStatuses | Where-Object { $_.Child -eq '#9904' })[0]
        $remoteReadyEvent = @($result.Events | Where-Object { $_.Event -eq 'handoff-ready-recording-verified' })[0]
        $dispatchEvents = @($result.Events | Where-Object { $_.Event -eq 'dispatch-accepted' })
        $launchedStateEvent = @($result.Events | Where-Object { $_.Event -eq 'factual-launched-state-recorded' })[0]
        $launchedRemoteEvent = @($result.Events | Where-Object { $_.Event -eq 'launched-activation-verified' })[0]
        $releaseEvents = @($result.Events | Where-Object { $_.Event -eq 'exact-held-child-released' })
        $implementationEvents = @($result.Events | Where-Object { $_.Event -eq 'prepared-implementation-started' })
        $stableDispatchIdentities = @($result.Dispatches | ForEach-Object { $_.StableDispatchIdentity })

        Assert-Condition ($preparedLayer.Count -eq 2) 'Expected exactly two first-layer handoffs to be handoff-ready.'
        Assert-Condition (@($preparation.LaunchStatuses | Where-Object { $_.Status -eq 'launched' }).Count -eq 0) 'Launched must be absent before held dispatch acceptance.'
        Assert-Condition (@($preparedLayer | Where-Object { $_.ImplementationPermission -or $_.DeliveryPermission }).Count -eq 0) 'Prepared children must have no implementation or delivery permission.'
        Assert-Condition ($laterChildBeforeDispatch.Status -eq 'waiting-for-dependency-merge') 'Expected the dependent child to wait before dispatch.'
        Assert-Condition ($laterChildAfterDispatch.Status -eq 'waiting-for-dependency-merge') 'Expected the dependent child to remain waiting after first-layer launch.'
        Assert-Condition ($remoteReadyEvent.Sequence -lt ($dispatchEvents.Sequence | Measure-Object -Minimum).Minimum) 'Handoff-ready recording verification must precede every dispatch.'
        Assert-Condition $remoteReadyEvent.RemoteEqualsRecordingHead 'The current remote ref must equal the exact handoff-ready recording head.'
        Assert-Condition $remoteReadyEvent.EvidenceIsAncestor 'The handoff-ready recording head must contain the exact evidence SHA.'
        Assert-Condition (($dispatchEvents.Sequence | Measure-Object -Maximum).Maximum -lt $launchedStateEvent.Sequence) 'All accepted held dispatches must precede the factual launched update.'
        Assert-Condition ($launchedStateEvent.Sequence -lt $launchedRemoteEvent.Sequence) 'Factual launched evidence must be recorded before its activation head is verified.'
        Assert-Condition $launchedRemoteEvent.RemoteEqualsActivationHead 'The current remote ref must equal the exact launched activation head.'
        Assert-Condition $launchedRemoteEvent.EvidenceIsAncestor 'The launched activation head must contain the factual launched evidence SHA.'
        Assert-Condition (@($releaseEvents | Where-Object { $_.Sequence -le $launchedRemoteEvent.Sequence }).Count -eq 0) 'No held child may be released before launched remote verification.'
        Assert-Condition (@($implementationEvents | Where-Object { $_.Sequence -le $launchedRemoteEvent.Sequence }).Count -eq 0) 'Implementation must not begin before launched remote verification.'
        Assert-Condition ($result.Dispatches.Count -eq 2) 'Expected exactly two held child dispatches.'
        Assert-Condition (@($result.Dispatches | Where-Object { -not $_.DispatchAccepted }).Count -eq 0) 'Expected both held dispatches to be accepted.'
        Assert-Condition (@($stableDispatchIdentities | Where-Object { [string]::IsNullOrWhiteSpace($_) }).Count -eq 0) 'Every accepted dispatch must return a stable identity.'
        Assert-Condition (@($stableDispatchIdentities | Select-Object -Unique).Count -eq 2) 'Stable dispatch identities must identify exactly one logical child each.'
        foreach ($dispatch in $result.Dispatches) {
            $handoff = @($result.Handoffs | Where-Object { "#$($_.ChildIssueNumber)" -eq $dispatch.Child })[0]
            Assert-Condition ($dispatch.HandoffReadyEvidenceSha -eq $handoff.HandoffReadyEvidenceSha) 'Dispatch identity must retain the exact handoff-ready evidence SHA.'
            Assert-Condition ($dispatch.HandoffReadyRecordingHead -eq $handoff.HandoffReadyRecordingHead) 'Dispatch identity must retain the containing handoff-ready recording head.'
            Assert-Condition ($dispatch.PreparedHandoffFingerprint -eq $handoff.PreparedHandoffFingerprint) 'Dispatch identity must retain the exact prepared-handoff fingerprint.'
        }
        Assert-Condition (@($result.Dispatches | Where-Object { $_.DuplicateDispatchAttempted }).Count -eq 0) 'No duplicate dispatch may be attempted.'
        Assert-Condition (@($result.Dispatches | Where-Object { $_.ChildRepositoryEditsBeforeRelease -ne 0 }).Count -eq 0) 'Held children must perform zero repository edits before release.'
        Assert-Condition (@($result.Dispatches | Where-Object { -not $_.LaunchedRecorded -or -not $_.LaunchedRemoteVerified -or -not $_.ChildIncorporatedActivationHead -or -not $_.LaunchedEvidenceAncestryVerified -or -not $_.Released }).Count -eq 0) 'Every accepted child must incorporate the activation head and verify durable launched evidence before release.'
        Assert-Condition (@($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' }).Count -eq 2) 'Expected factual launched state for exactly the two accepted first-layer children.'

        [pscustomobject]@{
            Scenario = 'held-dispatch-barrier'
            Result = 'passed'
            HandoffReadyEvidenceSha = $result.HandoffReadyEvidenceSha
            HandoffReadyRecordingHead = $result.HandoffReadyRecordingHead
            LaunchedEvidenceSha = $result.LaunchedEvidenceSha
            LaunchedActivationHead = $result.LaunchedActivationHead
            PreparedChildren = @($preparedLayer | ForEach-Object { $_.Child })
            StableDispatchIdentities = $stableDispatchIdentities
            ChildRepositoryEditsBeforeRelease = @($result.Dispatches | ForEach-Object { $_.ChildRepositoryEditsBeforeRelease })
            LaunchedChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' } | ForEach-Object { $_.Child })
            WaitingChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'waiting-for-dependency-merge' } | ForEach-Object { $_.Child })
            Events = $result.Events
        } | ConvertTo-Json -Depth 8
    }
    'handoff-recording-failure' {
        $fixture = New-Fixture -Kind 'held-dispatch'
        $fixture.HandoffReadyRemoteVerified = $false
        $preparation = New-FanOutPreparation -Fixture $fixture
        $result = Invoke-HeldDispatch -Fixture $fixture -Preparation $preparation
        $preparedLayer = @($result.LaunchStatuses | Where-Object { $_.ArtifactPreparationState -eq 'handoff-ready' })
        $laterStatus = @($result.LaunchStatuses | Where-Object { $_.Child -eq '#9904' })[0]
        $failureEvent = @($result.Events | Where-Object { $_.Event -eq 'handoff-ready-recording-failed' })[0]

        Assert-Condition $result.FanOutStopped 'Recording-head failure must stop fan-out before dispatch.'
        Assert-Condition $result.HandoffReadyEvidencePushed 'Exact handoff-ready evidence H must remain durably pushed.'
        Assert-Condition (-not $result.HandoffReadyRecordingVerified) 'Recording head R must remain unverified.'
        Assert-Condition ([string]::IsNullOrWhiteSpace($result.HandoffReadyRecordingHead)) 'No current verified recording head may be claimed.'
        Assert-Condition ($result.ExpectedHandoffReadyRecordingHead -eq $fixture.HandoffReadyRecordingHead) 'Expected recording head identity must remain preserved.'
        Assert-Condition (-not $failureEvent.RemoteEqualsRecordingHead -and -not $failureEvent.EvidenceIsAncestor) 'Failed recording verification must not claim current-head equality or H ancestry.'
        Assert-Condition ($result.Dispatches.Count -eq 0) 'Recording-head failure must dispatch no child.'
        Assert-Condition (@($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' }).Count -eq 0) 'Recording-head failure must record no launched child.'
        Assert-Condition (@($preparedLayer | Where-Object { $_.ImplementationPermission -or $_.DeliveryPermission }).Count -eq 0) 'Prepared children must retain false permissions.'
        Assert-Condition ($result.ChildRepositoryEditCount -eq 0 -and $result.DeliveryAttemptCount -eq 0 -and $result.ReleaseAttemptCount -eq 0) 'Recording-head failure must perform zero edit, delivery, or release attempts.'
        Assert-Condition ($laterStatus.Status -eq 'waiting-for-dependency-merge') 'Later dependency child must remain waiting when R fails.'

        [pscustomobject]@{
            Scenario = 'handoff-recording-failure'
            Result = 'passed'
            HandoffReadyEvidenceSha = $result.HandoffReadyEvidenceSha
            ExpectedRecordingHead = $result.ExpectedHandoffReadyRecordingHead
            RecordingHeadVerified = $result.HandoffReadyRecordingVerified
            DispatchCount = $result.Dispatches.Count
            LaunchedChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' } | ForEach-Object { $_.Child })
            ChildRepositoryEditCount = $result.ChildRepositoryEditCount
            WaitingChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'waiting-for-dependency-merge' } | ForEach-Object { $_.Child })
        } | ConvertTo-Json -Depth 6
    }
    'launch-activation-failure' {
        $fixture = New-Fixture -Kind 'held-dispatch'
        $fixture.LaunchedRemoteVerified = $false
        $preparation = New-FanOutPreparation -Fixture $fixture
        $result = Invoke-HeldDispatch -Fixture $fixture -Preparation $preparation
        $acceptedDispatches = @($result.Dispatches | Where-Object { $_.DispatchAccepted })
        $launchedStatuses = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'launched' })
        $laterStatus = @($result.LaunchStatuses | Where-Object { $_.Child -eq '#9904' })[0]
        $failureEvent = @($result.Events | Where-Object { $_.Event -eq 'launched-activation-failed' })[0]

        Assert-Condition $result.FanOutStopped 'Activation-head failure must stop fan-out before release.'
        Assert-Condition ($acceptedDispatches.Count -eq 2) 'Expected exact accepted dispatches for both first-layer children.'
        Assert-Condition $result.LaunchedEvidencePushed 'Factual launched evidence L must remain durably pushed.'
        Assert-Condition (-not $result.LaunchedActivationVerified) 'Activation head A must remain unverified.'
        Assert-Condition ([string]::IsNullOrWhiteSpace($result.LaunchedActivationHead)) 'No current verified activation head may be claimed.'
        Assert-Condition ($result.ExpectedLaunchedActivationHead -eq $fixture.LaunchedActivationHead) 'Expected activation head identity must remain preserved.'
        Assert-Condition (-not $failureEvent.RemoteEqualsActivationHead -and -not $failureEvent.EvidenceIsAncestor) 'Failed activation verification must not claim current-head equality or L ancestry.'
        Assert-Condition ($launchedStatuses.Count -eq 2) 'Factual launched state must be retained for both accepted children.'
        Assert-Condition (@($launchedStatuses | Where-Object { $_.ImplementationPermission -or $_.DeliveryPermission }).Count -eq 0) 'Effective implementation and delivery permissions must remain false.'
        Assert-Condition (@($acceptedDispatches | Where-Object { -not $_.ChildHeld -or -not $_.LaunchedRecorded -or $_.LaunchedRemoteVerified -or $_.ChildIncorporatedActivationHead -or $_.Released -or $_.ImplementationStarted -or $_.DeliveryAttempted -or $_.ReleaseAttempted }).Count -eq 0) 'Accepted children must retain factual launch while staying held, unreleased, non-editing, and non-delivering.'
        Assert-Condition ($result.ChildRepositoryEditCount -eq 0 -and $result.DeliveryAttemptCount -eq 0 -and $result.ReleaseAttemptCount -eq 0) 'Activation-head failure must perform zero edit, delivery, or release attempts.'
        Assert-Condition (@($result.Events | Where-Object { $_.Event -in @('child-activation-head-incorporated', 'exact-held-child-released', 'prepared-implementation-started') }).Count -eq 0) 'Activation-head failure must not incorporate, release, or begin implementation.'
        Assert-Condition ($laterStatus.Status -eq 'waiting-for-dependency-merge') 'Later dependency child must remain waiting when A fails.'

        [pscustomobject]@{
            Scenario = 'launch-activation-failure'
            Result = 'passed'
            LaunchedEvidenceSha = $result.LaunchedEvidenceSha
            ExpectedActivationHead = $result.ExpectedLaunchedActivationHead
            ActivationHeadVerified = $result.LaunchedActivationVerified
            HeldChildren = @($acceptedDispatches | Where-Object { $_.ChildHeld } | ForEach-Object { $_.Child })
            LaunchedChildren = @($launchedStatuses | ForEach-Object { $_.Child })
            EffectivePermissions = @($launchedStatuses | ForEach-Object { [pscustomobject]@{ Child = $_.Child; Implementation = $_.ImplementationPermission; Delivery = $_.DeliveryPermission } })
            ChildRepositoryEditCount = $result.ChildRepositoryEditCount
            DeliveryAttemptCount = $result.DeliveryAttemptCount
            ReleaseAttemptCount = $result.ReleaseAttemptCount
            WaitingChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'waiting-for-dependency-merge' } | ForEach-Object { $_.Child })
        } | ConvertTo-Json -Depth 8
    }
    'rejected-dispatch' {
        $fixture = New-Fixture -Kind 'held-dispatch'
        $preparation = New-FanOutPreparation -Fixture $fixture
        $result = Invoke-HeldDispatch -Fixture $fixture -Preparation $preparation -DispatchOutcomes @{ 9902 = 'rejected'; 9903 = 'accepted' }
        $rejectedDispatch = @($result.Dispatches | Where-Object { $_.Child -eq '#9902' })[0]
        $rejectedStatus = @($result.LaunchStatuses | Where-Object { $_.Child -eq '#9902' })[0]

        Assert-Condition ($rejectedDispatch.Outcome -eq 'rejected') 'Expected the exact child dispatch to be rejected.'
        Assert-Condition (-not $rejectedDispatch.DispatchAccepted) 'Rejected dispatch must not be accepted.'
        Assert-Condition (-not $rejectedDispatch.LaunchedRecorded) 'Rejected dispatch must record no launched state.'
        Assert-Condition (-not $rejectedDispatch.Released) 'Rejected dispatch must release no child.'
        Assert-Condition ($rejectedDispatch.ChildRepositoryEditsBeforeRelease -eq 0) 'Rejected dispatch must perform zero child repository edits.'
        Assert-Condition (-not $rejectedDispatch.DuplicateDispatchAttempted) 'Rejected dispatch must not be retried as a duplicate.'
        Assert-Condition ($rejectedStatus.Status -eq 'blocked') 'Definitely rejected child must be factually blocked.'
        Assert-Condition (-not $rejectedStatus.ImplementationPermission -and -not $rejectedStatus.DeliveryPermission) 'Rejected child must have no implementation or delivery permission.'

        [pscustomobject]@{
            Scenario = 'rejected-dispatch'
            Result = 'passed'
            Child = $rejectedDispatch.Child
            Status = $rejectedStatus.Status
            LaunchedRecorded = $rejectedDispatch.LaunchedRecorded
            DuplicateDispatchAttempted = $rejectedDispatch.DuplicateDispatchAttempted
            ChildRepositoryEditsBeforeRelease = $rejectedDispatch.ChildRepositoryEditsBeforeRelease
            Released = $rejectedDispatch.Released
        } | ConvertTo-Json -Depth 6
    }
    'ambiguous-dispatch' {
        $fixture = New-Fixture -Kind 'held-dispatch'
        $preparation = New-FanOutPreparation -Fixture $fixture
        $result = Invoke-HeldDispatch -Fixture $fixture -Preparation $preparation -DispatchOutcomes @{ 9902 = 'ambiguous'; 9903 = 'accepted' }
        $ambiguousDispatch = @($result.Dispatches | Where-Object { $_.Child -eq '#9902' })[0]
        $ambiguousStatus = @($result.LaunchStatuses | Where-Object { $_.Child -eq '#9902' })[0]
        $laterStatus = @($result.LaunchStatuses | Where-Object { $_.Child -eq '#9904' })[0]

        Assert-Condition $result.FanOutStopped 'Ambiguous dispatch must stop fan-out.'
        Assert-Condition ($result.Dispatches.Count -eq 1) 'Ambiguous dispatch must stop before another child attempt can be created.'
        Assert-Condition ($ambiguousDispatch.Outcome -eq 'ambiguous') 'Expected the exact child dispatch outcome to be ambiguous.'
        Assert-Condition (-not $ambiguousDispatch.LaunchedRecorded) 'Ambiguous dispatch must record no launched state.'
        Assert-Condition (-not $ambiguousDispatch.Released) 'Ambiguous dispatch must release no child.'
        Assert-Condition ($ambiguousDispatch.ChildRepositoryEditsBeforeRelease -eq 0) 'Ambiguous dispatch must perform zero child repository edits.'
        Assert-Condition (-not $ambiguousDispatch.DuplicateDispatchAttempted) 'Ambiguous dispatch must not be retried as a duplicate.'
        Assert-Condition (@($result.Events | Where-Object { $_.Event -eq 'factual-launched-state-recorded' }).Count -eq 0) 'Ambiguous dispatch must not produce a factual launched update.'
        Assert-Condition ($ambiguousStatus.Status -eq 'pending') 'Ambiguous child must retain a non-launched state.'
        Assert-Condition (-not $ambiguousStatus.ImplementationPermission -and -not $ambiguousStatus.DeliveryPermission) 'Ambiguous child must have no implementation or delivery permission.'
        Assert-Condition ($laterStatus.Status -eq 'waiting-for-dependency-merge') 'Later dependency child must remain waiting during dispatch ambiguity.'

        [pscustomobject]@{
            Scenario = 'ambiguous-dispatch'
            Result = 'passed'
            Child = $ambiguousDispatch.Child
            FanOutStopped = $result.FanOutStopped
            DispatchAttemptCount = $result.Dispatches.Count
            Status = $ambiguousStatus.Status
            LaunchedRecorded = $ambiguousDispatch.LaunchedRecorded
            DuplicateDispatchAttempted = $ambiguousDispatch.DuplicateDispatchAttempted
            ChildRepositoryEditsBeforeRelease = $ambiguousDispatch.ChildRepositoryEditsBeforeRelease
            Released = $ambiguousDispatch.Released
            WaitingChildren = @($result.LaunchStatuses | Where-Object { $_.Status -eq 'waiting-for-dependency-merge' } | ForEach-Object { $_.Child })
        } | ConvertTo-Json -Depth 6
    }
}
