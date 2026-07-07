# Data Model

This feature introduces no CatWorld runtime domain entities, persistence model,
API payloads, schema changes, browser storage, or external service contracts.
It records local workflow evidence as Markdown artifacts only.

## Dry-run Evidence Records

### Dry-run Result

- **Purpose**: Top-level adoption-gate evidence for issue #234.
- **Fields**: active issue, fixture issue numbers, source references, routing
  outcomes, artifact paths, branch names, PR target expectations, validation
  statuses, blockers, follow-up corrections, adoption recommendation.
- **Validation rules**: Must distinguish passed, rejected, blocked, skipped,
  stale, and not-run evidence. Must not declare adoption readiness; user review
  makes that decision.

### Fixture Issue

- **Purpose**: Local stand-in for a low-risk coordinator, child, or normal
  issue when live GitHub issue mutation is not approved.
- **Fields**: fixture issue number, title, classification, child references,
  state, source notes, expected routing behavior.
- **Validation rules**: Must be clearly marked as local dry-run fixture data,
  not real GitHub product work.

### Routing Outcome

- **Purpose**: Evidence for one required routing scenario from issue #234.
- **Fields**: scenario, issue fixture or real issue, input prompt shape,
  expected route, observed or reviewed behavior, status, source references.
- **Validation rules**: Must include all five required routing outcomes.

### Operational Guardrail Evidence

- **Purpose**: Evidence for sidecar Git, PR, cleanup, mutation, readiness,
  validation, and blocker rules.
- **Fields**: guardrail, expected behavior, evidence source, validation status,
  blocker or correction when applicable.
- **Validation rules**: Must identify disallowed operations and confirm they
  were not performed.
