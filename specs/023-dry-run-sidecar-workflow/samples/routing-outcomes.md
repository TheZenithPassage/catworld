# Routing Outcomes

## Outcome Matrix

| # | Scenario | Input Shape | Expected Route | Status | Evidence |
|---|----------|-------------|----------------|--------|----------|
| 1 | Valid coordinator `parallel` | `DRY-9901 parallel` | Sidecar coordinator preflight and artifact preparation in dry-run mode; stop before child implementation or delivery operations | passed | `DRY-9901` is a coordinator with listed child fixtures; `.agents/skills/catworld-parallel-coordinator/SKILL.md` defines coordinator classification, preflight readiness, artifact preparation, and stop-before-delegation behavior. |
| 2 | Invalid non-coordinator `parallel` | `DRY-9905 parallel` | Routing error because parallel mode applies only to coordinator issues | rejected as expected | `AGENTS.md` and `.agents/skills/catworld-parallel-coordinator/SKILL.md` both reject `parallel` for non-coordinator issues. |
| 3 | Invalid coordinator end-to-end while children are open | `DRY-9906` | Routing error because listed child issue `DRY-9907` is still open | blocked | `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, and `docs/ARCHITECTURE.md` all stop coordinator end-to-end requests while any child issue remains open as expected. |
| 4 | Valid closed-child coordinator final pass | `DRY-9908` | Existing sequential end-to-end workflow for coordinator final pass only | passed | `DRY-9909` and `DRY-9910` are closed; `.agents/skills/catworld-implement-issue/SKILL.md` defines closed-child coordinator final pass as the existing sequential workflow, not a separate workflow. |
| 5 | Direct child end-to-end | `DRY-9911` | Existing sequential workflow directly on the child issue | passed | `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, and `.agents/skills/catworld-parallel-child-implementation/SKILL.md` all keep direct child issues outside sidecar child execution unless a prepared sidecar handoff exists. |
| 6 | Real active issue shorthand | `234` | Existing sequential workflow only | passed | #234 is in the #220-#234 sequential-only range and is a direct child of #220, not a coordinator. |

## Closed-child Coordinator Final Pass Evidence

`DRY-9908` represents a coordinator whose listed children are all closed.
Required behavior:

- use `.agents/skills/catworld-implement-issue/SKILL.md`;
- perform only coordinator-level final-pass validation or remaining work;
- do not run sidecar artifact preparation;
- do not use sidecar branch/worktree or PR child/final model;
- do not present closed child scope as newly implemented work.

Status: passed.

## Direct Child Evidence

`DRY-9911` represents a direct child issue requested end-to-end outside
sidecar `parallel` mode. Required behavior:

- use `.agents/skills/catworld-implement-issue/SKILL.md`;
- do not require coordinator artifacts;
- do not use `.agents/skills/catworld-parallel-child-implementation/SKILL.md`
  because there is no prepared sidecar handoff.

Status: passed.
