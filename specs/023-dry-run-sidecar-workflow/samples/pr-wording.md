# PR Wording and Target Evidence

## Sidecar Child PR Sample

**Title**: `[DRY-9902] Child routing fixture`

**Target branch**: `sidecar/9901-coordinator-controlled-workflow-dry-run`

**Source branch**: `sidecar/9902-child-routing-fixture`

```md
Related to DRY-9902
Related to DRY-9901

Adds the child routing fixture evidence for the controlled sidecar dry-run.

Changes:
- Records routing fixture scope and validation evidence.
- Keeps child work targeted at the coordinator branch.

Validation:
- `Get-Content -Raw specs/023-dry-run-sidecar-workflow/samples/routing-outcomes.md`
```

Status: passed. The child PR targets the coordinator branch and uses
`Related to` issue references only. It contains no issue-closing wording.

## Final Coordinator PR Sample

**Title**: `[DRY-9901] Controlled sidecar coordinator dry-run`

**Target branch**: `main`

**Source branch**: `sidecar/9901-coordinator-controlled-workflow-dry-run`

```md
Closes DRY-9901
Closes DRY-9902
Closes DRY-9903
Closes DRY-9904

Adds the integrated controlled sidecar coordinator dry-run evidence.

Changes:
- Integrates sidecar child fixture evidence.
- Records coordinator validation and readiness status.

Validation:
- `git diff --check`
```

Status: passed. The final coordinator PR targets `main` and is the only
sidecar PR sample that may use closing wording for the coordinator set.

## Closed-child Coordinator Final-pass PR Sample

**Title**: `[DRY-9908] Closed-child coordinator final pass`

**Target branch**: `main`

**Source branch**: `chore/9908-closed-child-coordinator-final-pass`

```md
Closes DRY-9908

Adds the coordinator final-pass validation result after all listed child issues
were already closed.

Changes:
- Verifies preserved coordinator scope.
- Records that closed child scope was not reimplemented.

Validation:
- `git diff --check`
```

Status: passed. This sample uses normal sequential PR behavior and does not use
the sidecar child/final PR model.
