---
name: "catworld-implement-parent"
description: "Orchestrate one CatWorld GitHub issue with a valid explicit slice model by planning it once, delegating bounded slices to isolated local workers, integrating unpublished commits, and delivering one final pull request. Use for automatically routed sliced issues or explicit parent-workflow requests; reject ordinary issues and pull requests."
metadata:
  author: "catworld"
  source: "issue-385"
---

# CatWorld Implement Sliced Issue

Use this skill for exactly one GitHub issue whose body declares a valid slice
model. It may be selected automatically by AGENTS.md or explicitly requested by
the user. It replaces the former child-issue and child-pull-request parent
workflow.

The parent owns whole-issue planning, execution coverage, permanent-test
authorization, scheduling, qualification, local integration, final validation
and delivery. Each slice worker owns only the bounded local implementation in
its handoff.

Never route a user directly to
.agents/skills/catworld-implement-slice/SKILL.md. Keep
.agents/skills/catworld-implement-issue/SKILL.md and every Spec Kit skill,
template and script unchanged.

## Required context and authority

Before changing repository state, read:

- AGENTS.md;
- .specify/memory/constitution.md;
- docs/ARCHITECTURE.md;
- this skill; and
- the complete GitHub issue, including title, body, labels and state.

Confirm that the remote item is an open or otherwise implementable issue rather
than a pull request. The issue, repository instructions, constitution,
implemented architecture and the canonical local feature artifacts created by
this workflow are the complete scope and decision contract.

This workflow may:

- create and keep one local issue branch in the primary worktree;
- create deterministic unpublished local slice branches and isolated worktrees;
- spawn bounded local slice workers;
- integrate qualified slice commits locally;
- create normal commits required by deterministic final-base synchronization;
- push the final issue branch normally; and
- open or update one ready final pull request to the fixed captured base.

It must not:

- publish the issue branch before final delivery;
- publish a slice branch or create a child issue or child pull request;
- run the ordinary issue workflow for a slice;
- run speckit-implement or speckit-converge;
- commit, push or otherwise publish Spec Kit artifacts;
- generate example feature directories or versioned orchestration artifacts;
- commit or push directly to the captured base or main;
- merge the final pull request, enable auto-merge or approve it;
- launch catworld_pr_reviewer or perform automatic pull-request remediation;
- amend commits, squash automatically, force-push, rebase published history or
  otherwise rewrite published history;
- modify GitHub issues or post public comments without separate user authority;
- delete or clean branches/worktrees, prune remotes or automatically resume a
  previous run; or
- inspect or mutate unrelated worktrees or implementations.

After the issue branch is active, keep the primary worktree on it through
success and every terminal stop.

## 1. Validate the issue slice model

Perform this validation before branch creation, Spec Kit or worker launch.

### Authoritative sections

Find actual Markdown level-two headings whose complete trimmed text is exactly:

- ## Implementation slices
- ## Hard dependencies between slices

Inline-code mentions, prose, quoted examples and fenced-code content do not
count as top-level sections. Each section extends to the next actual level-two
heading or the end of the issue body.

Stop when either required section is absent. This rule applies even when the
user explicitly invoked the parent workflow. Automatic shorthand routing must
already have treated an issue with neither section as ordinary and stopped on
an issue with exactly one section; do not reinterpret either case here.

### Slice declarations

Only level-three headings inside the Implementation slices section with the
exact form “### S<number> — <title>” declare slices. The identifier uses an
uppercase S followed by digits, the separator is the em dash shown above and
the title must remain non-blank after trimming.

Stop when:

- fewer than two valid slices exist;
- a slice identifier is duplicated;
- a slice-like level-three declaration is malformed; or
- the section structure makes declaration boundaries unreliable.

Preserve declaration order as the deterministic tie-breaker for ready-queue
ordering. Record every slice ID, title and authoritative section body. Do not
invent slices from canonical planning output or repository inspection.

### Hard dependencies

Read dependency declarations only from the Hard dependencies between slices
section. Normalize an unambiguous declaration to prerequisite -> dependent only
when both IDs are declared slices. “None” or equivalent explicit absence yields
an empty graph.

Do not infer an edge from slice order, likely file overlap, shared concepts,
suggested sequencing or text outside the authoritative dependency section.

Stop before planning or launch when a required declaration:

- names an unknown slice;
- makes a slice depend on itself;
- contradicts another direction or says the same dependency is both required
  and not required;
