# Research

No researchable unknowns were identified.

## Repository Findings

- **Decision**: Use the existing repo-local skill pattern under `.agents/skills/<skill-name>/SKILL.md`.
  - **Rationale**: Issue #202 explicitly requests `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`, and the repository already uses this pattern for CatWorld and Spec Kit workflows.
  - **Alternatives considered**: Application code changes, Spec Kit agent-context script changes, and shorthand prompt routing were rejected because issue #202 explicitly excludes them.

- **Decision**: Keep the new coordinator skill as orchestration guidance and delegate concrete child issue implementation to `.agents/skills/catworld-implement-issue/SKILL.md`.
  - **Rationale**: Issue #202 requires the existing single-issue implementation skill to remain responsible for each concrete child issue.
  - **Alternatives considered**: Replacing or duplicating the single-issue workflow was rejected because it would create competing implementation paths.

- **Decision**: Reference `AGENTS.md` and `.agents/skills/catworld-implement-issue/SKILL.md` for authoritative Git safety rules instead of restating them in full.
  - **Rationale**: Issue #202 explicitly asks to avoid duplicating the full safety rules.
  - **Alternatives considered**: Copying the safety rule list into the new skill was rejected to avoid divergence.
