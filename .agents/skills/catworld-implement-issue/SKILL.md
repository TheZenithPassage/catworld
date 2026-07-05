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

## Coordinator Issue Boundary

This skill implements one concrete CatWorld issue, including one concrete child
issue delegated by a coordinator workflow.

If the issue body clearly indicates a coordinator issue, do not prepare an issue
branch or implement the coordinator issue as one bundled PR by default. Load and
follow `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`
instead.

Fetch or read the issue body read-only before branch preparation when needed to
decide this boundary.

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

## Future Sub-Issue Compatibility

This skill does not implement full multi-agent orchestration, automatic
worktree management, or branch-to-branch integration between work branches.
However, do not word issue implementation rules in a way that blocks a future
explicitly designed principal-agent workflow.

- Coordinator issues may split work into sub-issues when dependencies and
  conflict risks are understood.
- Explicit coordinator issue orchestration belongs in
  `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- Hard-dependent sub-issues must not be parallelized blindly.
- Future sub-agents must inherit the same governing context as the principal
  agent, including repository instructions, Spec Kit artifacts, issue body,
  linked sub-issues, parent/coordinator issue, relevant documentation, and
  current `main`.
- Sub-agents are implementation executors, not product or architecture decision
  makers.
- When a sub-agent encounters ambiguity, missing context, conflict, or an
  unresolved decision, it must stop and report back instead of guessing.

## Workflow

Run this flow in order:

1. Read `AGENTS.md`, `.specify/memory/constitution.md`, and the full GitHub
   issue. Treat them as the scope and decision contract.
2. Run `speckit-specify` using the issue body as the feature description.
3. Validate the generated `spec.md` against the issue and constitution. Stop if
   it changes approved scope or leaves unresolved major decisions.
4. Run `speckit-plan`.
5. Inspect the plan decision state before continuing:
   - Continue when `Assessment required: No`.
   - Continue when the plan references a still-applicable prior human-approved
     decision and explains why it applies.
   - Stop when `Assessment required: Yes` and `Human approval` is pending.
   - Stop when the selected approach materially changes from the approved issue
     or a prior approved plan.
   - Stop when a product behavior, security, authorization, persistence,
     shared-contract, architecture, UX, correctness-sensitive, or operational decision is unresolved.
6. Run `speckit-tasks`.
7. Run `speckit-analyze`.
8. If it reports inconsistencies, resolve only safe mechanical artifact inconsistencies before implementation,
   such as broken references, inconsistent names, missing checklist status, or
   task/spec wording drift that does not change approved scope, and rerun `speckit-analyze`. Stop when a
   conflict cannot be mechanically reconciled without changing approved scope or if material inconsistencies remain.
9. Run `speckit-implement`.
10. Run `speckit-converge`.
11. If converge appends tasks, run `speckit-implement` again and then
    `speckit-converge` again.
12. If converge appends tasks again, run at most one more
    `speckit-implement`/`speckit-converge` cycle.
13. Stop after at most two extra implement/converge cycles, even if more tasks
    remain, and report the remaining work.
14. Run all validations required by the issue, plan, and tasks.
15. Before treating validation as complete:
    - Rerun any validation command, test, review, browser-control session, manual smoke
      check, or other evidence affected by relevant changes made after that evidence
      was collected.
    - If affected evidence cannot be rerun, report it as `not revalidated` or `stale`
      instead of passed.
    - Report each check with an explicit status: `passed`, `failed`, `skipped`,
      `timed out`, `interrupted`, `partial`, `stale`, or `not revalidated`.
    - Do not summarize timed-out, skipped, interrupted, partial, stale, failed, or
      not-rerun validation as passed.
16. Inspect changed files and surfaces before the final report:
    - Use current working-tree information such as `git status --short` and
      `git diff --name-only` on the active branch only.
    - Compare changed paths with the issue, spec, plan, tasks, and source map.
    - Flag any file or surface changed outside the plan/source map for review or
      justification, especially late cleanup touching shared shell, global styles,
      shared components, routing, contracts, migrations, authorization, persistence,
      security, or other cross-cutting surfaces.
17. Inspect local active-feature state before the final report:
    - If `AGENTS.md` changed only because of the `SPECKIT START` / `SPECKIT END`
      active plan pointer, restore that block to the `main` version.
    - Do not remove or rewrite permanent `AGENTS.md` instructions.
18. If delivery operations are explicitly requested and the current branch is
    not `main`, commit the scoped changes with a conventional commit title,
    push the active issue branch to `origin` with a normal non-force push, and
    open or update a pull request targeting `main`.
    - If validation passes, open or update a ready pull request.
    - If validation is failed or incomplete but the branch is still useful for
      review, open or update a draft pull request only when the validation
      status is clearly reported.
    - For sub-issues, close only the implemented child issue and reference the
      parent/coordinator issue as related work. Do not close the coordinator
      issue unless it is explicitly complete.
    - Do not post public GitHub comments or modify GitHub issues unless the
      user explicitly requests those operations.
    - Returning the local checkout to `main` after PR delivery is not required.
19. Report final status, commands executed with explicit validation statuses,
    scope-drift review results, risks, git status and diff summary, branch
    name, commit hash or hashes, PR URL if opened, ready/draft PR status, and
    current local checkout branch. If delivery operations were not performed,
    include a suggested conventional commit title and suggested pull request
    description instead.

## Stop Conditions

Stop and report the blocker when any of these occur:

- Working tree is dirty before branch preparation.
- `origin/main` cannot be fetched or inspected for branch preparation.
- Target branch already exists without explicit reuse permission.
- Spec, plan, or tasks conflict with the issue or constitution.
- A new human decision is required and not already approved.
- The plan selects a materially different approach from the approved issue or a
  still-applicable prior approved plan.
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
- When delivery operations are explicitly requested, scoped changes have been
  committed on the active issue branch, the branch has been pushed normally, and
  a PR targeting `main` has been opened or updated without merging, enabling
  auto-merge, force-pushing, deleting branches, pruning remotes, mutating
  issues, or posting public comments.
- When delivery operations are not performed, final status includes commands,
  validation, risks, diff summary, suggested commit title, and suggested pull
  request description.
- The `AGENTS.md` active plan pointer is restored before the final report when it was changed only as local workflow state.
