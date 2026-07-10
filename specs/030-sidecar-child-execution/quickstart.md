# Quickstart: Sidecar Child Execution and PR Delivery

## Prerequisites

- Work from the issue branch for #256.
- Do not mutate GitHub issues, labels, comments, milestones, or assignees.
- Do not create real sidecar child PRs as validation fixtures.
- Keep `.agents/skills/catworld-implement-issue/SKILL.md` unchanged.

## Validation Commands

Run the controlled sample child handoff execution:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario valid-handoff
```

Expected outcome: the fixture confirms exactly one child issue, expected child
checkout and branch, prepared artifacts, task-only execution, coordinator PR
target, related-only issue references, and ready status with fresh passed
validation.

Verify child PR wording:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario pr-wording
```

Expected outcome: generated child PR body uses `Related to #<child-issue>` and
`Related to #<coordinator-issue>` and contains no closing keywords.

Verify coordinator branch target:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario pr-target
```

Expected outcome: valid child delivery targets the coordinator branch, while a
`main` target is rejected.

Verify draft/not-ready behavior for non-passed validation:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario readiness
```

Expected outcome: failed, skipped, timed-out, interrupted, partial, stale,
blocked, and not-run validation states produce draft/not-ready PR status and
are not summarized as passed.

Confirm the normal sequential implementation skill was not modified:

```powershell
git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md
```

Expected outcome: no output.

Run final whitespace validation:

```powershell
git diff --check
```

Expected outcome: no whitespace errors.

Rerun affected validation after relevant late edits to sidecar skill text,
architecture documentation, the #256 contract, or the validation script.
