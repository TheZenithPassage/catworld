# Quickstart: Sidecar Coordinator Artifacts

Use this guide to validate issue #252 after implementation. Rerun affected
checks after any later edit to sidecar workflow text, artifact contract text,
or validation simulations. If a check is not rerun after relevant changes,
report it as `not revalidated` rather than passed.

## Prerequisites

- Current branch:
  `chore/252-generate-real-sidecar-coordinator-orchestration-artifacts`.
- Base branch for this build-out PR: `workflow/sidecar-buildout`.
- No GitHub issue mutation, public comment, merge, auto-merge, force-push, or
  remote cleanup is performed by these checks.

## Validation Steps

1. Simulate a valid coordinator with at least three child issues and inspect
   artifact path and required content:

   ```powershell
   powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario valid
   ```

   Expected: output records
   `specs/<coordinator-number>-coordinator-<slug>/` and all required
   coordinator artifact sections.

2. Simulate planning while the active checkout is `main`:

   ```powershell
   powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario plan-on-main
   ```

   Expected: output reports planning-only status and zero written files.

3. Simulate writing only after entering a coordinator branch/worktree:

   ```powershell
   powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario write-after-branch
   ```

   Expected: output reports a non-main coordinator branch/worktree context and
   one written coordinator artifact.

4. Simulate existing same-number artifact handling:

   ```powershell
   powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario existing-artifact
   ```

   Expected: output includes both safe same-run resume and collision stop
   results.

5. Simulate a blocked coordinator:

   ```powershell
   powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario blocked
   ```

   Expected: output records the blocker and reports child work launched as
   `False`.

6. Verify local `main` cleanliness after planning:

   ```powershell
   powershell -ExecutionPolicy Bypass -File specs/026-sidecar-coordinator-artifacts/validation/simulate-coordinator-artifact.ps1 -Scenario main-cleanliness
   ```

   Expected: output reports no sidecar artifacts, commits, or untracked files
   on the temporary `main` branch.

7. Verify changed Markdown has no whitespace errors:

   ```powershell
   git diff --check
   ```

   Expected: no output and exit code 0.
