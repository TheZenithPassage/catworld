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

## Permanent Automated Test Coverage Authorization

Determine whether new permanent automated test coverage is authorized from the
GitHub issue, the constitution, and the materially affected risk before
implementation. New permanent coverage means any committed, maintained test
change that adds or materially broadens coverage of the changed behavior. This
includes new test files, new scenarios, new parameterized cases, new assertions
or branches, fixtures or test helpers added to cover the change, and material
expansion of an existing scenario.

New permanent coverage is authorized without an additional human decision only
when at least one of these applies:

- The GitHub issue explicitly requires new tests or TDD.
- The constitution explicitly requires tests for the affected behavior.
- The change materially affects a business rule or protected invariant.
- The change materially affects authorization, security, persistence, a Flyway
  migration, a shared API or external contract, or operational safety.

### Permanent-Test Value Gate

Authorization only permits consideration of permanent coverage; it does not
make new tests mandatory. Every added or materially broadened permanent test
MUST provide concrete maintenance value.

Add or materially broaden permanent coverage only when all of these conditions
are satisfied:

- It protects a specific and realistic regression with meaningful practical
  impact.
- Existing coverage, compilation, build validation, directed inspection, or a
  focused manual check does not already provide adequate evidence.
- It is placed at the single responsible layer and does not duplicate the same
  behavior through controller, service, mapper, persistence, frontend, or other
  tests.
- It protects an observable contract, business rule, invariant, authorization
  boundary, destructive operation, monetary rule, concurrency guarantee,
  migration, or persisted-integrity risk rather than incidental implementation
  details.
- Its maintenance cost is proportionate to the likelihood and impact of the
  regression it prevents.

A changed DTO field, mapper, API response field, component, button, visual
state, layout, wording, ordinary bug fix, or additional consumer does not
independently justify new permanent coverage.

Generic issue wording such as `tests pass`, `relevant tests`, `frontend checks
pass`, or validation commands means that existing suites must be executed. It
does not authorize new permanent coverage.

When the active GitHub issue explicitly identifies permanent coverage, its
instructions are both authorization and a ceiling. Do not broaden that coverage
through risk classification, generated artifacts, analysis, or convergence
unless the constitution explicitly requires additional coverage.

If broader permanent coverage appears materially necessary but is not clearly
authorized, stop and request explicit human authorization instead of adding it.

When the value of a permanent test is unclear, do not add it.

For all other changes, the default is zero new permanent automated test
coverage. None of the following independently authorizes it:

- Visible or user-observable behavior.
- A bug that could theoretically regress.
- Multiple pages, files, fields, signals, states, or consumers.
- Acceptance scenarios, validation matrices, or semantic-equivalence review
  entries.
- A desire for exhaustive or defensive coverage.

The GitHub issue and constitution are authoritative. Generated specifications,
plans, matrices, tasks, analysis, and convergence output MUST NOT independently
authorize permanent coverage. Unauthorized permanent coverage MUST be removed.
Consolidation does not authorize it and MUST NOT allow several unauthorized
test tasks or changes to survive as one permanent test. If a generated task
mixes valid validation with unauthorized permanent coverage, rewrite it to
preserve only existing-suite execution, compilation, build, directed
inspection, focused review, or temporary/manual validation. Resolve generated
overreach this way instead of stopping for a human decision.

If an uncategorized change has exceptional material risk, complexity, or
regression cost that Codex believes warrants maintained coverage, stop and
request explicit human authorization before creating it. Codex MUST NOT
self-authorize through its own plan or risk assessment.

Minimal edits to existing tests are allowed without additional authorization
only when directly necessary to align an existing assertion with explicitly
approved behavior or to repair a test directly broken by the implementation,
without broadening what the test covers. Those edits MUST NOT add scenarios,
broaden coverage, or duplicate consumers under the guise of maintenance.

This gate does not reduce validation. Preserve tasks that run existing suites,
compilation, builds, directed inspection, focused review, or temporary/manual
checks, and preserve focused responsible-layer tests whenever they are
authorized and justified.

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
12. Apply the permanent automated test coverage authorization gate before
    `speckit-implement`:
    - Determine authorization from the GitHub issue, constitution, and
      materially affected risk using the rules above.
    - Inspect generated tasks for any committed test change that adds or
      materially broadens coverage of the changed behavior.
    - Remove unauthorized permanent-test work. Do not preserve it by
      consolidating several unauthorized tasks into one permanent test.
    - Rewrite any task that mixes valid validation with unauthorized permanent
      coverage so it retains only existing-suite execution, compilation, build,
      directed inspection, focused review, or temporary/manual validation.
    - Rerun `speckit-analyze` after any resulting artifact edit and resolve any
      safe mechanical inconsistency before continuing.
    - Do not stop merely because a generated artifact requested tests that the
      gate does not authorize.
