Closes #220
Closes #221
Closes #222
Closes #223
Closes #224

Adds the completed sidecar coordinator delivery workflow.

Integrated child PRs:
- #301 for #221
- #302 for #222
- #303 for #223
- #304 for #224

Changes:
- Integrates coordinator workflow documentation, issue templates, and PR description templates.
- Verifies the sidecar workflow preserves normal sequential routing behavior.

Validation:
- `git diff --check -- .github/PULL_REQUEST_TEMPLATE specs/013-pr-description-templates`
- Manual review against #220, #221, #222, #223, and #224.

Coordinator delivery notes:
- Source branch: `docs/220-sidecar-coordinator-workflow`
- Target branch: `main`
- Use this template only for sidecar coordinator delivery into `main`.
- Normal one-issue/one-PR work and closed-child coordinator final-pass work keep normal sequential PR wording.
