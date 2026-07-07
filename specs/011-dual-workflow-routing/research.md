# Research: Dual Workflow Routing Documentation

No researchable unknowns were identified.

The routing behavior is already specified by issue #220, the completed guardrail work in issue #221, and the direct scope of issue #222. No product, architecture, persistence, security, authorization, shared-contract, UX, operational, dependency, or workflow-implementation decision remains unresolved.

## Findings

- **Decision**: Use existing repository documentation for the longer dual workflow routing explanation.
  - **Rationale**: Issue #222 explicitly says to keep implementation details out of `AGENTS.md` and use docs for the longer explanation.
  - **Alternatives considered**: Editing `AGENTS.md` or `.agents/skills/catworld-implement-issue/SKILL.md` was rejected because #222 excludes those surfaces for this documentation work.
