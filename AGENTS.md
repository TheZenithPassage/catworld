# CatWorld Agent Instructions

## Required Context

* Read `.specify/memory/constitution.md` before planning or implementing work.
* For end-to-end GitHub issue implementation requests, read and follow `.agents/skills/catworld-implement-issue/SKILL.md` before changing files.
* For feature work, treat the provided GitHub issue and the active feature artifacts under `specs/` as the scope and decision contract.
* Read `spec.md`, `plan.md`, and `tasks.md` when they exist and apply to the current task.
* If those artifacts conflict, contain unresolved blocking decisions, or require pending human approval, stop and report the blocker instead of implementing.

## Shorthand Issue Prompt Routing

When the user prompt identifies exactly one GitHub issue by bare number, issue
reference such as `#148`, or issue URL, treat it as an end-to-end CatWorld issue
implementation request and route it to
`.agents/skills/catworld-implement-issue/SKILL.md` after fetching and inspecting
the issue read-only.

* Additional wording such as `parallel` or `sequential` does not change this
  route or activate another implementation mode.
* If a prompt contains multiple issue numbers without a clear instruction, stop
  and ask which issue to implement.

## Repository Boundaries

* Work only from the current checked-out branch and working tree, except when following the local branch preparation defined by `.agents/skills/catworld-implement-issue/SKILL.md` for an end-to-end GitHub issue implementation request.
* Do not inspect, copy, or infer decisions from other branches, pull requests, or discarded implementations unless explicitly instructed.
* Keep changes focused on the active feature.
* Do not introduce unrelated refactors, speculative abstractions, or unrequested cleanup.

## Architecture Decisions

* Do not silently introduce or replace significant frameworks, libraries, architectural patterns, persistence strategies, shared infrastructure, or cross-cutting mechanisms.
* Follow the approach explicitly approved in the active feature plan.
* Minor local implementation details remain implementation freedom when they do not trigger the constitution's architecture and technology assessment.

## Validation

* Run the validation required by the active plan and tasks.
* Report the commands executed, their results, and anything that could not be verified.
* Do not claim that validation passed when it was not executed successfully.

## Repository Operations

* Codex may commit scoped changes, push the active issue branch with a normal non-force push, and create or update pull requests when the active CatWorld workflow allows delivery.
* Review fixes for an existing pull request should normally be delivered as new follow-up commits on the same PR branch, then pushed normally.
* Codex may fetch or inspect `main` when needed, but must not update local `main`, pull unrelated changes into `main`, or use `main` as a delivery branch unless the user explicitly requests a specific maintenance operation.
* Never commit directly on `main`, merge any branch into local `main`, push directly to `main`, merge a pull request, enable auto-merge, or approve Codex's own pull request.
* Never amend commits, rebase-push, force-push, use `--force` or `--force-with-lease`, or perform any history-rewriting remote update unless explicitly approved by the user.
* Do not delete local branches, delete remote branches, prune remotes, run branch cleanup, modify GitHub issues, or post public GitHub comments unless explicitly requested where applicable.

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
