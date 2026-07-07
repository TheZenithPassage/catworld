# Dry-run Evidence Contract

Dry-run evidence for issue #234 is stored under
`specs/023-dry-run-sidecar-workflow/` and must follow this contract.

## Required Sections

Every top-level dry-run report must include:

- issue and source references;
- live issue limitations and fixture issue numbers;
- five routing outcomes required by issue #234;
- generated or expected artifact paths;
- generated or expected branch names and checkout/worktree state;
- PR target expectations and issue-reference wording;
- validation reporting and freshness evidence;
- cleanup eligibility and GitHub mutation approval evidence;
- blocker, conflict, and human-only blocker evidence;
- follow-up corrections or adoption gaps;
- explicit statement that user review decides readiness.

## Status Vocabulary

Each evidence row must use one of these statuses:

- `passed`
- `rejected as expected`
- `blocked`
- `failed`
- `skipped`
- `timed out`
- `interrupted`
- `partial`
- `stale`
- `not run`

Non-passed evidence must not be summarized as passed.

## Fixture Rules

Local fixture issues must:

- use issue-number-shaped identifiers that cannot be confused with real
  CatWorld GitHub issues;
- state their classification and expected routing behavior;
- avoid CatWorld product implementation scope;
- avoid GitHub issue mutation, public comments, branch deletion, remote
  pruning, rebase, force-push, and history rewriting.

## Adoption Rule

The dry-run may record an adoption recommendation or blocker state, but it must
not mark the sidecar workflow adopted or default. The user must review the
result and mark the sidecar workflow ready or not ready.
