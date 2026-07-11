# Contract: Dependency-Layer Fan-Out and Child Handoffs

This contract defines the objective review target for issue #255. It describes
future sidecar workflow behavior and remains dormant for real product use until
#261 activates sidecar routing.

## Fan-Out Readiness

The sidecar coordinator may attempt child handoff launch only after:

- coordinator preflight, source-of-truth review, child issue inspection, and
  dependency classification have passed;
- coordinator and child artifacts are safely prepared;
- the coordinator branch/worktree exists and owns artifact writing;
- child branch/worktree state is ready for the first dependency-ready layer;
- shared implementation contract state is present and non-conflicting;
- complete prepared-handoff content is recorded as `handoff-ready` in an exact
  pushed coordinator evidence commit, and a later pushed recording head stores
  and contains that evidence SHA;
- the local Codex environment exposes an approved child-agent/subagent
  execution capability that can hold the same accepted child in preflight-only
  state and later release that exact child identity.

If child-agent/subagent execution is unavailable, the coordinator stops and
records a capability blocker. It must not silently use the sequential issue
workflow instead.

## Two-Phase Held Dispatch Barrier

Child dispatch uses a narrow two-phase barrier. It is not an atomic transaction.
It does not require a filesystem lock, daemon, queue, generic IPC service, or
indefinite polling.

The coordinator first commits and normally pushes the coordinator artifact and
prepared child artifacts as exact handoff-ready evidence `H`. Once `H` exists,
one later bounded recording commit `R` stores its literal SHA. Before dispatch,
the fetched remote ref must equal `R` and Git ancestry must prove that `R`
contains `H`. The dispatch envelope binds the run ID, child issue, child branch
and worktree, exact `H`, current `R`, and the canonical prepared-handoff identity
fingerprint. No
commit is required to contain its own SHA. The approved child-agent capability
must return unambiguous acceptance plus a stable child/task identity for the
same logical child that will later be released.

### Canonical Prepared-Handoff Fingerprint v1

The prepared-handoff fingerprint is computed before evidence commit `H`. Its
canonical payload is one PowerShell `[ordered]` object with exactly these fields
in this order and with these types:

| Field | Type / value |
|-------|--------------|
| `Schema` | string literal `sidecar-prepared-handoff-v1` |
| `RunId` | string |
| `CoordinatorIssueNumber` | integer |
| `ChildIssueNumber` | integer |
| `CoordinatorBranch` | string |
| `CoordinatorRemoteBranch` | string |
| `CoordinatorWorktree` | string |
| `ChildBranch` | string |
| `ChildWorktree` | string |
| `ControlRevision` | 40-hex string |
| `PreparedSpec` | string |
| `PreparedPlan` | string |
| `PreparedTasks` | string |
| `DependencyLayer` | integer |
| `HardDependencies` | sorted integer array |
| `PrTargetBranch` | string equal to the coordinator branch |
| `PrRelatedReferences` | exact ordered string array `Related to #<child>`, `Related to #<coordinator>` |
| `ArtifactPreparationState` | string literal `handoff-ready` |
| `LaunchState` | string literal `pending` |
| `ImplementationPermission` | Boolean `false` |
| `DeliveryPermission` | Boolean `false` |

Serialize that object exactly with `ConvertTo-Json -Compress -Depth 4`, encode
the result as UTF-8 bytes, and compute SHA-256 as 64 lowercase hexadecimal
characters. Evidence/recording SHAs `H`, `R`, `L`, and `A`, child-agent or
dispatch identity, and the fingerprint itself are never payload fields; they
are correlated separately. Prepared artifact content is validated separately
and is not embedded in a self-containing fingerprint payload.

