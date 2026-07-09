---
name: "catworld-parallel-coordinator"
description: "Preflight CatWorld coordinator issues and prepare sidecar artifacts and Git state for explicit opt-in parallel execution without changing the existing sequential implementation workflow."
compatibility: "Requires the CatWorld repository, GitHub issue context, and the sidecar workflow guardrails from issues #220-#232"
metadata:
  author: "catworld"
  source: "issues-226-232"
---

# CatWorld Parallel Coordinator

Use this sidecar entrypoint only for an explicit CatWorld coordinator issue
request that includes the `parallel` keyword, after #261 activates repository
routing guardrails for sidecar parallel use. Until #261 activates that route,
this skill is sidecar build-out text and must not be used for real product
work.

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
validation, and cleanup eligibility. It still does not open, update, merge,
approve, or enable auto-merge on pull requests, mutate GitHub issues, post
public comments, run adoption dry-runs, or replace the normal sequential
implementation workflow. Later #220 child issues may extend adoption and
delivery execution pieces.

## Routing Boundary

- Normal implementable issues use the existing sequential workflow.
- Direct child issues use the existing sequential workflow.
- Until #261 activates sidecar coordinator routing, explicit coordinator
  `parallel` requests must stop with a routing error instead of using this
  skill for real product work.
- After #261 activates sidecar coordinator routing, an eligible coordinator
  `parallel` request starts or resumes the executable sidecar lifecycle in
  this skill when coordinator preflight, source-of-truth review, child issue
  inspection, dependency classification, and safety checks pass.
- `parallel` on a non-coordinator issue is invalid. Stop and report that
  parallel mode applies only to coordinator issues.
- `parallel` on a direct child issue is invalid. Stop and report that direct
  child issues run through the existing sequential workflow.
- Issues #220 through #234 must not route through parallel mode while the
  sidecar workflow is being designed, validated, and adopted. Use the current
  sequential workflow guardrails for those issues.
- Coordinator end-to-end requests without `parallel` are not handled by this
  sidecar entrypoint. Apply the existing routing contract:
  - if any listed child issue is still open, stop with the existing coordinator
    routing error;
  - if all listed child issues are closed, use the existing sequential
    end-to-end workflow for the coordinator final pass;
  - the closed-child coordinator final pass is not a separate workflow and must
    not redo closed child scope.
- When a valid future sidecar run is waiting for user-owned merges, report the
  exact child PRs that must be merged into the remote coordinator branch before
  resume.
- When a valid future sidecar run resumes after user-owned merges, re-read
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

Parallel readiness is a preflight result, not an issue label. Do not require,
invent, add, or route based on a required `parallel-ready` label.

Determine readiness through:

- coordinator issue inspection;
- child issue inspection;
- dependency classification;
- source-of-truth review.

Classify child issue relationships before any future parallel execution:

- **Hard dependency**: one child requires another child's result before it can
  be implemented safely. Do not parallelize blindly.
- **Conflict risk**: children likely touch the same source files, shared
  workflow rules, shared contracts, migrations, authorization, persistence,
  global styles, or other cross-cutting surfaces. Stop or require explicit
  sequencing before parallel execution.
- **Independent candidate**: children appear to touch disjoint source maps and
  have no unresolved dependency or source-of-truth conflict. This is only a
  preflight classification in issue #226, not permission to launch execution.
- **Incomplete context**: child issue data, feature artifacts, source maps, or
  governing documentation are missing or contradictory. Stop.

## Source-of-Truth Review

Compare the coordinator and child issue bodies against:

- `AGENTS.md` routing guardrails;
- the CatWorld constitution;
- `docs/ARCHITECTURE.md` workflow routing and sidecar artifact path guidance;
- relevant `spec.md`, `plan.md`, and `tasks.md` artifacts when present;
- issue #220 sidecar architecture and issues #221, #222, #225, #226, #227,
  #228, #229, #230, #231, and #232 when their routing, entrypoint, artifact,
  child handoff, Git execution, PR delivery, validation reporting, or resume
  state contracts apply.

Stop when source-of-truth documents conflict, contain unresolved blocking
decisions, require pending human approval, or would require changing approved
scope.

## Executable Run Lifecycle

This lifecycle is executable behavior only after #261 activates sidecar
coordinator routing. Until then, it is build-out documentation and must not be
used for real product work.

