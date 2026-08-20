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
authorization, scheduling, qualification, independent slice-review selection
and gating, local integration, final validation and delivery. Each slice worker
owns only the bounded local implementation in its handoff. The independent
slice reviewer evaluates whether a selected concrete candidate is a sound base
for continued sliced implementation; it never replaces parent-owned
qualification or final finding classification.

Never route a user directly to
.agents/skills/catworld-implement-slice/SKILL.md. Keep
.agents/skills/catworld-implement-issue/SKILL.md and every Spec Kit skill,
template and script unchanged.

Never route a user directly to
.agents/skills/catworld-review-slice/SKILL.md. It is an internal-only reviewer
invoked exclusively through the bounded gate in this workflow.

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

Resolve the current repository through the remote API and capture its canonical
`nameWithOwner` as repositoryFullName. For every pull-request head comparison in
this workflow, the exact same-repository issue head means both
`headRepository.nameWithOwner == repositoryFullName` and
`headRefName == issueBranch`. A fork pull request with the same headRefName is a
different head identity.

This workflow may:

- create and keep one local issue branch in the primary worktree;
- create deterministic unpublished local slice branches and isolated worktrees;
- spawn bounded local slice workers;
- integrate qualified slice commits locally;
- create only the merge commit and intrinsic deterministic conflict resolution
  required by final-base synchronization;
- create the final remote issue branch once through an atomic create-only
  server operation; and
- open one ready final pull request to the fixed captured base.

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
- use catworld-review-slice outside the selected unpublished slice-candidate
  gate defined below;
- amend commits, squash automatically, use `--force`, rebase published history
  or otherwise rewrite published history; the exact empty-expectation
  `--force-with-lease` first-publication operation in section 12 is the sole
  exception and may never update an existing ref;
- modify GitHub issues or post public comments without separate user authority;
- delete or clean branches/worktrees, prune remotes or automatically resume a
  previous run; or
- inspect or mutate unrelated worktrees or implementations.

After the issue branch is active, keep the primary worktree on it through
success and every terminal stop.

## Run-level reasoning policy

The parent always keeps the reasoning effort with which the operator launched
the current Codex task through the UI/runtime. This workflow defines no parent
default, does not parse a parent reasoning override from the prompt, and must
not inspect, validate, change, replace or synchronize the parent's effort.
Worker effort is never derived from parent effort.

Independent slice reviewers use the project-scoped `catworld_slice_reviewer`
role defined in `.codex/agents/catworld-slice-reviewer.toml`. Require that role
to set `sandbox_mode = "read-only"` and omit model and reasoning-effort settings.
On every fresh spawn, select that role, set `fork_turns="none"` and omit model,
reasoning-effort and token-budget overrides so runtime inheritance preserves the
parent task configuration without its conversation/history. Never apply
workerReasoningEffort or any slice-worker reasoning policy to a reviewer. A
resumed reviewer keeps its existing thread/configuration. Stop before review if
the dedicated role is missing, not read-only, or fixes model or reasoning
configuration.

Before the first catworld-implement-slice spawn, select and record one immutable
workerReasoningEffort for the run:

- when the current invocation contains no explicit worker/subagent reasoning
  instruction, use runtime reasoning effort `low` (`light` in user-facing
  wording); or
- when the user explicitly requests an equivalent of
  `workers reasoning: <supported-level>`, use that supported runtime level for
  every slice worker.

If an explicit worker value is unsupported by the runtime, stop before the
first worker spawn and report it; do not substitute another level.

Do not infer this setting from slice complexity, role, content, correction kind
or the parent's effort. Do not escalate, downgrade or change it during the run,
and do not add model routing, token budgeting, per-slice heuristics or task-type
reasoning rules. Reasoning configuration changes execution resources only; it
must not affect scope, DAG semantics, handoffs, ownership, qualification,
correction, recovery, validation or delivery.

Pass `workerReasoningEffort` through the runtime's per-worker reasoning control
on every catworld-implement-slice spawn: initial delivery, fresh qualification
fallback, dependency repair, dependent retry, rebase correction and global
correction. A resumed worker thread keeps the effort recorded for its original
spawn. If the runtime cannot apply the selected effort to a required worker,
stop before spawning it and report the limitation; never silently inherit or
fall back to the parent's effort.

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
   - **Authorized pre-planning recovery:** require explicit operator
     authorization plus reliable recorded values for the original issue
     number/title, startingBaseSha, fixed startingBaseRef, issue branch and
     primary worktree path. Require reliable checkpoint evidence that the prior
     run stopped after issue-branch creation but before speckit-specify began.
     Never substitute the current HEAD, reachability, remote default or a
     reconstructed ledger for missing original values or checkpoint evidence.
   Historical branches, worktrees, pull requests, issue-closing references or
   other retained artifacts never select recovery for a new run. Recovery
   requires the explicit authorization and exact checkpoint evidence above.
3. For a new run from detached HEAD, require an explicit reliable intended base
   ref from the operator or invocation context. Never infer it from reachability
   or default it to main. For pre-planning recovery, verify the recorded
   startingBaseSha still exists and is exactly the recorded issue branch HEAD.
