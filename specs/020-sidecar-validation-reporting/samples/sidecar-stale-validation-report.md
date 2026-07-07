# Sample Report: Sidecar Stale Validation

Child issue: #232
Coordinator issue: #220
Child PR readiness: draft

## Validation Evidence

| Evidence | Status | Notes |
|----------|--------|-------|
| Child branch validation before coordinator branch update | stale | The coordinator branch changed after this evidence was collected. |
| Normal merge refresh from coordinator branch | passed | Refresh used a normal merge from the coordinator branch. |
| Affected child validation after refresh | not run | Required rerun has not happened yet. |

## Freshness

The pre-refresh validation is stale because it predates the coordinator branch
update and child branch refresh. The refresh evidence is fresh. Affected child
validation must be rerun before readiness can be reported.

## Blockers

Child-specific blocker: required validation is stale/not run after refresh.

## Summary

Stale validation is not treated as passed. The sidecar child PR remains draft
until affected validation is rerun and passes after the latest refresh.
