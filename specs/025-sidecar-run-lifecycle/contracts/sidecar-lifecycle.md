# Sidecar Lifecycle Contract

This contract defines the objective review target for issue #251. It describes
future sidecar workflow behavior, not active product-use routing before #261.

## Routing Matrix

| Request State | Current Build-Out Behavior | Post-#261 Activated Behavior |
|---------------|----------------------------|------------------------------|
| Normal issue | Use the existing sequential `catworld-implement-issue` workflow. | Same. |
| Direct child issue | Use the existing sequential `catworld-implement-issue` workflow. | Same unless explicitly handed off by an active sidecar coordinator run. |
| Non-coordinator issue with `parallel` | Stop with a routing error. | Stop with a routing error. |
| Eligible coordinator issue with `parallel` | Stop with a routing error that sidecar parallel is not active until #261. | Start or resume the sidecar coordinator lifecycle when preflight and source-of-truth checks pass. |
| Blocked coordinator `parallel` request | Stop and report the current activation or preflight blocker. | Stop and report child, dependency, source-of-truth, artifact, branch/worktree, validation, conflict, or human-only blockers. |
| Coordinator waiting for user merge | Report that the run is waiting and list exactly which child PRs the user must merge into the remote coordinator branch. | Same. |
| Resumed coordinator | Current build-out still stops before real sidecar execution. | Re-read current GitHub/repository evidence, refresh the local coordinator branch/worktree from the remote coordinator branch, then continue only when state is consistent. |
| All child PRs integrated | Current build-out still stops before real sidecar execution. | Proceed to integrated coordinator validation and final coordinator PR delivery. |
| Coordinator without `parallel` and open child issues | Use existing coordinator routing guardrail: stop with a routing error. | Same. |
| Coordinator without `parallel` and all child issues closed | Use existing sequential final-pass workflow and do not redo closed child scope. | Same. |

## Lifecycle States

| State | Entry Conditions | Stop Conditions | Allowed Next States |
|-------|------------------|-----------------|---------------------|
| 1. New coordinator `parallel` run | Prompt explicitly names a coordinator issue and includes `parallel`; #261 is activated for real execution. | #261 not active; issue not a coordinator; issue is ambiguous; required context cannot be read. | Coordinator preflight. |
| 2. Coordinator preflight | New or resumed run passes routing boundary. | Coordinator is not eligible, lacks listed children, or has unresolved source-of-truth blockers. | Source-of-truth and child issue inspection. |
| 3. Source-of-truth and child issue inspection | Coordinator issue and listed children are known. | Child issue context missing, contradictory, closed/open state incompatible with requested route, or governance artifacts conflict. | Artifact path/content planning; dependency-layer planning. |
| 4. Artifact path and content planning | Required issue and source context has been read. | Path collision, duplicate child issue number, missing source contract, or unresolved blocker. | Dependency-layer planning; coordinator branch/worktree preparation. |
| 5. Dependency-layer planning | Child issue map and source maps are available. | Hard dependencies cannot be ordered; conflict risk requires user sequencing; missing shared contract. | Coordinator branch/worktree preparation; report blocker. |
| 6. Coordinator branch/worktree preparation | Artifact paths/content are planned; branch/worktree targets are computed. | Cannot create or enter coordinator branch/worktree safely; target collisions; would modify local `main`. | Coordinator and child artifact writing. |
| 7. Coordinator and child artifact writing | Codex is inside the coordinator branch/worktree. | Artifact write would occur outside coordinator branch/worktree; artifact conflicts with approved scope. | Child branch/worktree preparation. |
| 8. Child branch/worktree preparation | Dependency-ready child layer exists and artifacts are written. | Child branch/worktree cannot be created safely from coordinator branch; collision; child target would be `main`. | Child handoff and child-agent launch for one dependency-ready layer. |
| 9. Child handoff and child-agent launch for one dependency-ready layer | One dependency-ready layer has valid child artifacts, Git context, and handoff input. | Missing handoff data; hard-dependent layer would start early; child scope unresolved. | Child implementation and child PR delivery; waiting for user merges. |
| 10. Child implementation and child PR delivery | Child agent receives valid prepared handoff and runs in prepared child context. | Child validation fails and cannot be fixed in scope; child blocker remains; PR target or issue wording violates sidecar rules. | Waiting for user merges. |
| 11. Waiting for user merges into remote coordinator branch | One or more child PRs are ready or draft for user review. | Required child PRs are unmerged; GitHub state cannot be read; user-owned merge is pending. | Resume after user merges. |
| 12. Resume after user merges | User indicates child PRs were merged, or current evidence shows merge progress. | Current GitHub/repository evidence conflicts with recorded resume state. | Fetch and refresh local coordinator branch/worktree. |
| 13. Fetch and refresh local coordinator branch/worktree | Remote coordinator branch contains new child merges. | Fetch fails; local coordinator state cannot be fast-forwarded or safely updated from remote. | Active child branch refresh; next dependency layer execution; integrated coordinator validation. |
| 14. Active child branch refresh | Active child branches/worktrees need updated coordinator state. | Refresh would require rebase, force-push, history rewrite, or unresolved conflict. | Next dependency layer execution; waiting for user guidance. |
| 15. Next dependency layer execution | Previous dependency layer is integrated and validation state is known. | Next layer has unresolved blockers, stale required evidence, or conflict risk. | Child branch/worktree preparation; integrated coordinator validation. |
| 16. Integrated coordinator validation | All child PRs are integrated into the coordinator branch. | Required coordinator or consumed child validation is failed, stale, skipped, partial, or not run. | Final coordinator PR to `main`; report blocker. |
| 17. Final coordinator PR to `main` | Integrated validation is fresh and passed, and no unresolved blocker remains. | PR target or closing authority violates sidecar rules; validation stale; user-owned merge still required. | Post-final-merge local cleanup eligibility. |
| 18. Post-final-merge local cleanup eligibility | Final coordinator PR has been merged into `main`. | Final PR not merged; cleanup target not created by sidecar workflow; remote cleanup lacks explicit approval. | Local cleanup may be reported as eligible; remote cleanup remains approval-gated. |

## Artifact Write Boundary Matrix

| Phase | Artifact Path Planning | Artifact Content Planning | Artifact File Writing | Local `main` Requirement |
|-------|------------------------|---------------------------|-----------------------|--------------------------|
| Preflight on `main` | Allowed | Allowed | Prohibited | Must remain clean; no sidecar artifacts, commits, or untracked files. |
| Coordinator branch/worktree preparation failed | Already planned paths/content may be reported | Already planned paths/content may be reported | Prohibited | Must remain clean. |
| Inside coordinator branch/worktree | Allowed | Allowed | Allowed only inside coordinator branch/worktree | Local `main` remains untouched. |
| Child branch/worktree preparation | Uses coordinator artifact state | Uses coordinator artifact state | Child work occurs only in prepared child context | Local `main` remains untouched. |

## Operation Ownership

| Operation | Owner |
|-----------|-------|
| Read-only issue, child issue, source-of-truth, and PR inspection | Codex |
| Sidecar artifact path/content planning | Codex |
| Coordinator branch/worktree preparation after #261 activation | Codex, only when lifecycle conditions permit |
| Child branch/worktree preparation after #261 activation | Codex, only from the coordinator branch and prepared context |
| Child implementation execution | Codex child executor, only from coordinator-provided artifacts |
| Child PR and final coordinator PR readiness reporting | Codex |
| Merging child PRs into the remote coordinator branch | User |
| Merging the final coordinator PR into `main` | User |
| Remote cleanup, issue mutation, public comments | User-approved only, when a permitted workflow explicitly allows it |
