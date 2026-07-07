---
name: Coordinator parallel planning
about: Plan an opt-in coordinator issue that preserves scope across focused child issues.
title: "[Coordinator] "
labels: workflow, chore
assignees: ""
---

## Goal

<!-- Describe the coordinator-level outcome this issue preserves. -->

## Preserved scope

<!-- Summarize the complete scope that child issues must collectively cover. -->

## Child issues

<!-- List each focused child issue. Keep this list current before requesting coordinator finalization. -->

- [ ] #

## Dependencies

<!-- Describe child issue ordering, hard dependencies, conflict risks, and any work that must remain sequential. -->

## Execution model

This template does not activate parallel mode by itself.

- Normal issues and direct child issue end-to-end requests use the current sequential workflow.
- Sidecar parallel work requires an explicit `parallel` request on a clearly identified coordinator issue after sidecar support exists and has passed its adoption gate.
- Parallel readiness comes from coordinator preflight, child issue inspection, dependency classification, and source-of-truth review; do not require or invent a `parallel-ready` label.
- A coordinator end-to-end request while any listed child issue is still open must stop for routing.
- A coordinator with all listed child issues closed may enter the existing sequential workflow for final verification and delivery.
- Coordinator finalization is not a separate workflow and must not reimplement closed child issue scope.

## Validation

<!-- Define the coordinator-level validation needed after child issues are complete. -->

- Verify that closed child issues collectively preserve the coordinator scope.
- Run or reference validation required for remaining coordinator-level work.

## Out of scope

<!-- List work this coordinator must not perform. -->

- Replacing the current sequential workflow.
- Activating parallel mode without an explicit eligible request.
- Reimplementing closed child issue scope during coordinator finalization.
- PR description templates.
