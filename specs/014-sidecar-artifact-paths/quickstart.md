# Quickstart: Sidecar Artifact Paths

## Prerequisites

- Work from `chore/225-define-sidecar-artifact-paths`.
- Do not create real sidecar coordinator or child artifacts for validation.
- Re-run validation after any workflow documentation or feature artifact wording change.

## Validation Steps

1. Confirm the sidecar artifact path patterns are documented:

   ```powershell
   Select-String -Path docs/ARCHITECTURE.md -Pattern 'specs/<coordinator-number>-coordinator-<slug>','specs/<child-issue-number>-<child-slug>'
   ```

   Expected outcome: matches for both documented path patterns.

2. Confirm the sidecar-only boundary and sequential final-pass boundary are documented:

   ```powershell
   Select-String -Path docs/ARCHITECTURE.md -Pattern 'sidecar coordinator parallel execution','normal sequential Spec Kit behavior','coordinator final pass'
   ```

   Expected outcome: matches state that sidecar artifact paths apply only to
   sidecar coordinator parallel execution, normal sequential Spec Kit behavior
   remains unchanged, and a closed-child coordinator final pass uses the
   existing sequential workflow without requiring sidecar artifact naming.

3. Simulate one coordinator and three child artifact paths:

   ```powershell
   $paths = @(
     'specs/220-coordinator-add-opt-in-codex-coordinator-parallel-workflow',
     'specs/225-define-issue-numbered-artifact-paths-for-sidecar-parallel-work',
     'specs/226-add-sidecar-coordinator-entrypoint',
     'specs/227-prepare-sidecar-artifacts'
   )
   $paths
   ($paths | Sort-Object -Unique).Count -eq $paths.Count
   ```

   Expected outcome: the four paths print, and the uniqueness check prints
   `True`.

4. Simulate repeated-run collision detection without creating artifacts:

   ```powershell
   $paths = @(
     'specs/220-coordinator-add-opt-in-codex-coordinator-parallel-workflow',
     'specs/225-define-issue-numbered-artifact-paths-for-sidecar-parallel-work',
     'specs/226-add-sidecar-coordinator-entrypoint',
     'specs/227-prepare-sidecar-artifacts'
   )
   $existingPaths = @(
     'specs/220-coordinator-add-opt-in-codex-coordinator-parallel-workflow',
     'specs/226-add-sidecar-coordinator-entrypoint'
   )
   $collisions = $paths | Where-Object { $existingPaths -contains $_ }
   $collisions
   if ($collisions) { 'STOP: existing sidecar artifact path detected' } else { 'OK' }
   ```

   Expected outcome: the simulated existing paths print, followed by
   `STOP: existing sidecar artifact path detected`.

5. Simulate duplicate child issue number detection:

   ```powershell
   $childIssueNumbers = @(225, 226, 226)
   $duplicates = $childIssueNumbers | Group-Object | Where-Object Count -gt 1
   $duplicates.Name
   if ($duplicates) { 'STOP: duplicate child issue number detected' } else { 'OK' }
   ```

   Expected outcome: `226` prints, followed by
   `STOP: duplicate child issue number detected`.

6. Review the workflow documentation against issues #220, #221, #222, and #225.

   Expected outcome: sidecar artifact naming is documented only for future
   sidecar coordinator parallel execution; normal sequential issue
   implementation remains unaffected; closed-child coordinator final pass
   remains outside sidecar artifact naming unless the sequential workflow
   creates artifacts on its own terms.

7. Confirm changed text has no whitespace errors:

   ```powershell
   git diff --check
   ```

   Expected outcome: command exits successfully with no output.
