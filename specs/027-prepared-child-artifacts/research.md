# Research: Prepared Child Spec Kit Artifacts

## Decision: Extend the existing sidecar workflow sources and local simulations

Use the existing sidecar coordinator skill, child implementation skill,
architecture documentation, Spec Kit artifacts, and PowerShell simulations for
#253. Do not add a new framework, service, or executable product component.

**Rationale**: Issue #253 is workflow infrastructure. The approved sidecar
build-out already uses Markdown skills/docs plus focused local simulations as
the evidence layer, and #252 established the coordinator artifact write gate
that this feature extends to child artifacts.

**Alternatives considered**:

- Add a standalone child artifact generator program. Rejected because #253 does
  not require a new runtime tool or dependency, and a generator could exceed
  the current build-out's documented workflow-text scope.
- Let each child agent generate its own Spec Kit artifacts. Rejected because
  #253 explicitly requires prepared child artifacts before delegation and says
  child agents must not regenerate them independently.

## Decision: Treat child artifact scope validation as a coordinator stop gate

Prepared child artifacts must be validated against the child issue scope, shared
implementation contract, coordinator artifact, dependency layer, repository
sources of truth, and sibling child boundaries before fan-out.

**Rationale**: Child agents are implementation executors, not product or
architecture decision makers. Blocking missing shared contracts, sibling scope
leakage, duplicate child numbers, and unproven artifact collisions preserves
the constitution's planning discipline and focused-change rules.

**Alternatives considered**:

- Allow child agents to repair or expand artifacts after launch. Rejected
  because #253 requires missing child artifacts to block delegation and requires
  child agents to receive prepared artifacts.
- Auto-create a foundation or shared-contract child issue when contract context
  is missing. Rejected because #253 forbids inventing human-only GitHub and
  architecture decisions.

## Decision: Keep future activated sidecar branch semantics separate from this build-out branch

This implementation branch starts from and opens a PR into
`workflow/sidecar-buildout`. Future sidecar lifecycle text may still say
coordinator branches start from `origin/main` because that describes the future
activated sidecar workflow, not the temporary integration branch strategy.

**Rationale**: The user's issue-specific build-out instruction overrides
delivery for this implementation without changing the future sidecar workflow
contract being documented.

**Alternatives considered**:

- Rewrite future sidecar lifecycle text to say coordinator branches start from
  `workflow/sidecar-buildout`. Rejected because that would encode a temporary
  integration strategy into the future activated sidecar model.
