# Quickstart: Sidecar Coordinator Parallel Entrypoint

## Prerequisites

- Work from `chore/226-add-sidecar-coordinator-parallel-skill-entrypoint`.
- Do not run sidecar child implementation, branch/worktree orchestration, PR
  creation, or GitHub issue mutation for this feature.
- Re-run these checks after any relevant skill, documentation, or feature
  artifact edit.

## Routing Examples

Review `.agents/skills/catworld-parallel-coordinator/SKILL.md` and confirm
these examples have the expected outcomes:

| Example Prompt | Expected Outcome |
|----------------|------------------|
| `<future-coordinator-issue> parallel` after sidecar routing guardrails allow adoption | Sidecar coordinator preflight only, because the issue is a coordinator issue and `parallel` is explicit. |
| `226 parallel` | Routing error because #226 is a direct child/workflow issue, not a coordinator issue. |
| `220` while any listed child issue is open | Existing guardrail stop for direct coordinator end-to-end request with open child issues. |
| `220` after all listed child issues are closed | Existing sequential end-to-end workflow for a coordinator final pass, not sidecar parallel execution. |

## Local Checks

1. Confirm the new sidecar entrypoint exists:

   ```powershell
   Test-Path .agents/skills/catworld-parallel-coordinator/SKILL.md
   ```

   Expected outcome: `True`.

2. Confirm required routing and preflight language exists:

   ```powershell
   Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'explicit.*parallel','non-coordinator','child issue inspection','dependency classification','source-of-truth','stop before implementation'
   ```

   Expected outcome: matches for all required phrases.

3. Confirm readiness is not label-based:

   ```powershell
   Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'parallel-ready'
   ```

   Expected outcome: any matches reject requiring, inventing, adding, or routing
   based on a required `parallel-ready` label.

4. Confirm existing workflow skill files are unchanged:

   ```powershell
   git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md
   ```

   Expected outcome: no output.

5. Confirm no product code or prohibited side-effect surfaces changed:

   ```powershell
   git diff --name-only
   ```

   Expected outcome: changed paths are limited to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, relevant workflow documentation if updated, and `specs/015-sidecar-coordinator-parallel-entrypoint/`.

6. Check whitespace in changed files:

   ```powershell
   git diff --check
   ```

   Expected outcome: no output and exit code `0`.

## Freshness Rule

Any check affected by later edits must be rerun. If a check cannot be rerun,
report it as `not revalidated` instead of passed.
