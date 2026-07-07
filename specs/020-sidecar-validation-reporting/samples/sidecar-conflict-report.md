# Sample Report: Sidecar Conflict

Child issue: #233
Coordinator issue: #220
Child PR readiness: draft

## Conflict

Non-trivial conflict: child #233 changes the sidecar handoff contract while
child #231 defines validation status reporting against the previous contract.

Affected surfaces:

- contract;
- scope;
- UX;
- domain behavior: not affected;
- persistence: not affected;
- security: not affected;
- authorization: not affected.

## Validation Evidence

| Evidence | Status | Notes |
|----------|--------|-------|
| Shared contract review | failed | Two child artifacts define incompatible required handoff fields. |
| Source-map review | passed | Conflict is limited to sidecar workflow artifacts. |

## Required User Guidance

Decide which handoff contract fields are authoritative before either affected
child continues. Codex must not silently choose between incompatible contracts.

## Summary

Because the conflict affects contract, scope and UX-facing workflow handoff
behavior, affected sidecar work stops for user guidance.
