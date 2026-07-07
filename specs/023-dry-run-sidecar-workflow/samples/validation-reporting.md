# Validation Reporting Evidence

## Status Vocabulary

Sidecar evidence uses explicit statuses:

- `passed`
- `failed`
- `skipped`
- `timed out`
- `interrupted`
- `partial`
- `stale`
- `not run`
- `blocked`
- `rejected as expected`

Failed, timed-out, skipped, interrupted, partial, stale, blocked, and not-run
evidence is never summarized as passed.

## Sample Child Validation Report

| Evidence | Status | Freshness | Readiness Impact |
|----------|--------|-----------|------------------|
| Child fixture artifact review | passed | fresh | Supports ready state. |
| Child PR target review | passed | fresh | Supports ready state. |
| Validation after coordinator branch refresh | stale | stale after coordinator branch changed | Blocks ready state until rerun. |
| Shared-contract check for `DRY-9904` | blocked | current | Blocks `DRY-9904` delegation. |

Child PR readiness: draft while stale or blocked evidence remains.

## Sample Coordinator Validation Report

| Evidence | Status | Freshness | Readiness Impact |
|----------|--------|-----------|------------------|
| Routing matrix | passed | fresh | Supports coordinator review. |
| Artifact path map | passed | fresh | Supports coordinator review. |
| Git normal-merge simulation | passed | fresh | Supports coordinator review. |
| Live controlled coordinator issue | blocked | current limitation | Requires user decision if live evidence is required. |

Coordinator readiness: ready for user review only; not adopted or default.

## Blocker Categories

| Blocker Type | Sample | Required Behavior |
|--------------|--------|-------------------|
| Child-specific | `DRY-9904` missing prepared shared-contract input | Stop affected child only and report required user guidance. |
| Coordinator-wide | Coordinator artifact path collision | Stop coordinator preparation before writing artifacts. |
| Shared-contract | Cross-child contract missing | Stop affected sidecar work; do not invent a new child issue. |
| Conflict | Child scope conflicts with coordinator source-of-truth | Stop for user guidance. |
| Human-only | New significant dependency, material architecture change, production exposure, secrets, deployment change, Git/GitHub workflow outside approved model, unresolved product/security/authorization/UX/domain/contract/validation/operational/scope decision | Stop and report category, evidence, affected scope, and required human decision. |

## Mutation and Comment Boundary

GitHub issue body, checklist, label, assignee, milestone, issue state, and
public comment mutations require explicit user approval in a workflow that
permits the operation. No such mutation or comment is part of this dry-run.

Status: passed.