4. Derive the expected issue branch mechanically as
   `<type>/<issue-number>-<short-description>`:
   - infer `<type>` from a recognized leading title prefix first and recognized
     labels second; match labels case-insensitively with locale-independent
     ASCII folding, map aliases to canonical types, deduplicate them, and when
     more than one remains select the first canonical ASCII type by ordinal byte
     order; use `chore` when neither source is clear; recognize `feat`, `fix`,
     `docs`, `test`, `chore`, `refactor`, `ci`, and `build`, and map `bug` to
     `fix`, `feature` to `feat`, and `documentation` to `docs`;
   - recognize a leading prefix only when one of those tokens or mapped words
     is enclosed in square brackets or followed by a colon, case-insensitively,
     and remove exactly that prefix plus immediately following whitespace;
   - normalize the remaining title using the Unicode 15.1 NFKD tables, remove
     combining marks, lowercase with locale-independent Unicode 15.1 rules,
     replace every run outside ASCII `a` through `z` and `0` through `9` with
     one hyphen, then collapse and trim hyphens; stop before branch creation if
     the runtime cannot apply those exact tables;
   - use `issue` when the result is empty; otherwise retain every normalized
     token in order without stop-word removal, abbreviation or discretionary
     shortening; and
   - cap `<short-description>` at 48 ASCII characters by retaining its first 48
     characters and trimming any resulting trailing hyphen.
   The same issue number, exact title and labels must produce a byte-identical
   branch name in every runtime. In pre-planning recovery, require the recorded
   issue branch to match this expected branch.
5. Stop if the issue branch equals startingBaseRef without a separately supplied
   reliable intended base.
6. For a new run, check collisions only against the exact identities the run
   will own:
   - inspect refs/heads/<issue-branch> and git worktree list --porcelain; stop if
     that exact local branch exists, and report when that exact branch is
     checked out in another worktree;
   - stop if the exact corresponding refs/heads/<issue-branch> exists on origin;
   - stop if an open pull request uses the exact same-repository issue head and
     `baseRefName == startingBaseRef`.
   A closed or unmerged historical PR, a PR with a different head branch, an
   issue-closing reference, or a retained branch/worktree/artifact whose exact
   identity is different is not a collision. Do not use issue-number text or
   name fragments as a substitute for exact ref, PR-head or path equality. When
   all exact identities are free, create and switch to the issue branch from
   exactly startingBaseSha.
7. For authorized pre-planning recovery:
   - require the recorded local issue branch to exist, inspect git worktree list
     --porcelain and stop if it is checked out in another worktree, then switch
     to it without rewriting history;
   - require its HEAD to remain exactly startingBaseSha and require no target
     issue implementation commits or target-attributable canonical feature
     pointer/directory, spec.md, plan.md or tasks.md output; unrelated ignored
     planning state is not checkpoint evidence;
   - require no execution map, planning/slice ledger entry, exact slice branch,
     exact slice worktree, exact remote issue branch or open pull request using
     the exact same-repository issue head and fixed startingBaseRef for this run.
   If any reliable evidence shows that speckit-specify, later planning, slice
   execution, synchronization or delivery began, stop before section 3. Preserve
   every retained artifact, branch and worktree for separately authorized manual
   recovery; never rerun Spec Kit or infer which completed stage to skip.
8. Confirm the issue branch is active and the primary worktree is clean. For a
   new run or authorized pre-planning recovery, confirm that the exact remote
   issue branch remains absent and no open pull request uses the exact
   same-repository issue head with `baseRefName == startingBaseRef`.

Initialize issueDiffBaseSha to startingBaseSha.

Before planning, snapshot read-only the pre-existing ignored `specs/` paths and
the presence and exact content or target of `.specify/feature.json`. Preserve
every pre-existing unrelated `specs/` directory and its contents unchanged. The
previous feature pointer is attribution context, not a collision: the one
authorized target-run speckit-specify call in section 3 may replace it as that
skill requires. Do not restore it automatically afterward. Record the setup
mode, issue number/title, startingBaseSha, fixed startingBaseRef,
issueDiffBaseSha, repositoryFullName, issue branch, primary worktree path,
planning-state snapshot and verified target-run pre-planning checkpoint evidence
in the parent-session ledger.

## 3. Run one canonical local planning cycle

Enter this section only from a new run or the verified pre-planning checkpoint
defined in section 2. Evidence of an earlier canonical cycle is a stop only
when reliable evidence attributes it to this exact target issue and run. A
pre-existing ignored `specs/` directory, `.specify/feature.json`, or planning
artifact captured in section 2 and not reliably tied to this target is
unrelated state and is not planning, recovery or collision evidence. Leave
unrelated directories and artifacts untouched. Preserve the prior pointer's
target directory, but allow the required pointer transition below. Only target
feature state created or changed after the snapshot and reliably associated
with the exact issue branch/session counts as this run's canonical-cycle
evidence. Never call speckit-specify twice for target-run evidence.

Use the complete issue body plus loaded repository context for exactly one
whole-issue cycle:

1. Load and run speckit-specify once. Allow it to replace
   `.specify/feature.json` with the newly resolved target feature directory
   exactly as that skill requires, without modifying or deleting the previous
   target directory. Record the pointer transition and newly created target
   directory/artifacts together as reliable evidence that this run's canonical
   planning cycle has begun. From that transition onward, a second
   speckit-specify invocation for this run is forbidden; do not restore the old
   pointer automatically.
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

