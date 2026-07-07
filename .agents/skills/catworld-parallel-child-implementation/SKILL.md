---
name: "catworld-parallel-child-implementation"
description: "Implement one prepared CatWorld sidecar child issue from coordinator-provided artifacts without changing the existing sequential issue implementation workflow."
compatibility: "Requires the CatWorld repository, an explicit sidecar child handoff prepared by the sidecar coordinator workflow, and the sidecar workflow guardrails from issues #220-#229"
metadata:
  author: "catworld"
  source: "issues-228-229"
---

# CatWorld Parallel Child Implementation

Use this sidecar skill only for one child issue that has been handed off by an
approved sidecar coordinator parallel workflow after coordinator artifact
preparation has completed.

This skill consumes prepared child artifacts. It does not create its own
specification, plan, task list, shared contract, coordinator artifact, branch,
worktree, pull request, issue mutation, or routing decision. It consumes the
sidecar Git state prepared by the coordinator and refuses to run when the
current checkout does not match that prepared state.

## Routing Boundary

This skill is not the normal issue implementation workflow.

Use `.agents/skills/catworld-implement-issue/SKILL.md` instead for:

- normal implementable issues requested end-to-end;
- direct child issues requested end-to-end outside a coordinator `parallel`
  handoff;
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

## Required Handoff Inputs

Before any implementation work, the handoff must provide all of these inputs:

- child issue number, title, body, state, labels, dependencies, source
  references, validation requirements, and explicit out-of-scope boundaries;
- coordinator issue number, title, relevant coordinator context, child issue
  map, dependency layer, and coordinator source references;
- prepared child `spec.md` path and content summary;
- prepared child `plan.md` path and content summary, including architecture
  and technology assessment state, human approval source, validation evidence
  plan, and source map;
- prepared child `tasks.md` path and task set;
- shared contract references and constraints from the coordinator artifacts;
- dependency status showing this child is ready for implementation;
- target coordinator branch, including evidence that it was created from
  current `origin/main`;
- target child branch, including evidence that it starts from the coordinator
  branch and is not `main`;
- target child checkout/worktree path, isolated from every other active child
  checkout/worktree;
- intended child PR target branch, which must be the coordinator branch and not
  `main`;
- refresh status describing whether this child branch needs a normal merge from
  the coordinator branch after another child PR has been merged;
- cleanup eligibility status for the child branch and checkout/worktree;
- expected validation commands or manual evidence, including freshness
  requirements;
- final report and delivery boundaries provided by the coordinator and approved
  sidecar Git/PR rules.

If any required input is absent, incomplete, unreadable, contradictory, or not
applicable to exactly one child issue, stop before implementation and report a
blocker.

## Required Context

Before implementation, read:

- `AGENTS.md`;
- `.specify/memory/constitution.md`;
- `docs/ARCHITECTURE.md`;
- the full child issue body supplied by the handoff;
- the relevant coordinator issue context supplied by the handoff;
- the prepared child `spec.md`, `plan.md`, and `tasks.md`;
- the shared contract references supplied by the handoff;
- source-of-truth documentation named by the prepared artifacts.

Stop when required context cannot be read or when source-of-truth documents
conflict with the handoff, prepared artifacts, child issue, coordinator
context, or constitution.

## Handoff Validation

Validate the handoff before touching implementation files:

- The handoff identifies exactly one child issue.
- The child issue is dependency-ready according to the prepared dependency
  status.
- The target coordinator branch, child branch, child checkout/worktree, child
  PR target, refresh status, and cleanup eligibility context are present.
- The child branch starts from the coordinator branch and is not `main`.
- The child checkout/worktree is isolated from other active child
  checkouts/worktrees.
- The intended child PR target is the coordinator branch and not `main`.
- Any required refresh from the coordinator branch is a normal merge only.
- Prepared `spec.md`, `plan.md`, and `tasks.md` exist and refer to the same
  child issue scope.
- The prepared plan has no pending human approval, unresolved major decision,
  or material conflict with the child issue or coordinator context.
- The prepared tasks are scoped to the child issue and do not require missing
  shared contracts or unapproved child issues.
- The shared contract is present, consistent, and sufficient for the child
  scope.
- Required validation is explicit enough to rerun after relevant changes.

Do not repair missing planning artifacts by running `speckit-specify`,
`speckit-plan`, or `speckit-tasks`. Stop and return the blocker to the
coordinator or user.

## Implementation Workflow

When the handoff is valid:

1. Confirm the current checkout and worktree match the prepared target context.
   If they do not, stop. This skill must not invent, rename, or auto-recover
   branch/worktree context outside the coordinator handoff.
