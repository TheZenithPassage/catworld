# Feature Specification: Live Sidecar Dry Run

**Feature Branch**: `chore/260-live-controlled-sidecar-dry-run`

**Created**: 2026-07-11

**Input**: User description: "Implement issue #260 by running the real controlled sidecar coordinator workflow end to end with low-risk workflow-only fixture issues and harmless repository changes. Keep the #260 build-out branch based on `origin/workflow/sidecar-buildout` separate from a runtime coordinator branch based on `origin/main`, allow only the exact verified #260 fixture to use `parallel` before #261, stop at each required user-owned merge checkpoint, and record complete live evidence without merging, rebasing, force-pushing, cleaning remotes, or changing product behavior."

**Approved continuation**: On 2026-07-11 the user explicitly approved a narrowly scoped two-phase child-dispatch barrier to correct the concrete launch-state circularity exposed by the first live attempt. The correction preserves factual `launched` meaning, uses one stable child-agent identity from held preflight through targeted release, and is not an atomic transaction.

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes

- **TO-001**: One narrowly identified #260 fixture coordinator can enter the real sidecar `parallel` workflow before #261 without activating parallel routing for any other issue.
  - **Why this priority**: The live run cannot begin under the dormant routing boundary, but a broad activation would bypass the adoption decision assigned to #261.
  - **Acceptance Scenarios**:
    1. **Given** an open coordinator issue whose body explicitly identifies it as the controlled sidecar dry-run fixture for #260, **when** that exact issue is requested with `parallel`, **then** routing permits sidecar preflight and execution only while all recorded fixture identity and safety checks agree.
    2. **Given** any normal issue, direct child, ordinary coordinator, ambiguous fixture, inconsistent fixture context, or issue #220 through #234, **when** `parallel` is requested before #261, **then** routing stops under the existing guardrails.
  - **Validation Evidence**: Focused routing examples for the approved fixture and every preserved stop/route boundary.

- **TO-002**: The live fixture proves dependency-layer fan-out and real child delivery without changing CatWorld product behavior.
  - **Why this priority**: The dry-run must exercise the assembled #250–#259 workflow, not another local simulation.
  - **Acceptance Scenarios**:
    1. **Given** one controlled coordinator with two independent first-layer children and one child hard-dependent on both, **when** the first layer becomes dispatch-ready, **then** the exact handoff-ready evidence commit and a later recording head that stores its SHA are pushed before either child is dispatched, remote ancestry is proven, and the dependent child remains waiting for dependency merges.
    2. **Given** a handoff-ready first-layer child, **when** the real child-agent capability accepts its dispatch, **then** that exact stable child identity remains preflight-only with zero repository edits while the coordinator records and normally pushes factual `launched` evidence.
    3. **Given** factual launched evidence and its containing activation head are durable on the remote coordinator branch, **when** the same held child receives targeted release, **then** it first incorporates the activation head and verifies the launched evidence in ancestry before executing any prepared task.
    4. **Given** a released child completes its harmless documentation or sample-artifact scope and fresh focused validation passes, **then** its normally pushed ready PR targets the fixture coordinator branch and contains exactly the child and coordinator `Related to` issue references.
  - **Validation Evidence**: Live issue URLs, artifact paths, branch/worktree refs, handoff-ready/launched evidence SHAs and their containing recording/activation heads, stable child dispatch identities, pre-release zero-edit proofs, targeted releases, child commits/pushes, ready PR URLs, targets, exact wording, and focused validation results.

- **TO-003**: The live run proves merge-aware resume, active-child refresh, and dependency-layer progression from current GitHub and repository evidence.
  - **Why this priority**: Safe coordination depends on remote merge evidence and ordered refresh, not private session context.
  - **Acceptance Scenarios**:
    1. **Given** exactly one first-layer child PR is user-merged while the other remains active, **when** the run resumes, **then** current evidence is re-read, the local coordinator branch refreshes from its remote branch, the merged commit is ancestry-proven, affected evidence becomes stale, and the active child refreshes by normal merge before validation reruns.
    2. **Given** both first-layer child PRs are user-merged and ancestry-proven in the refreshed coordinator branch, **when** dependency layers are recomputed, **then** only the dependent second-layer child launches.
  - **Validation Evidence**: Fetched refs, merge ancestry, coordinator refresh SHA, active-child merge commit, stale/fresh validation transitions, and second-layer PR evidence.

