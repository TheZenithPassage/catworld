# Sidecar Coordinator Entrypoint Contract

## Purpose

Define the observable routing and preflight contract for the sidecar coordinator
parallel entrypoint introduced by issue #226.

## Accepted Input

- A CatWorld GitHub coordinator issue identifier or URL.
- An explicit `parallel` keyword in the user request.
- Repository context from `AGENTS.md`, `.specify/memory/constitution.md`,
  `docs/ARCHITECTURE.md`, the coordinator issue body, listed child issue
  bodies, and relevant feature artifacts or source-of-truth documents.

## Routing Outcomes

| Request Shape | Outcome |
|---------------|---------|
| Normal issue plus `parallel` | Stop with a routing error: parallel mode only applies to coordinator issues. |
| Direct child issue plus `parallel` | Stop with a routing error: direct child issues use the existing sequential workflow. |
| Issues #220 through #234 plus `parallel` during sidecar build-out/adoption | Use current sequential workflow guardrails; do not enter sidecar parallel mode. |
| Coordinator issue plus no `parallel`, with any listed child issue open | Stop under the existing #220-#222 routing contract. |
| Coordinator issue plus no `parallel`, with all listed child issues closed | Route to the existing sequential end-to-end workflow for a coordinator final pass. |
| Coordinator issue plus explicit `parallel` when routing guardrails allow sidecar use | Enter sidecar coordinator preflight only. |

## Preflight Requirements

The entrypoint must inspect before implementation:

- coordinator issue title, body, state, labels, and listed child issues;
- each listed child issue title, body, state, and dependency notes;
- dependency order and hard-dependency/conflict risks between children;
- source-of-truth documents including `AGENTS.md`, the constitution,
  `docs/ARCHITECTURE.md`, and relevant feature artifacts;
- sidecar artifact path rules from #225 when reasoning about future artifacts.

## Stop Conditions

The entrypoint must stop before implementation when:

- the issue cannot be classified as a coordinator issue;
- child issues cannot be found, fetched, or classified;
- the coordinator context is incomplete or contradictory;
- hard dependencies or conflict risks make blind parallelization unsafe;
- required source-of-truth documents are missing or conflict;
- a user requests behavior that would require child artifact generation, Git
  branch/worktree operations, PR creation, GitHub issue mutation, product code
  changes, or changes to existing workflow internals in this issue.

## Prohibited Side Effects

The entrypoint must not:

- require, invent, add, or route based on a required `parallel-ready` label;
- mutate GitHub issues, labels, assignees, milestones, comments, or state;
- create or switch Git branches or worktrees;
- create coordinator or child sidecar artifacts;
- delegate child implementation work;
- open or update pull requests;
- modify CatWorld product code;
- modify `.agents/skills/catworld-implement-issue/SKILL.md`;
- modify `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.

## Validation Contract

Validation must include:

- local routing examples for the request shapes above;
- manual review against GitHub issues #220, #221, #222, #225, and #226;
- text review that readiness is preflight-based and not label-based;
- changed-file review proving existing workflow skills and product code remain
  unchanged;
- `git diff --check`.
