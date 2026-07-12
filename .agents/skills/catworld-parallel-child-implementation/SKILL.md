---
name: "catworld-parallel-child-implementation"
description: "Implement one prepared CatWorld sidecar child issue from coordinator-provided artifacts without changing the existing sequential issue implementation workflow."
compatibility: "Requires the CatWorld repository, an explicit sidecar child handoff prepared by the sidecar coordinator workflow, and the sidecar workflow guardrails from issues #220-#260"
metadata:
  author: "catworld"
  source: "issues-228-232,253-257,260"
---

# CatWorld Parallel Child Implementation

Use this sidecar skill only for one child issue that has been handed off by a
routing-authorized sidecar coordinator parallel run after coordinator artifact
preparation has completed. General routing authorization begins only after
#261 activates sidecar routing. Before #261, accept a prepared handoff only
when current GitHub evidence verifies all of these exact fixture values:

- coordinator issue #272;
- coordinator URL
  `https://github.com/TheZenithPassage/catworld/issues/272`;
- run ID `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`;
- a current coordinator issue body that explicitly identifies #272 as the sole
  controlled sidecar dry-run fixture authorized by #260.

Stop on any mismatch. A title, branch prefix, label, stale artifact, or private
conversation is not routing authorization.

This skill consumes prepared child artifacts: the coordinator-provided child
`spec.md`, `plan.md`, and `tasks.md` under
`specs/<child-issue-number>-<child-slug>/`. It does not create or regenerate
its own specification, plan, task list, shared contract, coordinator artifact,
branch, worktree, issue mutation, or routing decision. It performs child PR
delivery only when the prepared handoff and approved sidecar rules permit that
operation. It consumes the sidecar Git state prepared by the coordinator and
refuses to run when the current checkout does not match that prepared state. It
also consumes the sidecar resume state prepared by the coordinator, including
child workflow status, refresh state, stale validation, blockers, and cleanup
eligibility, and must not rely on private conversation context when a child
handoff is resumed.
Issue #254 extends this requirement to executable branch/worktree handoff
state: the child handoff must include the coordinator branch local and remote
refs, coordinator push status, coordinator worktree path, child branch source,
child worktree path, child PR target branch, collision checks, dirty-state
checks, and isolation evidence prepared by the coordinator. Issue #255 extends
the handoff with dependency-layer fan-out state: the coordinator must launch
only one dependency-ready layer, pass exactly one child issue to this skill, and
include launch status plus the non-launch/blocker vocabulary for sibling and
later-layer children.
Issue #256 makes this prepared child handoff execution-capable: the child
executor confirms the prepared checkout and branch, implements only the
prepared `tasks.md`, runs required validation, reports explicit validation
statuses, and may commit, push normally, and open or update the child PR only
when delivery is permitted after the issue #260 release barrier. That child PR
targets the coordinator branch, uses
`Related to` issue references only, and is ready only with fresh passing
validation and no unresolved blocker.
Issue #257 extends resumed child handoffs after user-owned child PR merges:
the coordinator must re-read current evidence, refresh local coordinator state
from the remote coordinator branch before any active child refresh, and supply
the refreshed coordinator branch state, active-child refresh state, integrated
child state, stale validation, and next-layer dependency status to this skill.
This skill consumes that evidence and must stop when it is missing or conflicts
with current GitHub or repository state.
Issue #260 corrects the child-dispatch boundary with a narrowly scoped,
non-atomic two-phase held barrier. The same real child executor first accepts a
preflight-only handoff with implementation and delivery permissions false. The
coordinator may record `launched` only after that acceptance, commit and push
the factual launch update, and target the same exact child executor with the
durable launched evidence. The child may implement only after it fetches,
incorporates, and verifies that exact remote coordinator head cleanly and then
acknowledges release; only then may the handoff's recorded implementation and
delivery permissions become true. This barrier is workflow evidence, not a
generic transaction, lock, queue, daemon, IPC mechanism, polling loop, or
reusable coordination framework.

## Routing Boundary

This skill is not the normal issue implementation workflow.

Use `.agents/skills/catworld-implement-issue/SKILL.md` instead for:

- normal implementable issues requested end-to-end;
- direct child issues requested end-to-end outside a prepared handoff from a
  routing-authorized coordinator run; those requests remain sequential, while
  a direct-child request with `parallel` remains invalid;
- coordinator final passes after all listed child issues are closed;
- issues #220 through #234 while the sidecar workflow is still being designed,
  validated, and adopted through the current sequential guardrails.

Use `.agents/skills/catworld-parallel-coordinator/SKILL.md` instead for:

- coordinator classification;
- coordinator preflight;
- child issue inspection;
- dependency classification;
- source-of-truth review before sidecar delegation;
- coordinator and child artifact preparation;
- coordinator branch, child branch, checkout/worktree, refresh, and cleanup
  state preparation.

Stop with a routing error when a request reaches this skill without a prepared
sidecar child handoff.

## Required Preflight Handoff Inputs

The first phase is a real child dispatch held at preflight. Before the child
accepts that dispatch, the preflight handoff must provide all of these inputs:

- exact sidecar run ID;
- child issue number and coordinator issue number;
- exact coordinator branch local and remote refs, child branch ref, coordinator
  checkout/worktree path, and isolated child checkout/worktree path;
- immutable control revision: the exact pushed commit SHA containing the
  approved workflow correction used for this run;
- exact pushed handoff-ready evidence commit SHA, plus the remote coordinator
  ref and exact current fetched preflight recording-head SHA; the recording
  head must contain the evidence commit by ancestry and need not equal it;