- **TO-004**: The integrated fixture reaches one ready coordinator-to-`main` PR through the approved H/H2 finalization boundary.
  - **Why this priority**: Final delivery is the end-to-end proof that the sidecar lifecycle can account for every child and preserve validation freshness through an artifact-only final head.
  - **Acceptance Scenarios**:
    1. **Given** every prepared child is uniquely integrated, **when** complete integrated validation runs at literal head H, **then** all required checks have fresh passing results and the PR-equivalent scope is reconciled against current `origin/main`.
    2. **Given** H validation passes, **when** H2 is created, **then** H2 is the direct child of H, changes only the factual finalization artifact, passes every affected recheck, is pushed normally, and equals the fetched remote coordinator ref.
    3. **Given** final evidence remains fresh, **when** the final PR is created, **then** exactly one ready PR targets `main`, uses the approved final template and closing keywords only at that boundary, and remains user-owned for merge.
  - **Validation Evidence**: H/H2 SHAs, direct-parent and sole-path proofs, complete H results, H2 reruns, remote equality, scope/base rechecks, template render evidence, and final PR URL/readiness.

- **TO-005**: Post-merge evidence proves local `main` remained unchanged and records cleanup eligibility without performing unapproved cleanup.
  - **Why this priority**: The dry-run must demonstrate that sidecar state never leaks into local `main` and that cleanup authority remains separate from eligibility.
  - **Acceptance Scenarios**:
    1. **Given** the user reports the final fixture PR merged, **when** current evidence is re-read, **then** the merge into `main` is confirmed without switching, updating, or writing to local `main`.
    2. **Given** final merge confirmation, **when** cleanup is evaluated, **then** the approved Git-common-directory journal records factual eligibility and `not_started` when destructive authority is absent; no local or remote cleanup runs.
  - **Validation Evidence**: Original and current local-main SHA/status, absence of sidecar artifacts/commits/untracked files on local `main`, current `origin/main` merge evidence, and the cleanup journal state.

### Input/State Validation Matrix

| Request or Runtime State | Allowed Route/Action | Required Result |
|--------------------------|----------------------|-----------------|
| Exact recorded #260 controlled fixture coordinator requested with `parallel`; issue body carries the required identity | Enter or resume sidecar lifecycle after full safety checks | Current fixture identity, coordinator classification, child map, artifact state, Git state, and blockers all agree |
| Normal issue or direct child requested with `parallel` before #261 | Stop | Existing invalid-parallel routing error remains intact |
| Ordinary coordinator requested with `parallel` before #261 | Stop | #261 remains inactive; no sidecar execution starts |
| Coordinator requested without `parallel` while children are open | Stop | Existing open-child coordinator routing error remains intact |
| Coordinator requested without `parallel` after all listed children are closed | Sequential final pass | Closed child scope is not reimplemented |
| Any issue #220 through #234 requested with `parallel` | Stop | Existing exclusion remains intact |
| First-layer handoff-ready evidence and its SHA-recording update committed and pushed; no real dispatch accepted | Held dispatch may be attempted | Launch state remains non-launched, implementation and delivery permissions remain false, current remote ref equals the recording head, and it contains the exact recorded handoff-ready evidence SHA |
| Real held dispatch accepted for an exact child identity | Record factual launch state only | The child remains preflight-only; coordinator records the stable child identity and prepares the launched update without releasing implementation |
| Launch-state commit or normal push fails after accepted dispatch | Stop with child held | No implementation edit or delivery; remote evidence is not claimed to contain launched state |
| Factual launched evidence and its later SHA-recording/activation update are fetched and verified for the exact dispatch identity | Targeted release of that same child | Child incorporates the current activation head, verifies it contains the exact launched evidence SHA, proves its worktree remained clean, then receives implementation and delivery permission |
| Dispatch outcome or active-child identity is ambiguous | Stop | Do not retry blindly, create a duplicate child, record `launched`, or release any affected child |
| Both first-layer child PRs exist and await user merges | Mandatory Pause 1 | No polling or continuation beyond compact checkpoint |
| Exactly one first-layer PR is merged and the other remains active | Refresh coordinator, merge-refresh active child, rerun affected checks, then Mandatory Pause 2 | Normal merge only; stale evidence cannot support readiness |
| Both first-layer PRs are integrated | Launch dependent child, deliver its PR, then Mandatory Pause 3 | No early dependent launch |
| Dependent child is integrated and final gates pass | Create exactly one ready final PR, then Mandatory Pause 4 | Final PR targets `main`; Codex does not merge it |
| Final PR is confirmed merged but cleanup authority is absent | Evaluate and journal eligibility only | No destructive local cleanup and no remote cleanup |

