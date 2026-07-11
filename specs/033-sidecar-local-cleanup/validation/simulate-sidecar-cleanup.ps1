$ErrorActionPreference = 'Stop'

$script:RepositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../..')).Path
$script:ProtectedArtifact = Join-Path $script:RepositoryRoot 'specs/032-final-coordinator-delivery/finalization.md'
$script:ExpectedJournalFields = @(
    'schema_version',
    'run_id',
    'eligibility',
    'owned_resources',
    'skipped_reasons',
    'attempted_operations',
    'result',
    'updated_at_utc'
)
$script:AllGitCommands = New-Object System.Collections.ArrayList
$script:CaseEvents = New-Object System.Collections.ArrayList
$script:PathComparison = if (
    [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
) { [StringComparison]::OrdinalIgnoreCase } else { [StringComparison]::Ordinal }

function Assert-Condition {
    param(
        [bool] $Condition,
        [string] $Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Test-OrdinalEqual {
    param(
        [AllowNull()][string] $Actual,
        [AllowNull()][string] $Expected
    )

    [string]::Equals($Actual, $Expected, [StringComparison]::Ordinal)
}

function Test-PathEqual {
    param(
        [string] $Actual,
        [string] $Expected
    )

    [string]::Equals(
        (ConvertTo-NormalizedPath -Path $Actual),
        (ConvertTo-NormalizedPath -Path $Expected),
        $script:PathComparison
    )
}

function ConvertTo-NormalizedPath {
    param([string] $Path)

    [IO.Path]::GetFullPath($Path).TrimEnd([char[]]@('\', '/'))
}

function Invoke-Git {
    param(
        [string] $WorkingDirectory,
        [string[]] $Arguments,
        [switch] $AllowFailure,
        [string] $CleanupOperation,
        [string] $Resource
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

    [void]$script:AllGitCommands.Add([pscustomobject]@{
        WorkingDirectory = $WorkingDirectory
        Arguments = @($Arguments)
        ExitCode = $exitCode
    })

    if ($CleanupOperation) {
        [void]$script:CaseEvents.Add([pscustomobject]@{
            Type = 'git-operation'
            Operation = $CleanupOperation
            Resource = $Resource
            ExitCode = $exitCode
        })
    }

    if ($exitCode -ne 0 -and -not $AllowFailure) {
        throw "git -C $WorkingDirectory $($Arguments -join ' ') failed with exit $exitCode`n$output"
    }

    [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($output)
    }
}

function Get-GitCommonDirectory {
    param([string] $Repository)

    $raw = [string](Invoke-Git -WorkingDirectory $Repository -Arguments @(
        'rev-parse', '--git-common-dir'
    )).Output[0]
    Assert-Condition (-not [string]::IsNullOrWhiteSpace($raw)) 'Git common directory output must not be empty.'

    if ([IO.Path]::IsPathRooted($raw)) {
        return ConvertTo-NormalizedPath -Path $raw
    }

    ConvertTo-NormalizedPath -Path (Join-Path $Repository $raw)
}

function New-CleanupFixture {
    $root = Join-Path ([IO.Path]::GetTempPath()) (
        'catworld-sidecar-cleanup-' + [guid]::NewGuid().ToString('N')
    )
    $repository = Join-Path $root 'repository'
    $worktrees = Join-Path $root 'worktrees'

    New-Item -ItemType Directory -Path $repository -Force | Out-Null
    New-Item -ItemType Directory -Path $worktrees -Force | Out-Null
    Invoke-Git -WorkingDirectory $repository -Arguments @('init', '-q') | Out-Null
    Invoke-Git -WorkingDirectory $repository -Arguments @('branch', '-M', 'main') | Out-Null
    Invoke-Git -WorkingDirectory $repository -Arguments @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
    Invoke-Git -WorkingDirectory $repository -Arguments @('config', 'user.name', 'Sidecar Cleanup Simulation') | Out-Null
    Set-Content -LiteralPath (Join-Path $repository 'fixture.txt') -Value 'fixture' -NoNewline
    Invoke-Git -WorkingDirectory $repository -Arguments @('add', 'fixture.txt') | Out-Null
    Invoke-Git -WorkingDirectory $repository -Arguments @('commit', '-q', '-m', 'seed cleanup fixture') | Out-Null

    [pscustomobject]@{
        Root = ConvertTo-NormalizedPath -Path $root
        Repository = ConvertTo-NormalizedPath -Path $repository
        Worktrees = ConvertTo-NormalizedPath -Path $worktrees
        CommonDirectory = Get-GitCommonDirectory -Repository $repository
        H2 = [string](Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', 'HEAD')).Output[0]
    }
}

function Remove-CleanupFixture {
    param([AllowNull()][pscustomobject] $Fixture)

    if ($null -eq $Fixture -or -not (Test-Path -LiteralPath $Fixture.Root)) {
        return
    }

    $root = ConvertTo-NormalizedPath -Path $Fixture.Root
    $temp = ConvertTo-NormalizedPath -Path ([IO.Path]::GetTempPath())
    $leaf = Split-Path -Leaf $root
    Assert-Condition (
        $root.StartsWith($temp, $script:PathComparison) -and
        $leaf -like 'catworld-sidecar-cleanup-*'
    ) 'Refusing to remove a fixture outside the expected temporary path.'

    Remove-Item -LiteralPath $root -Recurse -Force
}

function New-OwnedPair {
    param(
        [pscustomobject] $Fixture,
        [string] $CaseKey,
        [string] $RunId,
        [int] $Index,
        [switch] $UnmergedCommit
    )

    $branch = "sidecar/cleanup-$CaseKey-$Index"
    $path = ConvertTo-NormalizedPath -Path (Join-Path $Fixture.Worktrees "$CaseKey-$Index")
    Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @(
        'worktree', 'add', '-q', '-b', $branch, $path, 'main'
    ) | Out-Null

    if ($UnmergedCommit) {
        $file = "unmerged-$Index.txt"
        Set-Content -LiteralPath (Join-Path $path $file) -Value 'unmerged fixture change' -NoNewline
        Invoke-Git -WorkingDirectory $path -Arguments @('add', $file) | Out-Null
        Invoke-Git -WorkingDirectory $path -Arguments @('commit', '-q', '-m', 'add unmerged fixture change') | Out-Null
    }

    [pscustomobject]@{
        WorktreePath = $path
        Branch = $branch
        RecordedRunId = $RunId
        RecordedWorktreePath = $path
        RecordedBranch = $branch
        RecordedCommonDirectory = $Fixture.CommonDirectory
        WorktreeState = 'present'
        BranchState = 'present'
    }
}

function Test-ValidRunId {
    param([string] $RunId)

    -not [string]::IsNullOrWhiteSpace($RunId) -and
        $RunId -ne '.' -and
        $RunId -ne '..' -and
        $RunId.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -lt 0 -and
        $RunId.IndexOf([IO.Path]::DirectorySeparatorChar) -lt 0 -and
        $RunId.IndexOf([IO.Path]::AltDirectorySeparatorChar) -lt 0
}

function Get-JournalPath {
    param(
        [pscustomobject] $Fixture,
        [string] $RunId
    )

    Assert-Condition (Test-ValidRunId -RunId $RunId) "Invalid sidecar run ID: $RunId"
    $commonDirectory = Get-GitCommonDirectory -Repository $Fixture.Repository
    Assert-Condition (Test-PathEqual -Actual $commonDirectory -Expected $Fixture.CommonDirectory) `
        'The fixture Git common directory changed unexpectedly.'

    $runDirectory = Join-Path (Join-Path (Join-Path $commonDirectory 'catworld-sidecar') 'runs') $RunId
    ConvertTo-NormalizedPath -Path (Join-Path $runDirectory 'cleanup-state.json')
}

function Get-OwnedResourceSnapshot {
    param(
        [object[]] $Pairs,
        [string] $RunId
    )

    $resources = @()
    foreach ($pair in @($Pairs)) {
        if (-not (Test-OrdinalEqual -Actual $pair.RecordedRunId -Expected $RunId)) {
            continue
        }

        $resources += [ordered]@{
            kind = 'worktree'
            path = $pair.RecordedWorktreePath
            branch = $pair.RecordedBranch
            state = $pair.WorktreeState
        }
        $resources += [ordered]@{
            kind = 'branch'
            path = $null
            branch = $pair.RecordedBranch
            state = $pair.BranchState
        }
    }

    $resources
}

function New-JournalState {
    param(
        [string] $RunId,
        [object[]] $Pairs
    )

    [ordered]@{
        schema_version = 1
        run_id = $RunId
        eligibility = 'ineligible'
        owned_resources = @(Get-OwnedResourceSnapshot -Pairs $Pairs -RunId $RunId)
        skipped_reasons = @()
        attempted_operations = @()
        result = 'ineligible'
        updated_at_utc = ''
    }
}

function Write-CleanupJournal {
    param(
        [pscustomobject] $Fixture,
        [System.Collections.IDictionary] $State,
        [object[]] $Pairs
    )

    $State.owned_resources = @(Get-OwnedResourceSnapshot -Pairs $Pairs -RunId $State.run_id)
    $State.updated_at_utc = [DateTime]::UtcNow.ToString(
        "yyyy-MM-dd'T'HH:mm:ss.fff'Z'",
        [Globalization.CultureInfo]::InvariantCulture
    )
    $path = Get-JournalPath -Fixture $Fixture -RunId $State.run_id
    $directory = Split-Path -Parent $path
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    $State | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $path -Encoding UTF8

    $persisted = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    [void]$script:CaseEvents.Add([pscustomobject]@{
        Type = 'journal-write'
        Path = $path
        Journal = $persisted
    })

    $persisted
}

function Assert-Journal {
    param(
        [pscustomobject] $Fixture,
        [string] $RunId,
        [pscustomobject] $Journal,
        [string] $Path
    )

    $actualFields = @($Journal.PSObject.Properties.Name)
    Assert-Condition ($actualFields.Count -eq $script:ExpectedJournalFields.Count) `
        "Journal must have exactly eight top-level fields, got: $($actualFields -join ', ')."
    foreach ($field in $script:ExpectedJournalFields) {
        Assert-Condition ($actualFields -contains $field) "Journal is missing top-level field '$field'."
    }
    foreach ($field in $actualFields) {
        Assert-Condition ($script:ExpectedJournalFields -contains $field) "Journal has unexpected top-level field '$field'."
    }

    Assert-Condition ($Journal.schema_version -eq 1) 'Journal schema_version must equal 1.'
    Assert-Condition (Test-OrdinalEqual -Actual $Journal.run_id -Expected $RunId) 'Journal run_id mismatch.'
    Assert-Condition ($Journal.updated_at_utc -match '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$') `
        'Journal updated_at_utc must be a UTC ISO-8601 timestamp.'
    $expectedPath = Get-JournalPath -Fixture $Fixture -RunId $RunId
    Assert-Condition (Test-PathEqual -Actual $Path -Expected $expectedPath) 'Journal path is outside the expected run directory.'
    Assert-Condition (Test-Path -LiteralPath $expectedPath -PathType Leaf) 'Journal file does not exist.'
}

function Get-LiveWorktrees {
    param([pscustomobject] $Fixture)

    $lines = @((Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @(
        'worktree', 'list', '--porcelain'
    )).Output) + @('')
    $records = @()
    $current = [ordered]@{}

    foreach ($lineValue in $lines) {
        $line = [string]$lineValue
        if ([string]::IsNullOrEmpty($line)) {
            if ($current.Contains('path')) {
                $records += [pscustomobject]$current
            }
            $current = [ordered]@{}
            continue
        }

        if ($line.StartsWith('worktree ', [StringComparison]::Ordinal)) {
            $current.path = ConvertTo-NormalizedPath -Path $line.Substring(9)
        }
        elseif ($line.StartsWith('branch refs/heads/', [StringComparison]::Ordinal)) {
            $current.branch = $line.Substring(18)
        }
        elseif ($line -eq 'detached') {
            $current.branch = $null
        }
    }

    $records
}

function Test-LocalBranchExists {
    param(
        [pscustomobject] $Fixture,
        [string] $Branch
    )

    (Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @(
        'show-ref', '--verify', '--quiet', "refs/heads/$Branch"
    ) -AllowFailure).ExitCode -eq 0
}

function Test-PairOwnership {
    param(
        [pscustomobject] $Fixture,
        [string] $RunId,
        [pscustomobject] $Pair,
        [object[]] $LiveWorktrees
    )

    if (-not (Test-OrdinalEqual -Actual $Pair.RecordedRunId -Expected $RunId)) {
        return $false
    }
    if (-not (Test-PathEqual -Actual $Pair.RecordedWorktreePath -Expected $Pair.WorktreePath)) {
        return $false
    }
    if (-not (Test-OrdinalEqual -Actual $Pair.RecordedBranch -Expected $Pair.Branch)) {
        return $false
    }
    if (-not (Test-PathEqual -Actual $Pair.RecordedCommonDirectory -Expected $Fixture.CommonDirectory)) {
        return $false
    }

    $matches = @($LiveWorktrees | Where-Object {
        (Test-PathEqual -Actual $_.path -Expected $Pair.RecordedWorktreePath) -and
        (Test-OrdinalEqual -Actual $_.branch -Expected $Pair.RecordedBranch)
    })
    if ($matches.Count -ne 1) {
        return $false
    }
    if (-not (Test-LocalBranchExists -Fixture $Fixture -Branch $Pair.RecordedBranch)) {
        return $false
    }

    $liveCommonDirectory = Get-GitCommonDirectory -Repository $Pair.RecordedWorktreePath
    Test-PathEqual -Actual $liveCommonDirectory -Expected $Fixture.CommonDirectory
}

function New-FinalMergeEvidence {
    param(
        [string] $RunId,
        [string] $SourceBranch,
        [string] $H2,
        [ValidateSet('OPEN', 'MERGED')][string] $State = 'MERGED',
        [switch] $Inconsistent
    )

    [pscustomobject]@{
        pr_count = if ($Inconsistent) { 2 } else { 1 }
        run_id = $RunId
        source_branch = $SourceBranch
        head_sha = if ($Inconsistent) { ('0' * 40) } else { $H2 }
        base_branch = 'main'
        state = $State
        origin_main_contains_merge_evidence = $State -eq 'MERGED'
    }
}

function Get-FinalMergeGate {
    param(
        [AllowNull()][pscustomobject] $Evidence,
        [string] $RunId,
        [string] $ExpectedSourceBranch,
        [string] $ExpectedH2
    )

    $required = @(
        'pr_count', 'run_id', 'source_branch', 'head_sha',
        'base_branch', 'state', 'origin_main_contains_merge_evidence'
    )
    if ($null -eq $Evidence) {
        return [pscustomobject]@{ Status = 'blocked'; Reason = 'final-merge-evidence-missing-or-inconsistent' }
    }
    foreach ($field in $required) {
        if (-not $Evidence.PSObject.Properties.Name.Contains($field) -or $null -eq $Evidence.$field) {
            return [pscustomobject]@{ Status = 'blocked'; Reason = 'final-merge-evidence-missing-or-inconsistent' }
        }
    }

    $identityConsistent = $Evidence.pr_count -eq 1 -and
        (Test-OrdinalEqual -Actual $Evidence.run_id -Expected $RunId) -and
        (Test-OrdinalEqual -Actual $Evidence.source_branch -Expected $ExpectedSourceBranch) -and
        (Test-OrdinalEqual -Actual $Evidence.head_sha -Expected $ExpectedH2) -and
        (Test-OrdinalEqual -Actual $Evidence.base_branch -Expected 'main')
    if (-not $identityConsistent) {
        return [pscustomobject]@{ Status = 'blocked'; Reason = 'final-merge-evidence-missing-or-inconsistent' }
    }
    if (Test-OrdinalEqual -Actual $Evidence.state -Expected 'OPEN') {
        return [pscustomobject]@{ Status = 'ineligible'; Reason = 'pending-final-pr-merge' }
    }
    if (-not (Test-OrdinalEqual -Actual $Evidence.state -Expected 'MERGED') -or
        $Evidence.origin_main_contains_merge_evidence -ne $true) {
        return [pscustomobject]@{ Status = 'blocked'; Reason = 'final-merge-evidence-missing-or-inconsistent' }
    }

    [pscustomobject]@{ Status = 'eligible'; Reason = '' }
}

function Set-PairsRetained {
    param([object[]] $Pairs)

    foreach ($pair in @($Pairs)) {
        $pair.WorktreeState = 'retained'
        $pair.BranchState = 'retained'
    }
}

function Invoke-CleanupSimulation {
    param(
        [pscustomobject] $Fixture,
        [string] $RunId,
        [string] $ExpectedSourceBranch,
        [string] $ExpectedH2,
        [pscustomobject] $Evidence,
        [object[]] $Pairs,
        [bool] $CleanupAuthority
    )

    $state = New-JournalState -RunId $RunId -Pairs $Pairs
    $gate = Get-FinalMergeGate -Evidence $Evidence -RunId $RunId `
        -ExpectedSourceBranch $ExpectedSourceBranch -ExpectedH2 $ExpectedH2

    if ($gate.Status -eq 'ineligible') {
        Set-PairsRetained -Pairs $Pairs
        $state.result = 'ineligible'
        $state.skipped_reasons = @($gate.Reason)
        $journal = Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs
        return [pscustomobject]@{ Journal = $journal; Path = Get-JournalPath $Fixture $RunId }
    }
    if ($gate.Status -eq 'blocked') {
        Set-PairsRetained -Pairs $Pairs
        $state.result = 'blocked'
        $state.skipped_reasons = @($gate.Reason)
        $journal = Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs
        return [pscustomobject]@{ Journal = $journal; Path = Get-JournalPath $Fixture $RunId }
    }

    $state.eligibility = 'eligible'
    if (-not $CleanupAuthority) {
        Set-PairsRetained -Pairs $Pairs
        $state.result = 'not_started'
        $state.skipped_reasons = @('cleanup-authority-missing')
        $journal = Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs
        return [pscustomobject]@{ Journal = $journal; Path = Get-JournalPath $Fixture $RunId }
    }

    $controlBranch = [string](Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @(
        'branch', '--show-current'
    )).Output[0]
    $controlStatus = @((Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @(
        'status', '--porcelain', '--untracked-files=all'
    )).Output)
    $unsafeControl = -not (Test-OrdinalEqual -Actual $controlBranch -Expected 'main') -or $controlStatus.Count -gt 0

    $liveWorktrees = @(Get-LiveWorktrees -Fixture $Fixture)
    $ownershipFailures = @()
    foreach ($pair in @($Pairs)) {
        if ($unsafeControl -or (Test-PathEqual -Actual $Fixture.Repository -Expected $pair.RecordedWorktreePath)) {
            $ownershipFailures += 'unsafe-control-checkout'
            continue
        }
        if (-not (Test-PairOwnership -Fixture $Fixture -RunId $RunId -Pair $pair -LiveWorktrees $liveWorktrees)) {
            $ownershipFailures += "ownership-unproven:$($pair.RecordedBranch)"
        }
    }
    if ($ownershipFailures.Count -gt 0) {
        Set-PairsRetained -Pairs $Pairs
        $state.result = 'blocked'
        $state.skipped_reasons = @($ownershipFailures | Select-Object -Unique)
        $journal = Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs
        return [pscustomobject]@{ Journal = $journal; Path = Get-JournalPath $Fixture $RunId }
    }

    $dirtyReasons = @()
    foreach ($pair in @($Pairs)) {
        $status = @((Invoke-Git -WorkingDirectory $pair.RecordedWorktreePath -Arguments @(
            'status', '--porcelain', '--untracked-files=all'
        )).Output)
        if ($status.Count -gt 0) {
            $dirtyReasons += "dirty-worktree:$($pair.RecordedWorktreePath)"
        }
    }
    if ($dirtyReasons.Count -gt 0) {
        Set-PairsRetained -Pairs $Pairs
        $state.result = 'blocked'
        $state.skipped_reasons = @($dirtyReasons)
        $journal = Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs
        return [pscustomobject]@{ Journal = $journal; Path = Get-JournalPath $Fixture $RunId }
    }

    $state.result = 'in_progress'
    Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs | Out-Null

    for ($index = 0; $index -lt $Pairs.Count; $index++) {
        $pair = $Pairs[$index]
        $worktreeRemoval = Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @(
            'worktree', 'remove', '--', $pair.RecordedWorktreePath
        ) -AllowFailure -CleanupOperation 'remove_worktree' -Resource $pair.RecordedWorktreePath
        if ($worktreeRemoval.ExitCode -eq 0) {
            $pair.WorktreeState = 'removed'
            $state.attempted_operations += [ordered]@{
                operation = 'remove_worktree'
                resource = $pair.RecordedWorktreePath
                status = 'succeeded'
                reason = ''
            }
        }
        else {
            $pair.WorktreeState = 'retained'
            $pair.BranchState = 'retained'
            $state.attempted_operations += [ordered]@{
                operation = 'remove_worktree'
                resource = $pair.RecordedWorktreePath
                status = 'failed'
                reason = 'worktree-removal-failed'
            }
            $state.skipped_reasons = @('worktree-removal-failed')
            $state.result = if (@($state.attempted_operations | Where-Object status -eq 'succeeded').Count -gt 0) {
                'partial'
            } else {
                'blocked'
            }
            $journal = Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs
            return [pscustomobject]@{ Journal = $journal; Path = Get-JournalPath $Fixture $RunId }
        }
        Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs | Out-Null

        $branchDeletion = Invoke-Git -WorkingDirectory $Fixture.Repository -Arguments @(
            'branch', '-d', '--', $pair.RecordedBranch
        ) -AllowFailure -CleanupOperation 'delete_branch' -Resource $pair.RecordedBranch
        if ($branchDeletion.ExitCode -eq 0) {
            $pair.BranchState = 'removed'
            $state.attempted_operations += [ordered]@{
                operation = 'delete_branch'
                resource = $pair.RecordedBranch
                status = 'succeeded'
                reason = ''
            }
            if ($index -eq $Pairs.Count - 1) {
                $state.result = 'completed'
            }
            $journal = Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs
        }
        else {
            $pair.BranchState = 'retained'
            $state.attempted_operations += [ordered]@{
                operation = 'delete_branch'
                resource = $pair.RecordedBranch
                status = 'failed'
                reason = 'non-force-branch-deletion-failed'
            }
            $state.skipped_reasons = @('non-force-branch-deletion-failed')
            $state.result = 'partial'
            $journal = Write-CleanupJournal -Fixture $Fixture -State $state -Pairs $Pairs
            return [pscustomobject]@{ Journal = $journal; Path = Get-JournalPath $Fixture $RunId }
        }
    }

    [pscustomobject]@{ Journal = $journal; Path = Get-JournalPath $Fixture $RunId }
}

function Assert-NoCleanupAttempts {
    param([pscustomobject] $Journal)

    Assert-Condition (@($Journal.attempted_operations).Count -eq 0) 'Blocked or unstarted cleanup must record zero attempts.'
    Assert-Condition (@($script:CaseEvents | Where-Object Type -eq 'git-operation').Count -eq 0) `
        'Blocked or unstarted cleanup must execute zero removal operations.'
}

function Invoke-ProhibitedOperationsReview {
    param(
        [string] $OriginalHead,
        [string] $OriginalArtifactHash
    )

    $skillPath = Join-Path $script:RepositoryRoot '.agents/skills/catworld-parallel-coordinator/SKILL.md'
    $skill = Get-Content -LiteralPath $skillPath -Raw
    $cleanupMatch = [regex]::Match($skill, '(?ms)^### Cleanup\s*$.*?(?=^### |^## |\z)')
    Assert-Condition $cleanupMatch.Success 'Coordinator skill must contain a cleanup section.'
    $cleanup = $cleanupMatch.Value
    $requiredPatterns = [ordered]@{
        common_directory = 'git rev-parse --git-common-dir'
        journal_path = 'catworld-sidecar/runs/<run-id>/cleanup-state\.json'
        worktree_remove = 'git worktree remove'
        non_force_branch_delete = 'git branch -d'
        prohibition_anchor = 'cleanup phase never'
        remote_branch_deletion_prohibited = 'deletes or\s+updates remote branches'
        remote_pruning_prohibited = 'prunes remotes or remote-tracking refs'
        github_mutation_prohibited = 'mutates GitHub\s+issues or comments'
        pr_control_prohibited = 'merges or approves a pull request'
        auto_merge_prohibited = 'enables auto-merge'
        protected_finalization = 'specs/032-final-coordinator-delivery/finalization\.md'
        no_h3_h4 = 'creates H3, H4'
    }
    foreach ($entry in $requiredPatterns.GetEnumerator()) {
        Assert-Condition ($cleanup -match $entry.Value) "Cleanup source is missing contract '$($entry.Key)'."
    }

    $prohibitedSourcePatterns = [ordered]@{
        remote_branch_delete = '(?im)\bgit\s+push\b[^\r\n]*(?:--delete|\s:\S+)'
        remote_prune = '(?im)\bgit\s+(?:remote\s+prune|fetch\b[^\r\n]*--prune)'
        remote_tracking_delete = '(?im)\bgit\s+update-ref\s+-d\s+refs/remotes/'
        force_worktree_remove = '(?im)\bgit\s+worktree\s+remove\b[^\r\n]*--force'
        force_branch_delete = '(?im)\bgit\s+branch\b[^\r\n]*(?-i:-D)(?:\s|$)'
        github_cli_mutation = '(?im)\bgh\s+(?:issue\s+(?:close|comment|edit)|pr\s+(?:merge|review|close|edit))\b'
        github_web_mutation = '(?im)\b(?:Invoke-RestMethod|Invoke-WebRequest)\b'
    }
    $commandCandidates = @(
        [regex]::Matches($cleanup, '`([^`\r\n]+)`') | ForEach-Object { $_.Groups[1].Value }
    )
    $commandCandidates += @(
        $cleanup -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_ -match '^(?:git|gh|Invoke-RestMethod|Invoke-WebRequest)\b' }
    )
    foreach ($entry in $prohibitedSourcePatterns.GetEnumerator()) {
        $matches = @($commandCandidates | Where-Object { $_ -match $entry.Value })
        Assert-Condition ($matches.Count -eq 0) `
            "Cleanup source contains prohibited command form '$($entry.Key)'."
    }

    $prohibitedGitCommands = @($script:AllGitCommands | Where-Object {
        $args = @($_.Arguments)
        ($args.Count -ge 2 -and $args[0] -eq 'push' -and ($args -contains '--delete' -or $args[-1] -match '^:')) -or
        ($args.Count -ge 2 -and $args[0] -eq 'remote' -and $args[1] -in @('remove', 'rm', 'prune')) -or
        ($args -contains '--prune') -or
        ($args.Count -ge 2 -and $args[0] -eq 'update-ref' -and $args[1] -eq '-d' -and $args[-1] -match '^refs/remotes/')
    })
    Assert-Condition ($prohibitedGitCommands.Count -eq 0) 'Validation attempted prohibited remote deletion or pruning.'

    $tokens = $null
    $parseErrors = $null
    $ast = [Management.Automation.Language.Parser]::ParseFile($PSCommandPath, [ref]$tokens, [ref]$parseErrors)
    Assert-Condition (@($parseErrors).Count -eq 0) 'Validation script must parse without PowerShell errors.'
    $forbiddenCommands = @('gh', 'Invoke-RestMethod', 'Invoke-WebRequest')
    $githubCommands = @($ast.FindAll({
        param($node)
        $node -is [Management.Automation.Language.CommandAst] -and
            $forbiddenCommands -contains $node.GetCommandName()
    }, $true))
    Assert-Condition ($githubCommands.Count -eq 0) 'Validation script must not execute GitHub or web mutation commands.'

    $currentHead = [string](Invoke-Git -WorkingDirectory $script:RepositoryRoot -Arguments @(
        'rev-parse', 'HEAD'
    )).Output[0]
    $currentArtifactHash = (Get-FileHash -LiteralPath $script:ProtectedArtifact -Algorithm SHA256).Hash
    Assert-Condition (Test-OrdinalEqual -Actual $currentHead -Expected $OriginalHead) 'Validation changed repository history or H2.'
    Assert-Condition (Test-OrdinalEqual -Actual $currentArtifactHash -Expected $OriginalArtifactHash) `
        'Validation changed specs/032-final-coordinator-delivery/finalization.md.'

    [ordered]@{
        case = 'prohibited-operations-absent'
        result = 'passed'
        remote_deletion_or_pruning_commands = 0
        github_or_web_commands = 0
        repository_head_unchanged = $true
        finalization_artifact_unchanged = $true
    }
}

$cases = @(
    [pscustomobject]@{
        Name = 'blocked-before-final-merge'; Key = 'premerge'; RunId = 'run-premerge'
        ResourceCount = 1; DirtyIndex = -1; UnknownIndex = -1; UnmergedIndex = -1
        EvidenceState = 'OPEN'; CleanupAuthority = $true
        ExpectedEligibility = 'ineligible'; ExpectedResult = 'ineligible'; ExpectedAttempts = 0
    },
    [pscustomobject]@{
        Name = 'eligible-after-final-merge'; Key = 'eligible'; RunId = 'run-eligible'
        ResourceCount = 1; DirtyIndex = -1; UnknownIndex = -1; UnmergedIndex = -1
        EvidenceState = 'MERGED'; CleanupAuthority = $false
        ExpectedEligibility = 'eligible'; ExpectedResult = 'not_started'; ExpectedAttempts = 0
    },
    [pscustomobject]@{
        Name = 'dirty-worktree-blocks'; Key = 'dirty'; RunId = 'run-dirty'
        ResourceCount = 2; DirtyIndex = 1; UnknownIndex = -1; UnmergedIndex = -1
        EvidenceState = 'MERGED'; CleanupAuthority = $true
        ExpectedEligibility = 'eligible'; ExpectedResult = 'blocked'; ExpectedAttempts = 0
    },
    [pscustomobject]@{
        Name = 'unknown-ownership-blocks'; Key = 'unknown'; RunId = 'run-unknown'
        ResourceCount = 2; DirtyIndex = -1; UnknownIndex = 1; UnmergedIndex = -1
        EvidenceState = 'MERGED'; CleanupAuthority = $true
        ExpectedEligibility = 'eligible'; ExpectedResult = 'blocked'; ExpectedAttempts = 0
    },
    [pscustomobject]@{
        Name = 'successful-local-cleanup'; Key = 'success'; RunId = 'run-success'
        ResourceCount = 1; DirtyIndex = -1; UnknownIndex = -1; UnmergedIndex = -1
        EvidenceState = 'MERGED'; CleanupAuthority = $true
        ExpectedEligibility = 'eligible'; ExpectedResult = 'completed'; ExpectedAttempts = 2
    },
    [pscustomobject]@{
        Name = 'partial-failure-recorded'; Key = 'partial'; RunId = 'run-partial'
        ResourceCount = 1; DirtyIndex = -1; UnknownIndex = -1; UnmergedIndex = 0
        EvidenceState = 'MERGED'; CleanupAuthority = $true
        ExpectedEligibility = 'eligible'; ExpectedResult = 'partial'; ExpectedAttempts = 2
    },
    [pscustomobject]@{
        Name = 'prohibited-operations-absent'; Key = 'prohibited'; RunId = ''
        ResourceCount = 0; DirtyIndex = -1; UnknownIndex = -1; UnmergedIndex = -1
        EvidenceState = ''; CleanupAuthority = $false
        ExpectedEligibility = ''; ExpectedResult = 'passed'; ExpectedAttempts = 0
    }
)

$fixture = $null
$exitCode = 0
try {
    Assert-Condition (Test-Path -LiteralPath $script:ProtectedArtifact -PathType Leaf) 'Missing protected #258 finalization artifact.'
    $originalHead = [string](Invoke-Git -WorkingDirectory $script:RepositoryRoot -Arguments @(
        'rev-parse', 'HEAD'
    )).Output[0]
    $originalArtifactHash = (Get-FileHash -LiteralPath $script:ProtectedArtifact -Algorithm SHA256).Hash
    $fixture = New-CleanupFixture
    $results = @()

    foreach ($case in $cases) {
        if ($case.Name -eq 'prohibited-operations-absent') {
            $results += Invoke-ProhibitedOperationsReview -OriginalHead $originalHead `
                -OriginalArtifactHash $originalArtifactHash
            continue
        }

        $pairs = @()
        for ($index = 0; $index -lt $case.ResourceCount; $index++) {
            $pairs += New-OwnedPair -Fixture $fixture -CaseKey $case.Key -RunId $case.RunId `
                -Index $index -UnmergedCommit:($case.UnmergedIndex -eq $index)
        }
        if ($case.DirtyIndex -ge 0) {
            Set-Content -LiteralPath (Join-Path $pairs[$case.DirtyIndex].WorktreePath 'dirty.txt') `
                -Value 'dirty' -NoNewline
        }
        if ($case.UnknownIndex -ge 0) {
            $pairs[$case.UnknownIndex].RecordedRunId = 'another-sidecar-run'
        }

        $expectedSource = "sidecar/coordinator-$($case.Key)"
        $evidence = New-FinalMergeEvidence -RunId $case.RunId -SourceBranch $expectedSource `
            -H2 $fixture.H2 -State $case.EvidenceState
        $script:CaseEvents = New-Object System.Collections.ArrayList
        $outcome = Invoke-CleanupSimulation -Fixture $fixture -RunId $case.RunId `
            -ExpectedSourceBranch $expectedSource -ExpectedH2 $fixture.H2 -Evidence $evidence `
            -Pairs $pairs -CleanupAuthority $case.CleanupAuthority
        Assert-Journal -Fixture $fixture -RunId $case.RunId -Journal $outcome.Journal -Path $outcome.Path

        Assert-Condition (Test-OrdinalEqual -Actual $outcome.Journal.eligibility -Expected $case.ExpectedEligibility) `
            "$($case.Name) eligibility mismatch."
        Assert-Condition (Test-OrdinalEqual -Actual $outcome.Journal.result -Expected $case.ExpectedResult) `
            "$($case.Name) result mismatch."
        Assert-Condition (@($outcome.Journal.attempted_operations).Count -eq $case.ExpectedAttempts) `
            "$($case.Name) attempted operation count mismatch."

        if ($case.ExpectedAttempts -eq 0) {
            Assert-NoCleanupAttempts -Journal $outcome.Journal
            foreach ($pair in $pairs) {
                Assert-Condition (Test-Path -LiteralPath $pair.WorktreePath -PathType Container) `
                    "$($case.Name) removed a retained worktree."
                Assert-Condition (Test-LocalBranchExists -Fixture $fixture -Branch $pair.Branch) `
                    "$($case.Name) removed a retained branch."
            }
        }
        else {
            $operations = @($outcome.Journal.attempted_operations)
            Assert-Condition (Test-OrdinalEqual -Actual $operations[0].operation -Expected 'remove_worktree') `
                "$($case.Name) must attempt worktree removal first."
            Assert-Condition (Test-OrdinalEqual -Actual $operations[1].operation -Expected 'delete_branch') `
                "$($case.Name) must attempt branch deletion second."
            $events = @($script:CaseEvents)
            Assert-Condition ($events[0].Type -eq 'journal-write' -and $events[0].Journal.result -eq 'in_progress') `
                "$($case.Name) must journal in_progress before its first destructive operation."
            Assert-Condition (@($events | Where-Object Type -eq 'journal-write').Count -ge 3) `
                "$($case.Name) must journal before cleanup and after each attempt."
        }

        if ($case.Name -eq 'blocked-before-final-merge') {
            Assert-Condition (@($outcome.Journal.skipped_reasons) -contains 'pending-final-pr-merge') `
                'Known unmerged final PR must record the pending-merge reason.'

            $script:CaseEvents = New-Object System.Collections.ArrayList
            $inconsistent = New-FinalMergeEvidence -RunId $case.RunId -SourceBranch $expectedSource `
                -H2 $fixture.H2 -State 'MERGED' -Inconsistent
            $blocked = Invoke-CleanupSimulation -Fixture $fixture -RunId $case.RunId `
                -ExpectedSourceBranch $expectedSource -ExpectedH2 $fixture.H2 -Evidence $inconsistent `
                -Pairs $pairs -CleanupAuthority $true
            Assert-Condition ($blocked.Journal.result -eq 'blocked') `
                'Missing or inconsistent final-merge evidence must record blocked.'
            Assert-NoCleanupAttempts -Journal $blocked.Journal
        }
        elseif ($case.Name -eq 'eligible-after-final-merge') {
            Assert-Condition (@($outcome.Journal.skipped_reasons) -contains 'cleanup-authority-missing') `
                'Eligible cleanup without current authority must record why it was not started.'
        }
        elseif ($case.Name -eq 'dirty-worktree-blocks') {
            Assert-Condition (@($outcome.Journal.skipped_reasons | Where-Object { $_ -like 'dirty-worktree:*' }).Count -eq 1) `
                'Dirty worktree case must record one exact dirty-worktree reason.'
        }
        elseif ($case.Name -eq 'unknown-ownership-blocks') {
            Assert-Condition (@($outcome.Journal.skipped_reasons | Where-Object { $_ -like 'ownership-unproven:*' }).Count -eq 1) `
                'Unknown ownership case must record one ownership reason.'
        }
        elseif ($case.Name -eq 'successful-local-cleanup') {
            Assert-Condition (-not (Test-Path -LiteralPath $pairs[0].WorktreePath)) 'Successful cleanup must remove its worktree.'
            Assert-Condition (-not (Test-LocalBranchExists -Fixture $fixture -Branch $pairs[0].Branch)) `
                'Successful cleanup must remove its branch.'
            Assert-Condition (@($outcome.Journal.attempted_operations | Where-Object status -ne 'succeeded').Count -eq 0) `
                'Successful cleanup must record only succeeded operations.'
            Assert-Condition (Test-Path -LiteralPath $outcome.Path -PathType Leaf) `
                'Journal must survive worktree and branch cleanup.'
        }
        elseif ($case.Name -eq 'partial-failure-recorded') {
            Assert-Condition (-not (Test-Path -LiteralPath $pairs[0].WorktreePath)) `
                'Partial cleanup must retain the successful worktree removal.'
            Assert-Condition (Test-LocalBranchExists -Fixture $fixture -Branch $pairs[0].Branch) `
                'Partial cleanup must retain the branch whose non-force deletion failed.'
            Assert-Condition ($outcome.Journal.attempted_operations[0].status -eq 'succeeded' -and
                $outcome.Journal.attempted_operations[1].status -eq 'failed') `
                'Partial cleanup must record the exact success/failure sequence.'
            Assert-Condition (@($outcome.Journal.skipped_reasons) -contains 'non-force-branch-deletion-failed') `
                'Partial cleanup must record the normalized branch failure reason.'
        }

        $results += [ordered]@{
            case = $case.Name
            result = 'passed'
            eligibility = $outcome.Journal.eligibility
            cleanup_result = $outcome.Journal.result
            attempted_operations = @($outcome.Journal.attempted_operations).Count
        }
    }

    Assert-Condition ($results.Count -eq 7) 'Focused cleanup validation must report exactly seven approved cases.'
    [Console]::Out.WriteLine(([ordered]@{
        result = 'passed'
        fixture_count = 1
        case_count = $results.Count
        cases = $results
    } | ConvertTo-Json -Depth 10 -Compress))
}
catch {
    $exitCode = 1
    [Console]::Out.WriteLine(([ordered]@{
        result = 'failed'
        error = $_.Exception.Message
    } | ConvertTo-Json -Depth 6 -Compress))
}
finally {
    Remove-CleanupFixture -Fixture $fixture
}

if ($exitCode -ne 0) {
    exit $exitCode
}
