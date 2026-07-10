# Pull Request Templates

CatWorld keeps normal one-issue/one-PR pull request descriptions unchanged.

Use `sidecar-child-to-coordinator.md` only for a sidecar child branch pull
request into a coordinator branch. Child PRs target that coordinator branch,
reference both issues with `Related to` lines, and do not close issues.

Use `sidecar-final-coordinator-to-main.md` only for the future activated
sidecar runtime's final coordinator-branch pull request into `main`. This is
the sole sidecar PR boundary that may use closing keywords for the coordinator
and delivered child issues. Codex must not separately mutate issue state.

The current #258 build-out delivery is deliberately different: its
implementation PR targets `workflow/sidecar-buildout` and uses only
`Related to #258`. The temporary integration branch is not the runtime final
target and does not replace the coordinator-branch-to-`main` contract.

## Runtime final coordinator prerequisites

Create or reuse a final coordinator PR only as ready for review. There is no draft fallback
for failed, stale, skipped, timed-out, interrupted, partial,
blocked, not-run, unavailable, or otherwise unverifiable required evidence.

Before rendering or mutating a final PR, re-read current GitHub and repository
evidence and check for an existing same-run PR. If an existing PR has stale or
inconsistent base, head, body, validation, or readiness evidence, stop and
report the exact blocker; do not create a duplicate or silently change its
readiness.

Runtime finalization uses two heads:

- Run the complete required integrated implementation checks at coordinator
  head `H` and report those results as checks run at `H`.
- Commit direct child `H2` with only the factual finalization/coordinator
  artifact, prove `H2^ = H` and the sole-artifact `H..H2` delta, explain why
  each consumed `H` result remains applicable, and rerun every
  artifact-affected check at `H2`.
- Do not claim that the complete suite ran at `H2` unless it actually did.

After the `H2` checks pass, push `H2` normally and verify the fetched remote
coordinator source ref equals `H2`. Immediately before final PR creation,
re-fetch `origin/main` and the remote coordinator branch, then recheck the
recorded target-base SHA, PR-equivalent merge base, local and remote `H2`,
ancestry, integrated diff scope, validation freshness, and same-run PR state.
Movement or inconsistency blocks delivery until the affected evidence is
fresh; do not force-push or rewrite history to manufacture freshness.

The final template records integrated child traceability, the split `H`/`H2`
validation evidence, integrated scope review, source/target readiness, and
remaining risks. After GitHub creates or returns the final PR, report its
observed URL and ready state from current GitHub evidence and the final report.
Do not write the URL into the branch-bound artifact or create an `H3`/`H4`
commit solely to record it.

Cleanup remains `ineligible` with reason `pending final PR merge` until the
runtime final coordinator PR is observed merged into `main`. Codex reports
sidecar PR readiness; the user performs merges.

A coordinator with all child issues already closed that enters the existing
sequential final-pass workflow uses normal sequential PR wording for any
remaining final pass, not the sidecar final coordinator template.

These templates do not authorize Codex to merge or approve pull requests,
enable auto-merge, mutate issue bodies, checklists, labels, assignees,
milestones, issue state, or public comments, start another child layer after
final validation begins, delete branches or worktrees, prune remotes, perform
cleanup, rebase, force-push, or rewrite history. They also do not activate
parallel mode, replace the normal sequential workflow, or require opening real
PRs during validation.