- has no reliably determinable direction; or
- creates a cycle.

Record normalized edges and the exact source statements supporting them.

## 2. Prepare the primary issue branch

1. Require git status --porcelain to have no output. Ignored local Spec Kit
   artifacts do not make the worktree dirty; any versioned or untracked output
   is a stop and must be reported.
2. Classify setup as exactly one of these modes before selecting any base:
   - **New run:** no recovery was explicitly authorized. Before any branch
     change, capture startingBaseSha from git rev-parse HEAD and
     startingBaseRef independently from the current symbolic branch.
   - **Authorized recovery:** require explicit operator authorization plus
     reliable recorded values for the original issue number/title,
     startingBaseSha, fixed startingBaseRef, issue branch and primary worktree
     path. Also require the last synchronized base SHA, last published remote
     head and pull-request number when each existed. Never substitute the
     current HEAD, reachability, remote default or a reconstructed ledger for
     missing original values.
3. For a new run from detached HEAD, require an explicit reliable intended base
   ref from the operator or invocation context. Never infer it from reachability
   or default it to main. For recovery, verify the recorded startingBaseSha
   still exists and is an ancestor of the recorded issue branch. When a last
   synchronized base SHA was recorded, require startingBaseSha to be its
   ancestor and that synchronized SHA to be an ancestor of the issue branch.
4. Derive the expected issue branch as
   <type>/<issue-number>-<short-description>. Infer the conventional type from
   the issue title prefix first and labels second, using chore when neither is
   clear. Keep the description concise and deterministic. In recovery, require
   the recorded issue branch to match this expected branch.
5. Stop if the issue branch equals startingBaseRef without a separately supplied
   reliable intended base.
6. For a new run, stop if the local issue branch already exists. Otherwise
   create and switch to it from exactly startingBaseSha.
7. For authorized recovery:
   - require the recorded local issue branch to exist, inspect git worktree list
     --porcelain and stop if it is checked out in another worktree, then switch
     to it without rewriting history;
   - fetch and inspect only its exact remote ref when the recorded state says it
     was published; require the fetched remote head to equal the recorded last
     published head and to be an ancestor of the local issue-branch HEAD;
   - when the recorded state says the branch was not published, require the
     exact remote issue ref to be absent;
   - query pull requests for the exact issue head. If a pull request was
     recorded, require exactly that open PR, its head branch, fixed base ref and
     head SHA to match the verified remote state, and require explicit
     authorization to reuse it. If none was recorded, require no matching PR.
   Stop on missing, divergent, ambiguous or contradictory recovery evidence;
   do not fast-forward, merge, rebase, force-push or guess a replacement state.
8. Confirm the issue branch is active and the primary worktree is clean. For a
   new run also confirm that no remote issue branch or matching pull request
   exists. For recovery, retain the verified remote and PR state for delivery.

Initialize issueDiffBaseSha to startingBaseSha for a new or not-yet-synchronized
run. For authorized recovery after a recorded parent synchronization, initialize
it to that verified last synchronized base SHA instead.

Record the setup mode, issue number/title, startingBaseSha, fixed
startingBaseRef, issueDiffBaseSha, issue branch, primary worktree path, verified
remote head and authorized PR identity in the parent-session ledger.

## 3. Run one canonical local planning cycle

Use the complete issue body plus loaded repository context for exactly one
whole-issue cycle:

1. Load and run speckit-specify.
2. Validate spec.md against the issue, constitution and implemented
   architecture. Stop on scope drift or an unresolved material question.
3. Load and run speckit-plan.
4. Inspect its decision state. Continue only when “Assessment required: No” or
   when every required significant decision has explicit human approval or a
   still-applicable approved source. Stop on pending approval, changed selected
   architecture or unresolved product, security, authorization, persistence,
   shared-contract, UX, correctness-sensitive or operational decisions.
5. Load and run speckit-tasks.
6. Load and run speckit-analyze.
7. Resolve only safe mechanical artifact inconsistencies or true duplicate
   tasks, then rerun speckit-analyze. Stop when reconciliation would change
   approved scope or a material inconsistency remains.

The complete issue and resulting spec.md, plan.md and tasks.md are the canonical
feature contract for every slice and the accumulated implementation.

Verify every generated artifact is ignored and absent from the versioned diff.
Do not modify ignore files merely to make an unexpected artifact disappear;
stop if the repository cannot keep these artifacts local. Do not create a
planning commit. Do not push the issue branch.