Each state has explicit entry conditions, stop conditions, and allowed next
states. If a stop condition applies, report the current state, evidence read,
blocking condition, and user action required when applicable.

| State | Entry Conditions | Stop Conditions | Allowed Next States |
|-------|------------------|-----------------|---------------------|
| 1. New coordinator `parallel` run | Prompt explicitly names a coordinator issue and includes `parallel`; #261 has activated sidecar routing. | #261 is not active; issue is not a coordinator; issue is ambiguous; required context cannot be read. | Coordinator preflight. |
| 2. Coordinator preflight | New or resumed run passes routing boundary. | Coordinator is ineligible, lacks listed children, or has unresolved source-of-truth blockers. | Source-of-truth and child issue inspection. |
| 3. Source-of-truth and child issue inspection | Coordinator issue and listed children are known. | Child issue context is missing or contradictory; child state conflicts with requested route; governing artifacts conflict. | Artifact path/content planning; dependency-layer planning. |
| 4. Artifact path and content planning | Required issue and source context has been read. | Target path collision; duplicate child issue number; missing source contract; unresolved blocker. | Dependency-layer planning; coordinator branch/worktree preparation. |
| 5. Dependency-layer planning | Child issue map and source maps are available. | Hard dependencies cannot be ordered; conflict risk requires user sequencing; missing shared contract. | Coordinator branch/worktree preparation; report blocker. |
| 6. Coordinator branch/worktree preparation | Artifact paths and contents are planned; branch/worktree targets are computed. | Cannot create or enter coordinator branch/worktree safely; target collision; operation would modify local `main`. | Coordinator and child artifact writing. |
| 7. Coordinator and child artifact writing | Codex is inside the coordinator branch/worktree. | Artifact write would occur outside coordinator branch/worktree; artifact conflicts with approved scope. | Child branch/worktree preparation. |
| 8. Child branch/worktree preparation | Dependency-ready child layer exists and artifacts are written. | Child branch/worktree cannot be prepared safely from coordinator branch; collision; child target would be `main`. | Child handoff and child-agent launch for one dependency-ready layer. |
| 9. Child handoff and child-agent launch for one dependency-ready layer | One dependency-ready layer has valid child artifacts, Git context, and handoff inputs. | Missing handoff data; hard-dependent layer would start early; child scope unresolved. | Child implementation and child PR delivery; waiting for user merges. |
| 10. Child implementation and child PR delivery | Child agent receives valid prepared handoff and runs in prepared child context. | Child validation fails and cannot be fixed in scope; child blocker remains; PR target or issue wording violates sidecar rules. | Waiting for user merges. |
| 11. Waiting for user merges into remote coordinator branch | One or more child PRs are ready or draft for user review. | Required child PRs remain unmerged; GitHub state cannot be read; user-owned merge is pending. | Resume after user merges. |
| 12. Resume after user merges | User indicates child PRs were merged, or current evidence shows merge progress. | Current GitHub or repository evidence conflicts with recorded resume state. | Fetch and refresh local coordinator branch/worktree. |
| 13. Fetch and refresh local coordinator branch/worktree | Remote coordinator branch contains new child merges. | Fetch fails; local coordinator state cannot be fast-forwarded or safely updated from the remote coordinator branch. | Active child branch refresh; next dependency layer execution; integrated coordinator validation. |
| 14. Active child branch refresh | Active child branches/worktrees need updated coordinator state. | Refresh would require rebase, force-push, history rewrite, or unresolved conflict. | Next dependency layer execution; waiting for user guidance. |
| 15. Next dependency layer execution | Previous dependency layer is integrated and validation state is known. | Next layer has unresolved blockers, stale required evidence, or conflict risk. | Child branch/worktree preparation; integrated coordinator validation. |
| 16. Integrated coordinator validation | All child PRs are integrated into the coordinator branch. | Required coordinator or consumed child validation is failed, stale, skipped, partial, or not run. | Final coordinator PR to `main`; report blocker. |
| 17. Final coordinator PR to `main` | Integrated validation is fresh and passed, and no unresolved blocker remains. | PR target or closing authority violates sidecar rules; validation stale; user-owned merge remains pending. | Post-final-merge local cleanup eligibility. |
| 18. Post-final-merge local cleanup eligibility | Final coordinator PR has been merged into `main`. | Final PR is not merged; cleanup target was not created by sidecar workflow; remote cleanup lacks explicit approval. | Report local cleanup eligibility; remote cleanup remains approval-gated. |

