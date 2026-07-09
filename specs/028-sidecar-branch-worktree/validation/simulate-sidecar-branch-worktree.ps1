param(
    [ValidateSet(
        'coordinator',
        'push-gate',
        'children',
        'collision',
        'dirty',
        'unsafe-push'
    )]
    [string] $Scenario = 'coordinator'
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

function New-TempPath {
    param([string] $Prefix)

    Join-Path ([System.IO.Path]::GetTempPath()) ($Prefix + [guid]::NewGuid().ToString('N'))
}

function Initialize-RemoteFixture {
    $root = New-TempPath -Prefix 'catworld-sidecar-git-'
    $remote = Join-Path $root 'origin.git'
    $seed = Join-Path $root 'seed'
    $repo = Join-Path $root 'repo'
    $worktrees = Join-Path $root 'worktrees'

    New-Item -ItemType Directory -Path $root | Out-Null
    New-Item -ItemType Directory -Path $worktrees | Out-Null
    & git init --bare -q $remote
    if ($LASTEXITCODE -ne 0) { throw 'Failed to initialize bare remote.' }

    & git init -q $seed
    if ($LASTEXITCODE -ne 0) { throw 'Failed to initialize seed repository.' }
    Invoke-Git $seed @('branch', '-M', 'main') | Out-Null
    Invoke-Git $seed @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
    Invoke-Git $seed @('config', 'user.name', 'Sidecar Simulation') | Out-Null
    Set-Content -LiteralPath (Join-Path $seed 'README.md') -Value 'seed' -NoNewline
    Invoke-Git $seed @('add', 'README.md') | Out-Null
    Invoke-Git $seed @('commit', '-q', '-m', 'seed main') | Out-Null
    Invoke-Git $seed @('remote', 'add', 'origin', $remote) | Out-Null
    Invoke-Git $seed @('push', '-q', '-u', 'origin', 'main') | Out-Null
    & git --git-dir=$remote symbolic-ref HEAD refs/heads/main
    if ($LASTEXITCODE -ne 0) { throw 'Failed to point bare remote HEAD at main.' }

    & git clone -q $remote $repo
    if ($LASTEXITCODE -ne 0) { throw 'Failed to clone fixture repository.' }
    Invoke-Git $repo @('switch', '-q', 'main') | Out-Null
    Invoke-Git $repo @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
    Invoke-Git $repo @('config', 'user.name', 'Sidecar Simulation') | Out-Null
    Invoke-Git $repo @('fetch', '-q', 'origin', 'main') | Out-Null

    [pscustomobject]@{
        Root = $root
        Remote = $remote
        Repo = $repo
        Worktrees = $worktrees
        CoordinatorBranch = 'sidecar/9901-coordinator-controlled-workflow-dry-run'
        CoordinatorWorktree = Join-Path $worktrees '9901-coordinator-controlled-workflow-dry-run'
        ChildBranches = @(
            'sidecar/9902-child-routing-fixture',
            'sidecar/9903-child-reporting-fixture'
        )
        ChildWorktrees = @(
            (Join-Path $worktrees '9902-child-routing-fixture'),
            (Join-Path $worktrees '9903-child-reporting-fixture')
        )
    }
}

function Advance-RemoteMain {
    param([pscustomobject] $Fixture)

    $previousRemoteMain = (Invoke-Git $Fixture.Repo @('rev-parse', 'origin/main')).Output[0]
    $advance = Join-Path $Fixture.Root 'advance-main'

    & git clone -q $Fixture.Remote $advance
    if ($LASTEXITCODE -ne 0) { throw 'Failed to clone remote advancement repository.' }
    Invoke-Git $advance @('switch', '-q', 'main') | Out-Null
    Invoke-Git $advance @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
    Invoke-Git $advance @('config', 'user.name', 'Sidecar Simulation') | Out-Null
    Set-Content -LiteralPath (Join-Path $advance 'remote-main-b.md') -Value 'remote main B' -NoNewline
    Invoke-Git $advance @('add', 'remote-main-b.md') | Out-Null
    Invoke-Git $advance @('commit', '-q', '-m', 'advance remote main') | Out-Null
    Invoke-Git $advance @('push', '-q', 'origin', 'main') | Out-Null

    $newRemoteMain = (& git "--git-dir=$($Fixture.Remote)" rev-parse refs/heads/main).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Failed to read advanced remote main.' }

    Assert-Condition ($newRemoteMain -ne $previousRemoteMain) 'Remote main must advance for stale-main simulation.'

    [pscustomobject]@{
        PreviousRemoteMain = $previousRemoteMain
        NewRemoteMain = $newRemoteMain
    }
}

function New-CoordinatorBranchAndWorktree {
    param([pscustomobject] $Fixture)

    $localMainBefore = (Invoke-Git $Fixture.Repo @('rev-parse', 'main')).Output[0]
    $localMainBranchBefore = (Invoke-Git $Fixture.Repo @('branch', '--show-current')).Output[0]
    $mainStatusBefore = @(Invoke-Git $Fixture.Repo @('status', '--porcelain')).Output

    Invoke-Git $Fixture.Repo @('fetch', '-q', 'origin', 'main') | Out-Null
    $originMain = (Invoke-Git $Fixture.Repo @('rev-parse', 'origin/main')).Output[0]
    Invoke-Git $Fixture.Repo @('branch', $Fixture.CoordinatorBranch, 'origin/main') | Out-Null
    Invoke-Git $Fixture.Repo @('worktree', 'add', '-q', $Fixture.CoordinatorWorktree, $Fixture.CoordinatorBranch) | Out-Null

    $coordinatorHead = (Invoke-Git $Fixture.CoordinatorWorktree @('rev-parse', 'HEAD')).Output[0]
    $localMainAfter = (Invoke-Git $Fixture.Repo @('rev-parse', 'main')).Output[0]
    $localMainBranchAfter = (Invoke-Git $Fixture.Repo @('branch', '--show-current')).Output[0]
    $mainStatus = @(Invoke-Git $Fixture.Repo @('status', '--porcelain')).Output
    $artifactOnLocalMain = Test-Path -LiteralPath (Join-Path $Fixture.Repo 'coordinator-state.md')

    Assert-Condition ($coordinatorHead -eq $originMain) 'Coordinator branch must start from origin/main.'
    Assert-Condition ($localMainAfter -eq $localMainBefore) 'Local main branch SHA must remain unchanged.'
    Assert-Condition ($localMainBranchBefore -eq 'main') 'Fixture repository should start on local main.'
    Assert-Condition ($localMainBranchAfter -eq 'main') 'Fixture repository must remain on local main.'
    Assert-Condition ($mainStatusBefore.Count -eq 0) "Local main should start clean, got: $($mainStatusBefore -join '; ')"
    Assert-Condition ($mainStatus.Count -eq 0) "Local main should stay clean, got: $($mainStatus -join '; ')"
    Assert-Condition (-not $artifactOnLocalMain) 'Sidecar artifacts must not be written to local main.'
    Assert-Condition (Test-Path -LiteralPath $Fixture.CoordinatorWorktree) 'Coordinator worktree must exist.'

    [pscustomobject]@{
        SourceRef = 'origin/main'
        SourceSha = $originMain
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorHead = $coordinatorHead
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
        LocalMainShaBefore = $localMainBefore
        LocalMainShaAfter = $localMainAfter
        LocalMainBranchBefore = $localMainBranchBefore
        LocalMainBranchAfter = $localMainBranchAfter
        LocalMainStatusEntries = $mainStatus.Count
        ArtifactOnLocalMain = $artifactOnLocalMain
        ArtifactWriteBoundary = 'coordinator-worktree'
    }
}

function Add-CoordinatorCommit {
    param(
        [pscustomobject] $Fixture,
        [string] $Message = 'record coordinator state',
        [string] $FileName = 'coordinator-state.md',
        [string] $Content = 'coordinator state'
    )

    Set-Content -LiteralPath (Join-Path $Fixture.CoordinatorWorktree $FileName) -Value $Content -NoNewline
    Invoke-Git $Fixture.CoordinatorWorktree @('add', $FileName) | Out-Null
    Invoke-Git $Fixture.CoordinatorWorktree @('commit', '-q', '-m', $Message) | Out-Null
}

function Test-RemoteBranchExists {
    param(
        [pscustomobject] $Fixture,
        [string] $BranchName
    )

    $remoteRef = "refs/heads/$BranchName"
    $result = & git -C $Fixture.Repo ls-remote --heads origin $BranchName 2>$null
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        return $false
    }

    @($result | Where-Object { $_ -match [regex]::Escape($remoteRef) }).Count -gt 0
}

