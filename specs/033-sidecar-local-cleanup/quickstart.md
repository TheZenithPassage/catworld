# Quickstart: Validate Sidecar Local Cleanup

## Prerequisites

- Run from the CatWorld repository root.
- Git must be available.
- Windows PowerShell 5.1 or PowerShell 7 may execute the script.
- Validation uses only temporary repositories and must not target real sidecar resources.

## Focused validation

Run the single table-driven harness:

```powershell
powershell -ExecutionPolicy Bypass -File .\specs\033-sidecar-local-cleanup\validation\simulate-sidecar-cleanup.ps1
```

Expected cases:

1. cleanup blocked before final merge;
2. cleanup eligible after final merge;
3. dirty worktree blocks cleanup;
4. unknown ownership blocks cleanup;
5. successful worktree-then-branch cleanup;
6. partial failure is recorded truthfully;
7. prohibited remote and GitHub operations are absent.

The command must exit zero and report every case as passed. It must use one shared temporary-Git fixture and must not create or mutate a real branch, worktree, PR, issue, comment, or remote ref.

## Scope and whitespace checks

```powershell
git diff --check
git status --short
git diff --name-only
```

Confirm that:

- only the planned coordinator skill, architecture document, and `specs/033-sidecar-local-cleanup/` feature artifacts changed;
- `specs/032-final-coordinator-delivery/finalization.md` did not change;
- no second validation script or #260 end-to-end coverage was added;
- the temporary managed `AGENTS.md` plan pointer is restored before delivery.

Rerun the focused harness and `git diff --check` after any later change affecting coordinator cleanup instructions, the journal contract, or validation logic. Evidence not rerun after such a change must be reported as stale or not revalidated.