### Operation Ownership

Codex may inspect issues and PRs read-only, plan artifacts, prepare allowed
local branches/worktrees after #261 activation, write artifacts only inside the
coordinator branch/worktree, launch dependency-ready child handoffs, report PR
readiness, refresh local sidecar branches by allowed methods, and prepare
final coordinator validation evidence.

The user owns all merges. Child PRs are merged by the user into the remote
coordinator branch. The final coordinator PR is merged by the user into
`main`. GitHub issue mutations, public comments, remote branch deletion,
remote pruning, and remote cleanup require explicit user approval in a workflow
that permits the operation.

### Dependency Layers

Launch at most one dependency-ready layer at a time. Multiple child issues in
the same layer may be handed off only when they are independent candidates and
do not have unresolved conflict risk. A hard-dependent layer must wait until
all prerequisite child PRs are merged into the coordinator branch, the local
coordinator branch/worktree has been refreshed from the remote coordinator
branch, affected active child branches/worktrees have been refreshed by an
allowed method, and required validation is fresh.

## Sidecar Artifact Preparation

Run artifact preparation only after coordinator classification, required
context loading, source-of-truth review, dependency classification, and routing
guardrails allow the sidecar coordinator path. Do not run artifact preparation
for normal implementable issues, direct child issues, or closed-child
coordinator final passes that enter the existing sequential workflow.

Before creating or describing artifacts, apply the #225 path contract:

- coordinator artifacts use `specs/<coordinator-number>-coordinator-<slug>/`;
- child implementation artifacts use `specs/<child-issue-number>-<child-slug>/`;
- existing target paths, same-number prefixes, and duplicate child issue
  numbers are stop conditions.

Compute the coordinator target path and every child target path before writing
or reusing any artifact. Stop instead of overwriting, merging, deleting,
silently reusing, or automatically renaming artifacts when any target path
collides or any child issue number is duplicated.

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
running in a dry or read-only preparation mode. The coordinator artifact must
include:

- coordinator issue number, title, classification, and source references;
- child issue map with each child issue number, title, state, dependencies,
  source references, artifact path, and current preparation status;
- dependency layers that identify hard dependencies, independent candidates,
  conflict risks, and incomplete-context blockers;
- shared contract section that records cross-child contracts, source-of-truth
  references, and unresolved shared-contract blockers;
- sidecar Git state section that records coordinator branch, coordinator
  checkout/worktree, child branch, child checkout/worktree, child PR target,
  refresh status, cleanup status, and remote-cleanup approval state;
- sidecar PR delivery section that records child PR target, child issue
  reference wording, final coordinator PR target, closure authority, GitHub
  issue mutation approval state, and public comment approval state;
- sidecar validation reporting section that records required coordinator and
  child evidence, explicit validation statuses, freshness state, child PR
  ready/draft readiness, coordinator readiness, blockers, conflicts, and
  human-only decisions;
- sidecar resume state section that records completed, active, blocked,
  pending, paused, and resume-needed child work; required GitHub and
  repository evidence to re-read before continuing; refresh-needed/refreshed
  state after child PR merges; stale validation state; and cleanup eligibility;
- validation plan for coordinator-level and child-level evidence;
- status table for each child issue, including artifact path, branch, local
  checkout/worktree, PR, validation state, workflow status, blockers,
  dependency layer, readiness, refresh state, cleanup eligibility, and required
  validation.

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

- the coordinator orchestration artifact;
- the child issue title, body, dependencies, validation requirements, and
  explicit out-of-scope boundaries;
- the child dependency layer and any hard-dependency or conflict-risk notes;
- the shared contract section;
- applicable source-of-truth documentation and existing feature artifacts.

Validate every child artifact set against the coordinator issue, child issue
body, relevant source-of-truth documentation, and shared contract before
delegation. Stop before delegation when any child artifact expands beyond
approved child scope, omits required validation, conflicts with another child,
or relies on an unresolved shared contract.

### Shared Contract and Child Issue Boundaries