Never run speckit-implement or speckit-converge in this workflow. Workers also
must not run them.

## 4. Decide permanent-test and validation policy

Before building handoffs, decide the authorization and ceiling for every slice
from only the issue, constitution and materially affected risk.

Permanent coverage may be considered when the issue explicitly requires it,
the constitution requires it, or the slice materially affects a business rule,
protected invariant, authorization, security, persistence, Flyway migration,
shared/external contract or operational safety. Generated artifacts cannot
authorize coverage independently.

Authorization is not a mandate. Include permanent coverage only when it
protects a realistic high-value regression, existing evidence is inadequate,
the responsible layer is singular and the maintenance cost is proportionate.
Do not add tests for wording, file presence or incidental implementation
details when structural validation, compilation, existing suites, directed
inspection or a focused manual check is adequate.

Remove unauthorized permanent-test work from generated tasks mechanically and
rerun speckit-analyze. Rewrite mixed tasks to preserve only permitted existing
suite, build, inspection or manual evidence. Stop for explicit human authority
only when exceptional uncategorized risk genuinely requires maintained
coverage.

For every slice, record:

- whether permanent coverage is prohibited or authorized;
- the exact maximum files/scenarios or responsible behavior when authorized;
- required slice-local commands and evidence;
- integration-affected evidence the parent will rerun; and
- any native-MySQL evidence the canonical plan requires.

A worker must not broaden this policy. Final qualification and delivery reapply
it to the complete diff.

## 5. Build the execution map before launch

Use slice descriptions plus canonical spec, plan and tasks to build one
parent-session execution map.

Assign every implementable responsibility to exactly one declared slice.
Include source surfaces, requirements/outcomes, relevant invariants/approved
decisions, required evidence and hard prerequisites. Retain with the parent
only global orchestration, accumulated completeness/scope review, final
validation, fixed-base synchronization and delivery.

Stop before launching any worker when:

- important implementable work is unassigned;
- the same work is assigned to multiple slices ambiguously;
- a declared slice has no coherent assigned implementation;
- an assignment contradicts a hard dependency; or
- allocation requires a new product, architecture, authorization, persistence,
  shared-contract, UX, correctness-sensitive, operational or scope decision.

Do not create a versioned execution map, slice mapping or orchestration-state
file. Keep the map and run ledger in the parent session.

Initialize each slice as declared and track at least:

- dependency state and ready-queue position;
- deterministic branch and absolute worktree path;
- immutable launch SHA and current qualification-base SHA;
- worker identity and state;
- delivery and correction count;
- reported and final integrated commit SHAs;
- changed files, validation and test-policy result;
- qualification/rebase/conflict state; and
- blocker or final integrated state.

## 6. Create bounded slice handoffs

Each dependency-ready slice receives one explicit handoff containing only:

- parent issue number/title and slice ID/title;
- concise objective;
- required observable or technical behavior;
- relevant feature-wide invariants and approved decisions;
- concrete assigned responsibilities and source surfaces;
- already integrated prerequisite behavior available in starting HEAD;
- explicit exclusions, prohibited paths and prohibited actions;
- parent-decided permanent-test authorization/ceiling;
- required slice validation and freshness evidence;
- exact immutable launch commit; and
- expected local branch and isolated worktree.

Do not pass the complete issue body, complete spec.md, complete plan.md or
complete tasks.md by default. Include a bounded excerpt or reference only when
the worker cannot complete its assigned behavior without it, and identify why
it is necessary.

Direct every worker to load AGENTS.md, the constitution, architecture, current
source tree and .agents/skills/catworld-implement-slice/SKILL.md. It must not
fetch or reinterpret the full issue. It must return a blocker instead of
deciding any missing material question.

Tell the worker it owns only its named worktree/files, is not alone in the
repository, must not revert or overwrite other slices, and must adapt only to
already integrated prerequisite behavior present in its starting HEAD.

## 7. Schedule dependency-ready slices dynamically

A slice is ready only when all declared prerequisites are already integrated.
Completed worker execution without integration does not satisfy a dependency.

At every scheduling point:

1. Add all not-yet-launched ready slices to the FIFO ready queue, using
   declaration order to break simultaneous readiness.
2. Launch as many queued slices as current agent capacity permits. Do not impose
   another concurrency cap or form artificial batches.