For every declared prerequisite -> dependent edge, inspect the canonical issue,
spec, plan and tasks for concrete producer output or behavior that the dependent
must consume. Record each such edge contract in the execution map as a
producer-owned outgoing obligation and the matching dependent prerequisite
expectation. When ordinary integration is the only requirement, record that no
additional edge contract exists; do not invent an API, payload or responsibility.
For example, when a producer-owned Owner lookup must let a dependent populate
the owner's current selectable cats without loading the global Cat collection,
the edge contract requires the current cat identifiers and names; names alone do
not satisfy it. Never move a producer-owned edge obligation into the dependent.

Before any slice worker launches, record for every declared slice whether it
requires independent review and every concrete criterion that made it qualify.
Require review when the slice:

- produces behavior or a contract consumed by dependent slices;
- modifies a shared contract or abstraction;
- affects business rules or protected invariants;
- affects persistence or native SQL;
- affects authentication, authorization or security; or
- introduces or materially changes a component reused by multiple slices.

One matching criterion is sufficient. Do not require review merely because a
slice appears large or complex, and do not use size, estimated effort, task
count or general difficulty as a proxy for one of the criteria. Treat the
selection as immutable for the initial handoff. Later discovery that the
approved slice responsibility itself meets a missed criterion is a parent
execution-map correction before integration, not permission to broaden the
slice or invent another review heuristic.

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
- incoming expectations and producer-owned outgoing edge obligations;
- deterministic branch and absolute worktree path;
- immutable launch SHA and current qualification-base SHA;
- worker identity and state;
- delivery and correction count;
- reported and final integrated commit SHAs;
- changed files, validation and test-policy result;
- qualification/rebase/conflict state;
- whether independent review is required and every recorded selection reason;
- current review candidate qualification-base SHA, head SHA, exact changed
  files and diff identity;
- reviewer identity/configuration state, review state and returned result;
- parent-classified must-fix and deferred findings, review-refresh state and
  any deferred-note persistence result; and
- blocker or final integrated state.

## 6. Create bounded slice handoffs

Each dependency-ready slice receives one explicit handoff containing only:

- parent issue number/title and slice ID/title;
- concise objective;
- required observable or technical behavior;
- relevant feature-wide invariants and approved decisions;
- concrete assigned responsibilities and source surfaces;
- every producer-owned outgoing edge obligation assigned to this slice;
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

### Create the independent review handoff

For a review-required slice, construct the review handoff only after a concrete
candidate has finished worker mutation and its identity can be captured. Give
the reviewer only:

- parent issue number/title and slice ID/title;
- the concise review objective and every recorded reason review is required;
- the slice's assigned responsibilities and source ownership;
- only the approved decisions and invariants relevant to those responsibilities;
- incoming prerequisite expectations and producer-owned outgoing contracts;
- the exact qualificationBaseSha and candidate head SHA;
- the exact changed-file list and complete qualificationBaseSha-to-candidate
  diff;
- available validation evidence with explicit status and freshness;
- the relevant permanent-test authorization and ceiling; and
- an initial review surface plus explicitly prohibited surface.

The initial review surface must name the slice-owned code, relevant contracts,
integration boundaries, useful comparison anchors and prohibited unrelated
surfaces. Do not pass the complete parent issue, spec.md, plan.md, tasks.md,
parent conversation, unrelated slice context or unintegrated sibling
implementation by default. Do not pass qualification findings into the initial
review or review findings into initial qualification. Repository/runtime
instructions needed to load AGENTS.md, .specify/memory/constitution.md and
.agents/skills/catworld-review-slice/SKILL.md are allowed; they do not expand
the review surface.

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

A completed review-required worker does not create a global barrier. While its
qualification, independent review or joined correction gate is pending, keep
filling available capacity and allow independent slices to run, qualify, review
and integrate. The candidate itself must not integrate, and its descendants do
not become ready, until that candidate passes both gates and is integrated.

### Local branch and worktree creation

For each initial launch, capture the current issue-branch HEAD as immutable
launchSha and initialize qualificationBaseSha to that same SHA. Use exactly:

- branch: `<issue-branch>-slice-<slice-id-lowercase>`; and
- absolute worktree path: the sibling of the primary worktree named
  `<primary-directory-name>-<issue-number>-slice-<slice-id-lowercase>`.

All initial-slice collision checks, handoffs and ledger entries must use those
exact identities.

Before creation:

- resolve and verify the path is outside the primary worktree;
- verify that exact path does not exist;
- verify the exact local slice branch does not exist or appear as a checked-out
  branch in git worktree list --porcelain; and
- stop only when that exact deterministic branch or path is occupied.

Other retained branches, worktrees or artifacts are not collisions merely
because their names contain the same issue number or come from an earlier
implementation. Do not delete, detach, move, clean or reinterpret them.

Create the branch from exactly launchSha and add its worktree without switching
the primary worktree. Record launchSha, qualificationBaseSha, branch and
worktree before spawning the worker. Never create a remote slice branch.