### Edge Cases

- A fixture issue, artifact, branch, worktree, remote ref, or PR collides with existing state and same-run ownership cannot be proven.
- The fixture coordinator body omits or later loses its explicit #260 controlled-dry-run identity.
- Current issue, PR, ref, ancestry, artifact, or validation evidence conflicts with the recorded run state during resume.
- A normal non-force push is rejected, a refresh would require rebase/history rewrite, or a merge refresh conflicts.
- Validation becomes stale after a coordinator, child, artifact, base, or merge-base change and cannot be rerun honestly.
- The live run exposes a concrete workflow defect before the next mandatory pause.
- A held child dispatch is rejected, ambiguous, loses its stable task identity, cannot receive targeted continuation, or appears capable of editing before release.
- Factual `launched` evidence is committed locally but its normal push or fetched remote-equality proof fails.
- A workflow description requires an evidence commit to contain its own final SHA instead of resolving that SHA in a later bounded recording commit.
- The released child cannot incorporate the current activation head or verify the exact launched evidence SHA in ancestry while its worktree is still clean.

## Requirements *(mandatory)*

### Technical Requirements

- **TR-001**: The #260 implementation branch MUST start from the latest fetched `origin/workflow/sidecar-buildout`; its eventual ready PR MUST target `workflow/sidecar-buildout` and use `Related to #260` without closing wording.
- **TR-002**: The runtime fixture coordinator branch MUST start from the current fetched `origin/main`; fixture child branches MUST start from the fixture coordinator branch; child PRs MUST target that coordinator branch; and the final fixture PR MUST target `main`.
- **TR-003**: Before #261, routing MUST allow `parallel` only for the exact recorded coordinator issue whose body explicitly identifies it as the controlled sidecar dry-run fixture for #260 and whose current context passes all sidecar safety checks. The exception MUST NOT be inferred from a title, branch prefix, or private conversation alone.
- **TR-004**: Normal issues and direct children MUST remain sequential; non-coordinator or direct-child `parallel` requests MUST stop; ordinary coordinator `parallel` requests MUST stop; issues #220 through #234 MUST remain excluded; and #261 MUST NOT be activated generally.
- **TR-005**: The fixture MUST use one workflow-only coordinator, two independent first-layer children, and one second-layer child with a hard dependency on both first-layer children unless current repository evidence proves a smaller topology exercises every required transition.
- **TR-006**: Fixture implementation MUST be limited to harmless documentation or sample-artifact changes and MUST NOT modify CatWorld product behavior.
- **TR-007**: The run MUST use the existing #250–#259 sidecar lifecycle, artifact schemas, branch/worktree rules, child handoff contract, validation vocabulary, PR templates, H/H2 finalization, and cleanup journal contract without creating another broad harness or duplicating lifecycle logic.
- **TR-008**: Issue #260 authorizes mutation only of the controlled fixture issues and PRs required by this run. The workflow MUST NOT mutate unrelated issues, labels, assignees, milestones, checklists, issue state, or public comments.
- **TR-009**: Every coordinator and child artifact path, exact stable run ID, issue number/URL, branch/ref, worktree path, PR target, validation result, resume state, and blocker MUST be recorded factually; planned or pending state MUST NOT be reported as created or passed.
- **TR-010**: Local `main` MUST remain at its original commit throughout the sidecar run, with no sidecar artifact, sidecar commit, or untracked sidecar file written directly to it. When `main` has an attached worktree, its `git status --porcelain` result MUST remain empty. When it has no attached worktree, the run MUST record that fact from `git worktree list --porcelain`, prove the local ref is unchanged, prove every existing control/runtime worktree is clean at the relevant gate, and inspect the local-main tree for absence of the recorded sidecar artifact paths.
- **TR-011**: The first dependency layer MUST use the approved two-phase barrier for only the two independent children. Each exact child MUST remain preflight-only until its factual launched update is durable and verified, then consume its prepared `spec.md`, `plan.md`, and `tasks.md`, implement only its assigned harmless scope, run fresh focused validation, commit and push normally, and open a ready PR to the coordinator branch.
- **TR-012**: The workflow MUST stop at each of the four user-owned merge checkpoints with the exact evidence and user action required by the approved staged instructions. Child merge instructions MUST require GitHub's merge-commit strategy so each delivered child commit remains in coordinator ancestry; squash or rebase merging does not satisfy the current sidecar ancestry contract. Codex MUST NOT poll repeatedly, merge, approve, or enable auto-merge.
- **TR-013**: Resume after any user merge MUST re-read current GitHub and repository evidence before acting. Local coordinator state MUST refresh from the remote coordinator branch before integration is recorded, active children refresh, or a later dependency layer launches.
- **TR-014**: An active child refresh MUST use a normal merge from the refreshed local coordinator branch. Rebase, force-push, force-with-lease, branch recreation, or other history rewriting MUST NOT be used.
- **TR-015**: A child whose hard dependencies are not both ancestry-proven integrated into the refreshed coordinator branch MUST remain waiting and MUST NOT launch.
- **TR-016**: Every required validation item MUST use one of `passed`, `failed`, `skipped`, `timed out`, `interrupted`, `partial`, `stale`, `blocked`, or `not run`; non-passing or stale evidence MUST NOT be summarized as passed or support ready status.
- **TR-017**: Finalization MUST use runtime B from freshly fetched `origin/main`, literal validated head H, and direct artifact-only child H2. H2 MUST pass direct-parent, sole-path, affected-check, scope/base, normal-push, and fetched-remote-equality gates before final PR creation.
- **TR-018**: The final fixture PR MUST be unique, ready, rendered from the approved sidecar final coordinator template, target `main`, and use closing keywords only for the controlled coordinator/child set. Codex MUST stop immediately after creating it and MUST NOT merge it.
- **TR-019**: After the user reports the final PR merged, the workflow MUST verify the merge and unchanged local-main state, then evaluate cleanup through the approved Git-common-directory journal. Destructive local cleanup requires separate explicit authority; remote cleanup is prohibited.
- **TR-020**: The complete accepted dry-run evidence and minimal routing exception MUST be committed only on the #260 build-out branch after the staged run reaches its accepted final state, followed by required issue validation and `git diff --check`, a normal push, and one ready PR to `workflow/sidecar-buildout` using `Related to #260`.
- **TR-021**: At the first concrete workflow defect, the run MUST preserve all branches, worktrees, issues, PRs, artifacts, and evidence; report the failing and expected states, impact, and smallest likely correction; and stop without redesigning the workflow or absorbing #261 activation.
- **TR-022**: Before child dispatch, the coordinator MUST commit and normally push `handoff-ready` evidence containing the prepared-handoff identity, run ID, child issue, branch, worktree, implementation permission false, and delivery permission false; after that SHA exists, a later bounded coordinator recording commit MUST store the exact evidence SHA, be pushed normally, and pass current-remote equality plus evidence-ancestry proof. No commit may be required to contain its own SHA.
- **TR-023**: A successful held dispatch MUST return one stable child/task identity that remains the same logical child through targeted release. Before release that child MAY perform only the approved read-only preflight and MUST NOT edit, stage, execute prepared tasks, commit, push, open/update a PR, or mutate GitHub state.
- **TR-024**: Only after unambiguous dispatch acceptance MAY the coordinator record factual `launched`. The factual launched evidence MUST be committed and normally pushed; after its SHA exists, a later bounded activation/recording commit MUST store that exact SHA, be pushed normally, and pass current-remote equality plus evidence-ancestry proof. The same held child MUST incorporate the current activation head and verify it contains the launched evidence while still clean before implementation or delivery permission becomes effective. Rejected or ambiguous dispatch, failed launch-state or recording push, failed refresh/verification, and failed release MUST preserve the approved failure semantics and perform no unauthorized child work.
- **TR-025**: Every prepared handoff MUST record the immutable #260 control-plane commit containing the corrected coordinator/child contracts. Child PR bodies MUST contain exactly `Related to #<child-issue>` and `Related to #272`; they MUST NOT contain another #260 issue reference or closing wording.