- the exact deterministic `sidecar-prepared-handoff-v1` identity fingerprint
  defined below. Because the fingerprint exists before the handoff-ready
  evidence commit, neither that evidence SHA nor its later recording head is a
  fingerprint input; both are correlated separately in the dispatch envelope;
- the stable canonical child-agent identity that must accept preflight and
  later receive the release; the handoff must not substitute a display label,
  branch name, process ID, or a newly created replacement executor for this
  identity;
- child issue number, title, body, state, labels, dependencies, source
  references, validation requirements, and explicit out-of-scope boundaries;
- coordinator issue number, title, relevant coordinator context, child issue
  map, dependency layer, and coordinator source references;
- coordinator artifact states for this child, proving preparation is
  `handoff-ready`, workflow is `held-preflight`, and factual launch is `pending`
  in the current dependency-ready layer, not yet `launched`, `blocked`, or
  `waiting-for-dependency-merge`;
- prepared child `spec.md` path and content summary;
- prepared child `plan.md` path and content summary, including architecture
  and technology assessment state, human approval source, validation evidence
  plan, and source map;
- prepared child `tasks.md` path and task set;
- coordinator artifact preparation status for this child, including whether the
  artifact set is `planned`, `blocked`, `prepared`, or `handoff-ready`;
- shared contract references and constraints from the coordinator artifacts;
- dependency status showing this child is ready for implementation;
- first dependency-ready layer evidence showing that no hard-dependent later
  layer was launched early and that unresolved shared-contract blockers or
  non-mechanical conflict risks do not affect this child;
- executable sidecar lifecycle state from the coordinator, including evidence
  that the coordinator and child artifacts were written inside the coordinator
  branch/worktree and not while the active checkout was `main`;
- coordinator resume state for this child, including child artifact path,
  workflow status, blockers, validation state, refresh state, cleanup
  eligibility, and whether the child is active, blocked, pending, paused,
  held-preflight, release-pending, released, resume-needed,
  merged-to-coordinator, integrated, ready-next-layer, or complete;
- current GitHub and repository evidence that was re-read before handoff or
  resume, including coordinator issue, child issue, relevant PRs, coordinator
  artifact, child artifacts, child PR merge status, remote coordinator branch
  state, local coordinator branch/worktree refresh state, active child branch
  state, checkout/worktree state, validation freshness, blockers, and cleanup
  approval state;
- target coordinator branch, including local branch ref, remote branch ref,
  push status, and evidence that it was created from current `origin/main`;
- target coordinator checkout/worktree, including evidence that it is the
  coordinator branch/worktree that owns sidecar artifact writing and passed the
  required clean-state check before handoff;
- target child branch, including local branch ref, source coordinator branch
  ref, and evidence that it starts from the coordinator branch and is not
  `main`;
- target child checkout/worktree path, isolated from every other active child
  checkout/worktree and from the coordinator checkout/worktree;
- branch, checkout/worktree, directory, and artifact collision status showing
  that the prepared coordinator and child Git resources are absent or proven to
  belong to the same resumable sidecar run;
- intended child PR target branch, which must be the coordinator branch and not
  `main`;
- intended child PR issue-reference wording, which must use
  exactly `Related to #<child-issue>` and
  `Related to #<coordinator-issue>` as its two issue-reference lines, must not
  add a control-issue reference such as #260, and must not close the child issue
  or coordinator issue;
- explicit preflight permission state proving implementation edits, artifact
  edits, commits, pushes, child PR open/update, and every other delivery action
  are false while the child is held;
- refresh status describing whether this child branch needs a normal merge
  from the updated local coordinator branch after another child PR has been
  merged into the remote coordinator branch and local coordinator state has
  been refreshed;
- last coordinator branch state incorporated into this child branch/worktree,
  when a refresh status is relevant;
- cleanup eligibility status for the child branch and checkout/worktree;
- waiting/resume status showing whether this child is in the active dependency
  layer, waiting for user merge into the coordinator branch, resumed after a
  merge, refresh-needed, refreshed, or complete;
- child-agent/subagent preflight-dispatch evidence showing the coordinator had
  an approved stable child-agent capability available, targeted this exact
  canonical identity, and did not fall back to sequential implementation;
- GitHub issue mutation approval status, public comment approval status, and
  remote cleanup approval status under the approved sidecar PR and Git rules;
- expected validation commands or manual evidence, including freshness
  requirements;
- expected validation report format, including explicit statuses, freshness
  requirements, child PR ready/draft readiness rules, blocker categories,
  conflict reporting requirements, human-only blocker categories, resume-needed
  state, and GitHub issue/public-comment mutation approval state;
- final report and delivery boundaries provided by the coordinator and approved
  sidecar Git/PR rules, including that Codex reports readiness and the user
  performs merges.

### Canonical Prepared-Handoff Fingerprint

`sidecar-prepared-handoff-v1` is an identity fingerprint for the immutable
pre-evidence dispatch envelope. Construct one PowerShell `[ordered]` object with
these properties in this exact order and with these exact types:

1. `Schema` = string `sidecar-prepared-handoff-v1`;
2. `RunId` = string;
3. `CoordinatorIssueNumber` = integer;
4. `ChildIssueNumber` = integer;
5. `CoordinatorBranch` = string;
6. `CoordinatorRemoteBranch` = string;
7. `CoordinatorWorktree` = string;
8. `ChildBranch` = string;
9. `ChildWorktree` = string;
10. `ControlRevision` = exact 40-hex pushed workflow-source SHA string;
11. `PreparedSpec` = repository-relative path string;
12. `PreparedPlan` = repository-relative path string;
13. `PreparedTasks` = repository-relative path string;
14. `DependencyLayer` = integer;
15. `HardDependencies` = integer array sorted ascending, including an empty
    array for no dependencies;
