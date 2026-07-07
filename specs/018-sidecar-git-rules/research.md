# Research: Sidecar Git Rules

## Decision: Use existing sidecar workflow sources for Git rules

**Rationale**: Issue #229 is a workflow-source change, not a request for executable Git automation. The existing sidecar coordinator skill and child implementation skill already define the handoff boundaries that need branch, checkout/worktree, refresh, and cleanup state. `docs/ARCHITECTURE.md` is the longer repository source of truth for Codex workflow routing.

**Alternatives considered**:

- Add a dedicated sidecar Git automation script. Rejected because #229 asks for execution rules and simulations, while live orchestration and PR handling are not yet approved by #230-#234.
- Modify the normal sequential implementation skill. Rejected because #220 and #229 explicitly preserve normal issue Git flow for direct child work and closed-child coordinator final passes.

## Decision: Record Git state in the coordinator artifact contract

**Rationale**: The coordinator artifact already records child issue map, dependency layers, shared contracts, validation plan, and status table. Adding sidecar Git state there keeps resumable branch/checkout context with the coordinator source of truth and supports later #232 state tracking without inventing a separate storage mechanism in #229.

**Alternatives considered**:

- Store sidecar Git state only in free-form final reports. Rejected because future child handoffs need stable, reviewable input fields before branch/worktree execution.
- Use a new persistent state file outside the coordinator artifact. Rejected as premature for #229 and better reserved for #232 if a separate state file is explicitly approved.

## Decision: Validate with a temporary Git repository simulation

**Rationale**: A temporary local Git repository can prove coordinator/child branch ancestry, normal merge refresh after one child merge, and cleanup eligibility without mutating CatWorld sidecar branches, opening PRs, or touching remote resources.

**Alternatives considered**:

- Simulate directly in the CatWorld repository. Rejected because issue #229 does not require creating sidecar branches/worktrees in the real repository and doing so would add avoidable cleanup risk.
- Use text review only. Rejected because the issue explicitly asks to simulate one coordinator branch, two child branches, a child merge, active child refresh, cleanup eligibility, and closed-child final-pass flow.
