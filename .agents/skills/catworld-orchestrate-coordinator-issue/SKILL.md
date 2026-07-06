---
name: "catworld-orchestrate-coordinator-issue"
description: "Orchestrate CatWorld coordinator GitHub issues that split implementation into child sub-issues, choosing sequential or explicitly requested parallel delegation through the single-issue implementation skill."
compatibility: "Requires the CatWorld repository, GitHub issue context, current origin/main, and the repo-local CatWorld single-issue implementation skill"
metadata:
  author: "catworld"
  source: "issue-202"
---

# CatWorld Orchestrate Coordinator Issue

Use this orchestration skill for CatWorld coordinator issues. A coordinator
issue organizes smaller concrete child issues; it is not implemented directly
as one large PR by default.

Concrete child issue implementation remains delegated to
`.agents/skills/catworld-implement-issue/SKILL.md`.

## Required Inputs

- Coordinator GitHub issue number or URL.
- Execution mode:
  - `sequential` by default.
  - `parallel` only when the caller explicitly selects it.
- Full child issue context once child issues are discovered.

If the issue identifier is missing or ambiguous, stop and ask for the
coordinator issue identifier.

## Governing Context and Safety

Before orchestration, read:

- `AGENTS.md`;
- `.specify/memory/constitution.md`;
- `.agents/skills/catworld-implement-issue/SKILL.md`;
- the full coordinator issue;
- all linked child issues;
- the parent epic when referenced and relevant to dependency, scope, or shared
  contract decisions.

All implementation, Git, GitHub, PR, validation, and final-report behavior for
child issues remains governed by `AGENTS.md` and
`.agents/skills/catworld-implement-issue/SKILL.md`. Those files are the
authoritative source for restrictions around `main`, force-push workflows,
branch cleanup and deletion, remote pruning, PR merge, auto-merge, GitHub issue
mutation, and public GitHub comments.

This coordinator skill may inspect current `origin/main` and issue metadata to
classify work. It must not replace the single-issue implementation workflow for
concrete child issues.

Coordinator-delegated child work uses the active CatWorld delivery rules through
`.agents/skills/catworld-implement-issue/SKILL.md` for each concrete child
issue. Delivery includes scoped commit, normal branch push, and child PR creation
when the active workflow allows delivery. Delivery is skipped only when the user
explicitly asks for local-only or no-delivery execution, or when a stop condition
prevents safe delivery.

## Coordinator Issue Detection

Use this skill when the issue body clearly indicates one or more of these:

- it says it is a coordinator issue;
- it says not to implement the issue directly as one large PR;
- it lists child issues or sub-issues;
- it defines execution waves, dependency order, or parallel execution;
- it mainly exists to coordinate smaller implementation issues.

If the issue is a normal single concrete implementation issue, use
`.agents/skills/catworld-implement-issue/SKILL.md` instead.

If the issue appears to be a coordinator issue but child issues cannot be found
or read, stop and report the blocker.

## Orchestration Workflow

1. Confirm the issue is a coordinator issue using the detection rules above.
2. Read the full coordinator issue, including any linked child issue list,
   dependency notes, execution waves, explicit exclusions, validation
   expectations, and parent or epic references.
3. Read all child issues before selecting execution mode. Treat each child issue
   body as part of the scope and decision contract for that child.
4. Read the parent epic when referenced and relevant to scope, sequencing,
   dependency, shared contract, or validation decisions.
5. Inspect current `origin/main` read-only so dependency readiness and shared
   source-of-truth assumptions are based on the current target branch. Fetching
   or inspecting `origin/main` is allowed; do not update local `main`.
6. Build a child issue map containing:
   - child issue number and title;
   - required outcome;
   - relevant parent/coordinator context;
   - known dependencies;
   - likely touched surfaces when inferable from the issue text or current
     source of truth;
   - required validation;
   - open blockers or unresolved decisions.
7. Classify relationships between child issues.
8. Select sequential or parallel execution according to the requested mode and
   dependency classification.
9. Delegate selected concrete child issue work through
   `.agents/skills/catworld-implement-issue/SKILL.md`.
10. Report child PRs, blockers, validation results, current dependency state,
    and recommended merge order.

## Dependency Classification

Classify each child issue relationship as one or more of these when applicable:

- **Hard dependency**: The child issue cannot be implemented correctly until
  another issue is merged into `main`.
- **Recommended order**: The child issue could be implemented first, but doing
  so likely causes rework or inconsistent patterns.
- **Conflict risk**: The child issue is logically independent but likely touches
  the same contracts, migrations, services, DTOs, tests, components, shared
  styles, workflow files, or other shared surfaces.
- **Independent**: The child issue can be implemented separately without
  unresolved shared decisions or meaningful file overlap.
- **Optional follow-up**: The child issue is not required for the coordinator
  issue to complete.