16. `PrTargetBranch` = exact coordinator-branch string;
17. `PrRelatedReferences` = exact two-string array in child-then-coordinator
    order;
18. `ArtifactPreparationState` = string `handoff-ready`;
19. `LaunchState` = string `pending`;
20. `ImplementationPermission` = Boolean `false`;
21. `DeliveryPermission` = Boolean `false`.

Serialize that ordered object with `ConvertTo-Json -Compress -Depth 4`, hash
the resulting JSON's UTF-8 bytes with SHA-256, and encode the digest as 64
lowercase hexadecimal characters. Do not add a prefix. Do not include the
fingerprint itself, artifact content/blob hashes, handoff-ready or launched
evidence SHAs, recording/activation heads, or child-agent identity. Prepared
artifact paths and content are still validated separately; excluding artifact
content hashes avoids making an artifact that records the fingerprint depend
recursively on its own blob.

If any required input is absent, incomplete, unreadable, contradictory, or not
applicable to exactly one child issue, stop before implementation and report a
blocker.

Preflight acceptance is not launch, release, or implementation permission. In
the held phase this exact child may read supplied context; inspect already
fetched Git and GitHub evidence plus artifact, branch, worktree,
collision, and clean-state evidence; calculate and compare the handoff
fingerprint; and report acceptance or rejection. It must perform zero file or
artifact edits, task implementation, commits, pushes, PR opens/updates, issue
mutations, public comments, branch/worktree creation or alteration, or cleanup.

If preflight is rejected, report the exact failed field or unsafe condition and
remain `handoff-ready`/held with all permissions false; the coordinator must
not record that dispatch as launched. If acceptance versus rejection is
ambiguous, interrupted, or not durably correlated to this exact identity and
fingerprint, report `resume-needed` or blocked and likewise do not authorize a
launch.

## Required Implementation Release Inputs

After this exact child reports `preflight-accepted`, the coordinator records
the factual accepted dispatch as `launched`, commits it, and pushes it to the
recorded remote coordinator branch. The coordinator must then target this same
canonical child identity with all of these release inputs:

- the unchanged run ID, child and coordinator issue numbers, exact branch and
  worktree identities, immutable control revision, handoff-ready evidence
  commit, preflight recording head, and handoff fingerprint accepted during
  preflight;
- the same stable canonical child-agent identity and evidence that the release
  targets that identity, not a replacement child;
- the exact factual launched-evidence commit SHA, remote coordinator ref, and
  exact current remote activation/record-head SHA;
- evidence that the remote ref was fetched after the launch push, resolves to
  that exact activation/record head, and contains the factual launched-evidence
  commit by ancestry; the two SHAs need not be equal, while a local commit,
  intended push, stale fetched ref, or unverified push result is insufficient;
- coordinator artifact state recording this exact child as `launched` in the
  current dependency-ready layer and correlating the launch with its accepted
  preflight identity and fingerprint;
- instructions to incorporate the exact remote activation/record head into the
  prepared child branch/worktree by clean fast-forward when possible or normal
  merge when required, never by rebase, force-push, or history rewriting; the
  child branch may legitimately be behind that recording head;
- expected post-incorporation branch/head and clean-state evidence;
- explicit release permission state in which implementation, scoped commit,
  normal push, and PR open/update permissions become true for the handoff only
  after the child independently fetches, incorporates, and verifies the exact
  durable activation/record head and confirms it contains the launched-evidence
  commit, then acknowledges release; actual delivery remains
  subject to the Child PR Delivery Workflow and fresh validation/readiness
  rules.

If any release-carried copy of an accepted immutable preflight field differs,
the remote ref does not contain the exact launched-evidence commit at the exact
named activation/record head, incorporation is conflicted or dirty, the exact
canonical child identity is unavailable or ambiguous, or the release cannot be
acknowledged by that same child, stop held with all implementation and delivery
permissions false. Never silently dispatch a replacement for a child already
recorded as launched.

Evidence commits and later recording heads are deliberately distinct concepts.
Do not require a tracked artifact to contain the SHA of the commit that first
contains that artifact version. A later pushed recording commit may name the
earlier evidence SHA; validation uses exact fetched ref values and ancestry,
not a self-referential SHA or an assumed equality between evidence and
recording commits.

## Required Context

During held preflight, read without editing:

- `AGENTS.md`;
- `.specify/memory/constitution.md`;
- `docs/ARCHITECTURE.md`;
- the full child issue body supplied by the handoff;
- the relevant coordinator issue context supplied by the handoff;
- the prepared child `spec.md`, `plan.md`, and `tasks.md`;
- the shared contract references supplied by the handoff;
- the coordinator resume state and current re-read evidence supplied by the
  handoff;
- source-of-truth documentation named by the prepared artifacts;
- the immutable control revision named by the handoff, including this skill and
  the coordinator barrier contract at that exact pushed revision.

Stop when required context cannot be read or when source-of-truth documents
conflict with the handoff, prepared artifacts, child issue, coordinator
context, or constitution.

## Held Preflight Validation

Validate the handoff without touching implementation or artifact files:

- The handoff identifies exactly one child issue.
- The exact run ID, child/coordinator issues, branch and worktree identities,
  immutable pushed control revision, pushed handoff-ready evidence commit,
  preflight recording head, deterministic fingerprint, and canonical
  child-agent identity are present and mutually consistent.
- The already fetched remote coordinator ref resolves to the exact preflight
  recording head, and that head contains the handoff-ready evidence commit by
  ancestry. Equality between those SHAs is not required. The child does not
  fetch or otherwise mutate repository state to repair missing or stale
  preflight evidence.
