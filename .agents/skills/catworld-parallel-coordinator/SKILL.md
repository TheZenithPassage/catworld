---
name: "catworld-parallel-coordinator"
description: "Preflight CatWorld coordinator issues, prepare sidecar artifacts and Git state, and launch one dependency-ready child handoff layer for explicit opt-in parallel execution without changing the existing sequential implementation workflow."
compatibility: "Requires the CatWorld repository, GitHub issue context, and the sidecar workflow guardrails from issues #220-#261"
metadata:
  author: "catworld"
  source: "issues-226-232,252-261"
---

# CatWorld Parallel Coordinator

Use this sidecar entrypoint only for an explicit CatWorld coordinator issue
request that includes the `parallel` keyword. Such a request may enter the
read-only authorization preflight defined by the Routing Boundary, but it does
not become a `routing-authorized run` and must not perform a sidecar mutation
until every required preflight and safety check passes. Sidecar routing is a
controlled explicit opt-in and never replaces the sequential default.

This skill began as the preflight-only sidecar entrypoint introduced by issue
#226. Issue #227 extends the same sidecar skill with coordinator and child
artifact preparation before delegation. Issue #229 adds the sidecar Git
execution model: coordinator and child branch state, isolated checkout/worktree
state, merge-only refresh rules, and cleanup boundaries. Issue #230 adds
sidecar PR target, issue closure, GitHub mutation, public comment, and remote
cleanup approval rules. Issue #231 adds sidecar validation, blocker, conflict,
stale-evidence, readiness, and human-only blocker reporting rules. Issue #232
adds resumable state tracking for paused or resumed sidecar coordinator runs,
including child status, resume re-read evidence, refresh state, stale
validation, and cleanup eligibility. Issue #252 makes the coordinator
orchestration artifact execution-capable: it defines durable run identity,
write-gated artifact creation, factual state updates, and same-run resume
versus collision-stop handling. Issue #253 makes prepared child Spec Kit
artifacts a coordinator responsibility before sidecar delegation: each child
requires issue-numbered `spec.md`, `plan.md`, and `tasks.md` artifacts, explicit
preparation status, write-gate evidence, shared-contract validation, and
handoff instructions that forbid child-side regeneration. Issue #254 makes the
approved sidecar branch/worktree orchestration executable for the activated
sidecar coordinator lifecycle: coordinator branches and worktrees,
normal non-force coordinator pushes, child branches from the coordinator
branch, isolated child worktrees, and collision/dirty/unsafe-push stop behavior
are prepared and recorded before child delivery can proceed. Issue #255 adds
dependency-layer fan-out for the activated lifecycle: after prepared
child artifacts and branch/worktree state are ready, the coordinator launches
only the first dependency-ready layer, stops on unavailable child-agent
capability instead of falling back to sequential work, and gives each selected
child exactly one prepared handoff. Issue #256 makes the child side of that
handoff execution-capable once its launch and permissions are durable: the
released child validates its prepared checkout and branch, implements only
prepared `tasks.md` work, reports explicit validation statuses, and may commit,
push normally, and open or update a child PR against the coordinator branch
when the handoff and repository rules permit delivery.
Issue #257 makes coordinator resume merge-aware after user-owned child PR
merges: the coordinator re-reads current GitHub and repository evidence,
fetches and refreshes local coordinator state from the remote coordinator
branch before active child refresh, marks affected validation stale, records
integrated/active/blocked/pending/ready-next-layer child states, and launches a
next dependency-ready layer only when hard dependencies are integrated into the
updated local coordinator branch.
Issue #258 makes the final coordinator boundary executable: after every
prepared child is ancestry-proven integrated, the coordinator runs complete
integrated validation at `H`, commits only the factual finalization artifact as
direct child `H2`, proves and validates that artifact-only delta, pushes H2
normally and verifies the remote coordinator ref, reviews the PR-equivalent
scope, and opens one ready coordinator-to-`main` PR only when current evidence
remains fresh.
Issue #259 makes post-final-merge local cleanup executable without changing
tracked coordinator history: it resolves one minimal cleanup journal beneath
the Git common directory, requires an exact stable run identity and current
same-run final-merge evidence, fails closed on missing authority, unknown
ownership, dirty worktrees, or inconsistent state, removes owned worktrees
before associated non-force local branch deletion, and records factual skipped,
attempted, partial, and final outcomes. Issue #260 completed end-to-end and
cross-workflow validation of the assembled sidecar lifecycle through its
controlled dry-run fixture. The coordinator still does not merge,
approve, enable auto-merge, mutate GitHub issues, post public comments, run any
other live dry-run, replace the normal sequential implementation workflow, or
perform user-owned child PR merges. Issue #261 replaces the former fixture-only
gate with the general controlled routing boundary below.

The first controlled #260 attempt exposed a launch-state circularity: factual
`launched` required a real dispatch, while the child required durable launched
evidence before it could accept the handoff. The explicitly approved #260
continuation resolves only that bounded defect with the two-phase held-dispatch
barrier below. The barrier uses one stable named child identity from preflight
through targeted continuation; it is not an atomic transaction and does not add
a lock, queue, daemon, IPC service, transaction framework, or polling system.

## Routing Boundary

An explicit coordinator `parallel` request is a **routing candidate** only when
current issue evidence clearly identifies exactly one coordinator issue and the
issue is not in the permanent #220 through #234 parallel exclusion. The
candidate may enter read-only authorization preflight in this skill.

A candidate becomes a **routing-authorized run** only after current coordinator,
child, dependency, source-of-truth, child-agent capability, repository, and
GitHub evidence is complete, consistent, unambiguous, and safe. Labels, titles,
branch prefixes, prior fixture identity, stale artifacts, or private
conversation do not substitute for that predicate. Missing, stale, ambiguous,
duplicate, unrelated, contradictory, unavailable, or unsafe evidence fails closed
with an explicit blocker.

Until the predicate passes, allow only read-only evidence collection,
classification, dependency analysis, and artifact path/content planning. Stop
before artifact writing, branch or worktree creation or mutation, pushes, child
dispatch, implementation, pull-request operations, issue mutation, or cleanup.

- Normal implementable issues use the existing sequential workflow.
- Direct child issues use the existing sequential workflow.
- `parallel` on a non-coordinator issue is invalid. Stop and report that
  parallel mode applies only to coordinator issues.
- `parallel` on a direct child issue is invalid. Stop and report that direct
  child requests cannot self-select sidecar execution; a separate direct-child
  request without `parallel` uses the existing sequential workflow.
- Issues #220 through #234 must not route through parallel mode. Use the current
  sequential workflow guardrails for those issues.
- A routing candidate starts or resumes the executable sidecar lifecycle only
  after coordinator preflight, source-of-truth review, child issue inspection,
  dependency classification, capability review, and repository/GitHub safety
  checks authorize the run.
- An unsafe routing candidate stops at the failing authorization check with the
  exact blocker and no downstream mutation. It must not fall back silently to
  sequential implementation.
- Coordinator end-to-end requests without `parallel` are not handled by this
  sidecar entrypoint. Apply the existing routing contract:
  - if any listed child issue is still open, stop with the existing coordinator
    routing error;
  - if all listed child issues are closed, use the existing sequential
    end-to-end workflow for the coordinator final pass;
  - the closed-child coordinator final pass is not a separate workflow and must
    not redo closed child scope.
- When a routing-authorized run is waiting for user-owned merges, report the
  exact child PRs that must be merged into the remote coordinator branch before
  resume.
- When a routing-authorized run resumes after user-owned merges, re-read
  current GitHub and repository evidence before continuing from recorded state.

## Required Context

Before any preflight decision, read:

- `AGENTS.md`;
- `.specify/memory/constitution.md`;
- `docs/ARCHITECTURE.md`;
- the full coordinator issue body, title, state, labels, and listed child
  issue references;
- each listed child issue body, title, state, labels, dependencies, and
  source-of-truth references;
- applicable feature artifacts under `specs/` when they exist for the
  coordinator or child issues.

If any required context cannot be read, stop before implementation and report
the missing context.

## Coordinator Classification

Classify the issue as a coordinator only when the issue body clearly identifies
coordinator or epic behavior and lists child issues or sub-issues whose work
must be inspected before execution.

Stop with a routing error when:

- the issue is a normal implementable issue;
- the issue is a direct child issue;
- the issue appears to be a coordinator but child issues cannot be found;
- the issue cannot be classified after reading it.

## Preflight Readiness

Parallel readiness is an authorization result, not an issue label. Do not
require, invent, add, or route based on a required `parallel-ready` label.

Determine readiness through:

- coordinator issue inspection;
- child issue inspection;
- dependency classification;
- source-of-truth review;
- stable child-agent capability review; and
- current repository and GitHub safety review.

All required authorization evidence must pass before artifact writing or any
Git, GitHub, dispatch, implementation, delivery, or cleanup mutation.

Classify child issue relationships before any parallel execution:

- **Hard dependency**: one child requires another child's result before it can
  be implemented safely. Do not parallelize blindly.
- **Conflict risk**: children likely touch the same source files, shared
  workflow rules, shared contracts, migrations, authorization, persistence,
  global styles, or other cross-cutting surfaces. Stop or require explicit
  sequencing before parallel execution.
- **Independent candidate**: children appear to touch disjoint source maps and
  have no unresolved dependency or source-of-truth conflict. This classification
  alone is not authorization to launch execution; every routing predicate and
  lifecycle gate must still pass.
- **Incomplete context**: child issue data, feature artifacts, source maps, or
  governing documentation are missing or contradictory. Stop.

## Source-of-Truth Review

Compare the coordinator and child issue bodies against:

- `AGENTS.md` routing guardrails;
- the CatWorld constitution;
- `docs/ARCHITECTURE.md` workflow routing and sidecar artifact path guidance;
- relevant `spec.md`, `plan.md`, and `tasks.md` artifacts when present;
- issue #220 sidecar architecture and issues #221, #222, #225, #226, #227,
  #228, #229, #230, #231, #232, #249, #250, #251, #252, #253, #254, #255,
  #256, #257, #258, #259, #260, and #261
  when their routing, entrypoint, artifact, lifecycle, child handoff, Git
  execution, fan-out, PR delivery, validation reporting, resume state, or
  merge-aware resume, integrated validation, two-head finalization, final
  coordinator delivery, cleanup, held-dispatch correction, or activation
  contracts apply.

Stop when source-of-truth documents conflict, contain unresolved blocking
decisions, require pending human approval, or would require changing approved
scope.

## Executable Run Lifecycle

The read-only authorization stages below apply to a routing candidate. The
mutation-capable lifecycle is executable only after the candidate becomes a
routing-authorized run. States 1 through 5 must stop at any failed predicate;
State 6 and every later mutation-capable state are unavailable until all
authorization evidence passes.

Each state has explicit entry conditions, stop conditions, and allowed next
states. If a stop condition applies, report the current state, evidence read,
blocking condition, and user action required when applicable.