13. Run `speckit-implement`.
14. When an approved implementation materially changes documented architecture
    or implemented behavior recorded in `docs/ARCHITECTURE.md`, update that
    document as part of the implementation.
15. After the initial implementation and any required architecture update,
    first wait for every earlier agent or subagent that was allowed to edit the
    working tree to finish. Confirm that no earlier editing agent remains active
    or can resume working-tree mutations, then always spawn exactly one fresh
    built-in `worker` subagent to own the entire convergence phase. Spawn it
    before any leader-run convergence assessment, even when the leader expects
    the implementation to be complete. The worker must not inherit the leader's
    conversation or implementation history.
16. Keep the worker handoff limited to the repository context needed to
    reconstruct the task independently:
    - Identify the active issue, active branch, and feature directory.
    - Fetch and read the complete active GitHub issue before applying the
      permanent-test authorization gate. Generated spec, plan, tasks, analysis,
      and convergence output may request or describe coverage, but cannot
      authorize it independently.
    - Direct the worker to read `AGENTS.md`,
      `.specify/memory/constitution.md`, `docs/ARCHITECTURE.md`, and the current
      feature `spec.md`, `plan.md`, and `tasks.md`.
    - Direct the worker to inspect the current working-tree state and complete
      active-branch diff, including working-tree changes.
    - Include the convergence duties and boundaries in step 18, but do not pass
      the leader's implementation narrative, internal reasoning, or any claim
      that the implementation is already correct.
17. Run the handoff sequentially. The leader must wait for the worker and must
    not edit the working tree while it is active. The worker is the only agent
    allowed to mutate the working tree during convergence and must not delegate,
    spawn, or hand off any working-tree mutation to another agent. The worker
    must not commit, push, open or update a pull request, switch branches,
    modify GitHub, post comments, or perform any other delivery operation.
18. Instruct the worker to run the bounded convergence phase:
    - Load and follow `speckit-converge`, starting with a convergence pass
      regardless of whether the leader expects remaining work.
    - After every convergence pass, apply the same permanent-test authorization
      gate to any appended or changed tasks before another implementation cycle
      or return to the leader. Remove unauthorized permanent-test work instead
      of preserving it through consolidation. Rewrite mixed tasks to retain only
      the permitted non-permanent validation, preserve authorized tests, and
      rerun `speckit-analyze` after any resulting artifact edit.
    - When authorized convergence tasks remain, load and run
      `speckit-implement`, then rerun `speckit-converge`.
    - Perform at most two corrective `speckit-implement`/`speckit-converge`
      cycles after the initial convergence pass. If authorized convergence
      tasks remain after the second corrective cycle, classify that state as a
      workflow stop, report the remaining tasks, and return without allowing
      normal ready delivery.
    - Return a concise report of remaining tasks, every changed surface, and
      validation evidence made stale by worker changes. Report any existing
      workflow stop condition or non-mechanical artifact conflict instead of
      performing delivery or expanding scope.
19. After the worker returns, the leader must inspect the resulting working
    tree, active-branch diff, tasks, remaining-work report, changed surfaces,
    and stale-evidence report. If the worker reported a stop condition,
    including authorized convergence tasks that remain after the cycle cap,
    apply the existing stop rules and do not continue to normal ready delivery.
    Otherwise, the leader resumes control for final validation, final test-diff
    and scope-drift reviews, delivery, checkout restoration, and completion
    reporting.
20. Run all validations required by the issue, plan, and tasks.
21. Before treating validation as complete:
    - Rerun any validation command, test, review, browser-control session, manual smoke
      check, or other evidence affected by relevant changes made after that evidence
      was collected.
    - If affected evidence cannot be rerun, report it as `not revalidated` or `stale`
      instead of passed.
    - Report each check with an explicit status: `passed`, `failed`, `skipped`,
      `timed out`, `interrupted`, `partial`, `stale`, or `not revalidated`.
    - Do not summarize timed-out, skipped, interrupted, partial, stale, failed, or
      not-rerun validation as passed.
22. Before delivery, inspect every added or modified test file in the complete
    active-branch diff, including working tree changes. Review every test change,
    including new files, scenarios, parameterized cases, assertions, branches,
    fixtures, test helpers, and material expansion of existing scenarios.
    Verify that each change is either authorized permanent coverage or minimal
    non-broadening maintenance under the rule above. Remove all unauthorized
    added or broadened coverage and rerun every selected validation affected by
    the removal. Do not infer authorization from the presence, location, or
    consolidation of a test change in the diff.
