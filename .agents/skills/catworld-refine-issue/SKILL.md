---
name: catworld-refine-issue
description: Refine one existing CatWorld GitHub issue from a fixed remote-repository snapshot into one or more implementation-ready issue definitions through repository reconnaissance and human-guided decisions. Use only when the user explicitly invokes issue refinement; do not route ordinary issue implementation or PR review here.
---

# CatWorld Refine Issue

Refine an existing CatWorld GitHub issue into authoritative implementation
contracts. Discover what the user should not need to remember about the current
repository, close decisions already determined there, and ask the user only for
material judgment that repository evidence cannot settle.

This skill is explicitly invoked. It refines issue definitions; it does not
implement them.

## Inputs and eligibility

Require one target CatWorld GitHub issue and accept an optional explicit remote
repository ref.

Before deep reconnaissance, confirm that the issue or current conversation
identifies all of the following well enough to direct investigation:

- the problem, need, or capability;
- the intended product outcome at a meaningful level; and
- the generally affected domain or surface.

Do not require a rigid Markdown template, complete behavior, implementation
constraints, issue slices, dependencies, validation, or every business decision.
If the intended capability itself cannot be identified without inventing scope,
stop before deep reconnaissance and request only the minimum product clarification
needed to establish the target.

## Execution boundary

Operate against remote GitHub repository and issue state. Do not require or
mutate a local checkout, local branch, worktree, Spec Kit cycle, implementation,
build, test run, or orchestration state. Do not delegate refinement to subagents.
The workflow must remain usable from any environment with suitable remote GitHub
access and must not depend on one ChatGPT product surface.

Repository and GitHub inspection is read-only until the user later authorizes
specific GitHub mutations. The target issue is the entry point, not a promise
that the refined scope will remain one issue.

## Fix the remote baseline

At the start of each refinement:

1. Use the repository ref explicitly supplied by the user; otherwise use `main`.
2. Resolve that remote ref to one exact commit SHA.
3. Record the baseline ref and SHA in the refinement working model.
4. Perform every repository read for this refinement against that fixed SHA.

Do not silently advance the baseline when the named ref moves, and do not restart
refinement merely because it moved. The user decides the implementation starting
point and whether to rerun refinement.

## Repository reconnaissance

Always inspect at the fixed baseline:

- the target GitHub issue;
- `AGENTS.md`;
- `.specify/memory/constitution.md`;
- `docs/ARCHITECTURE.md`; and
- current source, tests, and repository documentation materially related to the
  requested capability.

Use deep, semantically directed inspection. Conservatively inspect more relevant
context when doing so prevents avoidable rediscovery during implementation, but
do not perform an unrelated repository-wide audit. Do not impose arbitrary file,
directory, or dependency-hop limits. Expand while a materially relevant behavior,
reusable anchor, contract, integration boundary, established pattern, constraint,
or uncertainty remains unresolved. Stop when further inspection no longer answers
a question relevant to the requested capability.

### Reconstruct current behavior

For each materially affected workflow or surface, trace its real boundaries as
needed, including applicable routes and entry points, pages and components,
shared UI, state and interactions, frontend clients, API DTOs and endpoints,
backend-authoritative rules, refresh and error paths, localization, and
representative tests. Do not stop at the most obvious feature file when behavior
depends on another layer.

### Search actively for reusable anchors

When a requested mechanism could reasonably already exist, search the relevant
layer broadly enough to identify both the established implementation and any
competing current pattern. Depending on scope, this may include Material
interactions, dialogs, confirmation flows, pagination, selectors, localized
expected errors, refresh-after-mutation behavior, API paging, authorization,
locking, mapping, or persistence patterns.

Do not confine this search to the immediate feature directory when a shared or
cross-feature implementation may own the responsibility. Promote every material,
repository-determined reusable anchor into a positive final-issue constraint so
implementation does not rediscover it or introduce a parallel mechanism.

### Use tests and history proportionally

Inspect materially relevant existing tests when they clarify invariants, edge
cases, expected errors, regression protection, shared abstractions, or behavior
not explicit in production sources. Tests are evidence, not automatically
authoritative when they conflict with the fixed-baseline implementation,
architecture, constitution, or an approved current decision. Do not scan
unrelated suites by default.

