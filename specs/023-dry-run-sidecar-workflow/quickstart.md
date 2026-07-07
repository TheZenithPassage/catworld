# Quickstart

## Prerequisites

- Work from `chore/234-dry-run-sidecar-coordinator-workflow`.
- Do not create or mutate GitHub issues, post public comments, delete remote
  branches, prune remotes, rebase, force-push, or perform history rewriting.
- Treat #220-#234 as sequential-only for routing.

## Validation Steps

1. Review source-of-truth workflow files:

   ```powershell
   Get-Content -Raw AGENTS.md
   Get-Content -Raw .agents/skills/catworld-implement-issue/SKILL.md
   Get-Content -Raw .agents/skills/catworld-parallel-coordinator/SKILL.md
   Get-Content -Raw .agents/skills/catworld-parallel-child-implementation/SKILL.md
   Get-Content -Raw docs/ARCHITECTURE.md
   ```

   Expected: routing and sidecar guardrails match issue #234 and preserve the
   normal sequential workflow.

2. Review dry-run evidence artifacts:

   ```powershell
   Get-Content -Raw specs/023-dry-run-sidecar-workflow/dry-run-report.md
   Get-Content -Raw specs/023-dry-run-sidecar-workflow/samples/routing-outcomes.md
   Get-Content -Raw specs/023-dry-run-sidecar-workflow/samples/sidecar-artifact-map.md
   Get-Content -Raw specs/023-dry-run-sidecar-workflow/samples/child-handoff.md
   Get-Content -Raw specs/023-dry-run-sidecar-workflow/samples/pr-wording.md
   Get-Content -Raw specs/023-dry-run-sidecar-workflow/samples/validation-reporting.md
   Get-Content -Raw specs/023-dry-run-sidecar-workflow/samples/git-merge-simulation.md
   ```

   Expected: all five routing outcomes and all issue #234 guardrails are
   recorded with explicit statuses.

3. Run focused text checks:

   ```powershell
   rg -n "parallel-ready|force-push|rebase|history-rewriting|Related to|Closes|seed|foundation|shared-contract|human-only|normal merge|main" .agents/skills docs/ARCHITECTURE.md specs/023-dry-run-sidecar-workflow
   ```

   Expected: matches support the approved guardrails; child PR samples use
   `Related to` only, final coordinator samples may use closing wording, and no
   required `parallel-ready` label appears.

4. Verify the normal sequential implementation skill remains unchanged:

   ```powershell
   git diff -- .agents/skills/catworld-implement-issue/SKILL.md
   ```

   Expected: no diff unless a separately approved correction is explicitly
   documented.

5. Run the temporary Git merge simulation or review its recorded transcript:

   ```powershell
   Get-Content -Raw specs/023-dry-run-sidecar-workflow/samples/git-merge-simulation.md
   ```

   Expected: active sidecar child branch refresh uses normal merge from the
   coordinator branch only; no rebase, force-push, or history rewriting.

6. Run whitespace validation:

   ```powershell
   git diff --check
   ```

   Expected: no whitespace errors.

7. Review changed-file scope:

   ```powershell
   git status --short
   git diff --name-only
   ```

   Expected: changes are limited to the active feature artifacts and any
   explicitly justified workflow-source corrections.

## Freshness Rule

Rerun affected checks after any late edits to workflow source files or dry-run
evidence. If a check cannot be rerun, report it as `stale` or `not run`, not as
passed.