### Scope Boundaries

- **SB-001**: This feature changes only focused workflow routing wording, issue #260 planning/evidence artifacts, controlled fixture artifacts, and harmless fixture documentation/sample files.
- **SB-002**: The #260 build-out delivery history and the runtime fixture coordinator history remain separate and use their explicitly approved bases and PR targets.
- **SB-003**: Existing sidecar lifecycle internals remain in the sidecar skills and artifacts; the normal sequential skill receives no copied lifecycle implementation.
- **SB-004**: The staged user-owned merge checkpoints are required feature boundaries, not implementation delays to bypass.
- **SB-005**: The dispatch correction is limited to stable held preflight, factual launch persistence, targeted release, and their failure evidence. It MUST NOT add a generic state subsystem, filesystem lock, queue, daemon, IPC service, transaction framework, or indefinite polling mechanism.

### Out of Scope

- CatWorld product behavior or product-feature implementation.
- General #261 activation or making sidecar parallel the default workflow.
- Rewriting the #250–#259 sidecar contracts without a concrete live defect.
- Another broad harness, generic framework, exhaustive architecture audit, or duplicated regression suite.
- Treating the two-phase barrier as an atomic transaction or replacing a held child with an unrelated second subagent invocation.
- Editing issues #220 through #234.
- Codex-owned PR merges, approvals, auto-merge, rebase, force-push, history rewriting, remote cleanup, or destructive local cleanup without separate explicit authority.
- Unrelated issue, label, assignee, milestone, checklist, state, or public-comment mutation.

