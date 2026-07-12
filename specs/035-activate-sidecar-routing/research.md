# Research: Activate Controlled Sidecar Routing

## Decision 1: Activate the existing sidecar capability

**Decision**: Replace the temporary #260/#272 active routing exception with the general controlled predicate for explicit coordinator `parallel` requests, delegating safe requests to `.agents/skills/catworld-parallel-coordinator/SKILL.md`.

**Rationale**: Current GitHub evidence shows PR #280 merged the accepted #260 workflow into `workflow/sidecar-buildout`. The user explicitly authorizes #261 activation and supplies the exact routing matrix. The existing sidecar coordinator/child skills already own preflight, artifacts, Git/worktrees, fan-out, delivery, resume, finalization, and cleanup boundaries.

**Alternatives considered**:

- Keep the fixture-only gate: rejected because it would leave the completed workflow unavailable and contradict #261.
- Make sidecar parallel the default: rejected because the issue requires controlled explicit opt-in and preserves sequential defaults.
- Copy lifecycle logic into the sequential skill: rejected because it would duplicate authority and violates the explicit sequential-boundary constraint.
- Introduce a new orchestrator or service: rejected because the accepted workflow already satisfies the requirement and a new mechanism would be unapproved scope.

## Decision 2: Treat preflight safety as the authorization boundary

**Decision**: A clearly identified coordinator outside #220-#234 becomes routing-authorized only when the request explicitly includes `parallel` and the existing sidecar preflight can establish complete, current, consistent, and safe context. Unsafe context stops with a specific blocker.

**Rationale**: This retains the accepted fail-closed model without carrying forward fixture identity. Labels, titles, branch prefixes, or private context remain insufficient safety evidence.

**Alternatives considered**:

- Require a `parallel-ready` label: rejected because current sources explicitly make preflight evidence authoritative and prohibit inventing such a label.
- Route first and discover safety during child execution: rejected because unsafe work must stop before artifact writing, Git/worktree orchestration, fan-out, or child dispatch.

## Decision 3: Validate with the existing sidecar suite and a focused manual matrix

**Decision**: Use the eight-row contract in `contracts/active-sidecar-routing.md`, run every applicable #252-#259 focused scenario on its prescribed shell, update only the #258 assertion that still requires dormancy, and perform the exact search/diff checks required by #261.

**Rationale**: No reusable #261 routing script exists. The matrix is small and semantic; the existing simulations already provide executable lifecycle and protected-operation coverage. A new workflow framework or test harness is unnecessary.

**Alternatives considered**:

- Rewrite historical #260 evidence or older feature contracts: rejected because those artifacts describe their issue-time state and `specs/034-*` is explicitly immutable.
- Add a broad new routing parser: rejected as disproportionate and brittle for a bounded Markdown routing contract.

## Unresolved Decisions

None. The accepted #260 design and explicit #261 instructions resolve all material choices.
