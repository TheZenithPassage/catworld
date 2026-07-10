# Quickstart: Sidecar Child Execution and PR Delivery

## Prerequisites

- Work from the issue branch for #256.
- Do not mutate GitHub issues, labels, comments, milestones, or assignees.
- Do not create real sidecar child PRs as validation fixtures.
- Keep `.agents/skills/catworld-implement-issue/SKILL.md` unchanged.

## Validation Commands

Implemented validation scenarios:

- `valid-handoff`
- `missing-context`
- `wrong-checkout`
- `wrong-branch`
- `missing-delivery-permission`
- `delivery-denied`
- `pr-wording`
- `pr-target`
- `readiness`
- `final-report`
- `prohibited-operations`

Run the controlled sample child handoff execution:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario valid-handoff
```

Expected outcome: the fixture confirms exactly one child issue, expected child
checkout and branch, prepared artifacts, task-only execution, coordinator PR
target, related-only issue references, and ready status with fresh passed
validation.

Verify missing prepared context blocks execution:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario missing-context
```

Expected outcome: missing prepared artifacts, shared contract, or validation
requirements block execution without regenerating Spec Kit artifacts.

Verify wrong checkout blocks execution:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario wrong-checkout
```

Expected outcome: checkout/worktree mismatch blocks execution while the branch
still matches, proving checkout validation is independent.

Verify wrong branch blocks execution:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario wrong-branch
```

Expected outcome: checkout/worktree still matches, but branch mismatch blocks
execution before prepared tasks run, leaves no changed files, and performs no
commit, push, PR, issue mutation, or fallback behavior.

Verify missing delivery permission blocks execution:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario missing-delivery-permission
```

Expected outcome: a handoff without delivery permission is incomplete, blocks
before prepared tasks run, leaves no changed files, and performs no commit,
push, PR, issue mutation, or fallback behavior.

Verify delivery denied prevents PR delivery side effects:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario delivery-denied
```

Expected outcome: prepared task execution completes, but delivery permission is
false, so no commit, push, PR open/update, issue mutation, or fallback workflow
is attempted and the result reports that delivery was not permitted.

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

Verify final report fields:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario final-report
```

Expected outcome: the sample final report includes changed files, validation
statuses, PR URL, readiness, blockers, risks, branches, commit hashes, and
current checkout state.

Verify prohibited operations stay blocked:

```powershell
.\specs\030-sidecar-child-execution\validation\simulate-sidecar-child-execution.ps1 -Scenario prohibited-operations
```

Expected outcome: merge, approve, auto-merge, issue mutation, public comments,
remote branch deletion, rebase, force-push, and local sidecar cleanup remain
prohibited.

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
