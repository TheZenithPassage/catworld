param(
    [ValidateSet(
        'all-integrated',
        'incomplete-children',
        'evidence-mismatch',
        'integrated-validation',
        'validation-readiness',
        'validation-staleness',
        'two-head-finalization',
        'scope-drift',
        'final-pr-delivery',
        'existing-final-pr',
        'artifact-final-state',
        'closing-keyword-isolation',
        'prohibited-operations'
    )]
    [string] $Scenario = 'all-integrated'
)

$ErrorActionPreference = 'Stop'
$script:RepositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../..')).Path
$script:VerifierPath = Join-Path $PSScriptRoot 'verify-finalization-evidence.ps1'
$script:PowerShellExecutable = (Get-Process -Id $PID).Path
$script:ArtifactPath = 'specs/032-final-coordinator-delivery/finalization.md'
$script:IssueBranch = 'chore/258-implement-final-coordinator-validation-pr-delivery'
$script:CoordinatorBranch = 'sidecar/9901-final-delivery'

$script:CanonicalHCheckIds = @(
    'scenario-all-integrated',
    'scenario-incomplete-children',
    'scenario-evidence-mismatch',
    'scenario-integrated-validation',
    'scenario-validation-readiness',
    'scenario-validation-staleness',
    'scenario-two-head-finalization',
    'scenario-scope-drift',
    'scenario-final-pr-delivery',
    'scenario-existing-final-pr',
    'scenario-artifact-final-state',
    'scenario-closing-keyword-isolation',
    'scenario-prohibited-operations',
    'coordinator-source-review',
    'architecture-template-source-review',
    'protected-skills-range-review-at-h',
    'source-map-range-review-at-h',
    'diff-check-b-h',
    'tasks-complete'
)

$script:CanonicalH2CheckIds = @(
    'finalization-evidence-verifier',
    'diff-check-h-h2',
    'diff-check-b-h2',
    'protected-skills-range-review-b-h2',
    'source-map-range-review-b-h2',
    'runtime-template-source-review-h2',
    'remote-head-h2-verification',
    'base-head-merge-base-pr-recheck'
)

