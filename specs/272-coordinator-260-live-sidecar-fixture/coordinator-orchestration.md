# Coordinator Orchestration: #260 Live Sidecar Fixture

## Run Identity

- **schema version**: 1
- **run_id**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`
- **coordinator issue**: [#272](https://github.com/TheZenithPassage/catworld/issues/272)
- **coordinator title**: `[Workflow] #260 live sidecar fixture`
- **coordinator state**: `open`
- **coordinator labels**: none
- **parent dry-run**: [#260](https://github.com/TheZenithPassage/catworld/issues/260)
- **parent epic**: [#249](https://github.com/TheZenithPassage/catworld/issues/249)
- **classification**: workflow-only sidecar coordinator
- **stable final-delivery identity**: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb:272:main`
- **current lifecycle state**: layer-1 Git contexts created from the remotely durable initial runtime head; handoff-ready evidence `H = SELF/HEAD` is being established
- **current readiness**: #273 and #274 are handoff-ready but held with permissions false; dispatch remains prohibited until later `R` stores literal `H` and remote equality/ancestry pass; #275 remains dependency-blocked

This exact `run_id` is immutable. It identifies same-run resume and the later Git-common-directory cleanup journal; it must not be derived, shortened, renamed, or guessed.

## Routing Authorization

This is the one temporary pre-#261 routing-authorized run approved by #260. Current GitHub evidence must continue to agree that:

- the coordinator is issue #272;
- the canonical URL is `https://github.com/TheZenithPassage/catworld/issues/272`;
- the issue body explicitly says it is the sole controlled sidecar dry-run fixture authorized by #260 before #261;
- the issue body records this exact run ID and the complete unique child set #273, #274, and #275;
- the request includes `parallel` and every ordinary sidecar safety gate passes.

Title, label, branch prefix, stale artifact state, or private conversation is insufficient authorization. Missing, ambiguous, duplicated, stale, unsafe, or inconsistent current evidence stops the run. #261 remains the only general activation.

## Governing Source Contexts

The control and runtime contexts are intentionally separate.

| Context | Branch/ref | SHA | Checkout/worktree | Purpose |
|---------|------------|-----|-------------------|---------|
| #260 immutable workflow source `C2` | `chore/260-live-controlled-sidecar-dry-run`, based on `origin/workflow/sidecar-buildout` | `db175fe0a1911e9ea2a1931ae808b9771f874b57` | `C:\Users\moshe\Desktop\catworld` | Canonical corrected coordinator/child skills, #255/#256 contracts and validators, routing exception, architecture, and #260 decision artifacts consumed by every handoff |
| Runtime coordinator source | `origin/main` | `047569718767859289b9f48d68b635b8f7b7f1ac` | source ref only; local `main` is not checked out | Required runtime base |
| Runtime coordinator | `sidecar/272-coordinator-260-live-sidecar-fixture` | base `047569718767859289b9f48d68b635b8f7b7f1ac`; initial artifact head `421b2ac250c05c59eb3cade06b4056e02a6c8415`; `H = SELF/HEAD` | `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\272-coordinator-260-live-sidecar-fixture` | Artifact write boundary and integration worktree |

The 89-path build-out delta from `origin/main` to `origin/workflow/sidecar-buildout` is not merged, cherry-picked, or copied wholesale into the runtime branch. Immutable control revision `C2=db175fe0a1911e9ea2a1931ae808b9771f874b57` is pushed and fetched-equal at `origin/chore/260-live-controlled-sidecar-dry-run`. Later report-only recording head `C2r=76531c9aa0511c49dfd44eb196913a2600a044da` stores literal `C2`, is also pushed/fetched-equal, and does not replace `C2` as the workflow source or fingerprint input. The control context supplies governing workflow instructions; runtime worktrees supply Git execution state and tracked fixture artifacts.

### Required Sources Read

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/ARCHITECTURE.md`
- `.agents/skills/catworld-parallel-coordinator/SKILL.md`
- `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
- coordinator issue #272 and child issues #273–#275
- #260 and applicable #250–#259 issue/build-out evidence
- sidecar contracts under `specs/026-*` through `specs/033-*`
- `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`
- `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`

## Artifact Write Gate

| Evidence | Value | Status |
|----------|-------|--------|
| Runtime branch source | freshly fetched `origin/main@047569718767859289b9f48d68b635b8f7b7f1ac` | passed |
| Coordinator branch | `sidecar/272-coordinator-260-live-sidecar-fixture` | created |
| Coordinator worktree | exact path recorded above | created |
| Coordinator worktree status before artifact writes | empty `git status --porcelain` | passed |
| Artifact path collision | coordinator and all child paths absent from `origin/main` and control checkout | passed |
| Branch/worktree collision | every planned resource absent before creation | passed |
| Local `main` ref | `047569718767859289b9f48d68b635b8f7b7f1ac`; unchanged from baseline | passed |
| Local `main` worktree | none attached | passed |
| Artifact write boundary | runtime coordinator worktree only | passed |

The #260 control checkout is clean at pushed report-recording head `C2r=76531c9aa0511c49dfd44eb196913a2600a044da`, whose ancestry contains `C2`. It is not a runtime sidecar checkout and is not used to write runtime artifacts. Every runtime handoff and canonical fingerprint names immutable workflow source `C2=db175fe0a1911e9ea2a1931ae808b9771f874b57` rather than consuming stale instructions from runtime `main` or using `C2r` as the control revision.

The reconciled ten-file set was committed as initial runtime head
`I=421b2ac250c05c59eb3cade06b4056e02a6c8415`, normally pushed, fetched, and
proved equal to `origin/sidecar/272-coordinator-260-live-sidecar-fixture` before
either child Git context was created. Both approved layer-1 child branches and
worktrees were then created from exact `I`; both were clean at creation. No
#275 branch or worktree was created, and no layer-1 child remote ref existed.

## Inspected Child Issue Map

| Child | URL / State | Dependencies | Artifact / owned path | Preparation | Workflow / launch | Permissions | Dispatch/evidence | Non-launch reason |
|-------|-------------|--------------|-----------------------|-------------|-------------------|-------------|-------------------|-------------------|
| #273 layer1-a | `https://github.com/TheZenithPassage/catworld/issues/273` / open | none | `specs/273-260-fixture-layer1-a/`; `samples/result.md` | handoff-ready; actual Git context and content validated against `C2` | held-preflight / pending | implementation false; delivery false | authoritative canonical F `32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`; `H = SELF/HEAD`; R/L/A and child identity pending | push/fetch H, then publish literal-H recording head R before held dispatch |
| #274 layer1-b | `https://github.com/TheZenithPassage/catworld/issues/274` / open | none | `specs/274-260-fixture-layer1-b/`; `samples/result.md` | handoff-ready; actual Git context and content validated against `C2` | held-preflight / pending | implementation false; delivery false | authoritative canonical F `37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba`; `H = SELF/HEAD`; R/L/A and child identity pending | push/fetch H, then publish literal-H recording head R before held dispatch |
| #275 layer2-summary | `https://github.com/TheZenithPassage/catworld/issues/275` / open | hard-depends on #273 and #274 | `specs/275-260-fixture-layer2-summary/`; `samples/result.md` | prepared; reconciled to `C2`; not handoff-ready | waiting-for-dependency-merge / waiting-for-dependency-merge | implementation false; delivery false | authoritative fingerprint not computed; no child Git context/identity; H/R/L/A absent | both first-layer commits must be ancestry-proven integrated after remote/local coordinator refresh |

The child set is complete and unique. No duplicate issue number, same-number artifact prefix, sibling-owned surface, or unexpected child exists.

### Layer 1 Handoff Evidence

| Child | Exact child Git context | Canonical fingerprint | H | R | L / A / identity |
|-------|-------------------------|-----------------------|---|---|------------------|
| #273 | `sidecar/273-260-fixture-layer1-a@421b2ac250c05c59eb3cade06b4056e02a6c8415`; exact planned worktree; clean; no remote ref | `32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811`, freshly recomputed from the exact 21-field payload after Git creation | `SELF/HEAD`; this commit contains the complete immutable handoff-ready evidence | pending separate recording commit that stores literal H | pending / pending / none |
| #274 | `sidecar/274-260-fixture-layer1-b@421b2ac250c05c59eb3cade06b4056e02a6c8415`; exact planned worktree; clean; no remote ref | `37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba`, freshly recomputed from the exact 21-field payload after Git creation | `SELF/HEAD`; this commit contains the complete immutable handoff-ready evidence | pending separate recording commit that stores literal H | pending / pending / none |

No held child has been dispatched. H itself cannot contain its own literal SHA;
the immediately following bounded recording commit R resolves exact H. Dispatch
requires fetched current remote equality to R and ancestry proof from H to R.

## Dependency Layers and Conflict Classification

### Layer 1

- #273 and #274 are independent candidates.
- They own different artifact directories and different result files.
- Neither consumes the other's output.
- They may launch together only after both artifact sets are handoff-ready, both child Git contexts are prepared, the remote coordinator branch exists, and the shared contract remains non-conflicting.

### Layer 2

- #275 hard-depends on both #273 and #274.
- #275 must not launch when either prerequisite PR is unmerged, when the local coordinator has not been refreshed from the remote containing both merges, or when either delivered child commit is absent from refreshed coordinator ancestry.
- #275 consumes both integrated result paths and markers.

### Conflict Risks

- **First-layer file conflict**: none; paths are disjoint.
- **Shared workflow-source conflict**: prohibited; no child owns routing, skills, templates, or coordinator artifacts.
- **Coordinator bookkeeping movement**: correctness risk. Every child validation is bound to current fetched coordinator state; relevant coordinator movement may stale evidence and must be rerun or receive a specific applicability review.
- **Template context mismatch**: final-stage risk. The control and runtime template blobs differ and must be re-evaluated honestly before final rendering; no runtime-base substitution is allowed.

## Shared Implementation Contract

All children share these immutable values:

- run ID: `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`;
- coordinator: #272;
- runtime coordinator branch: `sidecar/272-coordinator-260-live-sidecar-fixture`;
- child PR target: that coordinator branch, never `main`;
- immutable workflow source: `C2 = db175fe0a1911e9ea2a1931ae808b9771f874b57`; publication record `C2r = 76531c9aa0511c49dfd44eb196913a2600a044da` is separate evidence and never a fingerprint input;
- child PR issue wording: exactly the child issue and `Related to #272`; no other #260 PR-body issue reference and no closing keyword;
- merge method: user-owned GitHub merge commit so the delivered child commit remains in coordinator ancestry;
- product behavior: unchanged;
- validation status vocabulary: `passed`, `failed`, `skipped`, `timed out`, `interrupted`, `partial`, `stale`, `blocked`, or `not run`.

### Held Child Dispatch Barrier

This run uses the approved bounded non-atomic barrier from immutable control revision `C2`; it adds no transaction framework, filesystem lock, queue, daemon, IPC service, or polling loop.

For a dependency-ready layer:

1. After actual child branches/worktrees exist, recompute the canonical v1 fingerprints and record exact prepared contexts with preparation `handoff-ready`, factual launch `pending`, workflow `held-preflight`, implementation false, delivery false, and exact `C2`.
2. Commit/push immutable handoff-ready evidence `H`. A later bounded recording commit `R` stores literal `H`. Fetch and require current remote equality to `R` plus ancestry containment of `H` before dispatch. Child branches may remain clean and behind `R`.
3. Dispatch each selected child once to a stable canonical preflight-only agent identity. Acceptance requires exact run/child/branch/worktree/`C2`/H/R/fingerprint correlation. During held preflight the child performs zero edits, task execution, staging, commits, pushes, PR operations, or GitHub mutation.
4. Only accepted dispatch makes factual launch `launched`. Commit/push exact launched evidence `L` with the stable identity while the child stays held. A later activation/recording commit `A` stores literal `L` and records implementation/delivery true subject to child revalidation. Fetch and require current remote equality to `A` plus ancestry containment of `L`.
5. Target only the same stable child with exact H/R/L/A. `A` records implementation/delivery true subject to child revalidation, but effective child authority remains false during targeted durable continuation. That child fetches and cleanly incorporates `A` by normal fast-forward or merge, verifies `L` ancestry and every identity/permission field, then acknowledges release. Only that acknowledgment makes the conditional permissions effective for prepared implementation and later delivery gates.

Each prepared-handoff identity uses schema `sidecar-prepared-handoff-v1`. Construct a PowerShell `[ordered]` object with exactly these fields in order: `Schema`, `RunId`, `CoordinatorIssueNumber`, `ChildIssueNumber`, `CoordinatorBranch`, `CoordinatorRemoteBranch`, `CoordinatorWorktree`, `ChildBranch`, `ChildWorktree`, `ControlRevision`, `PreparedSpec`, `PreparedPlan`, `PreparedTasks`, `DependencyLayer`, `HardDependencies`, `PrTargetBranch`, `PrRelatedReferences`, `ArtifactPreparationState`, `LaunchState`, `ImplementationPermission`, and `DeliveryPermission`. Issue/layer/dependency values use integer types; dependencies are an ascending integer array; PR references are the exact child-then-#272 string array; states are `handoff-ready` and `pending`; permissions are Boolean false. Serialize with `ConvertTo-Json -Compress -Depth 4`, hash the JSON's UTF-8 bytes with SHA-256, and encode 64 lowercase hex without a prefix.

Prepared artifact paths and content are validated separately. Artifact blob/content hashes, the fingerprint itself, H/R/L/A, `C2r`, and the later stable child identity are excluded from the fingerprint, avoiding self-containing artifacts and future-evidence cycles. The expected planned layer-1 values are F273 `32fe5281412d44861c0b040e4d9a7fe96cea10b00bdc8dcdfa035e9ff5d56811` and F274 `37c8c99634ae0216c0f2e556f390728c90cc99b0905719efd3099a67b10268ba`; neither becomes authoritative handoff evidence until the actual Git context matches and the value is recomputed before H. #275 has no authoritative fingerprint while dependency-blocked and without a Git context. No random launch-attempt ID is added.

For the first layer, both #273 and #274 remain non-editing until the batch's `L` and `A` are durable. Rejected dispatch records no launch. Ambiguous dispatch is not retried or duplicated. H/R/L/A commit, push, equality, ancestry, incorporation, or release failure keeps affected children non-editing and blocks delivery. If factual `L` is durable but `A` fails, retain `launched` while permissions remain ineffective. An unverifiable launched child identity blocks replacement dispatch. #275 remains waiting throughout this layer.

### Result Content Contract

| Child | Required run identity | Required own marker | Required consumed markers |
|-------|-----------------------|---------------------|---------------------------|
| #273 | exact run ID | `layer1-a-complete` | none |
| #274 | exact run ID | `layer1-b-complete` | none |
| #275 | exact run ID | `layer2-summary-complete` | `layer1-a-complete`, `layer1-b-complete` from integrated dependency files |

Each result is a small Markdown sample artifact. No child may redefine this contract, regenerate planning artifacts, create sibling scope, edit an issue, or touch product code.

## Child-Owned and Shared Surfaces

### Child-Owned Implementation Surfaces

- #273: only `specs/273-260-fixture-layer1-a/samples/result.md`
- #274: only `specs/274-260-fixture-layer1-b/samples/result.md`
- #275: only `specs/275-260-fixture-layer2-summary/samples/result.md`

### Coordinator-Owned Surfaces

- `specs/272-coordinator-260-live-sidecar-fixture/coordinator-orchestration.md`
- all prepared child `spec.md`, `plan.md`, and `tasks.md` files
- factual launch, PR, merge, validation, resume, ledger, H, and pending-H2 state until H2 freezes the artifact

### Shared Surfaces Requiring Caution

- `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`
- `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`
- current coordinator branch/ref and artifact bookkeeping commits
- no child is permitted to modify a shared surface

## Branch and Worktree Plan

- **normalized Git common directory**: `C:/Users/moshe/Desktop/catworld/.git`
- **worktree root**: `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`

| Resource | Branch | Source | Exact worktree | Local state | Remote state | Same-run ownership |
|----------|--------|--------|----------------|-------------|--------------|--------------------|
| Coordinator | `sidecar/272-coordinator-260-live-sidecar-fixture` | `origin/main@047569718767859289b9f48d68b635b8f7b7f1ac` | `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\272-coordinator-260-live-sidecar-fixture` | initial artifact head `421b2ac250c05c59eb3cade06b4056e02a6c8415` published; H is `SELF/HEAD` | initial head fetched-equal before H; H push pending | recorded for this run |
| Child #273 | `sidecar/273-260-fixture-layer1-a` | exact initial coordinator artifact head `421b2ac250c05c59eb3cade06b4056e02a6c8415` | `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\273-260-fixture-layer1-a` | created at exact source; clean; behind pending H/R by design | none | recorded for this run |
| Child #274 | `sidecar/274-260-fixture-layer1-b` | exact initial coordinator artifact head `421b2ac250c05c59eb3cade06b4056e02a6c8415` | `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\274-260-fixture-layer1-b` | created at exact source; clean; behind pending H/R by design | none | recorded for this run |
| Child #275 | `sidecar/275-260-fixture-layer2-summary` | refreshed coordinator branch after layer 1 integration | `C:\Users\moshe\Desktop\catworld-sidecar-worktrees\sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb\275-260-fixture-layer2-summary` | planned; no branch/worktree yet | none | planned only; not yet owned as created |

No child branch starts from `main`. No branch/worktree may be renamed, guessed, auto-recovered, deleted, rebased, or force-updated.

## PR Target and Delivery Plan

| Delivery | Source | Target | Issue wording | Readiness rule | Current state |
|----------|--------|--------|---------------|----------------|---------------|
| Child #273 | `sidecar/273-260-fixture-layer1-a` | coordinator branch | exactly `Related to #273` and `Related to #272`; no other #260 reference or closing words | ready only after same-child release, current A/L evidence, scoped completion, fresh passing validation, and no blocker | pending |
| Child #274 | `sidecar/274-260-fixture-layer1-b` | coordinator branch | exactly `Related to #274` and `Related to #272`; no other #260 reference or closing words | ready only after same-child release, current A/L evidence, scoped completion, fresh passing validation, and no blocker | pending |
| Child #275 | `sidecar/275-260-fixture-layer2-summary` | coordinator branch | exactly `Related to #275` and `Related to #272`; no other #260 reference or closing words | ready only after both dependencies integrate, same-child release, current A/L evidence, and fresh validation | pending |
| Runtime final | coordinator branch at verified H2 | `main` | closing keywords only for #272–#275; `Related to #260` | exactly one ready PR; no draft fallback | pending |
| #260 build-out | `chore/260-live-controlled-sidecar-dry-run` | `workflow/sidecar-buildout` | `Related to #260` | after accepted final runtime merge/evidence only | outside runtime branch; pending |

### Mutation and Authority State

- controlled fixture issue creation/body update: explicitly approved by #260 and completed;
- additional issue body/checklist/label/assignee/milestone/state mutation: not approved;
- public comments: not approved;
- scoped child commits, normal pushes, and child PR creation: permitted only after exact H/R/L/A verification and release of the same stable child; a merely valid prepared handoff is insufficient;
- child and final PR merges: user-owned only;
- PR approval/auto-merge: prohibited;
- remote branch deletion/pruning/cleanup: not approved;
- local destructive cleanup: not approved; eligibility alone never authorizes deletion.

## Template Evidence

| Template | Control/build-out blob | Runtime-main blob | Current decision |
|----------|------------------------|-------------------|------------------|
| Child to coordinator | `536d9aabb6384ca8da78a5d4a34284869e877db0` | `17c997b7c0530d2d4f32db9df29c339556e62ba2` | render from the governing control context and validate output against current sidecar contract |
| Final coordinator to main | `df6f433ed1466f5db2d93f0addf3b1df149d89b2` | `73fe872fa434a0c9f5dbb758bd89d6797fa2dd36` | re-evaluate at H/H2; stop if the approved workflow requires the runtime-HEAD blob rather than the governing control blob |

No template is copied into the runtime branch merely to erase this context difference.

## Validation Plan and Current Results

Historical attempts are preserved. Current readiness uses exactly one result per requirement and evaluated state.

| Requirement | Evaluated state | Command or review | Current status | Freshness / Notes |
|-------------|-----------------|-------------------|----------------|-------------------|
| Routing authorization | fetched #272 body plus immutable `C2` | exact identity/body/run review plus routing matrix | passed | current at canonical correction reconciliation |
| Fixture issue set | current #272–#275 bodies | issue/body/dependency/source-map/PR-wording review | passed | #273–#275 require exactly child + #272 PR references |
| Runtime base | `origin/main@047569718767859289b9f48d68b635b8f7b7f1ac` | fetch, ref, merge-base review | passed | current at coordinator creation |
| Coordinator branch/worktree identity | runtime coordinator at source SHA | branch, HEAD, worktree inventory | passed | current before artifact writes |
| Coordinator clean write gate | runtime coordinator at source SHA | `git status --porcelain` | passed | captured before artifact writes |
| Artifact collision gate | all four artifact paths | ref/tree/filesystem collision review | passed | current before artifact writes |
| Historical first live dispatch attempt | original staged ten-file artifact set and pre-correction contract | cross-source launch ordering review | failed | preserved: child required durable launched before accepting the handoff that makes launch factual; no child dispatch occurred |
| First immutable control correction | `C1=a19af010dfe63eaf27b68717ce9b38042372f973`, `C1r=0dd0e867cc52320875a1dd6c2928024f4e512c21` | pushed/fetched equality and initial barrier validation | passed (historical) | superseded before runtime use when reconciliation found the handoff fingerprint included not-yet-created H |
| Canonical immutable control correction | `C2=db175fe0a1911e9ea2a1931ae808b9771f874b57`, `C2r=76531c9aa0511c49dfd44eb196913a2600a044da` | both push/fetch equality checks, identical 21-field schema audit, #255 12-scenario and #256 19-scenario matrices, protected operations, task/checklist/diff gates | passed | sole runtime workflow source; content validation is separate; self/H/R/L/A/identity inputs excluded; held preflight and targeted incorporation are distinct |
| Historical child artifact completeness/scope | original exact nine child artifact files | exact-file-set, run-ID, placeholder, task-syntax, premature-result, and source-map review | passed | historical; superseded by in-place barrier reconciliation |
| Historical coordinator artifact completeness/factual state | original coordinator artifact | required-section, exact run identity, and factual-state review | passed | historical; superseded by this in-place barrier reconciliation |
| Reconciled ten-file artifact set | exact ten files committed at `421b2ac250c05c59eb3cade06b4056e02a6c8415` over preserved index blobs | exact path/index identity, canonical 21-field order, F273/F274 recomputation, independent content validation, state/permission vocabulary, H/R/L/A absence, exact PR blocks, 8/18/13 unchecked task sequences, premature-result and child-resource absence, cached/working/combined diff checks | passed | immutable initial runtime evidence; #275 remains without an authoritative fingerprint |
| Initial remote coordinator publication | `421b2ac250c05c59eb3cade06b4056e02a6c8415` | normal push, fetch, local/fetched-remote equality | passed | completed before layer-1 child Git creation |
| Child Git context | layer 1 branches/worktrees | exact branch/source/path/clean/isolation and remote-absence review | passed | #273 and #274 created clean at exact initial head; #275 absent |
| Layer-1 canonical handoff identity | actual #273/#274 Git contexts plus separately validated prepared content | exact ordered 21-field payload recomputation | passed | F273/F274 equal the authoritative values recorded above immediately before H |
| Layer-1 handoff evidence H | `SELF/HEAD` | changed-file, state/permission, exact fingerprint, no-result, no-identity review | passed | push/fetch and literal-H recording head R remain required before dispatch |
| Child implementation validation | layer 1 child heads | owned-file diff, explicit-range whitespace, marker/run checks | not run | no handoff launched |
| Integrated coordinator validation | literal H | complete live runtime checks | not run | terminal child gate not reached |
| H2 affected checks | literal H2 | pending manifest | not run | H2 does not exist |

### Child Focused Validation Contract

For each selected child, preflight and later implementation validation require:

1. exact `C2`, canonical v1 fingerprint recomputation, separately validated prepared content, run, issue, checkout, branch/worktree, dependency layer, H/R, and identity correlation;
2. current fetched remote equality to R plus H ancestry before dispatch, with launch `pending`, workflow `held-preflight`, permissions false, and zero child repository/GitHub mutation;
3. after accepted dispatch, current fetched remote equality to A plus L ancestry, the same stable child identity, clean incorporation of A, effective permissions, and explicit release acknowledgment before any task executes;
4. `git diff --name-only <current-activation-head>...HEAD` lists only the owned result path;
5. `git diff --check <current-activation-head>...HEAD` exits zero;
6. the owned result contains the exact run ID and required marker(s);
7. the changed-file review matches the source map;
8. the child PR source/target/body/readiness are correct and current, with exactly two `Related to` references.

Relevant coordinator movement or active-child refresh makes affected validation stale until rerun. An artifact-only coordinator bookkeeping update may retain an H result only with a specific non-empty applicability reason after current base/head/scope review; it is never assumed fresh silently.

## Sidecar Resume State

Current evidence must be re-read before every resume. Private conversation is not a source of truth.

| Child | Preparation | Branch / Worktree | PR | Layer | Workflow / launch | Permissions | H/R/L/A and child identity | Validation / refresh | Cleanup |
|-------|-------------|-------------------|----|-------|-------------------|-------------|----------------------------|----------------------|---------|
| #273 | handoff-ready; actual context validated | created clean at `421b2ac250c05c59eb3cade06b4056e02a6c8415` / exact recorded path | none | 1 | held-preflight / pending | false / false | H `SELF/HEAD`; R/L/A pending; no dispatch identity | H precommit checks passed / release not started | ineligible: pending final PR merge |
| #274 | handoff-ready; actual context validated | created clean at `421b2ac250c05c59eb3cade06b4056e02a6c8415` / exact recorded path | none | 1 | held-preflight / pending | false / false | H `SELF/HEAD`; R/L/A pending; no dispatch identity | H precommit checks passed / release not started | ineligible: pending final PR merge |
| #275 | prepared; reconciled; not handoff-ready | planned / planned | none | 2 | waiting-for-dependency-merge / waiting-for-dependency-merge | false / false | absent; no dispatch identity | not run / not needed | ineligible: pending final PR merge |

Before H2, update this artifact when factual state changes: artifact readiness, branch/worktree creation, H/R publication, dispatch acceptance/rejection/ambiguity and stable identity, L/A publication, release success/failure, held-preflight zero-mutation and barrier-only incorporation evidence, PR creation, user merge observation, stale validation, coordinator/active-child refresh, integration, next-layer readiness, blockers, terminal child accounting, H results, and pending H2 manifest.

## Prepared Child Integration Ledger

The ledger is complete by identity but not terminal by workflow state.

| Child | Expected PR target | PR / Merge observation | Required commit ancestry | Terminal state |
|-------|--------------------|------------------------|--------------------------|----------------|
| #273 | coordinator branch | none / not observed | pending | pending |
| #274 | coordinator branch | none / not observed | pending | pending |
| #275 | coordinator branch | none / not observed | pending | waiting-for-dependency-merge |

Integrated validation is prohibited until each row is uniquely `integrated`, every PR target/merge is current, and every delivered commit is present in refreshed local coordinator ancestry.

## Integrated Scope Review State

- **runtime B**: pending a fresh fetch at H; the creation base is `047569718767859289b9f48d68b635b8f7b7f1ac` but must not be preclaimed as final B;
- **PR-equivalent merge base**: pending at H;
- **expected runtime paths before H2**: this coordinator artifact, nine prepared child artifact files, and three child result files;
- **product paths**: none;
- **current scope result**: pending integrated state;
- **unexplained scope blocker**: none observed yet; final review pending.

## Finalization State

- **B**: pending fresh `origin/main` fetch at H
- **H**: pending fully integrated coordinator head and complete validation
- **H2 identity**: `SELF/HEAD` only after the direct artifact-only commit exists
- **expected H2 parent**: pending literal H
- **sole H..H2 path**: `specs/272-coordinator-260-live-sidecar-fixture/coordinator-orchestration.md`
- **complete H checks**: pending
- **status-free H2 rerun manifest**: pending
- **per-H-check applicability reasons**: pending
- **readiness**: pending H and H2 checks
- **final template**: governing control blob recorded above; final applicability recheck pending
- **remaining risk**: control/runtime template blob difference must be resolved honestly at finalization
- **cleanup**: `ineligible`; reason `pending final PR merge`

H2 will freeze this branch-bound artifact. Resolved H2 statuses, remote H2 equality, rendered-body fingerprint, final PR URL/state, final merge confirmation, and cleanup journal results remain external evidence; no H3 or H4 may be created to record them.

## Blockers and Prerequisites

### Current Blockers

- Child-specific: none.
- Coordinator-wide: none.
- Shared-contract: none.
- Conflict: none.
- Human-only: none.

### Historical Blockers (preserved, resolved by `C2`)

The first live attempt stopped before runtime commit, push, child Git creation, dispatch, or PR because the child required durable `launched` before it could accept the handoff whose real dispatch makes `launched` factual. That result remains `failed` historical evidence. The first published correction `C1/C1r` introduced H/R held preflight and L/A same-child release, but runtime reconciliation then found its fingerprint wording included not-yet-created H. An independent pre-`C2` review also required one executable canonical serialization and a precise boundary between read-only held preflight and barrier-only Git incorporation. No runtime commit or dispatch consumed `C1`. Immutable `C2` resolves the bounded defect without reclassifying either historical finding as passed or adding infrastructure.

### Pending Prerequisites (not claimed as blockers)

- normally push/fetch exact H, then commit/push/fetch R storing literal H with permissions false;
- dispatch #273/#274 once each in stable preflight-only mode, persist/fetch exact L then A for the accepted batch, and release only those same identities after clean incorporation and verification.

If factual coordinator-artifact bookkeeping causes an unresolvable validation/target-base loop, stop as a concrete workflow defect and preserve all state.

## Stop Conditions

Stop immediately on any:

- routing identity/body/run mismatch;
- issue, artifact, branch, ref, directory, worktree, or PR collision without proven same-run ownership;
- dirty required runtime checkout at a clean-state gate;
- missing or conflicting child artifact/shared contract/source map;
- sibling scope leakage or product-code change;
- unsafe push, unexpected divergence, merge conflict, rebase/history-rewrite requirement, or remote mismatch;
- stale required evidence that cannot be rerun honestly;
- rejected, missing, ambiguous, duplicated, unavailable, or mismatched held-child identity;
- H/R/L/A commit, push, fetched-current-head equality, ancestry, clean incorporation, permission, or release failure;
- any child edit, staging, prepared task execution, commit, push, PR operation, or GitHub mutation before exact same-child release;
- unmerged or non-ancestry-proven hard dependency;
- wrong PR target, closing wording on a child PR, duplicate final PR, or readiness mismatch;
- incomplete child ledger, unexplained scope, invalid H/H2 relation, or template evidence conflict;
- unresolved child-specific, coordinator-wide, shared-contract, conflict, or human-only blocker.

On defect, preserve every issue, PR, branch, worktree, ref, artifact, and evidence item; report actual state, expected state, impact, and the smallest likely correction. Do not redesign, clean up, or continue as though the run passed.

## Final Coordinator PR Plan

After every child is uniquely integrated and finalization gates pass:

1. fetch current `origin/main` without updating local `main`;
2. record B and PR-equivalent merge base, reconcile complete scope, and run complete checks at H;
3. commit only this factual artifact update as direct child H2;
4. prove direct parent and sole-path delta, run H2-affected checks, and normally push/fetch remote equality;
5. re-fetch/recheck base, merge base, local/remote H2, ancestry, scope, validation, template inputs, and existing same-run PR evidence;
6. render the approved final template with current evidence;
7. create exactly one ready PR from the coordinator branch to `main`, closing #272–#275 and using `Related to #260`;
8. stop immediately for the user-owned merge.

No draft fallback, duplicate PR, issue mutation, comment, merge, approval, auto-merge, H3/H4, local cleanup, or remote cleanup is permitted.

## Cleanup Plan

Until the final runtime PR is confirmed merged into `main`, cleanup remains `ineligible` with reason `pending final PR merge`. After confirmation, evaluate the exact same-run resource ledger and write:

`C:/Users/moshe/Desktop/catworld/.git/catworld-sidecar/runs/sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb/cleanup-state.json`

The journal has exactly `schema_version`, `run_id`, `eligibility`, `owned_resources`, `skipped_reasons`, `attempted_operations`, `result`, and `updated_at_utc`. Without separate current destructive authority, record `eligibility = eligible`, `result = not_started`, no attempted operations, and the missing-authority reason. Do not delete local or remote resources.