| State | Entry Conditions | Stop Conditions | Allowed Next States |
|-------|------------------|-----------------|---------------------|
| 1. New coordinator `parallel` run | Prompt explicitly names one coordinator issue, includes `parallel`, and is not in the #220 through #234 exclusion. | Issue is not a coordinator; issue is ambiguous; required context cannot be read; request is excluded. | Read-only coordinator authorization preflight. |
| 2. Coordinator authorization preflight | New or resumed routing candidate passes the initial routing boundary. | Coordinator is ineligible, lacks listed children, or has missing, stale, contradictory, unavailable, or unsafe authorization evidence. Stop before mutation. | Source-of-truth and child issue inspection. |
| 3. Source-of-truth and child issue inspection | Coordinator issue and listed children are known. | Child issue context is missing or contradictory; child state conflicts with requested route; governing artifacts conflict. | Artifact path/content planning; dependency-layer planning. |
| 4. Artifact path and content planning | Required issue and source context has been read. | Unresumable target path collision; duplicate child issue number; missing source contract; unresolved blocker. | Dependency-layer planning; coordinator branch/worktree preparation. |
| 5. Dependency-layer planning | Child issue map and source maps are available. | Hard dependencies cannot be ordered; conflict risk requires user sequencing; missing shared contract. | Coordinator branch/worktree preparation; report blocker. |
| 6. Coordinator branch/worktree preparation | Artifact paths and contents are planned; branch/worktree targets are computed; every authorization predicate has passed and the run is routing-authorized. | Authorization is incomplete or stale; cannot create or enter coordinator branch/worktree safely; target collision; operation would modify local `main`. | Coordinator and child artifact writing. |
| 7. Coordinator and child artifact writing | Codex is inside the coordinator branch/worktree. | Artifact write would occur outside coordinator branch/worktree; artifact conflicts with approved scope. | Child branch/worktree preparation. |
| 8. Child branch/worktree preparation | Dependency-ready child layer exists and artifacts are written. | Child branch/worktree cannot be prepared safely from coordinator branch; collision; child target would be `main`. | Child handoff and child-agent launch for one dependency-ready layer. |
| 9. Two-phase child handoff and held dispatch for one dependency-ready layer | One dependency-ready layer has handoff-ready child artifacts, valid Git context, validation requirements, PR target rules, out-of-scope boundaries, an exact pushed handoff-ready evidence SHA plus a current remote recording head that contains it, and stable held-child capability. | Missing handoff data; held child capability is unavailable or ambiguous; handoff-ready evidence/recording state is not durable; sequential fallback or replacement identity would be required; a hard-dependent layer would start early; unresolved shared-contract blocker; non-mechanical conflict risk; child scope unresolved. | Factual launch-state persistence; targeted release; child implementation and child PR delivery; report blocker. |
| 10. Child implementation and child PR delivery | The exact held child has been factually launched; exact launched evidence and its current activation/recording head are normally pushed, fetched, ancestry-proven, and identity-correlated; that same child incorporated the activation head and verified the launched evidence while clean before release. | Launch evidence/recording push, equality or ancestry, child identity, refresh, clean-state, release, validation, PR target, or issue wording is invalid; child blocker remains. | Waiting for user merges; report blocked/resume-needed state. |
| 11. Waiting for user merges into remote coordinator branch | One or more child PRs are ready or draft for user review. | Required child PRs remain unmerged; GitHub state cannot be read; user-owned merge is pending. | Resume after user merges. |
| 12. Resume after user merges | User indicates child PRs were merged, or current evidence shows merge progress. | Required GitHub/repository evidence is missing, stale, or conflicts with recorded coordinator artifact state; resume would depend on private conversation context. | Fetch and refresh local coordinator branch/worktree. |
| 13. Fetch and refresh local coordinator branch/worktree | Remote coordinator branch contains or may contain user-owned child merges. | Fetch fails; local coordinator state has unexpected local changes, missing branch state, unsafe divergence, stale evidence, or conflicts; refresh would require rebase, force-push, force-with-lease, history rewriting, local `main` updates, deletion, or issue mutation. | Active child branch refresh; dependency-layer recomputation; integrated coordinator validation. |
| 14. Active child branch refresh | Local coordinator branch/worktree has been refreshed from the remote coordinator branch and still-active child branches/worktrees need updated coordinator state. | Refresh would use stale local coordinator state; refresh would require rebase, force-push, force-with-lease, history rewrite, resource deletion, or unresolved conflict. | Dependency-layer recomputation; next dependency layer execution; waiting for user guidance. |
| 15. Next dependency layer execution | Dependency layers have been recomputed from current issue, PR, artifact, branch, validation, and blocker evidence after observed merges and refresh. | Hard dependencies are not integrated into the updated local coordinator branch; next layer has unresolved blockers, child-agent capability blocker, stale required evidence, unsafe dependency state, or conflict risk. | Child branch/worktree preparation; integrated coordinator validation. |
| 16. Integrated coordinator validation | Current GitHub/repository evidence has been re-read; the prepared-child ledger is complete and unique; every child PR targets and is merged into the coordinator branch; every exact delivered child commit is present in refreshed coordinator ancestry; no child is active, blocked, pending, dependency-incomplete, missing, duplicate, or unexpected. | Evidence conflicts with the artifact; child accounting or exact ancestry is incomplete; another child layer remains possible; any required or consumed validation is failed, skipped, timed out, interrupted, partial, stale, blocked, not run, unavailable, or dishonest to claim; `H`/`H2` evidence is invalid; target base/head evidence moved; integrated scope contains an unexplained change. | Final coordinator PR to `main`; report blocker. |
| 17. Final coordinator PR to `main` | Complete checks passed at `H`; `H2` is the direct artifact-only child; all H2-affected checks passed in current evidence; the remote coordinator ref equals H2 after a normal non-force push; target-base, merge-base, local/remote head, ancestry, scope, validation, template, and existing-PR evidence were rechecked and remain fresh. | A final PR already exists with stale or inconsistent state; same-run identity is ambiguous; source, target, template, issue wording, closing authority, or readiness is invalid; a required check regressed; push was rejected or remote ref differs; a draft fallback or duplicate would be required. | Post-final-merge local cleanup; report blocker. |
| 18. Post-final-merge local cleanup | Current read-only evidence identifies exactly one same-run final coordinator PR with the expected coordinator source and H2 head, `main` base, merged state, and exact proof that H2 is an ancestor of current fetched `origin/main`; an exact stable run ID and the artifact-owned local resource records are available. | Merge metadata exists without H2 ancestry, or merge, run-identity, ownership, Git-common-directory, live resource, cleanliness, control-checkout, cleanup-authority, or journal evidence is missing, stale, unknown, dirty, unwritable, or inconsistent; a local removal or required journal update fails. | Report `ineligible`, `not_started`, `blocked`, `partial`, or `completed` local cleanup state; no remote cleanup transition exists. |

### Operation Ownership

Codex may inspect issues and PRs read-only, plan artifacts, prepare allowed
local branches/worktrees after routing authorization, write artifacts only
inside the coordinator branch/worktree, commit/push handoff-ready evidence,
dispatch dependency-ready children in held preflight-only mode when stable
child-agent capability is available, persist factual launch evidence, target
the same stable identities for release, report PR readiness, refresh local
sidecar branches by allowed methods, prepare final coordinator validation
evidence, push the artifact-only H2 normally, and create or safely update one
ready final coordinator PR only after the detailed finalization gate passes.
After current
evidence confirms the final merge, Codex may evaluate local cleanup and, only
with explicit current cleanup authority and every cleanup preflight gate passed,
remove the exact same-run-owned local worktrees and branches through the local
cleanup procedure below. Eligibility alone never authorizes deletion.

The user owns all merges. For sidecar child PRs into the remote coordinator
branch and the final sidecar coordinator PR into `main`, the user must select
GitHub's **"Create a merge commit"** method. **"Squash and merge"** and
**"Rebase and merge"** are prohibited because the exact delivered child commit
and exact H2, respectively, must remain in downstream ancestry. This is a
sidecar operator contract only; normal non-sidecar PR merge behavior is
unchanged. Codex must not merge, approve, enable auto-merge, or modify repository
merge settings. GitHub issue mutations, public comments, remote branch deletion,
remote pruning, and remote cleanup require explicit user approval in a workflow
that permits the operation.

The #259 local cleanup phase never deletes or otherwise cleans up remote
branches, prunes remotes or remote-tracking refs, or mutates GitHub state.
Read-only GitHub and repository evidence collection remains allowed.

### Dependency Layers

Build dependency layers from child issue dependencies, conflict risks, shared
implementation contract state, prepared artifact state, branch/worktree state,
and current repository/coordinator branch evidence. Do not rely on issue order
alone.

Launch at most one dependency-ready layer at a time. Multiple child issues in
the same layer may be handed off only when they are independent candidates, all
required child artifacts and branch/worktree context are handoff-ready, and
there is no unresolved conflict risk. After observed child PR merges, recompute
dependency layers from current child issue dependencies, PR merge status,
integrated child state, active/blocked/pending child state, shared contract
state, conflict risk, validation freshness, and updated local coordinator
branch state. A hard-dependent layer must wait until all prerequisite child PRs
are merged into the remote coordinator branch, the local coordinator
branch/worktree has been refreshed from that remote coordinator branch,
affected active child branches/worktrees have been refreshed by an allowed
method, and required validation state is known. Stale validation must remain
reported as stale until rerun and must not support ready status.

For every child, record one launch state in the coordinator artifact:

- `launched`: the approved capability accepted one prepared handoff for the
  current dependency-ready layer and returned one unambiguous stable canonical
  child identity; this factual state does not by itself grant implementation or
  delivery permission;
- `blocked`: a child-specific, coordinator-wide, shared-contract, conflict, or
  human-only blocker prevents launch;
- `pending`: the child is not in the current launched layer;
- `waiting-for-dependency-merge`: the child depends on prerequisite child work
  that has not yet been merged into the coordinator branch.

Every non-launched child must include a clear reason. A later layer is not
dependency-ready merely because its artifacts or branch/worktree already exist.
`handoff-ready` remains an artifact-preparation state, not a factual launch
state. Before dispatch, a selected child is normally `handoff-ready` with
launch state `pending`, implementation permission false, delivery permission
false, and a non-launch reason that the held dispatch barrier is pending.

On resume, also record workflow/integration state separately from the launch
state when applicable:

- `integrated`: the child's PR is merged into the remote coordinator branch and
  local coordinator state has been refreshed from that remote branch;
- `active`: the child remains in progress and may need refresh from the updated
  local coordinator branch;
- `ready-next-layer`: the child belongs to the next dependency-ready layer
  after hard dependencies are integrated into the updated local coordinator
  branch and no blocker prevents launch.

### Child Handoff and Child-Agent Launch

Before launching child agents for the first dependency-ready layer, verify that
the active Codex environment exposes an approved child-agent/subagent execution
capability that retains one stable child/task identity across a preflight-only
dispatch and a later targeted continuation. The capability must make the child
unable to enter implementation before continuation. In the #260 environment,
`spawn_agent` returns the stable canonical child identity and `followup_task`
targets that same identity after the preflight-only turn. A second
`spawn_agent` call is another child and must not be treated as a continuation.

If stable held dispatch or targeted continuation is unavailable, ambiguous, or
cannot be proven harmless, stop and record a coordinator-wide capability
blocker. Do not silently switch to sequential implementation, a fire-and-forget
child, indefinite polling, a filesystem lock, an ad hoc queue, a daemon, a
generic IPC service, or a transaction framework.

#### Canonical Prepared-Handoff Fingerprint

Before creating handoff-ready evidence, compute the exact
`sidecar-prepared-handoff-v1` fingerprint shared with the child contract. Build
a PowerShell `[ordered]` object with these properties in exact order and type:
`Schema` string; `RunId` string; `CoordinatorIssueNumber` integer;
`ChildIssueNumber` integer; `CoordinatorBranch` string;
`CoordinatorRemoteBranch` string; `CoordinatorWorktree` string; `ChildBranch`
string; `ChildWorktree` string; `ControlRevision` exact 40-hex string;
`PreparedSpec`, `PreparedPlan`, and `PreparedTasks` repository-relative path
strings; `DependencyLayer` integer; `HardDependencies` ascending integer array;
`PrTargetBranch` string; `PrRelatedReferences` exact child-then-coordinator
two-string array; `ArtifactPreparationState` string `handoff-ready`;
`LaunchState` string `pending`; and Boolean `ImplementationPermission` and
`DeliveryPermission`, both false.

Serialize with `ConvertTo-Json -Compress -Depth 4`, hash the JSON's UTF-8 bytes
with SHA-256, and encode 64 lowercase hexadecimal characters without a prefix.
The fingerprint, artifact content/blob hashes, evidence SHAs, recording or
activation heads, and child-agent identity are not inputs. Validate prepared
artifact content independently; this prevents a tracked artifact that records
the fingerprint from depending on its own blob identity.

#### Two-Phase Held-Dispatch Barrier

This barrier is ordered and explicitly non-atomic. For one dependency-ready
layer:

1. Complete each selected child's prepared handoff and Git context.
2. Compute the canonical v1 fingerprint, then record preparation
   `handoff-ready`, launch `pending`, implementation permission false, delivery
   permission false, exact child/run/Git identity, that prepared-handoff
   identity fingerprint, and exact immutable control-plane source revision. Do
   not guess or self-reference the not-yet-created commit SHA.
3. Commit and normally push that handoff-ready evidence commit `R`. Fetch the
   remote coordinator ref and prove exact equality to `R`.
4. In one bounded coordinator recording update, store exact `R` as the
   handoff-ready evidence SHA. Commit and normally push recording head `Rr`,
   fetch it, prove the remote ref equals `Rr`, and prove `R` is its ancestor.
   This second commit resolves the otherwise impossible requirement for a
   tracked commit to contain its own SHA; it is not another state subsystem.
5. Dispatch each selected child exactly once in preflight-only mode. The child
   may read and validate only the prepared identity, artifacts, dependency
   layer, branch/worktree, clean state, existing fetched remote handoff-ready
   evidence, and disabled permissions. It must not edit, stage, execute prepared
   tasks, commit, push, open/update a PR, or mutate GitHub state.
6. Treat dispatch as accepted only when the capability returns one unambiguous
   stable canonical child/task identity and that exact child acknowledges the
   preflight-only handoff with implementation permission false. Correlate the
   identity to the run ID, child issue, exact child branch/worktree,
   handoff-ready evidence SHA, containing recording head, and prepared-handoff
   fingerprint.