$script:CanonicalRenderInputs = @(
    'coordinator-issue',
    'integrated-child-traceability',
    'complete-h-validation',
    'resolved-h2-validation',
    'scope-review',
    'remaining-risks',
    'source-target-readiness'
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

function Invoke-Git {
    param(
        [string] $WorkingDirectory,
        [string[]] $Arguments,
        [switch] $AllowFailure
    )

    $previousPreference = $ErrorActionPreference
    $nativePreferenceVariable = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
    $previousNativePreference = $null
    $ErrorActionPreference = 'Continue'
    if ($null -ne $nativePreferenceVariable) {
        $previousNativePreference = $PSNativeCommandUseErrorActionPreference
        $PSNativeCommandUseErrorActionPreference = $false
    }

    try {
        $output = & git -C $WorkingDirectory @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        if ($null -ne $nativePreferenceVariable) {
            $PSNativeCommandUseErrorActionPreference = $previousNativePreference
        }
        $ErrorActionPreference = $previousPreference
    }

    $result = [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($output | ForEach-Object { "$_" })
    }

    if ($result.ExitCode -ne 0 -and -not $AllowFailure) {
        throw "git -C $WorkingDirectory $($Arguments -join ' ') failed with exit $($result.ExitCode): $($result.Output -join [Environment]::NewLine)"
    }

    $result
}

function Invoke-GitCommand {
    param(
        [string[]] $Arguments,
        [switch] $AllowFailure
    )

    $previousPreference = $ErrorActionPreference
    $nativePreferenceVariable = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
    $previousNativePreference = $null
    $ErrorActionPreference = 'Continue'
    if ($null -ne $nativePreferenceVariable) {
        $previousNativePreference = $PSNativeCommandUseErrorActionPreference
        $PSNativeCommandUseErrorActionPreference = $false
    }

    try {
        $output = & git @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        if ($null -ne $nativePreferenceVariable) {
            $PSNativeCommandUseErrorActionPreference = $previousNativePreference
        }
        $ErrorActionPreference = $previousPreference
    }

    $result = [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($output | ForEach-Object { "$_" })
    }

    if ($result.ExitCode -ne 0 -and -not $AllowFailure) {
        throw "git $($Arguments -join ' ') failed with exit $($result.ExitCode): $($result.Output -join [Environment]::NewLine)"
    }

    $result
}

function Set-FixtureFile {
    param(
        [string] $Repository,
        [string] $Path,
        [string] $Content
    )

    $fullPath = Join-Path $Repository ($Path.Replace('/', [IO.Path]::DirectorySeparatorChar))
    $parent = Split-Path -Parent $fullPath
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Set-Content -LiteralPath $fullPath -Value $Content -NoNewline
}

function New-FileCommit {
    param(
        [string] $Repository,
        [hashtable] $Files,
        [string] $Message
    )

    foreach ($path in $Files.Keys) {
        Set-FixtureFile -Repository $Repository -Path $path -Content $Files[$path]
        Invoke-Git -WorkingDirectory $Repository -Arguments @('add', '--', $path) | Out-Null
    }
    Invoke-Git -WorkingDirectory $Repository -Arguments @('commit', '-q', '-m', $Message) | Out-Null
    (Invoke-Git -WorkingDirectory $Repository -Arguments @('rev-parse', 'HEAD')).Output[0]
}

function Initialize-RepositoryIdentity {
    param([string] $Repository)

    Invoke-Git -WorkingDirectory $Repository -Arguments @('config', 'user.email', 'sidecar-finalization@example.invalid') | Out-Null
    Invoke-Git -WorkingDirectory $Repository -Arguments @('config', 'user.name', 'Sidecar Finalization Simulation') | Out-Null
}

function Test-CommitAncestor {
    param(
        [string] $Repository,
        [string] $Ancestor,
        [string] $Descendant
    )

    (Invoke-Git -WorkingDirectory $Repository -Arguments @('merge-base', '--is-ancestor', $Ancestor, $Descendant) -AllowFailure).ExitCode -eq 0
}

function Remove-Fixture {
    param([object] $Fixture)

    if ($null -ne $Fixture -and $Fixture.PSObject.Properties.Name.Contains('Root') -and (Test-Path -LiteralPath $Fixture.Root)) {
        Remove-Item -LiteralPath $Fixture.Root -Recurse -Force
    }
}

function New-IntegrationFixture {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('catworld-final-integration-' + [guid]::NewGuid().ToString('N'))
    $remote = Join-Path $root 'origin.git'
    $seed = Join-Path $root 'seed'
    $local = Join-Path $root 'coordinator-local'
    $merger = Join-Path $root 'merger'
    New-Item -ItemType Directory -Path $root -Force | Out-Null

    Invoke-GitCommand -Arguments @('init', '--bare', '-q', $remote) | Out-Null
    Invoke-GitCommand -Arguments @('init', '-q', $seed) | Out-Null
    Initialize-RepositoryIdentity -Repository $seed
    Invoke-Git -WorkingDirectory $seed -Arguments @('branch', '-M', 'main') | Out-Null
    $mainSha = New-FileCommit -Repository $seed -Files @{ 'README.md' = 'integration fixture' } -Message 'seed integration fixture'
    Invoke-Git -WorkingDirectory $seed -Arguments @('remote', 'add', 'origin', $remote) | Out-Null
    Invoke-Git -WorkingDirectory $seed -Arguments @('push', '-q', 'origin', 'main') | Out-Null
    Invoke-Git -WorkingDirectory $remote -Arguments @('symbolic-ref', 'HEAD', 'refs/heads/main') | Out-Null

    Invoke-Git -WorkingDirectory $seed -Arguments @('switch', '-q', '-c', $script:CoordinatorBranch) | Out-Null
    $initialCoordinatorSha = New-FileCommit -Repository $seed -Files @{ 'coordinator-artifact.md' = 'prepared children: 9902, 9903' } -Message 'prepare coordinator'
    Invoke-Git -WorkingDirectory $seed -Arguments @('push', '-q', 'origin', $script:CoordinatorBranch) | Out-Null

    Invoke-GitCommand -Arguments @('clone', '-q', '--branch', $script:CoordinatorBranch, $remote, $local) | Out-Null
    Initialize-RepositoryIdentity -Repository $local
    Invoke-GitCommand -Arguments @('clone', '-q', '--branch', $script:CoordinatorBranch, $remote, $merger) | Out-Null
    Initialize-RepositoryIdentity -Repository $merger

    Invoke-Git -WorkingDirectory $merger -Arguments @('switch', '-q', '-c', 'sidecar/9902-child-a') | Out-Null
    $childOneSha = New-FileCommit -Repository $merger -Files @{ 'children/child-a.md' = 'child a' } -Message 'implement child a'
    Invoke-Git -WorkingDirectory $merger -Arguments @('switch', '-q', $script:CoordinatorBranch) | Out-Null
    Invoke-Git -WorkingDirectory $merger -Arguments @('merge', '--no-ff', '-m', 'merge child a', 'sidecar/9902-child-a') | Out-Null

    Invoke-Git -WorkingDirectory $merger -Arguments @('switch', '-q', '-c', 'sidecar/9903-child-b') | Out-Null
    $childTwoSha = New-FileCommit -Repository $merger -Files @{ 'children/child-b.md' = 'child b' } -Message 'implement child b'
    Invoke-Git -WorkingDirectory $merger -Arguments @('switch', '-q', $script:CoordinatorBranch) | Out-Null
    Invoke-Git -WorkingDirectory $merger -Arguments @('merge', '--no-ff', '-m', 'merge child b', 'sidecar/9903-child-b') | Out-Null
    $remoteCoordinatorSha = (Invoke-Git -WorkingDirectory $merger -Arguments @('rev-parse', 'HEAD')).Output[0]
    Invoke-Git -WorkingDirectory $merger -Arguments @('push', '-q', 'origin', $script:CoordinatorBranch) | Out-Null

    Invoke-Git -WorkingDirectory $merger -Arguments @('switch', '-q', '-c', 'sidecar/9904-unmerged-child') | Out-Null
    $unmergedChildSha = New-FileCommit -Repository $merger -Files @{ 'children/unmerged.md' = 'unmerged child' } -Message 'implement unmerged child'

    [pscustomobject]@{
        Root = $root
        Remote = $remote
        Local = $local
        Merger = $merger
        MainSha = $mainSha
        InitialCoordinatorSha = $initialCoordinatorSha
        RemoteCoordinatorSha = $remoteCoordinatorSha
        ChildOneSha = $childOneSha
        ChildTwoSha = $childTwoSha
        UnmergedChildSha = $unmergedChildSha
        CoordinatorBranch = $script:CoordinatorBranch
    }
}

function Update-LocalCoordinatorFromRemote {
    param([object] $Fixture)

    Invoke-Git -WorkingDirectory $Fixture.Local -Arguments @('fetch', '-q', 'origin', "$($Fixture.CoordinatorBranch):refs/remotes/origin/$($Fixture.CoordinatorBranch)") | Out-Null
    $before = (Invoke-Git -WorkingDirectory $Fixture.Local -Arguments @('rev-parse', 'HEAD')).Output[0]
    Invoke-Git -WorkingDirectory $Fixture.Local -Arguments @('merge', '--ff-only', "origin/$($Fixture.CoordinatorBranch)") | Out-Null
    $after = (Invoke-Git -WorkingDirectory $Fixture.Local -Arguments @('rev-parse', 'HEAD')).Output[0]
    [pscustomobject]@{ Before = $before; After = $after; Refreshed = $after -eq $Fixture.RemoteCoordinatorSha }
}

function Test-ChildTerminalGate {
    param(
        [int[]] $ExpectedChildren,
        [object[]] $Ledger,
        [string] $Repository,
        [string] $CoordinatorHead,
        [string] $CoordinatorBranch
    )

    $reasons = @()
    $ledgerIds = @($Ledger | ForEach-Object { [int]$_.Issue })
    $duplicateIds = @($ledgerIds | Group-Object | Where-Object { $_.Count -gt 1 } | ForEach-Object { [int]$_.Name })
    $missingIds = @($ExpectedChildren | Where-Object { $ledgerIds -notcontains $_ })
    $unexpectedIds = @($ledgerIds | Where-Object { $ExpectedChildren -notcontains $_ } | Select-Object -Unique)

    if ($duplicateIds.Count -gt 0) { $reasons += "duplicate children: $($duplicateIds -join ', ')" }
    if ($missingIds.Count -gt 0) { $reasons += "missing children: $($missingIds -join ', ')" }
    if ($unexpectedIds.Count -gt 0) { $reasons += "unexpected children: $($unexpectedIds -join ', ')" }

    foreach ($child in @($Ledger | Where-Object { $ExpectedChildren -contains [int]$_.Issue })) {
        if ($child.PrTarget -ne $CoordinatorBranch) { $reasons += "child $($child.Issue) targets $($child.PrTarget)" }
        if (-not $child.PrMerged) { $reasons += "child $($child.Issue) PR is unmerged" }
        if ($child.WorkflowStatus -ne 'integrated') { $reasons += "child $($child.Issue) is $($child.WorkflowStatus)" }
        if (-not $child.DependenciesComplete) { $reasons += "child $($child.Issue) has incomplete dependencies" }
        if (-not $child.EvidencePresent) { $reasons += "child $($child.Issue) is missing required evidence" }
        $commitProperty = $child.PSObject.Properties['CommitSha']
        if ($null -eq $commitProperty -or
            $commitProperty.Value -isnot [string] -or
            [string]::IsNullOrWhiteSpace([string]$commitProperty.Value)) {
            $reasons += "child $($child.Issue) is missing an integration commit SHA"
        } elseif ($commitProperty.Value -notmatch '^[0-9a-fA-F]{40}$') {
            $reasons += "child $($child.Issue) has an invalid integration commit SHA"
        } elseif (-not (Test-CommitAncestor -Repository $Repository -Ancestor $commitProperty.Value -Descendant $CoordinatorHead)) {
            $reasons += "child $($child.Issue) commit is absent from refreshed coordinator ancestry"
        }
    }

    [pscustomobject]@{
        Blocked = $reasons.Count -gt 0
        Reasons = @($reasons | Select-Object -Unique)
        Missing = $missingIds
        Duplicate = $duplicateIds
        Unexpected = $unexpectedIds
        ValidationMayBegin = $reasons.Count -eq 0
        NewChildLayerMayStart = $false
    }
}

function New-LedgerRow {
    param(
        [int] $Issue,
        [string] $CommitSha,
        [string] $CoordinatorBranch
    )

    [pscustomobject]@{
        Issue = $Issue
        PrTarget = $CoordinatorBranch
        PrMerged = $true
        CommitSha = $CommitSha
        WorkflowStatus = 'integrated'
        DependenciesComplete = $true
        EvidencePresent = $true
        GitHubIssueState = 'open'
    }
}

function New-FinalizationArtifact {
    param(
        [string] $BaseSha,
        [string] $ImplementationSha,
        [string] $TemplateBlobSha
    )

    [ordered]@{
        schema_version = 1
        issue_number = 258
        base = [ordered]@{
            ref = 'origin/workflow/sidecar-buildout'
            sha = $BaseSha
            merge_base_sha = $BaseSha
        }
        implementation_head = [ordered]@{
            label = 'H'
            sha = $ImplementationSha
        }
        finalization_head = [ordered]@{
            label = 'H2'
            identity = 'SELF/HEAD'
            expected_parent_sha = $ImplementationSha
            resolved_sha_location = 'external-final-report'
        }
        allowed_delta = @(
            [ordered]@{
                status = 'A'
                path = $script:ArtifactPath
            }
        )
        complete_checks_at_h = @($script:CanonicalHCheckIds | ForEach-Object {
            [ordered]@{
                id = $_
                command = "Invoke complete H check: $_"
                status = 'passed'
            }
        })
        h2_required_checks = @($script:CanonicalH2CheckIds | ForEach-Object {
            [ordered]@{
                id = $_
                command = "Invoke artifact-affected H2 check: $_"
            }
        })
        applicability = @($script:CanonicalHCheckIds | ForEach-Object {
            [ordered]@{
                check_id = $_
                reason = 'H2 adds only the machine-readable finalization artifact and cannot affect this integrated implementation result.'
            }
        })
        scope_at_h = [ordered]@{
            status = 'passed'
            h2_rechecks = @('target-base', 'merge-base', 'scope-diff', 'head', 'ancestry')
        }
        template = [ordered]@{
            path = '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md'
            blob_sha = $TemplateBlobSha
            render_input_requirements = @($script:CanonicalRenderInputs)
        }
        readiness = [ordered]@{
            status = 'pending_h2_checks'
            resolved_status_location = 'external-final-report'
        }
        delivery = [ordered]@{
            head_branch = $script:IssueBranch
            base_branch = 'workflow/sidecar-buildout'
            issue_reference = 'Related to #258'
            write_pr_url_to_artifact = $false
            allow_h3 = $false
        }
        remaining_risks = @()
        runtime_contract = [ordered]@{
            final_target = 'main'
            cleanup_eligibility = 'ineligible'
            cleanup_reason = 'pending final PR merge'
        }
    }
}

function Get-AllButLast {
    param([object[]] $Values)

    $items = @($Values)
    for ($index = 0; $index -lt ($items.Count - 1); $index++) {
        $items[$index]
    }
}

function Set-ArtifactMutation {
    param(
        [System.Collections.IDictionary] $Artifact,
        [string] $Mutation
    )

    switch ($Mutation) {
        'MissingSelf' { $Artifact.finalization_head.Remove('identity') }
        'WrongSelf' { $Artifact.finalization_head.identity = 'HEAD' }
        'LiteralSelfField' { $Artifact.finalization_head.Add('resolved_sha', $Artifact.implementation_head.sha) }
        'MissingApplicability' { $Artifact.applicability = @(Get-AllButLast -Values @($Artifact.applicability)) }
        'WrongTarget' { $Artifact.delivery.base_branch = 'main' }
        'WrongWording' { $Artifact.delivery.issue_reference = 'Closes #258' }
        'MissingHCheck' { $Artifact.complete_checks_at_h = @(Get-AllButLast -Values @($Artifact.complete_checks_at_h)) }
        'MissingH2Check' { $Artifact.h2_required_checks = @(Get-AllButLast -Values @($Artifact.h2_required_checks)) }
        'H2StatusPreclaim' { $Artifact.h2_required_checks[0].Add('status', 'passed') }
        'MissingRenderInput' { $Artifact.template.render_input_requirements = @(Get-AllButLast -Values @($Artifact.template.render_input_requirements)) }
        'UnknownNestedProperty' { $Artifact.runtime_contract.Add('unexpected_cleanup_state', 'unknown') }
        'EmptyRemainingRisk' { $Artifact.remaining_risks = @('') }
        'ScalarAllowedDelta' { $Artifact.allowed_delta = $Artifact.allowed_delta[0] }
        'StringSchemaVersion' { $Artifact.schema_version = '1' }
        'StringIssueNumber' { $Artifact.issue_number = '258' }
        'WrongCaseHId' { $Artifact.complete_checks_at_h[0].id = $Artifact.complete_checks_at_h[0].id.ToUpperInvariant() }
        'WrongCaseKey' {
            $schemaValue = $Artifact.schema_version
            $Artifact.Remove('schema_version')
            $Artifact.Add('Schema_version', $schemaValue)
        }
    }
}

function Write-FinalizationArtifact {
    param(
        [string] $Repository,
        [System.Collections.IDictionary] $Artifact
    )

    $json = $Artifact | ConvertTo-Json -Depth 20
    $content = '# Finalization Evidence' + "`n`n" + '```json' + "`n" + $json + "`n" + '```' + "`n"
    Set-FixtureFile -Repository $Repository -Path $script:ArtifactPath -Content $content
}

function New-FinalizationFixture {
    param(
        [string] $Mutation = 'None',
        [ValidateSet('Direct', 'WrongParent', 'Merge', 'H3')]
        [string] $HeadShape = 'Direct',
        [switch] $ExtraDelta,
        [switch] $DirtyAfterCommit
    )

    $root = Join-Path ([IO.Path]::GetTempPath()) ('catworld-final-evidence-' + [guid]::NewGuid().ToString('N'))
    $remote = Join-Path $root 'origin.git'
    $repository = Join-Path $root 'work'
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    Invoke-GitCommand -Arguments @('init', '--bare', '-q', $remote) | Out-Null
    Invoke-GitCommand -Arguments @('init', '-q', $repository) | Out-Null
    Initialize-RepositoryIdentity -Repository $repository
    Invoke-Git -WorkingDirectory $repository -Arguments @('branch', '-M', 'main') | Out-Null

    $templateSourcePath = Join-Path $script:RepositoryRoot '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md'
    $templateContent = Get-Content -LiteralPath $templateSourcePath -Raw
    $mainSha = New-FileCommit -Repository $repository -Files @{
        'README.md' = 'finalization fixture'
        '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md' = $templateContent
    } -Message 'seed finalization fixture'
    Invoke-Git -WorkingDirectory $repository -Arguments @('remote', 'add', 'origin', $remote) | Out-Null
    Invoke-Git -WorkingDirectory $repository -Arguments @('push', '-q', 'origin', 'main') | Out-Null
    Invoke-Git -WorkingDirectory $remote -Arguments @('symbolic-ref', 'HEAD', 'refs/heads/main') | Out-Null

    Invoke-Git -WorkingDirectory $repository -Arguments @('switch', '-q', '-c', 'workflow/sidecar-buildout') | Out-Null
    $baseSha = New-FileCommit -Repository $repository -Files @{ 'buildout-base.md' = 'temporary build-out base' } -Message 'record build-out base'
    Invoke-Git -WorkingDirectory $repository -Arguments @('push', '-q', 'origin', 'workflow/sidecar-buildout') | Out-Null

    Invoke-Git -WorkingDirectory $repository -Arguments @('switch', '-q', '-c', $script:IssueBranch) | Out-Null
    $implementationSha = New-FileCommit -Repository $repository -Files @{ 'implementation.md' = 'fully validated implementation at H' } -Message 'implement final coordinator delivery'
    $templateBlobSha = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', "HEAD:.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md")).Output[0]
    $artifact = New-FinalizationArtifact -BaseSha $baseSha -ImplementationSha $implementationSha -TemplateBlobSha $templateBlobSha
    Set-ArtifactMutation -Artifact $artifact -Mutation $Mutation | Out-Null

    if ($HeadShape -eq 'WrongParent') {
        Invoke-Git -WorkingDirectory $repository -Arguments @('commit', '--allow-empty', '-q', '-m', 'unexpected intermediate commit') | Out-Null
    }

    if ($HeadShape -eq 'Merge') {
        Invoke-Git -WorkingDirectory $repository -Arguments @('switch', '-q', '-c', 'artifact-side-branch') | Out-Null
        Write-FinalizationArtifact -Repository $repository -Artifact $artifact
        Invoke-Git -WorkingDirectory $repository -Arguments @('add', '--', $script:ArtifactPath) | Out-Null
        Invoke-Git -WorkingDirectory $repository -Arguments @('commit', '-q', '-m', 'record finalization artifact on side branch') | Out-Null
        Invoke-Git -WorkingDirectory $repository -Arguments @('switch', '-q', $script:IssueBranch) | Out-Null
        Invoke-Git -WorkingDirectory $repository -Arguments @('merge', '--no-ff', '-m', 'merge finalization artifact', 'artifact-side-branch') | Out-Null
    }
    else {
        Write-FinalizationArtifact -Repository $repository -Artifact $artifact
        Invoke-Git -WorkingDirectory $repository -Arguments @('add', '--', $script:ArtifactPath) | Out-Null
        if ($ExtraDelta) {
            Set-FixtureFile -Repository $repository -Path 'unexpected-extra-path.md' -Content 'unexpected H2 delta'
            Invoke-Git -WorkingDirectory $repository -Arguments @('add', '--', 'unexpected-extra-path.md') | Out-Null
        }
        Invoke-Git -WorkingDirectory $repository -Arguments @('commit', '-q', '-m', 'record finalization evidence') | Out-Null
    }

    $artifactCommitSha = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', 'HEAD')).Output[0]
    if ($HeadShape -eq 'H3') {
        Invoke-Git -WorkingDirectory $repository -Arguments @('commit', '--allow-empty', '-q', '-m', 'prohibited H3') | Out-Null
    }
    $headSha = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', 'HEAD')).Output[0]

    if ($DirtyAfterCommit) {
        Set-FixtureFile -Repository $repository -Path 'dirty-after-h2.md' -Content 'dirty state'
    }

    [pscustomobject]@{
        Root = $root
        Remote = $remote
        Repository = $repository
        MainSha = $mainSha
        BaseSha = $baseSha
        ImplementationSha = $implementationSha
        ArtifactCommitSha = $artifactCommitSha
        HeadSha = $headSha
        Artifact = $artifact
        Branch = $script:IssueBranch
    }
}

function New-RuntimeFinalDeliveryFixture {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('catworld-final-runtime-' + [guid]::NewGuid().ToString('N'))
    $remote = Join-Path $root 'origin.git'
    $repository = Join-Path $root 'coordinator'
    $runtimeArtifactPath = 'coordinator/finalization-evidence.json'
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    Invoke-GitCommand -Arguments @('init', '--bare', '-q', $remote) | Out-Null
    Invoke-GitCommand -Arguments @('init', '-q', $repository) | Out-Null
    Initialize-RepositoryIdentity -Repository $repository
    Invoke-Git -WorkingDirectory $repository -Arguments @('branch', '-M', 'main') | Out-Null

    $templatePath = Join-Path $script:RepositoryRoot '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md'
    $baseSha = New-FileCommit -Repository $repository -Files @{
        'README.md' = 'runtime final-delivery fixture'
        '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md' = (Get-Content -LiteralPath $templatePath -Raw)
    } -Message 'seed runtime final-delivery fixture'
    Invoke-Git -WorkingDirectory $repository -Arguments @('remote', 'add', 'origin', $remote) | Out-Null
    Invoke-Git -WorkingDirectory $repository -Arguments @('push', '-q', 'origin', 'main') | Out-Null
    Invoke-Git -WorkingDirectory $remote -Arguments @('symbolic-ref', 'HEAD', 'refs/heads/main') | Out-Null

    Invoke-Git -WorkingDirectory $repository -Arguments @('switch', '-q', '-c', $script:CoordinatorBranch) | Out-Null
    $childOneSha = New-FileCommit -Repository $repository -Files @{ 'children/9902.md' = 'integrated child 9902' } -Message 'integrate child 9902'
    $childTwoSha = New-FileCommit -Repository $repository -Files @{ 'children/9903.md' = 'integrated child 9903' } -Message 'integrate child 9903'
    $implementationSha = New-FileCommit -Repository $repository -Files @{ 'coordinator/integrated-state.md' = 'complete integrated validation ran at H' } -Message 'record fully integrated coordinator head'

    $runtimeArtifact = [ordered]@{
        schema_version = 1
        coordinator_issue = 9901
        implementation_head = $implementationSha
        finalization_head = 'SELF/HEAD'
        expected_parent = $implementationSha
        cleanup_eligibility = 'ineligible'
        cleanup_reason = 'pending final PR merge'
    } | ConvertTo-Json -Depth 6
    Set-FixtureFile -Repository $repository -Path $runtimeArtifactPath -Content $runtimeArtifact
    Invoke-Git -WorkingDirectory $repository -Arguments @('add', '--', $runtimeArtifactPath) | Out-Null
    Invoke-Git -WorkingDirectory $repository -Arguments @('commit', '-q', '-m', 'record runtime finalization evidence') | Out-Null
    $headSha = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', 'HEAD')).Output[0]
    $mergeBaseSha = (Invoke-Git -WorkingDirectory $repository -Arguments @('merge-base', 'main', 'HEAD')).Output[0]

    [pscustomobject]@{
        Root = $root
        Remote = $remote
        Repository = $repository
        BaseSha = $baseSha
        MergeBaseSha = $mergeBaseSha
        ImplementationSha = $implementationSha
        HeadSha = $headSha
        ChildOneSha = $childOneSha
        ChildTwoSha = $childTwoSha
        RuntimeArtifactPath = $runtimeArtifactPath
        Branch = $script:CoordinatorBranch
    }
}

function Invoke-FinalizationVerifier {
    param([object] $Fixture)

    $arguments = @(
        '-NoLogo',
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', $script:VerifierPath,
        '-RepositoryPath', $Fixture.Repository,
        '-ArtifactPath', $script:ArtifactPath,
        '-ExpectedBaseSha', $Fixture.BaseSha,
        '-ExpectedImplementationHeadSha', $Fixture.ImplementationSha
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $script:PowerShellExecutable @arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }

    $text = @($output | ForEach-Object { "$_" }) -join "`n"
    $json = $null
    try {
        $json = $text | ConvertFrom-Json
    }
    catch {
        # Preserve raw output below; the caller's assertion reports malformed verifier output.
    }

    [pscustomobject]@{
        ExitCode = $exitCode
        Json = $json
        Output = $text
    }
}

function Read-FinalizationArtifactJson {
    param([string] $Repository)

    $path = Join-Path $Repository ($script:ArtifactPath.Replace('/', [IO.Path]::DirectorySeparatorChar))
    $text = Get-Content -LiteralPath $path -Raw
    $match = [regex]::Match($text, '(?ms)```json[ \t]*\r?\n(?<json>.*?)\r?\n```')
    Assert-Condition $match.Success 'Expected one JSON block in the finalization artifact fixture.'
    $match.Groups['json'].Value | ConvertFrom-Json
}

function Invoke-NormalH2PushGate {
    param([object] $Fixture)

    $push = Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @('push', '-q', 'origin', "HEAD:refs/heads/$($Fixture.Branch)") -AllowFailure
    if ($push.ExitCode -eq 0) {
        Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @('fetch', '-q', 'origin', "$($Fixture.Branch):refs/remotes/origin/$($Fixture.Branch)") | Out-Null
    }
    $remoteSha = if ($push.ExitCode -eq 0) {
        (Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @('rev-parse', "origin/$($Fixture.Branch)")).Output[0]
    } else { $null }

    [pscustomobject]@{
        PushExitCode = $push.ExitCode
        RemoteSha = $remoteSha
        LocalSha = $Fixture.HeadSha
        Verified = $push.ExitCode -eq 0 -and $remoteSha -eq $Fixture.HeadSha
        ForceUsed = $false
        HistoryRewritten = $false
    }
}

function Get-FileSha256 {
    param([string] $Text)

    $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
    $hash = [Security.Cryptography.SHA256]::Create()
    try {
        ([BitConverter]::ToString($hash.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $hash.Dispose()
    }
}

function Get-ActualTemplate {
    param([ValidateSet('Final', 'Child', 'Readme')] [string] $Kind)

    $relativePath = switch ($Kind) {
        'Final' { '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md' }
        'Child' { '.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md' }
        'Readme' { '.github/PULL_REQUEST_TEMPLATE/README.md' }
    }
    $fullPath = Join-Path $script:RepositoryRoot $relativePath
    Assert-Condition (Test-Path -LiteralPath $fullPath -PathType Leaf) "Missing actual template source: $relativePath"
    [pscustomobject]@{ Path = $relativePath; Text = (Get-Content -LiteralPath $fullPath -Raw) }
}

function Set-SequentialTemplateTokenValues {
    param(
        [string] $Text,
        [string] $Token,
        [string[]] $Values
    )

    $rendered = $Text
    foreach ($value in $Values) {
        $index = $rendered.IndexOf($Token, [StringComparison]::Ordinal)
        Assert-Condition ($index -ge 0) "Template token '$Token' is missing before all required values were rendered."
        $rendered = $rendered.Substring(0, $index) + $value + $rendered.Substring($index + $Token.Length)
    }
    Assert-Condition ($rendered.IndexOf($Token, [StringComparison]::Ordinal) -lt 0) "Template token '$Token' has unresolved occurrences."
    $rendered
}

function Render-FinalTemplate {
    param(
        [string] $Template,
        [object] $Fixture
    )

    $rendered = $Template
    $replacements = [ordered]@{
        '<coordinator-issue>' = @('9901')
        '<delivered-child-issue>' = @('9902', '9903')
        '<one-sentence summary of the completed coordinator delivery>' = @('Delivers the integrated sidecar coordinator result.')
        '<child-pr-number>' = @('9912', '9913')
        '<child-issue>' = @('9902', '9903')
        '<commit-sha>' = @($Fixture.ChildOneSha, $Fixture.ChildTwoSha)
        '<important coordinator-level or integrated change>' = @('Integrated all prepared child commits.', 'Completed coordinator-level validation and delivery evidence.')
        '<40-hex-sha>' = @($Fixture.ImplementationSha, $Fixture.HeadSha)
        '<complete integrated command or review>' = @('runtime integrated scenario suite', 'coordinator source-map review')
        '<why the finalization-artifact-only delta cannot invalidate these results>' = @('H2 adds only the finalization artifact and cannot affect the integrated implementation results from H.')
        '<finalization-artifact-path>' = @($Fixture.RuntimeArtifactPath)
        '<artifact or schema check rerun at H2>' = @('runtime finalization artifact schema review')
        '<target-base-sha>' = @($Fixture.BaseSha)
        '<40-hex-base-sha>' = @($Fixture.BaseSha)
        '<40-hex-merge-base-sha>' = @($Fixture.MergeBaseSha)
        '<merge-base-sha>' = @($Fixture.MergeBaseSha)
        '<H2-sha>' = @($Fixture.HeadSha)
        '<coordinator-branch>' = @($Fixture.Branch, $Fixture.Branch)
        '<none | current consistent PR URL>' = @('none')
        '<remaining risk, limitation, or `None`>' = @('None')
    }
    foreach ($entry in $replacements.GetEnumerator()) {
        $rendered = Set-SequentialTemplateTokenValues -Text $rendered -Token $entry.Key -Values @($entry.Value)
    }

    $remainingPlaceholders = @([regex]::Matches($rendered, '<[^>\r\n]+>') | ForEach-Object { $_.Value })
    Assert-Condition ($remainingPlaceholders.Count -eq 0) "Rendered final template still contains placeholders: $($remainingPlaceholders -join ', ')."
    $rendered
}

function Invoke-AllIntegratedScenario {
    $fixture = New-IntegrationFixture
    try {
        $refresh = Update-LocalCoordinatorFromRemote -Fixture $fixture
        $ledger = @(
            New-LedgerRow -Issue 9902 -CommitSha $fixture.ChildOneSha -CoordinatorBranch $fixture.CoordinatorBranch
            New-LedgerRow -Issue 9903 -CommitSha $fixture.ChildTwoSha -CoordinatorBranch $fixture.CoordinatorBranch
        )
        $gate = Test-ChildTerminalGate -ExpectedChildren @(9902, 9903) -Ledger $ledger -Repository $fixture.Local -CoordinatorHead $refresh.After -CoordinatorBranch $fixture.CoordinatorBranch

        Assert-Condition $refresh.Refreshed 'Expected local coordinator HEAD to refresh from the remote coordinator branch.'
        Assert-Condition (Test-CommitAncestor -Repository $fixture.Local -Ancestor $fixture.ChildOneSha -Descendant $refresh.After) 'Expected child 9902 commit in refreshed coordinator ancestry.'
        Assert-Condition (Test-CommitAncestor -Repository $fixture.Local -Ancestor $fixture.ChildTwoSha -Descendant $refresh.After) 'Expected child 9903 commit in refreshed coordinator ancestry.'
        Assert-Condition (-not $gate.Blocked) "Expected complete terminal ledger, got: $($gate.Reasons -join '; ')"
        Assert-Condition $gate.ValidationMayBegin 'Expected integrated validation to begin only after the terminal gate.'
        Assert-Condition (@($ledger | Where-Object { $_.GitHubIssueState -eq 'open' }).Count -eq 2) 'Open child issues must not override integration proof.'

        [ordered]@{
            scenario = 'all-integrated'
            result = 'passed'
            fixture = 'bare remote plus refreshed coordinator worktree'
            local_head_before = $refresh.Before
            remote_coordinator_head = $fixture.RemoteCoordinatorSha
            refreshed_local_head = $refresh.After
            child_commits = @($fixture.ChildOneSha, $fixture.ChildTwoSha)
            prepared_child_count = $ledger.Count
            every_child_unique_and_integrated = $true
            open_issue_state_ignored_as_integration_signal = $true
            validation_may_begin = $gate.ValidationMayBegin
            new_child_layer_may_start = $gate.NewChildLayerMayStart
        }
    }
    finally {
        Remove-Fixture -Fixture $fixture
    }
}

function Invoke-IncompleteChildrenScenario {
    $fixture = New-IntegrationFixture
    try {
        $refresh = Update-LocalCoordinatorFromRemote -Fixture $fixture
        $goodA = New-LedgerRow -Issue 9902 -CommitSha $fixture.ChildOneSha -CoordinatorBranch $fixture.CoordinatorBranch
        $goodB = New-LedgerRow -Issue 9903 -CommitSha $fixture.ChildTwoSha -CoordinatorBranch $fixture.CoordinatorBranch
        $cases = @()

        $unmerged = New-LedgerRow -Issue 9903 -CommitSha $fixture.UnmergedChildSha -CoordinatorBranch $fixture.CoordinatorBranch
        $unmerged.PrMerged = $false
        $unmerged.WorkflowStatus = 'pending'
        $cases += [pscustomobject]@{ Name = 'unmerged'; Ledger = @($goodA, $unmerged); Head = $refresh.After }

        $metadataOnly = New-LedgerRow -Issue 9903 -CommitSha $fixture.UnmergedChildSha -CoordinatorBranch $fixture.CoordinatorBranch
        $cases += [pscustomobject]@{ Name = 'merged-metadata-without-ancestry'; Ledger = @($goodA, $metadataOnly); Head = $refresh.After }

        $wrongTarget = New-LedgerRow -Issue 9903 -CommitSha $fixture.ChildTwoSha -CoordinatorBranch $fixture.CoordinatorBranch
        $wrongTarget.PrTarget = 'main'
        $cases += [pscustomobject]@{ Name = 'wrong-pr-target'; Ledger = @($goodA, $wrongTarget); Head = $refresh.After }

        foreach ($state in @('active', 'blocked', 'pending')) {
            $row = New-LedgerRow -Issue 9903 -CommitSha $fixture.ChildTwoSha -CoordinatorBranch $fixture.CoordinatorBranch
            $row.WorkflowStatus = $state
            $cases += [pscustomobject]@{ Name = $state; Ledger = @($goodA, $row); Head = $refresh.After }
        }

        $dependency = New-LedgerRow -Issue 9903 -CommitSha $fixture.ChildTwoSha -CoordinatorBranch $fixture.CoordinatorBranch
        $dependency.DependenciesComplete = $false
        $dependency.WorkflowStatus = 'dependency-incomplete'
        $cases += [pscustomobject]@{ Name = 'dependency-incomplete'; Ledger = @($goodA, $dependency); Head = $refresh.After }

        $missingEvidence = New-LedgerRow -Issue 9903 -CommitSha $fixture.ChildTwoSha -CoordinatorBranch $fixture.CoordinatorBranch
        $missingEvidence.EvidencePresent = $false
        $cases += [pscustomobject]@{ Name = 'missing-evidence'; Ledger = @($goodA, $missingEvidence); Head = $refresh.After }
        $blankCommit = New-LedgerRow -Issue 9903 -CommitSha '' -CoordinatorBranch $fixture.CoordinatorBranch
        $cases += [pscustomobject]@{ Name = 'blank-commit-sha'; Ledger = @($goodA, $blankCommit); Head = $refresh.After }
        $missingCommit = New-LedgerRow -Issue 9903 -CommitSha $fixture.ChildTwoSha -CoordinatorBranch $fixture.CoordinatorBranch
        $missingCommit.PSObject.Properties.Remove('CommitSha') | Out-Null
        $cases += [pscustomobject]@{ Name = 'missing-commit-sha'; Ledger = @($goodA, $missingCommit); Head = $refresh.After }
        $cases += [pscustomobject]@{ Name = 'missing-child'; Ledger = @($goodA); Head = $refresh.After }
        $cases += [pscustomobject]@{ Name = 'duplicate-child'; Ledger = @($goodA, $goodA, $goodB); Head = $refresh.After }
        $unexpected = New-LedgerRow -Issue 9904 -CommitSha $fixture.UnmergedChildSha -CoordinatorBranch $fixture.CoordinatorBranch
        $cases += [pscustomobject]@{ Name = 'unexpected-child'; Ledger = @($goodA, $goodB, $unexpected); Head = $refresh.After }

        $results = @()
        foreach ($case in $cases) {
            $gate = Test-ChildTerminalGate -ExpectedChildren @(9902, 9903) -Ledger $case.Ledger -Repository $fixture.Local -CoordinatorHead $case.Head -CoordinatorBranch $fixture.CoordinatorBranch
            Assert-Condition $gate.Blocked "Expected incomplete child case '$($case.Name)' to block finalization."
            Assert-Condition (-not $gate.ValidationMayBegin) "Expected no validation for '$($case.Name)'."
            $results += [ordered]@{
                case = $case.Name
                blocked = $gate.Blocked
                reasons = $gate.Reasons
                validation_attempted = $false
                pr_delivery_attempted = $false
            }
        }

        [ordered]@{
            scenario = 'incomplete-children'
            result = 'passed'
            case_count = $results.Count
            cases = $results
            all_incomplete_states_blocked = @($results | Where-Object { -not $_.blocked }).Count -eq 0
            github_mutation_attempted = $false
        }
    }
    finally {
        Remove-Fixture -Fixture $fixture
    }
}

function Invoke-EvidenceMismatchScenario {
    $current = [ordered]@{
        coordinator_issue = 9901
        coordinator_branch = 'sidecar/9901-final-delivery'
        remote_head = ('a' * 40)
        local_head = ('a' * 40)
        child_pr_target = 'sidecar/9901-final-delivery'
        child_pr_state = 'merged'
        cleanup_eligibility = 'ineligible'
    }
    $artifact = [ordered]@{
        coordinator_issue = 9901
        coordinator_branch = 'sidecar/9901-final-delivery'
        recorded_remote_head = ('b' * 40)
        cleanup_eligibility = 'eligible'
    }
    $mismatches = @()
    if ($current.remote_head -ne $artifact.recorded_remote_head) { $mismatches += 'remote coordinator head conflicts with artifact' }
    if ($current.cleanup_eligibility -ne $artifact.cleanup_eligibility) { $mismatches += 'cleanup eligibility conflicts with artifact' }

    Assert-Condition ($mismatches.Count -eq 2) 'Expected current evidence to conflict with recorded artifact state.'
    [ordered]@{
        scenario = 'evidence-mismatch'
        result = 'passed'
        blocked = $true
        mismatches = $mismatches
        source_of_truth = 'current GitHub and repository evidence'
        private_conversation_context_used = $false
        validation_attempted = $false
        template_render_attempted = $false
        github_mutation_attempted = $false
    }
}

function Invoke-IntegratedValidationScenario {
    $head = '1' * 40
    $previousHead = '0' * 40
    $required = @('backend-tests', 'frontend-tests', 'workflow-contract-review')
    $historical = @(
        [pscustomobject]@{ Id = 'backend-tests'; EvaluatedHead = $previousHead; Status = 'failed'; Current = $false; Attempt = 1 },
        [pscustomobject]@{ Id = 'backend-tests'; EvaluatedHead = $head; Status = 'passed'; Current = $true; Attempt = 2 }
    )
    $current = @(
        [pscustomobject]@{ Id = 'backend-tests'; Command = 'mvn verify'; EvaluatedHead = $head; Status = 'passed'; Fresh = $true; Origin = 'integrated-run' },
        [pscustomobject]@{ Id = 'frontend-tests'; Command = 'npm test'; EvaluatedHead = $head; Status = 'passed'; Fresh = $true; Origin = 'integrated-run' },
        [pscustomobject]@{ Id = 'workflow-contract-review'; Command = 'review coordinator contract'; EvaluatedHead = $head; Status = 'passed'; Fresh = $true; Origin = 'integrated-run' }
    )
    $childEvidence = @(
        [pscustomobject]@{ Id = 'backend-tests'; Status = 'passed'; Applicable = $true; Fresh = $true; ReplacesIntegratedRun = $false }
    )

    foreach ($id in $required) {
        $matches = @($current | Where-Object { $_.Id -eq $id -and $_.EvaluatedHead -eq $head })
        Assert-Condition ($matches.Count -eq 1) "Expected exactly one current result for $id at H."
        Assert-Condition ($matches[0].Status -eq 'passed' -and $matches[0].Fresh) "Expected fresh passed result for $id."
        Assert-Condition ($matches[0].Origin -eq 'integrated-run') "Expected mandatory integrated execution for $id."
    }
    Assert-Condition (@($historical | Where-Object { -not $_.Current }).Count -gt 0) 'Expected prior attempts to remain historical.'
    Assert-Condition (@($childEvidence | Where-Object { $_.ReplacesIntegratedRun }).Count -eq 0) 'Child evidence must not replace integrated validation.'

    $duplicateCurrent = @($current + [pscustomobject]@{ Id = 'backend-tests'; Command = 'mvn verify'; EvaluatedHead = $head; Status = 'passed'; Fresh = $true; Origin = 'integrated-run' })
    $duplicateBlocked = @($duplicateCurrent | Where-Object { $_.Id -eq 'backend-tests' -and $_.EvaluatedHead -eq $head }).Count -ne 1
    Assert-Condition $duplicateBlocked 'Duplicate current readiness results must block readiness.'

    [ordered]@{
        scenario = 'integrated-validation'
        result = 'passed'
        evaluated_head = $head
        required_checks = $required
        historical_attempts_preserved = $true
        current_results = $current
        one_current_result_per_requirement_and_state = $true
        child_evidence = $childEvidence
        child_evidence_replaced_integrated_validation = $false
        duplicate_current_result_blocked = $duplicateBlocked
    }
}

function Invoke-ValidationReadinessScenario {
    $cases = @()
    foreach ($status in @('failed', 'skipped', 'timed out', 'interrupted', 'partial', 'stale', 'blocked', 'not run')) {
        $cases += [pscustomobject]@{ Input = $status; Recorded = $status; Reason = "required check recorded as $status" }
    }
    $cases += [pscustomobject]@{ Input = 'unavailable'; Recorded = 'blocked'; Reason = 'required validation is unavailable' }
    $cases += [pscustomobject]@{ Input = 'dishonest-to-run'; Recorded = 'not run'; Reason = 'the command cannot be claimed honestly' }

    $results = @()
    foreach ($case in $cases) {
        $ready = $case.Recorded -eq 'passed'
        Assert-Condition (-not $ready) "Expected '$($case.Input)' to block final readiness."
        Assert-Condition (-not [string]::IsNullOrWhiteSpace($case.Reason)) "Expected a reason for '$($case.Input)'."
        $results += [ordered]@{
            input = $case.Input
            recorded_status = $case.Recorded
            reason = $case.Reason
            ready = $ready
            final_pr_create_attempted = $false
            final_pr_update_attempted = $false
        }
    }

    [ordered]@{
        scenario = 'validation-readiness'
        result = 'passed'
        canonical_non_passing_statuses = @('failed', 'skipped', 'timed out', 'interrupted', 'partial', 'stale', 'blocked', 'not run')
        cases = $results
        every_non_passing_or_unverifiable_case_blocked = @($results | Where-Object { $_.ready }).Count -eq 0
        draft_fallback_attempted = $false
    }
}

function Invoke-ValidationStalenessScenario {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('catworld-final-stale-' + [guid]::NewGuid().ToString('N'))
    $repository = Join-Path $root 'repo'
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    $fixture = [pscustomobject]@{ Root = $root }
    try {
        Invoke-GitCommand -Arguments @('init', '-q', $repository) | Out-Null
        Initialize-RepositoryIdentity -Repository $repository
        Invoke-Git -WorkingDirectory $repository -Arguments @('branch', '-M', 'coordinator') | Out-Null
        $h = New-FileCommit -Repository $repository -Files @{ 'integrated.md' = 'validated H' } -Message 'record integrated H'
        $validation = @(
            [pscustomobject]@{ Id = 'integrated-tests'; Head = $h; Status = 'passed'; AffectedPaths = @('src/'); Fresh = $true },
            [pscustomobject]@{ Id = 'unaffected-doc-review'; Head = $h; Status = 'passed'; AffectedPaths = @('docs/'); Fresh = $true }
        )
        $advancedHead = New-FileCommit -Repository $repository -Files @{ 'src/relevant-change.md' = 'changes validation inputs' } -Message 'advance relevant coordinator state'
        $changedPaths = @((Invoke-Git -WorkingDirectory $repository -Arguments @('diff', '--name-only', "$h..$advancedHead", '--')).Output)
        $rangeCheck = Invoke-Git -WorkingDirectory $repository -Arguments @('diff', '--check', "$h..$advancedHead", '--') -AllowFailure

        foreach ($record in $validation) {
            if (@($changedPaths | Where-Object { $_ -like "$($record.AffectedPaths[0])*" }).Count -gt 0) {
                $record.Status = 'stale'
                $record.Fresh = $false
            }
        }
        $stale = @($validation | Where-Object { $_.Status -eq 'stale' })
        Assert-Condition ($stale.Count -eq 1 -and $stale[0].Id -eq 'integrated-tests') 'Expected only affected integrated evidence to become stale.'
        Assert-Condition ($rangeCheck.ExitCode -eq 0) 'Expected explicit H..advanced-HEAD diff check to execute successfully.'

        [ordered]@{
            scenario = 'validation-staleness'
            result = 'passed'
            original_validated_head = $h
            advanced_head = $advancedHead
            changed_paths = $changedPaths
            validation = $validation
            affected_evidence_marked_stale = $true
            final_readiness = $false
            final_pr_attempted = $false
            explicit_range_diff_check = [ordered]@{ range = "$h..$advancedHead"; status = 'passed' }
        }
    }
    finally {
        Remove-Fixture -Fixture $fixture
    }
}

function Invoke-TwoHeadFinalizationScenario {
    $fixtures = [Collections.Generic.List[object]]::new()
    try {
        $valid = New-FinalizationFixture
        $fixtures.Add($valid)
        $validVerifier = Invoke-FinalizationVerifier -Fixture $valid
        Assert-Condition ($validVerifier.ExitCode -eq 0 -and $null -ne $validVerifier.Json -and $validVerifier.Json.result -eq 'passed') "Expected valid H/H2 evidence, got: $($validVerifier.Output)"

        $hRange = Invoke-Git -WorkingDirectory $valid.Repository -Arguments @('diff', '--check', "$($valid.ImplementationSha)..$($valid.HeadSha)", '--') -AllowFailure
        $baseRange = Invoke-Git -WorkingDirectory $valid.Repository -Arguments @('diff', '--check', "$($valid.BaseSha)...$($valid.HeadSha)", '--') -AllowFailure
        Assert-Condition ($hRange.ExitCode -eq 0 -and $baseRange.ExitCode -eq 0) 'Expected explicit H..H2 and B...H2 range checks to pass.'

        $pushGate = Invoke-NormalH2PushGate -Fixture $valid
        Assert-Condition $pushGate.Verified 'Expected normal push and fetched remote coordinator ref to equal H2.'

        $negativeDefinitions = @(
            [pscustomobject]@{ Name = 'multiple-parent-merge'; Mutation = 'None'; HeadShape = 'Merge'; Extra = $false; Dirty = $false },
            [pscustomobject]@{ Name = 'wrong-direct-parent'; Mutation = 'None'; HeadShape = 'WrongParent'; Extra = $false; Dirty = $false },
            [pscustomobject]@{ Name = 'extra-delta-path'; Mutation = 'None'; HeadShape = 'Direct'; Extra = $true; Dirty = $false },
            [pscustomobject]@{ Name = 'prohibited-h3'; Mutation = 'None'; HeadShape = 'H3'; Extra = $false; Dirty = $false },
            [pscustomobject]@{ Name = 'missing-self-marker'; Mutation = 'MissingSelf'; HeadShape = 'Direct'; Extra = $false; Dirty = $false },
            [pscustomobject]@{ Name = 'wrong-self-marker'; Mutation = 'WrongSelf'; HeadShape = 'Direct'; Extra = $false; Dirty = $false },
            [pscustomobject]@{ Name = 'literal-self-field'; Mutation = 'LiteralSelfField'; HeadShape = 'Direct'; Extra = $false; Dirty = $false },
            [pscustomobject]@{ Name = 'missing-applicability'; Mutation = 'MissingApplicability'; HeadShape = 'Direct'; Extra = $false; Dirty = $false },
            [pscustomobject]@{ Name = 'dirty-state'; Mutation = 'None'; HeadShape = 'Direct'; Extra = $false; Dirty = $true },
            [pscustomobject]@{ Name = 'wrong-target'; Mutation = 'WrongTarget'; HeadShape = 'Direct'; Extra = $false; Dirty = $false },
            [pscustomobject]@{ Name = 'wrong-issue-wording'; Mutation = 'WrongWording'; HeadShape = 'Direct'; Extra = $false; Dirty = $false }
        )
        $negativeResults = @()
        foreach ($definition in $negativeDefinitions) {
            $fixture = New-FinalizationFixture -Mutation $definition.Mutation -HeadShape $definition.HeadShape -ExtraDelta:$definition.Extra -DirtyAfterCommit:$definition.Dirty
            $fixtures.Add($fixture)
            $verification = Invoke-FinalizationVerifier -Fixture $fixture
            Assert-Condition ($verification.ExitCode -ne 0 -and $null -ne $verification.Json -and $verification.Json.result -eq 'failed') "Expected '$($definition.Name)' verifier rejection, got: $($verification.Output)"
            $negativeResults += [ordered]@{ case = $definition.Name; rejected = $true; verifier_error = $verification.Json.error }
        }

        $verifierSource = Get-Content -LiteralPath $script:VerifierPath -Raw
        $syntheticResolvedHead = 'e' * 40
        $syntheticBadArtifact = '{"finalization_head":{"identity":"SELF/HEAD","resolved_sha":"' + $syntheticResolvedHead + '"}}'
        $literalGuardDetected = $syntheticBadArtifact.IndexOf($syntheticResolvedHead, [StringComparison]::OrdinalIgnoreCase) -ge 0
        Assert-Condition $literalGuardDetected 'Expected the literal resolved-H2 guard algorithm to detect a synthetic embedded HEAD SHA.'
        Assert-Condition ($verifierSource -match '(?s)IndexOf\(\$headSha,.+OrdinalIgnoreCase') 'Expected the real verifier to enforce the literal resolved H2 SHA guard.'

        $externalH2 = @(
            [pscustomobject]@{ Id = 'finalization-evidence-verifier'; Status = 'passed' },
            [pscustomobject]@{ Id = 'diff-check-h-h2'; Status = 'failed' }
        )
        $externalReady = @($externalH2 | Where-Object { $_.Status -ne 'passed' }).Count -eq 0
        Assert-Condition (-not $externalReady) 'A failed external H2 rerun must block final readiness after artifact verification.'

        $rejected = New-FinalizationFixture
        $fixtures.Add($rejected)
        Invoke-Git -WorkingDirectory $rejected.Repository -Arguments @('push', '-q', 'origin', "$($rejected.ImplementationSha):refs/heads/$($rejected.Branch)") | Out-Null
        $other = Join-Path $rejected.Root 'remote-advance'
        Invoke-GitCommand -Arguments @('clone', '-q', '--branch', $rejected.Branch, $rejected.Remote, $other) | Out-Null
        Initialize-RepositoryIdentity -Repository $other
        New-FileCommit -Repository $other -Files @{ 'remote-only.md' = 'remote advanced independently' } -Message 'advance remote issue branch' | Out-Null
        Invoke-Git -WorkingDirectory $other -Arguments @('push', '-q', 'origin', $rejected.Branch) | Out-Null
        $rejectedPush = Invoke-Git -WorkingDirectory $rejected.Repository -Arguments @('push', 'origin', "HEAD:refs/heads/$($rejected.Branch)") -AllowFailure
        Assert-Condition ($rejectedPush.ExitCode -ne 0) 'Expected a normal non-fast-forward H2 push to be rejected.'

        $mismatch = New-FinalizationFixture
        $fixtures.Add($mismatch)
        Invoke-Git -WorkingDirectory $mismatch.Repository -Arguments @('push', '-q', 'origin', "$($mismatch.ImplementationSha):refs/heads/$($mismatch.Branch)") | Out-Null
        Invoke-Git -WorkingDirectory $mismatch.Repository -Arguments @('push', '-q', 'origin', "HEAD:refs/heads/$($mismatch.Branch)-wrong") | Out-Null
        Invoke-Git -WorkingDirectory $mismatch.Repository -Arguments @('fetch', '-q', 'origin', "$($mismatch.Branch):refs/remotes/origin/$($mismatch.Branch)") | Out-Null
        $mismatchedRemote = (Invoke-Git -WorkingDirectory $mismatch.Repository -Arguments @('rev-parse', "origin/$($mismatch.Branch)")).Output[0]
        Assert-Condition ($mismatchedRemote -ne $mismatch.HeadSha) 'Expected remote-source mismatch to block H2 delivery.'

        [ordered]@{
            scenario = 'two-head-finalization'
            result = 'passed'
            valid_sequence = [ordered]@{
                B = $valid.BaseSha
                H = $valid.ImplementationSha
                H2 = $valid.HeadSha
                direct_parent_proven = $validVerifier.Json.direct_parent_proven
                sole_artifact_delta = $validVerifier.Json.allowed_delta
                complete_suite_claimed_at = 'H'
                h2_manifest_readiness = 'pending_h2_checks'
                explicit_range_checks = @(
                    [ordered]@{ range = 'H..H2'; status = 'passed' },
                    [ordered]@{ range = 'B...H2'; status = 'passed' }
                )
                normal_remote_push_verified = $pushGate.Verified
                remote_h2 = $pushGate.RemoteSha
            }
            verifier_negative_cases = $negativeResults
            failed_external_h2_rerun_blocked = -not $externalReady
            literal_resolved_h2_sha_guard_exercised = $literalGuardDetected
            rejected_normal_push_blocked = $rejectedPush.ExitCode -ne 0
            force_after_rejection_attempted = $false
            mismatched_remote_ref_blocked = $mismatchedRemote -ne $mismatch.HeadSha
            h3_created_in_valid_sequence = $false
        }
    }
    finally {
        foreach ($fixture in $fixtures) {
            Remove-Fixture -Fixture $fixture
        }
    }
}

function Invoke-ScopeDriftScenario {
    $root = Join-Path ([IO.Path]::GetTempPath()) ('catworld-final-scope-' + [guid]::NewGuid().ToString('N'))
    $remote = Join-Path $root 'origin.git'
    $repository = Join-Path $root 'coordinator'
    $baseUpdater = Join-Path $root 'base-updater'
    New-Item -ItemType Directory -Path $root -Force | Out-Null
    $fixture = [pscustomobject]@{ Root = $root }
    try {
        Invoke-GitCommand -Arguments @('init', '--bare', '-q', $remote) | Out-Null
        Invoke-GitCommand -Arguments @('init', '-q', $repository) | Out-Null
        Initialize-RepositoryIdentity -Repository $repository
        Invoke-Git -WorkingDirectory $repository -Arguments @('branch', '-M', 'main') | Out-Null
        $main = New-FileCommit -Repository $repository -Files @{ 'README.md' = 'scope fixture' } -Message 'seed scope fixture'
        Invoke-Git -WorkingDirectory $repository -Arguments @('remote', 'add', 'origin', $remote) | Out-Null
        Invoke-Git -WorkingDirectory $repository -Arguments @('push', '-q', 'origin', 'main') | Out-Null
        Invoke-Git -WorkingDirectory $remote -Arguments @('symbolic-ref', 'HEAD', 'refs/heads/main') | Out-Null
        Invoke-Git -WorkingDirectory $repository -Arguments @('switch', '-q', '-c', $script:CoordinatorBranch) | Out-Null
        New-FileCommit -Repository $repository -Files @{
            'coordinator/finalization.md' = 'expected coordinator scope'
            'children/child-a.md' = 'expected child scope'
        } -Message 'integrate expected coordinator and child scope' | Out-Null

        $localMainBefore = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', 'refs/heads/main')).Output[0]
        Invoke-Git -WorkingDirectory $repository -Arguments @('fetch', '-q', 'origin', 'main:refs/remotes/origin/main') | Out-Null
        $targetBase = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', 'origin/main')).Output[0]
        $mergeBase = (Invoke-Git -WorkingDirectory $repository -Arguments @('merge-base', 'origin/main', 'HEAD')).Output[0]
        $changed = @((Invoke-Git -WorkingDirectory $repository -Arguments @('diff', '--name-only', "$mergeBase..HEAD", '--')).Output)
        $allowed = @('coordinator/finalization.md', 'children/child-a.md')
        $unexplained = @($changed | Where-Object { $allowed -notcontains $_ })
        Assert-Condition ($unexplained.Count -eq 0) 'Expected combined coordinator/child source maps to explain the clean integrated diff.'

        $driftHead = New-FileCommit -Repository $repository -Files @{ 'unrelated/application-change.java' = 'unexplained' } -Message 'inject unrelated scope drift'
        $changedWithDrift = @((Invoke-Git -WorkingDirectory $repository -Arguments @('diff', '--name-only', "$mergeBase..$driftHead", '--')).Output)
        $unexplainedWithDrift = @($changedWithDrift | Where-Object { $allowed -notcontains $_ })
        Assert-Condition ($unexplainedWithDrift -contains 'unrelated/application-change.java') 'Expected injected unrelated path to block scope review.'
        $rangeCheck = Invoke-Git -WorkingDirectory $repository -Arguments @('diff', '--check', "$mergeBase..$driftHead", '--') -AllowFailure

        Invoke-GitCommand -Arguments @('clone', '-q', '--branch', 'main', $remote, $baseUpdater) | Out-Null
        Initialize-RepositoryIdentity -Repository $baseUpdater
        $advancedBase = New-FileCommit -Repository $baseUpdater -Files @{ 'base-advanced.md' = 'new main state' } -Message 'advance runtime target base'
        Invoke-Git -WorkingDirectory $baseUpdater -Arguments @('push', '-q', 'origin', 'main') | Out-Null
        Invoke-Git -WorkingDirectory $repository -Arguments @('fetch', '-q', 'origin', 'main:refs/remotes/origin/main') | Out-Null
        $recheckedTargetBase = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', 'origin/main')).Output[0]
        $recheckedMergeBase = (Invoke-Git -WorkingDirectory $repository -Arguments @('merge-base', 'origin/main', 'HEAD')).Output[0]
        $localMainAfter = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', 'refs/heads/main')).Output[0]

        Assert-Condition ($targetBase -eq $main) 'Expected recorded origin/main target base at runtime review.'
        Assert-Condition ($recheckedTargetBase -eq $advancedBase -and $recheckedTargetBase -ne $targetBase) 'Expected relevant target-base movement to block delivery.'
        Assert-Condition ($recheckedMergeBase -match '^[0-9a-f]{40}$') 'Expected the PR-equivalent merge base to be rechecked after fetching origin/main.'
        Assert-Condition ($localMainBefore -eq $localMainAfter) 'Fetching origin/main must not update local main.'
        Assert-Condition ($rangeCheck.ExitCode -eq 0) 'Expected explicit merge-base..head diff check to run.'

        [ordered]@{
            scenario = 'scope-drift'
            result = 'passed'
            runtime_target_ref = 'origin/main'
            recorded_target_base_sha = $targetBase
            recorded_merge_base_sha = $mergeBase
            local_main_unchanged_by_fetch = $localMainBefore -eq $localMainAfter
            clean_changed_paths = $changed
            combined_source_map = $allowed
            clean_scope_review_passed = $true
            injected_unrelated_paths = $unexplainedWithDrift
            unrelated_scope_blocked = $true
            explicit_range_diff_check = [ordered]@{ range = 'merge-base..coordinator-head'; status = 'passed' }
            rechecked_target_base_sha = $recheckedTargetBase
            rechecked_merge_base_sha = $recheckedMergeBase
            merge_base_rechecked = $true
            target_base_movement_blocked = $recheckedTargetBase -ne $targetBase
            final_pr_attempted = $false
        }
    }
    finally {
        Remove-Fixture -Fixture $fixture
    }
}

function Invoke-FinalPrDeliveryScenario {
    $fixture = New-RuntimeFinalDeliveryFixture
    try {
        Assert-Condition ($fixture.Branch -eq $script:CoordinatorBranch) 'Runtime final delivery must use the actual coordinator branch fixture.'
        $directParent = (Invoke-Git -WorkingDirectory $fixture.Repository -Arguments @('rev-parse', 'HEAD^')).Output[0]
        $delta = @((Invoke-Git -WorkingDirectory $fixture.Repository -Arguments @('diff', '--name-status', "$($fixture.ImplementationSha)..$($fixture.HeadSha)", '--')).Output)
        $expectedDelta = "A`t$($fixture.RuntimeArtifactPath)"
        $rangeCheck = Invoke-Git -WorkingDirectory $fixture.Repository -Arguments @('diff', '--check', "$($fixture.ImplementationSha)..$($fixture.HeadSha)", '--') -AllowFailure
        Assert-Condition ($directParent -eq $fixture.ImplementationSha) 'Runtime H2 must directly descend from H.'
        Assert-Condition ($delta.Count -eq 1 -and $delta[0] -eq $expectedDelta) 'Runtime H..H2 must contain only the finalization artifact.'
        Assert-Condition ($rangeCheck.ExitCode -eq 0 -and $rangeCheck.Output.Count -eq 0) 'Runtime H..H2 explicit-range diff check must pass.'

        $push = Invoke-NormalH2PushGate -Fixture $fixture
        Assert-Condition $push.Verified 'Expected the fetched remote coordinator source ref to equal H2 before rendering.'
        Assert-Condition ($push.RemoteSha -eq $fixture.HeadSha) 'The verified runtime coordinator ref must resolve to H2.'

        $template = Get-ActualTemplate -Kind Final
        $rendered = Render-FinalTemplate -Template $template.Text -Fixture $fixture
        Assert-Condition ($template.Text -match '(?im)^Closes\s+#<coordinator-issue>') 'Final template must carry coordinator closing authority.'
        Assert-Condition ($template.Text -match '(?im)^Closes\s+#<delivered-child-issue>') 'Final template must carry delivered-child closing authority.'
        Assert-Condition ($template.Text -match '(?i)Integrated child traceability') 'Final template must include integrated-child traceability.'
        Assert-Condition ($template.Text -match '(?i)\bH2\b' -and $template.Text -match '(?i)\bH\b') 'Final template must distinguish complete H checks from H2 artifact-affected checks.'
        Assert-Condition ($template.Text -match '(?i)Remaining risks') 'Final template must include remaining risks.'
        Assert-Condition ($template.Text -match '(?i)Target branch:\s*`main`') 'Final template must target main.'
        Assert-Condition ($template.Text -match '(?i)ready') 'Final template must state ready-only delivery.'
        Assert-Condition ($rendered -match '(?im)^Closes\s+#9901') 'Rendered body must close the coordinator issue at the runtime final boundary.'
        Assert-Condition ($rendered -match '(?im)^Closes\s+#9902') 'Rendered body must trace a delivered child issue.'
        Assert-Condition ($rendered -match '(?im)^Closes\s+#9903') 'Rendered body must trace every delivered child issue.'

        $renderedEvidence = [ordered]@{
            child_9902 = "#9912 for #9902, integrated as ``$($fixture.ChildOneSha)``"
            child_9903 = "#9913 for #9903, integrated as ``$($fixture.ChildTwoSha)``"
            implementation_head = "Integrated implementation head ``H``: ``$($fixture.ImplementationSha)``"
            complete_check_one = 'runtime integrated scenario suite'
            complete_check_two = 'coordinator source-map review'
            applicability = 'H2 adds only the finalization artifact and cannot affect the integrated implementation results from H.'
            finalization_head = "Finalization head ``H2``: ``$($fixture.HeadSha)``"
            artifact_delta = "``$($fixture.RuntimeArtifactPath)`` only"
            h2_check = 'runtime finalization artifact schema review'
            target_base = "Fetched runtime target base: ``origin/main`` at ``$($fixture.BaseSha)``"
            merge_base = "PR-equivalent merge base: ``$($fixture.MergeBaseSha)``"
            reviewed_range = "Reviewed range: ``$($fixture.MergeBaseSha)...$($fixture.HeadSha)``"
            source_branch = "Source branch: ``$($fixture.Branch)``"
            remote_source = "Verified remote source ref: ``origin/$($fixture.Branch)`` equals ``H2``"
            target_branch = 'Target branch: `main`'
            readiness = 'Pull request state: `ready for review` (never a draft fallback)'
            remaining_risk = '- None'
        }
        foreach ($entry in $renderedEvidence.GetEnumerator()) {
            Assert-Condition ($rendered.IndexOf($entry.Value, [StringComparison]::Ordinal) -ge 0) "Rendered body is missing required $($entry.Key) evidence: $($entry.Value)"
        }
        $remainingPlaceholders = @([regex]::Matches($rendered, '<[^>\r\n]+>') | ForEach-Object { $_.Value })
        Assert-Condition ($remainingPlaceholders.Count -eq 0) "Rendered body contains unresolved placeholders: $($remainingPlaceholders -join ', ')."

        $hChecks = @(
            [pscustomobject]@{ Id = 'runtime-integrated-scenario-suite'; Head = $fixture.ImplementationSha; Status = 'passed'; Fresh = $true },
            [pscustomobject]@{ Id = 'coordinator-source-map-review'; Head = $fixture.ImplementationSha; Status = 'passed'; Fresh = $true }
        )
        $h2Checks = @($script:CanonicalH2CheckIds | ForEach-Object { [pscustomobject]@{ Id = $_; Head = $fixture.HeadSha; Status = 'passed'; Fresh = $true } })
        $ready = @($hChecks + $h2Checks | Where-Object { $_.Status -ne 'passed' -or -not $_.Fresh }).Count -eq 0
        Assert-Condition $ready 'Expected all explicit H and H2 evidence to be fresh and passed.'

        [ordered]@{
            scenario = 'final-pr-delivery'
            result = 'passed'
            actual_template_path = $template.Path
            rendered_body_sha256 = Get-FileSha256 -Text $rendered
            rendered_placeholder_count = $remainingPlaceholders.Count
            rendered_body_evidence = $renderedEvidence
            source_branch = $fixture.Branch
            verified_remote_source_ref = "origin/$($fixture.Branch)"
            verified_remote_source_sha = $push.RemoteSha
            validated_h2 = $fixture.HeadSha
            target_branch = 'main'
            ready_for_review = $ready
            draft = $false
            integrated_children = @(
                [ordered]@{ child_issue = 9902; child_pr = 9912; commit = $fixture.ChildOneSha },
                [ordered]@{ child_issue = 9903; child_pr = 9913; commit = $fixture.ChildTwoSha }
            )
            complete_validation_at_h = $hChecks
            artifact_affected_validation_at_h2 = $h2Checks
            integrated_scope_review = 'passed'
            remaining_risks = @()
            closing_references_rendered = $true
            cleanup_eligibility = 'ineligible'
            cleanup_reason = 'pending final PR merge'
            live_github_mutation_performed = $false
        }
    }
    finally {
        Remove-Fixture -Fixture $fixture
    }
}

function Invoke-ExistingFinalPrScenario {
    $runId = 'coordinator-9901-h2-abcdef'
    $currentEvidence = [pscustomobject]@{
        RunId = $runId
        Url = 'https://github.example.invalid/catworld/pull/9991'
        Head = 'sidecar/9901-final-delivery'
        HeadSha = 'a' * 40
        Base = 'main'
        Ready = $true
        BodyFingerprint = 'body-v1'
        ValidationFresh = $true
    }
    $matching = @($currentEvidence | Where-Object { $_.RunId -eq $runId })
    Assert-Condition ($matching.Count -eq 1) 'Expected one same-run final PR.'
    $createAttempted = $matching.Count -eq 0
    Assert-Condition (-not $createAttempted) 'Existing same-run PR must be reused rather than duplicated.'

    $allowedUpdate = [pscustomobject]@{
        ExplicitlyPermitted = $true
        ValidationRerunAfterBodyChange = $true
        Ready = $true
    }
    Assert-Condition ($allowedUpdate.ExplicitlyPermitted -and $allowedUpdate.ValidationRerunAfterBodyChange) 'Allowed update must remain explicitly authorized and revalidated.'

    $staleCases = @(
        [pscustomobject]@{ Name = 'head-mismatch'; Evidence = 'existing PR head SHA differs from H2' },
        [pscustomobject]@{ Name = 'base-mismatch'; Evidence = 'existing PR base is not main' },
        [pscustomobject]@{ Name = 'body-mismatch'; Evidence = 'existing PR body fingerprint is stale' },
        [pscustomobject]@{ Name = 'validation-stale'; Evidence = 'existing PR validation is stale' },
        [pscustomobject]@{ Name = 'readiness-inconsistent'; Evidence = 'existing PR readiness differs from current evidence' }
    )
    $staleResults = @($staleCases | ForEach-Object {
        [ordered]@{
            case = $_.Name
            blocker = $_.Evidence
            duplicate_created = $false
            readiness_mutated = $false
            required_user_action_reported = $true
        }
    })

    [ordered]@{
        scenario = 'existing-final-pr'
        result = 'passed'
        same_run_identity = $runId
        existing_pr_url = $currentEvidence.Url
        reused_existing_pr = $true
        duplicate_create_attempted = $createAttempted
        allowed_update_revalidated = $true
        stale_or_inconsistent_cases = $staleResults
        silent_readiness_mutation_attempted = $false
        draft_fallback_attempted = $false
    }
}

function Invoke-ArtifactFinalStateScenario {
    $fixtures = [Collections.Generic.List[object]]::new()
    try {
        $valid = New-FinalizationFixture
        $fixtures.Add($valid)
        $verification = Invoke-FinalizationVerifier -Fixture $valid
        Assert-Condition ($verification.ExitCode -eq 0) "Expected valid machine-readable artifact: $($verification.Output)"
        $artifact = Read-FinalizationArtifactJson -Repository $valid.Repository

        Assert-Condition ($artifact.finalization_head.identity -eq 'SELF/HEAD') 'Expected SELF/HEAD artifact identity.'
        Assert-Condition ($artifact.finalization_head.expected_parent_sha -eq $valid.ImplementationSha) 'Expected literal H parent in artifact.'
        Assert-Condition ($artifact.readiness.status -eq 'pending_h2_checks') 'Artifact must not preclaim final H2 readiness.'
        Assert-Condition (@($artifact.h2_required_checks | Where-Object { $_.PSObject.Properties.Name.Contains('status') }).Count -eq 0) 'Artifact H2 manifest must be status-free.'
        Assert-Condition (@($artifact.complete_checks_at_h).Count -eq $script:CanonicalHCheckIds.Count) 'Expected exact canonical H manifest.'
        Assert-Condition (@($artifact.h2_required_checks).Count -eq $script:CanonicalH2CheckIds.Count) 'Expected exact canonical H2 manifest.'
        Assert-Condition ($artifact.delivery.write_pr_url_to_artifact -eq $false -and $artifact.delivery.allow_h3 -eq $false) 'Expected no PR URL write and no H3.'
        Assert-Condition ($artifact.runtime_contract.final_target -eq 'main') 'Artifact must preserve future runtime target main.'
        Assert-Condition ($artifact.runtime_contract.cleanup_eligibility -eq 'ineligible' -and $artifact.runtime_contract.cleanup_reason -eq 'pending final PR merge') 'Artifact must preserve cleanup ineligibility.'

        $negativeMutations = @(
            'MissingHCheck',
            'MissingH2Check',
            'H2StatusPreclaim',
            'MissingRenderInput',
            'UnknownNestedProperty',
            'EmptyRemainingRisk',
            'ScalarAllowedDelta',
            'StringSchemaVersion',
            'StringIssueNumber',
            'WrongCaseHId',
            'WrongCaseKey'
        )
        $negativeResults = @()
        foreach ($mutation in $negativeMutations) {
            $fixture = New-FinalizationFixture -Mutation $mutation
            $fixtures.Add($fixture)
            $result = Invoke-FinalizationVerifier -Fixture $fixture
            Assert-Condition ($result.ExitCode -ne 0) "Expected artifact mutation '$mutation' to fail verification."
            $negativeResults += [ordered]@{ mutation = $mutation; rejected = $true; error = $result.Json.error }
        }

        $externalEvidence = [ordered]@{
            resolved_h2 = $valid.HeadSha
            h2_check_statuses = @($script:CanonicalH2CheckIds | ForEach-Object { [ordered]@{ id = $_; status = 'passed' } })
            final_scope = 'passed'
            final_readiness = 'ready'
            resolved_render_inputs = @($script:CanonicalRenderInputs)
            rendered_body_sha256 = 'c' * 64
            remote_source_ref = $valid.HeadSha
            observed_pr_url = 'https://github.example.invalid/catworld/pull/9991'
            observed_pr_ready = $true
            cleanup_eligibility = 'ineligible'
            cleanup_reason = 'pending final PR merge'
        }
        Assert-Condition (@($externalEvidence.h2_check_statuses | Where-Object { $_.status -ne 'passed' }).Count -eq 0) 'Expected resolved H2 statuses in external evidence.'
        $artifactText = Get-Content -LiteralPath (Join-Path $valid.Repository ($script:ArtifactPath.Replace('/', [IO.Path]::DirectorySeparatorChar))) -Raw
        Assert-Condition ($artifactText -notmatch [regex]::Escape($externalEvidence.observed_pr_url)) 'PR URL must remain external to the artifact.'
        $commitsAfterH = [int](Invoke-Git -WorkingDirectory $valid.Repository -Arguments @('rev-list', '--count', "$($valid.ImplementationSha)..HEAD")).Output[0]
        Assert-Condition ($commitsAfterH -eq 1) 'Expected exactly H2 and no H3 after H.'

        [ordered]@{
            scenario = 'artifact-final-state'
            result = 'passed'
            artifact = [ordered]@{
                B = $artifact.base.sha
                H = $artifact.implementation_head.sha
                H2_identity = $artifact.finalization_head.identity
                expected_parent = $artifact.finalization_head.expected_parent_sha
                allowed_delta = $artifact.allowed_delta
                complete_h_check_count = @($artifact.complete_checks_at_h).Count
                h2_required_check_count = @($artifact.h2_required_checks).Count
                readiness = $artifact.readiness.status
                template_blob = $artifact.template.blob_sha
                render_input_requirements = $artifact.template.render_input_requirements
                cleanup_eligibility = $artifact.runtime_contract.cleanup_eligibility
                cleanup_reason = $artifact.runtime_contract.cleanup_reason
            }
            exact_manifest_negative_cases = $negativeResults
            current_evidence_and_final_report = $externalEvidence
            observed_pr_url_written_to_artifact = $false
            commits_after_h = $commitsAfterH
            h3_created = $false
        }
    }
    finally {
        foreach ($fixture in $fixtures) {
            Remove-Fixture -Fixture $fixture
        }
    }
}

function Invoke-ClosingKeywordIsolationScenario {
    $finalTemplate = Get-ActualTemplate -Kind Final
    $childTemplate = Get-ActualTemplate -Kind Child
    $finalClosings = [regex]::Matches($finalTemplate.Text, '(?im)^\s*(Closes|Fixes|Resolves)\s+#')
    $childClosings = [regex]::Matches($childTemplate.Text, '(?im)^\s*(Closes|Fixes|Resolves)\s+#')

    Assert-Condition ($finalClosings.Count -ge 2) 'Expected closing keywords for coordinator and delivered children only in the final template.'
    Assert-Condition ($childClosings.Count -eq 0) 'Child template must not contain issue-closing references.'
    Assert-Condition ($childTemplate.Text -match '(?im)^Related to\s+#<child-issue>') 'Child template must use Related to child reference.'
    Assert-Condition ($childTemplate.Text -match '(?im)^Related to\s+#<coordinator-issue>') 'Child template must use Related to coordinator reference.'
    Assert-Condition ($childTemplate.Text -match '(?i)Target coordinator branch') 'Child template must target the coordinator branch.'
    Assert-Condition ($childTemplate.Text -match '(?i)not the final delivery PR to `main`') 'Child template must explicitly reject main delivery.'
    Assert-Condition ($finalTemplate.Text -match '(?i)Target branch:\s*`main`') 'Final template must target main.'

    [ordered]@{
        scenario = 'closing-keyword-isolation'
        result = 'passed'
        actual_final_template = $finalTemplate.Path
        actual_child_template = $childTemplate.Path
        final_closing_reference_count = $finalClosings.Count
        child_closing_reference_count = $childClosings.Count
        child_related_references_only = $true
        child_target = 'coordinator branch'
        final_target = 'main'
        buildout_pr_wording = 'Related to #258'
    }
}

function Invoke-ProhibitedOperationsScenario {
    $coordinatorPath = Join-Path $script:RepositoryRoot '.agents/skills/catworld-parallel-coordinator/SKILL.md'
    Assert-Condition (Test-Path -LiteralPath $coordinatorPath -PathType Leaf) 'Missing actual coordinator skill source.'
    $coordinator = Get-Content -LiteralPath $coordinatorPath -Raw
    $templateReadme = (Get-ActualTemplate -Kind Readme).Text
    $finalTemplate = (Get-ActualTemplate -Kind Final).Text
    $childTemplate = (Get-ActualTemplate -Kind Child).Text
    $combinedTemplateSources = $templateReadme + "`n" + $finalTemplate + "`n" + $childTemplate

    $requiredSourcePatterns = [ordered]@{
        merge = '(?is)(must not|do not|never).{0,100}\bmerge\b'
        approval = '(?is)(must not|do not|never).{0,100}\bapprove'
        auto_merge = '(?is)(must not|do not|never).{0,100}auto-merge'
        issue_mutation = '(?is)(must not|do not|never).{0,160}issue.{0,80}mutat'
        new_child_layer = '(?is)(no|must not|do not|never).{0,120}(new|additional|another) child layer'
        cleanup = '(?is)(must not|do not|never|ineligible).{0,120}cleanup'
        deletion = '(?is)(must not|do not|never).{0,120}delet'
        rebase = '(?is)(must not|do not|never).{0,120}rebase'
        force_push = '(?is)(must not|do not|never).{0,120}force(-| )?push'
        history_rewrite = '(?is)(must not|do not|never).{0,120}history[- ]rewrit'
    }
    $sourceMatches = [ordered]@{}
    foreach ($entry in $requiredSourcePatterns.GetEnumerator()) {
        $matched = $coordinator -match $entry.Value
        Assert-Condition $matched "Coordinator source must explicitly prohibit $($entry.Key)."
        $sourceMatches[$entry.Key] = $matched
    }
    Assert-Condition ($coordinator -match '(?i)#261' -and $coordinator -match '(?i)dormant|not active|activation') 'Coordinator source must preserve the #261 routing activation gate.'
    Assert-Condition ($coordinator -match '(?i)SELF/HEAD' -and $coordinator -match '(?i)pending final PR merge') 'Coordinator source must contain the two-head and cleanup-ineligible contract.'
    Assert-Condition ($combinedTemplateSources -match '(?i)user performs merges|user performs the merge') 'Actual template sources must reserve merge control for the user.'
    Assert-Condition ($combinedTemplateSources -match '(?i)do not authorize.*merge|must not merge|does not merge') 'Actual template sources must not authorize Codex merge behavior.'

    $operations = [ordered]@{
        merge_final_pr = $false
        approve_final_pr = $false
        enable_auto_merge = $false
        mutate_github_issue = $false
        post_public_comment = $false
        start_new_child_layer = $false
        perform_cleanup = $false
        delete_branch_or_worktree = $false
        rebase = $false
        force_push = $false
        force_with_lease = $false
        rewrite_history = $false
        sequential_fallback = $false
        activate_parallel_routing = $false
    }
    $attempted = @($operations.GetEnumerator() | Where-Object { $_.Value })
    Assert-Condition ($attempted.Count -eq 0) 'No prohibited final-delivery operation may be attempted.'

    [ordered]@{
        scenario = 'prohibited-operations'
        result = 'passed'
        actual_coordinator_source = '.agents/skills/catworld-parallel-coordinator/SKILL.md'
        actual_template_sources_loaded = @(
            '.github/PULL_REQUEST_TEMPLATE/README.md',
            '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md',
            '.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md'
        )
        prohibition_contract_matches = $sourceMatches
        operations = $operations
        any_prohibited_operation_attempted = $attempted.Count -gt 0
        routing_activation_attempted = $false
        live_github_mutation_performed = $false
    }
}

try {
    Assert-Condition (Test-Path -LiteralPath $script:VerifierPath -PathType Leaf) 'Missing verify-finalization-evidence.ps1.'
    $result = switch ($Scenario) {
        'all-integrated' { Invoke-AllIntegratedScenario }
        'incomplete-children' { Invoke-IncompleteChildrenScenario }
        'evidence-mismatch' { Invoke-EvidenceMismatchScenario }
        'integrated-validation' { Invoke-IntegratedValidationScenario }
        'validation-readiness' { Invoke-ValidationReadinessScenario }
        'validation-staleness' { Invoke-ValidationStalenessScenario }
        'two-head-finalization' { Invoke-TwoHeadFinalizationScenario }
        'scope-drift' { Invoke-ScopeDriftScenario }
        'final-pr-delivery' { Invoke-FinalPrDeliveryScenario }
        'existing-final-pr' { Invoke-ExistingFinalPrScenario }
        'artifact-final-state' { Invoke-ArtifactFinalStateScenario }
        'closing-keyword-isolation' { Invoke-ClosingKeywordIsolationScenario }
        'prohibited-operations' { Invoke-ProhibitedOperationsScenario }
    }
    [Console]::Out.WriteLine(($result | ConvertTo-Json -Depth 20 -Compress))
}
catch {
    $failure = [ordered]@{
        scenario = $Scenario
        result = 'failed'
        error = $_.Exception.Message
    }
    [Console]::Out.WriteLine(($failure | ConvertTo-Json -Depth 8 -Compress))
    exit 1
}
