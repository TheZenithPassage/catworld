# Sample Report: Sidecar Failure

Child issue: #231
Coordinator issue: #220
Child PR readiness: draft

## Validation Evidence

| Evidence | Status | Notes |
|----------|--------|-------|
| `Select-String` review for stale-validation wording | failed | Required stale-validation wording was missing from the child reporting section. |
| Manual review against issue #220 routing guardrails | passed | Sidecar-only routing remained intact. |
| `git diff --check` | not run | Not run because the stale-validation wording failure must be fixed first. |

## Freshness

The passed manual review is fresh. The failed text review is fresh. The
whitespace check is not run.

## Blockers

Child-specific blocker: the child reporting text does not yet define stale
validation handling.

## Summary

Validation is failed and one required command is not run. This report must not
summarize validation as passed. The sidecar child PR is draft until the missing
wording is fixed and affected validation is rerun.