7. Never record `launched` for a rejected, missing, or ambiguous dispatch. Do
   not retry an ambiguous dispatch or create a replacement child blindly.
8. After accepted dispatch, `launched` is factual because the prepared handoff
   was sent through the approved child-agent capability. Keep the child held.
9. Update the coordinator artifact with factual `launched`, the stable dispatch
   identity, exact `R`, and the launched-head activation contract. Commit and
   normally push factual launched evidence commit `L`. Implementation and
   delivery remain unavailable to the held child while `L` is local or
   unverified.
10. Fetch the remote coordinator ref and prove exact equality to `L`.
11. In one bounded coordinator recording update, store exact `L` as the factual
    launched evidence SHA and set permissions true subject to child
    revalidation. Commit and normally push activation/recording head `Lr`, fetch
    it, prove the remote ref equals `Lr`, and prove `L` is its ancestor. Do not
    require `L` to contain its own SHA.
12. Target only the same stable child/task identity with continuation. Supply
    exact `R`, exact `L`, current remote activation head `Lr`, and current
    permission evidence.
13. Require that child to fetch current remote coordinator evidence, update its
    still-clean child branch to `Lr` by allowed fast-forward or normal merge,
    verify that `Lr` contains `L`, verify the run/child/Git/handoff/dispatch
    identity, factual `launched`, effective implementation and delivery
    permissions, and prove the worktree remained clean through the barrier.
14. Only after that verification may the child acknowledge release and begin
    prepared implementation tasks. Delivery remains additionally gated by
    scoped completion, fresh passing validation, correct target/wording, and no
    blocker.
15. For a multi-child layer, keep every selected child non-editing until factual
    launched evidence and its activation/recording head for all successfully
    accepted children are durable; release only exact identities whose current
    evidence passes every gate.

The prepared handoff exists before dispatch and therefore carries non-launched
state and disabled permissions. The targeted continuation carries both the
exact factual launched evidence SHA and current remote activation/recording head
that contains it, and activates execution only for the same stable identity.
Private conversation alone is never launch or release evidence.

Each selected child agent receives exactly one child issue and one prepared
handoff. The handoff and later continuation together must include:

- coordinator issue context, child issue map, dependency layer, and coordinator
  source references;
- current GitHub and repository evidence re-read before resume or handoff,
  including coordinator issue, child issues, child PR merge status, remote
  coordinator branch state, local coordinator branch/worktree state, active
  child branch state, artifacts, validation freshness, blockers, and cleanup
  approval state;
- child issue number, title, body, state, labels, dependencies, source
  references, validation requirements, and explicit out-of-scope boundaries;
- prepared child `spec.md`, `plan.md`, and `tasks.md` paths and content
  summaries;
- exact immutable control-plane source revision and canonical prepared-handoff
  identity fingerprint;
- shared implementation contract references and constraints;
- coordinator branch local and remote refs, coordinator push status, and
  coordinator checkout/worktree path;
- child branch source ref, expected child branch, expected child
  checkout/worktree path, collision status, clean-state evidence, refresh
  status, and cleanup eligibility;
- exact pushed handoff-ready evidence SHA and current remote recording head that
  contains it, stable dispatch identity when accepted, exact pushed factual
  launched evidence SHA and current remote activation/recording head that
  contains it when durable, and evidence that targeted continuation addresses
  the same identity;
- launch state, implementation permission, delivery permission, each
  permission's remote-head activation condition, proof that held preflight made
  zero repository or GitHub mutation, and proof that targeted continuation made
  only the allowed clean activation-head incorporation before release;
- prepared task scope, including that the child may execute only tasks listed
  in the prepared child `tasks.md` and must not regenerate `spec.md`,
  `plan.md`, or `tasks.md`;
- child PR delivery permission state, target coordinator branch, related-only
  issue-reference wording rules, ready/draft rules, GitHub mutation/public
  comment approval state, and remote cleanup approval state;
- validation commands or manual evidence and freshness requirements;
- blocker, conflict, stale-evidence, ready/draft, resume, and final-reporting
  expectations, including PR URL and commit-hash reporting when delivery
  occurs.

The handoff must instruct the child agent to confirm the prepared checkout and
branch during preflight without editing, and not to regenerate planning artifacts, redefine
shared contracts, create sibling scope, mutate GitHub issues, or target
`main`. Missing or contradictory preflight data blocks dispatch acceptance;
missing or contradictory launched-evidence, activation-head, or release data keeps a factually
launched child held and blocks implementation and delivery.

#### Barrier Failure and Interruption Semantics

- Rejected dispatch: record no `launched`; mark the child blocked with the
  factual capability/dispatch reason; perform no child edit or delivery.
- Ambiguous dispatch: record no `launched`; release no affected child; do not
  retry or create a duplicate; stop with exact identity evidence.
- Launch-evidence or activation/recording commit or normal push failure after
  accepted dispatch: keep the child held; distinguish any factually pushed
  evidence from the missing current activation record, perform no child edit or
  delivery, and stop if normal persistence cannot be completed safely.
- Child refresh, clean-state, activation-head incorporation, or launched-
  evidence ancestry verification failure: keep the child unreleased and perform
  no implementation or delivery.
- Targeted release failure after launched evidence is durable: retain factual
  `launched`, record/report blocked or resume-needed state, and perform no child
  delivery. Do not roll launch state back to pending.
- Parent interruption before release: the bounded child remains held with
  implementation/delivery false, whether idle in preflight or partway through
  targeted barrier incorporation. On resume, re-read current repository/GitHub
  and Git-state evidence plus the exact child-agent identity. If launched is
  recorded but no matching child is verifiably available, do not dispatch a
  replacement blindly; stop on ambiguous active-child state.
- Child failure after release: retain factual `launched`; derive blocked,
  paused, or resume-needed state from current branch/worktree/validation/agent
  evidence and never summarize partial work as complete.

## Sidecar Artifact Preparation

Run artifact preparation only after coordinator classification, required
context loading, source-of-truth review, dependency classification, and routing
guardrails allow the sidecar coordinator path. Do not run artifact preparation
for normal implementable issues, direct child issues, or closed-child
coordinator final passes that enter the existing sequential workflow.

Before creating or describing artifacts, apply the #225 path contract and the
#252 same-run resume boundary:

- coordinator artifacts use `specs/<coordinator-number>-coordinator-<slug>/`;
- child implementation artifacts use `specs/<child-issue-number>-<child-slug>/`;
- duplicate child issue numbers are stop conditions;
- existing target paths or same-number prefixes may be resumed only when the
  existing artifact's durable run identity proves it belongs to the same
  coordinator run; otherwise they are collision stop conditions.

Compute the coordinator target path and every child target path before writing
or reusing any artifact. Stop instead of overwriting, merging, deleting,
silently reusing, or automatically renaming artifacts when an artifact
collides, same-run identity cannot be proven, or any child issue number is
duplicated.

Artifact path and content planning may occur before coordinator branch/worktree
preparation. Artifact file writing must not occur until Codex has created or
entered the coordinator branch/worktree. While the active checkout is `main`,
planning may describe exact paths and contents, but it must not create sidecar
artifact files, sidecar commits, or untracked sidecar files. If Codex cannot
create or enter the coordinator branch/worktree safely, stop before modifying
files and report the planned artifact paths and the blocking condition.

Coordinator and child artifacts are written only inside the coordinator
branch/worktree. Child artifacts are still prepared by the coordinator before
child branch/worktree handoff; a child executor must not repair missing
coordinator artifact state by writing artifacts from its own context.

### Coordinator Orchestration Artifact

Prepare a coordinator orchestration artifact in the coordinator artifact path,
or describe the exact artifact path and content when the current workflow is
running in a dry or read-only preparation mode. Artifact path and content
planning may happen before coordinator branch/worktree preparation, but
artifact file writing must wait until Codex is inside the coordinator
branch/worktree.

The coordinator artifact must include at least:

- one exact stable `run_id` sufficient to prove same-run resume and to identify
  the later Git-common-directory cleanup journal without derivation or guessing;
- coordinator issue number, title, URL, labels, state, classification, and
  source references;
- inspected child issue list;
- parent epic and source references when relevant;
- child issue map with each child issue number, title, state, dependencies,
  source references, artifact path, required `spec.md`/`plan.md`/`tasks.md`
  preparation status, current handoff readiness, launch state, and non-launch
  reason when not launched;
- exact immutable control-plane source revision used by every prepared handoff;
- per-child two-phase dispatch state: prepared-handoff fingerprint, exact
  pushed handoff-ready evidence SHA and current remote recording head containing
  it, implementation/delivery permission, stable dispatch identity when
  accepted, factual launched state, exact pushed launched evidence SHA and
  current remote activation/recording head containing it, targeted-release
  state, pre-release clean/zero-edit evidence, and failure/resume reason when
  applicable;
- dependency layers that identify hard dependencies, independent candidates,
  conflict risks, and incomplete-context blockers;
- unresolved blocker section that distinguishes child-specific,
  coordinator-wide, shared-contract, conflict, and human-only blockers;
- shared implementation contract section that records cross-child contracts,
  source-of-truth references, and unresolved shared-contract blockers;
- child-owned surfaces and shared surfaces requiring caution;
- branch and worktree plan, including the normalized repository Git common
  directory and the exact planned and actually-created coordinator and child
  branch names, refs, normalized checkout/worktree paths, and same-`run_id`
  ownership associations;
- PR target plan, including child PR targets and final coordinator PR target;
- sidecar Git state section that records coordinator branch, coordinator
  checkout/worktree, child branch, child checkout/worktree, child PR target,
  refresh status, cleanup status, and remote-cleanup approval state;
- sidecar PR delivery section that records child PR target, child issue
  reference wording, final coordinator PR target, closure authority, GitHub
  issue mutation approval state, and public comment approval state;
- sidecar validation reporting section that records required coordinator and
  child evidence, historical attempts, exactly one current readiness result per
  requirement and evaluated state, explicit validation statuses, freshness
  state, child PR ready/draft readiness, coordinator readiness, blockers,
  conflicts, and human-only decisions;
- sidecar resume state section that records completed, active, blocked,
  pending, paused, and resume-needed child work; required GitHub and
  repository evidence to re-read before continuing; refresh-needed/refreshed
  state after child PR merges; stale validation state; and cleanup eligibility;
- validation plan for coordinator-level and child-level evidence;
- complete and unique child-integration ledger with child PR target, merge
  observation, refreshed coordinator ancestry proof, and terminal workflow
  state for every prepared child;
- integrated scope-review state with fetched `origin/main` target-base SHA,
  PR-equivalent merge base, changed paths/surfaces, combined coordinator/child
  source-map reconciliation, and unexplained-scope blockers;
- finalization state with runtime `B` (fetched `origin/main` SHA), literal
  validated head `H`, artifact-only `H2` as `SELF/HEAD`, expected parent `H`,
  direct-parent and sole-artifact delta evidence, complete canonical H check
  results, canonical status-free H2 rerun manifest, per-H-check applicability
  reasons, readiness `pending H2 checks`, scope result from H and post-H2
  recheck criteria, final template blob identity, render-input requirements,
  remaining risks, stable same-run final-delivery identity, explicit external
  result locations, and cleanup `ineligible` with reason
  `pending final PR merge`;
- resume/status table for each child issue, including artifact path, branch,
  local checkout/worktree, PR, validation state, workflow status, launch state,
  blockers, dependency layer, readiness, refresh state, cleanup eligibility, and
  required validation;
- stop conditions and final coordinator PR plan.

The artifact must distinguish planned, blocked, prepared, handoff-ready,
launched, integrated, ready, created, observed, stale, passed, failed, pending,
held-preflight, release-pending, released, resume-needed,
pending-H2-checks, waiting-for-dependency-merge, and ineligible states. It must
not imply that a
branch, checkout/worktree, PR, merge, validation result, readiness state,
handoff launch, handoff readiness, or cleanup eligibility exists before that
state is real.

Before writing to an existing coordinator artifact path, verify the existing
artifact's durable run identity against the current coordinator issue number,
URL, title/source context, computed artifact path, and recorded sidecar run
identity or equivalent durable state. Resume only when the artifact is proven
to belong to the same coordinator run. If ownership cannot be proven, stop on
collision before writing; do not overwrite, merge, delete, rename, or silently
reuse the artifact.