Treat fixed-baseline code and current source-of-truth documentation as primary
evidence. Inspect the target issue's references and selectively relevant issues
or final pull requests only when history clarifies why a current contract exists,
whether an assumption is stale, or which conflicting pattern is intended. Prefer
the final integrated pull request or current code over intermediate commits.
Stop when more history would not change the current-state model, constraint,
stale-assumption assessment, or pending decision.

## Maintain the refinement model

Before asking questions, build an internal working model containing:

- baseline ref and SHA;
- current affected behavior and implementation surfaces;
- reusable anchors, authoritative contracts, invariants, patterns, and conventions;
- target-issue assumptions classified where useful as valid, implemented,
  partially implemented, stale, contradicted, or uncertain;
- repository-determined implementation constraints;
- possible product-capability boundaries and implementation units;
- unresolved material decisions; and
- remaining evidence gaps or uncertainty.

This model guides refinement; do not copy it wholesale into the final issue.

## Classify every conclusion

Use exactly these three semantic categories internally.

### Repository-determined

Close a conclusion automatically only when fixed-baseline evidence is sufficiently
unambiguous through an authoritative source, an abstraction clearly intended for
the responsibility, a consolidated current pattern, or equivalent strong evidence
without a conflicting authoritative pattern.

Before closing it, establish what mechanism or contract exists, why it applies,
why reuse or preservation is correct, and whether a material conflict exists.
Do not manufacture certainty. Promote material conclusions into authoritative
final-issue constraints whenever omission would return a resolved decision to
implementation.

### Human decision required

Require the user to decide materially discretionary product behavior, business
rules, scope or issue boundaries, meaningfully different UX alternatives,
authorization or security behavior, significant architecture or persistence,
replacement of an established pattern, contradictory authoritative sources, or
an important choice with insufficient evidence.

Provide the current-state context, meaningful alternatives, and consequences
needed to decide without reconstructing the repository. Recommend an option when
evidence favors it, but do not convert a human choice into an automatic conclusion.

### Local implementation freedom

Leave purely local choices to implementation when multiple equivalent options
satisfy the approved product contract, architecture, reuse constraints, and issue
boundaries without materially affecting behavior, maintainability, or integration
contracts. Do not over-investigate or ask the user to decide them.

## Run interactive decision rounds

After initial reconnaissance, present a concise stable summary with exactly these
user-facing groups:

- `Determined by repository`: short titles for material conclusions already closed.
- `Human decisions required`: each unresolved material decision with relevant
  current-state context, alternatives, and consequences.

Do not produce a long reconnaissance report unless requested. Apply the user's
answers to the model, inspect targeted additional evidence when an answer creates
a new material question, and repeat decision rounds until no human decision
remains. Do not ask the user to decide what adequate repository inspection should
have settled.

## Convert decisions into issue contracts

The conversation retains deliberation; final issues retain decisions. Exclude
discarded alternatives, conversational reasoning, investigation narrative, and
speculative local implementation detail.

State authoritatively what behavior must exist, what existing contract remains
authoritative, what mechanism must be reused or extended, what parallel mechanism
must not be introduced when material, and what boundaries apply. Include the
minimum technical reason needed to identify the responsibility correctly rather
than issuing context-free commands. Once repository-determined or human-approved,
a material decision is no longer an implementation option.

### Refine issue boundaries first

Determine final issue boundaries from product-capability identity before
implementation dependencies:

- Distinct product capabilities remain distinct issues even when hard-dependent.
- Work completing the same capability normally remains one issue rather than
  splitting only for pull-request size, technical surface, or task count.
- Do not combine an entire release or unrelated capabilities merely because they
  can be ordered.
- When the input contains multiple capabilities or the correct boundary is
  materially ambiguous, resolve that boundary with the user.

Prepare one or more final issue definitions according to the approved result.

### Model implementation units inside each issue

After product scope is settled, model coherent implementation units:

- One unit produces an ordinary issue with no artificial `S1` section.
- Two or more units produce explicit implementation slices and hard dependencies.