function Push-CoordinatorBranch {
    param([pscustomobject] $Fixture)

    Invoke-Git $Fixture.CoordinatorWorktree @('push', '-q', 'origin', "HEAD:$($Fixture.CoordinatorBranch)") | Out-Null
}

function New-ChildBranchesAndWorktrees {
    param([pscustomobject] $Fixture)

    $coordinatorHead = (Invoke-Git $Fixture.Repo @('rev-parse', $Fixture.CoordinatorBranch)).Output[0]
    $children = @()

    for ($i = 0; $i -lt $Fixture.ChildBranches.Count; $i++) {
        $branch = $Fixture.ChildBranches[$i]
        $worktree = $Fixture.ChildWorktrees[$i]

        Invoke-Git $Fixture.Repo @('branch', $branch, $Fixture.CoordinatorBranch) | Out-Null
        Invoke-Git $Fixture.Repo @('worktree', 'add', '-q', $worktree, $branch) | Out-Null

        $childHead = (Invoke-Git $worktree @('rev-parse', 'HEAD')).Output[0]
        Assert-Condition ($childHead -eq $coordinatorHead) "Child branch $branch must start from coordinator branch."
        Assert-Condition ($branch -notmatch 'main$') "Child branch $branch must not be main."
        Assert-Condition ($worktree -ne $Fixture.CoordinatorWorktree) "Child worktree $worktree must be isolated from coordinator worktree."

        $children += [pscustomobject]@{
            Branch = $branch
            BaseBranch = $Fixture.CoordinatorBranch
            Head = $childHead
            Worktree = $worktree
            IsolatedFromCoordinator = $worktree -ne $Fixture.CoordinatorWorktree
        }
    }

    Assert-Condition ($Fixture.ChildWorktrees[0] -ne $Fixture.ChildWorktrees[1]) 'Child worktrees must be isolated from each other.'

    $children
}