3. Leave excess ready slices queued without changing the DAG.
4. After every successful integration, recalculate readiness immediately and
   fill newly available capacity.
5. When a slice blocks or fails, do not launch its descendants. Allow
   independent queued/running slices to continue and preserve their useful
   qualified results, but do not perform normal final delivery while any
   required slice is not integrated.

### Local branch and worktree creation

For each initial launch, capture the current issue-branch HEAD as immutable
launchSha and initialize qualificationBaseSha to that same SHA. Derive a
unique deterministic local branch containing the issue number and slice ID,
such as <issue-branch>-slice-<slice-id-lowercase>. Derive an absolute isolated
worktree path outside the primary worktree that also contains the repository,
issue number and slice ID.

Before creation:

- resolve and verify the path is outside the primary worktree;
- verify the path does not exist;
- verify the local branch does not exist; and
- stop and require explicit reuse/recovery authority if retained state already
  occupies either target.

Create the branch from exactly launchSha and add its worktree without switching
the primary worktree. Record launchSha, qualificationBaseSha, branch and
worktree before spawning the worker. Never create a remote slice branch.

Spawn one fresh built-in worker in that worktree without inherited parent
conversation or implementation history. Pass only the bounded handoff and tell
it to follow catworld-implement-slice. The worker must not delegate or spawn
another working-tree mutator.

The parent may continue scheduling, qualifying and integrating other work in the
primary worktree while slice workers mutate only their own worktrees. Never
edit a slice worktree while its worker is active.

## 8. Qualify every slice delivery

Wait for worker completions while continuing to fill ready capacity. A worker
report is evidence to verify, not automatic qualification.

For each delivery, independently confirm:

- the expected branch and worktree exist and are clean;
- the worker is finished and cannot resume mutation;
- reported commits exist, are descendants of the current qualificationBaseSha
  and contain the complete slice delivery;
- qualificationBaseSha is the immutable launchSha before any rebase, or the
  exact issue-branch HEAD captured as the base of the latest rebase;
- the full qualificationBaseSha-to-branch diff contains only the slice delivery
  and fits the handoff;
- prohibited artifacts and unrelated surfaces are unchanged;
- every added or modified test in that qualification-base diff respects the
  supplied authorization and value ceiling;
- required and affected validation passed after the latest slice change;
- evidence statuses are explicit and no stale, partial, skipped, interrupted,
  timed-out or not-revalidated result is represented as passed; and
- no unresolved blocker or material decision remains.

This is bounded implementation qualification, not pull-request review. Do not
launch catworld_pr_reviewer.

### One pre-integration correction

When qualification finds a clear, bounded and deterministic violation of the
handoff, return that exact finding to a worker in the same worktree. Allow at
most one automatic pre-integration correction round for that delivery.

The correction worker receives the original handoff, precise finding and
current local head. It may add normal follow-up commits but must not amend,
squash, publish or expand scope. Reapply test authorization, rerun affected
validation and requalify the complete delivery.

Stop the slice when the correction still cannot qualify, the same problem
repeats without progress or any fix requires a new material decision.

## 9. Rebase and fast-forward integrate qualified slices

Integrate one qualified slice at a time from the clean primary worktree while
it remains on the issue branch.

### Slice still based on current issue HEAD

When the slice's immutable launchSha equals current issue-branch HEAD,
run git merge --ff-only <slice-branch>. Stop if fast-forward unexpectedly fails.

### Issue branch advanced while the slice ran

When the issue branch advanced:

1. Ensure no worker is active in the slice worktree and both involved branches
   are clean.
2. Capture the exact current issue-branch HEAD as rebaseBaseSha. In the slice
   worktree, rebase the unpublished slice branch onto exactly that SHA. Never
   rebase a published branch.
3. Resolve conflicts only when the correct result is deterministic from the
   issue, canonical artifacts, already integrated behavior, repository
   instructions, constitution, architecture and current sources of truth.
4. Use a bounded slice-worker correction in that same worktree when code
   adaptation or conflict resolution needs the slice's implementation context.
   It may resolve only the identified deterministic conflict and must not use
   the rebase as permission for new scope.
5. Stop on a material product, architecture, authorization, persistence,
   shared-contract, UX, correctness-sensitive, operational or scope decision.
6. After a successful rebase, set qualificationBaseSha to rebaseBaseSha while
   retaining immutable launchSha only for traceability. Rerun every
   slice-required or affected validation after the rebase/conflict result and
   reapply the permanent-test gate only to qualificationBaseSha..slice-branch.
