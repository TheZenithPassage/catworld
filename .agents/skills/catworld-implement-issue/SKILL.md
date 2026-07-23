---
name: "catworld-implement-issue"
description: "Orchestrate a CatWorld GitHub issue from clean local branch preparation through the existing Spec Kit specify, plan, tasks, analyze, implement, converge, validation, and final reporting workflow."
compatibility: "Requires the CatWorld repository, GitHub issue context, and the repo-local Spec Kit skills under .agents/skills"
metadata:
  author: "catworld"
  source: "issue-185"
---

# CatWorld Implement Issue

Use this orchestration skill for a complete CatWorld issue implementation from
one prompt. It coordinates existing Spec Kit skills; do not duplicate their
internal instructions. When a step says to run a Spec Kit skill, load and follow
that skill's `SKILL.md`.

## Required Inputs

- GitHub issue number or URL.
- Explicit permission from the user if reusing an existing local issue branch.

If the issue is ambiguous, stop and ask for the issue identifier.

## Shorthand Prompt Routing

When the user prompt identifies exactly one issue number, issue reference, or
issue URL, treat it as an end-to-end CatWorld issue implementation request.

- Fetch and inspect the issue read-only before branch preparation.
- Use this skill as the only repository implementation route; additional
  wording such as `parallel` or `sequential` does not select another mode.
- If a prompt contains multiple issue numbers without a clear instruction, stop
  and ask which issue to implement.

## Repository Boundaries

- May create and switch local branches for the active issue.
- May commit scoped implementation changes on the active issue branch after the required implementation and validation work is complete.
- May push the active issue branch to `origin` with a normal non-force push.
- May open a pull request targeting `main`, or update the existing pull request for the same active issue branch.
- May implement review fixes as new follow-up commits on the same PR branch, then push normally.
- Do not modify GitHub issues unless explicitly requested.
- Do not merge.
- Do not merge pull requests.
- Do not enable auto-merge.
- Do not approve Codex's own pull request.
- Do not write directly to `main`.
- Do not commit directly on `main`, merge any branch into local `main`, push directly to `main`, or use `main` as a delivery branch.
- Do not update local `main` or pull unrelated changes into `main` unless the user explicitly requests a specific maintenance operation.
- Do not use `git push --force`, `git push --force-with-lease`, rebase-push workflows, or any history-rewriting remote update unless the user explicitly requests it.
- Do not delete local branches, delete remote branches, prune remotes, run branch cleanup, or post public GitHub comments unless explicitly requested where applicable.
- Do not generate example feature directories.

## Branch Preparation

Fetch the issue title and labels read-only for branch naming, then prepare the
local branch before running Spec Kit. Branch preparation may fetch and inspect
`main`, but it must not update local `main` or use `main` as the delivery
branch.

1. Confirm the working tree is clean with `git status --porcelain`. If any
   output appears, abort and report the dirty paths.
2. Fetch the current remote main ref with `git fetch origin main`. If
   `origin/main` is unavailable after the fetch, abort.
3. Derive the target local branch name from the issue number, title, and labels:
   - Format: `<type>/<issue-number>-<short-description>`.
   - Infer `<type>` from the issue title prefix first, then labels. Recognize
     common conventional types such as `feat`, `fix`, `docs`, `test`, `chore`,
     `refactor`, `ci`, and `build`. Map labels like `bug` to `fix`,
     `feature` to `feat`, and `documentation` to `docs`.
   - If no clear type exists, use `chore`.
   - Build `<short-description>` from the issue title after removing type
     prefixes such as `[Chore]` or `feat:`. Lowercase it, preserve meaningful
     technical terms, replace non-alphanumeric runs with hyphens, collapse
     repeated hyphens, and keep it concise.
4. Check whether `refs/heads/<branch>` already exists. If it exists and the
   user did not explicitly ask to reuse it, abort. If reuse was explicitly
   requested, switch to it without merging.
5. If the branch does not exist, create and switch to it from `origin/main` with
   `git switch -c <branch> origin/main`.
6. Confirm the current branch is not `main` before running any Spec Kit command
   or editing files.