Spawn one fresh built-in worker in that worktree without inherited parent
conversation or implementation history. Set the runtime spawn control exactly
to `fork_turns="none"` and independently apply the recorded
workerReasoningEffort. Pass only the bounded handoff; the worker then loads the
required repository/runtime instructions and catworld-implement-slice. It must
not delegate or spawn another working-tree mutator.

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
- every producer-owned outgoing edge obligation in the handoff is implemented
  and evidenced, including the concrete data/behavior required by dependents;
- prohibited artifacts and unrelated surfaces are unchanged;
- every added or modified test in that qualification-base diff respects the
  supplied authorization and value ceiling;
- required and affected validation passed after the latest slice change;
- evidence statuses are explicit and no stale, partial, skipped, interrupted,
  timed-out or not-revalidated result is represented as passed; and
- no unresolved blocker or material decision remains.

This is bounded implementation qualification, not pull-request review. Do not
launch catworld_pr_reviewer.

### Joined qualification and independent-review gate

For a slice that does not require independent review, preserve the existing
qualification and correction path below. For every review-required initial,
rebased, repaired, retried or globally corrected candidate:

1. After worker mutation is finished, capture the exact qualificationBaseSha,
   candidate head SHA, changed-file list and complete diff as one immutable
   review-candidate identity. Record it before either gate begins.
2. Build the bounded review handoff from section 6. For the initial review,
   spawn one fresh project-scoped `catworld_slice_reviewer` role with
   `fork_turns="none"`, no inherited conversation/history and no model,
   reasoning-effort or token-budget override. For a refreshed review, resume the
   existing reviewer when its thread/configuration remains available and safe;
   otherwise spawn the same dedicated role with the same fresh controls. Give it
   only the current bounded handoff plus the repository/runtime instruction to
   load AGENTS.md,
   .specify/memory/constitution.md and
   .agents/skills/catworld-review-slice/SKILL.md. Require it to remain strictly
   read-only and never delegate or spawn another agent.
3. Immediately perform parent qualification against the same candidate while
   the reviewer runs. Initial qualification and initial review must not receive
   each other's findings. The parent must not mutate the candidate worktree
   while either gate is active, but may continue scheduling, qualifying,
   reviewing and integrating independent slices.
4. Wait for both completed results before classifying, correcting or integrating
   the candidate. Require the review to be tied to the recorded base/head/diff
   and to return exactly one state: `clean`, `must-fix`, `deferred-only` or
   `blocked-insufficient-surface`; no auxiliary lifecycle or result response is
   valid. Require every finding to include the tightest location, finding,
   evidence, impact and either minimum correction or deferral reason, plus the
   inspected surface, every justified expansion, observational validation and
   remaining uncertainty. A `blocked-insufficient-surface` result must also
   identify the precise deficiency or terminal surface reason, supporting
   read-only evidence, any minimum bounded parent refresh, candidate-state
   reliability, and whether scope/ownership, approved decisions/invariants and
   the permanent-test ceiling would remain unchanged.
5. Treat the review classifications as recommendations. The parent verifies
   their evidence and owns final classification. A finding is must-fix before
   integration when leaving it unresolved can cause incorrect behavior,
   violate a contract or invariant, make downstream slices build on an
   incorrect foundation, propagate the defect or materially increase rework
   inside the current issue. A finding is deferred only when the candidate
   remains safe for continued implementation and later correction will not
   materially affect correctness, contracts or downstream work.
6. When qualification and parent classification are clean, mark the exact
   candidate integration-eligible. `deferred-only` findings do not block or
   trigger correction. The parent may persist them under
   `local-notes/review-findings/issue-<number>.md`; the reviewer never writes
   notes. Note persistence is operator-local, and failure to write it must be
   reported but must not block integration.
7. `blocked-insufficient-surface` always blocks the reviewed candidate and its
   dependents, but the parent owns the recovery decision after both gates finish.
   Verify every finding and the complete structured blocked evidence. A bounded
   refresh/retry is allowed only when the result identifies a precise
   deterministic missing handoff field, stale or mismatched captured candidate
   evidence, or equivalent review-input deficiency that the parent can safely
   correct or recapture. Before retrying, verify that all current gate activity
   and the slice worker are inactive, the worker cannot resume mutation, and the
   candidate branch/worktree, Git objects and repository state remain reliable
   with no unexplained change. Also verify that the original responsibility,
   source ownership, approved decisions and invariants, exclusions and
   permanent-test ceiling remain unchanged.

   Correct only the bounded handoff input, or recapture the exact qualification
   base, candidate head, changed files and complete diff from that reliable
   state. Invalidate the blocked gate attempt, then restart parent qualification
   and independent review concurrently against the same refreshed candidate
   identity. The reviewer must not fill the missing input itself or widen its
   surface to compensate. Retry only when the refresh makes concrete progress;
   a repeated deficiency without progress is terminal.
8. Treat `blocked-insufficient-surface` as terminal when adequate review
   genuinely requires broad or unbounded exploration, candidate or repository
   state is unreliable, a refresh would expand scope or ownership, a material
   decision is required, approved decisions/invariants or the permanent-test
   ceiling would change, or the input cannot otherwise be made reliable within
   the original handoff. A failed reviewer or unusable result is also a stop.
   Do not self-authorize a broad audit, integrate the candidate or return only
   the qualification result.

