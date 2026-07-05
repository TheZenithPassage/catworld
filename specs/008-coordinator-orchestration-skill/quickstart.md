# Quickstart

This guide validates issue #202 as a documentation/workflow-only change. Rerun
these checks after any relevant late edits, or report earlier evidence as stale
instead of passed.

## Prerequisites

- Work from `chore/202-add-coordinator-issue-orchestration-skill`.
- Keep the change limited to the new coordinator skill, targeted workflow
  instruction updates, and this feature's Spec Kit artifacts.

## Manual Workflow Review

Review `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`,
`AGENTS.md`, and `.agents/skills/catworld-implement-issue/SKILL.md` against
these scenarios:

| Scenario | Expected Result |
|----------|-----------------|
| Coordinator issue with one hard dependency | Sequential mode selects only the first ready child, delegates it to the single-issue skill, opens or updates one child PR, and stops when human merge into `main` is required before dependent work continues. |
| Coordinator issue with four independent child issues | Sequential mode remains safe by default; explicitly selected parallel mode may run only independent or dependency-ready children in isolated environments, with one child issue per sub-agent. |
| Coordinator issue where one child should establish a shared pattern first | The workflow prevents blind parallelization and requires seed-first, sequential, or stop behavior unless the shared decision is already resolved by approved context or current sources of truth. |
| Parallel mode selected without isolated execution | The workflow stops and reports that parallel execution cannot run safely. |
| Normal single issue | The existing `.agents/skills/catworld-implement-issue/SKILL.md` remains the end-to-end implementation path. |

## Safety Review

Confirm no changed instruction allows:

- direct commits to `main`;
- local merges into `main`;
- direct pushes to `main`;
- PR merge;
- auto-merge;
- force-push without explicit user request;
- branch cleanup;
- branch deletion;
- remote pruning;
- public GitHub comments;
- unapproved GitHub issue mutation;
- sub-agents guessing unresolved decisions;
- blind parallelization of hard-dependent child issues.

## Command Validation

Run:

```bash
git diff --check
```

Expected result: no output and exit code `0`.

Backend and frontend application suites are not required for this feature unless
application files are unexpectedly changed.
