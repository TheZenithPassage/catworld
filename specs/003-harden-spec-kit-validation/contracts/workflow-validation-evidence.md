# Workflow Validation Evidence Contract

This contract describes the evidence future Spec Kit artifacts must request when a feature changes observable or correctness-sensitive behavior.

## Observable Behavior

- Specs describe visible states, messages, navigation, focus/keyboard behavior, i18n-visible text, responsive/mobile behavior, and edge cases when those surfaces are affected.
- Tasks and analysis require evidence that observes the rendered or externally visible behavior, not only internal component state or mocks.

## Correctness-Sensitive Behavior

- Backend business rules require responsible service/controller evidence.
- API contracts require HTTP/status/payload/serialization/validation evidence at the contract boundary.
- Authorization and role behavior require backend enforcement evidence, plus UI visibility/navigation evidence when the frontend changes.
- Persistence and migrations require Flyway/schema/data-integrity evidence proportional to risk.
- Security behavior requires evidence at the enforcing layer.

## Replacement and Migration Behavior

- Plans record semantic-equivalence review when replacing controls, components, lists/tables, dialogs, overlays, routing, focus, selectors, or presentation mechanisms.
- The review identifies old behavior/source of truth, new semantics, mismatch risks, mitigation, and automated or manual proof.

## Validation Freshness and Scope

- Validation can be reported as passed only when it completed successfully after the latest relevant change.
- Stale, skipped, timed-out, interrupted, partial, failed, and not-revalidated checks are reported explicitly.
- Changed files or surfaces outside the plan/source map are flagged for review or justification.