Do not require a seed-first child issue and do not invent or create foundation
or shared-contract child issues. If a missing shared contract or foundation
issue appears necessary and it does not already exist, stop before delegation
and ask for user guidance. Create such an issue only when a future activated
workflow explicitly permits it and the user approves that issue mutation.

This artifact-preparation path is not used when all listed child issues are
closed and the coordinator enters the existing sequential final pass. The final
pass must not redo closed child scope.

Issue #227 adds artifact preparation only. Issue #229 adds sidecar Git
execution rules. Issue #230 adds sidecar PR target, closure, GitHub mutation,
public comment, and remote cleanup approval rules. Issue #231 adds sidecar
validation, blocker, conflict, stale-evidence, readiness, and human-only
blocker reporting rules without opening real pull requests, merging pull
requests, mutating GitHub issues, posting public comments, running adoption
dry-runs, or changing CatWorld product code. Issue #232 adds resumable
coordinator state tracking without running background work, posting GitHub
comments, changing normal issue workflow state, changing CatWorld product code,
or performing cleanup.

## Sidecar Git Execution Rules

Apply these rules only after routing guardrails allow an explicit coordinator
`parallel` request and after coordinator preflight, source-of-truth review,
dependency classification, artifact preparation, and shared-contract validation
have succeeded. Issues #220 through #234 still use the current sequential
workflow guardrails while the sidecar workflow is being designed, validated,
and adopted.

The coordinator branch/worktree is the sidecar artifact write boundary. Before
writing coordinator or child artifact files, Codex must create or enter the
coordinator branch/worktree. Local `main` must remain clean throughout sidecar
planning: no sidecar artifacts, sidecar commits, or untracked sidecar files may
be written there. If branch/worktree preparation is unsafe or blocked, stop
before modifying files.

### Deterministic Names and Collision Checks

Compute every sidecar branch and checkout/worktree name before creating,
switching to, merging into, or reusing any Git resource.

- Coordinator branch name component: `<coordinator-number>-coordinator-<slug>`.
- Child branch name component: `<child-issue-number>-<child-slug>`.
- Coordinator checkout/worktree directory name component:
  `<coordinator-number>-coordinator-<slug>`.
- Child checkout/worktree directory name component:
  `<child-issue-number>-<child-slug>`.
- Slugs use the #225 slug rule: lowercase, hyphen-separated title text after
  removing issue title prefixes such as `[Workflow]`, `[Epic]`, `feat:`, or
  `docs:`.

The coordinator artifact must record the final full branch names and full local
checkout/worktree paths. The parent directory for local sidecar checkouts is
workflow context, but each sidecar directory name must use the deterministic
component above.

Stop instead of guessing, overwriting, deleting, or auto-renaming when a branch,
checkout, worktree, directory, or artifact name collides. Reuse is clearly
recoverable only when the coordinator artifact or explicit user-provided
context proves the resource is the intended sidecar resource for the same issue
and slug.

### Coordinator Branch and Checkout

Coordinator parallel work uses exactly one coordinator integration branch
created from current `origin/main`. Do not update local `main`, merge unrelated
work into `main`, or use `main` as a sidecar delivery branch.

When a coordinator checkout/worktree is needed, it must be isolated from every
active child checkout/worktree and recorded in the coordinator artifact.
After a user-owned child PR merge, a resumed coordinator run must fetch and
refresh the local coordinator branch/worktree from the remote coordinator
branch before launching another dependency layer or consuming the merged child
work as fresh evidence.

### Child Branches and Checkouts

Each sidecar child implementation branch starts from the coordinator branch,
not from `main`. Each active child implementation uses an isolated local
checkout/worktree recorded in the coordinator artifact and supplied in the
child handoff.

Sidecar child PR guidance must target the coordinator branch. A sidecar child
PR must not target `main` directly.
Child branch/worktree preparation starts only for one dependency-ready layer.
Hard-dependent layers wait until prerequisite child PRs are integrated and any
required coordinator or active-child refresh is complete.

### Refresh After Child PR Merges

After the user merges a child PR into the coordinator branch, every still-active
sidecar child branch or worktree that needs the latest coordinator state is
updated from the coordinator branch using fast-forward or a normal merge only.

Do not rebase sidecar branches. Do not force-push sidecar branches. Do not use
history-rewriting updates for sidecar branches.