23. Inspect changed files and surfaces before the final report:
    - Use current working-tree information such as `git status --short` and
      `git diff --name-only` on the active branch only.
    - Compare changed paths with the issue, spec, plan, tasks, and source map.
    - Flag any file or surface changed outside the plan/source map for review or
      justification, especially late cleanup touching shared shell, global styles,
      shared components, routing, contracts, migrations, authorization, persistence,
      security, or other cross-cutting surfaces.
24. After implementation and required validation, if the current branch is not
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
    - If the user explicitly requested external review:
      - Capture the PR number and current remote head SHA.
      - Do not execute steps 25 through 29.
      - Do not spawn `catworld_pr_reviewer` or perform automatic review
        remediation.
      - Report the PR number, remote head SHA, validation results, and that the
        pull request is awaiting external read-only review.
      - Record `independent review rounds: 0`.
      - Record `reviewed remote head SHAs: none`.
      - Record `final review result: not run — external review requested`.
      - Record `automatic remediation commits: none`.
      - If the working tree is clean, switch back to `main` without pulling,
        merging, rebasing, pruning, deleting branches, or otherwise updating
        `main`.
      - Continue directly to step 30 and then stop.
    - Otherwise, keep the active issue branch checked out and continue to the
      independent review gate in step 25.
25. After the pull request is opened or updated, capture its PR number and
    current remote head SHA. Initialize the review gate with zero completed
    verdicts and zero automatic remediation rounds:
    - Stop if the PR number or current remote head cannot be observed.
    - Treat the captured remote head as the expected head for the next check
      wait and review round.
    - Keep the active issue branch checked out throughout the gate.
    - Never switch branches while remediation changes remain uncommitted.
26. Before every review round, wait for all required checks tied to the expected
    head SHA to reach a terminal state:
    - Use the available bounded wait or monitoring mechanism. Pending checks do
      not consume a review verdict or review-round budget.
    - Failed terminal checks remain review evidence; they do not bypass the
      independent reviewer.
    - Stop and report the unavailable evidence if required checks cannot be
      observed or do not finish within the bounded wait.
    - Stop if the remote PR head changes unexpectedly before review. A new head
      produced by an approved remediation is handled only after its normal push
      and explicit recapture in step 28.
27. Run each review round with one fresh project-scoped
    `catworld_pr_reviewer` agent:
    - Spawn it only after required checks for the expected head are terminal.
    - Give it only the repository, PR number, expected head SHA, and instruction
      to load and follow `AGENTS.md` and
      `.agents/skills/catworld-review-pr/SKILL.md`.
    - Do not pass the leader's implementation narrative, internal reasoning, a
      previous remediation brief, a reduced diff, or a statement that an
      earlier finding was corrected.
    - Require it to reconstruct the linked issue, current base and head SHAs,
      complete live diff and changed-file list, relevant checks, review state,
      and repository sources of truth independently, then review the complete
      live PR head rather than only previous findings.
    - The reviewer remains behaviorally read-only regardless of parent-session
      permissions. The leader must not mutate the working tree while the
      reviewer is active.
    - Wait for the reviewer and require the exact verdict contract from
      `catworld-review-pr`. A reviewer failure, unusable verdict, unavailable
      required evidence, or verdict not tied to the expected head is a terminal
      stop; do not retry the failed round.
    - Allow at most three completed independent review verdicts.
28. Handle each fresh verdict without expanding its meaning:
    - `Approved` with no merge blocker finishes the gate. Preserve any
      non-blocking observations for the final report.
    - Non-blocking findings or optional improvements never enter automatic
      implementation. Preserve them for the final report and finish the gate
      when no blocking finding remains.
    - When verdict one or two contains bounded blocking findings and the
      reviewer supplies a remediation brief requiring no human decision, the
      leader may apply only that bounded remediation on the active issue branch.
      Preserve any accompanying non-blocking observations as report-only.
    - For every allowed remediation, reapply the permanent-test authorization
      gate, remove unauthorized permanent-test work, rerun affected and
      issue-required validation, inspect test and scope diffs, create a normal
      follow-up commit, and push normally without rewriting history. Capture
      the new remote head SHA, increment the automatic remediation count, then
      return to step 26 and use a fresh reviewer for the complete new head.
    - Stop without further automatic changes when a human decision is required,
      remediation is unbounded or scope-expanding, repository state is unsafe,
      required evidence is unavailable, remediation or required validation
      fails outside safely correctable approved scope, or any other existing
      workflow stop applies.
    - A blocking third verdict is terminal even when its remediation would
      otherwise be bounded. Do not perform a third remediation or seek a fourth
      verdict.
    - Across the gate, allow no more than three verdicts and no more than two
      automatic remediation rounds.
