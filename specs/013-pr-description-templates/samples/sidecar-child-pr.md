Related to #224
Related to #220

Adds sidecar PR description templates for coordinator delivery.

Changes:
- Adds the child-to-coordinator PR template for sidecar child branches.
- Adds local validation samples for sidecar PR wording.

Validation:
- `Select-String -Path .github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md,specs/013-pr-description-templates/samples/sidecar-child-pr.md -Pattern '(Closes|Fixes|Resolves)\s+#' -CaseSensitive`
- Manual review against #220, #221, #222, #223, and #224.

Coordinator notes:
- Target coordinator branch: `docs/220-sidecar-coordinator-workflow`
- Child issue scope only; sibling child work and coordinator finalization remain out of scope.
- This sidecar child PR is not the final delivery PR to `main`.
