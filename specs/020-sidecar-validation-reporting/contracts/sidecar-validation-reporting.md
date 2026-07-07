# Contract: Sidecar Validation Reporting

This contract defines the observable validation, blocker, conflict, stale
evidence, and readiness reporting rules for issue #231.

## Sidecar Child Validation Report

Applies to one prepared sidecar child implementation.

- Must identify the child issue and coordinator issue.
- Must list required commands, manual reviews, and local sample artifacts from
  the prepared handoff.
- Must report each evidence item as `passed`, `failed`, `skipped`,
  `timed out`, `interrupted`, `partial`, `stale`, or `not run`.
- Must not summarize failed, timed-out, skipped, interrupted, partial, stale,
  or not-run validation as passed.
- Must describe whether evidence is fresh after the latest relevant change.
- Must identify child-specific blockers separately from coordinator-wide or
  shared-contract blockers.
- Must report child PR readiness as `ready` only when required validation is
  fresh and passed, no unresolved blocker affects the child, and sidecar PR
  target rules are satisfied.
- Must report child PR readiness as `draft` when required validation is failed,
  incomplete, stale, not run, or blocked, unless the non-passing evidence is
  explicitly outside child readiness and the report explains why.

## Sidecar Coordinator Validation Report

Applies to the coordinator integration branch and sidecar set.

- Must list coordinator-level commands, manual reviews, local sample artifacts,
  and child validation evidence consumed for readiness.
- Must identify affected children when validation is stale after coordinator
  branch updates, child branch refreshes, conflict resolution, or other
  relevant changes.
- Must not treat stale child evidence as fresh coordinator readiness evidence.
- Must distinguish coordinator-wide blockers from child-specific blockers.
- Must stop affected sidecar work when a shared-contract blocker is present.
- Must report final coordinator readiness only when required coordinator and
  consumed child evidence is fresh and passed, no unresolved blocker affects
  the coordinator set, and approved sidecar Git/PR rules are satisfied.

## Conflict Reporting

Non-trivial conflicts require user guidance when they affect any of these
surfaces:

- contract;
- scope;
- persistence;
- security;
- authorization;
- UX;
- domain behavior.

Conflict reports must identify the conflicting inputs, affected source
surfaces, blocked child or coordinator scope, and the user guidance needed
before work can continue.

## Human-Only Blockers

Sidecar work must stop for user guidance when it encounters any of these
categories:

- new significant dependency;
- material architecture change;
- production exposure;
- secrets;
- deployment change;
- Git/GitHub workflow outside the approved model;
- unresolved product decision;
- unresolved persistence decision;
- unresolved security decision;
- unresolved authorization decision;
- unresolved UX decision;
- unresolved domain decision;
- unresolved contract decision;
- unresolved validation decision;
- unresolved operational decision;
- unresolved scope decision.

Reports must name the category, evidence, affected scope, and required human
decision. Codex must not decide these categories silently.

## GitHub Mutation and Public Comments

Codex must not modify GitHub issue bodies, checklists, labels, assignees,
milestones, issue state, or public comments unless the user explicitly requests
that operation in a workflow that permits it.

## Normal Sequential and Closed-Child Final-Pass Reporting

Normal issue implementation keeps existing sequential validation and final
reporting behavior. Direct child issue work outside explicit sidecar `parallel`
mode also uses the normal sequential reporting behavior.

A coordinator with all child issues already closed that enters the existing
sequential final-pass workflow uses normal sequential reporting. It may
reference closed child issues for traceability, but it must not present closed
child issue scope as newly implemented work.
