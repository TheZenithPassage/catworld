# Quickstart: Split Handoff Alignment Validation

## Prerequisites

- Active branch: `chore/233-align-explicit-issue-split-handoff`
- Feature directory: `specs/022-split-handoff-alignment`
- No real GitHub product issue creation is required for validation.

## Validation Steps

1. Verify the explicit split handoff instructions contain the sidecar coordinator contract:

   ```powershell
   rg -n "Explicit Issue-Split Handoff|Preserved scope|Child issues|Execution model|parallel-ready|normal sequential workflow|closed child issue scope" .agents/skills/speckit-taskstoissues/SKILL.md
   ```

   Expected: matches show opt-in split handoff guidance, required coordinator sections, no-label routing, child sequential implementation, and closed-child final-pass constraints.

2. Verify the local sample split rewrite:

   ```powershell
   rg -n "## Goal|## Preserved scope|## Child issues|## Dependencies|## Execution model|## Validation|## Out of scope|## Parent coordinator|Related to" specs/022-split-handoff-alignment/samples/sample-split-handoff.md
   ```

   Expected: the sample includes coordinator and child issue bodies with the required sections and optional PR wording guidance.

3. Confirm `catworld-implement-issue` was not changed:

   ```powershell
   git diff -- .agents/skills/catworld-implement-issue/SKILL.md
   ```

   Expected: no diff output.

4. Manually review the changed skill and sample against:

   - Issue #220 routing contract.
   - Issue #221 guardrails.
   - Issue #222 dual workflow routing.
   - `specs/012-coordinator-child-templates/contracts/issue-template-contract.md`.
   - `specs/013-pr-description-templates/contracts/pr-template-contract.md`.

   Expected: the split handoff is opt-in, sidecar-compatible, preserves product scope, keeps direct child sequential implementation valid, and does not change normal implementation or planning.

Validation must be rerun after relevant late changes, or reported as not revalidated rather than passed.
