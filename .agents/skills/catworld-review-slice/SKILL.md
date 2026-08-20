---
name: "catworld-review-slice"
description: "Internal-only read-only review of one bounded unpublished CatWorld slice candidate supplied by catworld-implement-parent. Never use as a direct user route."
metadata:
  author: "catworld"
  source: "issue-388"
---

# CatWorld Review Slice

Use this skill only when `catworld-implement-parent` supplies one complete,
bounded review handoff for an unpublished slice candidate that the parent marked
as requiring independent review. Review whether the concrete candidate is a
sound base for continued work in the sliced issue.

This skill is never a shorthand, direct user route, ordinary issue workflow,
slice implementation workflow, qualification replacement or pull-request
review. If the invocation does not come from the parent gate, return
`blocked-insufficient-surface` without widening the request or reconstructing
the parent issue. Handle a precise recoverable defect in a parent-supplied
bounded handoff through the pre-result refresh contract below.

## Independence and read-only boundary

The reviewer is strictly read-only.

- Never create, edit, patch, format, move or delete a file.
- Never modify local review notes, including
  `local-notes/review-findings/issue-<number>.md`.
- Never create, switch, reset, rebase, merge or delete a branch or worktree.
- Never create, amend, rewrite, cherry-pick or otherwise modify a commit.
- Never stage changes or modify an index, ref, stash, tag or remote-tracking ref.
- Never push, open/update/merge/approve a pull request, modify a GitHub issue,
  post a comment or perform any other GitHub write.
- Never run a formatter, build, test, validation or other command that writes
  generated files, caches, reports, dependency state or repository metadata.
- Never delegate, spawn another agent or ask another agent to inspect part of
  the candidate.
- Never implement a finding or propose unrelated cleanup.

Read repository files and Git objects only as required by the supplied surface.
Use observational commands such as `git status --short`, `git rev-parse`,
`git diff`, `git show`, `rg` and file reads when they are read-only in the active
environment. If evidence cannot be obtained without a write or unsafe command,
report that limitation and remaining uncertainty; do not perform the write.

Every fresh invocation must have no inherited parent conversation or history
and must receive no model, reasoning-effort or token-budget override. The
runtime therefore preserves the parent task's effective reasoning effort while
isolating its history. Never apply or infer the slice-worker reasoning policy.
A resumed reviewer keeps its existing thread and configuration.

## Required bounded handoff

Require all of these fields:

1. Parent issue number/title and slice ID/title.
2. Concise review objective and every reason the parent selected review.
3. Assigned responsibilities and source ownership.
4. Relevant approved decisions and invariants.
5. Incoming prerequisite expectations and producer-owned outgoing contracts.
6. Exact qualification base SHA and candidate head SHA.
7. Exact changed-file list and complete base-to-head candidate diff.
8. Available validation evidence with explicit status and freshness.
9. Relevant permanent-test authorization and ceiling.
10. Initial review surface and explicitly prohibited surface.

The handoff must not include the complete parent issue, complete `spec.md`,
complete `plan.md`, complete `tasks.md`, parent conversation, qualification
findings or unrelated slice context by default. Do not fetch or reconstruct
those excluded inputs. A bounded excerpt is usable only when the handoff
identifies why that exact excerpt is necessary for the assigned responsibility.

If a required field is absent, candidate identity is inconsistent or the
supplied diff is incomplete, use `review-input-refresh-required` only when the
exact deficiency is deterministic and a bounded parent correction or recapture
can supply reliable input without changing scope. If prohibited broad context
is necessary, the candidate state is unreliable, a refresh would expand scope
or require a material decision, or the handoff otherwise cannot support an
adequate bounded review, return `blocked-insufficient-surface`.

## Establish the exact candidate

Before substantive review, verify read-only that:

- both supplied Git object SHAs exist;
- the candidate head descends from the qualification base;
- the inspected base-to-head changed-file set and diff match the handoff;
- the candidate worktree/branch, if supplied as a comparison anchor, still
  resolves to the candidate head without requiring a checkout or ref update;
  and
- available validation evidence is tied to the latest candidate change or is
  explicitly marked with a non-passing freshness status.

Do not silently review a different local head, current working tree, rebased
candidate or partial diff. Return `review-input-refresh-required` for a precise
stale or mismatched captured identity that the parent can safely recapture from
reliable bounded state. Return `blocked-insufficient-surface` when the mismatch
shows that candidate or repository state is unreliable or cannot be repaired
without broader exploration, expanded scope or a material decision.

