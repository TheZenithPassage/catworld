# Research: Sidecar Child Implementation Skill

## Decision: Create a separate repo-local sidecar child skill

**Rationale**: Issue #228 explicitly requires an independent child implementation skill at `.agents/skills/catworld-parallel-child-implementation/SKILL.md` and requires `.agents/skills/catworld-implement-issue/SKILL.md` to remain unchanged. The #220 sidecar architecture also requires the parallel workflow to live beside the current sequential implementation workflow.

**Alternatives considered**:

- Modify the normal implementation skill: rejected because #228 explicitly forbids changing the existing normal implementation skill.
- Extend the sidecar coordinator skill with child execution: rejected because #227 states the coordinator stops before child implementation, while #228 asks for a child implementation skill.
- Create an external script or plugin: rejected because no external dependency is needed for repository-local Codex workflow instructions.

## Decision: Require a complete prepared child handoff before implementation

**Rationale**: #227 defines prepared coordinator and child artifacts before delegation. #228 requires child implementation to use prepared artifacts only and stop on missing or conflicting context. The child skill should therefore require the child issue body, coordinator context, prepared `spec.md`, `plan.md`, `tasks.md`, shared contract, validation requirements, dependency status, and target coordinator branch/worktree context before implementation.

**Alternatives considered**:

- Let the child skill run Spec Kit generation when artifacts are missing: rejected because #228 forbids generating its own planning artifacts.
- Let the child skill infer shared contracts from repository state: rejected because shared contract decisions must come from prepared artifacts or approved source-of-truth context.

## Decision: Document non-applicability and prohibited side effects inside the skill

**Rationale**: #228's main safety requirement is that the skill be impossible to confuse with the normal issue implementation path. Explicit applicability, non-applicability, stop conditions, and prohibited side effects make the sidecar child boundary reviewable and testable.

**Alternatives considered**:

- Rely only on `AGENTS.md` routing guardrails: rejected because #228 asks the child skill itself to be impossible to confuse with normal implementation.
- Add sidecar child routing to the normal implementation skill: rejected because #228 requires that skill to remain unchanged.

## Decision: Keep architecture documentation aligned with the new child boundary

**Rationale**: `docs/ARCHITECTURE.md` is the longer source-of-truth explanation for workflow routing and already documents the sidecar coordinator and artifact preparation. A focused update keeps maintainers from reading stale sidecar workflow state after the child skill is added.

**Alternatives considered**:

- Document only in the new skill: rejected because architecture docs already own the longer sidecar workflow explanation.
- Update `AGENTS.md`: rejected unless needed for active plan pointer management; #228 does not require changing mandatory routing guardrails.