### Progress-bounded qualification and review correction

When a non-reviewed candidate's qualification finds a clear, bounded and
deterministic violation of the handoff, return that finding through the existing
path. For a review-required candidate, wait for qualification and review to
finish, then verify and finally classify every finding from both results.
Consolidate every parent-classified pre-integration must-fix item into one
`pre-integration correction` handoff using the unchanged
catworld-implement-slice vocabulary: the original slice handoff, exact current
local HEAD, allowed correction boundary and one precise consolidated
qualification finding. The consolidated qualification finding may enumerate
several violations, but it remains one worker-facing qualification finding and
does not create a reviewer correction kind or require the worker to interpret a
review state, reviewer classification or reviewer-specific finding schema. The
parent may retain review origin as non-normative traceability metadata. Exclude
every deferred finding from the correction handoff. Never send a partial
qualification or review finding while the other initial gate remains active.
The correction process may repeat without an arbitrary numeric round limit only
while every round demonstrates concrete progress and remains within the
original bounded handoff.

Prefer a follow-up turn to the same slice worker when its thread can still be
resumed safely. Give each round the original bounded handoff and allowed
correction boundary, the exact current local HEAD, and only the newly verified
consolidated qualification finding in the existing pre-integration correction
shape. A follow-up to an existing worker is not a fresh spawn;
do not apply `fork_turns="none"` to it. Keep the same branch/worktree. Every
round must add normal follow-up commits; never amend, squash, publish or rewrite
earlier commits. Record the ordered finding, resulting commits and verified
progress so a fresh fallback worker cannot reset correction history.

After every correction, reapply the original permanent-test authorization and
source ownership and rerun all stale or affected validation. Capture the new
candidate head, changed files and complete diff. Requalify the complete delivery
against its authoritative qualificationBaseSha and, when review is required,
refresh independent review concurrently through the joined gate against that
same corrected candidate before integration. Resume the existing reviewer when
its thread/configuration remains available and safe; otherwise spawn a fresh
reviewer with the exact history-free, bounded and no-override controls above. A
refreshed review evaluates the complete corrected candidate, not only previous
findings. Never broaden scope, dependencies, approved decisions, source
ownership or the permanent-test ceiling.

Stop correction instead of continuing when:

- the same material finding repeats without meaningful progress;
- fixes oscillate between previously rejected states;
- a new product, architecture, authorization, persistence, shared-contract,
  UX, correctness-sensitive, operational or scope decision is required;
- the finding cannot be satisfied within assigned source ownership or the
  existing permanent-test ceiling;
- the worker cannot produce fresh required validation; or
- the local branch/worktree state becomes unreliable.

If runtime lifecycle limitations make the original worker thread unavailable,
launch a fresh catworld-implement-slice worker in the same retained
branch/worktree with the complete bounded correction handoff, exact current HEAD
and full ordered progress/finding history. Set `fork_turns="none"` and
independently apply the same recorded workerReasoningEffort. This fallback
continues the same delivery and does not reset or widen it.

Apply this policy whenever section 8 qualification is used for an initial slice,
a stale/rebased slice, a dependency-repair delivery, a dependent retry or a
global-correction delivery. When that slice was selected for independent review,
the joined gate and review freshness requirements apply to every changed
candidate. This does not change the one dependency-repair-per-prerequisite limit
or the one global corrective pass.

### One dependency repair per prerequisite

When a dependent worker reports that an already integrated prerequisite omitted
behavior, preserve the blocked dependent and allow unrelated ready/running work
to continue under the existing scheduler. Before repair, independently verify
from the original execution map, edge contract and prerequisite handoff that:

- the missing behavior was already an approved responsibility of that
  prerequisite;
- repair adds no scope or material decision; and
- the finding is not owned by the dependent.

Stop on ambiguous ownership, new scope or a material decision. Otherwise allow
at most one dependency repair for that prerequisite in the run. This allowance
is separate from the delivery's progress-bounded qualification corrections and
from the one global corrective pass; record a dedicated repair count.

Use exactly:

- branch:
  `<issue-branch>-slice-<slice-id-lowercase>-dependency-repair-1`; and
- absolute sibling worktree:
  `<primary-directory-name>-<issue-number>-slice-<slice-id-lowercase>-dependency-repair-1`.

Capture the exact current issue HEAD as repairLaunchSha and initial
repairQualificationBaseSha. Resolve and verify the worktree is outside the
primary worktree, and stop if the exact branch exists, is checked out in any
worktree or the exact path exists. Create the unpublished branch/worktree from
repairLaunchSha and launch a fresh catworld-implement-slice worker without prior
conversation, setting `fork_turns="none"` and independently applying the
recorded workerReasoningEffort. Give it a complete valid correction handoff
containing the
complete original prerequisite handoff, precise downstream-discovered edge
contract violation, exact repair boundary, integrated prerequisite context at
repairLaunchSha, original decisions/invariants, source ownership, exclusions,
test ceiling, validation/freshness policy, and exact repair branch, worktree,
starting commit and current head. Include every other slice-required field, but
not the complete issue, spec, plan or tasks.