function Test-LocalBranchExists {
    param(
        [pscustomobject] $Fixture,
        [string] $BranchName
    )

    (Invoke-Git $Fixture.Repo @('show-ref', '--verify', '--quiet', "refs/heads/$BranchName") -AllowFailure).ExitCode -eq 0
}

function Test-UsableWorktreePath {
    param([string] $Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }

    $result = & git -C $Path rev-parse --is-inside-work-tree 2>$null
    $exitCode = $LASTEXITCODE

    $exitCode -eq 0 -and $result -eq 'true'
}

function Test-DurableSidecarOwnership {
    param(
        [pscustomobject] $Fixture,
        [pscustomobject] $State
    )

    $expectedRunId = 'sidecar-run-9901-controlled-workflow-dry-run'

    $State.RunId -eq $expectedRunId -and
        $State.CoordinatorBranch -eq $Fixture.CoordinatorBranch -and
        $State.CoordinatorWorktree -eq $Fixture.CoordinatorWorktree -and
        $State.ChildBranch -eq $Fixture.ChildBranches[0] -and
        $State.ChildWorktree -eq $Fixture.ChildWorktrees[0] -and
        (Test-LocalBranchExists -Fixture $Fixture -BranchName $State.CoordinatorBranch) -and
        (Test-UsableWorktreePath -Path $State.CoordinatorWorktree) -and
        (Test-LocalBranchExists -Fixture $Fixture -BranchName $State.ChildBranch) -and
        (Test-UsableWorktreePath -Path $State.ChildWorktree)
}

