# Research: Coordinator and Child Issue Templates

## Findings

- **Decision**: Use standard GitHub Markdown issue templates in `.github/ISSUE_TEMPLATE/`.
  - **Rationale**: Issue #223 asks for issue bodies that can be created from templates and requires concise template text. Markdown issue templates satisfy this without new tooling, new dependencies, or workflow behavior changes.
  - **Alternatives considered**: GitHub issue forms were not selected because structured form fields are unnecessary for the requested concise bodies. Custom generation scripts were not selected because they would add tooling outside the issue scope.

- **Decision**: Keep all routing language declarative and non-activating.
  - **Rationale**: Issues #220-#222 require the sequential workflow to remain default, parallel mode to be opt-in only after sidecar support exists, and coordinator finalization to use the existing sequential workflow after child issues are closed.
  - **Alternatives considered**: Embedding procedural Spec Kit workflow steps in templates was rejected because issue #223 explicitly says to avoid duplicating full Spec Kit artifacts.

## Unresolved Decisions

None.
