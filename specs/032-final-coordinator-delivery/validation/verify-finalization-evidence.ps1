param(
    [Parameter(Mandatory = $true)]
    [string] $RepositoryPath,

    [Parameter(Mandatory = $true)]
    [string] $ArtifactPath,

    [Parameter(Mandatory = $true)]
    [string] $ExpectedBaseSha,

    [Parameter(Mandatory = $true)]
    [string] $ExpectedImplementationHeadSha
)

$ErrorActionPreference = 'Stop'
$script:FixedArtifactPath = 'specs/032-final-coordinator-delivery/finalization.md'
$script:FixedTemplatePath = '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md'
$script:ShaPattern = '^[0-9a-fA-F]{40}$'

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

$script:CanonicalScopeRechecks = @(
    'target-base',
    'merge-base',
    'scope-diff',
    'head',
    'ancestry'
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

function Assert-FullSha {
    param(
        [object] $Value,
        [string] $Context
    )

    Assert-Condition ($Value -is [string] -and $Value -match $script:ShaPattern) "$Context must be a full 40-hex SHA."
}

function Test-OrdinalEqual {
    param(
        [object] $Actual,
        [object] $Expected
    )

    $Actual -is [string] -and
        $Expected -is [string] -and
        [StringComparer]::Ordinal.Equals([string]$Actual, [string]$Expected)
}

function Test-OrdinalContains {
    param(
        [object[]] $Values,
        [object] $Expected
    )

    foreach ($value in @($Values)) {
        if (Test-OrdinalEqual -Actual $value -Expected $Expected) {
            return $true
        }
    }
    $false
}

function Test-JsonInteger {
    param([object] $Value)

    $Value -is [sbyte] -or
        $Value -is [byte] -or
        $Value -is [int16] -or
        $Value -is [uint16] -or
        $Value -is [int32] -or
        $Value -is [uint32] -or
        $Value -is [int64] -or
        $Value -is [uint64]
}

function Assert-ExactProperties {
    param(
        [object] $Object,
        [string[]] $Expected,
        [string] $Context
    )

    Assert-Condition ($null -ne $Object) "$Context must be an object."
    $actual = @($Object.PSObject.Properties.Name)
    $missing = @($Expected | Where-Object { -not (Test-OrdinalContains -Values $actual -Expected $_) })
    $extra = @($actual | Where-Object { -not (Test-OrdinalContains -Values $Expected -Expected $_) })
    Assert-Condition ($missing.Count -eq 0) "$Context is missing properties: $($missing -join ', ')."
    Assert-Condition ($extra.Count -eq 0) "$Context contains unsupported properties: $($extra -join ', ')."
}

function Assert-JsonArrayProperty {
    param(
        [object] $Object,
        [string] $Name,
        [string] $Context
    )

    $property = @($Object.PSObject.Properties | Where-Object { Test-OrdinalEqual -Actual $_.Name -Expected $Name })
    Assert-Condition ($property.Count -eq 1 -and $property[0].Value -is [System.Array]) "$Context must be a JSON array."
}

function Assert-NonEmptyString {
    param(
        [object] $Value,
        [string] $Context
    )

    Assert-Condition ($Value -is [string] -and -not [string]::IsNullOrWhiteSpace($Value)) "$Context must be a non-empty string."
}

function Assert-ExactStringSet {
    param(
        [object[]] $Actual,
        [string[]] $Expected,
        [string] $Context
    )

    $actualStrings = @($Actual)
    foreach ($value in $actualStrings) {
        Assert-Condition ($value -is [string]) "$Context values must be strings."
    }

    $duplicates = @()
    for ($left = 0; $left -lt $actualStrings.Count; $left++) {
        for ($right = $left + 1; $right -lt $actualStrings.Count; $right++) {
            if (Test-OrdinalEqual -Actual $actualStrings[$left] -Expected $actualStrings[$right]) {
                $duplicates += $actualStrings[$left]
            }
        }
    }
    $duplicates = @($duplicates | Select-Object -Unique)
    $missing = @($Expected | Where-Object { -not (Test-OrdinalContains -Values $actualStrings -Expected $_) })
    $extra = @($actualStrings | Where-Object { -not (Test-OrdinalContains -Values $Expected -Expected $_) })

    Assert-Condition ($duplicates.Count -eq 0) "$Context contains duplicate values: $($duplicates -join ', ')."
    Assert-Condition ($missing.Count -eq 0) "$Context is missing values: $($missing -join ', ')."
    Assert-Condition ($extra.Count -eq 0) "$Context contains unexpected values: $($extra -join ', ')."
    Assert-Condition ($actualStrings.Count -eq $Expected.Count) "$Context must contain exactly $($Expected.Count) values."
}

function Read-ArtifactJson {
    param([string] $Path)

    $text = Get-Content -LiteralPath $Path -Raw
    $matches = [regex]::Matches($text, '(?ms)```json[ \t]*\r?\n(?<json>.*?)\r?\n```')
    Assert-Condition ($matches.Count -eq 1) 'The finalization artifact must contain exactly one fenced JSON object.'

    $allFenceMarkers = [regex]::Matches($text, '(?m)^```').Count
    Assert-Condition ($allFenceMarkers -eq 2) 'The finalization artifact must not contain additional fenced blocks.'

    try {
        $json = $matches[0].Groups['json'].Value | ConvertFrom-Json
    }
    catch {
        throw "The finalization artifact JSON is invalid: $($_.Exception.Message)"
    }

    [pscustomobject]@{
        Text = $text
        Json = $json
    }
}

function Assert-Manifest {
    param(
        [object[]] $Entries,
        [string[]] $ExpectedIds,
        [bool] $StatusesRequired,
        [string] $Context
    )

    Assert-Condition ($null -ne $Entries) "$Context must be an array."
    $ids = @()
    foreach ($entry in @($Entries)) {
        $expectedProperties = if ($StatusesRequired) { @('id', 'command', 'status') } else { @('id', 'command') }
        Assert-ExactProperties -Object $entry -Expected $expectedProperties -Context "$Context entry"
        Assert-NonEmptyString -Value $entry.id -Context "$Context id"
        Assert-NonEmptyString -Value $entry.command -Context "$Context command for $($entry.id)"
        if ($StatusesRequired) {
            Assert-Condition (Test-OrdinalEqual -Actual $entry.status -Expected 'passed') "$Context entry '$($entry.id)' must have status 'passed'."
        } else {
            Assert-Condition (-not $entry.PSObject.Properties.Name.Contains('status')) "$Context entry '$($entry.id)' must not preclaim a post-H2 status."
        }
        $ids += $entry.id
    }

    Assert-ExactStringSet -Actual $ids -Expected $ExpectedIds -Context "$Context IDs"
    $ids
}

function Assert-ArtifactSchema {
    param(
        [object] $Artifact,
        [string] $Repository,
        [string] $HeadSha,
        [string] $BaseSha,
        [string] $ImplementationSha
    )

    Assert-ExactProperties -Object $Artifact -Expected @(
        'schema_version',
        'issue_number',
        'base',
        'implementation_head',
        'finalization_head',
        'allowed_delta',
        'complete_checks_at_h',
        'h2_required_checks',
        'applicability',
        'scope_at_h',
        'template',
        'readiness',
        'delivery',
        'remaining_risks',
        'runtime_contract'
    ) -Context 'artifact'

    Assert-Condition ((Test-JsonInteger -Value $Artifact.schema_version) -and $Artifact.schema_version -eq 1) 'schema_version must be the numeric integer 1.'
    Assert-Condition ((Test-JsonInteger -Value $Artifact.issue_number) -and $Artifact.issue_number -eq 258) 'issue_number must be the numeric integer 258.'

    Assert-ExactProperties -Object $Artifact.base -Expected @('ref', 'sha', 'merge_base_sha') -Context 'base'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.base.ref -Expected 'origin/workflow/sidecar-buildout') 'base.ref must equal origin/workflow/sidecar-buildout.'
    Assert-FullSha -Value $Artifact.base.sha -Context 'base.sha'
    Assert-FullSha -Value $Artifact.base.merge_base_sha -Context 'base.merge_base_sha'
    Assert-Condition ($Artifact.base.sha -ieq $BaseSha) 'base.sha does not match -ExpectedBaseSha.'
    Assert-Condition ($Artifact.base.merge_base_sha -ieq $BaseSha) 'base.merge_base_sha must equal the verified build-out base SHA.'

    Assert-ExactProperties -Object $Artifact.implementation_head -Expected @('label', 'sha') -Context 'implementation_head'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.implementation_head.label -Expected 'H') 'implementation_head.label must equal H.'
    Assert-FullSha -Value $Artifact.implementation_head.sha -Context 'implementation_head.sha'
    Assert-Condition ($Artifact.implementation_head.sha -ieq $ImplementationSha) 'implementation_head.sha does not match -ExpectedImplementationHeadSha.'

    Assert-ExactProperties -Object $Artifact.finalization_head -Expected @('label', 'identity', 'expected_parent_sha', 'resolved_sha_location') -Context 'finalization_head'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.finalization_head.label -Expected 'H2') 'finalization_head.label must equal H2.'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.finalization_head.identity -Expected 'SELF/HEAD') 'finalization_head.identity must equal the exact marker SELF/HEAD.'
    Assert-FullSha -Value $Artifact.finalization_head.expected_parent_sha -Context 'finalization_head.expected_parent_sha'
    Assert-Condition ($Artifact.finalization_head.expected_parent_sha -ieq $ImplementationSha) 'finalization_head.expected_parent_sha must equal H.'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.finalization_head.resolved_sha_location -Expected 'external-final-report') 'finalization_head.resolved_sha_location must equal external-final-report.'

    Assert-JsonArrayProperty -Object $Artifact -Name 'allowed_delta' -Context 'allowed_delta'
    $allowedDelta = @($Artifact.allowed_delta)
    Assert-Condition ($allowedDelta.Count -eq 1) 'allowed_delta must contain exactly one entry.'
    Assert-ExactProperties -Object $allowedDelta[0] -Expected @('status', 'path') -Context 'allowed_delta entry'
    Assert-Condition (Test-OrdinalEqual -Actual $allowedDelta[0].status -Expected 'A') 'allowed_delta status must equal A.'
    Assert-Condition (Test-OrdinalEqual -Actual $allowedDelta[0].path -Expected $script:FixedArtifactPath) "allowed_delta path must equal $script:FixedArtifactPath."

    Assert-JsonArrayProperty -Object $Artifact -Name 'complete_checks_at_h' -Context 'complete_checks_at_h'
    Assert-JsonArrayProperty -Object $Artifact -Name 'h2_required_checks' -Context 'h2_required_checks'
    $hIds = @(Assert-Manifest -Entries @($Artifact.complete_checks_at_h) -ExpectedIds $script:CanonicalHCheckIds -StatusesRequired $true -Context 'complete_checks_at_h')
    $h2Ids = @(Assert-Manifest -Entries @($Artifact.h2_required_checks) -ExpectedIds $script:CanonicalH2CheckIds -StatusesRequired $false -Context 'h2_required_checks')

    Assert-JsonArrayProperty -Object $Artifact -Name 'applicability' -Context 'applicability'
    $applicability = @($Artifact.applicability)
    Assert-Condition ($applicability.Count -eq $script:CanonicalHCheckIds.Count) 'applicability must contain exactly one entry for every complete H check.'
    $applicabilityIds = @()
    foreach ($entry in $applicability) {
        Assert-ExactProperties -Object $entry -Expected @('check_id', 'reason') -Context 'applicability entry'
        Assert-NonEmptyString -Value $entry.check_id -Context 'applicability.check_id'
        Assert-NonEmptyString -Value $entry.reason -Context "applicability reason for $($entry.check_id)"
        $applicabilityIds += $entry.check_id
    }
    Assert-ExactStringSet -Actual $applicabilityIds -Expected $script:CanonicalHCheckIds -Context 'applicability check IDs'

    Assert-ExactProperties -Object $Artifact.scope_at_h -Expected @('status', 'h2_rechecks') -Context 'scope_at_h'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.scope_at_h.status -Expected 'passed') 'scope_at_h.status must equal passed.'
    Assert-JsonArrayProperty -Object $Artifact.scope_at_h -Name 'h2_rechecks' -Context 'scope_at_h.h2_rechecks'
    Assert-ExactStringSet -Actual @($Artifact.scope_at_h.h2_rechecks) -Expected $script:CanonicalScopeRechecks -Context 'scope_at_h.h2_rechecks'

    Assert-ExactProperties -Object $Artifact.template -Expected @('path', 'blob_sha', 'render_input_requirements') -Context 'template'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.template.path -Expected $script:FixedTemplatePath) "template.path must equal $script:FixedTemplatePath."
    Assert-FullSha -Value $Artifact.template.blob_sha -Context 'template.blob_sha'
    Assert-JsonArrayProperty -Object $Artifact.template -Name 'render_input_requirements' -Context 'template.render_input_requirements'
    Assert-ExactStringSet -Actual @($Artifact.template.render_input_requirements) -Expected $script:CanonicalRenderInputs -Context 'template.render_input_requirements'
    $actualTemplateBlob = (Invoke-Git -WorkingDirectory $Repository -Arguments @('rev-parse', "HEAD:$($script:FixedTemplatePath)")).Output[0]
    Assert-Condition ($Artifact.template.blob_sha -ieq $actualTemplateBlob) 'template.blob_sha does not match the template blob at H2.'

    Assert-ExactProperties -Object $Artifact.readiness -Expected @('status', 'resolved_status_location') -Context 'readiness'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.readiness.status -Expected 'pending_h2_checks') 'readiness.status must equal pending_h2_checks.'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.readiness.resolved_status_location -Expected 'external-final-report') 'readiness.resolved_status_location must equal external-final-report.'

    Assert-ExactProperties -Object $Artifact.delivery -Expected @('head_branch', 'base_branch', 'issue_reference', 'write_pr_url_to_artifact', 'allow_h3') -Context 'delivery'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.delivery.head_branch -Expected 'chore/258-implement-final-coordinator-validation-pr-delivery') 'delivery.head_branch is not the #258 work branch.'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.delivery.base_branch -Expected 'workflow/sidecar-buildout') 'delivery.base_branch must equal workflow/sidecar-buildout.'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.delivery.issue_reference -Expected 'Related to #258') 'delivery.issue_reference must equal Related to #258.'
    Assert-Condition ($Artifact.delivery.write_pr_url_to_artifact -is [bool] -and -not $Artifact.delivery.write_pr_url_to_artifact) 'delivery.write_pr_url_to_artifact must be false.'
    Assert-Condition ($Artifact.delivery.allow_h3 -is [bool] -and -not $Artifact.delivery.allow_h3) 'delivery.allow_h3 must be false.'

    $currentBranch = (Invoke-Git -WorkingDirectory $Repository -Arguments @('symbolic-ref', '--quiet', '--short', 'HEAD')).Output[0]
    Assert-Condition (Test-OrdinalEqual -Actual $currentBranch -Expected $Artifact.delivery.head_branch) 'The checked-out branch does not match delivery.head_branch.'

    $risksProperty = $Artifact.PSObject.Properties['remaining_risks']
    Assert-Condition ($null -ne $risksProperty -and $risksProperty.Value -is [System.Array]) 'remaining_risks must be a JSON array.'
    foreach ($risk in @($risksProperty.Value)) {
        Assert-NonEmptyString -Value $risk -Context 'remaining_risks item'
    }

    Assert-ExactProperties -Object $Artifact.runtime_contract -Expected @('final_target', 'cleanup_eligibility', 'cleanup_reason') -Context 'runtime_contract'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.runtime_contract.final_target -Expected 'main') 'runtime_contract.final_target must equal main.'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.runtime_contract.cleanup_eligibility -Expected 'ineligible') 'runtime_contract.cleanup_eligibility must equal ineligible.'
    Assert-Condition (Test-OrdinalEqual -Actual $Artifact.runtime_contract.cleanup_reason -Expected 'pending final PR merge') 'runtime_contract.cleanup_reason must equal pending final PR merge.'

    [pscustomobject]@{
        HCheckIds = $hIds
        H2CheckIds = $h2Ids
        TemplateBlobSha = $actualTemplateBlob
    }
}