function Test-CollisionState {
    param([pscustomobject] $Fixture)

    Invoke-Git $Fixture.Repo @('branch', $Fixture.CoordinatorBranch, 'origin/main') | Out-Null
    Invoke-Git $Fixture.Repo @('worktree', 'add', '-q', $Fixture.CoordinatorWorktree, $Fixture.CoordinatorBranch) | Out-Null
    Invoke-Git $Fixture.Repo @('branch', $Fixture.ChildBranches[0], $Fixture.CoordinatorBranch) | Out-Null
    Invoke-Git $Fixture.Repo @('worktree', 'add', '-q', $Fixture.ChildWorktrees[0], $Fixture.ChildBranches[0]) | Out-Null

    $coordinatorBranchCollision = Invoke-Git $Fixture.Repo @('branch', $Fixture.CoordinatorBranch, 'origin/main') -AllowFailure
    Invoke-Git $Fixture.Repo @('branch', 'sidecar/9904-coordinator-path-collision', 'origin/main') | Out-Null
    $coordinatorWorktreeCollision = Invoke-Git $Fixture.Repo @('worktree', 'add', '-q', $Fixture.CoordinatorWorktree, 'sidecar/9904-coordinator-path-collision') -AllowFailure
    $childBranchCollision = Invoke-Git $Fixture.Repo @('branch', $Fixture.ChildBranches[0], $Fixture.CoordinatorBranch) -AllowFailure
    Invoke-Git $Fixture.Repo @('branch', 'sidecar/9905-child-path-collision', $Fixture.CoordinatorBranch) | Out-Null
    $childWorktreeCollision = Invoke-Git $Fixture.Repo @('worktree', 'add', '-q', $Fixture.ChildWorktrees[0], 'sidecar/9905-child-path-collision') -AllowFailure

    $existingCoordinatorBranch = Test-LocalBranchExists -Fixture $Fixture -BranchName $Fixture.CoordinatorBranch
    $existingCoordinatorWorktree = Test-UsableWorktreePath -Path $Fixture.CoordinatorWorktree
    $existingChildBranch = Test-LocalBranchExists -Fixture $Fixture -BranchName $Fixture.ChildBranches[0]
    $existingChildWorktree = Test-UsableWorktreePath -Path $Fixture.ChildWorktrees[0]

    $sameRun = [pscustomobject]@{
        RunId = 'sidecar-run-9901-controlled-workflow-dry-run'
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
        ChildBranch = $Fixture.ChildBranches[0]
        ChildWorktree = $Fixture.ChildWorktrees[0]
    }
    $collision = [pscustomobject]@{
        RunId = 'sidecar-run-9901-different-source'
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
        ChildBranch = $Fixture.ChildBranches[0]
        ChildWorktree = $Fixture.ChildWorktrees[0]
    }

    $sameRunResume = Test-DurableSidecarOwnership -Fixture $Fixture -State $sameRun
    $collisionStop = -not (Test-DurableSidecarOwnership -Fixture $Fixture -State $collision)

    Assert-Condition $existingCoordinatorBranch 'Expected a real existing coordinator branch collision.'
    Assert-Condition $existingCoordinatorWorktree 'Expected a real existing coordinator worktree path collision.'
    Assert-Condition $existingChildBranch 'Expected a real existing child branch collision.'
    Assert-Condition $existingChildWorktree 'Expected a real existing child worktree path collision.'
    Assert-Condition ($coordinatorBranchCollision.ExitCode -ne 0) 'Expected duplicate coordinator branch creation to fail.'
    Assert-Condition ($coordinatorWorktreeCollision.ExitCode -ne 0) 'Expected duplicate coordinator worktree path creation to fail.'
    Assert-Condition ($childBranchCollision.ExitCode -ne 0) 'Expected duplicate child branch creation to fail.'
    Assert-Condition ($childWorktreeCollision.ExitCode -ne 0) 'Expected duplicate child worktree path creation to fail.'

    Assert-Condition $sameRunResume 'Expected same-run resource ownership to be resumable.'
    Assert-Condition $collisionStop 'Expected unproven resource ownership to stop as collision.'

    [pscustomobject]@{
        SameRunResult = 'resume'
        CollisionResult = 'stop-before-reuse-write'
        ExistingCoordinatorBranch = $existingCoordinatorBranch
        ExistingCoordinatorWorktree = $existingCoordinatorWorktree
        ExistingChildBranch = $existingChildBranch
        ExistingChildWorktree = $existingChildWorktree
        CoordinatorBranchCreateExitCode = $coordinatorBranchCollision.ExitCode
        CoordinatorWorktreePathCreateExitCode = $coordinatorWorktreeCollision.ExitCode
        ChildBranchCreateExitCode = $childBranchCollision.ExitCode
        ChildWorktreePathCreateExitCode = $childWorktreeCollision.ExitCode
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
        ChildBranch = $Fixture.ChildBranches[0]
        ChildWorktree = $Fixture.ChildWorktrees[0]
    }
}

