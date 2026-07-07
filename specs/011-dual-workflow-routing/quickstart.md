# Quickstart: Dual Workflow Routing Documentation

## Prerequisites

- Work from branch `docs/222-document-dual-workflow-routing`.
- Keep the implementation scoped to workflow documentation and Spec Kit artifacts.

## Validation

1. Review the changed workflow documentation against issue #220.
   - Expected: The sequential workflow remains the default for normal issues and direct child issues.
   - Expected: Sidecar coordinator parallel execution is opt-in only and not described as a replacement.
   - Expected: Closed-sub-issue coordinator finalization enters the existing sequential workflow and is not a separate workflow.

2. Review the changed workflow documentation against issue #221.
   - Expected: The documentation preserves the routing guardrails already added to `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md`.
   - Expected: No instruction routes issues #220 through #234 through parallel mode.

3. Review the changed workflow documentation against issue #222.
   - Expected: Every scope bullet in #222 is represented.
   - Expected: The documentation does not describe CatWorld product behavior as changed.
   - Expected: The final diff does not edit existing implementation skills.
   - Expected: Parallel readiness is documented as coming from coordinator preflight, child issue inspection, dependency classification and source-of-truth review.
   - Expected: The documentation does not require or invent a `parallel-ready` label; labels may be metadata later but are not the source of truth for parallel safety.

4. Run:

   ```powershell
   git diff --check
   ```

   Expected: no whitespace errors.

5. Run:

   ```powershell
   git diff --name-only
   ```

   Expected: changed paths are limited to the issue #222 documentation update and Spec Kit artifacts, aside from temporary active-plan context that must be restored before final delivery.

Validation must be rerun after relevant late changes or reported as not revalidated.
