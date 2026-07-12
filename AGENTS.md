# CatWorld Agent Instructions

## Required Context

* Read `.specify/memory/constitution.md` before planning or implementing work.
* Coordinator GitHub issues are not routed to a separate orchestration workflow by default. For end-to-end requests, use the routing guardrails below before entering the existing sequential implementation workflow.
* For end-to-end GitHub issue implementation requests, read and follow `.agents/skills/catworld-implement-issue/SKILL.md` before changing files.
* For feature work, treat the provided GitHub issue and the active feature artifacts under `specs/` as the scope and decision contract.
* Read `spec.md`, `plan.md`, and `tasks.md` when they exist and apply to the current task.
* If those artifacts conflict, contain unresolved blocking decisions, or require pending human approval, stop and report the blocker instead of implementing.

## Shorthand Issue Prompt Routing

When the user prompt contains only one GitHub issue number or issue URL,
optionally followed by `parallel` or `sequential`, treat it as an end-to-end
CatWorld issue implementation request.

* Bare numbers such as `148`, issue references such as `#148`, and issue URLs
  route to issue implementation after Codex fetches and inspects the issue
  read-only.
* Normal implementable issues and direct child issues use
  `.agents/skills/catworld-implement-issue/SKILL.md`.
* Coordinator issues requested end-to-end without `parallel` must be inspected
  read-only for listed sub-issues before workflow selection. If any listed
  sub-issue is still open, stop with a routing error. If all listed sub-issues
  are closed, use `.agents/skills/catworld-implement-issue/SKILL.md` for the
  existing sequential end-to-end workflow as a final pass.
* The closed-sub-issue coordinator final pass is not a separate workflow and
  must not redo closed sub-issue scope.
* The `parallel` keyword is reserved for a clearly identified coordinator issue
  and must not route to legacy coordinator orchestration. Until #261 activates
  sidecar coordinator routing, stop with a routing error that sidecar parallel
  is not active, except for the one temporary #260-controlled fixture recorded
  as issue #272 (`https://github.com/TheZenithPassage/catworld/issues/272`) with
  run ID `sidecar-260-5522748a7cd34cc0b35d29b9c10fc8bb`. That exception is
  valid only while current GitHub evidence shows the exact issue body explicitly
  identifies itself as the sole controlled sidecar dry-run fixture authorized
  by #260 before #261 and all normal sidecar safety checks pass. A title, label,
  branch prefix, or private conversation is insufficient; missing, ambiguous,
  duplicated, stale, unsafe, or inconsistent evidence stops. After #261
  activates general routing, explicit eligible coordinator `parallel` requests
  route only to `.agents/skills/catworld-parallel-coordinator/SKILL.md`.
* If the issue is not a coordinator issue and the prompt includes `parallel`,
  stop with a routing error instead of ignoring the flag.
* The `sequential` keyword keeps normal implementable issues and direct child
  issues on the existing sequential workflow. For coordinator issues, apply the
  open-sub-issue and closed-sub-issue guardrails above.
* Never infer parallel mode from a bare issue number, issue reference, or issue
  URL.
* Issues #220 through #234 must not route through parallel mode; use the current
  sequential workflow guardrails only. This exclusion overrides the temporary
  #260 fixture exception.
* If a prompt contains multiple issue numbers without a clear instruction, stop
  and ask which issue to implement.
* If the issue cannot be classified as a normal implementable issue or a
  coordinator issue after reading it, stop and report the ambiguity.

## Repository Boundaries

* Work only from the current checked-out branch and working tree, except when following the local branch preparation defined by `.agents/skills/catworld-implement-issue/SKILL.md` for an end-to-end GitHub issue implementation request or the exact recorded branch/worktree operations of a routing-authorized sidecar run. Before #261, only the verified #272 fixture above can be routing-authorized this way.
* Do not inspect, copy, or infer decisions from other branches, pull requests, or discarded implementations unless explicitly instructed or required by the exact recorded control/runtime refs of a routing-authorized sidecar run.
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
