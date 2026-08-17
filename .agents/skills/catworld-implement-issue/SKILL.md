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
- May open a pull request targeting the captured `startingBaseRef`, or update
  the existing pull request for the same active issue branch and base.
- May implement review fixes as new follow-up commits on the same PR branch, then push normally.
- Do not modify GitHub issues unless explicitly requested.
- Do not merge pull requests or merge the issue branch into its captured parent.
- The only permitted branch merge is the explicitly scoped
  `origin/<startingBaseRef>`-into-issue-branch synchronization in step 24.
- Do not enable auto-merge.
- Do not approve Codex's own pull request.
- Do not write directly to the captured parent branch.
- Do not commit or push directly to the captured parent, use it as a delivery
  branch, or mutate its checkout in this or another worktree.
- Do not use `git push --force`, `git push --force-with-lease`, rebase-push workflows, or any history-rewriting remote update unless the user explicitly requests it.
- Do not delete local branches, delete remote branches, prune remotes, run branch cleanup, or post public GitHub comments unless explicitly requested where applicable.
- Do not generate example feature directories.

## Branch Preparation

Fetch the issue title and labels read-only for branch naming, then prepare the
local branch from the operator-selected starting context before running Spec
Kit. Treat the exact starting commit and intended pull-request base as separate
fixed values:

- `startingBaseSha` is the exact `HEAD` captured before any branch switch or
  creation.
- `startingBaseRef` is the symbolic branch selected by the operator, or an
  explicit reliable base ref supplied by invocation/runtime context for a
  detached start. Keep it fixed for the run.

1. Confirm the working tree is clean with `git status --porcelain`. If any
   output appears, abort and report the dirty paths.
2. Capture `startingBaseSha` from `git rev-parse HEAD` before any branch change.
3. Resolve `startingBaseRef` independently:
   - Use the current symbolic branch when one is checked out.
   - For detached HEAD, require an explicit reliable base ref from invocation
     or runtime context or the operator; if none exists, stop before editing.
   - Never search for branches containing `startingBaseSha`, infer a base from
     commit reachability, or fall back to `main`.
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
5. If the derived issue branch equals `startingBaseRef`, stop before Spec Kit,
   edits, synchronization, or delivery and require an independent intended
   parent ref from the operator or reliable invocation context. Do not infer a
   parent through reachability, silently recover another branch, or default to
   `main`.
6. Check whether `refs/heads/<branch>` already exists. If it exists and the
   user did not explicitly ask to reuse it, abort. If reuse was authorized,
   inspect `git worktree list --porcelain` read-only before switching. Stop and
   report the blocking worktree if that branch is checked out elsewhere;
   otherwise switch without merging, rebasing, or rewriting history.
7. If the branch does not exist, create and switch to it from the exact captured
   commit with `git switch -c <branch> <startingBaseSha>`.
8. Confirm the issue branch is active before Spec Kit or edits. From this point,
   remain on it for all success, handoff, remediation, and stop paths. Do not
   create, remove, move, clean, allocate, coordinate, or mutate worktrees.

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

## Isolated Native MySQL Validation

H2 remains the fast default. Use native MySQL only when the issue, approved
plan, tasks, convergence findings, or a demonstrated H2/MySQL difference
requires real-engine evidence. Relevant cases include a clean Flyway migration
chain; MySQL-specific schema constraints or conversions; JPA or repository
behavior that depends on the real engine; transactions, rollback, locking,
isolation, or concurrency; and foreign-key or persisted-integrity behavior that
H2 cannot prove reliably. Do not start Docker merely because an issue changes
backend code when existing validation already provides adequate evidence.

When native MySQL validation is required:

1. Check Docker daemon availability. If it is initially stopped, make exactly
   one bounded attempt to start Docker Desktop and wait for the daemon to become
   ready before classifying native validation as unavailable. Record whether
   Docker was already running or was started by the workflow.
