# CatWorld Agent Instructions

## Required Context

* Read `.specify/memory/constitution.md` before planning or implementing work.
* Before running Spec Kit for a GitHub issue, also read
  `docs/ARCHITECTURE.md`.
* Treat `docs/ARCHITECTURE.md` as the implemented starting state and default
  implementation context, not as an immutable restriction on approved future
  changes.
* For end-to-end GitHub issue implementation requests, read and follow `.agents/skills/catworld-implement-issue/SKILL.md` before changing files.
* For pull request review requests, read and follow
  `.agents/skills/catworld-review-pr/SKILL.md`. Reviews are read-only unless the
  user separately authorizes a specific repository-facing action.
* For feature work, treat the provided GitHub issue and the active feature artifacts under `specs/` as the scope and decision contract.
* Read `spec.md`, `plan.md`, and `tasks.md` when they exist and apply to the current task.
* If those artifacts conflict, contain unresolved blocking decisions, or require pending human approval, stop and report the blocker instead of implementing.

## Shorthand GitHub Prompt Routing

When the user prompt identifies exactly one GitHub item by bare number or
reference such as `#148`, fetch and classify it read-only before selecting a
workflow.

* If the item is a pull request, route it to
  `.agents/skills/catworld-review-pr/SKILL.md`.
* If the item is an ordinary issue, treat it as an end-to-end implementation
  request and route it to
  `.agents/skills/catworld-implement-issue/SKILL.md`.
* A pull request URL or explicit request such as `review PR #148` always routes
  to `catworld-review-pr`.
* An issue URL always routes to `catworld-implement-issue` after confirming that
  the remote item is not a pull request.
* If the item does not exist or cannot be classified reliably, stop and report
  the lookup blocker instead of guessing.
* If a prompt contains multiple issue or pull request references without a
  clear target, stop and ask which item to handle.
* Do not infer a review target from the current local branch in the review MVP;
  require a PR identifier or URL.
* Additional issue wording such as `parallel` or `sequential` does not activate
  another implementation mode.

## Feature Planning Routing

Use `.agents/skills/catworld-feature-planning/SKILL.md` when the user asks to
plan features for a CatWorld release, convert a feature description into an epic
and implementation issues, resume an existing feature plan, or publish an
approved feature plan. This route does not override numbered-issue
implementation routing or pull request review workflows.

## Repository Boundaries

* Work only from the current checked-out branch and working tree, except when following the local branch preparation defined by `.agents/skills/catworld-implement-issue/SKILL.md` for an end-to-end GitHub issue implementation request or performing the read-only inspection of a freshly fetched `origin/main` required by `.agents/skills/catworld-feature-planning/SKILL.md`. The feature-planning exception does not permit checking out or updating local `main`.
* Do not inspect, copy, or infer decisions from other branches, pull requests, or discarded implementations unless explicitly instructed.
* Keep changes focused on the active feature.
* Do not introduce unrelated refactors, speculative abstractions, or unrequested cleanup.

## Architecture Decisions

* Do not silently introduce or replace significant frameworks, libraries, architectural patterns, persistence strategies, shared infrastructure, or cross-cutting mechanisms.
* Follow the approach explicitly approved in the active feature plan.
* Minor local implementation details remain implementation freedom when they do not trigger the constitution's architecture and technology assessment.
* When the issue explicitly requires a material architectural change, the plan
  may implement that change within the approved issue scope.
* When the issue does not request a material architectural change and Codex
  concludes that one is necessary, stop and request a human decision instead
  of selecting the change independently.

## Validation

* Run the validation required by the active plan and tasks.
* Report the commands executed, their results, and anything that could not be verified.
* Do not claim that validation passed when it was not executed successfully.
* New permanent automated test coverage requires the issue to explicitly require new tests or TDD, the constitution to explicitly require tests for the affected behavior, a material effect on a business rule, protected invariant, authorization, security, persistence, Flyway migration, shared API or external contract, or operational safety, or human approval after a decision stop; ordinary low-risk changes default to zero new permanent test coverage.

## Repository Operations

* Codex may commit scoped changes, push the active issue branch with a normal non-force push, and create or update pull requests when the active CatWorld workflow allows delivery.
* Review fixes for an existing pull request should normally be delivered as new follow-up commits on the same PR branch, then pushed normally.
* Codex may fetch or inspect `main` when needed, but must not update local `main`, pull unrelated changes into `main`, or use `main` as a delivery branch unless the user explicitly requests a specific maintenance operation.
* Never commit directly on `main`, merge any branch into local `main`, push directly to `main`, merge a pull request, enable auto-merge, or approve Codex's own pull request.
* Never amend commits, rebase-push, force-push, use `--force` or `--force-with-lease`, or perform any history-rewriting remote update unless explicitly approved by the user.
* Do not delete local branches, delete remote branches, prune remotes, run branch cleanup, modify GitHub issues, or post public GitHub comments unless explicitly requested where applicable.
* Create pull requests as ready for review by default. Create a draft pull request only when the user explicitly requests draft status.

## Language and Documentation

* Use English for code, public repository documentation, issues, pull requests, review text, commit titles, and suggested repository metadata.
* Follow the existing internationalization system for user-facing application copy.
* Update relevant source-of-truth documentation when implemented behavior, architecture, contracts, or operations change.

## Completion Output

After completing an implementation, provide:

1. A concise summary of the implemented behavior.
2. The validation commands executed and their results.
3. Any remaining risks, limitations, or unverified aspects.
4. When delivery operations were performed: the branch name, commit hash or hashes, pull request URL, whether the PR is ready or draft, and the current local checkout branch.
5. When delivery operations were not performed: one suggested conventional commit title and one concise pull request description.

The suggested commit(s) title(s) MUST:

* follow the repository's conventional style, such as `feat(frontend): ...`, `fix(backend): ...`, `docs: ...`, or `test(frontend): ...`;
* describe the primary delivered change;
* remain short and avoid listing secondary details.

Use this pull request description format:

```md
Closes #<issue-number>

Adds <one-sentence summary of the delivered result>.

Changes:
- <important change>
- <important change>

Validation:
- `<command>`
- `<command>`
```

Keep the pull request description focused:

* include only the main behavior, relevant architectural or contract changes, and validation;
* do not repeat the full issue, specification, plan, task list, or file list;
* use `Related to #<issue-number>` instead of `Closes` when the pull request must not close the issue;
* omit empty or irrelevant sections;
* create or update the pull request only when delivery operations were explicitly requested; otherwise provide the description as a suggestion.
