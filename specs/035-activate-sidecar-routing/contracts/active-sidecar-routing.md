# Active Controlled Sidecar Routing Contract

This contract is the objective review target for issue #261. It defines active
CatWorld issue routing after the accepted #260 workflow activation. Sidecar
parallel remains controlled explicit opt-in and is never the default.

## Routing Matrix

| Request state | Required route | Required result |
|---------------|----------------|-----------------|
| Normal issue | Sequential | Use `catworld-implement-issue`; do not enter sidecar. |
| Direct child issue | Sequential | Use `catworld-implement-issue`; a direct request is not a prepared sidecar handoff. |
| Non-coordinator with `parallel` | Stop | Report that `parallel` is reserved for clearly identified coordinator issues; do not ignore the flag or fall back. |
| Direct child with `parallel` | Stop | Report invalid routing; direct child requests cannot self-select sidecar execution. |
| Coordinator without `parallel`, open children | Stop | Inspect children read-only and report the existing open-child routing blocker before branch preparation. |
| Coordinator without `parallel`, all children closed | Sequential final pass | Use `catworld-implement-issue` only for remaining coordinator verification/delivery; do not redo child scope. |
| Coordinator with `parallel`, safe preflight | Sidecar coordinator | Route only to `catworld-parallel-coordinator` and follow its current executable lifecycle. |
| Coordinator with `parallel`, unsafe preflight | Stop | Report the exact missing, ambiguous, stale, contradictory, unavailable, or unsafe condition; perform no unsafe sidecar action. |

## Authorization Predicate

A request may enter the sidecar coordinator workflow only when all of these are
true:

1. The prompt explicitly includes `parallel`.
2. Current issue evidence clearly identifies one coordinator issue.
3. The issue is not in the permanent #220-#234 parallel exclusion.
4. Required coordinator, child, dependency, source-of-truth, capability,
   repository, and GitHub evidence is current, complete, consistent, and safe.

Labels, titles, branch prefixes, prior fixture identity, stale artifacts, or
private conversation do not replace the predicate. A failed predicate is an
explicit blocker, not sequential fallback.

## Ownership Boundaries

- `AGENTS.md` owns top-level shorthand routing.
- `catworld-implement-issue` owns normal issue, direct-child, and closed-child
  coordinator final-pass execution. It may describe only the outward sidecar
  routing boundary, not sidecar lifecycle internals.
- `catworld-parallel-coordinator` owns sidecar preflight, artifacts, Git state,
  dependency layers, child dispatch, resume, finalization, delivery, and cleanup
  safety rules.
- `catworld-parallel-child-implementation` consumes exactly one prepared,
  released child handoff. It does not classify or self-authorize requests.
- Architecture and GitHub templates must describe the same active boundary.

## Sidecar Merge-Method Contract

This contract applies only to sidecar child PRs targeting a coordinator
integration branch and final sidecar coordinator PRs targeting `main`. The user
must merge both with GitHub's **"Create a merge commit"** method. **"Squash and
merge"** and **"Rebase and merge"** are prohibited.

The terminal child gate requires each exact delivered child commit to remain in
refreshed coordinator ancestry, and post-final-merge cleanup requires exact H2
to remain in current fetched `origin/main` ancestry. GitHub merged metadata alone
is insufficient for either gate. The user remains the only merge authority;
Codex must not merge, approve, enable auto-merge, or modify repository merge
settings. Normal non-sidecar PR merge behavior is unchanged.

## Preserved Guardrails

- Parallel mode is never inferred from a bare issue reference or URL.
- Issues #220-#234 remain sequential-only.
- Unsafe or unavailable child-agent capability stops; it never triggers silent
  sequential fallback.
- Codex does not merge PRs, approve its own PR, enable auto-merge, force-push,
  mutate issues or public comments without authority, or perform unapproved
  cleanup.
- Historical #260 evidence under `specs/034-live-sidecar-dry-run/` remains
  historical and is not active routing authority.

## Validation Contract

All eight matrix rows must be reviewed against every active routing authority.
The #252-#259 focused regressions, stale-wording search, sequential-skill diff
review, historical-path check, and `git diff --check` must be fresh after the
last relevant change. Focused regressions must also prove that rewritten
squash/rebase-style child ancestry cannot satisfy integration, both sidecar PR
templates state the required merge method, and cleanup blocks when exact H2 is
absent from current `origin/main` ancestry.