## Recoverable review-input refresh

`review-input-refresh-required` is a pre-result lifecycle response, not one of
the four final review states and not a finding classification. Use it only for:

- one or more precisely named missing required handoff fields;
- stale or mismatched captured qualification-base, candidate-head,
  changed-file or complete-diff evidence; or
- another deterministic review-input defect with one bounded parent-owned
  correction or recapture inside the unchanged review scope.

Return this shape and stop the current attempt without substantive review:

```text
review-input-refresh-required
parent issue: <number — title>
slice: <ID — title>
supplied candidate: <qualification-base-sha>..<candidate-head-sha>
input deficiency: <exact missing, stale or mismatched input>
bounded parent refresh: <minimum field correction or candidate recapture>
inspected input evidence: <read-only evidence establishing the deficiency>
```

Do not locate missing context independently, substitute another candidate,
expand the review surface, mutate state or retry yourself. The parent decides
whether the deficiency is safely recoverable. Before retry it must verify that
the slice worker is inactive, candidate and repository state remain reliable,
and the refresh does not alter responsibility, ownership, approved decisions,
invariants, exclusions or the permanent-test ceiling. The parent then
invalidates the incomplete gate attempt, corrects or recaptures the bounded
input, and restarts qualification and review concurrently against the same
refreshed candidate identity.

If those conditions cannot be met, adequate review requires broad or unbounded
exploration, candidate state is unreliable, scope would expand, or a material
decision is required, return the terminal `blocked-insufficient-surface` final
state instead. A repeated deterministic deficiency without concrete progress
is also terminal rather than an invitation to keep retrying.

## Review surface

The initial surface must identify:

- slice-owned changed code and documentation;
- contracts the slice consumes or produces;
- integration boundaries with already integrated prerequisites and declared
  dependents;
- useful base-version, architecture or established-pattern comparison anchors;
  and
- unrelated paths, worktrees, branches and sibling implementations that are
  prohibited.

Start there. The reviewer may inspect an additional file or symbol only for one
concrete review question. Before inspecting it, record in the response's
surface-expansion ledger:

1. the exact reviewed behavior or potential finding being evaluated; and
2. the direct semantic relationship from the current review surface to the new
   target.

Stop expanding as soon as that question is resolved. There is no arbitrary
file-count or dependency-depth limit, but this does not authorize broad
exploration. Do not perform a repository-wide audit, trace speculative
dependencies, inspect unrelated worktrees/branches or inspect any unintegrated
sibling implementation. If adequate review would require broad or unbounded
exploration, return `blocked-insufficient-surface` instead of expanding further.

## Architectural reference

Use `docs/ARCHITECTURE.md` from the qualification base as the implemented
architectural reference. Read that exact base version from Git rather than a
different worktree state. When the candidate modifies `docs/ARCHITECTURE.md`,
review its change as ordinary candidate diff content. Candidate-authored
documentation is not evidence that the implementation it describes is already
architecturally sound.

Apply `AGENTS.md` and the repository constitution as runtime/repository rules,
but do not use them to expand into a whole-issue audit. The bounded handoff
supplies the approved slice decisions and invariants relevant to the review.

## Review the candidate

Assess only material concerns that determine whether this candidate is a sound
base for continued sliced implementation:

- fit with materially relevant established architecture and repository patterns;
- correct and supported framework, library and API use;
- compliance with incoming expectations and producer-owned outgoing contracts;
- preservation of relevant approved decisions, business rules and protected
  invariants;
- error handling and failure semantics at the changed boundary;
- unsafe assumptions about ordering, state, concurrency, identity, nullability,
  persistence, authorization or integration context;
- harmful duplication that can diverge or propagate through dependent slices;
- maintainability concerns likely to spread into dependent work or materially
  increase rework inside the current issue;
- changed permanent coverage that violates the supplied authorization/value
  ceiling; and
- whether reported validation actually supports the candidate and remains
  fresh after its latest change.

Do not seek stylistic perfection. Do not block for naming preferences, optional
refactors, speculative hardening, unrelated pre-existing defects or cleanup
that can safely wait without affecting correctness, contracts or downstream
work.

## Observational validation