2. From the current implementation branch, create a completely separate,
   disposable Compose stack with a unique project name, its own containers and
   network, a separate temporary volume, and non-conflicting or dynamically
   selected host ports. Never connect to, inspect, migrate, reset, restart,
   stop, or reuse the normal CatWorld development stack, its `catworld`
   database, its network, or its persistent `mysql_data` volume. Leave every
   already-running development or operational container untouched.
3. Build an empty temporary database through the complete applicable Flyway
   migration chain. Start the current backend when the required evidence
   depends on the real application path.
4. Execute the smallest issue-relevant native HTTP, service, persistence,
   migration, transaction, or concurrency scenario and capture its observed
   evidence. Successful container startup alone is not evidence.
5. Remove only the temporary Compose project, network, containers, volumes, and
   test data created for this validation, including after a failed scenario
   when cleanup remains safe. Verify and record cleanup status.

Do not add Testcontainers, CI workflows, permanent native-test infrastructure,
or maintained test coverage solely to perform this temporary validation unless
a separate approved issue authorizes it. Native validation is a workflow stop
when Docker Desktop cannot be started within the bounded attempt, the temporary
environment cannot be prepared safely, the required scenario fails and cannot
be corrected within approved scope, cleanup is unsafe, or repository state is
unsafe.

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
    - Preserve the validation-stage boundary from the active issue. Evidence
      that can exist only after commit, push, or pull-request creation—such as
      live exact-head GitHub Actions runs—must remain pending for the delivery
      gate. It is not incomplete convergence or pre-delivery implementation
      work. Mechanically correct any generated spec, plan, task, analysis, or
      convergence artifact that makes delivery-only evidence a pre-delivery
      blocker, then rerun `speckit-analyze` before continuing.
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
    - Apply the active issue's validation-stage boundary. Do not classify
      evidence requiring an opened PR, pushed head, or live exact-head Actions
      run as remaining convergence work. If a generated artifact incorrectly
      does so, mechanically reconcile it with the issue, rerun
      `speckit-analyze`, and keep that evidence pending for delivery.
    - When a convergence task requires MySQL or full-stack backend evidence,
      follow `Isolated Native MySQL Validation` before classifying that evidence
      as unavailable. An initially stopped Docker daemon is not sufficient
      reason to leave the task incomplete or consume a corrective cycle without
      the required bounded startup and isolated-environment attempt.
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
    and scope-drift reviews, delivery, branch-retention verification, and
    completion reporting.
20. Run all validations required by the issue, plan, and tasks. When required
    evidence still depends on real MySQL after convergence, the leader must
    follow `Isolated Native MySQL Validation` before treating final validation
    as complete.