- The coordinator artifact records preparation `handoff-ready`, workflow
  `held-preflight`, and factual launch `pending` for the current dependency-
  ready layer, not `launched`.
- The child issue is dependency-ready according to the prepared dependency
  status.
- The target coordinator branch, child branch, child checkout/worktree, child
  PR target, refresh status, and cleanup eligibility context are present.
- The target coordinator branch has both local and remote refs recorded, and
  coordinator push status proves the remote coordinator branch exists before
  child PR delivery readiness is reported.
- The handoff includes current GitHub and repository evidence re-read before
  resume, not private conversation context as the source of truth.
- The handoff proves that local coordinator branch/worktree state has been
  refreshed from the remote coordinator branch before any child is marked
  integrated or any active child refresh is requested.
- The handoff identifies the executable sidecar lifecycle state that produced
  this child handoff, and the state is compatible with launching exactly one
  dependency-ready layer.
- The handoff includes stable child-agent/subagent capability and identity
  evidence from the coordinator and does not ask this skill to act as a
  sequential fallback.
- The child workflow status is explicit and distinguishes active, blocked,
  pending, paused, held-preflight, release-pending, released, resume-needed,
  merged-to-coordinator, integrated, ready-next-layer, or complete as
  applicable.
- The child branch starts from the coordinator branch ref recorded in the
  handoff, contains the required prepared base evidence, and is not `main`. It
  may be behind the later preflight recording head.
- The coordinator branch/worktree is the artifact write boundary, and prepared
  artifacts were written there rather than from local `main` or from an
  invented child context.
- The child checkout/worktree is isolated from other active child
  checkouts/worktrees and from the coordinator checkout/worktree.
- Branch, checkout/worktree, directory, and artifact collision checks have
  passed or are proven same-run resumes before the child executor starts.
- Required clean-state checks for the prepared coordinator and child contexts
  have passed, or any dirty paths are reported as blockers rather than hidden.
- The intended child PR target is the coordinator branch and not `main`.
- The intended child PR wording uses exactly the child and coordinator
  `Related to` reference lines, contains no additional control-issue reference
  such as #260, and cannot close the child issue or coordinator issue.
- Any required active-child refresh uses a normal merge from the updated local
  coordinator branch only when needed. The handoff must not ask the child to
  refresh from stale local coordinator state.
- Any validation affected by refresh, coordinator branch updates, conflict
  resolution, or other relevant changes is marked stale until rerun.
- Cleanup eligibility states that local sidecar branches/worktrees are not
  cleaned after individual child PR merges and are eligible only after the
  final coordinator PR has merged into `main`.
- GitHub issue body, checklist, label, assignee, milestone, issue state, public
  comment, and remote cleanup approval state is present when the handoff allows
  any delivery operation that could touch those surfaces.
- Prepared `spec.md`, `plan.md`, and `tasks.md` exist and refer to the same
  child issue scope.
- The coordinator artifact records this child's artifact path and
  `handoff-ready` preparation status.
- The handoff does not instruct the child executor to regenerate `spec.md`,
  `plan.md`, or `tasks.md`.
- The prepared plan has no pending human approval, unresolved major decision,
  or material conflict with the child issue or coordinator context.
- The prepared tasks are scoped to the child issue and do not require missing
  shared contracts or unapproved child issues.
- The shared contract is present, consistent, and sufficient for the child
  scope.
- Required validation is explicit enough to rerun after relevant changes.
- Every implementation and delivery permission is false during held preflight.
- Acceptance output is limited to the canonical child identity, exact accepted
  correlation fields and fingerprint, `preflight-accepted` or a specific
  rejection, and confirmation of zero repository/GitHub mutations.

Do not repair missing planning artifacts by running `speckit-specify`,
`speckit-plan`, or `speckit-tasks`. Stop and return the blocker to the
coordinator or user.

Do not repair missing coordinator artifact state by creating sidecar artifacts
from the child checkout/worktree. Child implementation consumes prepared
artifacts only after the coordinator lifecycle has entered the coordinator
branch/worktree write boundary.

After a successful validation, report `preflight-accepted` and remain held.
Do not continue into implementation in the same turn merely because the
preflight handoff is valid. The coordinator must first persist and push the
factual launched update and explicitly target this same canonical child with
the Required Implementation Release Inputs.

## Durable Launch and Release Validation

On the targeted continuation, before touching implementation files:

1. Confirm this executor's canonical identity is exactly the identity recorded
   by the accepted preflight and release. Stop on missing, changed, duplicated,
   or ambiguous identity evidence; do not recreate or substitute the child.
2. Compare the exact accepted run/issue/branch/worktree/control-revision/
   handoff-ready-evidence/preflight-recording-head correlation fields and
   recompute the fingerprint only from its defined immutable inputs. Stop if
   any accepted field or the fingerprint changed.
3. Fetch the exact recorded remote coordinator ref normally and verify it
   resolves to the exact activation/record head supplied by the coordinator and
   that this head contains the exact launched-evidence commit by ancestry. Stop
   if the push failed, the fetch failed, either ancestry/ref check fails, or the
   result is stale or ambiguous. Do not require the evidence and recording SHAs
   to be equal.
4. Verify the launched evidence plus its containing activation/record state
   factually records this child as launched, names the accepted canonical
   identity and fingerprint, and does not launch a blocked child or later
   dependency layer early.
5. Incorporate that exact activation/record head into the prepared child
   branch/worktree by clean fast-forward when possible or normal merge when
   required. Stop on conflicts, unexpected commits, dirty state, wrong
   worktree/branch, or any need for rebase, force-push, history rewriting, or
   invented recovery.