For compatibility with catworld-implement-slice's fixed correction vocabulary,
classify the downstream-discovered violation as a global finding and its worker
delivery kind as `global correction`; this label does not consume or open the
parent's section 10 global corrective pass. Preserve the original handoff's
semantic contract and immutable launch only for traceability, but explicitly
replace its authoritative expected branch, absolute worktree, exact starting
commit, current local head and integrated-prerequisite context with the repair
branch, repair worktree and repairLaunchSha values. The replacement fields
govern the worker's local-state checks; do not present both identity sets as
simultaneously authoritative.

Qualify the repair with section 8 and integrate it through the section 9
single-flight unpublished rebase/validation/requalification/ff-only rules. If
the same prerequisite contract remains broken after this repair, stop instead
of opening another repair.

After successful integration, retry every dependent blocked specifically by the
repaired contract. Require its retained branch/worktree to remain clean and
unpublished. Capture the new exact issue HEAD as retryBaseSha and rebase that
branch onto it using the deterministic unpublished-rebase safety rules from
section 9, without retaining the exclusive integration lane while the retried
worker runs. Update qualificationBaseSha to retryBaseSha and the handoff's
integrated-prerequisite context. Preserve already valid in-scope unpublished
dependent work only when the rebase and attribution are deterministic;
otherwise stop.
Launch a fresh worker without the previous conversation, setting
`fork_turns="none"` and independently applying the recorded
workerReasoningEffort, using the complete original bounded dependent handoff
plus the repaired prerequisite context,
precise prior blocker, allowed continuation boundary, exact current local head,
branch and worktree. Requalify the complete dependent delivery normally.

Classify this retry as a `rebase correction`: the rebase finding is that the
dependent's prior prerequisite blocker is resolved in retryBaseSha and the
bounded correction must continue only its original assigned work against that
context. Retain the original immutable launch commit only for traceability. The
unchanged retained dependent branch/worktree and its exact post-rebase local
HEAD are the authoritative correction identity/current-head fields; the worker
must not treat the original starting commit as the expected current HEAD.

## 9. Rebase and fast-forward integrate gated slices

Initial worker execution, qualification and applicable independent review
against an existing qualification base may remain concurrent. Once any
completed slice, correction or repair is selected as the next integration
candidate, enter one exclusive local integration lane from the clean primary
worktree while it remains on the issue branch. Candidate selection does not
change ready-queue order, scheduling priority or launch behavior.

While the lane is active, other workers may continue implementing and completed
deliveries may be inspected or queued, but no sibling integration, correction or
repair may advance the issue branch. In the lane:

1. Capture the exact current issue HEAD as laneBaseSha.
2. If the candidate is stale, rebase its unpublished branch onto exactly
   laneBaseSha and resolve only deterministic conflicts.
3. Rerun required and affected validation after any rebase/conflict result.
4. Set qualificationBaseSha to laneBaseSha when rebased. Requalify the complete
   candidate delivery and, when the slice requires review, run or refresh
   independent review through the section 8 joined gate against the same exact
   base/head/diff.
5. Require the candidate to be integration-eligible with no parent-classified
   must-fix finding and fresh applicable review evidence.
6. Verify the issue HEAD still equals laneBaseSha.
7. Integrate with `git merge --ff-only <candidate-branch>`.
8. Release the lane only after the fast-forward completes or the candidate
   stops without advancing the issue branch.

### Candidate still based on current issue HEAD

When the candidate's current qualificationBaseSha equals laneBaseSha, reconfirm
qualification. When review is required, also require the completed review to
match the exact current base, head, changed files and diff, and require the
joined gate to have marked that candidate integration-eligible. Then run
git merge --ff-only <candidate-branch>. Stop if fast-forward unexpectedly fails.

### Issue branch advanced since candidate qualification

When qualificationBaseSha differs from laneBaseSha:

1. Ensure no worker is active in the slice worktree and both involved branches
   are clean.
2. Use the laneBaseSha already captured as rebaseBaseSha. In the slice
   worktree, rebase the unpublished slice branch onto exactly that SHA. Never
   rebase a published branch.
3. Resolve conflicts only when the correct result is deterministic from the
   issue, canonical artifacts, already integrated behavior, repository
   instructions, constitution, architecture and current sources of truth.
4. Use a bounded slice-worker correction in that same worktree when code
   adaptation or conflict resolution needs the slice's implementation context.
   It may resolve only the identified deterministic conflict and must not use
   the rebase as permission for new scope. Resume the existing worker when safe
   without applying a no-history spawn control. Any required fresh worker must
   set `fork_turns="none"` and independently apply workerReasoningEffort.
5. Stop on a material product, architecture, authorization, persistence,
   shared-contract, UX, correctness-sensitive, operational or scope decision.
6. After a successful rebase, set qualificationBaseSha to rebaseBaseSha while
   retaining immutable launchSha only for traceability. Rerun every
   slice-required or affected validation after the rebase/conflict result and
   reapply the permanent-test gate only to qualificationBaseSha..slice-branch.
