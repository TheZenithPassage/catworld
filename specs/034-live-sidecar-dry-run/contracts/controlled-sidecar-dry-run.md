# Controlled Sidecar Dry-Run Contract

## Identity and Routing

The sole pre-#261 exception is the coordinator issue whose exact number and URL are recorded by the #260 build-out evidence and whose current body explicitly contains this meaning:

> This issue is the controlled sidecar dry-run fixture for #260.

The wording may be embedded in a fuller bespoke fixture body, but both the durable body meaning and the exact #260 record must agree. A title, label, branch prefix, copied marker on another issue, or private conversation is insufficient.

A routing-authorized run is either:

1. an eligible coordinator `parallel` run after #261 general activation; or
2. this one verified #260 controlled fixture before #261.

The #260 exception loses authorization and stops when identity is missing, duplicated, ambiguous, stale, inconsistent, unsafe, or unrelated. Issues #220 through #234 remain excluded. Normal issues and direct children remain sequential; their `parallel` requests remain invalid. Ordinary pre-#261 coordinator `parallel` requests remain blocked.

## Fixture Issue Topology

- One workflow-only coordinator issue.
- Two independent first-layer child issues, each owning one different harmless Markdown fixture file.
- One second-layer child issue with an explicit hard dependency on both first-layer children, owning a third Markdown summary/index that consumes both results.

Fixture issue bodies must identify the run, parent coordinator, owned file, dependencies, validation, out-of-scope behavior, and exact child-PR wording. A child PR contains only `Related to #<child-issue>` and `Related to #<coordinator-issue>`; it contains no additional #260 issue reference and no closing wording. Fixture issues must not request labels, assignees, milestones, comments, issue-state changes, product work, or cleanup.

## Git and Artifact Contexts

- Control/build-out: `chore/260-live-controlled-sidecar-dry-run`, based on fetched `origin/workflow/sidecar-buildout`.
- Runtime coordinator: deterministic branch and isolated worktree based on fetched `origin/main`.
- Runtime children: deterministic branches and isolated worktrees based on the coordinator branch.
- Child PR base: runtime coordinator branch.
- Final runtime PR base: `main`.
- Final #260 PR base: `workflow/sidecar-buildout`.

The coordinator artifact records the control ref/path as governing workflow context and the runtime refs/paths as execution context. Runtime artifacts are written only inside the coordinator worktree. No build-out delta is merged or copied wholesale into the runtime branch.

## Stage Contract

### Preparation

Create and record the exact fixture issues and run ID. Prepare the coordinator artifact, all child artifact sets, runtime coordinator branch/worktree, remote coordinator branch, and dependency-ready child resources. Prove local `main` remains unchanged and clean. Every prepared handoff records the exact immutable pushed #260 control-plane commit whose corrected coordinator/child workflow contract it consumes.

### Two-phase child dispatch barrier

This is an ordered safety barrier, not an atomic transaction.

Before dispatch, the coordinator computes the canonical `sidecar-prepared-handoff-v1` identity fingerprint. The ordered JSON payload contains schema, run ID, coordinator/child issue integers, exact coordinator branch/remote/worktree, exact child branch/worktree, 40-hex control revision, prepared spec/plan/tasks paths, dependency layer, ascending hard dependencies, PR target, exact child-then-coordinator related-reference array, `handoff-ready`, `pending`, and false implementation/delivery Booleans. Serialize with PowerShell `ConvertTo-Json -Compress -Depth 4`, hash the JSON's UTF-8 bytes with SHA-256, and encode 64 lowercase hex without a prefix. Artifact content is validated separately; the fingerprint itself, artifact blob/content hashes, evidence SHAs, recording/activation heads, and child identity are excluded. The coordinator records each selected child as `handoff-ready` with factual non-launched state, implementation permission false, delivery permission false, that fingerprint, run ID, child issue, branch, and worktree. It commits and normally pushes exact evidence commit `R`, resolves its literal SHA, then uses one later bounded recording commit `Rr` to store `R`. It pushes/fetches `Rr`, proves the current remote ref equals `Rr`, and proves `R` is in its ancestry before dispatch. `R` and `Rr` are separate dispatch-correlation fields, not fingerprint inputs; a tracked commit is never required to contain its own final SHA.