Run only the smallest read-only observation needed to verify a concrete review
question. Record every command/check and one explicit result status: `passed`,
`failed`, `skipped`, `timed out`, `interrupted`, `partial`, `stale` or
`not revalidated`. When a concrete question requires observational validation,
only fresh `passed` evidence resolves that question in support of a clean
conclusion.

Do not rerun a supplied build or test when doing so would write. Treat supplied
parent/worker evidence as evidence to assess, not automatic proof. When a
concrete question requires write-producing validation, report what could not be
obtained safely, its impact and the remaining uncertainty for parent
classification.

## Findings and parent classification

Recommend each finding as exactly one of:

- `must-fix-before-integration`: leaving it unresolved can cause incorrect
  behavior, violate a contract or invariant, make downstream slices build on an
  incorrect foundation, propagate the defect or materially increase rework
  inside the current issue; or
- `deferred`: the candidate remains safe for continued implementation and the
  improvement can be addressed later without materially affecting correctness,
  contracts or downstream work.

The parent owns final classification. Do not describe a recommendation as a
parent decision.

For every finding return:

- the tightest available file/heading/symbol/line location;
- the concrete finding;
- supporting candidate or validation evidence;
- practical impact; and
- the minimum bounded correction for `must-fix-before-integration`, or the
  reason deferral is safe for `deferred`.

## Exact result contract

After the bounded handoff and candidate input have been verified, return exactly
one final state:

- `clean` — no material finding;
- `must-fix` — one or more findings are recommended
  `must-fix-before-integration` (deferred findings may also be present);
- `deferred-only` — findings exist, every finding is `deferred`, and the
  candidate is safe for continued implementation; or
- `blocked-insufficient-surface` — the supplied and semantically justifiable
  surface cannot support an adequate bounded review.

Use this output shape exactly:

```text
state: <clean|must-fix|deferred-only|blocked-insufficient-surface>
parent issue: <number — title>
slice: <ID — title>
candidate: <qualification-base-sha>..<candidate-head-sha>

findings:
- classification: <must-fix-before-integration|deferred>
  location: <tightest location>
  finding: <concrete finding>
  evidence: <supporting evidence>
  impact: <practical impact>
  minimum correction: <bounded correction> # must-fix only
  deferral reason: <why safe>               # deferred only
# or: none

inspected surface:
- <file, symbol, contract, boundary or anchor>

surface expansions:
- question: <exact behavior or potential finding>
  relationship: <direct semantic relationship>
  target: <additional file or symbol>
# or: none

observational validation:
- check: <command or read-only check>
  status: <explicit status>
  result: <concise evidence>
# or: none

remaining uncertainty:
- <uncertainty and consequence>
# or: none
```

State consistency is mandatory: `clean` has no findings; `must-fix` has at
least one must-fix recommendation; `deferred-only` has at least one finding and
all are deferred; `blocked-insufficient-surface` explains in remaining
uncertainty why a bounded parent refresh cannot make the review adequate without
broad or unbounded exploration, unreliable candidate state, scope expansion or
a material decision. A recoverable deterministic input deficiency uses the
separate pre-result refresh response and never this final state.

## Corrections and deferred findings

Never send findings directly to the implementation worker and never fix them.
The parent waits for qualification and review, verifies both, owns final
classification and produces one consolidated correction handoff when needed.
It translates all parent-classified must-fix items into the unchanged worker's
existing `pre-integration correction` contract as one precise consolidated
qualification finding. Review origin may remain parent-owned traceability
metadata, but this reviewer result does not define a new worker correction kind
or require the worker to understand reviewer-specific vocabulary.

When the parent refreshes review after correction, evaluate the complete new
base/head/diff candidate, not only the previous finding. A resumed reviewer may
retain its thread/configuration; a fresh reviewer receives only the new bounded
handoff without prior narrative. Previous review evidence does not authorize a
clean result for a changed candidate.

Deferred findings never trigger reviewer action. The reviewer never writes
local notes; only the parent may attempt the optional excluded local note, and a
note-write failure is not a review failure.

## Done when

- The exact candidate and bounded handoff are verified read-only.
- The inspected surface remains bounded, and every expansion records its
  concrete question and direct semantic relationship.
- Material soundness, contract, error-handling, assumption, duplication and
  propagation risks are assessed without style-only blocking.
- Observational validation and remaining uncertainty are explicit.
- Exactly one valid result state and the complete output contract are returned.
- No repository, Git, GitHub, worktree, commit, ref or local-note mutation and
  no delegation occurred.
