# Sample Report: Sidecar Success

Child issue: #231
Coordinator issue: #220
Child PR readiness: ready

## Validation Evidence

| Evidence | Status | Notes |
|----------|--------|-------|
| `Select-String` review for explicit validation statuses | passed | Found `passed`, `failed`, `skipped`, `timed out`, `interrupted`, `partial`, `stale`, and `not run` in sidecar reporting guidance. |
| `Select-String` review for readiness wording | passed | Found ready/draft child PR readiness rules tied to fresh required validation and blockers. |
| Manual review against sidecar PR target rules | passed | Child PR readiness assumes coordinator-branch target and `Related to` wording from issue #230. |

## Freshness

All evidence was collected after the latest sidecar reporting text changes.
No coordinator branch update or child branch refresh occurred after validation.

## Blockers

None.

## Summary

Required validation is fresh and passed, no unresolved blocker affects this
child, and the approved sidecar PR target rules are satisfied. The sidecar child
PR may be reported ready.
