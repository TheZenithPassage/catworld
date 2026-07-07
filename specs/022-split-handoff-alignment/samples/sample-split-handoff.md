# Sample Split Handoff

This local sample validates the output shape only. It does not create, update,
close, label, assign, milestone, checklist-edit, or publicly comment on real
GitHub issues.

## Coordinator Rewrite Body

## Goal

Coordinate delivery of the preserved source issue scope through focused child
issues while keeping normal sequential implementation available for each child.

## Preserved scope

- Preserve all behavior requested by the source issue.
- Do not add product behavior during splitting.
- Do not remove source issue requirements during splitting.
- Do not invent seed, foundation, or shared-contract child issues outside the
  preserved source scope.

## Child issues

- [ ] #<child-issue-1> - Focused child issue for the first independently
  implementable slice.
- [ ] #<child-issue-2> - Focused child issue for the second independently
  implementable slice.

## Dependencies

- #<child-issue-1> must complete before #<child-issue-2> when its output is a
  hard dependency.
- Hard-dependent child work must not be described as safely parallel.
- Validation-only dependencies must be recorded separately from implementation
  blockers.

## Execution model

This split handoff does not activate parallel mode by itself.

- Normal issues and direct child issue end-to-end requests use the current
  sequential workflow.
- Sidecar parallel work requires an explicit `parallel` request on a clearly
  identified coordinator issue after sidecar support exists and has passed its
  adoption gate.
- Parallel readiness comes from coordinator preflight, child issue inspection,
  dependency classification, and source-of-truth review; do not require or
  invent a `parallel-ready` label.
- A coordinator end-to-end request while any listed child issue is still open
  must stop for routing.
- A coordinator with all listed child issues closed may enter the existing
  sequential workflow for final verification and delivery.
- Coordinator finalization is not a separate workflow and must not reimplement
  closed child issue scope.

## Validation

- Verify closed child issues collectively preserve the coordinator scope.
- Run or reference validation required for remaining coordinator-level work.
- Report stale, skipped, failed, interrupted, partial, or not-rerun validation
  explicitly instead of summarizing it as passed.

## Out of scope

- Replacing the current sequential workflow.
- Activating parallel mode without an explicit eligible request.
- Reimplementing closed child issue scope during coordinator finalization.
- Adding or removing product scope during splitting.
- Creating real GitHub issues during local validation.

## Child Issue Body 1

## Parent coordinator

Parent: #<coordinator-issue>

This child issue does not activate parallel mode by itself.

This child may be implemented directly through the normal sequential workflow
when the user chooses one-by-one execution.

## Scope

Implement the first focused slice from the preserved coordinator scope.

## Dependencies

- Parent coordinator: #<coordinator-issue>
- Sibling dependency: none for this sample child.

## Validation

- Run the child-specific validation required by the preserved source scope.
- Report validation freshness after the latest relevant change.

## Out of scope

- Coordinator finalization.
- Reimplementation of sibling child issue scope.
- Sidecar PR delivery decisions.

## Child Issue Body 2

## Parent coordinator

Parent: #<coordinator-issue>

This child issue does not activate parallel mode by itself.

This child may be implemented directly through the normal sequential workflow
when the user chooses one-by-one execution.

## Scope

Implement the second focused slice from the preserved coordinator scope.

## Dependencies

- Parent coordinator: #<coordinator-issue>
- Blocks or depends on #<child-issue-1> only when the coordinator dependency
  map records a hard dependency.

## Validation

- Run the child-specific validation required by the preserved source scope.
- Recheck any coordinator-level validation affected by this child.

## Out of scope

- Coordinator finalization.
- Reimplementation of sibling child issue scope.
- Sidecar PR delivery decisions.

## Optional Sidecar PR Wording Guidance

Child PR description references:

- Related to #<child-issue>
- Related to #<coordinator-issue>

The child PR description must not close the child issue or coordinator issue by
default.

Final sidecar coordinator PR description references:

- Closes #<coordinator-issue>
- Closes #<child-issue>

A closed-child coordinator final pass uses normal sequential PR wording, not
the sidecar final coordinator PR wording.