Update the coordinator artifact whenever factual sidecar state changes during a
routing-authorized run only until the artifact-only H2 commit freezes it. Before
that boundary, updates may record blocked state, child handoff readiness, child
handoff launch, child PR creation, user merge observation, dependency-merge
waiting state, stale validation, next-layer readiness, terminal child
accounting, H validation completion, and the pending H2 manifest and recheck
criteria. After H2 exists, do not update the branch-bound artifact: resolved H2
checks, final scope/readiness, normal H2 push and fetched remote-H2 proof,
existing or created final PR state, rendered-body fingerprint, returned PR URL,
and final-PR merge confirmation remain current repository/GitHub evidence and
final-report state. Post-final-merge local cleanup eligibility, skipped reasons,
owned-resource state, attempted operations, partial failure, and final result
are recorded separately in the Git-common-directory cleanup journal. That local
journal is outside tracked worktree content, never updates the coordinator
artifact, and is not independent proof of merge, ownership, or cleanup
authority. Do not create H3 or H4 merely to persist any post-H2 evidence. A
blocked coordinator records the blocker, affected scope, evidence read, and
required user action when applicable before the freeze, reports final-delivery
blockers externally after the freeze, and records cleanup blockers in the local
journal when it can be written safely. A journal-write failure is reported
externally and stops cleanup; it never permits an artifact update or another
coordinator commit. A blocked coordinator must not launch child work.

Stop before delegation when the coordinator artifact cannot be prepared safely
because coordinator context, child context, dependencies, source-of-truth
evidence, artifact paths, or shared contracts are missing, contradictory, or
unsafe.

### Child Implementation Artifacts

For each listed child issue, prepare or describe an issue-numbered child
artifact set:

```text
specs/<child-issue-number>-<child-slug>/
├── spec.md
├── plan.md
└── tasks.md
```

Each child artifact set must derive from:

- the coordinator issue body, title, labels, state, and source references;
- the coordinator orchestration artifact;
- the child issue title, body, dependencies, validation requirements, and
  explicit out-of-scope boundaries;
- parent epic context when relevant;
- the child dependency layer and any hard-dependency or conflict-risk notes;
- the shared contract section;
- applicable source-of-truth documentation, existing feature artifacts, and
  current repository state.

Prepared child artifacts must preserve the child issue scope exactly. They must
not expand into sibling child scope, reopen sibling work, create tasks for
sibling-owned surfaces, invent shared-contract or foundation child issues, or
make human-only product, architecture, security, persistence, UX, domain,
GitHub, deployment, or workflow decisions. If any of those decisions or scopes
are unresolved, record the blocker and stop affected delegation.

Validate every child artifact set against the coordinator issue, child issue
body, relevant source-of-truth documentation, and shared contract before
delegation. Stop before delegation when any child artifact expands beyond
approved child scope, omits required validation, conflicts with another child,
or relies on an unresolved shared contract.

Use these child artifact preparation statuses in the coordinator artifact:

- `planned`: the child path and `spec.md`/`plan.md`/`tasks.md` contents are
  planned only; no child artifact files have been written.
- `blocked`: preparation cannot proceed; record the blocker category, evidence,
  affected child or coordinator scope, and required user action when applicable.
- `prepared`: the complete child `spec.md`, `plan.md`, and `tasks.md` set has
  been written inside the coordinator branch/worktree.
- `handoff-ready`: the prepared set passed required scope, shared-contract,
  dependency-layer, write-gate, and source-of-truth checks and may be supplied
  to a dependency-ready child handoff.

Fan-out cannot start for any dependency-ready child unless the coordinator
artifact records that child's artifact path and `handoff-ready` preparation
status, the child branch/worktree state is ready, shared-contract state is
non-conflicting, validation and PR target rules are explicit, and child-agent
capability is available. A child handoff must include the prepared artifact
paths and enough artifact summary for traceability, and it must instruct the
child executor to consume those artifacts without regenerating `spec.md`,
`plan.md`, or `tasks.md` independently. Handoff-ready state must be committed and
normally pushed as exact evidence, then its SHA must be stored by a bounded
recording update that is also pushed and fetched. Before held dispatch, prove
the current remote ref equals that recording head and contains the recorded
evidence SHA by ancestry. It must not preclaim `launched` or
implementation/delivery permission, and no tracked commit may be required to
contain its own SHA.

### Shared Contract and Child Issue Boundaries

Do not require a seed-first child issue and do not invent or create foundation
or shared-contract child issues. If a missing shared contract or foundation
issue appears necessary and it does not already exist, stop before delegation
and ask for user guidance. Create such an issue only when a separately approved
workflow explicitly permits it and the user approves that issue mutation.

This artifact-preparation path is not used when all listed child issues are
closed and the coordinator enters the existing sequential final pass. The final
pass must not redo closed child scope.

Issue #227 added artifact preparation only. Issue #229 added sidecar Git
execution rules. Issue #254 turned the approved sidecar Git rules into
coordinator-owned branch/worktree preparation and remote coordinator branch
push-gate procedures. Issue #230 added sidecar PR target, closure, GitHub mutation,
public comment, and remote cleanup approval rules. Issue #231 added sidecar
validation, blocker, conflict, stale-evidence, readiness, and human-only
blocker reporting rules. At that historical stage it did not open real pull
requests, merge pull requests, mutate GitHub issues, post public comments, run
live dry-runs, or change CatWorld product code. Issue #232 added resumable
coordinator state tracking without running background work, posting GitHub
comments, changing normal issue workflow state, changing CatWorld product code,
or performing cleanup.

## Sidecar Git Execution Rules

Apply these rules only after routing guardrails allow an explicit coordinator
`parallel` request and after coordinator preflight, source-of-truth review,
dependency classification, artifact preparation, and shared-contract validation
have succeeded. Issues #220 through #234 remain excluded from parallel routing
and use the current sequential workflow guardrails.

The coordinator branch/worktree is the sidecar artifact write boundary. Before
writing coordinator or child artifact files, Codex must create or enter the
coordinator branch/worktree. Local `main` must remain clean throughout sidecar
planning: no sidecar artifacts, sidecar commits, or untracked sidecar files may
be written there. If branch/worktree preparation is unsafe or blocked, stop
before modifying files.

### Deterministic Names and Collision Checks

Compute every sidecar branch and checkout/worktree name before creating,
switching to, merging into, pushing, writing artifacts, or reusing any Git
resource.

- Coordinator branch name component: `<coordinator-number>-coordinator-<slug>`.
- Child branch name component: `<child-issue-number>-<child-slug>`.
- Coordinator checkout/worktree directory name component:
  `<coordinator-number>-coordinator-<slug>`.
- Child checkout/worktree directory name component:
  `<child-issue-number>-<child-slug>`.
- Slugs use the #225 slug rule: lowercase, hyphen-separated title text after
  removing issue title prefixes such as `[Workflow]`, `[Epic]`, `feat:`, or
  `docs:`.

The coordinator artifact must record its exact stable `run_id`, the normalized
repository Git common directory, planned and actual full branch names, local
and remote branch refs when they exist, normalized full local
checkout/worktree paths, exact branch/worktree ownership associations, branch
bases, child PR target plans, push state, refresh state, cleanup state, and any
blockers. Record those ownership facts before H2 freezes the artifact; an
artifact missing them cannot proceed to finalization because cleanup must not
derive ownership later from names or live Git state. The parent directory for
local sidecar checkouts is workflow context, but each sidecar directory name
must use the deterministic component above.

Before reusing an existing local branch, remote branch, checkout, worktree,
directory, or artifact path, compare it against the coordinator artifact or
explicit user-provided same-run context. Stop instead of guessing, overwriting,
deleting, silently reusing, or auto-renaming when ownership is not proven for
the same coordinator issue, slug, run identity, branch name, and path.

### Clean State Gate

Before creating, switching, pushing, writing sidecar artifacts, refreshing, or
preparing child delivery from any checkout/worktree, run a clean-state check
such as `git status --porcelain` in the affected checkout/worktree. Stop and
report dirty paths when required state is dirty. Do not hide dirty paths by
stashing, resetting, deleting, checking out, or moving files unless the user
explicitly requests that operation in a workflow that permits it.

### Coordinator Branch and Worktree Preparation

Coordinator parallel work uses exactly one coordinator integration branch
created from current `origin/main`. Fetch current `origin/main` without
updating local `main`, merging into local `main`, committing on local `main`,
or using local `main` as a sidecar delivery branch.

For a new sidecar run:

1. Compute the coordinator branch name and coordinator checkout/worktree path.
2. Verify the current checkout and any target worktree path are clean or absent
   as required.
3. Verify branch, checkout/worktree, directory, and artifact collisions are
   either absent or proven to belong to the same resumable run.
4. Fetch `origin main` and confirm `origin/main` is available.
5. Create the coordinator integration branch from `origin/main`.
6. Create or enter one isolated coordinator checkout/worktree for that branch.
7. Record the local coordinator branch ref, coordinator branch source
   `origin/main`, coordinator checkout/worktree path, and artifact write
   boundary in the coordinator artifact when artifact writing is allowed.

When resuming a sidecar run, re-read GitHub and repository evidence, verify the
recorded coordinator branch/worktree still matches current local and remote
state, and stop on mismatch instead of recreating, deleting, rebasing, or
force-updating resources.

### Coordinator Remote Push Gate

After the coordinator branch/worktree exists and before any child PR delivery
can occur, push the coordinator integration branch to `origin` with a normal
non-force push. Record the remote coordinator branch ref and push status in the
coordinator artifact after the push succeeds.

If the normal coordinator branch push is rejected or cannot be proven safe,
stop before child PR delivery. Do not use `--force`, `--force-with-lease`,
rebase-push, delete-and-recreate, or any history-rewriting remote update to
make the coordinator branch push succeed. Child PR readiness depends on the
remote coordinator branch existing and matching the recorded coordinator state.

### Child Branches and Worktrees

Child branch/worktree preparation starts only after the coordinator branch is
local, the remote coordinator branch exists, required artifacts are prepared or
handoff-ready, and the child layer is dependency-ready.

For each active child in the dependency-ready layer:

1. Compute the child branch name and child checkout/worktree path before
   creating resources.
2. Verify branch, checkout/worktree, directory, and artifact collisions are
   absent or proven same-run resources.
3. Create the child branch from the coordinator integration branch, not from
   `main`.
4. Create one isolated child checkout/worktree for that child branch.
5. Record the child branch name, source coordinator branch, local
   checkout/worktree path, child PR target branch, and isolation state in the
   coordinator artifact.

After those factual child Git resources exist, record their exact identities in
the coordinator artifact and complete the prepared handoffs with implementation
and delivery permission false. Commit and normally push exact handoff-ready
evidence, then commit/push its exact-SHA recording update; fetch the remote
coordinator branch, require equality to the current recording head and ancestry
containment of the evidence SHA before dispatch. Child branches may be behind
these coordinator commits; they must remain clean and later incorporate the
current launched activation/recording head and verify its launched evidence SHA
by allowed fast-forward or normal merge before implementation. Coordinator
bookkeeping movement never authorizes a held child to edit early.

Each active child implementation uses only its isolated local checkout/worktree
recorded in the coordinator artifact and supplied in the child handoff. Sidecar
child PR guidance must target the coordinator branch. A sidecar child PR must
not target `main` directly. Hard-dependent layers wait until prerequisite
child PRs are integrated and any required coordinator or active-child refresh
is complete.

### Refresh After Child PR Merges

After the user merges a child PR into the remote coordinator branch using
GitHub's **"Create a merge commit"** method, resume first re-reads current
GitHub and repository evidence. It then fetches the remote coordinator branch
and refreshes the local coordinator branch/worktree from that remote
coordinator branch before marking completed children integrated, refreshing
active children, launching a next dependency layer, or consuming merged child
work as fresh coordinator evidence.

Refresh local coordinator state with fast-forward or a normal merge only. Stop
when the local coordinator branch/worktree has unexpected local changes,
missing branch state, unsafe divergence, stale evidence that prevents a safe
decision, failed fetch, or conflicts. Do not rebase, force-push, use
`--force-with-lease`, perform history-rewriting updates, update local `main`,
merge into local `main`, delete resources, mutate GitHub issues, or merge PRs
to make coordinator refresh succeed.

Mark a completed child integrated only when its PR is merged into the
coordinator branch, local coordinator state has been refreshed from the remote
coordinator branch containing that merge, and the exact recorded delivered
child commit is an ancestor of the refreshed coordinator head. GitHub merged
metadata alone is insufficient. A **"Squash and merge"** or **"Rebase and
merge"** result that rewrites the delivered child commit must remain
non-integrated and blocks the terminal child gate.

After local coordinator state is refreshed, every still-active sidecar child
branch or worktree that needs the latest coordinator state is updated from the
updated local coordinator branch using a normal merge only when needed. Active
child refresh must not use stale local coordinator state.

Do not rebase sidecar branches. Do not force-push sidecar branches. Do not use
`--force-with-lease`. Do not use history-rewriting updates for sidecar
branches.

