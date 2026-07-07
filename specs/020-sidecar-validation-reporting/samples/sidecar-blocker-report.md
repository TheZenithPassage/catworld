# Sample Report: Sidecar Blockers

Coordinator issue: #220
Affected children: #231, #232
Coordinator readiness: blocked

## Blocker Table

| Blocker Type | Affected Scope | Status | Required Next Step |
|--------------|----------------|--------|--------------------|
| Child-specific blocker | Child #231 | open | Rerun failed validation after correcting sidecar report wording. |
| Coordinator-wide blocker | Coordinator branch | open | Resolve stale integrated validation after a child PR merge. |
| Shared-contract blocker | Children #231 and #232 | open | User or coordinator must clarify the shared validation status vocabulary before affected children continue. |

## Validation Evidence

| Evidence | Status | Notes |
|----------|--------|-------|
| Review child-specific blocker handling | passed | Report isolates the child #231 blocker. |
| Review coordinator-wide blocker handling | passed | Coordinator readiness is blocked by stale integrated validation. |
| Review shared-contract blocker handling | passed | Affected child work stops until the shared contract is clarified. |

## Summary

The child-specific blocker does not automatically block unrelated children.
The coordinator-wide and shared-contract blockers stop affected sidecar work
until resolved or user guidance is provided.