Examples:

- `chore/185-streamline-spec-kit-workflow`
- `feat/178-material-application-shell`
- `fix/201-stay-date-validation`
- `docs/210-update-operations-guide`

## Workflow

Run this flow in order:

1. Read `AGENTS.md`.
2. Read `.specify/memory/constitution.md`.
3. Read `docs/ARCHITECTURE.md` as the implemented starting state and default
   implementation context, not as an immutable restriction.
4. Read the full GitHub issue. Treat the issue, repository instructions,
   constitution, and current architecture as the scope and decision context.
5. Run `speckit-specify` using the issue body and loaded repository context.
6. Validate the generated `spec.md` against the issue, constitution, and current
   architecture. Stop if it changes approved scope, conflicts with the
   documented starting state without an issue-approved change, or leaves
   unresolved major decisions.
7. Run `speckit-plan`.
8. Inspect the plan decision state before continuing:
   - Continue when `Assessment required: No`.
   - Continue when the plan references a still-applicable prior human-approved
     decision and explains why it applies.
   - Stop when `Assessment required: Yes` and `Human approval` is pending.
   - Stop when the selected approach materially changes from the approved issue
     or a prior approved plan.
   - Stop when a product behavior, security, authorization, persistence,
     shared-contract, architecture, UX, correctness-sensitive, or operational decision is unresolved.
9. Run `speckit-tasks`.
10. Run `speckit-analyze`.
11. If it reports inconsistencies or genuinely duplicate generated tasks,
   resolve only safe mechanical artifact inconsistencies and safe redundancy
   before implementation:
   - Consolidate tasks only when they repeat the same underlying implementation
     or evidence behavior. Preserve separate tasks when behavior, responsible
     layer, dependency, risk, or required proof is materially different.
   - Preserve explicit coverage for every requirement and all
     constitution-, specification-, plan-, contract-, matrix-, and risk-required
     evidence. A broader task may cover several related statements when that
     coverage is clear and adequate.
   - Treat the GitHub issue as the scope boundary. Repeated generated wording
     MUST NOT enlarge approved work during consolidation or remediation.
   - Safe mechanical fixes also include broken references, inconsistent names,
     missing checklist status, or task/spec wording drift that does not change
     approved scope.
   - Rerun `speckit-analyze` after any task or artifact edit and before
     `speckit-implement`.
   Stop when a conflict cannot be mechanically reconciled without changing
   approved scope or if material inconsistencies remain.
12. Run `speckit-implement`.
13. When an approved implementation materially changes documented architecture
    or implemented behavior recorded in `docs/ARCHITECTURE.md`, update that
    document as part of the implementation.
14. Run `speckit-converge`.
15. If converge appends tasks, run `speckit-implement` again and then
    `speckit-converge` again.
16. If converge appends tasks again, run at most one more
    `speckit-implement`/`speckit-converge` cycle.
17. Stop after at most two extra implement/converge cycles, even if more tasks
    remain, and report the remaining work.
18. Run all validations required by the issue, plan, and tasks.
19. Before treating validation as complete:
    - Rerun any validation command, test, review, browser-control session, manual smoke
      check, or other evidence affected by relevant changes made after that evidence
      was collected.
    - If affected evidence cannot be rerun, report it as `not revalidated` or `stale`
      instead of passed.
    - Report each check with an explicit status: `passed`, `failed`, `skipped`,
      `timed out`, `interrupted`, `partial`, `stale`, or `not revalidated`.
    - Do not summarize timed-out, skipped, interrupted, partial, stale, failed, or
      not-rerun validation as passed.
20. Inspect changed files and surfaces before the final report:
    - Use current working-tree information such as `git status --short` and
      `git diff --name-only` on the active branch only.
    - Compare changed paths with the issue, spec, plan, tasks, and source map.
    - Flag any file or surface changed outside the plan/source map for review or
      justification, especially late cleanup touching shared shell, global styles,
      shared components, routing, contracts, migrations, authorization, persistence,
      security, or other cross-cutting surfaces.