| Barrier point | Artifact preparation | Factual launch state | Implementation / delivery permission | Required evidence and allowed child action |
|---------------|----------------------|----------------------|--------------------------------------|--------------------------------------------|
| Remote handoff ready | `handoff-ready` | Existing non-launched state, normally `pending` | false / false | Exact evidence `H` contains the prepared handoff; current fetched record head `R` stores and ancestry-contains `H`; no child has been dispatched |
| Held dispatch accepted | `handoff-ready` | Dispatch occurred, but the durable artifact still contains the prior non-launched state | false / false | Stable accepted child/task identity is correlated to the exact dispatch envelope; the child may perform preflight only and must make zero repository edits |
| Remote launched state verified | `handoff-ready` | `launched` | true / true, still subject to child revalidation and normal completion gates | Exact pushed evidence `L` records factual `launched`; later activation head `A` stores and ancestry-contains `L`; the current fetched remote ref equals `A`; the child remains held |
| Exact child released | `handoff-ready` | `launched` | true / true, subject to revalidation | The same held child incorporates current activation head `A`, verifies factual evidence `L` in ancestry plus matching identity and a clean worktree, acknowledges release, and only then starts prepared tasks |

`launched` keeps its factual meaning: the prepared handoff was successfully
dispatched through the approved child-agent capability. It is never intent,
planned launch, or advance authorization. The coordinator records `launched`
only after dispatch acceptance, commits and normally pushes exact evidence `L`,
then pushes one bounded activation/recording commit `A` that stores `L`. It
fetches and verifies current remote equality to `A` plus ancestry containment of
`L`, and then releases only the stable child/task identity correlated with that
evidence. For a dependency-ready batch, every accepted child remains non-editing
until the batch's factual launch evidence and activation records are durable.

A rejected dispatch records no `launched` state, gives no implementation or
delivery permission, performs no child edit, and records the definite child as
blocked with the factual reason. An ambiguous dispatch is not retried blindly:
it records no `launched` for the ambiguous child, creates no duplicate dispatch,
keeps affected children unreleased and non-editing, and stops with the exact
ambiguity. If handoff-ready evidence `H` is durable but the later recording head
`R` cannot be pushed or verified, no child is dispatched, no `launched` state is
recorded, all permissions remain false, and later-layer children remain waiting.
If factual launched evidence `L` cannot be committed or pushed after accepted
dispatch, every accepted child stays held, the remote is not described as
containing launched evidence, effective permissions remain false, and no edit,
delivery, or release occurs.
If factual launched evidence `L` is durable after accepted dispatch but the
later activation/recording head `A` cannot be pushed or verified, factual
`launched` is retained for each accepted child, but every child stays held with
effective implementation and delivery permissions false; no edit, delivery, or
release occurs. If activation-head incorporation, launched-evidence ancestry
verification, or targeted release fails, the child remains non-editing; durable
factual `launched` evidence is not rolled back merely because release failed.

## Dependency Layers

Dependency layers are built from:

- child issue dependencies;
- hard dependency state;
- current coordinator branch merge state;
- shared implementation contract state;
- conflict risks;
- prepared artifact state;
- child branch/worktree state;
- current repository evidence.

The coordinator launches at most one dependency-ready layer at a time. Later
layers remain pending or waiting for dependency merges until prerequisite child
PRs are merged into the coordinator branch and current coordinator state records
that merge observation.

Children with unresolved shared-contract blockers or non-mechanical conflict
risks requiring user guidance are not launch-ready.

## Child Handoff

Each selected child agent receives exactly one child issue and one prepared
handoff while held in preflight; factual `launched` follows only after
unambiguous dispatch acceptance. The handoff includes:

- coordinator issue context and relevant source references;
- child issue body, title, state, labels, dependencies, validation
  requirements, and out-of-scope boundaries;
- prepared child `spec.md`, `plan.md`, and `tasks.md` paths and content
  summaries;
- shared implementation contract references and constraints;
- dependency layer and readiness evidence;
- the exact pushed handoff-ready evidence SHA, current containing remote record
  head, and prepared-handoff fingerprint;
- coordinator branch/worktree context;
- child branch/worktree context;
- child PR target rules;
- issue-reference wording rules;
- validation commands or manual evidence;
- explicit blocker, freshness, refresh, and cleanup reporting expectations.

