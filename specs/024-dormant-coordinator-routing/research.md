# Research

No researchable unknowns were identified. Issue #250 provides the required
scope, exclusions, validation command, and routing constraints.

## Repository Evidence

- Active routing sources include `AGENTS.md`, `catworld-implement-issue`, the sidecar coordinator and child implementation skills, `docs/ARCHITECTURE.md`, and relevant `.github` templates.
- The dormant legacy file `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` contains legacy workflow text and must remain unmodified unless explicit approval is obtained.
- The required search terms identify the active contradiction risks: legacy orchestration references, seed-first guidance, child issue closing language, and premature parallel-mode activation.

## Decisions

### Decision: Edit only active routing and template sources

**Rationale**: The issue explicitly says to treat the legacy orchestrate skill as dormant legacy workflow text and to neutralize active sources that invoke or contradict the sidecar-only model.

**Alternatives considered**:

- Edit the legacy orchestrate skill: rejected because issue #250 excludes this without explicit user approval.
- Activate sidecar parallel routing now: rejected because #261 is the activation point and this issue must not enable real product use.
- Change the sequential implementation workflow internals: rejected because issue #250 requires preserving the current sequential workflow as the default active path.