The coordinator artifact must record the remote coordinator branch state, local
coordinator branch/worktree refresh state, observed child PR merge state,
integrated children, still-active child branches or worktrees that need
refresh, which have been refreshed, and which coordinator branch state was last
incorporated. Validation affected by coordinator refresh or active child
refresh is stale until rerun after the allowed refresh.

### Cleanup

Do not delete local sidecar branches or worktrees after individual child PR
merges. Post-final-merge cleanup is a local-only, explicitly authorized phase;
eligibility by itself never deletes or authorizes deletion of a resource.

#### Journal Location and State

Use the exact stable `run_id` already recorded by the coordinator artifact. Do
not derive, regenerate, shorten, rename, or guess it during cleanup. Reject an
empty run ID, `.` or `..`, or a value containing `/` or `\` instead of using it
as a path component.

From a valid non-target checkout belonging to the repository, run
`git rev-parse --git-common-dir`, resolve a relative result against that
repository context, and normalize it to the actual Git common directory. Use
exactly this journal path:

```text
<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json
```

Schema version 1 contains exactly these top-level fields and no others:

- `schema_version`;
- `run_id`;
- `eligibility`;
- `owned_resources`;
- `skipped_reasons`;
- `attempted_operations`;
- `result`;
- `updated_at_utc`.

The journal is local operational evidence outside tracked worktree content. It
is not independent evidence of final merge, resource ownership, or cleanup
authority. Its ownership entries copy only the minimal exact worktree path,
local branch association, resource kind, and factual local state needed for the
cleanup record. Do not require or invent a journal `head_sha`; corroborate
ownership from the frozen same-run coordinator artifact, the normalized Git
common directory, and current exact path/branch/worktree association instead.
An existing `ineligible` or `not_started` journal with no attempted operations
may be updated only when its schema, exact run ID, and resource snapshot remain
consistent with the same-run artifact and current local evidence. Report an
existing `partial` or `completed` journal as factual prior state; do not
automatically retry or continue it in #259. Any other inconsistency stops
without overwriting or resetting the journal.

#### Eligibility and Cleanup Authority

Re-read current evidence without mutating GitHub state. Cleanup eligibility
requires all of the following evidence to agree:

- exactly one final coordinator PR belongs to the same stable run identity;
- its source is the expected remote coordinator branch at the expected H2 head;
- its base is `main`;
- its current state is merged; and
- `git merge-base --is-ancestor <H2> origin/main` succeeds against current
  fetched `origin/main`.

GitHub merged metadata alone is insufficient. If H2 is absent from current
`origin/main` ancestry, cleanup remains blocked and no local deletion may be
attempted or reported successful.

A final PR known not to be merged records `eligibility = ineligible` and
`result = ineligible`. Missing, stale, duplicate, or inconsistent final-merge
evidence records `eligibility = ineligible` and `result = blocked`, with the
exact skipped reason. Neither state permits a local deletion.

Confirmed final merge records `eligibility = eligible`, but still does not
authorize cleanup. Without explicit current authority to perform this local
destructive operation under repository rules, record `result = not_started`,
no attempted operations, and the authority reason in `skipped_reasons`. Only
continue when current cleanup authority is explicit and all preflight gates
below pass.

#### Complete-Batch Preflight

Before the first local deletion:

1. Load the exact coordinator and child local branches and worktree paths
   recorded as owned by this run in the frozen coordinator artifact. A branch
   name, directory name, deterministic prefix, journal entry, or sidecar-like
   appearance alone is not ownership evidence.
2. Corroborate every candidate against current local refs and
   `git worktree list --porcelain`. Require the same normalized Git common
   directory, exact normalized worktree path, exact local branch, and exact live
   worktree/branch association recorded for this run. Unknown ownership,
   missing resources, duplicate candidates, or any conflicting live association
   blocks the whole batch. A prior `partial` journal is reported rather than
   used to infer why a resource is absent or to resume deletion automatically.
3. Check every candidate worktree for staged, unstaged, and untracked changes
   with `git status --porcelain` or an equivalent complete status check. If any
   candidate is dirty or cannot be inspected, block the whole batch before the
   first deletion and record the exact worktree and reason.
4. Verify the control checkout belongs to the same Git common directory and is
   not any cleanup target. Cleanup must never remove the worktree from which its
   commands are running.
5. Persist the journal with the factual owned-resource snapshot, eligibility,
   skipped reasons, and no unattempted operation presented as attempted. A
   preflight blocker records `eligibility = eligible` and `result = blocked`.
   If the journal cannot be created or updated, stop before deletion and report
   the write failure externally.
6. Only after every candidate passes together and cleanup is explicitly
   authorized, persist `eligibility = eligible` and `result = in_progress`
   before the first destructive command.

Do not partially preflight and then begin deletion. This full-batch gate is a
point-in-time safety check, not a concurrency lock or transaction guarantee.

#### Local Cleanup Execution

For each approved worktree/branch association:

1. Remove the exact owned worktree with
   `git worktree remove -- <exact-path>`. Do not use `--force` or filesystem
   deletion.
2. Append the exact `remove_worktree` attempt and its `succeeded` or `failed`
   outcome to `attempted_operations`, update the resource state and
   `updated_at_utc`, and persist the journal before continuing.
3. Only after the associated worktree is absent, attempt standard non-force
   local deletion with `git branch -d -- <exact-branch>`. A branch with no
   worktree candidate may be attempted only after current evidence confirms no
   worktree remains associated with it.
4. Append the exact `delete_branch` attempt and outcome, update resource state
   and `updated_at_utc`, and persist the journal before continuing.

Stop immediately after a failed local operation or required journal update. If
no earlier local removal succeeded, record `result = blocked` when the journal
can be updated safely. If any earlier removal succeeded, record
`result = partial`, retain exact failure and unattempted-resource reasons, and
do not claim completion. Record `result = completed` only after every approved
worktree and branch was removed successfully. Do not retry automatically or
introduce transaction, locking, or crash-recovery behavior.

This cleanup phase never changes H2,
`specs/032-final-coordinator-delivery/finalization.md`, or any tracked
coordinator artifact; creates H3, H4, or another repository commit; deletes or
updates remote branches; prunes remotes or remote-tracking refs; mutates GitHub
issues or comments; merges or approves a pull request; or enables auto-merge.
Read-only evidence collection is allowed. Remote cleanup, if ever separately
approved by another workflow, remains outside this local cleanup phase.

Direct child issue work outside `parallel` keeps the normal sequential Git
workflow. A closed-child coordinator final pass also keeps the normal
sequential Git workflow and is outside this sidecar coordinator branch model.

## Sidecar Resume State Tracking

Apply these resume state rules only to sidecar coordinator parallel execution
after routing guardrails, coordinator preflight, source-of-truth review,
dependency classification, artifact preparation, shared-contract validation,
sidecar Git state validation, sidecar PR delivery validation, and sidecar
validation reporting rules have succeeded. Issues #220 through #234 remain
excluded from parallel routing and use the current sequential workflow
guardrails.

### Durable Resume State

The coordinator artifact is the durable tracked resume source through H2 and
remains the post-H2 ownership source. A later session must be able to identify
completed, active, blocked, pending, paused, and resume-needed child work from
repository artifacts and GitHub/repository state without private conversation
context. After H2, the Git-common-directory cleanup journal is the separate
durable local record of cleanup evaluation and attempted execution only. It does
not replace the coordinator artifact or current merge, ownership, or authority
evidence.

For each child issue, the coordinator artifact must record:

- child artifact path;
- child branch when created;
- local child checkout/worktree when created;
- child PR when opened;
- child PR merge status in the remote coordinator branch when observed;
- validation state and freshness;
- workflow status;
- handoff-ready evidence SHA and containing remote recording head,
  prepared-handoff fingerprint, implementation and delivery permission state,
  held-dispatch acceptance, stable canonical child identity, launched evidence
  SHA and containing remote activation/recording head, targeted-release state,
  and pre-release zero-edit/clean-state evidence when those states exist;
- blockers;
- remote coordinator branch state and local coordinator branch/worktree refresh
  state when child PR merges are observed;
- refresh state after coordinator branch updates or child PR merges;
- integration state, including whether the child is integrated, active,
  blocked, pending, waiting for dependency merge, or ready for the next layer;
- cleanup eligibility.

Pending children must be identifiable without implying that a branch,
checkout/worktree, PR, or validation result already exists.

### Resume Re-Read Requirements

Before continuing a paused sidecar coordinator run or a run resumed in a new
Codex session, re-read current evidence from GitHub and the repository:

- coordinator issue body, state, labels, and listed child issues;
- each relevant child issue body, state, labels, dependencies, and blockers;
- relevant child PR states, target branches, readiness, merge status, and final
  coordinator PR state;
- coordinator artifact and child artifacts;
- remote coordinator branch state;
- local coordinator branch/worktree state;
- active sidecar child branch/worktree state;
- held or released child-agent identity and current availability state, plus
  handoff-ready/launched evidence SHAs, their containing remote recording heads,
  and permission activation evidence;
- local checkout/worktree existence and path state;
- validation evidence, status, and freshness;
- complete prepared-child ledger, child PR target/merge observations, and
  refreshed coordinator ancestry proof;
- finalization target-base ref/SHA, merge base, `H`, `H2`, direct-parent and
  sole-artifact delta state, H/H2 validation manifests, applicability reasons,
  integrated scope review, final template identity, and H2 remote push state;
- existing same-run final PR identity, source, target, body/readiness state,
  and returned URL when already observed;
- blockers, conflicts, and human-only decision state;
- exact stable cleanup run ID, cleanup eligibility, explicit current local
  cleanup authority, and the local cleanup journal when it exists;
- live same-run local resource ownership and cleanliness evidence when cleanup
  has been evaluated.

If the current evidence conflicts with recorded resume state, stop and report
the mismatch instead of guessing, deleting resources, rebasing, force-pushing,
or silently treating stale validation as fresh.

### Resume Updates

Before the artifact-only H2 commit, update the coordinator artifact when any of
these events occur or are observed during resume:

- a child's handoff-ready evidence commit and exact-SHA recording update are
  committed/pushed, with remote equality to the current recording head and
  ancestry containment of the evidence SHA proven before dispatch;
- a held dispatch is accepted, rejected, or ambiguous and the exact stable
  identity or blocker is known;
- factual launched evidence and its exact-SHA activation/recording update are
  committed/pushed, with current remote equality and evidence ancestry proven
  while the child remains held;
- targeted release succeeds or fails for the exact stable child identity;
- the released child incorporates the current activation/recording head and
  verifies the factual launched evidence SHA while clean, or that
  refresh/verification becomes blocked;

- user merges a child PR into the coordinator branch;
- the remote coordinator branch is fetched after user-owned child PR merges;
- local coordinator branch/worktree state is refreshed from the remote
  coordinator branch by fast-forward or normal merge;
- a child is marked integrated only after its PR merge is present in the
  coordinator branch, local coordinator state has been refreshed from that
  remote branch, and the exact delivered child commit is present in refreshed
  coordinator ancestry;
- an active child branch/worktree needs refresh from the coordinator branch;
- an active child branch/worktree is refreshed from the updated local
  coordinator branch using a normal merge when needed;
- dependency layers are recomputed and children are marked active, blocked,
  pending, waiting-for-dependency-merge, integrated, or ready-next-layer;
- validation passes, fails, is skipped, times out, is interrupted, is partial,
  is stale, is blocked, or is not run;
- child work pauses or resumes;
- a child-specific, coordinator-wide, shared-contract, conflict, or human-only
  blocker appears or clears;
- the complete child ledger becomes ancestry-proven terminal and finalization
  begins, after which no new child layer may start;
- complete integrated validation runs at H;
- the factual finalization artifact creates direct child H2 and records required
  post-H2 checks without preclaiming their results.

H2 freezes the branch-bound artifact. After that commit, keep these
final-delivery events in current repository/GitHub evidence and final reporting:

- post-H2 checks, scope/base rechecks, and normal remote H2 push are observed in
  current evidence;
- a unique ready final PR is created or an existing same-run PR is observed;
- current evidence confirms or does not confirm that the unique same-run final
  PR with the expected source/H2 head and `main` base has merged and that exact
  H2 is an ancestor of current fetched `origin/main`.

Do not write those facts back to the frozen coordinator artifact. When local
cleanup is evaluated, record its factual `eligibility`, `owned_resources`,
`skipped_reasons`, `attempted_operations`, `result`, and update time in the
Git-common-directory cleanup journal. The journal records `eligible` with
`not_started` when final merge is confirmed but current cleanup authority is
absent; it does not turn eligibility into automatic deletion. A later cleanup
evaluation must re-read and corroborate the journal against the exact run ID,
frozen ownership evidence, live Git state, current final-merge evidence, and
current cleanup authority. A prior `partial` or `completed` result is reported,
not retried automatically. Inconsistency stops without guessing, retrying,
resetting the journal, or creating H3/H4.

After a child PR merge into the coordinator branch, local sidecar branches and
worktrees are still retained. Local cleanup remains `ineligible` with reason
`pending final PR merge` until the final coordinator PR has merged into `main`.

### Non-Sidecar State Boundaries

Normal sequential issue implementation state remains unchanged. Direct child
issue work outside explicit sidecar `parallel` mode uses normal sequential
state handling.

A closed-child coordinator final pass uses the existing sequential workflow and
normal sequential state handling. It may reference closed child issues for
traceability, but it must not use sidecar resumability state or present closed
child issue scope as newly implemented work.

## Integrated Coordinator Validation and Finalization

Apply this procedure only after a routing-authorized sidecar run has refreshed
the local coordinator branch from the remote coordinator branch and recomputed
all child state from current GitHub, repository, branch, and artifact evidence.

### Current Evidence and Terminal Child Gate

Before final validation:

1. Re-read the coordinator issue, every prepared child issue and dependency,
   every child PR target/merge state, remote and local coordinator refs, child
   and coordinator artifacts, validation evidence, blockers, cleanup state,
   and existing final PR evidence. Private conversation context is not a source
   of truth.
2. Build one complete, unique ledger for the prepared child set. Missing,
   duplicate, or unexpected child identities are blockers.
3. Require every child PR to target the coordinator branch, be merged there by
   the user with GitHub's **"Create a merge commit"** method, and have its exact
   delivered child commit present in refreshed local coordinator ancestry.
   Merged metadata alone is insufficient. **"Squash and merge"** and
   **"Rebase and merge"** rewrite that identity and cannot satisfy this gate.
4. Require every child workflow state to be `integrated`. An open GitHub child
   issue is expected until final closing keywords take effect and does not prove
   incomplete work; a closed issue does not prove integration.
5. Stop on any active, blocked, pending, dependency-incomplete, missing,
   conflicting, or otherwise non-terminal child state. Once this gate passes
   and finalization starts, do not launch another child layer.

### Complete Integrated Validation at H

At literal coordinator head `H`, first fetch current `origin/main` without
updating local `main`. Record that runtime target-base SHA as `B`, record the
PR-equivalent merge base for B and H, and inspect the complete merge-base-to-H
diff against coordinator scope, child issues and PRs, approved artifacts,
shared contracts, and the combined source maps. Stop on unexplained scope or
inconsistent base, merge-base, or ancestry evidence. This passed review is the
H scope result that the later H2 artifact records.

Discover all required integrated checks from the coordinator issue, prepared
child artifacts, shared contracts, affected surfaces, repository instructions,
and combined source maps. Preserve prior attempts as historical evidence and
record exactly one current readiness result per requirement and evaluated
state. Use the canonical validation vocabulary below. Unavailable or
dishonest-to-run evidence is `blocked` or `not run` with a reason.

Fresh applicable child evidence may be consumed, but it never replaces a
required integrated coordinator check. Run the complete required integrated
implementation validation at literal coordinator head `H`. Record each H
command, status, evaluated inputs/head, and enough output to judge freshness.
All required current results must be fresh and `passed` before continuing.

### Two-Head Finalization

Use exactly two finalization heads:

- runtime `B` is the freshly fetched `origin/main` target-base SHA;
- `H` is the fully integrated coordinator head where the complete suite ran;
- `H2` is the direct child of H containing only the factual coordinator
  finalization artifact update.

The H2 artifact records literal B, literal H, `H2 = SELF/HEAD`, expected parent
H, the sole allowed artifact path, complete H check results, the complete
status-free H2 rerun manifest, per-H-check applicability reasons, readiness
`pending H2 checks`, H scope result and post-H2 scope/base recheck criteria,
the final template blob identity and render-input requirements, remaining
risks, and cleanup `ineligible` with reason `pending final PR merge`. It must
not contain its resolved self SHA, resolved post-H2 statuses, final H2 scope or
readiness, rendered-body fingerprint, or PR URL.

After committing H2:

1. Prove H2 has exactly one parent and that parent is H.
2. Prove the H..H2 name/status delta contains only the explicitly allowed
   finalization artifact path and expected change type.
3. Rerun every artifact-affected check listed in the H2 manifest, including
   artifact/schema validation, explicit-range whitespace checks, and scope/base
   reviews. Record resolved statuses in current evidence and final reporting.
4. Consume an H result at H2 only when its non-empty applicability reason
   explains why the artifact-only delta cannot affect it.
5. Do not claim the complete suite ran at H2 unless it actually did. Do not
   create H3 merely to store resolved H2 evidence or the later PR URL.
6. Push H2 to the remote coordinator branch with a normal non-force push,
   fetch that ref, and require it to equal H2. A rejected push or mismatch
   blocks without force-push, force-with-lease, rebase-push, branch recreation,
   or other history rewriting.

Any extra parent, extra path, extra commit after H2, failed H2 check, missing
applicability reason, remote mismatch, or stale evidence blocks final delivery.

### Integrated Scope Review and Final Rechecks

After H2 exists, rerun the scope review as an artifact-affected check using the
recorded B and PR-equivalent merge base. Inspect the complete merge-base-to-H2
diff and reconcile every changed path and affected surface with coordinator
scope, child issues and PRs, approved artifacts, shared contracts, and the
combined source maps. Confirm that the only change since the passed H review is
the allowed finalization artifact. Unexplained scope or changed base/ancestry
evidence blocks final delivery.

Immediately before creating or safely updating the final PR, re-fetch
`origin/main` and the remote coordinator branch, then recheck target-base SHA,
merge base, local and remote H2 identity, ancestry, scope, validation freshness,
final template/render inputs, and existing same-run PR evidence. Any relevant
movement or inconsistency stales affected evidence and stops delivery. Do not
silently mutate readiness to recover.

## Sidecar PR Delivery Rules

Apply these PR delivery rules only to sidecar coordinator parallel execution
after routing guardrails, coordinator preflight, source-of-truth review,
dependency classification, artifact preparation, shared-contract validation,
and sidecar Git state validation have succeeded. Issues #220 through #234
remain excluded from parallel routing and use the current sequential workflow
guardrails.

### Child PR Target and Issue References

Sidecar child PR guidance must target the coordinator integration branch. A
sidecar child PR must not target `main` directly.

Every sidecar child PR must tell the user to merge it with GitHub's **"Create a
merge commit"** method. **"Squash and merge"** and **"Rebase and merge"** are
prohibited because the exact delivered child commit must remain in refreshed
coordinator ancestry. If the required method is unavailable, stop and report
the operator blocker; Codex must not change repository merge settings.

Sidecar child PR descriptions use `Related to #<child-issue>` and
`Related to #<coordinator-issue>` issue references only. They must not use
issue-closing wording for the child issue or coordinator issue, and they must
not imply that the child PR is the final delivery PR to `main`.