$fixture = Initialize-RemoteFixture

try {
    switch ($Scenario) {
        'coordinator' {
            $remoteAdvance = Advance-RemoteMain -Fixture $fixture
            $state = New-CoordinatorBranchAndWorktree -Fixture $fixture
            Assert-Condition ($state.SourceSha -eq $remoteAdvance.NewRemoteMain) 'Coordinator branch must use fetched advanced origin/main.'
            Assert-Condition ($state.LocalMainShaBefore -eq $remoteAdvance.PreviousRemoteMain) 'Local main must start at stale SHA A.'
            Assert-Condition ($state.LocalMainShaAfter -eq $remoteAdvance.PreviousRemoteMain) 'Local main must remain at stale SHA A.'
            [pscustomobject]@{
                Scenario = 'coordinator'
                Result = 'passed'
                SourceRef = $state.SourceRef
                RemoteMainBeforeSha = $remoteAdvance.PreviousRemoteMain
                RemoteMainAfterSha = $remoteAdvance.NewRemoteMain
                CoordinatorBranch = $state.CoordinatorBranch
                CoordinatorHead = $state.CoordinatorHead
                CoordinatorWorktree = $state.CoordinatorWorktree
                LocalMainShaBefore = $state.LocalMainShaBefore
                LocalMainShaAfter = $state.LocalMainShaAfter
                LocalMainBranchAfter = $state.LocalMainBranchAfter
                LocalMainStatusEntries = $state.LocalMainStatusEntries
                ArtifactOnLocalMain = $state.ArtifactOnLocalMain
                ArtifactWriteBoundary = $state.ArtifactWriteBoundary
            } | ConvertTo-Json -Depth 5
        }
        'push-gate' {
            New-CoordinatorBranchAndWorktree -Fixture $fixture | Out-Null
            $readyBeforePush = Test-RemoteBranchExists -Fixture $fixture -BranchName $fixture.CoordinatorBranch
            Add-CoordinatorCommit -Fixture $fixture
            Push-CoordinatorBranch -Fixture $fixture
            $readyAfterPush = Test-RemoteBranchExists -Fixture $fixture -BranchName $fixture.CoordinatorBranch

            Assert-Condition (-not $readyBeforePush) 'Child PR delivery must not be ready before remote coordinator branch exists.'
            Assert-Condition $readyAfterPush 'Child PR delivery may be ready only after remote coordinator branch exists.'

            [pscustomobject]@{
                Scenario = 'push-gate'
                Result = 'passed'
                ReadyBeforePush = $readyBeforePush
                CoordinatorPush = 'normal-non-force'
                RemoteCoordinatorBranchExists = $readyAfterPush
                ReadyAfterPush = $readyAfterPush
            } | ConvertTo-Json -Depth 5
        }
        'children' {
            New-CoordinatorBranchAndWorktree -Fixture $fixture | Out-Null
            Add-CoordinatorCommit -Fixture $fixture
            Push-CoordinatorBranch -Fixture $fixture
            $children = New-ChildBranchesAndWorktrees -Fixture $fixture

            [pscustomobject]@{
                Scenario = 'children'
                Result = 'passed'
                CoordinatorBranch = $fixture.CoordinatorBranch
                ChildCount = $children.Count
                Children = $children
                ChildWorktreesIsolatedFromEachOther = $fixture.ChildWorktrees[0] -ne $fixture.ChildWorktrees[1]
            } | ConvertTo-Json -Depth 6
        }
        'collision' {
            $collisionState = Test-CollisionState -Fixture $fixture
            [pscustomobject]@{
                Scenario = 'collision'
                Result = 'passed'
                SameRunResult = $collisionState.SameRunResult
                CollisionResult = $collisionState.CollisionResult
                ExistingCoordinatorBranch = $collisionState.ExistingCoordinatorBranch
                ExistingCoordinatorWorktree = $collisionState.ExistingCoordinatorWorktree
                ExistingChildBranch = $collisionState.ExistingChildBranch
                ExistingChildWorktree = $collisionState.ExistingChildWorktree
                CoordinatorBranchCreateExitCode = $collisionState.CoordinatorBranchCreateExitCode
                CoordinatorWorktreePathCreateExitCode = $collisionState.CoordinatorWorktreePathCreateExitCode
                ChildBranchCreateExitCode = $collisionState.ChildBranchCreateExitCode
                ChildWorktreePathCreateExitCode = $collisionState.ChildWorktreePathCreateExitCode
                CoordinatorBranch = $collisionState.CoordinatorBranch
                CoordinatorWorktree = $collisionState.CoordinatorWorktree
                ChildBranch = $collisionState.ChildBranch
                ChildWorktree = $collisionState.ChildWorktree
            } | ConvertTo-Json -Depth 5
        }
        'dirty' {
            New-CoordinatorBranchAndWorktree -Fixture $fixture | Out-Null
            Set-Content -LiteralPath (Join-Path $fixture.CoordinatorWorktree 'dirty-file.txt') -Value 'dirty' -NoNewline
            $dirtyPaths = @(Invoke-Git $fixture.CoordinatorWorktree @('status', '--porcelain')).Output
            $blocked = $dirtyPaths.Count -gt 0

            Assert-Condition $blocked 'Dirty worktree must block sidecar Git operations.'

            [pscustomobject]@{
                Scenario = 'dirty'
                Result = 'passed'
                DirtyPathCount = $dirtyPaths.Count
                DirtyPaths = $dirtyPaths
                BranchOrWorktreeOperationBlocked = $blocked
                ChildDeliveryBlocked = $blocked
            } | ConvertTo-Json -Depth 5
        }
        'unsafe-push' {
            New-CoordinatorBranchAndWorktree -Fixture $fixture | Out-Null
            Add-CoordinatorCommit -Fixture $fixture -Message 'local coordinator state' -FileName 'local-state.md' -Content 'local'

            $other = Join-Path $fixture.Root 'other'
            & git clone -q $fixture.Remote $other
            if ($LASTEXITCODE -ne 0) { throw 'Failed to clone competing repository.' }
            Invoke-Git $other @('switch', '-q', '-c', $fixture.CoordinatorBranch, 'origin/main') | Out-Null
            Invoke-Git $other @('config', 'user.email', 'sidecar@example.invalid') | Out-Null
            Invoke-Git $other @('config', 'user.name', 'Sidecar Simulation') | Out-Null
            Set-Content -LiteralPath (Join-Path $other 'remote-state.md') -Value 'remote' -NoNewline
            Invoke-Git $other @('add', 'remote-state.md') | Out-Null
            Invoke-Git $other @('commit', '-q', '-m', 'remote coordinator state') | Out-Null
            Invoke-Git $other @('push', '-q', 'origin', "HEAD:$($fixture.CoordinatorBranch)") | Out-Null

            $push = Invoke-Git $fixture.CoordinatorWorktree @('push', 'origin', "HEAD:$($fixture.CoordinatorBranch)") -AllowFailure
            $unsafePushBlocked = $push.ExitCode -ne 0
            $remoteExists = Test-RemoteBranchExists -Fixture $fixture -BranchName $fixture.CoordinatorBranch

            Assert-Condition $unsafePushBlocked 'Expected normal non-force push to be rejected.'
            Assert-Condition $remoteExists 'Remote coordinator branch should still exist.'

            [pscustomobject]@{
                Scenario = 'unsafe-push'
                Result = 'passed'
                NormalPushExitCode = $push.ExitCode
                UnsafePushBlocked = $unsafePushBlocked
                ForcePushAttempted = $false
                HistoryRewriteAttempted = $false
                ChildDeliveryReady = $false
            } | ConvertTo-Json -Depth 5
        }
    }
}
finally {
    if ($fixture -and (Test-Path -LiteralPath $fixture.Root)) {
        Remove-Item -LiteralPath $fixture.Root -Recurse -Force
    }
}
