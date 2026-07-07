# Research: Sidecar PR Target and Closure Rules

## Decision: Use existing sidecar workflow sources and GitHub Markdown templates

**Rationale**: Issue #230 is a workflow documentation and delivery-rules feature. Existing sidecar coordinator and child skills already own sidecar routing, Git state, and prohibited side effects, while `.github/PULL_REQUEST_TEMPLATE/` already contains the child-to-coordinator and final-coordinator templates introduced by issue #224. Extending those existing sources satisfies the issue without adding automation, dependencies, product code, or live GitHub mutation.

**Alternatives considered**:

- Add PR automation scripts. Rejected because opening real PRs, merging PRs, and product implementation are out of scope, and GitHub issue mutation requires explicit approval.
- Modify the normal sequential implementation skill. Rejected because issue #220 and issue #230 require normal sequential PR behavior to remain unchanged.
- Add a new dedicated sidecar PR skill now. Rejected as unnecessary for #230 because the existing sidecar coordinator/child skills and PR templates are sufficient source-of-truth locations; a later issue may split this if adoption proves the need.

## Decision: Treat GitHub mutation and remote cleanup as approval-gated side effects

**Rationale**: Issue #230 explicitly requires approval before Codex modifies issue bodies, checklists, labels, assignees, milestones, issue state, or public comments. It also requires explicit approval for remote branch deletion, remote pruning, and remote cleanup. This aligns with existing repository operation guardrails in `AGENTS.md` and sidecar Git rules from #229.

**Alternatives considered**:

- Permit mutation as part of child PR or final PR delivery. Rejected because #230 requires explicit user approval and child PRs must not close issues prematurely.
- Treat PR creation/update as implicit approval to mutate issue state or public comments. Rejected because issue mutation and public comments are separate side effects from PR description wording.

## Decision: Validate with local samples and text checks only

**Rationale**: The feature changes repository workflow text, PR template wording, and local Spec Kit artifacts. No backend, frontend, persistence, authorization, API, browser, or runtime behavior changes are in scope, so app test suites would not prove the changed behavior. Local sample PR descriptions, targeted text checks, manual issue review, changed-file review, and `git diff --check` directly verify the requested contract.

**Alternatives considered**:

- Run full backend/frontend test suites. Rejected as disproportionate for a documentation/workflow-only change with no runtime surfaces.
- Open real pull requests for validation. Rejected because #230 explicitly excludes opening real PRs.
