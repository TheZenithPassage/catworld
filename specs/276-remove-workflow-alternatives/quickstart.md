# Quickstart: Validate the Minimal Workflow Closure

## Prerequisites

- Checkout `chore/302-remove-alternate-implementation-workflows`.
- Run from the CatWorld repository root with Git, PowerShell 7, and ripgrep available.
- Complete implementation before collecting final evidence; rerun every affected check after any relevant late change or report it as not revalidated.

## 1. Check patch integrity and changed paths

```powershell
git diff --check
git diff --name-only
git status --short
```

Expected: no whitespace errors; every changed or deleted path belongs to the source map in `plan.md`; the only added feature-artifact tree is `specs/276-remove-workflow-alternatives`.

## 2. Verify the exact retained skill set

```powershell
Get-ChildItem -LiteralPath '.agents/skills' -Directory |
  Sort-Object Name |
  Select-Object -ExpandProperty Name
```

Expected, and nothing else:

```text
catworld-implement-issue
speckit-analyze
speckit-converge
speckit-implement
speckit-plan
speckit-specify
speckit-tasks
```

## 3. Verify every exact deletion target

```powershell
$deletedPaths = @(
  '.agents/skills/speckit-agent-context-update',
  '.agents/skills/speckit-clarify',
  '.agents/skills/speckit-checklist',
  '.agents/skills/speckit-constitution',
  '.agents/skills/speckit-taskstoissues',
  '.specify/workflows',
  '.specify/extensions.yml',
  '.specify/extensions',
  '.specify/scripts/powershell/create-new-feature.ps1',
  '.specify/templates/checklist-template.md',
  '.specify/templates/constitution-template.md',
  '.agents/skills/catworld-orchestrate-coordinator-issue',
  '.agents/skills/catworld-parallel-coordinator',
  '.agents/skills/catworld-parallel-child-implementation',
  '.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md',
  '.github/ISSUE_TEMPLATE/focused-child-issue.md',
  '.github/PULL_REQUEST_TEMPLATE/README.md',
  '.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md',
  '.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md',
  'specs/008-coordinator-orchestration-skill',
  'specs/011-dual-workflow-routing',
  'specs/012-coordinator-child-templates',
  'specs/013-pr-description-templates',
  'specs/014-sidecar-artifact-paths',
  'specs/015-sidecar-coordinator-parallel-entrypoint',
  'specs/016-sidecar-artifact-preparation',
  'specs/017-sidecar-child-implementation',
  'specs/018-sidecar-git-rules',
  'specs/019-sidecar-pr-rules',
  'specs/020-sidecar-validation-reporting',
  'specs/021-sidecar-resume-state',
  'specs/022-split-handoff-alignment',
  'specs/023-dry-run-sidecar-workflow',
  'specs/024-dormant-coordinator-routing',
  'specs/025-sidecar-run-lifecycle',
  'specs/026-sidecar-coordinator-artifacts',
  'specs/027-prepared-child-artifacts',
  'specs/028-sidecar-branch-worktree',
  'specs/029-dependency-layer-fanout',
  'specs/030-sidecar-child-execution',
  'specs/031-merge-aware-sidecar-resume',
  'specs/032-final-coordinator-delivery',
  'specs/033-sidecar-local-cleanup',
  'specs/034-live-sidecar-dry-run',
  'specs/035-activate-sidecar-routing',
  'specs/148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays',
  'specs/272-coordinator-260-live-sidecar-fixture',
  'specs/273-260-fixture-layer1-a',
  'specs/274-260-fixture-layer1-b',
  'specs/275-260-fixture-layer2-summary'
)
$remainingPaths = $deletedPaths | Where-Object { Test-Path -LiteralPath $_ }
if ($remainingPaths) {
  throw "Deletion targets still present: $($remainingPaths -join ', ')"
}
```

Expected: no exception. Use only these literal paths; never use a numeric-prefix wildcard. Confirm the collision-sensitive and product spec paths still exist:

```powershell
@(
  'specs/008-creator-attribution',
  'specs/196-block-cat-deletion-when-stay-history-exists',
  'specs/197-block-owner-deletion-while-cats-or-stays-reference-it',
  'specs/198-block-vet-deletion-while-cats-reference-it',
  'specs/276-remove-workflow-alternatives'
) | ForEach-Object {
  if (-not (Test-Path -LiteralPath $_ -PathType Container)) {
    throw "Required retained directory missing: $_"
  }
}
```

## 4. Search for removed workflow references

```powershell
rg --hidden -n -i 'sidecar|catworld-parallel|catworld-orchestrate-coordinator|routing-authorized|held-dispatch|parallel mode|coordinator issue|coordinator/child' --glob '!.git/**' .
```

Review every result. Expected: no retained active instruction, skill, template, extension, registry, or architecture source refers to a deleted workflow. Historical wording in explicitly retained product specs is acceptable only after individual classification.

Also verify deleted hook and template-composition surfaces are not referenced by retained support:

```powershell
rg --hidden -n -i 'extensions\.yml|\.specify/extensions|preset templates|extension templates|speckit-agent-context|speckit-clarify' AGENTS.md .agents/skills .specify/scripts .specify/integrations
```

Expected: no matches.

## 5. Verify manifest targets and hashes

```powershell
$manifestPaths = Get-ChildItem -LiteralPath '.specify/integrations' -Filter '*.manifest.json' -File
foreach ($manifestPath in $manifestPaths) {
  $manifest = Get-Content -Raw -LiteralPath $manifestPath.FullName | ConvertFrom-Json
  foreach ($entry in $manifest.files.PSObject.Properties) {
    if (-not (Test-Path -LiteralPath $entry.Name -PathType Leaf)) {
      throw "Missing manifest target: $($entry.Name)"
    }
    $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $entry.Name).Hash.ToLowerInvariant()
    if ($actualHash -ne $entry.Value) {
      throw "Hash mismatch for $($entry.Name)"
    }
  }
}
```

Expected: no missing target or hash mismatch. The Codex manifest contains six skills; the Spec Kit manifest contains four scripts and three templates.

## 6. Smoke-test retained setup support

```powershell
& '.specify/scripts/powershell/check-prerequisites.ps1' -Json
& '.specify/scripts/powershell/setup-plan.ps1' -Json
& '.specify/scripts/powershell/setup-tasks.ps1' -Json
```

Expected: each exits successfully, resolves the active `specs/276-remove-workflow-alternatives` feature, and uses retained core files only. Because setup commands can refresh generated artifact templates, review `git status --short` afterward and rerun affected validation if they change content.

## 7. Verify protected surfaces

Review `git diff --name-only` and reject any change under application source, product-behavior tests, migrations, dependency files, or either protected CI workflow. Specifically confirm no diff for:

```powershell
git diff -- .github/workflows/backend-ci.yml .github/workflows/frontend-ci.yml pom.xml frontend/package.json frontend/package-lock.json src frontend/src
```

Expected: no output. Inspect the `docs/ARCHITECTURE.md` diff separately to confirm only the complete `## Codex Workflow Routing` block was removed and `## Diagrams` plus later product documentation remains.

## 8. Revalidate the committed branch

After commit, compare the delivered branch to `origin/main`:

```powershell
git diff origin/main...HEAD --check
git diff --name-only origin/main...HEAD
git status --short
```

Expected: the committed comparison has no whitespace error or protected path, and the working tree is clean. Evidence gathered before a relevant later edit is stale and must not be reported as passed.