The coordinator dispatches exactly one logical child per selected issue through a supported held/preflight-only capability. Dispatch is accepted only when it returns an unambiguous stable child/task identity. The held child may validate identity, prepared artifacts, Git context, dependency layer, handoff-ready remote evidence, and disabled permissions, but it performs zero repository or GitHub mutation and executes no prepared implementation task.

After accepted dispatch, `launched` is factual because the handoff was sent through the approved capability. The coordinator records that stable child identity and factual launch state, commits and normally pushes exact launched evidence `L`, resolves its literal SHA, then uses one later bounded activation/recording commit `Lr` to store `L` and permission true subject to child revalidation. It pushes/fetches `Lr`, proves the current remote ref equals `Lr`, and proves `L` is in its ancestry. Implementation and delivery permission become effective only through that verified activation state; an unpushed local artifact cannot activate them.

The coordinator then targets only the same stable child identity for release and supplies exact `R`, exact `L`, and current activation head `Lr`. That child fetches current remote coordinator evidence, updates its still-clean branch to `Lr` by allowed fast-forward or normal merge, proves `Lr` contains `L`, verifies matching run/child/Git/handoff identity, factual `launched`, and effective implementation/delivery permissions, and confirms the worktree stayed clean. Only after release acknowledgment may prepared tasks begin.

Rejected dispatch records no `launched`. Ambiguous dispatch creates no retry or duplicate and leaves affected children held. Handoff-ready or launch evidence/recording commit or push failure, child refresh/ancestry verification failure, or release failure performs no child implementation or delivery. Release failure does not roll factual `launched` back to pending. If a resumed session cannot verify the exact held child identity, it stops rather than dispatching a replacement blindly.

### First layer

Run the barrier for exactly both independent children and keep both preflight-only until factual launch evidence for the batch is durable. Release only the exact accepted identities. Each released child implements only prepared tasks, validates, commits, normally pushes, and opens one ready PR to the coordinator branch with exactly the child and coordinator `Related to` lines. Stop at Mandatory Pause 1 and instruct the user to merge exactly one selected PR with a merge commit, not squash or rebase, so the child commit remains ancestry-provable.

### Partial first-layer merge

After the user reports exactly one PR merge-committed, re-read current evidence, refresh the local coordinator branch from its remote, prove ancestry, mark affected evidence stale, normally merge-refresh the active child, rerun affected validation, and stop at Mandatory Pause 2. The remaining child must also be merged with a merge commit after that checkpoint.

### Complete first layer and dependent layer

After the remaining first-layer PR is reported merged, re-read and refresh evidence, prove both results integrated, recompute dependencies, launch only the dependent child, deliver its ready PR, and stop at Mandatory Pause 3.

### Finalization

After the dependent PR is reported merged, re-read and refresh all evidence, require a complete unique integrated ledger, run complete checks at H, create and validate artifact-only direct child H2, normally push and verify remote equality, create exactly one ready final PR to `main`, and stop at Mandatory Pause 4.

### Post-merge and #260 delivery

After the final runtime PR is reported merged, confirm the merge and unchanged local `main`, evaluate cleanup eligibility in the approved local journal without deletion, record accepted evidence on the #260 build-out branch, validate, normally push, and open one ready PR to `workflow/sidecar-buildout` using `Related to #260`.

## Stop Contract

At a mandatory pause, user-owned merge is the only next action. On a concrete defect or inconsistent evidence, preserve all issues, PRs, branches, worktrees, artifacts, and refs; report the exact actual/expected state and smallest likely correction; do not continue or clean up. The first live attempt's launch-state circularity remains historical failed evidence and must never be rewritten as a passing attempt.