6. Verify the child branch contains both the exact activation/record head and
   launched-evidence commit, the prepared checkout/worktree is clean, and
   current evidence still matches the release.
7. Only then acknowledge `release-accepted` for this same canonical identity
   and set the handoff's release-governed implementation, scoped commit, normal
   push, and PR open/update permissions true. Record each permission
   explicitly; actual delivery still requires the Child PR Delivery Workflow.
   Until this acknowledgment, every implementation and delivery permission
   remains false.

A coordinator launch push failure, child fetch failure, launched-evidence or
activation/record-head mismatch, ancestry failure, incorporation
conflict/failure, release-message failure, interrupted release, or identity
mismatch/ambiguity leaves the child held or `resume-needed` with implementation
and delivery permissions false. On resume, re-read durable evidence and
continue only through the same exact canonical child identity. A replacement
child requires stopping for coordinator/user recovery; it must never inherit a
launched child's authority silently.

## Implementation Workflow

Enter this workflow only after the same exact child has completed Durable
Launch and Release Validation and acknowledged `release-accepted`. A valid held
preflight alone is never sufficient.

1. Confirm the accepted run ID, issues, canonical child identity, control
   revision, handoff-ready evidence commit, preflight recording head, handoff
   fingerprint, exact launched-evidence commit, containing activation/record
   head, and true implementation permission remain recorded and consistent. If
   not, stop before edits.
2. Confirm the current checkout and worktree match the prepared target context.
   If they do not, stop. This skill must not invent, rename, or auto-recover
   branch/worktree context outside the coordinator handoff.
3. Confirm the resume state from the handoff still matches current
   GitHub/repository evidence that was re-read before continuing. If current
   evidence conflicts with the recorded state, stop and return the mismatch to
   the coordinator or user.
4. When the handoff says another child PR has merged, confirm the handoff
   identifies the refreshed local coordinator branch state incorporated into
   this child or reports that active-child refresh is still blocked. Do not
   treat a merged child PR as integrated from child-side context alone.
5. Treat the prepared child `spec.md`, `plan.md`, `tasks.md`, shared contract,
   and validation requirements as the implementation decision contract.
6. Execute only tasks from the prepared child `tasks.md`.
7. Keep implementation within the prepared child source map and out-of-scope
   boundaries.
8. Run the validation required by the prepared child plan, tasks, shared
   contract, and handoff.
9. Rerun affected validation after relevant late changes, coordinator refresh,
   active child refresh, or conflict resolution, or report affected
   evidence as `stale` and any required rerun as `not run` instead of passed.
10. Record each validation command, manual review, local sample artifact, and
   consumed coordinator or shared-contract check as `passed`, `failed`,
   `skipped`, `timed out`, `interrupted`, `partial`, `stale`, `blocked`, or
   `not run`. Failed, timed-out, skipped, interrupted, partial, stale, blocked,
   and not-run validation must never be summarized as passed.
11. Inspect changed files against the prepared child source map before final
   reporting.
12. When delivery is permitted, commit only scoped child changes, push the
    child branch with a normal non-force push, and open or update the child PR
    against the coordinator branch.
13. Report child PR URL and readiness back to the coordinator lifecycle. The
    user owns merges into the remote coordinator branch; this skill does not
    merge child PRs, treat unmerged child PRs as integrated, or advance a
    hard-dependent layer on its own.

This skill may implement product or workflow code only when the prepared child
tasks explicitly require it. It must not add product behavior, architecture,
persistence, authorization, APIs, frontend behavior, operations, or workflow
behavior outside the prepared child scope.

## Child PR Delivery Workflow

Child PR delivery is allowed only when the prepared handoff and approved
sidecar Git/PR rules explicitly permit it and the same exact child has durable
launch-incorporation evidence plus a successful release acknowledgment. A
preflight-accepted, held, ambiguous, interrupted, or unreleased child has no
commit, push, or PR authority. When permitted, delivery consists only of:

1. confirming the report records the accepted canonical child identity,
   fingerprint, exact launched-evidence commit, exact containing remote
   activation/record head incorporated by the child, clean post-incorporation
   state, release acknowledgment, and true delivery permissions;
2. confirming changed files remain within the prepared child source map;
3. committing scoped child changes with a conventional commit title;
4. pushing the prepared child branch to `origin` with a normal non-force push;
5. opening or updating a child PR whose base is the prepared coordinator
   branch, not `main`;
6. writing the child PR body with exactly these two issue-reference lines,
   `Related to #<child-issue>` and `Related to #<coordinator-issue>`, without
   closing keywords or an additional coordinator-control issue reference such
   as #260;
7. setting or reporting ready status only when required validation is fresh and
   passed and no unresolved blocker affects the child.

If required validation is failed, skipped, timed out, interrupted, partial,
stale, blocked, or not run, any review-useful child PR must be draft/not-ready
and the report must preserve the non-passed status. If the handoff does not
permit PR delivery, report the child diff, validation, readiness, and blocker
without opening or updating a PR.

## Shared Contract and Scope Rules

Sub-agents and child executors are implementation executors, not product or
architecture decision makers.

This skill must not:

- redefine shared contracts;
- invent missing coordinator decisions;
- create seed, foundation, or shared-contract child issues;
- expand child scope beyond the prepared artifacts;
- silently resolve material product, architecture, security, persistence,
  authorization, UX, operational, or shared-contract decisions;
- generate replacement planning artifacts;
- use `speckit-converge` to append unapproved work outside the prepared child
  scope.

When implementation discovers a scope gap, missing shared contract, conflicting
source of truth, or material unresolved decision, stop and report the blocker.

