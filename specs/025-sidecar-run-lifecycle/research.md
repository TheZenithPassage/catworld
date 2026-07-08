# Research

No researchable unknowns were identified. Issue #251, dependency #250, and the
existing sidecar workflow sources provide the required lifecycle scope,
activation boundary, exclusions, and validation requirements.

## Repository Evidence

- Issue #250 is closed and preserves sequential default routing while keeping
  legacy coordinator orchestration dormant during sidecar build-out.
- `AGENTS.md` and `catworld-implement-issue` already define current shorthand
  routing guardrails, including the #261 activation gate for sidecar
  coordinator `parallel` routing.
- `catworld-parallel-coordinator` already contains partial sidecar guidance for
  coordinator preflight, artifact preparation, Git state, PR delivery,
  validation reporting, resume state, and prohibited side effects.
- `catworld-parallel-child-implementation` already consumes prepared child
  handoff context and must remain an executor, not a product or architecture
  decision maker.
- `docs/ARCHITECTURE.md` already documents CatWorld workflow routing,
  sidecar artifact paths, Git execution rules, PR delivery rules, validation,
  resume state, and closed-child coordinator final-pass boundaries.

## Decisions

### Decision: Define lifecycle behavior in existing sidecar sources

**Rationale**: #251 asks for executable lifecycle behavior across sidecar
workflow docs and sidecar skills without activating routing. Existing sources
are the current source of truth and already contain the related partial rules.

**Alternatives considered**:

- Add executable branch/worktree commands: rejected because #251 explicitly
  excludes branch/worktree command implementation.
- Launch real child agents or PRs: rejected because #251 explicitly excludes
  real child-agent launch and PR operations.
- Remove inactive/adoption-gate wording: rejected because #251 reserves that
  activation work for #261 after the controlled dry-run passes.
- Change CatWorld product code: rejected because this feature is workflow
  documentation only.
