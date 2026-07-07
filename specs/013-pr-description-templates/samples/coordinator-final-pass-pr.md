Closes #220

Adds the remaining coordinator final-pass verification for the sidecar workflow.

Changes:
- Verifies that closed child issues collectively preserve the coordinator scope.
- Completes remaining coordinator-level review without reimplementing closed child issue scope.

Validation:
- `git diff --check -- .github/PULL_REQUEST_TEMPLATE specs/013-pr-description-templates`
- Manual review against #220, #221, #222, #223, and #224.