## Validation, Blocker and Conflict Reporting

The sidecar child report must identify the child issue, coordinator issue,
prepared artifacts consumed, required validation evidence, freshness status,
blockers, conflicts, resume state, refresh state, cleanup eligibility, and
readiness state supplied by the handoff.

The report must also preserve the dispatch-barrier evidence: exact run ID,
immutable control revision, handoff-ready evidence commit, containing preflight
recording head, fingerprint, stable canonical child identity, preflight result
with zero-mutation confirmation, factual launched-evidence commit, containing
remote activation/record head, ancestry/fetch/incorporation results,
clean-state result, release acknowledgment, and implementation/commit/push/PR
permission states. Missing, non-passed, stale, interrupted, or ambiguous
barrier evidence cannot be summarized as a released child or used for
implementation or delivery.

Each validation item must use an explicit status: `passed`, `failed`,
`skipped`, `timed out`, `interrupted`, `partial`, `stale`, `blocked`, or
`not run`. Failed validation is never summarized as passed. Failed, timed-out,
skipped, interrupted, partial, stale, blocked, and not-run validation must
never be summarized as passed.

Validation becomes stale when coordinator branch updates, child branch
refreshes, conflict resolution, or other relevant changes could affect the
previous evidence. Stale evidence must be rerun before the child can be
reported ready, or it must remain explicitly reported as stale. After #257,
validation affected by refreshing local coordinator state from the remote
coordinator branch or by refreshing this active child from the updated local
coordinator branch is stale until rerun.

When a child handoff is resumed after a pause or a new Codex session, the child
report must identify the GitHub and repository evidence re-read before
continuing. It must report whether the child is active, blocked, pending,
paused, held-preflight, release-pending, released, resume-needed,
merged-to-coordinator, integrated, ready-next-layer, or complete, and whether
the branch/worktree refresh state is not needed, needed, in progress,
refreshed, stale, or blocked. It must identify the refreshed local coordinator
branch state incorporated into this child when another child PR has merged.
Private conversation context is not sufficient resume evidence.

A sidecar child PR may be reported as ready only when required validation is
fresh and passed, no unresolved blocker affects the child, and the approved
sidecar PR target and issue-reference rules are satisfied. The exact child must
also have incorporated the exact remote activation/record head, verified that
it contains the factual launched-evidence commit, and acknowledged release with
the required delivery permissions. A sidecar child PR
must be reported as draft when required validation is failed, skipped, timed
out, interrupted, partial, stale, not run, or blocked, unless the non-passed
evidence is explicitly outside child readiness and the report explains why.

Reports must distinguish child-specific blockers from coordinator-wide and
shared-contract blockers. Shared-contract blockers stop affected sidecar work
until resolved or user guidance is provided.

Non-trivial conflicts affecting contract, scope, persistence, security, authorization, UX, or domain behavior require user guidance. The child report must identify the conflicting inputs, affected source surfaces, blocked child or coordinator scope, and the guidance required before work can continue.

Human-only blockers include new significant dependencies, material architecture
changes, production exposure, secrets, deployment changes, Git/GitHub workflow
outside the approved model, and unresolved product, persistence, security,
authorization, UX, domain, contract, validation, operational, or scope
decisions. This skill must report the category, evidence, affected scope, and
required human decision instead of deciding silently.

Codex must not modify GitHub issue bodies, checklists, labels, assignees,
milestones, issue state, or public comments unless the user explicitly requests
that operation in a workflow that permits it.

Normal sequential validation and reporting behavior remains unchanged. Direct
child issue work outside explicit sidecar `parallel` mode and closed-child
coordinator final passes do not use this sidecar child reporting format.

Normal sequential state handling also remains unchanged. Direct child issue
work outside explicit sidecar `parallel` mode and closed-child coordinator
final passes do not use sidecar resumability state.

When the child report is part of a waiting sidecar coordinator run, it must
name the child PR that the user must merge into the remote coordinator branch
before the coordinator resumes. When the child handoff resumes after another
child PR has merged, it must identify the updated local coordinator branch
state incorporated by normal merge and mark affected validation stale until
rerun.

## Prohibited Side Effects

This skill must not:

- modify `.agents/skills/catworld-implement-issue/SKILL.md`;
- perform any file/artifact edit, task implementation, commit, push, PR
  open/update, issue/public-comment mutation, branch/worktree alteration, or
  cleanup while dispatch is only `held-preflight` or `preflight-accepted`;
- treat preflight acceptance as launch or release, record its own coordinator
  launch, or proceed without an exact remote activation/record head containing
  the factual launched-evidence commit and a release acknowledgment;
- continue after rejected or ambiguous dispatch, launch-push failure, fetch or
  launched-evidence/record-head verification failure, incorporation
  conflict/failure,
  release-message failure, interrupted release, or canonical-identity
  mismatch/ambiguity;
- replace or recreate a launched child silently, transfer its release authority
  to another agent identity, or infer identity from a display label, branch,
  worktree, process, or private conversation;
- build or introduce a generic transaction framework, distributed lock, queue,
  daemon, IPC mechanism, polling loop, reusable dispatcher, or other
  coordination infrastructure for the held barrier;
- route normal issues or direct child issue end-to-end requests;
- route closed-child coordinator final passes;
- perform coordinator preflight or artifact preparation;
- create or repair coordinator or child artifact files outside the coordinator
  branch/worktree prepared by the coordinator lifecycle;
- write sidecar artifacts, sidecar commits, or untracked sidecar files to
  local `main`;
- create, switch, or rename sidecar branches or worktrees outside the prepared
  coordinator handoff;
- create a child branch from `main` or treat a child branch based on `main` as
  a valid sidecar child context;