2. Treat the prepared child `spec.md`, `plan.md`, `tasks.md`, shared contract,
   and validation requirements as the implementation decision contract.
3. Execute only tasks from the prepared child `tasks.md`.
4. Keep implementation within the prepared child source map and out-of-scope
   boundaries.
5. Run the validation required by the prepared child plan, tasks, shared
   contract, and handoff.
6. Rerun affected validation after relevant late changes, or report it as
   `not revalidated` instead of passed.
7. Inspect changed files against the prepared child source map before final
   reporting.

This skill may implement product or workflow code only when the prepared child
tasks explicitly require it. It must not add product behavior, architecture,
persistence, authorization, APIs, frontend behavior, operations, or workflow
behavior outside the prepared child scope.

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

## Prohibited Side Effects

This skill must not:

- modify `.agents/skills/catworld-implement-issue/SKILL.md`;
- route normal issues or direct child issue end-to-end requests;
- route closed-child coordinator final passes;
- perform coordinator preflight or artifact preparation;
- create, switch, or rename sidecar branches or worktrees outside the prepared
  coordinator handoff;
- rebase, force-push, or perform history-rewriting updates for sidecar
  branches;
- push sidecar branches, open pull requests, update pull requests, delete
  remote branches, prune remotes, or perform remote cleanup unless later
  approved sidecar PR or cleanup rules permit the operation and explicit user
  approval exists where repository rules require it;
- delete local sidecar branches or worktrees after individual child PR merges;
- clean local sidecar branches or worktrees before the final coordinator PR has
  been merged into `main`;
- open, update, merge, approve, label, or enable auto-merge on pull requests;
- create, modify, close, label, assign, milestone, or comment on GitHub issues;
- target sidecar child pull requests directly at `main`;
- change CatWorld product code unless the prepared child tasks explicitly
  require that product change.

Issue #229 supplies the sidecar Git branch, worktree, refresh, and cleanup
rules. Later sidecar issues may add approved PR handling, state tracking,
adoption, or delivery rules. Until those rules are present in the handoff and
governing source-of-truth documents, stop before those operations.

## Stop Conditions

Stop and report a blocker when any of these occur:

- the request lacks a prepared sidecar child handoff;
- the handoff identifies zero, multiple, closed, or ambiguous child issues;
- a required handoff input is missing, incomplete, unreadable, or conflicting;
- required prepared artifacts are missing or conflict with each other;
- the prepared plan has pending human approval or unresolved material
  decisions;
- the child dependency status is unresolved, blocked, or contradicted by
  current source-of-truth context;
- shared contracts are missing, ambiguous, unsafe, or inconsistent;
- the target context is missing, the child branch targets `main`, or the child
  PR target is not the coordinator branch;
- the current checkout/worktree does not match the prepared child branch and
  checkout/worktree context;
- a required refresh would use rebase, force-push, history rewriting, or any
  method other than a normal merge from the coordinator branch;
- required validation is absent or impossible to run honestly;
- implementation would touch files outside the prepared child source map
  without an approved scope update;
- implementation would require branch orchestration, PR handling, GitHub issue
  mutation, or cleanup rules not present in approved sidecar source-of-truth
  documents.

## Validation Expectations

For each child implementation, validation must include:

- the commands, reviews, or manual evidence required by the prepared child
  artifacts and handoff;
- freshness status for every validation result;
- changed-file review against the prepared source map;
- confirmation that the child ran in the prepared child branch and isolated
  checkout/worktree from the coordinator handoff;
- confirmation that any required active-child refresh used a normal merge from
  the coordinator branch;
- confirmation that `.agents/skills/catworld-implement-issue/SKILL.md` was not
  modified by sidecar child execution;
- confirmation that normal sequential routing and closed-child coordinator
  final-pass routing were not changed by the child execution.

Validation for issue #228 itself must include one local sample child handoff,
text review of the sidecar child skill boundaries, changed-file review, and
confirmation that the normal implementation skill is untouched.

## Final Report

Report:

- child issue number and coordinator issue number;
- coordinator branch, child branch, child PR target, and worktree context from
  the handoff;
- prepared artifacts consumed;
- tasks completed and any tasks left incomplete;
- changed-file summary compared with the prepared source map;
- validation commands or reviews with explicit statuses;
- blockers, unresolved decisions, or not-revalidated evidence;
- delivery status according to the handoff and later approved sidecar Git/PR
  rules.

Do not post public GitHub comments or mutate GitHub issues unless a later
approved sidecar workflow explicitly permits that operation and the user
explicitly requests it where repository rules require approval.