try {
    Assert-FullSha -Value $ExpectedBaseSha -Context '-ExpectedBaseSha'
    Assert-FullSha -Value $ExpectedImplementationHeadSha -Context '-ExpectedImplementationHeadSha'

    $repository = (Resolve-Path -LiteralPath $RepositoryPath).Path
    $insideWorkTree = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', '--is-inside-work-tree')).Output[0]
    Assert-Condition (Test-OrdinalEqual -Actual $insideWorkTree -Expected 'true') '-RepositoryPath must identify a Git worktree.'

    $normalizedArtifactPath = $ArtifactPath.Replace('\', '/').TrimStart('./')
    Assert-Condition (Test-OrdinalEqual -Actual $normalizedArtifactPath -Expected $script:FixedArtifactPath) "-ArtifactPath must equal $script:FixedArtifactPath."

    $dirty = @((Invoke-Git -WorkingDirectory $repository -Arguments @('status', '--porcelain=v1', '--untracked-files=all')).Output)
    Assert-Condition ($dirty.Count -eq 0) "The repository index and worktree must be clean; found: $($dirty -join ', ')."

    $headSha = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', '--verify', 'HEAD^{commit}')).Output[0]
    Assert-FullSha -Value $headSha -Context 'resolved H2 HEAD'
    Assert-Condition ($headSha -ine $ExpectedImplementationHeadSha) 'H2 must be a distinct commit after H.'

    $baseResolved = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', '--verify', "$ExpectedBaseSha^{commit}")).Output[0]
    $implementationResolved = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-parse', '--verify', "$ExpectedImplementationHeadSha^{commit}")).Output[0]
    Assert-Condition ($baseResolved -ieq $ExpectedBaseSha) '-ExpectedBaseSha did not resolve to the exact commit supplied.'
    Assert-Condition ($implementationResolved -ieq $ExpectedImplementationHeadSha) '-ExpectedImplementationHeadSha did not resolve to the exact commit supplied.'

    $parentLine = (Invoke-Git -WorkingDirectory $repository -Arguments @('rev-list', '--parents', '-n', '1', 'HEAD')).Output[0]
    $parentParts = @($parentLine -split '\s+' | Where-Object { $_ })
    Assert-Condition ($parentParts.Count -eq 2) 'H2 must have exactly one parent.'
    $actualParent = $parentParts[1]
    Assert-Condition ($actualParent -ieq $ExpectedImplementationHeadSha) 'H2 must directly descend from the supplied H commit.'

    $ancestor = Invoke-Git -WorkingDirectory $repository -Arguments @('merge-base', '--is-ancestor', $ExpectedBaseSha, $ExpectedImplementationHeadSha) -AllowFailure
    Assert-Condition ($ancestor.ExitCode -eq 0) 'B must be an ancestor of H.'
    $mergeBase = (Invoke-Git -WorkingDirectory $repository -Arguments @('merge-base', $ExpectedBaseSha, $ExpectedImplementationHeadSha)).Output[0]
    Assert-Condition ($mergeBase -ieq $ExpectedBaseSha) 'merge-base B H must equal B.'

    $delta = @((Invoke-Git -WorkingDirectory $repository -Arguments @('diff', '--name-status', "$ExpectedImplementationHeadSha..$headSha", '--')).Output)
    $expectedDelta = "A`t$script:FixedArtifactPath"
    Assert-Condition ($delta.Count -eq 1 -and (Test-OrdinalEqual -Actual $delta[0] -Expected $expectedDelta)) "H..H2 must add only $script:FixedArtifactPath; observed: $($delta -join ', ')."

    $absentAtH = Invoke-Git -WorkingDirectory $repository -Arguments @('cat-file', '-e', "${ExpectedImplementationHeadSha}:$script:FixedArtifactPath") -AllowFailure
    Assert-Condition ($absentAtH.ExitCode -ne 0) 'The finalization artifact must be absent at H.'
    $presentAtH2 = Invoke-Git -WorkingDirectory $repository -Arguments @('cat-file', '-e', "${headSha}:$script:FixedArtifactPath") -AllowFailure
    Assert-Condition ($presentAtH2.ExitCode -eq 0) 'The finalization artifact must be present at H2.'

    $rangeCheck = Invoke-Git -WorkingDirectory $repository -Arguments @('diff', '--check', "$ExpectedImplementationHeadSha..$headSha", '--') -AllowFailure
    Assert-Condition ($rangeCheck.ExitCode -eq 0 -and $rangeCheck.Output.Count -eq 0) "git diff --check H..H2 failed: $($rangeCheck.Output -join ', ')."

    $artifactFullPath = Join-Path $repository ($script:FixedArtifactPath.Replace('/', [IO.Path]::DirectorySeparatorChar))
    Assert-Condition (Test-Path -LiteralPath $artifactFullPath -PathType Leaf) 'The fixed finalization artifact does not exist at H2.'
    $artifactDocument = Read-ArtifactJson -Path $artifactFullPath
    Assert-Condition ($artifactDocument.Text.IndexOf($headSha, [StringComparison]::OrdinalIgnoreCase) -lt 0) 'The artifact must not embed the literal resolved H2 SHA; use SELF/HEAD and report the SHA externally.'

    $schemaResult = Assert-ArtifactSchema -Artifact $artifactDocument.Json -Repository $repository -HeadSha $headSha -BaseSha $ExpectedBaseSha -ImplementationSha $ExpectedImplementationHeadSha

    $result = [ordered]@{
        result = 'passed'
        artifact_path = $script:FixedArtifactPath
        base_sha = $ExpectedBaseSha.ToLowerInvariant()
        merge_base_sha = $mergeBase.ToLowerInvariant()
        implementation_head_sha = $ExpectedImplementationHeadSha.ToLowerInvariant()
        finalization_head_sha = $headSha.ToLowerInvariant()
        direct_parent_sha = $actualParent.ToLowerInvariant()
        direct_parent_proven = $true
        base_ancestor_of_h_proven = $true
        allowed_delta = @([ordered]@{ status = 'A'; path = $script:FixedArtifactPath })
        artifact_absent_at_h = $true
        artifact_present_at_h2 = $true
        explicit_range_diff_check = [ordered]@{ range = "$ExpectedImplementationHeadSha..$headSha"; status = 'passed' }
        canonical_h_check_count = $schemaResult.HCheckIds.Count
        canonical_h2_check_count = $schemaResult.H2CheckIds.Count
        template_blob_sha = $schemaResult.TemplateBlobSha
        readiness = 'pending_h2_checks'
        resolved_h2_evidence_location = 'external-final-report'
    }

    [Console]::Out.WriteLine(($result | ConvertTo-Json -Depth 10 -Compress))
}
catch {
    $failure = [ordered]@{
        result = 'failed'
        error = $_.Exception.Message
        artifact_path = $script:FixedArtifactPath
    }
    [Console]::Out.WriteLine(($failure | ConvertTo-Json -Depth 6 -Compress))
    exit 1
}