- resume child work from private conversation context instead of current
  GitHub and repository evidence supplied by the coordinator handoff;
- continue from recorded resume state when current GitHub or repository
  evidence conflicts with it;
- rebase, force-push, or perform history-rewriting updates for sidecar
  branches;
- refresh an active child from stale local coordinator state or treat a child
  PR as integrated before local coordinator state has been refreshed from the
  remote coordinator branch;
- push sidecar branches, open pull requests, update pull requests, delete
  remote branches, prune remotes, or perform remote cleanup unless approved
  sidecar PR or cleanup rules permit the operation and explicit user approval
  exists where repository rules require it. Child PR open/update is permitted
  only through the Child PR Delivery Workflow above;
- summarize failed, timed-out, skipped, interrupted, partial, stale, blocked,
  or not-run validation as passed;
- report a sidecar child PR as ready while required validation is stale or an
  unresolved blocker affects the child;
- silently resolve non-trivial conflicts affecting contract, scope,
  persistence, security, authorization, UX, or domain behavior;
- silently decide human-only blocker categories such as significant
  dependencies, material architecture changes, production exposure, secrets,
  deployment changes, Git/GitHub workflow outside the approved model, or
  unresolved product, persistence, security, authorization, UX, domain,
  contract, validation, operational, or scope decisions;
- delete local sidecar branches or worktrees after individual child PR merges;
- clean local sidecar branches or worktrees before the final coordinator PR has
  been merged into `main`;
- open, update, merge, approve, label, or enable auto-merge on pull requests
  unless the prepared handoff and approved sidecar PR rules explicitly permit
  the operation; Codex still must not merge, approve, or enable auto-merge;
- create, modify, close, label, assign, milestone, update checklists, change
  issue state, or comment publicly on GitHub issues without explicit user
  approval in a workflow that permits that operation;
- target sidecar child pull requests directly at `main`;
- change CatWorld product code unless the prepared child tasks explicitly
  require that product change.

Issue #229 supplies the sidecar Git branch, worktree, refresh, and cleanup
rules. Issue #230 supplies sidecar child/final PR target, issue closure,
GitHub mutation, public comment, and remote cleanup approval rules. Issue #231
supplies sidecar validation, blocker, conflict, stale-evidence, readiness, and
human-only blocker reporting rules. Issue #232 supplies sidecar resume state,
resume re-read evidence, refresh state, stale validation, cleanup eligibility,
and normal sequential state boundary rules. Issue #256 supplies prepared child
execution and child PR delivery rules. Issue #257 supplies merge-aware
coordinator resume, remote coordinator refresh before active child refresh,
integration marking, next-layer progression, and refresh-stale validation
rules. Later sidecar issues may add approved adoption or additional delivery
execution rules. Until the relevant rules and approvals are present in the
handoff and governing source-of-truth documents, stop before those operations.

## Stop Conditions

Stop and report a blocker when any of these occur:

- the request lacks a prepared sidecar child handoff;
- the handoff identifies zero, multiple, closed, or ambiguous child issues;
- a required handoff input is missing, incomplete, unreadable, or conflicting;
- the run ID, issue identities, branch/worktree identities, immutable pushed
  control revision, exact pushed handoff-ready evidence commit, containing
  preflight recording head, fingerprint, or stable canonical child identity is
  missing, changed, duplicated, stale, or ambiguous;
- an initial preflight asks the child to accept `launched` state, grants any
  implementation or delivery permission, or requires any repository/GitHub
  mutation;
- preflight acceptance is rejected, interrupted, ambiguous, or cannot be
  correlated durably to this exact canonical identity and fingerprint;
- required prepared artifacts are missing or conflict with each other;
- the coordinator artifact does not record this child artifact path as
  `handoff-ready`;
- implementation is requested before the coordinator has committed and pushed
  the factual launched update, before a fresh fetch verifies the exact remote
  activation/record head and its ancestry from the launched-evidence commit,
  before that recording head is incorporated and verified cleanly in the child
  checkout, or before this same child acknowledges release;
- the launch push fails, the release continuation cannot target the same exact
  child, the remote fetch fails or resolves to another activation/record head,
  that head does not contain the launched-evidence commit, the launched state
  does not match the accepted handoff, incorporation conflicts or fails, the
  post-incorporation checkout is dirty, or release delivery/acknowledgment is
  interrupted or fails;
- a launched child's exact canonical identity is unavailable or ambiguous and
  continuation would require silently substituting a different child;
- the handoff asks the child executor to regenerate `spec.md`, `plan.md`, or
  `tasks.md` independently;
- the prepared plan has pending human approval or unresolved material
  decisions;
- the child dependency status is unresolved, blocked, or contradicted by
  current source-of-truth context;
- shared contracts are missing, ambiguous, unsafe, or inconsistent;
- the target context is missing, the coordinator branch lacks a recorded remote
  ref or successful push status, the child branch targets or starts from
  `main`, or the child PR target is not the coordinator branch;
- branch/worktree collision status is missing, contradictory, or not proven
  same-run for an existing resource;
- required clean-state evidence is missing or reports dirty paths that affect
  the prepared coordinator or child context;
- the resume state is missing, depends on private conversation context, or
  conflicts with current GitHub or repository evidence;
- a child PR merge is reported but the handoff does not prove local
  coordinator state was refreshed from the remote coordinator branch before
  integration marking or active-child refresh;
- child PR issue-reference wording would close the child issue or coordinator
  issue instead of using `Related to` references only;
- the current checkout/worktree does not match the prepared child branch and
  checkout/worktree context;
