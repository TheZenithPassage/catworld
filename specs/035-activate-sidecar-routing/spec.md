# Feature Specification: Activate Controlled Sidecar Routing

**Feature Branch**: `chore/261-activate-controlled-sidecar-parallel-routing`

**Created**: 2026-07-12

**Input**: User description: "Implement issue #261 from the accepted #260 sidecar build-out, activate controlled explicit coordinator parallel routing, preserve the required routing matrix and sequential boundary, validate the activation, and deliver one ready PR to workflow/sidecar-buildout using Related to #261."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes

- **TO-001**: Explicit coordinator `parallel` requests route to the executable sidecar coordinator workflow only when the issue is a clearly identified coordinator outside the #220-#234 exclusion and coordinator preflight is safe, while every other issue shape follows the required sequential or stop outcome.
  - **Why this priority**: The accepted sidecar workflow cannot serve real v1.2 coordinator work until the repository's active routing sources authorize it without weakening existing guardrails.
  - **Acceptance Scenarios**:
    1. **Given** a clearly identified coordinator issue and an explicit `parallel` request, **When** safe sidecar preflight succeeds, **Then** routing selects `.agents/skills/catworld-parallel-coordinator/SKILL.md`.
    2. **Given** a coordinator `parallel` request with unsafe, incomplete, ambiguous, stale, or contradictory preflight evidence, **When** routing is evaluated, **Then** execution stops with an explicit blocker.
    3. **Given** a normal issue or direct child issue without `parallel`, **When** routing is evaluated, **Then** the existing sequential implementation workflow remains selected.
    4. **Given** a non-coordinator or direct child request with `parallel`, **When** routing is evaluated, **Then** execution stops with a routing error instead of ignoring the flag.
    5. **Given** a coordinator request without `parallel`, **When** any listed child remains open, **Then** execution stops; **When** all listed children are closed, **Then** only the sequential final pass is selected.
  - **Validation Evidence**: The complete routing-matrix validation and relevant existing sidecar routing/preflight regressions pass from the activated sources.

- **TO-002**: Active workflow documentation describes the sidecar as a controlled opt-in capability and no longer depends on the temporary #260/#272 exception or future-only wording.
  - **Why this priority**: Contradictory active instructions could block valid use or bypass the accepted routing boundary even if the executable sidecar skills are complete.
  - **Acceptance Scenarios**:
    1. **Given** active instructions under `AGENTS.md`, `.agents/skills`, `docs/ARCHITECTURE.md`, and `.github`, **When** stale activation wording is searched, **Then** no match can prohibit or defer controlled use after #261.
    2. **Given** historical dry-run evidence under `specs/034-live-sidecar-dry-run/`, **When** the activation is implemented, **Then** that historical evidence remains unchanged.
    3. **Given** the former #260/#272 fixture predicate, **When** active routing sources are reviewed, **Then** the fixture exception is absent and general controlled coordinator routing is authoritative.
  - **Validation Evidence**: Required stale-wording search, changed-path review, and an explicit unchanged-path check for `specs/034-live-sidecar-dry-run/`.

- **TO-003**: The sequential issue implementation skill changes only at its routing boundary and retains its normal/direct-child/final-pass internals unchanged.
  - **Why this priority**: Activation must not duplicate or leak sidecar execution internals into the established sequential workflow.
  - **Acceptance Scenarios**:
    1. **Given** the diff for `.agents/skills/catworld-implement-issue/SKILL.md`, **When** it is reviewed against the requested base, **Then** changes only remove the temporary activation gate and route eligible coordinator `parallel` requests outward.
    2. **Given** forbidden sidecar concerns such as lifecycle, artifacts, Git/worktree orchestration, fan-out, child execution, delivery, resume, finalization, and cleanup, **When** the sequential-skill diff is reviewed, **Then** no such internals are added or altered.
  - **Validation Evidence**: Focused sequential-skill diff review plus the relevant sequential routing regressions.

### Edge Cases

- A request that includes `parallel` but whose issue cannot be classified as a coordinator stops as ambiguous or invalid; it never silently falls back to sequential execution.
- A coordinator whose child list, dependency state, issue evidence, repository state, or required sidecar capability is missing or unsafe stops with the specific preflight blocker.
- Issues #220 through #234 remain excluded from parallel routing and continue through the sequential guardrails even after general activation.
- Historical references in `specs/034-live-sidecar-dry-run/` may describe the pre-activation fixture in past tense; they are evidence, not active routing authority, and are not rewritten.
- Active issue or pull-request templates are changed only if they still describe sidecar support as future, description-only, or forbidden after activation.