29. After the review gate approves or reaches a terminal stop, restore checkout
    only when the working tree contains no uncommitted remediation:
    - Switch the local checkout back to `main` after recording the final gate
      outcome. A terminal stop remains a blocker and must be reported even when
      clean checkout restoration succeeds.
    - If remediation changes remain uncommitted, do not switch branches; stop
      and report the active branch and dirty paths.
    - Do not pull, merge, rebase, prune remotes, delete branches, or otherwise
      update `main` during checkout restoration.
30. Report final status with:
    - concise summary;
    - validation commands executed and explicit statuses;
    - permanent-test authorization basis and final test-diff review result;
    - scope-drift review results;
    - remaining risks or unresolved questions;
    - `git status --short`;
    - concise diff summary;
    - branch name;
    - commit hash or hashes;
    - PR URL when delivery completed;
    - ready/draft PR status when a PR was opened or updated;
    - number of independent review rounds;
    - reviewed remote head SHA for every round;
    - final review result;
    - automatic remediation commit hashes;
    - unresolved blocking findings;
    - reported non-blocking observations;
    - current local checkout branch;
    - confirmation that the checkout was switched back to `main` when delivery
      and review-gate handling completed with a clean working tree.
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
- Codex believes an uncategorized change has exceptional material risk,
  complexity, or regression cost that warrants permanent tests and explicit
  human authorization has not been recorded.
- Generated artifacts conflict in a way that is not safely mechanical to fix.
- Authorized convergence tasks remain after the worker completes the maximum
  two corrective implement/converge cycles. This prevents normal ready
  delivery.
- The PR number, expected remote head SHA, or required checks tied to that head
  cannot be observed, required checks do not reach a terminal state within the
  bounded wait, or the remote head changes unexpectedly before review.
- The independent reviewer fails, returns an unusable or stale verdict, cannot
  establish required live evidence, or reports a verdict not tied to the
  expected head.
- Review remediation requires a human decision, is unbounded or scope-expanding,
  encounters unsafe repository state, or cannot complete required validation
  within approved scope.
- A third independent verdict remains blocking. No third remediation or fourth
  verdict is allowed.
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
draft PR status, review-round count and per-round head SHAs, final review
result, automatic remediation commit hashes, unresolved blocking findings,
non-blocking observations, and current local checkout branch. When delivery
operations were not performed, include the suggested commit title and pull
request description.

## Done When

- Local issue branch is prepared from current `origin/main` without using
  `main` as a delivery branch.
- Spec Kit artifacts are generated and checked against the issue and
  constitution.
- The leader completed the initial implementation, confirmed that every earlier
  editing agent had finished, then exactly one fresh worker owned convergence
  from its first pass through at most two corrective implement/converge cycles.
- The leader waited without editing while the worker was active, inspected the
  returned working tree and report, and resumed before final validation and
  delivery.
- The worker performed convergence mutations itself without delegating
  working-tree mutations to another agent.
- Permanent-test authorization was determined before implementation and
  reapplied after every convergence pass.
- Required validations have run or any inability to run them is reported.
- Validation results are fresh after the latest relevant change, or stale/not-rerun
  checks are explicitly reported as not passed.
- The final branch diff contains no unauthorized added or materially broadened
  permanent automated test coverage.
- Changed files have been reviewed against the issue/spec/plan/tasks source map.
- Normal issue delivery is complete when:
  - no authorized convergence tasks remain after the worker's final pass;
  - scoped changes have been committed on the active issue branch;
  - the branch has been pushed normally;
  - a PR targeting `main` has been opened or updated;
  - required checks for every reviewed head reached a terminal state before its
    counted review;
  - every review round used a fresh project-scoped read-only reviewer that
    reconstructed and assessed the complete live PR head;
  - the final independent verdict is tied to the final remote head SHA;
  - no more than three verdicts or two automatic remediation rounds occurred;
  - non-blocking observations were reported without automatic implementation;
  - checkout restoration occurred only after review approval or a recorded
    terminal stop and never while remediation remained uncommitted;
  - no merge, auto-merge, force-push, branch deletion, remote pruning, issue
    mutation, public GitHub comment, or formal self-approval was performed.
- When delivery cannot be completed, final status includes:
  - commands and validation results;
  - risks and diff summary;
  - the blocker that prevented delivery;
  - suggested commit title;
  - suggested pull request description.
