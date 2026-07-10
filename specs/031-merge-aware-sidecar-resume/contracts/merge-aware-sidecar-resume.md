# Contract: Merge-Aware Sidecar Resume

This contract applies only to future activated sidecar coordinator parallel
execution after child PR delivery has paused the coordinator for user-owned
merges. It does not change normal sequential issue implementation, direct child
issue delivery outside `parallel`, or closed-child coordinator final passes.

## Resume Evidence Contract

Before continuing, the sidecar coordinator must re-read current evidence:

- coordinator issue body, state, labels, and listed child issues;
- child issue bodies, states, labels, dependencies, blockers, and source
  references;
- child PR states, target branches, readiness, and merge status;
- remote coordinator branch state;
- local coordinator branch and checkout/worktree state;
- active child branch and checkout/worktree state;
- coordinator artifact and child artifacts;
- validation evidence, status, and freshness;
- blocker, conflict, human-only decision, and cleanup approval state.

Private conversation context is never a source of truth. If current evidence
conflicts with recorded coordinator artifact state, resume must stop and report
the mismatch.

## Coordinator Refresh Contract

After the user merges child PRs into the remote coordinator branch, resume must:

1. fetch the remote coordinator branch;
2. verify local coordinator branch/worktree cleanliness and expected identity;
3. update local coordinator branch/worktree state from the remote coordinator
   branch by fast-forward or normal merge only;
4. stop on unexpected local changes, missing branch state, unsafe divergence,
   conflicts, failed fetch, or stale evidence that prevents a safe decision.

The coordinator refresh must not rebase, force-push, use force-with-lease,
rewrite history, update local `main`, merge into local `main`, delete local or
remote resources, mutate GitHub issues, or merge PRs.

## Child Integration and Active Child Refresh Contract

A child may be marked integrated only when:

- its PR is merged into the coordinator branch; and
- local coordinator branch/worktree state has been refreshed from the remote
  coordinator branch containing that merge.

Still-active child branches/worktrees refresh from the updated local
coordinator branch, not from stale local coordinator state. Refresh uses a
normal merge only when needed. Refresh blocks on conflicts, missing state,
unsafe divergence, rebase requirements, history rewriting, or any prohibited
operation.

Validation affected by coordinator refresh or active child refresh is stale
until rerun.

## Dependency-Layer Progression Contract

After observed merges and refresh, the coordinator recomputes dependency
layers from:

- child dependencies;
- integrated child state;
- active child state;
- blocked child state;
- pending child state;
- shared contract and conflict state;
- validation freshness;
- updated local coordinator branch state.

The coordinator may launch the next dependency-ready layer only when every hard
dependency is integrated into the updated local coordinator branch and no
blocker prevents launch. Unsafe resume must stop and report blockers instead
of silently switching to sequential mode.

## Coordinator Artifact Status Contract

After resume evaluation, the coordinator artifact must record:

- remote coordinator branch state;
- local coordinator branch/worktree state;
- child PR merge observations;
- merged/integrated children;
- active children and refresh state;
- blocked children and reasons;
- pending children and reasons;
- ready-next-layer children and prerequisites;
- validation freshness and stale evidence;
- blocker, conflict, human-only decision, cleanup approval, and cleanup
  eligibility state.

Artifact updates must be factual. They must not imply branches, worktrees, PRs,
merges, validation results, readiness, or cleanup approval before those states
are observed.

## Validation Contract

Validation must include:

- temporary Git simulation with one remote coordinator branch, one local
  coordinator branch/worktree, two child branches, and one child merged into
  the remote coordinator branch;
- proof that local coordinator state is fetched and updated from the remote
  coordinator branch before active child refresh;
- proof that the still-active child refreshes from the updated local
  coordinator branch by normal merge only;
- resume simulation for completed, active, blocked, pending, and
  ready-next-layer child states;
- proof that validation affected by coordinator or active child refresh is
  marked stale until rerun;
- blocker simulations for unexpected local coordinator changes, unsafe
  divergence, missing artifacts, missing branch state, unresolved human-only
  decisions, unsafe dependency state, and conflicting resume evidence;
- prohibited-operation review for rebase, force-push, force-with-lease,
  history rewriting, local `main` updates, GitHub issue mutation, PR merges,
  resource deletion, cleanup execution, and silent sequential fallback;
- `git diff --check`.