### Key Entities

- **Controlled Fixture Run**: One stable run identity binding the #260-authorized coordinator, three child issues, artifacts, Git resources, PRs, validation state, and cleanup journal.
- **Build-Out Branch**: The #260 implementation/evidence branch based on `origin/workflow/sidecar-buildout` and delivered back to that branch.
- **Runtime Coordinator Branch**: The fixture integration branch based on current `origin/main`, owning sidecar artifacts and receiving child PRs before final delivery to `main`.
- **Mandatory Checkpoint**: A durable user-owned merge boundary at which Codex reports current evidence and stops.
- **Held Child Dispatch**: One stable child-agent identity accepted for preflight only, correlated to the exact run, child, Git context, handoff-ready evidence SHA, containing remote recording head, and prepared-handoff identity; it cannot implement until factual launched evidence and its containing activation head are durable and the same identity is targeted for release.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Focused routing evidence shows exactly one verified #260 controlled fixture coordinator can use pre-#261 `parallel`, while every preserved sequential, invalid-parallel, ordinary-coordinator, and #220–#234 boundary returns its required outcome.
- **SC-002**: Two independent first-layer child PRs are opened ready against the remote coordinator branch after evidence proves handoff-ready evidence plus its containing recording head before dispatch, stable held identities, zero pre-release edits, factual launched evidence plus its containing activation head before release, and child incorporation of the activation head with launched-evidence ancestry verification; each PR records its issue, worktree, commit, URL, target, exactly two `Related to` references, and fresh passing validation before Mandatory Pause 1.
- **SC-003**: Live evidence after a partial first-layer merge proves coordinator refresh from the remote branch precedes active-child normal-merge refresh and affected validation rerun.
- **SC-004**: The dependent child does not launch until both first-layer commits are ancestry-proven integrated, then reaches one ready PR against the coordinator branch.
- **SC-005**: Complete integrated validation passes at H; H2 is a direct artifact-only child with all required rechecks passed and fetched remote equality proven; exactly one ready final coordinator PR targets `main`.
- **SC-006**: Before, during, and after the live run, the original local-main SHA remains unchanged. If `main` has an attached worktree its status remains empty; otherwise current worktree inventory proves no main checkout exists, every existing run checkout is clean at the relevant gate, and the local-main tree contains no recorded sidecar artifact path or sidecar commit.
- **SC-007**: Post-merge evidence records cleanup eligibility truthfully in the approved journal without performing unauthorized local cleanup or any remote cleanup.
- **SC-008**: The final #260 build-out diff is focused, required validation and `git diff --check` pass, and one ready PR targets `workflow/sidecar-buildout` with `Related to #260` and an actual GitHub URL.

## Assumptions

- The connected GitHub identity retains permission to create the controlled fixture issues and PRs and to push the approved branches normally.
- Child PRs are user-merged with GitHub's merge-commit strategy so their delivered commits remain ancestry-provable. The final runtime PR may use another GitHub-supported merge result only when current `origin/main` evidence still proves the expected final H2 integration under the cleanup contract.
- The active Codex environment continues to expose stable named subagents that can complete a preflight-only turn and later receive a targeted follow-up through the same canonical identity. If that capability is missing or ambiguous on resume, the run stops rather than substituting another agent.
