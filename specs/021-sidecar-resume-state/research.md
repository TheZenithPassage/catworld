# Research: Sidecar Resume State

## Decision: Use Existing Sidecar Skills and Architecture Docs for Resume Rules

**Decision**: Extend
`.agents/skills/catworld-parallel-coordinator/SKILL.md`,
`.agents/skills/catworld-parallel-child-implementation/SKILL.md`, and
`docs/ARCHITECTURE.md` with sidecar resume state, re-read evidence, refresh
state, stale validation, and cleanup eligibility rules.

**Rationale**: Issues #220, #227, #229, #231, and #232 define a sidecar
workflow that lives beside the normal sequential workflow. The existing sidecar
skills already own coordinator artifact preparation, child handoff
requirements, Git state, PR delivery state, validation freshness, blockers,
conflicts, and reporting. Resume state belongs in the same sidecar surfaces so
future sessions can continue from repository/GitHub evidence without changing
the normal sequential implementation skill.

**Alternatives considered**:

- Add a new executable state file or automation script: rejected because issue
  #232 asks for state tracking definitions and simulations, while adoption and
  real execution are still gated by later sidecar work.
- Store resume state outside the repository: rejected because resume must not
  depend on private conversation context and the issue scope points to the
  coordinator artifact as the durable source.
- Modify `.agents/skills/catworld-implement-issue/SKILL.md`: rejected because
  #220 and #232 require normal sequential issue implementation state to remain
  unchanged.

## Decision: Represent Resume State as a Markdown Workflow Contract and Samples

**Decision**: Add a feature-local contract
`specs/021-sidecar-resume-state/contracts/sidecar-resume-state.md` and local
Markdown samples under `specs/021-sidecar-resume-state/samples/`.

**Rationale**: The feature changes repository workflow instructions, not
CatWorld runtime behavior. A Markdown contract and samples are sufficient for
reviewing the required fields, status transitions, stale state, cleanup
eligibility, and closed-child final-pass boundary without adding runtime
dependencies or automation.

**Alternatives considered**:

- Create JSON schemas for coordinator artifacts: rejected as premature because
  sidecar execution has not completed adoption dry-run and #232 does not
  require a machine-readable schema.
- Add generated report tooling: rejected because it would introduce unapproved
  execution mechanics and maintenance cost before #234 adoption validation.
- Keep requirements only in prose with no samples: rejected because #232
  explicitly requires simulations for resume, active branch refresh, cleanup
  eligibility, and closed-child final-pass handling.

## Decision: Validate Refresh with a Temporary Git Repository Only

**Decision**: Use a temporary local Git repository in quickstart validation to
simulate a child PR merge into the coordinator branch and refresh an active
child branch using normal merge.

**Rationale**: The simulation proves merge-only refresh behavior without
creating real sidecar branches, worktrees, pull requests, remote branches, or
cleanup state in the CatWorld repository.

**Alternatives considered**:

- Run the simulation in the CatWorld repository: rejected because #232 is a
  sequential implementation issue and must not create real sidecar execution
  branches or worktrees.
- Use rebase-based refresh for a simpler history: rejected because #220, #229,
  and #232 explicitly prohibit rebase and history rewriting for sidecar
  branches.

## Decision: No Runtime Data, API, Persistence, or Product UI Changes

**Decision**: Keep all changes within workflow skills, architecture
documentation, Spec Kit artifacts, and local samples.

**Rationale**: Issue #232 is a workflow infrastructure issue. It does not
authorize changes to CatWorld product behavior, backend contracts, frontend UI,
database schema, authorization, deployment, or operations.

**Alternatives considered**:

- Add application-level state tracking: rejected because the sidecar workflow
  is a repository/Codex process, not CatWorld runtime product behavior.
- Add remote cleanup, issue mutation, or public comments during validation:
  rejected because those operations require explicit user approval and are out
  of scope for #232.