7. Requalify the complete rebased delivery from
   qualificationBaseSha..slice-branch and recapture its rewritten local commit
   SHAs. Already integrated sibling changes are outside this diff and must not
   be attributed to the slice.
8. Verify current issue-branch HEAD still equals qualificationBaseSha, then from
   the primary worktree run git merge --ff-only <slice-branch>.

Do not use squash, cherry-pick as the normal path, slice merge commits or parent
merge commits for slice integration. Rebase is allowed only because every slice
branch remains local and unpublished.

After a successful fast-forward, record the slice's final integrated commits
and order, mark it integrated, recalculate dependency readiness immediately and
fill capacity. Do not remove its branch or worktree.

## 10. Run one global completeness pass

Begin only after every required slice is integrated and no slice worker can
resume mutation. If a required slice is blocked, failed or unqualified, preserve
independent results and stop normal final delivery.

Compare the complete accumulated issueDiffBaseSha..HEAD code and changed paths
with:

- the full issue;
- canonical spec.md, plan.md and tasks.md;
- the execution/source map;
- every declared slice and assigned responsibility; and
- the permanent-test and validation policy.

Confirm every responsibility is complete exactly once and every changed surface
is in scope. Do not run speckit-converge or speckit-implement.

### One global corrective pass

When bounded gaps belong unambiguously to existing slices, group them by the
responsible slice and create one corrective delivery per affected slice from
the current issue-branch HEAD. Use a new deterministic local branch/worktree or
an explicitly safe retained context, and give the worker a bounded corrective
handoff through catworld-implement-slice.

Allow only one global corrective pass. Qualify and integrate its commits using
the same unpublished rebase/fast-forward rules. Corrective commits may extend
earlier slice history; do not rewrite earlier integrated commits merely to
preserve a one-commit appearance.

Rerun the complete global check after that pass. Stop when:

- any gap remains or the same finding repeats without progress;
- a new slice or unassigned responsibility would be required;
- allocation or correction would expand scope; or
- a new material decision is needed.

## 11. Run final validation and diff gates

Against the complete current issue branch:

1. Run every issue-required, plan-required and integration-affected validation.
2. When real MySQL evidence is required, use the isolated native-validation
   safety procedure from catworld-implement-issue without invoking that
   workflow, and include the required procedure in any relevant handoff.
3. Rerun evidence made stale by a later integration, rebase, correction or
   conflict change.
4. Report each command/check as passed, failed, skipped, timed out, interrupted,
   partial, stale or not revalidated. Only fresh passed evidence counts.
5. Inspect every added or modified test in issueDiffBaseSha..HEAD. Treat any
   unauthorized or low-value broadened coverage as a missed qualification or
   completeness failure. Correct it only through an unused allowed slice or
   global correction round, then rerun affected validation; otherwise stop
   rather than opening an extra corrective pass.
6. Inspect changed paths in issueDiffBaseSha..HEAD against the issue, canonical
   source map and slice ledger. Stop when an unexpected surface cannot be
   justified without scope expansion.
7. Confirm the primary issue branch is active and clean and every worker is
   inactive.

Failed or incomplete required final validation is a stop for normal final
delivery.

## 12. Synchronize and deliver once

Only after global completeness and fresh validation succeed:

1. Fetch only origin <startingBaseRef>.
2. Stop if origin/<startingBaseRef> is missing; otherwise capture its exact
   fetched SHA as currentBaseSha.
3. Verify startingBaseSha is an ancestor of currentBaseSha. Stop on rewritten
   or incompatible parent history; do not choose another base.
4. If the issue branch already contains currentBaseSha, do not merge. Otherwise
   merge currentBaseSha normally into the issue branch.
5. Resolve only deterministic in-scope conflicts. Stop for any new material
   decision or scope expansion. When a merge occurs, record its commit and
   inspect every conflict resolution separately against both parents so
   unrelated current-base behavior is not attributed to or overwritten by the
   issue.
6. Once currentBaseSha is an ancestor of HEAD, set issueDiffBaseSha to
   currentBaseSha. Always rerun the permanent-test and scope/completeness gates
   against issueDiffBaseSha..HEAD, excluding unrelated base-only changes. When a
   merge changed the tree, also rerun required and affected validation because
   that evidence is stale. Create any necessary normal follow-up commit without
   rewriting history, then rerun the affected gates against the same
   issueDiffBaseSha.
