# CatWorld Agent Instructions

## Required Context

* Read `.specify/memory/constitution.md` before planning or implementing work.
* For feature work, treat the provided GitHub issue and the active feature artifacts under `specs/` as the scope and decision contract.
* Read `spec.md`, `plan.md`, and `tasks.md` when they exist and apply to the current task.
* If those artifacts conflict, contain unresolved blocking decisions, or require pending human approval, stop and report the blocker instead of implementing.

## Repository Boundaries

* Work only from the current checked-out branch and working tree.
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

* Do not commit, amend commits, push branches, create or modify pull requests or issues, merge changes, or post public comments unless explicitly instructed.
* Never write directly to `main`.

## Language and Documentation

* Use English for code, public repository documentation, issues, pull requests, review text, commit titles, and suggested repository metadata.
* Follow the existing internationalization system for user-facing application copy.
* Update relevant source-of-truth documentation when implemented behavior, architecture, contracts, or operations change.

## Completion Output

After completing an implementation, provide:

1. A concise summary of the implemented behavior.
2. The validation commands executed and their results.
3. Any remaining risks, limitations, or unverified aspects.
4. One suggested conventional commit title.
5. One concise pull request description.

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
* do not create the commit or pull request unless explicitly instructed.
