# Research: Dependency-Layer Fan-Out and Child Handoffs

## Decision: Extend Existing Sidecar Skill Text And Local Simulations

**Rationale**: Issues #253 and #254 already use the sidecar coordinator skill,
sidecar child skill, architecture documentation, Spec Kit contracts, and
PowerShell simulations as the build-out mechanism. Continuing that pattern
satisfies #255 without adding a new runtime dependency or changing CatWorld
product code.

**Alternatives considered**:

- Add a repository-local scheduler/helper library. Rejected for this issue
  because no activated sidecar runtime exists yet and a helper would add
  maintenance surface before #261.
- Use an external workflow service or queue. Rejected as out of scope and an
  unapproved operational dependency.

## Decision: Detect Child-Agent Capability At Fan-Out Time

**Rationale**: The current Codex environment can expose multi-agent tools
through tool discovery, but issue #255 requires the workflow to stop when
child-agent/subagent execution is unavailable. The coordinator should therefore
verify that an approved child-agent spawning capability is available in the
active environment before launch, and record a capability blocker when it is
not.

**Alternatives considered**:

- Assume child-agent capability exists. Rejected because #255 explicitly
  requires a stop instead of silent fallback when capability is unavailable.
- Fall back to sequential child implementation. Rejected because #255
  explicitly forbids silently switching to sequential implementation.

## Decision: Treat Fan-Out As One Dependency-Ready Layer Only

**Rationale**: The approved sidecar lifecycle already requires hard-dependent
layers to wait for prerequisite child merges into the coordinator branch. #255
turns this into executable fan-out behavior by launching only children in the
first dependency-ready layer and recording later layers as pending or waiting.

**Alternatives considered**:

- Launch all independent-looking layers at once. Rejected because hard
  dependencies and coordinator integration state must be respected.
- Launch one child at a time even when a layer is independent. Rejected because
  #255's goal is dependency-ready fan-out and explicit child handoffs.
