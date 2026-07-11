# Data Model: Sidecar Local Cleanup Journal

This feature introduces no CatWorld domain entity, database schema, API payload, browser storage, or external persistence contract. It adds one small local operational JSON record beneath the Git common directory.

## Cleanup Journal

Path:

```text
<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json
```

The Git common directory is resolved with `git rev-parse --git-common-dir`. The existing sidecar `run_id` is used as one safe path component; an empty value, parent component, or value containing a path separator is rejected.

### Top-level fields

| Field | Type | Rules |
|-------|------|-------|
| `schema_version` | integer | `1` for this contract |
| `run_id` | string | Must equal the existing same-run identity used for ownership evidence |
| `eligibility` | string | `ineligible` or `eligible`; merge evidence decides this, not the journal itself |
| `owned_resources` | array | Minimal exact worktree/branch records copied from and corroborated against the same-run ownership ledger |
| `skipped_reasons` | array of strings | Empty when none; otherwise factual reasons that blocked or retained resources |
| `attempted_operations` | array | Ordered factual local worktree/branch removal attempts and outcomes |
| `result` | string | `ineligible`, `not_started`, `blocked`, `in_progress`, `partial`, or `completed` |
| `updated_at_utc` | string | UTC ISO-8601 timestamp for the last persisted state |

No additional top-level fields are allowed in schema version 1.

### Owned resource entry

Each entry is intentionally small:

- `kind`: `worktree` or `branch`;
- `path`: normalized absolute path for a worktree, otherwise null;
- `branch`: exact local branch name associated with the resource;
- `state`: `present`, `removed`, or `retained`.

The journal is not independent proof of merge, ownership, or cleanup authority. Cleanup must compare these copied records with the coordinator artifact and current Git state, and eligibility does not itself authorize deletion.

### Attempted operation entry

- `operation`: `remove_worktree` or `delete_branch`;
- `resource`: exact normalized worktree path or local branch name;
- `status`: `succeeded` or `failed`;
- `reason`: empty for success, otherwise the factual failure text or normalized reason.

## State transitions

```text
eligibility: ineligible -> eligible

result before merge: ineligible or blocked
result after merge without authority: not_started
result after authorized preflight failure: blocked
result during execution: in_progress
result after execution: completed or partial
```

- A known-unmerged final PR records `eligibility = ineligible` and `result = ineligible`; missing or inconsistent merge evidence records `eligibility = ineligible` and `result = blocked` with a skipped reason.
- Confirmed merge without explicit current cleanup authority records `eligibility = eligible` and `result = not_started` with an authority reason.
- Dirty or unknown candidate state prevents the first deletion and records `result = blocked`.
- Before the first deletion, eligible cleanup records `result = in_progress`.
- After every attempted operation, the ordered attempt list and resource state are persisted.
- Any failure after an earlier success records `result = partial`.
- `completed` is valid only when every approved target was removed successfully and no operation remains unattempted.
- `partial` and `completed` are factual terminal results for #259; a later session reports them and does not automatically retry or continue cleanup.