7. Push only the final issue branch to origin with a normal non-force push. In
   authorized recovery, the verified remote head must remain an ancestor of the
   final local head immediately before pushing.
8. Open one ready pull request to the fixed startingBaseRef when the verified
   setup state had no PR. In authorized recovery with an explicitly authorized
   matching PR, reuse only that PR and update it without changing its fixed base
   or head branch. Stop if a different or additional matching PR appears.
9. The pull-request body must contain:
   - Closes #<issue-number>;
   - a concise whole-issue summary;
   - the final validation commands/results; and
   - a mapping from every slice ID/title to its final integrated commit SHA(s).
10. Request external review through the ready pull request and report it as
    awaiting external read-only review. Do not select or notify a specific
    reviewer without separate user instruction.
11. Capture currentBaseSha, PR number, URL, ready status and exact remote head
    SHA, and verify that they match the final branch and the retained new-run or
    recovery state.

The only GitHub implementation artifacts created by a successful new run are
the final issue branch and final pull request. Do not launch a Codex reviewer,
wait for an automatic Codex review gate or perform automatic PR remediation.
Do not merge the pull request or modify the issue.

Record:

- independent review rounds: 0;
- reviewed remote head SHAs: none;
- final review result: not run — external review requested; and
- automatic remediation commits: none.

## 13. Terminal stops and recovery

Stop normal final delivery on:

- a dirty or unreliable starting state;
- a missing, unreadable, closed/non-implementable or non-issue target;
- an invalid slice/dependency model;
- an existing branch/worktree without explicit safe reuse authority;
- a canonical artifact conflict or pending material decision;
- incomplete or ambiguous execution coverage;
- a worker or delivery that remains blocked, failed or unqualified;
- a nondeterministic rebase, integration or parent-synchronization conflict;
- remaining global gaps after the one corrective pass;
- failed, incomplete or stale required validation;
- unauthorized permanent-test coverage that cannot be removed safely;
- unjustified changed surfaces;
- missing/incompatible current remote base evidence; or
- unsafe repository or worktree state.

After a slice blocks, descendants must not start, but independent ready/running
slices may finish and their qualified results may be integrated. No ready final
pull request may omit a required slice.

Never automatically delete, detach, move or clean local slice branches or
worktrees, including after success. Never infer or resume a stopped run from
retained Git state. A later reuse or recovery attempt requires explicit operator
authorization and reliable state instructions.

Keep the primary worktree on the issue branch. If it is dirty at a stop, report
every path and do not switch branches.

## 14. Final report

Report:

- issue number/title and final workflow state;
- startingBaseSha, fixed startingBaseRef, final currentBaseSha/issueDiffBaseSha,
  issue branch, primary path, final local/remote head and parent-synchronization
  result;
- parsed slices and normalized dependency edges;
- execution-map coverage result and permanent-test authorization per slice;
- ready-queue/capacity events and launch/integration order;
- every slice's state, branch, retained worktree path, starting head, reported
  commits, final integrated commits, qualification/correction/rebase/conflict
  result, changed files, validation and blocker;
- global completeness and corrective-pass result;
- final validation commands with explicit statuses and freshness;
- final test-diff and scope-drift reviews;
- git status --short and concise accumulated diff summary;
- final PR URL and ready status, or the exact delivery blocker;
- independent review fields fixed to zero/none/external review requested;
- unresolved blocking findings and report-only risks; and
- confirmation that the issue branch remains checked out and local slice
  branches/worktrees were retained.

When delivery did not complete, also provide one suggested conventional commit
title and a concise pull-request description based only on completed scoped
work.

## Done when

- One canonical local Spec Kit planning cycle covers the complete valid sliced
  issue and its ignored artifacts were never published.
- Every implementable responsibility was assigned exactly once before launch.
- Every ready slice ran through a bounded internal worker in an isolated local
  branch/worktree according to the explicit DAG and runtime capacity.
- Every integrated delivery qualified and reached the issue branch through
  unpublished rebase when needed and git merge --ff-only.
- One bounded global completeness process found no remaining work.
- Final evidence is fresh after the latest relevant change.
- Only the final issue branch and one ready pull request were published, with
  slice-to-commit traceability and external review requested.
- The ordinary issue workflow and Spec Kit files remained unchanged.
- No Codex review/remediation, final merge, history rewrite, branch/worktree
  cleanup, issue mutation or public comment occurred.