After issue #256 and the approved #260 barrier correction, factual `launched`
alone is necessary but insufficient for implementation or delivery. A sidecar
child executor may commit scoped child changes, push the prepared child branch
with a normal non-force push, and open or update the child PR only when exact
factual launched evidence and its containing activation/recording head are
durable on the fetched remote coordinator ref, the same stable held child has
received targeted release, its clean child branch has incorporated the
activation head and verified the launched-evidence ancestry, current
implementation and delivery permission are true, and all prepared
handoff/repository rules pass.
The coordinator records the child PR URL, target branch,
issue-reference wording, ready/draft status, validation freshness, blockers,
and commit hashes reported by the child. A child PR is ready only when required
validation is fresh and passed and no unresolved blocker affects the child; it
is draft/not-ready when required validation is failed, skipped, timed out,
interrupted, partial, stale, blocked, or not run.

### Final Coordinator PR

After every finalization gate above passes, re-read current PR evidence for the
stable same-run final-delivery identity. Create at most one final coordinator
PR. Reuse or update an existing same-run PR only when the approved workflow
permits that operation and every affected requirement is freshly revalidated.
If existing PR source, target, body, readiness, validation, or identity evidence
is stale or inconsistent and no safety downgrade is explicitly authorized,
stop and report the exact user action required. Do not create a duplicate or
silently mutate readiness.

Render `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md` with
current evidence. The final PR must:

- be ready for review; there is no draft final-PR fallback for failed or
  incomplete readiness;
- source the remote coordinator integration branch verified at H2;
- target `main`;
- require the user to select GitHub's **"Create a merge commit"** method and
  prohibit **"Squash and merge"** and **"Rebase and merge"** so exact H2
  remains in `main` ancestry;
- identify integrated child PRs or child issue references for traceability;
- list complete checks at H and resolved artifact-affected checks at H2 with
  explicit statuses and freshness;
- record target-base SHA, merge base, local/remote H2, integrated scope-review
  result, applicability rationale, remaining risks, and cleanup `ineligible`
  with reason `pending final PR merge`;
- use closing keywords only for the coordinator and delivered child issues.

The final coordinator PR is the only sidecar PR that may target `main` or close
the coordinator set during sidecar parallel delivery. Record the GitHub-returned
URL and readiness in current evidence and final reporting. Do not create H3 to
write the URL, rendered-body fingerprint, or resolved post-H2 evidence into the
coordinator branch.

### Merge Authority and GitHub Mutation Approval

Codex may create or safely update the one ready final coordinator PR only after
the approved finalization procedure passes. Codex reports readiness for sidecar
child PRs and the final coordinator PR. The user performs every merge using the
required sidecar **"Create a merge commit"** method. If that method is
unavailable, Codex stops and reports the blocker. Codex must not merge, approve,
enable auto-merge, or modify repository merge settings.

GitHub issue body, checklist, label, assignee, milestone, issue state, and
public comment mutation requires explicit user approval in a workflow that
permits that operation. PR description wording is not permission to separately
modify issue metadata, issue bodies, checklists, issue state, or public
comments.

Remote branch deletion, remote pruning, and remote cleanup require explicit
user approval.

### Non-Sidecar PR Boundaries

Normal one-issue sequential PR behavior keeps its current target and closure
behavior. Direct child issue work outside explicit sidecar `parallel` mode also
uses normal sequential PR behavior.

A closed-child coordinator final pass uses normal sequential PR behavior and is
outside the sidecar child/final PR model.

## Sidecar Validation, Blocker and Conflict Reporting

Apply these reporting rules only to sidecar coordinator parallel execution
after routing guardrails, coordinator preflight, source-of-truth review,
dependency classification, artifact preparation, shared-contract validation,
sidecar Git state validation, and sidecar PR delivery validation have
succeeded. Issues #220 through #234 remain excluded from parallel routing and
use the current sequential workflow guardrails.

### Validation Evidence and Freshness

Sidecar child reports and coordinator integration reports must list every
required command, manual review, local sample artifact, and consumed child
validation result. Each evidence item must use an explicit status:
`passed`, `failed`, `skipped`, `timed out`, `interrupted`, `partial`,
`stale`, `blocked`, or `not run`.

Preserve prior attempts as historical evidence. For readiness, record exactly
one current result per requirement, evaluated head, and relevant input set.
Unavailable or dishonest-to-run evidence is `blocked` or `not run` with a
reason; it is never silently omitted.

Failed validation is never summarized as passed. Failed, timed-out, skipped,
interrupted, partial, stale, blocked, and not-run validation must never be
summarized as passed. A report may contain both passed and non-passed evidence, but its
summary must preserve the non-passed status and its readiness impact.

Validation becomes stale when coordinator branch updates, child branch
refreshes, target-base or merge-base movement, conflict resolution, artifact
changes, or other relevant changes could affect the previous evidence. Stale
evidence must be rerun before readiness is reported, or it must remain
explicitly reported as stale. Coordinator readiness must not consume stale
child or H evidence as fresh evidence. H evidence may be consumed at H2 only
after direct-parent/sole-artifact proof and a non-empty applicability reason.

Child readiness evidence must also include the current two-phase barrier state:
exact handoff-ready and launched evidence SHAs, their current containing remote
recording heads, accepted stable child identity, targeted release to that same
identity, clean incorporation of the activation head and verification of the
launched evidence, and effective implementation and delivery permissions. Any
missing, failed, ambiguous, interrupted, or stale barrier evidence blocks ready
status even when implementation validation otherwise passes.

### Ready and Draft Reporting

A sidecar child PR may be reported as ready only when the exact same held child
passed every release gate, required validation is fresh and passed, no
unresolved blocker affects the child, and the approved sidecar PR target and
issue-reference rules are satisfied.