The coordinator artifact must record which still-active child branches or
worktrees need refresh, which have been refreshed, and which coordinator branch
state was last incorporated. Validation affected by a child branch refresh is
stale until rerun after the fast-forward or normal merge.

### Cleanup

Do not delete local sidecar branches or worktrees after individual child PR
merges. Local cleanup is eligible only after the final coordinator PR has been
merged into `main`, and only for local branches and worktrees created by the
sidecar workflow.

Remote branch deletion, remote pruning, or any remote cleanup requires explicit
user approval.

Direct child issue work outside `parallel` keeps the normal sequential Git
workflow. A closed-child coordinator final pass also keeps the normal
sequential Git workflow and is outside this sidecar coordinator branch model.

## Sidecar Resume State Tracking

Apply these resume state rules only to sidecar coordinator parallel execution
after routing guardrails, coordinator preflight, source-of-truth review,
dependency classification, artifact preparation, shared-contract validation,
sidecar Git state validation, sidecar PR delivery validation, and sidecar
validation reporting rules have succeeded. Issues #220 through #234 still use
the current sequential workflow guardrails while the sidecar workflow is being
designed, validated, and adopted.

### Durable Resume State

The coordinator artifact is the durable resume source. A later session must be
able to identify completed, active, blocked, pending, paused, and
resume-needed child work from repository artifacts and GitHub/repository state
without private conversation context.

For each child issue, the coordinator artifact must record:

- child artifact path;
- child branch when created;
- local child checkout/worktree when created;
- child PR when opened;
- validation state and freshness;
- workflow status;
- blockers;
- refresh state after coordinator branch updates or child PR merges;
- cleanup eligibility.

Pending children must be identifiable without implying that a branch,
checkout/worktree, PR, or validation result already exists.

### Resume Re-Read Requirements

Before continuing a paused sidecar coordinator run or a run resumed in a new
Codex session, re-read current evidence from GitHub and the repository:

- coordinator issue body, state, labels, and listed child issues;
- each relevant child issue body, state, labels, dependencies, and blockers;
- relevant child PRs and final coordinator PR state;
- coordinator artifact and child artifacts;
- coordinator branch state;
- active sidecar child branch state;
- local checkout/worktree existence and path state;
- validation evidence, status, and freshness;
- blockers, conflicts, and human-only decision state;
- cleanup eligibility and remote cleanup approval state.

If the current evidence conflicts with recorded resume state, stop and report
the mismatch instead of guessing, deleting resources, rebasing, force-pushing,
or silently treating stale validation as fresh.

### Resume Updates

Update the coordinator artifact when any of these events occur or are observed
during resume:

- user merges a child PR into the coordinator branch;
- an active child branch/worktree needs refresh from the coordinator branch;
- an active child branch/worktree is refreshed using fast-forward or a normal
  merge;
- validation fails, is skipped, is interrupted, is partial, is stale, or is not
  run;
- child work pauses or resumes;
- a child-specific, coordinator-wide, shared-contract, conflict, or human-only
  blocker appears or clears;
- final coordinator PR merge makes local cleanup eligible;
- explicit user approval for remote cleanup is present or absent.

After a child PR merge into the coordinator branch, local sidecar branches and
worktrees are still retained. Local cleanup remains ineligible until the final
coordinator PR has merged into `main`.

### Non-Sidecar State Boundaries

Normal sequential issue implementation state remains unchanged. Direct child
issue work outside explicit sidecar `parallel` mode uses normal sequential
state handling.

A closed-child coordinator final pass uses the existing sequential workflow and
normal sequential state handling. It may reference closed child issues for
traceability, but it must not use sidecar resumability state or present closed
child issue scope as newly implemented work.

## Sidecar PR Delivery Rules

Apply these PR delivery rules only to sidecar coordinator parallel execution
after routing guardrails, coordinator preflight, source-of-truth review,
dependency classification, artifact preparation, shared-contract validation,
and sidecar Git state validation have succeeded. Issues #220 through #234
still use the current sequential workflow guardrails while the sidecar workflow
is being designed, validated, and adopted.

### Child PR Target and Issue References

Sidecar child PR guidance must target the coordinator integration branch. A
sidecar child PR must not target `main` directly.