21. After implementation and required validation, if the current branch is not
    `main`, commit the scoped changes with a conventional commit title, push the
    active issue branch to `origin` with a normal non-force push, and open or
    update a pull request targeting `main`.
    - Skip commit, push, and pull request delivery only when the user explicitly
      asks for local-only or no-delivery execution, or when a stop condition
      prevents safe delivery.
    - If validation passes, open or update a ready pull request.
    - If validation is failed or incomplete but the branch is still useful for
      review, open or update a draft pull request only when the validation
      status is clearly reported.
    - Do not post public GitHub comments or modify GitHub issues unless the
      user explicitly requests those operations.
    - After the pull request is opened or updated successfully, switch the local
      checkout back to `main`. Do not pull, merge, rebase, prune remotes, delete
      branches, or otherwise update `main` unless the user explicitly requests
      that maintenance operation.
22. Report final status with:
    - concise summary;
    - validation commands executed and explicit statuses;
    - scope-drift review results;
    - remaining risks or unresolved questions;
    - `git status --short`;
    - concise diff summary;
    - branch name;
    - commit hash or hashes;
    - PR URL when delivery completed;
    - ready/draft PR status when a PR was opened or updated;
    - current local checkout branch;
    - confirmation that the checkout was switched back to `main` when delivery
      completed successfully.
    If delivery cannot be completed, or if the user explicitly requested
    local-only or no-delivery execution, include the blocker or reason, the
    current branch state, a suggested conventional commit title, and a suggested
    pull request description.

## Stop Conditions

Stop and report the blocker when any of these occur:

- Working tree is dirty before branch preparation.
- `origin/main` cannot be fetched or inspected for branch preparation.
- Target branch already exists without explicit reuse permission.
- Spec, plan, or tasks conflict with the issue or constitution.
- A new human decision is required and not already approved.
- The plan selects a materially different approach from the approved issue or a
  still-applicable prior approved plan.
- The issue does not request a material architectural change and implementation
  would require selecting one without a human decision.
- Generated artifacts conflict in a way that is not safely mechanical to fix.
- Validation fails and cannot be fixed without changing approved scope, unless
  delivery operations were explicitly requested and the branch is still useful
  for draft PR review with the failure clearly reported.
- Required validation is stale after relevant late changes and cannot be rerun or
  honestly reported within the approved scope.
- Changed files or surfaces outside the issue/spec/plan/tasks source map cannot be
  justified without changing approved scope.

## Completion Report

Use the CatWorld `AGENTS.md` completion format:

1. Concise summary of implemented behavior.
2. Validation commands executed and their results.
3. Remaining risks, limitations, or unverified aspects.
4. When delivery operations were performed: branch name, commit hash or hashes,
   PR URL, ready/draft PR status, and current local checkout branch.
5. When delivery operations were not performed: one suggested conventional
   commit title and one concise pull request description.

Include the final branch name, `git status --short`, a concise diff summary,
validation freshness status, and any scope-drift review findings. When delivery
operations were performed, include the commit hash or hashes, PR URL, ready or
draft PR status, and current local checkout branch. When delivery operations
were not performed, include the suggested commit title and pull request
description.

## Done When

- Local issue branch is prepared from current `origin/main` without using
  `main` as a delivery branch.
- Spec Kit artifacts are generated and checked against the issue and
  constitution.
- Implementation and convergence have run within the cycle limit.
- Required validations have run or any inability to run them is reported.
- Validation results are fresh after the latest relevant change, or stale/not-rerun
  checks are explicitly reported as not passed.
- Changed files have been reviewed against the issue/spec/plan/tasks source map.
- Normal issue delivery is complete when:
  - scoped changes have been committed on the active issue branch;
  - the branch has been pushed normally;
  - a PR targeting `main` has been opened or updated;
  - no merge, auto-merge, force-push, branch deletion, remote pruning, issue
    mutation, or public GitHub comment was performed.
- When delivery cannot be completed, final status includes:
  - commands and validation results;
  - risks and diff summary;
  - the blocker that prevented delivery;
  - suggested commit title;
  - suggested pull request description.