When classification is uncertain and the uncertainty affects execution order,
parallel safety, shared contracts, product behavior, architecture, persistence,
security, UX, validation, or scope, stop and report the ambiguity instead of
guessing.

## Sequential Mode

Sequential mode is the safe default.

Sequential mode:

1. Selects the first ready child issue based on hard dependencies, recommended
   order, conflict risks, shared-contract readiness, and current `origin/main`.
2. Delegates exactly that child issue to
   `.agents/skills/catworld-implement-issue/SKILL.md`.
3. Keeps one child issue per PR by default.
4. Stops when the next child requires the current child PR or another dependency
   to be merged into `main` by a human.
5. Continues to another child only when that child is independent of unmerged
   work or its dependency is already merged into `main`.

Sequential mode must not bundle all child issues into one PR unless the
coordinator issue explicitly allows bundling and the governing repository
instructions still allow the selected delivery shape.

## Parallel Mode

Parallel mode runs only when explicitly selected by the caller.

Parallel mode:

1. Requires isolated execution environments for each selected child issue.
2. Stops if isolated execution is unavailable.
3. Assigns exactly one child issue per sub-agent.
4. Parallelizes only independent or dependency-ready child issues.
5. Never parallelizes hard-dependent child issues.
6. Avoids parallelizing conflict-risk children unless the conflict risk is
   resolved mechanically before delegation.
7. Never lets separate agents invent competing shared contracts, patterns, or
   architecture.
8. Requires every sub-agent to use
   `.agents/skills/catworld-implement-issue/SKILL.md` for its assigned child
   issue.

Parallel mode does not relax repository, Git, validation, or PR safety rules.

## Shared Contract Rule

If multiple child issues need the same missing shared contract, do not
parallelize them.

Use one of these safe options:

1. Select one seed child issue first.
2. Stop and report that a separate shared-contract issue is needed.
3. Continue sequentially when the shared decision is already resolved by the
   coordinator issue, child issue, parent epic, source-of-truth documentation,
   or current `main`.

Sub-agents must reuse shared contracts already present in `main`.

## Sub-Agent Delegation

Sub-agents are implementation executors, not product or architecture decision
makers.

Each sub-agent must receive:

- child issue number and full issue body;
- coordinator issue number and relevant coordinator issue body;
- parent epic context when relevant;
- dependency assumptions and any child issues that must already be merged;
- known shared contracts or patterns from current `main` and governing docs;
- out-of-scope boundaries;
- required validation;
- final report expectations, including delivery status, child PR URL when
  opened, validation status, blockers, current checkout branch, and any
  recommended merge order impact.

A sub-agent must stop and report back when it finds ambiguity, missing context,
unresolved product or architecture decisions, unresolved persistence, security,
UX, or shared-contract decisions, non-mechanical conflicts, validation failure,
or scope mismatch.

When a child issue is delivered, the child PR should close only that concrete
child issue and reference the coordinator or parent epic as related work. Do not
close the coordinator issue unless the coordinator itself is explicitly complete.

## Final Report

Report:

- coordinator issue number and selected execution mode;
- child issue classification table;
- delegated child issue or issues;
- child PR URL or URLs when delivery occurred;
- validation status for each child;
- blockers and unresolved decisions;
- shared-contract assumptions;
- recommended merge order;
- whether more coordinator work remains.

Do not post public GitHub comments or mutate GitHub issues unless the user
explicitly requests those operations and the governing repository instructions
allow them.

## Stop Conditions

Stop and report the blocker when any of these occur:

- the coordinator issue cannot be read;
- the issue appears to be a coordinator issue but child issues cannot be found
  or read;
- a referenced parent epic is required for scope, dependency, or shared-contract
  decisions but cannot be read;
- dependency order is ambiguous in a way that affects safe execution;
- a hard dependency is not merged into `main`;
- parallel mode was selected but isolated execution environments are
  unavailable;
- child issues need the same missing shared contract and no seed-first,
  sequential, or approved existing-contract path is available;
- a child issue requires an unresolved product, architecture, persistence,
  security, UX, shared-contract, or operational decision;
- a sub-agent reports ambiguity, missing context, non-mechanical conflict,
  validation failure, or scope mismatch;
- the requested coordinator workflow would bypass
  `.agents/skills/catworld-implement-issue/SKILL.md` for concrete child issue
  implementation.

## Out of Scope

- Shorthand prompt routing such as interpreting bare issue numbers or
  `<issue> parallel` prompts.
- Implementing backend, frontend, product, or database behavior in the
  coordinator issue itself.
- Changing `.specify/memory/constitution.md`.
- Changing Spec Kit agent-context scripts.
- Replacing `.agents/skills/catworld-implement-issue/SKILL.md`.
- Automatic GitHub issue mutation, public GitHub comments, PR merge,
  auto-merge, branch cleanup, branch deletion, remote pruning, or force-push
  workflows.
