---
name: catworld-review-pr
description: Review a CatWorld GitHub pull request from remote evidence without mutating code or GitHub. Use when the user provides a CatWorld pull request URL, explicitly asks to review a PR number, or provides one bare GitHub number that remote lookup identifies as a pull request. Produce findings, a merge recommendation, and a bounded remediation brief when appropriate.
---

# CatWorld Review PR

Review one pull request against its linked issue, current CatWorld sources of
truth, and evidence tied to the current PR head. Keep the workflow read-only.

## Boundaries

- Inspect GitHub and repository state without changing the working tree,
  branches, commits, PR metadata, reviews, comments, issues, or merge state.
- Do not submit a GitHub approval, changes-requested review, or comment. A later
  explicit user request is required for every repository-facing write.
- Do not implement findings. Produce a remediation brief for a later execution
  only when the correction is bounded and needs no product or architecture
  decision.
- Review only the identified PR. Do not turn the task into a repository,
  release, or unrelated-code audit.
- Do not discover a PR implicitly from the current local branch in this MVP.
- Inspect draft, closed, or merged PRs only as historical/advisory reviews.
  Never recommend `Merge now` for an inactive or draft PR.
- Treat unavailable access, an unresolved target, or insufficient evidence as a
  blocker. Do not guess.

## Resolve the target

1. Accept a PR URL, an explicit request such as `review PR #123`, or one bare
   GitHub number that remote lookup identifies as a pull request.
2. For a bare number, query GitHub before selecting a workflow:
   - If the item is a pull request, continue with this skill.
   - If it is an ordinary issue, route to `catworld-implement-issue`.
   - If it does not exist or cannot be classified, stop and report the lookup
     blocker.
3. If several issue or PR references appear without one clear review target,
   stop and ask which PR to review.
4. Resolve the repository from the explicit URL or the current CatWorld remote.
   Do not silently review an item from another repository.

## Load review context

Read these sources before assessing the diff:

1. `AGENTS.md`.
2. `.specify/memory/constitution.md`.
3. `docs/ARCHITECTURE.md` as the implemented starting state, not an immutable
   restriction on an issue-approved change.
4. The complete PR title, body, base ref, head ref, base SHA, head SHA, author,
   state, and merge target.
5. Every issue explicitly linked by the PR. Treat the linked issue and any
   applicable committed feature artifacts as the scope and decision contract.
6. The complete diff and changed-file list.
7. Checks and workflow runs tied to the captured head SHA.
8. Existing formal reviews, inline review threads, and unresolved-thread state.

Prefer the connected GitHub tools. Fall back to authenticated `gh`, GitHub API
access, or read-only Git inspection only when connector coverage is
insufficient. Do not check out the PR branch or alter local refs merely to read
the change. If the available evidence cannot establish the current diff,
linked scope, or relevant check state, record the missing evidence and do not
recommend merging.

Capture the initial base and head SHAs in the review notes. Use full file
content at those SHAs when a patch hunk lacks enough surrounding context.

## Classify review depth

Classify before reviewing and increase depth only when evidence justifies it.

### Small

A focused diff with no migration, security or authorization change, protected
business-rule change, broad refactor, unclear shared contract, or suspicious CI
failure.

Review the linked goal, diff, changed files, checks, touched contract,
validation or error path, scope, and nearby established pattern.

### Medium

One complete feature slice or several related files with controlled scope.

Review issue fulfillment, affected flow, direct contracts, validation and error
handling, relevant business rules, tests, likely regressions, checks, and scope
boundaries. Inspect only surrounding code required to understand that flow.

### High risk

Use high-risk depth when the PR affects one or more of:

- stay, owner, cat, cancellation, or deletion business rules;
- authentication or authorization;
- JPA mappings, persistence behavior, or Flyway migrations;
- shared API contracts or global error handling;
- file storage, secrets, production configuration, or operational safety;
- broad refactors or many unrelated files.

Review the complete affected flow across contract, responsible service,
persistence, validation, authorization, error mapping, tests, CI, regressions,
maintainability, and readiness for `main`.

Escalate the selected depth when checks fail or cannot be verified, scope and
diff disagree, a request or response shape changes, endpoint behavior changes,
an entity or migration changes, an important error path is silent, a shared
component or service is restructured, or generated code introduces careless
repetition. Do not escalate because a generic checklist exists.

## Review the change

Evaluate:

- whether the PR fulfills the linked issue without silently expanding it;
- whether issue-approved product and technical decisions are preserved;
- whether the constitution is respected and its required validation evidence
  is present;
- whether controllers, services, repositories, DTOs, mappers, persistence, and
  frontend responsibilities match the current architecture or an explicitly
  approved change;
- whether backend and database authority protect business rules, authorization,
  validation, calculations, and persisted integrity;