21. Before treating validation as complete:
    - Rerun any validation command, test, review, browser-control session, manual smoke
      check, or other evidence affected by relevant changes made after that evidence
      was collected.
    - Rerun applicable isolated native MySQL validation when later
      implementation or remediation changes make its evidence stale.
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
24. After implementation, convergence, required fresh local validation, test-
    diff review, and scope-drift review, commit the scoped changes normally so
    the active issue branch is clean. Immediately before its first push and
    pull-request delivery, synchronize it with the captured parent:
    - Fetch only the required parent ref with
      `git fetch origin <startingBaseRef>`.
    - Stop without retargeting if `origin/<startingBaseRef>` does not exist.
    - Verify `startingBaseSha` is an ancestor of the current remote parent. Stop
      without guessing a replacement base, rebasing, force-pushing, or mutating
      the parent when it is not; this includes unpublished local starts and
      rewritten or diverged remote parent history.
    - If the issue branch already contains the current remote parent, do not
      merge. Otherwise merge `origin/<startingBaseRef>` normally into the issue
      branch.
    - Resolve merge conflicts only when the issue, constitution, current parent
      behavior, and repository sources of truth make the correct result fully
      deterministic. Stop for human direction when resolution requires a new
      product, architecture, authorization, persistence, shared-contract, UX,
      correctness-sensitive, operational, or scope decision.
    - Complete a normal merge commit when required. A parent merge makes
      affected earlier evidence stale: rerun all issue-required and affected
      validation. Correct exposed incompatibilities only within approved scope,
      reapply the permanent-test and scope gates, create normal follow-up
      commits, and rerun affected validation. Stop on decision or scope expansion.
    - Do not repeatedly poll or merge later parent advances merely because the
      parent moves again after the pull request opens.
    After synchronization and fresh validation, push only the active issue
    branch to `origin` with a normal non-force push and open or update a pull
    request targeting the fixed `startingBaseRef`.
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
    - Backend CI and Frontend CI are expected for every pull-request base.
      Absence of either expected workflow is missing or unavailable evidence,
      never success or a special non-`main` exemption.
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
    - When verdict one, two, or three contains bounded blocking findings and
      the reviewer supplies a remediation brief requiring no human decision,
      the leader may apply only that bounded remediation on the active issue branch.
      Preserve any accompanying non-blocking observations as report-only.
    - For every allowed remediation, reapply the permanent-test authorization
      gate, remove unauthorized permanent-test work, rerun affected and
      issue-required validation, inspect test and scope diffs, create a normal
      follow-up commit, and push normally without rewriting history. Capture
      the new remote head SHA and increment the automatic remediation count.
      After remediation from verdict one or two, return to step 26 and use a
      fresh reviewer for the complete new head. After remediation from verdict
      three, do not return to step 26 or launch a fourth reviewer: stop because
      the review budget is exhausted and report the new remote head as `not
      independently reviewed after third remediation`, not as approved.
    - Stop without further automatic changes when a human decision is required,
      remediation is unbounded or scope-expanding, repository state is unsafe,
      required evidence is unavailable, remediation or required validation
      fails outside safely correctable approved scope, or any other existing
      workflow stop applies.
    - When verdict three has no usable bounded remediation, requires a human
      decision, or its remediation or required validation fails, preserve the
      applicable terminal-stop behavior without a fourth verdict.
    - Across the gate, allow no more than three verdicts and no more than three
      automatic remediation rounds.
29. After the review gate approves or reaches a terminal stop, keep the active
    issue branch checked out. If remediation changes remain uncommitted, stop
    and report the dirty paths without switching branches. Never restore the
    captured parent, `main`, or another branch.
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
    - final remote head SHA and whether that head was independently reviewed;
    - automatic remediation commit hashes;
    - unresolved blocking findings;
    - reported non-blocking observations;
    - when native validation was used: whether Docker Desktop was already
      running or was started by the workflow, the temporary Compose project
      name, allocated host ports, MySQL image and resolved server version,
      Flyway migrations applied, transaction isolation level when relevant, the
      exact scenario and observed evidence, cleanup status, and any remaining
      unverified native behavior;
    - current local checkout branch;
    - `startingBaseSha` and fixed `startingBaseRef`, parent-synchronization
      result, and confirmation that the issue branch remains checked out.
    If delivery cannot be completed, or if the user explicitly requested
    local-only or no-delivery execution, include the blocker or reason, the
    current branch state, a suggested conventional commit title, and a suggested
    pull request description.

## Stop Conditions

Stop and report the blocker when any of these occur:

- Working tree is dirty before branch preparation.
- Detached HEAD has no reliable explicit intended base ref.
- Target branch already exists without explicit reuse permission.
- The derived issue branch equals `startingBaseRef` and no independent intended
  parent ref was explicitly supplied.
- An explicitly reusable target branch is checked out in another worktree.
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
- Required native MySQL validation cannot proceed because Docker Desktop does
  not become ready within its single bounded startup attempt, or the isolated
  temporary environment cannot be prepared safely.
- A required native MySQL scenario fails and cannot be corrected within
  approved scope, temporary-environment cleanup is unsafe, or repository state
  is unsafe.