7. Requalify the complete rebased delivery from
   qualificationBaseSha..slice-branch and, when the slice requires review, run
   a fresh or refreshed independent review concurrently against that same exact
   rebased candidate through section 8. Recapture its rewritten local commit
   SHAs. Already integrated sibling changes are outside this diff and must not
   be attributed to the slice.
8. Wait for the joined gate, resolve any bounded correction through section 8,
   and require the resulting exact candidate to be integration-eligible.
9. Verify current issue-branch HEAD still equals qualificationBaseSha, then from
   the primary worktree run git merge --ff-only <slice-branch>.

Do not leave the lane between rebase, validation, requalification, applicable
review refresh, joined-gate classification, HEAD verification and fast-forward
integration. Independent workers and review/qualification work may continue,
but no other integration may advance the issue branch. This prevents sibling
integrations from making freshly collected evidence stale and normally bounds a
stale candidate to one final orchestrator-caused rebase.

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

Treat a review-required slice that lacks a completed fresh joined gate for its
integrated candidate as unqualified. Deferred-only findings remain report-only
and do not make an otherwise eligible integrated slice incomplete.

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
the current issue-branch HEAD. For each affected slice:

1. Capture that current HEAD as both immutable correctionLaunchSha and initial
   correctionQualificationBaseSha.
2. Use the exact new unpublished branch
   `<issue-branch>-slice-<slice-id-lowercase>-global-correction-1` and the exact
   absolute worktree path formed beside the primary worktree as
   `<primary-directory-name>-<issue-number>-slice-<slice-id-lowercase>-global-correction-1`.
   Resolve the path and require it to be outside the primary worktree.
3. Stop if that exact branch exists, is checked out in any worktree, or that
   exact path exists. Ignore differently identified retained state, but never
   reuse the initial slice branch/worktree or any retained context.
4. Create the branch at exactly correctionLaunchSha, add the exact worktree,
   record both identities and SHAs, and launch a fresh bounded worker through
   catworld-implement-slice with `fork_turns="none"`, independently applying the
   recorded workerReasoningEffort, and a complete valid correction handoff.
   Preserve
   the complete original bounded slice handoff, then add the precise
   global-completeness or post-sync finding and its allowed correction boundary.
   Set both the correction starting commit and current local head to
   correctionLaunchSha, and replace the original integrated-prerequisite field
   with the behavior actually present at that correction starting head. Supply
   the deterministic global-correction branch and absolute worktree path.
   Retain every original approved decision and invariant, objective and required
   behavior, assigned responsibility and source surface, exclusion, prohibited
   path/action, permanent-test authorization and ceiling, and required
   validation/freshness expectation, plus every other field required by
   catworld-implement-slice. Keep the correction bounded to the finding; do not
   pass the complete issue, spec.md, plan.md or tasks.md.
5. Qualify the complete correctionQualificationBaseSha-to-branch delivery with
   section 8. If the issue branch advanced, treat the result as stale, rebase
   the unpublished correction branch onto the newly captured issue HEAD, set
   correctionQualificationBaseSha to that rebase base, rerun affected evidence
   and requalify exactly as section 9 requires.
6. Verify the issue branch still equals correctionQualificationBaseSha and
   integrate with `git merge --ff-only` only. Retain the correction branch and
   worktree after integration.

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
7. Confirm every review-required integrated candidate has a recorded selection
   reason, exact reviewed base/head/diff identity, usable reviewer result,
   parent classification and no unresolved must-fix finding. Confirm every
   deferred finding and any non-blocking note-persistence failure is retained
   for final reporting.
8. Confirm the primary issue branch is active and clean and every worker and
   reviewer is inactive.

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
   that evidence is stale. The parent may commit only the synchronization merge
   itself and deterministic conflict resolution intrinsic to that merge. It
   must not author behavioral or source adaptation directly. Assign any such
   post-sync gap to its existing slice and, only when the one global corrective
   pass is still unused, run the fixed global-correction workflow and its
   complete correction-handoff contract from section 10 against the current
   synchronized HEAD. If that pass is exhausted,
   ownership is ambiguous, scope would expand or a material decision is needed,
   stop. After an integrated correction, rerun completeness, scope, test-policy
   and affected validation gates against the same issueDiffBaseSha.
7. Immediately before publication, re-query the exact remote issue branch and
   open pull requests using the exact same-repository issue head with
   `baseRefName == startingBaseRef`. Require both the remote branch and that
   exact head/base PR pair to remain absent. If either exists, stop before any
   remote mutation; do not rely on earlier setup evidence or a cached remote
   ref. Open PRs from the same head to another base may be reported but do not
   block this run.
8. Transfer the local commit, tree and blob graph and publish exact local `HEAD`
   to `refs/heads/<issue-branch>` with
   `git push --force-with-lease=refs/heads/<issue-branch>: origin HEAD:refs/heads/<issue-branch>`.
   The empty expected value for that exact destination ref is the mutation-time
   create-only guarantee: the push must fail without updating when the ref
   exists, including when another actor creates it after step 7. Do not retry
   with a normal push, use a non-empty lease expectation, use `--force`, or
   update/rewrite any existing remote history. If the runtime cannot perform
   this exact empty-expectation lease, stop before remote mutation.
