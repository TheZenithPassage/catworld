# Research: PR Description Templates for Sidecar Coordinator Delivery

## Decision: Use Non-Default GitHub Markdown PR Templates

- **Rationale**: Issue #224 requires sidecar-specific PR description templates without changing normal PR descriptions. Non-default Markdown templates under `.github/PULL_REQUEST_TEMPLATE/` can be selected intentionally for sidecar PRs while leaving the normal one-issue/one-PR flow without a repository default PR template.
- **Alternatives considered**:
  - Add a default `.github/pull_request_template.md`: rejected because it would change normal PR description behavior.
  - Add generation scripts or automation: rejected because issue #224 asks for templates and local samples, not workflow automation.
  - Change `AGENTS.md` or implementation skills: rejected because #222 states the sidecar workflow should exist beside the current sequential workflow and must not require internal sequential workflow changes.

## Decision: Keep Sidecar Child and Final Coordinator Templates Separate

- **Rationale**: Child PRs and final coordinator PRs have different issue-closing rules. Separate templates make the difference explicit and keep child PRs from closing issues by default.
- **Alternatives considered**:
  - One combined template with conditional instructions: rejected because it increases the risk that authors use `Closes` in child PRs.
  - Only document wording in prose: rejected because issue #224 specifically asks for PR description templates.

## Researchable Unknowns

None. The relevant workflow contract is already defined by issue #224, parent #220, dependency issues #222/#223, `AGENTS.md`, and `docs/ARCHITECTURE.md`.