- The PR number, expected remote head SHA, or required checks tied to that head
  cannot be observed, required checks do not reach a terminal state within the
  bounded wait, or the remote head changes unexpectedly before review.
- The independent reviewer fails, returns an unusable or stale verdict, cannot
  establish required live evidence, or reports a verdict not tied to the
  expected head.
- Review remediation requires a human decision, is unbounded or scope-expanding,
  encounters unsafe repository state, or cannot complete required validation
  within approved scope.
- A third independent verdict has no usable bounded remediation, requires a
  human decision, or its remediation or required validation fails. No fourth
  verdict is allowed.
- A third automatic remediation completed and its new remote head was captured.
  Stop because the review budget is exhausted, do not launch a fourth reviewer,
  and report that head as not independently reviewed rather than approved.
- Validation fails and cannot be fixed without changing approved scope, unless
  delivery operations were explicitly requested and the branch is still useful
  for draft PR review with the failure clearly reported.
- Required validation is stale after relevant late changes and cannot be rerun or
  honestly reported within the approved scope.
- Changed files or surfaces outside the issue/spec/plan/tasks source map cannot be
  justified without changing approved scope.
- `origin/<startingBaseRef>` is missing at first delivery, or `startingBaseSha`
  is not an ancestor of that remote parent.
- Parent synchronization has a conflict whose correct resolution requires a new
  material decision, or exposes an incompatibility requiring scope expansion.

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
non-blocking observations, the final remote head SHA and whether it was
independently reviewed, and current local checkout branch. When delivery
operations were not performed, include the suggested commit title and pull
request description.

When native validation was used, also include its Docker startup state,
temporary Compose project and host ports, MySQL image and resolved server
version, applied Flyway migrations, relevant transaction isolation level,
exact scenario and observed evidence, cleanup status, and any remaining
unverified native behavior.

## Done When

- Starting `HEAD` and intended parent ref are captured independently; the local
  issue branch is created from the exact starting SHA or safely reused, without
  inferring a detached base, allowing the issue branch to become its own parent,
  or mutating another worktree.
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
- When required evidence depended on real MySQL, the leader or convergence
  worker followed the isolated native procedure before declaring it
  unavailable, and an initially stopped Docker daemon received the single
  bounded startup attempt.
- Every temporary native-validation project was isolated from normal CatWorld
  resources and removed with its temporary network, containers, volumes, and
  test data when cleanup remained safe.
- Validation results are fresh after the latest relevant change, or stale/not-rerun
  checks are explicitly reported as not passed.
- The final branch diff contains no unauthorized added or materially broadened
  permanent automated test coverage.
- Changed files have been reviewed against the issue/spec/plan/tasks source map.
- Normal issue delivery is complete when:
  - no authorized convergence tasks remain after the worker's final pass;
  - scoped changes have been committed on the active issue branch;
  - the branch has been pushed normally;
  - the compatible current remote captured parent was integrated before first
    delivery and affected evidence was refreshed;
  - a PR targeting the fixed `startingBaseRef` has been opened or updated;
  - required checks for every reviewed head reached a terminal state before its
    counted review;
  - every review round used a fresh project-scoped read-only reviewer that
    reconstructed and assessed the complete live PR head;
  - the final independent verdict is tied to the final remote head SHA, unless
    a bounded third remediation produced the terminal post-remediation head;
    that head is reported as not independently reviewed after third remediation
    and is not described as approved;
  - no more than three verdicts or three automatic remediation rounds occurred;
  - non-blocking observations were reported without automatic implementation;
  - the active issue branch remained checked out through completion or stop;
  - no merge, auto-merge, force-push, branch deletion, remote pruning, issue
    mutation, public GitHub comment, or formal self-approval was performed.
- When delivery cannot be completed, final status includes:
  - commands and validation results;
  - risks and diff summary;
  - the blocker that prevented delivery;
  - suggested commit title;
  - suggested pull request description.