A sidecar child PR must be reported as draft when required validation is
failed, skipped, timed out, interrupted, partial, stale, not run, or blocked,
unless the non-passed evidence is explicitly outside child readiness and the
report explains why. Final coordinator behavior differs: any required
non-passing, unavailable, stale, scope-drift, base/head, remote-ref, or existing
PR blocker prevents final PR creation or allowed update. Do not open a draft
final PR as fallback and do not report an existing final PR ready while its
evidence is stale or inconsistent.

### Blockers and Conflicts

Reports must distinguish:

- child-specific blockers that affect exactly one child issue;
- coordinator-wide blockers that affect the coordinator branch, integration
  set, or multiple children;
- shared-contract blockers that affect cross-child contracts or handoff
  expectations;
- conflict blockers that require user guidance;
- human-only blockers that Codex must not decide.

Shared-contract blockers stop affected sidecar work until the blocker is
resolved or user guidance is provided.

Non-trivial conflicts affecting contract, scope, persistence, security, authorization, UX, or domain behavior require user guidance. The report must identify the conflicting inputs, affected source surfaces, blocked child or coordinator scope, and the guidance required before work can continue.

Human-only blockers include new significant dependencies, material architecture
changes, production exposure, secrets, deployment changes, Git/GitHub workflow
outside the approved model, and unresolved product, persistence, security,
authorization, UX, domain, contract, validation, operational, or scope
decisions. The report must name the category, evidence, affected scope, and
required human decision.

### GitHub Mutation and Non-Sidecar Boundaries

Codex must not modify GitHub issue bodies, checklists, labels, assignees,
milestones, issue state, or public comments unless the user explicitly requests
that operation in a workflow that permits it.

Normal sequential validation and reporting behavior remains unchanged. Direct
child issue work outside explicit sidecar `parallel` mode also uses normal
sequential reporting.

A closed-child coordinator final pass uses normal sequential validation and
reporting. It may reference closed child issues for traceability, but it must
not present closed child issue scope as newly implemented work.

## Prohibited Side Effects

This entrypoint must not:

- create, modify, close, label, assign, milestone, or comment on GitHub issues
  without explicit user approval in a workflow that permits that operation;
- resume sidecar coordinator work from private conversation context instead of
  current GitHub and repository evidence;
- continue from recorded resume state when current GitHub or repository
  evidence conflicts with it;
- rebase, force-push, or perform history-rewriting updates for sidecar
  branches;
- push sidecar branches, open pull requests, update pull requests, delete
  remote branches, prune remotes, or perform remote cleanup unless an approved
  sidecar child-delivery or final-coordinator-delivery rule permits the
  operation and explicit user approval exists where repository rules require
  it;
- delete local sidecar branches or worktrees after individual child PR merges;
- clean local sidecar branches or worktrees before the final coordinator PR has
  been merged into `main`;
- treat the cleanup journal or eligibility alone as final-merge, ownership, or
  cleanup-authority evidence;
- begin cleanup before one exact stable run ID, explicit current cleanup
  authority, full-batch same-run ownership corroboration, every-candidate
  clean-state check, non-target control checkout, and writable journal are all
  proven;
- remove an associated local branch before its owned worktree, force-remove a
  worktree, force-delete a branch, continue after a failed cleanup operation or
  required journal update, or claim completion after partial work;
- delete or update a remote branch, prune a remote or remote-tracking ref,
  mutate a GitHub issue or comment, merge or approve a PR, or enable auto-merge
  as part of local cleanup;
- create sidecar artifacts outside the approved artifact-preparation phase or
  when any artifact-preparation stop condition applies;
- run artifact preparation for closed-child coordinator final passes;
- summarize failed, timed-out, skipped, interrupted, partial, stale, blocked,
  or not-run validation as passed;
- report a sidecar child PR or final coordinator PR as ready while required
  validation is stale or an unresolved blocker affects readiness;
- launch another child layer after integrated final validation begins;
- open a draft final coordinator PR as a readiness fallback, create a duplicate
  final PR, or silently mutate an existing stale/inconsistent final PR;
- proceed when the terminal child ledger, B/H/H2 relationship, artifact-only
  delta, H2 affected checks, remote H2 ref, target-base, merge-base, scope,
  validation freshness, or existing final PR evidence is invalid or stale;
- create H3, H4, or another coordinator-branch commit solely to store the final
  PR URL, rendered-body fingerprint, resolved post-H2 evidence, or local cleanup
  state;
- mark cleanup eligible before the final coordinator PR is observed merged into
  `main` with exact H2 present in current fetched `origin/main` ancestry;
- modify repository merge settings to make a required sidecar merge method
  available;
- silently resolve non-trivial conflicts affecting contract, scope,
  persistence, security, authorization, UX, or domain behavior;
- silently decide human-only blocker categories such as significant
  dependencies, material architecture changes, production exposure, secrets,
  deployment changes, Git/GitHub workflow outside the approved model, or
  unresolved product, persistence, security, authorization, UX, domain,
  contract, validation, operational, or scope decisions;
- require seed-first execution or invent/create foundation or shared-contract
  child issues without explicit user approval in a separately approved workflow
  that permits issue mutation;
- delegate child implementation work before the run is routing-authorized,
  including authorization-pending or other pre-execution states, during
  preflight or artifact preparation,
  outside an approved dependency-ready lifecycle state, or without valid
  prepared child artifacts, valid branch/worktree context, dependency-ready
  layer evidence, a valid prepared child handoff, and current approved sidecar
  rules that permit delegation. This prohibition does not block a
  routing-authorized lifecycle from launching dependency-ready child handoffs
  when the approved rules permit that operation;
- allow a held child to edit, stage, execute prepared tasks, commit, push,
  open/update a PR, or mutate GitHub before the exact launched update is durable
  on the fetched remote coordinator ref, the same stable canonical child has
  cleanly incorporated or verified it, and targeted release has succeeded;
- record `launched` for rejected, missing, or ambiguous dispatch, retry an
  ambiguous dispatch blindly, or substitute another child identity for a
  factually launched held child whose identity cannot be verified;
- activate implementation or delivery permission from an unpushed local
  launch-state commit, or roll factual `launched` state back to `pending` merely
  because persistence, refresh, verification, or release failed;
- introduce a generic transaction framework, lock protocol, queue, daemon, IPC
  service, indefinite polling loop, or other infrastructure mechanism for the
  bounded two-phase held-dispatch barrier;
- open, update, merge, approve, or enable auto-merge on pull requests during
  preflight or artifact preparation;
- modify CatWorld product code;
- modify `.agents/skills/catworld-implement-issue/SKILL.md`;
- modify `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`;
- introduce a required `parallel-ready` label.

## Preflight Output

Report a concise preflight result with:

- coordinator issue number and classification;
- listed child issues inspected;
- child dependency and conflict classification;
- source-of-truth documents reviewed;
- artifact-preparation status, including coordinator path, child paths, and
  whether artifacts were planned, prepared, handoff-ready, described, blocked,
  or not applicable;
- sidecar Git status, including coordinator branch name, local coordinator
  branch ref, remote coordinator branch ref, coordinator branch source ref,
  coordinator push status, coordinator checkout or worktree path, child branch
  names, child branch source refs, child checkout or worktree paths, child PR
  target branch, refresh status, cleanup eligibility, dirty-state blockers, and
  unresolved collision/approval blockers when Git state has been prepared or
  described;
- dependency-layer fan-out status, including first dependency-ready layer,
  child-agent/subagent capability state, exact handoff-ready evidence SHA and
  containing remote recording head, prepared-handoff fingerprint, held
  preflight acceptance and stable canonical child identity, factual launched
  state, exact launched evidence SHA and containing remote activation/recording
  head, targeted-release and effective-permission state, pre-release clean/zero-edit
  evidence, launched children, blocked children, pending children, children
  waiting for dependency merges, exact non-launch or held reason, and
  confirmation that no sequential fallback was used;
- sidecar PR delivery status, including child PR target branch, child issue
  reference wording, child PR URL when delivery occurred, child PR ready/draft
  status, child PR validation freshness, final coordinator PR target, closure
  authority, final same-run identity, final PR URL/readiness when observed,
  GitHub mutation approval state, public comment approval state, and remote
  cleanup approval state when PR delivery state has been prepared, described,
  or reported;
- sidecar validation reporting status, including commands and reviews passed,
  failed, skipped, timed out, interrupted, partial, stale, blocked, and not run;
- child PR ready/draft readiness status and final coordinator readiness status;
- sidecar resume state status, including completed, active, blocked, pending,
  paused, and resume-needed child work; required GitHub and repository evidence
  re-read before continuing; remote coordinator branch fetch state; local
  coordinator branch/worktree refresh state; child PR merge observations;
  integrated child state; active child refresh-needed/refreshed state;
  ready-next-layer child state; stale validation state; child PR URL and
  readiness when available; terminal child-ledger state; B/H/H2 and remote H2
  state; target-base/merge-base and scope-review state; final PR state; cleanup
  eligibility; and remote cleanup approval state;
- blocker and conflict status, including child-specific blockers,
  coordinator-wide blockers, shared-contract blockers, human-only blockers, and
  user-guidance requirements;
- readiness status: `authorization-pending`, `blocked`, or
  `routing-authorized`;
- specific stop reasons or remaining prerequisites;
- confirmation that no child implementation, PR operation, issue mutation,
  public comment, product code change, prohibited Git operation, private-context
  resume, or unapproved cleanup was performed.

When an authorization predicate fails, stop at that read-only preflight step
and report the exact blocker before artifact writing, Git/worktree mutation,
fan-out, or child execution. Planned artifact paths or a favorable dependency
classification alone never authorize the mutation-capable lifecycle.

## Finalization Output

When a routing-authorized run reaches finalization, report:

- the complete prepared-child ledger, each child PR target/merge observation,
  refreshed ancestry proof, and confirmation that no child remains active,
  blocked, pending, dependency-incomplete, missing, duplicate, or unexpected;
- runtime B, literal H, resolved H2, direct-parent proof, sole-artifact H..H2
  delta, and confirmation that no H3 was created;
- complete H checks with explicit statuses, the H2 rerun manifest, resolved H2
  statuses from current evidence, and applicability reasons for consumed H
  results without claiming the complete suite ran at H2 unless it did;
- fetched `origin/main` target-base SHA, merge base, PR-equivalent scope-review
  result, final recheck state, normal H2 push result, and fetched remote
  coordinator ref equality with H2;
- final template blob/render requirements, rendered-body evidence, integrated
  child traceability, stable same-run identity, existing-PR state, remaining
  risks, and final readiness;
- final PR source, `main` target, closing authority, GitHub-returned URL, and
  ready state when creation or an allowed update succeeds;
- cleanup `ineligible` with reason `pending final PR merge`, user-owned merge
  authority, and confirmation that no issue mutation, approval, auto-merge,
  cleanup, force/history rewrite, draft fallback, duplicate PR, or URL-recording
  branch commit occurred.

## Local Cleanup Output

When a routing-authorized run evaluates or executes post-final-merge local
cleanup, report:

- the exact stable run ID and resolved Git-common-directory journal path;
- the unique same-run final PR, expected source/H2 head, `main` base, merged
  state, and current `origin/main` merge-evidence result;
- explicit current cleanup-authority state, including `eligible/not_started`
  when authority is absent;
- every artifact-owned candidate and its exact ownership, live-association, and
  clean-state preflight result;
- factual skipped reasons and ordered attempted worktree/branch operations;
- final `ineligible`, `not_started`, `blocked`, `partial`, or `completed` result;
- confirmation that H2, the finalization artifact, tracked coordinator history,
  remotes, remote-tracking refs, GitHub issues/comments, and PR merge/approval or
  auto-merge state were not changed by cleanup.

## Validation Expectations

Validation for this entrypoint must include:

- local routing examples for explicit coordinator `parallel`, non-coordinator
  `parallel`, direct child `parallel`, open-child coordinator end-to-end, and
  closed-child coordinator final-pass requests;
- review that readiness is based on preflight, child issue inspection,
  dependency classification, and source-of-truth review;
- simulation of one coordinator with at least three child issues, including the
  coordinator artifact path and each child artifact path;
- review that coordinator artifacts require durable run identity, coordinator
  issue number, title, URL, labels and state, inspected child issue list,
  parent/source references, child issue map, dependency layers, hard
  dependencies, conflict risks, independent candidates, unresolved blockers,
  shared implementation contract, child-owned surfaces, shared surfaces
  requiring caution, branch and worktree plan, PR target plan, validation plan,
  resume/status table, stop conditions and final coordinator PR plan;
- simulation of planning the coordinator artifact while the active checkout is
  `main`, proving no files are written and local `main` remains clean;
- simulation of writing the coordinator artifact only after entering a
  coordinator branch/worktree;
- simulation of an existing same-number coordinator artifact that proves safe
  same-run resume and stops before writing on unproven collision;
- simulation of a blocked coordinator artifact update proving the blocker is
  recorded without launching child work;