Sidecar child PR descriptions use `Related to #<child-issue>` and
`Related to #<coordinator-issue>` issue references only. They must not use
issue-closing wording for the child issue or coordinator issue, and they must
not imply that the child PR is the final delivery PR to `main`.

### Final Coordinator PR

The final sidecar coordinator PR targets `main` from the coordinator
integration branch. This final coordinator PR may close the coordinator issue
and child issues in the sidecar set. It should identify integrated child PRs or
child issue references clearly enough for reviewer traceability.

The final coordinator PR is the only sidecar PR that may close the coordinator
set during sidecar parallel delivery.

### Merge Authority and GitHub Mutation Approval

Codex reports readiness for sidecar child PRs and the final coordinator PR. The
user performs merges. Codex must not merge, approve, or enable auto-merge on
pull requests.

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
succeeded. Issues #220 through #234 still use the current sequential workflow
guardrails while the sidecar workflow is being designed, validated, and
adopted.

### Validation Evidence and Freshness

Sidecar child reports and coordinator integration reports must list every
required command, manual review, local sample artifact, and consumed child
validation result. Each evidence item must use an explicit status:
`passed`, `failed`, `skipped`, `timed out`, `interrupted`, `partial`,
`stale`, or `not run`.

Failed validation is never summarized as passed. Failed, timed-out, skipped,
interrupted, partial, stale, and not-run validation must never be summarized as
passed. A report may contain both passed and non-passed evidence, but its
summary must preserve the non-passed status and its readiness impact.

Validation becomes stale when coordinator branch updates, child branch
refreshes, conflict resolution, or other relevant changes could affect the
previous evidence. Stale evidence must be rerun before readiness is reported,
or it must remain explicitly reported as stale. Coordinator readiness must not
consume stale child evidence as fresh evidence.

### Ready and Draft Reporting

A sidecar child PR may be reported as ready only when required validation is
fresh and passed, no unresolved blocker affects the child, and the approved
sidecar PR target and issue-reference rules are satisfied.

A sidecar child PR must be reported as draft when required validation is
failed, skipped, timed out, interrupted, partial, stale, not run, or blocked,
unless the non-passed evidence is explicitly outside child readiness and the
report explains why. The same freshness and blocker rules apply before the
final coordinator PR can be reported ready.

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
  sidecar rule permits the operation and explicit user approval exists where
  repository rules require it;
- delete local sidecar branches or worktrees after individual child PR merges;
- clean local sidecar branches or worktrees before the final coordinator PR has
  been merged into `main`;
- create sidecar artifacts outside the approved artifact-preparation phase or
  when any artifact-preparation stop condition applies;
- run artifact preparation for closed-child coordinator final passes;
- summarize failed, timed-out, skipped, interrupted, partial, stale, or not-run
  validation as passed;
- report a sidecar child PR or final coordinator PR as ready while required
  validation is stale or an unresolved blocker affects readiness;
- silently resolve non-trivial conflicts affecting contract, scope,
  persistence, security, authorization, UX, or domain behavior;
- silently decide human-only blocker categories such as significant
  dependencies, material architecture changes, production exposure, secrets,
  deployment changes, Git/GitHub workflow outside the approved model, or
  unresolved product, persistence, security, authorization, UX, domain,
  contract, validation, operational, or scope decisions;
- require seed-first execution or invent/create foundation or shared-contract
  child issues without explicit user approval in a future activated workflow
  that permits issue mutation;
- delegate child implementation work before #261 activation, during the current
  build-out or pre-execution states, during preflight or artifact preparation,
  outside an approved dependency-ready lifecycle state, or without valid
  prepared child artifacts, valid branch/worktree context, dependency-ready
  layer evidence, a valid prepared child handoff, and later approved sidecar
  rules that permit delegation. This prohibition does not block the future
  activated #249 lifecycle from launching dependency-ready child handoffs when
  the approved rules permit that operation;
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
  whether artifacts were prepared, described, blocked, or not applicable;
- sidecar Git status, including coordinator branch, coordinator checkout or
  worktree path, child branch names, child checkout or worktree paths, child PR
  target branch, refresh status, cleanup eligibility, and unresolved
  collision/approval blockers when Git state has been prepared or described;
