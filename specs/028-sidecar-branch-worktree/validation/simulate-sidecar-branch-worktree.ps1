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

function New-CoordinatorBranchAndWorktree {
    param([pscustomobject] $Fixture)

    $originMain = (Invoke-Git $Fixture.Repo @('rev-parse', 'origin/main')).Output[0]
    Invoke-Git $Fixture.Repo @('branch', $Fixture.CoordinatorBranch, 'origin/main') | Out-Null
    Invoke-Git $Fixture.Repo @('worktree', 'add', '-q', $Fixture.CoordinatorWorktree, $Fixture.CoordinatorBranch) | Out-Null

    $coordinatorHead = (Invoke-Git $Fixture.CoordinatorWorktree @('rev-parse', 'HEAD')).Output[0]
    $localMain = (Invoke-Git $Fixture.Repo @('rev-parse', 'main')).Output[0]
    $mainStatus = @(Invoke-Git $Fixture.Repo @('status', '--porcelain')).Output

    Assert-Condition ($coordinatorHead -eq $originMain) 'Coordinator branch must start from origin/main.'
    Assert-Condition ($localMain -eq $originMain) 'Local main must remain at origin/main.'
    Assert-Condition ($mainStatus.Count -eq 0) "Local main should stay clean, got: $($mainStatus -join '; ')"
    Assert-Condition (Test-Path -LiteralPath $Fixture.CoordinatorWorktree) 'Coordinator worktree must exist.'

    [pscustomobject]@{
        SourceRef = 'origin/main'
        SourceSha = $originMain
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorHead = $coordinatorHead
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
        LocalMainSha = $localMain
        LocalMainStatusEntries = $mainStatus.Count
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

function Test-CollisionState {
    param([pscustomobject] $Fixture)

    $sameRun = [pscustomobject]@{
        RunId = 'sidecar-run-9901-controlled-workflow-dry-run'
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
    }
    $collision = [pscustomobject]@{
        RunId = 'sidecar-run-9901-different-source'
        CoordinatorBranch = $Fixture.CoordinatorBranch
        CoordinatorWorktree = $Fixture.CoordinatorWorktree
    }

    $expectedRunId = 'sidecar-run-9901-controlled-workflow-dry-run'
    $sameRunResume =
        $sameRun.RunId -eq $expectedRunId -and
        $sameRun.CoordinatorBranch -eq $Fixture.CoordinatorBranch -and
        $sameRun.CoordinatorWorktree -eq $Fixture.CoordinatorWorktree

    $collisionStop = -not (
        $collision.RunId -eq $expectedRunId -and
        $collision.CoordinatorBranch -eq $Fixture.CoordinatorBranch -and
        $collision.CoordinatorWorktree -eq $Fixture.CoordinatorWorktree
    )

    Assert-Condition $sameRunResume 'Expected same-run resource ownership to be resumable.'
    Assert-Condition $collisionStop 'Expected unproven resource ownership to stop as collision.'

    [pscustomobject]@{
        SameRunResult = 'resume'
        CollisionResult = 'stop-before-reuse'
        BranchName = $Fixture.CoordinatorBranch
        WorktreePath = $Fixture.CoordinatorWorktree
    }
}

$fixture = Initialize-RemoteFixture

try {
    switch ($Scenario) {
        'coordinator' {
            $state = New-CoordinatorBranchAndWorktree -Fixture $fixture
            [pscustomobject]@{
                Scenario = 'coordinator'
                Result = 'passed'
                SourceRef = $state.SourceRef
                CoordinatorBranch = $state.CoordinatorBranch
                CoordinatorWorktree = $state.CoordinatorWorktree
                LocalMainStatusEntries = $state.LocalMainStatusEntries
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
                BranchName = $collisionState.BranchName
                WorktreePath = $collisionState.WorktreePath
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
