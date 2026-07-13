# Research: Sidecar Coordinator Artifacts

## Decision: Use Existing Workflow Sources for the Artifact Contract

The coordinator artifact contract will live in the existing sidecar workflow
sources: `.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`docs/ARCHITECTURE.md`, and `specs/026-sidecar-coordinator-artifacts/contracts/`.

**Rationale**: Issue #252 extends the approved sidecar workflow build-out. The
current repository already places sidecar routing, lifecycle, artifact, Git,
PR, validation, and resume contracts in these Markdown sources. Keeping the
contract there preserves the existing source-of-truth model and avoids adding
new runtime machinery before #261.

**Alternatives considered**:

- Add a production CLI or library: rejected because #252 is a workflow
  build-out issue and does not approve a new dependency or executable product
  mechanism.
- Keep only descriptive text: rejected because #252 requires
  execution-capable artifact handling and validation simulations.

## Decision: Validate with Local Simulations and Source Review

Validation will use local simulations and source text review rather than real
sidecar product execution.

**Rationale**: The parent epic keeps sidecar product use dormant until #261.
Issue #252 requires simulations for path/content, write gating, collisions,
blocked state, and local `main` cleanliness, while leaving child generation,
branch/worktree orchestration, child agents, and PR opening out of scope.

**Alternatives considered**:

- Run a real sidecar coordinator: rejected because routing remains inactive
  until #261 and the issue explicitly excludes child launch and PR delivery.
- Use only manual prose review: rejected because the issue requires simulated
  evidence for artifact path, write gate, collisions, blocked state, and local
  `main` cleanliness.

## Decision: Treat Existing Artifact Identity as Factual Run Metadata

An existing coordinator artifact may be resumed only when recorded metadata
proves it belongs to the same coordinator issue, title/URL/source context,
computed path, and sidecar run identity. Otherwise the workflow stops on
collision before writing.

**Rationale**: The issue requires repeated runs to detect existing artifacts
safely and either resume the same run or stop on collision. Factual metadata
keeps resumability durable without relying on private conversation context.

**Alternatives considered**:

- Always overwrite same-number artifacts: rejected because it can destroy or
  mix unrelated run state.
- Always stop on any existing path: rejected because the issue explicitly
  permits safe resume of the same run.
