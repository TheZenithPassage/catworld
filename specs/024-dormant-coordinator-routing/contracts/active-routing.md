# Active Routing Contract

This feature treats active CatWorld workflow instructions and templates as an
agent-facing routing contract.

## Required Outcomes

- Normal implementable issues route to `.agents/skills/catworld-implement-issue/SKILL.md`.
- Direct child issues route to `.agents/skills/catworld-implement-issue/SKILL.md`.
- Coordinator issues without activated sidecar `parallel` routing keep the existing open-child and closed-child guardrails.
- Non-coordinator prompts that include `parallel` stop with a routing error.
- Explicit eligible coordinator `parallel` requests route only to the sidecar coordinator workflow after #261 activates that path.
- No active route invokes `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` for real coordinator execution.
- Sidecar child PR guidance must not close child issues from child branches.
- Sidecar child execution must not invent shared contracts or plan product behavior beyond coordinator-provided artifacts.
- Sidecar coordinator guidance must not require automatic seed-first behavior.

## Exclusions

- The dormant legacy orchestrate skill is not part of this active routing contract.
- This contract does not activate sidecar parallel execution for product work.
- This contract does not change application runtime behavior.