During held preflight and until targeted durable continuation begins, the child
may validate only its run and child identity, branch/worktree, prepared
artifacts, dependency layer, handoff-ready evidence SHA and containing record
head, fingerprint, and false implementation/delivery permissions. It must not
edit, stage, execute prepared tasks, commit, push, open or update a PR, or
mutate GitHub. After factual launched evidence and its activation/recording head
are remotely durable, targeted continuation authorizes only the same child to
incorporate the activation head by an allowed normal fast-forward or normal
merge while implementation/delivery remain false, verify the launched evidence
in ancestry and continued clean worktree, and acknowledge release before
implementation begins. Its child branch may remain behind during read-only
preflight.

The handoff must instruct the child agent not to:

- regenerate `spec.md`, `plan.md`, or `tasks.md`;
- redefine shared contracts;
- create sibling scope;
- mutate GitHub issues, labels, comments, milestones, or assignees;
- target `main` for sidecar child branches or child PRs.

## Coordinator Artifact Status

The coordinator artifact records every child with one of these launch states:

- `launched`: the approved held dispatch returned unambiguous acceptance and a
  stable identity for the child handoff in the current dependency-ready layer;
- `blocked`: the child cannot launch because a blocker affects it or the layer;
- `pending`: the child is not in the currently launched layer;
- `waiting-for-dependency-merge`: the child is in a later layer that depends on
  prerequisite child work being merged into the coordinator branch.

Every non-launched child must include a clear reason. The artifact must not
imply that child work, child branches, child worktrees, child PRs, validation,
or merges exist before those states are real.

`handoff-ready` is a separate artifact-preparation state, not a launch state.
It coexists with a factual non-launched state until held dispatch is accepted.
Later-layer children remain `pending` or `waiting-for-dependency-merge`; the
dispatch barrier does not make them eligible early.

## Validation Contract

Validation must include:

- simulation of a coordinator with three independent children that produces
  three child handoffs for one layer;
- simulation of hard dependencies where only the first layer launches;
- simulation of a shared-contract blocker that stops affected fan-out;
- simulation of missing launch prerequisites that blocks affected handoffs;
- simulation of a non-mechanical conflict risk that blocks affected fan-out;
- simulation of unavailable child-agent capability that stops instead of
  falling back to sequential implementation;
- review of sample child handoff contents against the sidecar child skill
  requirements;
- simulation that exact handoff-ready evidence plus its later containing record
  head are verified before dispatch, a clean behind child remains unchanged,
  `launched` is absent before acceptance, accepted dispatch returns a stable
  exact child identity, factual launched evidence plus its later containing
  activation head become remotely durable before release, and a later
  dependency child remains waiting;
- review proving no evidence commit is required to contain its own SHA and
  current remote equality is evaluated against the later recording/activation
  head while ancestry validates the earlier evidence SHA;
- focused canonical-fingerprint recomputation using the exact v1 ordered payload,
  JSON serialization, UTF-8 encoding, and lowercase SHA-256 contract, including
  proof that `H`, `R`, `L`, `A`, agent identity, and the fingerprint itself are
  excluded and remain separate correlation fields;
- simulations that rejected and ambiguous dispatches record no launched state
  for the affected child, attempt no duplicate dispatch, release no child, and
  perform zero child repository edits;
- simulation that durable handoff-ready evidence `H` followed by failed
  recording-head `R` push or verification performs no dispatch, records no
  launched state, performs zero edits, and leaves the later child waiting;
- simulation that accepted dispatch plus durable factual launched evidence `L`
  followed by failed activation-head `A` push or verification retains factual
  launched state while keeping the exact children held with effective
  permissions false and permitting no edit, delivery, or release; the later
  child remains waiting;
- review that coordinator artifacts record launched, blocked, pending, and
  waiting-for-dependency-merge states with non-launch reasons;
- `git diff --check`.
