# Sidecar Local Cleanup Contract

## Entry gate

Cleanup may be evaluated only for a valid sidecar coordinator state with an exact stable `run_id`. It is eligible only when current evidence identifies one unique same-run final coordinator PR, confirms its expected coordinator source and H2 head, `main` base and merged state, and proves exact H2 is an ancestor of current fetched `origin/main`. GitHub merged metadata alone is insufficient. Eligibility never triggers automatic deletion: local cleanup execution also requires explicit current cleanup authority. The local journal never substitutes for merge, ancestry, ownership, or authority evidence.

## Journal location and schema

1. Run `git rev-parse --git-common-dir` from the repository context.
2. Normalize the result to the actual Git common directory.
3. Validate the existing `run_id` as one path component.
4. Use `<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json`.
5. Persist exactly these top-level fields:
   - `schema_version`
   - `run_id`
   - `eligibility`
   - `owned_resources`
   - `skipped_reasons`
   - `attempted_operations`
   - `result`
   - `updated_at_utc`

The journal is local operational evidence. It is never added to a worktree, commit, H2/H3/H4 artifact, issue, comment, PR, or remote cleanup record.

## Preflight

Before the first deletion:

- prove `git merge-base --is-ancestor <H2> origin/main` against current fetched
  `origin/main`; merged metadata without that ancestry remains blocked;
- load exact same-run-owned local resources from the coordinator artifact;
- compare every candidate copied from the coordinator ownership ledger with live `git worktree list --porcelain`, local refs, normalized paths, exact branch associations, and the repository Git common directory;
- verify every candidate worktree has empty staged, unstaged, and untracked status;
- verify cleanup runs from a non-target checkout;
- write the journal with factual eligibility, resources, skipped reasons, no attempted operations, and `in_progress` only when all gates pass.

Any missing evidence, unknown resource, inconsistent state, dirty worktree, unsafe control checkout, or journal-write failure stops before deletion.

## Execution

- Remove an owned worktree through `git worktree remove -- <exact-path>`.
- Persist the attempted operation and resource outcome.
- Only after its worktree is gone, delete the associated owned local branch through standard non-force `git branch -d -- <exact-branch>`.
- Persist the attempted operation and resource outcome.
- Stop on failure. Record `partial` if an earlier operation succeeded; otherwise record `blocked`.
- Record `completed` only when every approved local target was removed successfully.
- Report an existing `partial` or `completed` journal without automatically retrying or continuing it; #259 adds no crash-recovery workflow.

## Prohibited operations

Cleanup never:

- creates H3/H4 or changes H2 or `specs/032-final-coordinator-delivery/finalization.md`;
- force-removes worktrees or force-deletes branches;
- deletes or otherwise cleans up remote branches;
- prunes remotes or remote-tracking refs;
- mutates GitHub issues or comments;
- merges or approves pull requests;
- enables auto-merge.

Read-only evidence collection and the final-merge evidence refresh required by the preceding sidecar lifecycle are not cleanup operations.

## Validation boundary

Issue #259 proves only the seven focused cases in the feature spec with one shared temporary-Git fixture and one table-driven script. Complete sidecar end-to-end and cross-workflow validation belongs to issue #260.
