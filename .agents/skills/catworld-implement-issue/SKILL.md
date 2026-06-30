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

## Repository Boundaries

- May create and switch local branches for the active issue.
- Do not commit.
- Do not push.
- Do not create or modify pull requests.
- Do not modify GitHub issues.
- Do not merge.
- Do not write directly to `main`.
- Do not generate example feature directories.

## Branch Preparation

Fetch the issue title and labels read-only for branch naming, then prepare the
local branch before running Spec Kit:

1. Confirm the working tree is clean with `git status --porcelain`. If any
   output appears, abort and report the dirty paths.
2. Switch to `main` with `git switch main`. If `main` is unavailable, abort.
3. Pull `main` with `git pull --ff-only`. If the pull cannot fast-forward,
   abort.
4. Derive the target local branch name from the issue number, title, and labels:
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
5. Check whether `refs/heads/<branch>` already exists. If it exists and the
   user did not explicitly ask to reuse it, abort. If reuse was explicitly
   requested, switch to it without merging.
6. If the branch does not exist, create and switch to it with
   `git switch -c <branch>`.
7. Confirm the current branch is not `main` before running any Spec Kit command.

Examples:

- `chore/185-streamline-spec-kit-workflow`
- `feat/178-material-application-shell`
- `fix/201-stay-date-validation`
- `docs/210-update-operations-guide`

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
   - Stop when a product behavior, security, persistence, shared-contract,
     architecture, UX, or operational decision is unresolved.
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
15. Inspect local active-feature state before the final report:
    - If `AGENTS.md` changed only because of the `SPECKIT START` / `SPECKIT END`
      active plan pointer, restore that block to the `main` version.
    - Do not remove or rewrite permanent `AGENTS.md` instructions.
16. Report final status, commands executed, validation results, risks, git
    status and diff summary, suggested conventional commit title, and suggested
    pull request description.

## Stop Conditions

Stop and report the blocker when any of these occur:

- Working tree is dirty before branch preparation.
- `main` cannot be checked out or fast-forwarded.
- Target branch already exists without explicit reuse permission.
- Spec, plan, or tasks conflict with the issue or constitution.
- A new human decision is required and not already approved.
- The plan selects a materially different approach from the approved issue or a
  still-applicable prior approved plan.
- Generated artifacts conflict in a way that is not safely mechanical to fix.
- Validation fails and cannot be fixed without changing approved scope.

## Completion Report

Use the CatWorld `AGENTS.md` completion format:

1. Concise summary of implemented behavior.
2. Validation commands executed and their results.
3. Remaining risks, limitations, or unverified aspects.
4. One suggested conventional commit title.
5. One concise pull request description.

Include the final branch name, `git status --short`, and a concise diff summary.
Do not create the commit, push, pull request, issue update, or merge.

## Done When

- Local issue branch is prepared from an up-to-date `main`.
- Spec Kit artifacts are generated and checked against the issue and
  constitution.
- Implementation and convergence have run within the cycle limit.
- Required validations have run or any inability to run them is reported.
- Final status includes commands, validation, risks, diff summary, suggested
  commit title, and suggested pull request description.
- The `AGENTS.md` active plan pointer is restored before the final report when it was changed only as local workflow state.