- sidecar PR delivery status, including child PR target branch, child issue
  reference wording, final coordinator PR target, closure authority, GitHub
  mutation approval state, public comment approval state, and remote cleanup
  approval state when PR delivery state has been prepared or described;
- sidecar validation reporting status, including commands and reviews passed,
  failed, skipped, timed out, interrupted, partial, stale, and not run;
- child PR ready/draft readiness status and final coordinator readiness status;
- sidecar resume state status, including completed, active, blocked, pending,
  paused, and resume-needed child work; required GitHub and repository evidence
  re-read before continuing; refresh-needed/refreshed state; stale validation
  state; cleanup eligibility; and remote cleanup approval state;
- blocker and conflict status, including child-specific blockers,
  coordinator-wide blockers, shared-contract blockers, human-only blockers, and
  user-guidance requirements;
- readiness status: `blocked`, `not adopted`, or `preflight-ready`;
- specific stop reasons or remaining prerequisites;
- confirmation that no child implementation, PR operation, issue mutation,
  public comment, product code change, prohibited Git operation, private-context
  resume, or unapproved cleanup was performed.

Until #261 activates sidecar coordinator routing and execution, stop after
preflight and artifact preparation. Do not launch child execution during the
current build-out even if the coordinator appears preflight-ready and artifacts
are prepared.

## Validation Expectations

Validation for this entrypoint must include:

- local routing examples for explicit coordinator `parallel`, non-coordinator
  `parallel`, direct child `parallel`, open-child coordinator end-to-end, and
  closed-child coordinator final-pass requests;
- review that readiness is based on preflight, child issue inspection,
  dependency classification, and source-of-truth review;
- simulation of one coordinator with at least three child issues, including the
  coordinator artifact path and each child artifact path;
- review that coordinator artifacts require a child issue map, dependency
  layers, shared contract section, validation plan, and status table;
- review that child artifacts require issue-numbered `spec.md`, `plan.md`, and
  `tasks.md` preparation before delegation;
- simulation of one coordinator branch and two child branches using a temporary
  local Git repository, with the coordinator branch created from `origin/main`
  and each child branch created from the coordinator branch;
- simulation of a child PR merge into the coordinator branch followed by
  refreshing another active child branch from the coordinator branch using
  fast-forward or a normal merge;
- review that sidecar child PR guidance targets the coordinator branch and not
  `main`;
- review that sidecar workflow text disallows rebase, force-push, and
  history-rewriting updates;
- simulation or manual review showing local cleanup remains ineligible after an
  individual child PR merge and becomes eligible only after the final
  coordinator PR has merged into `main`;
- review that remote branch deletion, remote pruning, and remote cleanup require
  explicit user approval;
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
- simulation of resume after one child PR has merged into the coordinator
  branch, one active child branch/worktree needs refresh, and one child issue
  remains blocked;
- simulation of refreshing an active child branch/worktree from the coordinator
  branch using fast-forward or a normal merge, with affected validation marked
  stale or rerun;
- simulation or manual review showing local cleanup is eligible only after the
  final coordinator PR has merged into `main` and only for sidecar-created local
  branches/worktrees;
- review that closed-child coordinator final passes use normal sequential state
  handling and do not use sidecar resumability state;
- review that commands and reviews are reported as passed, failed, skipped,
  timed out, interrupted, partial, stale, or not run;
- review that failed, timed-out, skipped, interrupted, partial, stale, and
  not-run validation is never summarized as passed;
- review that stale validation after coordinator branch updates or child branch
  refreshes blocks readiness until rerun or explicitly reported as stale;
- review that sidecar child PR readiness is ready only with fresh required
  validation, no unresolved child blocker, and approved sidecar PR target
  rules, and draft when required validation is failed, incomplete, stale, not
  run, or blocked;
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
  user approval in a future activated workflow that permits issue mutation;
- review that closed-child coordinator final passes do not use artifact
  preparation or sidecar Git rules;
- review that no required `parallel-ready` label is introduced;
- changed-file review proving the existing sequential implementation skill and
  existing coordinator/orchestration skill are unchanged;
- changed-file review proving no product code, real CatWorld sidecar worktrees,
  real CatWorld sidecar branches, real pull request operations, GitHub issue
  mutations, public comments, or unapproved remote cleanup are part of sidecar
  validation.