- a required active-child refresh would use stale coordinator state, rebase,
  force-push, history rewriting, or any method other than a normal merge from
  the updated local coordinator branch;
- required validation is absent or impossible to run honestly;
- required validation is failed, stale, blocked, or not run and the handoff or
  report would need to treat it as passed or ready;
- a child-specific, coordinator-wide, shared-contract, conflict, or human-only
  blocker remains unresolved;
- a non-trivial conflict affects contract, scope, persistence, security,
  authorization, UX, or domain behavior and requires user guidance;
- implementation would touch files outside the prepared child source map
  without an approved scope update;
- implementation would require branch orchestration, PR handling, GitHub issue
  mutation, public comments, or cleanup rules not present in approved sidecar
  source-of-truth documents and explicit user approval where required.

## Validation Expectations

For each child implementation, validation must include:

- confirmation that held preflight verified the exact run, issue, branch,
  worktree, immutable control revision, handoff-ready evidence commit,
  containing preflight recording head, fingerprint, and canonical identity and
  performed zero repository/GitHub mutations;
- confirmation that the same canonical child fetched the exact remote
  activation/record head, verified it contains the factual launched-evidence
  commit, incorporated that recording head cleanly, verified the resulting
  checkout, and acknowledged release before any implementation edit or
  delivery action;
- confirmation that the report records explicit implementation, commit, push,
  and PR permission states and that none became effective from a local-only,
  failed, stale, interrupted, rejected, or ambiguous launch/release;
- the commands, reviews, or manual evidence required by the prepared child
  artifacts and handoff;
- explicit status for every validation item: `passed`, `failed`, `skipped`,
  `timed out`, `interrupted`, `partial`, `stale`, `blocked`, or `not run`;
- freshness status for every validation result;
- ready/draft child PR readiness based on fresh required validation, unresolved
  blockers, and approved sidecar PR target rules;
- child-specific, coordinator-wide, shared-contract, conflict, and human-only
  blocker status when any such condition exists;
- confirmation that failed, timed-out, skipped, interrupted, partial, stale,
  blocked, and not-run validation was not summarized as passed;
- changed-file review against the prepared source map;
- confirmation that the child ran in the prepared child branch and isolated
  checkout/worktree from the coordinator handoff;
- confirmation that the child branch source was the coordinator branch, the
  remote coordinator branch existed before child PR readiness, and no child
  branch or child PR targeted `main`;
- confirmation that branch/worktree collision checks and clean-state checks
  were satisfied by the coordinator handoff before the child ran;
- confirmation that resumed child work used current GitHub and repository
  evidence from the coordinator handoff rather than private conversation
  context;
- confirmation that child workflow status, refresh state, validation freshness,
  blockers, and cleanup eligibility were reported from the prepared resume
  state;
- confirmation that any required active-child refresh used a normal merge from
  the updated local coordinator branch after local coordinator state was
  refreshed from the remote coordinator branch;
- confirmation that sidecar child PR guidance targets the coordinator branch,
  uses exactly the two `Related to` issue-reference lines for the child and
  coordinator, includes no additional control-issue reference such as #260,
  and does not close child or coordinator issues;
- confirmation that child PR ready/draft status reflects fresh validation and
  blocker state honestly;
- confirmation that `.agents/skills/catworld-implement-issue/SKILL.md` was not
  modified by sidecar child execution;
- confirmation that normal sequential routing/state handling and closed-child
  coordinator final-pass routing/state handling were not changed by the child
  execution.

Validation for issue #256 itself must include one local sample child handoff
execution, PR body wording review, child PR target review, draft/not-ready
readiness review for non-passed validation, changed-file review, and
confirmation that the normal implementation skill is untouched.

Validation for issue #260's correction must cover accepted held preflight with
zero edits, rejected and ambiguous dispatch, stable exact-child identity,
durable launched-evidence ancestry through a possibly later remote
activation/record head, clean incorporation of that recording head,
launch-push failure, fetch/verification/incorporation failure, release-message
or acknowledgment failure, interruption/resume behavior, refusal to replace an
unavailable or ambiguous launched child, and proof that no generic transaction,
lock, queue, daemon, IPC, polling, or dispatcher infrastructure was added.

## Final Report

Report:

- child issue number and coordinator issue number;
- exact run ID, immutable control revision, handoff-ready evidence commit,
  containing preflight recording head, handoff fingerprint, stable canonical
  child identity, and preflight acceptance or rejection with zero-mutation
  confirmation;
- exact factual launched-evidence commit, containing remote activation/record
  head, ancestry/fetch/incorporation/clean-state evidence, release
  acknowledgment, and explicit implementation, commit, push, and PR permission
  states;
- coordinator branch, child branch, child PR target, and worktree context from
  the handoff;
- child workflow status, refresh state, validation freshness, blockers, cleanup
  eligibility, last incorporated coordinator branch state, and re-read evidence
  from the coordinator resume state;
- child PR issue-reference wording and GitHub mutation/public comment approval
  state from the handoff;
- prepared artifacts consumed;
- tasks completed and any tasks left incomplete;
- changed-file summary compared with the prepared source map;
- validation commands or reviews with explicit statuses;
- blockers, unresolved decisions, stale evidence, or not-run evidence;
- PR URL when delivery occurred;
- commit hash or hashes when delivery committed scoped child changes;
- remaining risks or limitations;
- child PR readiness as `ready` or `draft` with the validation and blocker
  reason for that state;
- delivery status according to the handoff and later approved sidecar Git/PR
  rules.
- current checkout branch.

Do not post public GitHub comments or mutate GitHub issues unless an approved
sidecar workflow explicitly permits that operation and the user explicitly
requests it where repository rules require approval.