Do not ask a separate ordinary-versus-sliced question; unit count determines the
shape. A slice is a coherent outcome, not an independent mini-spec or a file/task
group. For every slice, define its outcome, responsibilities, applicable decisions
and constraints, exclusions needed to avoid ownership confusion, and producer
obligations consumed by dependents.

Across slices, cover the complete issue scope, assign each responsibility
unambiguously, preserve feature-wide decisions, and declare only real hard
dependencies. A dependency exists only when a unit cannot correctly satisfy its
contract before the prerequisite result exists, not merely because files overlap,
concepts are shared, or one order is preferred. State every meaningful producer/
consumer contract. If proposed slices require extensive duplicated parity rules,
reconsider whether they are genuinely separate units.

For sliced output, use this exact Markdown structure:

```md
## Implementation slices

### S<number> — <title>

## Hard dependencies between slices
```

`Implementation slices` and `Hard dependencies between slices` are exact
level-two headings. Every slice declaration is an exact level-three heading in
the form `### S<number> — <title>`.

## Final issue content

Every proposed issue must perform these semantic functions; add issue-specific
subsections only when useful.

### Goal

State the product outcome concisely.

### Product contract

Define approved behavior sufficiently to prevent later implementation from
reopening product decisions. Include applicable states, transitions,
interactions, business rules, authoritative contracts, relationships, and errors.

### Implementation constraints and existing anchors

Always include this exact section. State each material repository-determined
mechanism to reuse, extend, or preserve, why it owns the relevant responsibility,
and any material prohibition on a parallel mechanism. If no feature-specific
anchor exists beyond global standards and architecture, say so explicitly.

### Implementation slices and hard dependencies, when applicable

Use the exact sliced headings and declarations above only for two or more units.
Keep feature-wide decisions above the slices, and assign outcome,
responsibilities, constraints, exclusions, and producer obligations within them.

### Done when

Define concrete whole-issue outcomes traceable to the Product contract and
implementation constraints. Criteria must be demonstrable and allocate cleanly
to slices or accumulated acceptance where applicable; avoid vague aspirations or
mere implementation procedure.

### Validation

Select proportionate evidence for material product obligations and repository
constraints: directed contract inspection, existing suites, focused permanent
coverage when justified, builds, specialized environments, or focused manual
checks. Do not add conventional commands without feature-specific value. Every
material anchor must have an acceptance or validation path able to detect if it
was ignored.

### External dependencies, when applicable

Separate other-issue or externally delivered dependencies from internal slice
dependencies. External hard dependency does not imply shared issue ownership.

### Out of scope

Record boundaries where implementation could reasonably expand beyond the
approved capability, without listing obviously unrelated repository areas.

## Reconcile the final draft

Perform one inexpensive comparison of the final draft with the collected working
model; do not restart reconnaissance. Verify that:

- each material conclusion is authoritative in the issue or intentionally local
  implementation freedom;
- no human decision remains unresolved;
- all repository-determined constraints are explicit and have acceptance or
  validation capable of detecting noncompliance;
- the complete approved product contract is present without invented behavior;
- issue boundaries match approved product capabilities;
- modeled units cover each issue completely and sliced ownership, shared
  constraints, dependencies, and producer/consumer contracts are unambiguous;
- the text records decisions rather than deliberation; and
- the result remains consistent with the fixed baseline.

If reconciliation finds one contradiction or missing evidence item, perform only
the targeted inspection needed to resolve it.

## GitHub mutation authority

Until a later user prompt explicitly authorizes a concrete mutation, do not
update, create, close, or reopen issues; change titles, bodies, labels, milestones,
or assignees; post comments; or perform any other repository-facing mutation.

Before requesting authority, present the complete proposed GitHub state for
review, including every proposed issue title and body and each recommended
metadata change. After authorization, perform only the exact mutations covered;
do not infer permission for additional creation, closure, metadata changes,
comments, or cleanup.

Keep generated GitHub issue and refinement prose in English. User-facing
refinement discussion may follow the conversation language.

## Completion

Report the fixed baseline ref and SHA, the proposed issue count, whether the
result is ordinary or sliced per issue, the complete proposed GitHub issue state,
and confirmation that no GitHub mutation occurred unless a later prompt
authorized and completed an exact mutation.