## Requirements *(mandatory)*

### Technical Requirements

- **TR-001**: Active routing MUST preserve exactly these outcomes: normal issue sequential; direct child sequential; non-coordinator with `parallel` stop; direct child with `parallel` stop; coordinator without `parallel` and open children stop; coordinator without `parallel` and all children closed sequential final pass; coordinator with `parallel` safe sidecar coordinator workflow; unsafe coordinator with `parallel` explicit blocker.
- **TR-002**: The sidecar coordinator workflow MUST be described as controlled explicit opt-in for v1.2 coordinator work that is clearly identified, is not excluded by the #220-#234 guardrail, and passes the existing safe-preflight contract; it MUST NOT become the default workflow.
- **TR-003**: Active routing sources MUST remove the temporary #260/#272 issue-and-run fixture exception and replace it with general safe-preflight authorization for explicit coordinator `parallel` requests.
- **TR-004**: `.agents/skills/catworld-implement-issue/SKILL.md` MUST remain limited to routing-boundary wording; its sequential lifecycle, artifacts, branch/worktree behavior, fan-out, child execution, PR delivery, resume, final delivery, and cleanup internals MUST NOT be added or changed for sidecar activation.
- **TR-005**: Active wording that says the sidecar is future, not implemented, description-only, deferred until adoption, stopped after preflight, or prohibited from child execution MUST be removed or made unambiguously historical without weakening current safety stops.
- **TR-006**: The executable sidecar coordinator and child skills, repository instructions, architecture source of truth, and any applicable issue/PR templates MUST agree on the activated routing boundary and safe-preflight stop behavior.
- **TR-007**: Historical dry-run evidence under `specs/034-live-sidecar-dry-run/` MUST remain unchanged, and issues #220 through #234 MUST remain outside parallel routing.
- **TR-008**: Validation MUST include the complete routing matrix, relevant existing sidecar regressions, the required stale-wording search, the focused sequential-skill diff review, and `git diff --check`.
- **TR-009**: The change MUST NOT alter CatWorld product behavior, run another dry-run, merge pull requests, perform cleanup, delete branches, or mutate issues #220 through #234.
- **TR-010**: Branch preparation MUST fetch `origin/workflow/sidecar-buildout` and create the new focused #261 branch from that exact refreshed remote ref; delivery MUST create one ready pull request from that branch to `workflow/sidecar-buildout`, and its issue reference MUST use `Related to #261` rather than a closing keyword.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld repository workflow governance and documentation.
- **SB-002**: Feature MUST distinguish activated routing behavior from preserved historical evidence and from unresolved or unsafe runtime state.
- **SB-003**: Feature MUST NOT introduce a new orchestration framework, generic coordination mechanism, product abstraction, or default parallel behavior.

### Out of Scope

- CatWorld product behavior or application code changes.
- A new live or simulated sidecar dry-run.
- Rewriting accepted historical evidence under `specs/034-live-sidecar-dry-run/`.
- Merging any pull request, enabling auto-merge, cleanup, branch deletion, or issue mutation.
- Editing or routing issues #220 through #234 through sidecar parallel execution.
- Expanding the sequential implementation skill with sidecar execution internals.

### Open Questions

- None. Issue #261, the accepted #260 result through merged PR #280, and the user's explicit delivery instructions resolve the activation scope and routing contract.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every row of the eight-outcome routing matrix produces the specified sequential, sidecar, or stop result in the complete routing validation.
- **SC-002**: All relevant existing sidecar regression scenarios pass against the activated active-source wording and safe-preflight boundary.
- **SC-003**: The required stale-wording search leaves no active match that can defer, forbid, or fixture-gate controlled sidecar use; any remaining match is explicitly historical and non-authoritative.
- **SC-004**: The focused diff for `.agents/skills/catworld-implement-issue/SKILL.md` contains routing-boundary changes only, with no sidecar execution internals added or sequential internals modified.
- **SC-005**: `git diff --check` passes, `specs/034-live-sidecar-dry-run/` has no changed paths, and the scoped diff contains no CatWorld product files.
- **SC-006**: Git ancestry proves the focused branch began at the freshly fetched `origin/workflow/sidecar-buildout` head, exactly one ready PR targets `workflow/sidecar-buildout` with `Related to #261`, and no merge, cleanup, branch deletion, or issue mutation is performed.

## Assumptions

- PR #280's merged head on `workflow/sidecar-buildout` is the accepted #260 baseline, as explicitly confirmed by the user and current GitHub evidence.
- Existing sidecar validators and simulations remain the validation source of truth unless the plan identifies a narrowly necessary activation update within issue scope.