9. After the push succeeds, fetch or query the exact remote ref and require
   `origin/<issue-branch>` to resolve to the exact local final HEAD. Then, before
   PR creation, re-query open pull requests using the exact same-repository
   issue head with `baseRefName == startingBaseRef`. Stop if that exact pair
   already exists. Otherwise create one ready pull request with exactly that
   head and base. If GitHub rejects creation because an equivalent PR appeared
   concurrently, stop and report the collision; do not update, adopt or reuse
   it. A same-repository same-head PR to another base is external state and does
   not block creation for the fixed base.
10. The pull-request body must contain:
   - Closes #<issue-number>;
   - a concise whole-issue summary;
   - the final validation commands/results; and
   - a mapping from every slice ID/title to its final integrated commit SHA(s).
11. Request external review through the ready pull request and report it as
    awaiting external read-only review. Do not select or notify a specific
    reviewer without separate user instruction.
12. Capture currentBaseSha, PR number, URL, ready status and exact remote head
    SHA. Verify the created PR has
    `headRepository.nameWithOwner == repositoryFullName`,
    `headRefName == issueBranch`, `baseRefName == startingBaseRef`, and a remote
    head SHA equal to the exact final local HEAD and retained session state.

A successful automated run creates only the final issue branch and final pull
request as GitHub implementation artifacts. Do not launch a Codex reviewer,
wait for an automatic Codex review gate or perform automatic PR remediation.
Do not merge the pull request or modify the issue.

Record:

- independent pull-request review rounds: 0;
- reviewed remote pull-request head SHAs: none;
- final pull-request review result: not run — external review requested; and
- automatic pull-request remediation commits: none.

## 13. Terminal stops and recovery

Stop normal final delivery on:

- a dirty or unreliable starting state;
- a missing, unreadable, closed/non-implementable or non-issue target;
- an invalid slice/dependency model;
- an exact new-run issue-branch collision from section 2, or an exact target
  slice branch/worktree-path collision from section 7 or dependency-repair
  identity collision from section 8;
- a canonical artifact conflict or pending material decision;
- incomplete or ambiguous execution coverage;
- a worker or delivery that remains blocked, failed or unqualified;
- a review-required candidate whose reviewer fails, returns an unusable result,
  cannot complete safely within its bounded review surface, or reports
  `blocked-insufficient-surface` whose evidence does not permit a safe,
  progress-making bounded refresh with an inactive worker, reliable candidate
  state and unchanged scope, ownership, decisions, invariants and permanent-test
  ceiling;
- a review-required candidate with an unresolved parent-classified must-fix
  finding or stale review evidence after correction, rebase, repair, retry or
  global correction;
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
retained Git state. This automated skill may recover only the explicitly
authorized, reliably verified pre-planning checkpoint from section 2. Any later
retained state requires separately authorized manual recovery and must stop
before speckit-specify.

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
- independent-review selection decision and reason per slice;
- ready-queue/capacity events and launch/integration order;
- every slice's state, branch, retained worktree path, starting head, reported
  commits, final integrated commits, qualification/correction/rebase/conflict
  result, dependency-repair identity/count/result, changed files, validation,
  review candidate identities, reviewer/result/classification/refresh state,
  deferred findings/note result and blocker;
- global completeness and corrective-pass result;
- final validation commands with explicit statuses and freshness;
- final test-diff and scope-drift reviews;
- git status --short and concise accumulated diff summary;
- final PR URL and ready status, or the exact delivery blocker;
- independent pull-request review fields fixed to
  zero/none/external review requested, distinct from the per-slice review gate;
- unresolved blocking findings and report-only risks; and
- confirmation that the issue branch remains checked out and local slice
  branches/worktrees were retained.

When delivery did not complete and a non-empty qualified scoped implementation
diff exists, also provide one suggested conventional commit title and a concise
pull-request description based only on that completed scoped work. For a
routing, setup, collision, DAG or planning stop before any qualified
implementation diff exists, state that no commit or pull-request suggestion is
applicable; never fabricate one.

## Done when

- One canonical local Spec Kit planning cycle covers the complete valid sliced
  issue and its ignored artifacts were never published.
- Every implementable responsibility was assigned exactly once before launch.
- Every concrete prerequisite-to-dependent contract was assigned to its
  producer and qualified before integration, or repaired at most once through
  the bounded dependency-repair path.
- Every ready slice ran through a bounded internal worker in an isolated local
  branch/worktree according to the explicit DAG and runtime capacity.
- Every integrated delivery qualified and reached the issue branch through
  unpublished rebase when needed and git merge --ff-only.
- Every slice's independent-review requirement and reasons were recorded before
  worker launch; size or complexity alone never selected review.
- Every review-required candidate ran qualification and bounded independent
  review concurrently against one exact identity, waited for both gates before
  correction or integration, cleared all must-fix findings through refreshed
  gates and allowed deferred-only findings to remain non-blocking.
- One bounded global completeness process found no remaining work.
- Final evidence is fresh after the latest relevant change.
- Only the final issue branch and one ready pull request were published, with
  slice-to-commit traceability and external review requested.
- The ordinary issue workflow and Spec Kit files remained unchanged.
- No Codex review/remediation, final merge, history rewrite, branch/worktree
  cleanup, issue mutation or public comment occurred.