- review that coordinator artifact state updates are factual and do not imply
  branches, worktrees, PRs, merge observations, validation results, readiness or
  cleanup eligibility before those states actually exist;
- review that coordinator artifact writes and sidecar artifact commits never
  land on local `main`;
- review that child artifacts require issue-numbered `spec.md`, `plan.md`, and
  `tasks.md` preparation before delegation;
- simulation of one coordinator with at least three child issues proving each
  child has planned `spec.md`, `plan.md`, and `tasks.md` content under
  `specs/<child-issue-number>-<child-slug>/` and a recorded coordinator
  preparation status;
- simulation of planning child artifacts while the active checkout is `main`,
  proving no child artifact files or directories are written and local `main`
  remains clean;
- simulation of writing child artifacts only after entering a coordinator
  branch/worktree;
- simulation proving a missing or conflicting shared implementation contract
  blocks delegation instead of inventing a seed, foundation, or shared-contract
  child issue;
- simulation proving child artifact sibling-scope leakage stops the run before
  delegation;
- simulation proving existing child artifact paths, same-number child prefixes,
  and duplicate child issue numbers stop before writing unless current sidecar
  state proves this is the same resumable run;
- simulation of coordinator branch creation from current `origin/main` in a
  temporary Git repository without updating local `main`;
- simulation of creating or entering an isolated coordinator worktree and
  using it as the sidecar artifact write boundary;
- simulation of normal non-force coordinator branch push to `origin` before
  child PR delivery can be considered ready;
- simulation of at least two child branches using a temporary local Git
  repository, with each child branch created from the coordinator branch and
  each active child using an isolated worktree;
- simulation proving child PR delivery remains blocked when the remote
  coordinator branch does not exist or cannot be pushed safely;
- simulation proving dirty working-tree state stops sidecar branch/worktree
  operations before writing artifacts or child delivery;
- simulation proving existing branch/worktree names and paths stop on unproven
  collisions and resume only when current sidecar state proves same-run
  ownership;
- simulation proving an unsafe coordinator branch push stops before child PR
  delivery and does not attempt force-push or history rewriting;
- simulation of a coordinator with three independent children proving exactly
  three prepared child handoffs are produced for the first dependency-ready
  layer;
- simulation proving handoff-ready state and disabled permissions are committed
  and normally pushed as exact evidence, a later pushed recording update stores
  that SHA, and the current fetched remote ref equals the recording head and
  contains the evidence commit before any real child dispatch;
- simulation of one dependency-ready layer proving each real child accepts in
  preflight-only mode under one stable canonical identity, performs zero edits,
  and remains held until the factual launched update for the accepted layer is
  durably pushed;
- simulation proving only the same accepted child identity may fetch and cleanly
  incorporate the current activation/recording head, verify that it contains
  the exact factual launched evidence SHA, acknowledge targeted release, and
  then begin implementation;
- simulation proving a child branch may remain behind the coordinator recording
  heads during zero-edit preflight and advances only during release;
- review proving no tracked commit is required to contain its own SHA and that
  every evidence SHA is stored only by a later bounded recording commit;
- simulation proving rejected or ambiguous dispatch records no `launched`,
  starts no implementation, performs no delivery, and does not blindly retry or
  create a replacement identity;
- simulation proving launch evidence/recording commit or push failure,
  activation-head refresh or launched-evidence verification failure, and
  targeted-release failure all preserve truthful
  factual state while permitting zero pre-release edits or delivery;
- interruption/resume simulation proving a held child remains idle or
  preflight-only and that an unverifiable factually launched identity blocks
  replacement dispatch;
- review proving the barrier is a bounded ordered non-atomic protocol and adds
  no transaction framework, lock protocol, queue, daemon, IPC service, or
  indefinite polling loop;
- simulation of hard-dependent children proving only the first layer launches
  and later children are recorded as pending or waiting for dependency merges;
- simulation proving unresolved shared-contract blockers stop affected fan-out
  without launching unsafe child work;
- simulation proving unavailable child-agent/subagent capability stops fan-out
  and does not fall back to sequential implementation;
- review of a sample prepared child handoff proving it includes coordinator
  context, child issue body, prepared `spec.md`, `plan.md`, `tasks.md`, shared
  contract, dependency layer, branch/worktree context, validation requirements,
  PR target rules, out-of-scope boundaries, and prohibitions against planning
  regeneration, shared-contract redefinition, sibling scope, issue mutation,
  and `main` targets;
- review proving coordinator artifacts record launched, blocked, pending, and
  waiting-for-dependency-merge child states with exact non-launch reasons;
- local sample child handoff execution proving one launched child confirms the
  prepared checkout and branch, executes only prepared `tasks.md` work, and
  reports a focused changed-file diff;
- local sample child PR delivery checks proving child PR descriptions use
  `Related to #<child-issue>` and `Related to #<coordinator-issue>` only, do not
  close issues, and require GitHub's **"Create a merge commit"** method while
  prohibiting squash and rebase merge;
- local sample child PR target checks proving child PRs target the coordinator
  branch and reject `main`;
- local sample readiness checks proving failed, skipped, timed-out,
  interrupted, partial, stale, blocked, and not-run validation creates
  draft/not-ready child PR status;
- local sample child final report checks proving changed files, explicit
  validation statuses, PR URL, readiness, blockers, risks, branch names, commit
  hashes, and current checkout state are reported;
- simulation of a child PR merge into the coordinator branch followed by
  refreshing another active child branch from the updated local coordinator
  branch using a normal merge;
- review that sidecar child PR guidance targets the coordinator branch and not
  `main`;
- review that sidecar workflow text disallows rebase, force-push, and
  history-rewriting updates;
- #259 focused table-driven validation, using exactly one PowerShell script and
  one shared temporary-Git fixture, for cleanup blocked before final merge,
  eligible after final merge without automatic authority, dirty-worktree block,
  unknown-ownership block, successful worktree-then-branch cleanup, truthful
  partial failure, and absent prohibited remote/GitHub operations;
- #259 assertions that the blocked-before-merge case records
  `ineligible/ineligible`, the eligible-after-merge case records
  `eligible/not_started` with no attempts, every journal has exactly the eight
  approved top-level fields beneath the resolved Git common directory, and H2,
  `specs/032-final-coordinator-delivery/finalization.md`, H3, and H4 remain
  untouched;
- #259 regression proving merged PR metadata with exact H2 absent from current
  `origin/main` ancestry remains blocked, retains every local resource, and
  attempts no non-force branch deletion;
- review that the local cleanup phase contains no remote branch deletion or
  update, remote or remote-tracking pruning, GitHub mutation, PR merge/approval,
  or auto-merge operation; any separately approved remote-cleanup
  workflow remains outside #259;
- local sample child PR descriptions for two child issues that target the
  coordinator branch, use `Related to` issue references only, and do not close
  issues;
- local sample final coordinator PR description that targets `main` and may
  close the coordinator issue and child issues in the sidecar set;
- local sample closed-child coordinator final-pass PR description that uses
  normal sequential PR behavior;
- review that GitHub issue body, checklist, label, assignee, milestone, issue
  state, and public comment mutation require explicit user approval;
- review that normal sequential PR behavior, direct child issue work outside
  `parallel`, and closed-child coordinator final passes are outside sidecar PR
  routing;
- local sample reports for success, failure, stale validation, blocker,
  conflict, one human-only blocker, and a closed-child coordinator final pass;
- local sample resume state showing completed, active, blocked, and pending
  sidecar child work with artifact path, branch, checkout/worktree, PR,
  validation state, workflow status, blockers, refresh state, and cleanup
  eligibility;
- simulation of resume after one child PR has merged into the remote
  coordinator branch, one active child branch/worktree needs refresh, one child
  issue remains blocked, one child remains pending, and one child is ready for
  the next dependency layer;
- simulation proving resume fetches the remote coordinator branch and refreshes
  the local coordinator branch/worktree from that remote branch before marking
  completed children integrated, refreshing active children, or launching the
  next dependency layer;
- simulation proving reported merged metadata with squash- or rebase-style
  rewritten ancestry does not mark the original delivered child commit
  integrated or satisfy the terminal child gate;
- simulation of refreshing an active child branch/worktree from the updated
  local coordinator branch using a normal merge, with affected validation
  marked stale or rerun;
- simulation proving unexpected local coordinator changes, unsafe divergence,
  missing artifacts, missing branch state, unresolved human-only decisions,
  unsafe dependency state, and conflicting resume evidence stop the run before
  integration marking or next-layer launch;
- review that sidecar resume never uses private conversation context as the
  source of truth and never falls back to sequential mode when resume is
  unsafe;
- review that #259 does not duplicate the #254, #257, or #258 harnesses and that
  the complete end-to-end and cross-workflow validation completed by #260
  remains regression evidence;
- review that closed-child coordinator final passes use normal sequential state
  handling and do not use sidecar resumability state;
- review that commands and reviews are reported as passed, failed, skipped,
  timed out, interrupted, partial, stale, blocked, or not run;
- review that failed, timed-out, skipped, interrupted, partial, stale, blocked,
  and not-run validation is never summarized as passed;
- review that stale validation after coordinator branch updates or child branch
  refreshes blocks readiness until rerun or explicitly reported as stale;
- review that sidecar child PR readiness is ready only after the exact accepted
  child passes the durable launched-evidence, activation-head incorporation,
  ancestry-verification, and targeted-release gates, with fresh required
  validation, no unresolved child
  blocker, and approved sidecar PR target rules, and draft when required barrier
  or validation evidence is failed, incomplete, stale, not run, or blocked;
- review that child-specific blockers, coordinator-wide blockers, and
  shared-contract blockers are distinguishable and that shared-contract
  blockers stop affected sidecar work;
- review that non-trivial conflicts affecting contract, scope, persistence,
  security, authorization, UX, or domain behavior stop for user guidance;
- review that human-only blocker reports cover material architecture,
  production exposure, deployment, secrets, or Git/GitHub workflow issues;
- review that closed-child coordinator final-pass reports use normal sequential
  reporting and do not present closed child issue scope as newly implemented
  work;
- blocker simulation proving missing shared contracts stop for user guidance;
- review that seed-first execution is not required and foundation or
  shared-contract child issues are not invented or created without explicit
  user approval in a separately approved workflow that permits issue mutation;
- review that closed-child coordinator final passes do not use artifact
  preparation or sidecar Git rules;
- review that no required `parallel-ready` label is introduced;
- changed-file review proving the existing sequential implementation lifecycle
  is unchanged, any #261 change to that skill is limited to routing-boundary
  wording, and the existing coordinator/orchestration skill is unchanged;
- changed-file review proving no product code, real CatWorld sidecar worktrees,
  real CatWorld sidecar branches, real pull request operations, GitHub issue
  mutations, public comments, or unapproved remote cleanup are part of sidecar
  validation;
- #258 simulation proving a complete unique child ledger proceeds only when
  every child PR targets the coordinator branch and its commit is present in
  refreshed ancestry, including negative merged-metadata-only, wrong-target,
  active, blocked, pending, dependency-incomplete, missing, duplicate, and
  unexpected cases;
- #258 review proving historical validation attempts are preserved, exactly
  one current readiness result exists per requirement/evaluated state, all nine
  canonical statuses are handled, and unavailable/dishonest-to-run evidence is
  blocked or not run with a reason;
- #258 temporary Git simulation proving complete checks run at H; H2 has exactly
  one parent H and only the finalization artifact delta; the artifact uses
  `SELF/HEAD`, complete H and status-free H2 manifests, applicability reasons,
  pending H2 readiness, template/render requirements, and no literal self SHA;
- #258 negative two-head cases for a merge/wrong parent, extra path, H3,
  missing/wrong SELF marker, missing applicability, dirty state, failed H2
  external check, rejected normal push, and remote H2 mismatch;
- #258 scope simulation proving fetched `origin/main` target-base SHA and merge
  base are recorded/rechecked without updating local `main`, the PR-equivalent
  diff is reconciled with combined source maps, and base movement or unrelated
  scope blocks readiness;
- #258 actual-template rendering proving one ready coordinator-to-`main` PR has
  H/H2 validation, remote H2 proof, integrated child traceability, scope review,
  risks, final-only closing keywords, the required **"Create a merge commit"**
  instruction, and cleanup ineligibility;
- #258 existing-final-PR simulation proving same-run reuse avoids duplication
  and stale/inconsistent state stops without draft fallback or silent readiness
  mutation;
- #258 final artifact/report simulation proving resolved H2 statuses, final
  scope/readiness, rendered-body fingerprint, remote-source proof, and PR URL
  remain external and no H3 is created;
- #258 closing-isolation and prohibited-operation review plus explicit-range
  `git diff --check` validation.