- whether contracts, validation, error handling, migrations, and compatibility
  are correct for the affected flow;
- whether tests and other validation are proportional, relevant, current, and
  tied to the reviewed head;
- whether every changed surface belongs to the issue and PR intent;
- whether existing review threads or human change requests remain unresolved.

Do not require new permanent automated coverage merely because behavior is
observable, several consumers changed, or a regression is conceivable. Apply
the repository authorization rule: permanent coverage requires issue or
constitution authority, a material business-rule, invariant, authorization,
security, persistence, migration, shared-contract, external-contract, or
operational-safety effect, or explicit human approval after a decision stop.
Review findings and generated artifacts cannot authorize coverage by
themselves. Existing suites, compilation, builds, directed inspection, focused
review, or temporary/manual checks may be sufficient for ordinary low-risk
work.

Avoid speculative findings, style-only churn, and comments on unrelated code.
Do not duplicate an existing unresolved review observation unless independent
evidence or changed code materially alters it.

## Record findings

Present findings before the verdict, ordered by practical impact. For each
finding include:

- `Blocking` or `Non-blocking`;
- the tightest available `path:line` location;
- concrete evidence from the reviewed head;
- practical impact and triggering conditions;
- the minimum correction;
- whether it prevents merge.

Use inline code-review comments when the host supports them, while preserving
the same finding content in the final response. Do not emit an inline comment
for optional praise, broad summaries, or issues without a precise location.

If no material finding exists, state `No material issues found.` Do not invent
findings to fill the format. Keep optional observations short and clearly
non-blocking.

## Decide the verdict

Apply these outcomes consistently:

- No material issues and all relevant required checks are current and green:
  `Approved` and `Merge now`.
- A draft, closed, or already merged PR: `Comment only` and `Do not merge yet`.
  Record the actual PR state and keep any review advisory.
- No demonstrated code defect, but required checks are pending, stale, or
  unverifiable: `Comment only` and `Do not merge yet`.
- One or more bounded required corrections: `Changes requested` and `Merge
  after small fix`.
- A broken build, failed relevant CI, unfulfilled issue, incorrect contract,
  bypassed domain or authorization rule, missing important validation or error
  path, unsafe migration, clearly wrong layer, significant scope drift, or
  other unsafe state: `Changes requested` and `Do not merge yet`.
- An unresolved product, architecture, security, persistence, shared-contract,
  UX, correctness-sensitive, operational, or scope decision: `Comment only`
  and `Do not merge yet`. State the required human decision without choosing
  it.
- An unresolved human changes-requested review or material review thread:
  `Comment only` and `Do not merge yet` when the underlying defect is no longer
  demonstrable; otherwise use the applicable changes-requested outcome.

Do not block for one isolated nit unless it materially affects correctness,
automation, readability, or a recurring repository rule. Approval here is an
advisory review result, not a formal GitHub approval.

## Prepare remediation

Generate an English remediation brief only when all required corrections are
bounded, implementable on the existing PR branch, and require no new human
decision. Include:

- repository, PR number, branch, reviewed head SHA, and linked issue;
- accepted behavior and current PR intent;
- each finding to correct and its evidence;
- explicit out-of-scope boundaries;
- applicable constitution and architecture fit;
- the smallest diff plan;
- validation selected under the permanent-test authorization rule;
- required final report: summary, files changed, commands and results, and
  remaining risks.

State that the later execution must re-read the live PR and verify that its head
still matches or deliberately supersedes the reviewed SHA. It must use
follow-up commits on the PR branch, never write to `main`, rewrite history,
merge, post public comments, or expand scope. The brief is an instruction, not
authorization to execute or publish changes.

Use `No remediation brief needed.` when the PR is approved, the only blocker is
pending evidence, the finding is optional, or a human decision is required.

## Recheck freshness

Immediately before the verdict:

1. Re-fetch PR metadata and the current head SHA.
2. Re-fetch relevant check and unresolved-thread state when either may have
   changed during the review.
3. If the head differs from the captured head, discard the stale verdict and
   restart against the new head when feasible. Otherwise report the review as
   stale and do not recommend merging.
4. Identify any check, review, or manual evidence not tied to the final head as
   stale or not verified rather than passed.

## Output

Write review content and repository-facing wording in English. Use this exact
verdict contract after the findings:

```text
Review result:
Approved / Changes requested / Comment only

Merge decision:
Merge now / Merge after small fix / Do not merge yet

Reason:
[Short reason]

Reviewer notes:
[Captured base/head SHAs, concise evidence, and unverified aspects]

Codex remediation brief:
[Bounded English brief or "No remediation brief needed."]
```

For a correct small PR, keep the entire response brief. Report which remote
sources and checks were inspected, but do not narrate routine tool use.
