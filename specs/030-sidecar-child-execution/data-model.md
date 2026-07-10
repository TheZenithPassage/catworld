# Data Model

No CatWorld application data model changes are introduced. This feature adds no
domain entities, persistence model, API payloads, schema changes, browser
storage, or external application contracts.

The only structured data is sidecar workflow state already represented in
coordinator artifacts and prepared child handoffs. Issue #256 consumes and
reports these workflow concepts:

- **Prepared Child Handoff**: One-child execution context containing child
  issue details, prepared `spec.md`, `plan.md`, `tasks.md`, shared contract,
  dependency state, branch/worktree state, validation requirements, and child
  PR delivery rules.
- **Child Execution State**: Evidence that the child agent is in the expected
  child checkout and branch, has completed only prepared tasks, and has
  recorded blockers or remaining work.
- **Validation Freshness State**: Per-command status using `passed`, `failed`,
  `skipped`, `timed out`, `interrupted`, `partial`, `stale`, or `not run`.
- **Child PR Delivery State**: Coordinator-branch target, related-only issue
  wording, ready/draft readiness, PR URL when available, and delivery blockers.

These states are workflow/reporting artifacts, not application persistence.
