Closes #<coordinator-issue>
Closes #<delivered-child-issue>
Closes #<delivered-child-issue>

Adds <one-sentence summary of the completed coordinator delivery>.

Integrated child traceability:

- #<child-pr-number> for #<child-issue>, integrated as `<commit-sha>`
- #<child-pr-number> for #<child-issue>, integrated as `<commit-sha>`

Changes:

- <important coordinator-level or integrated change>
- <important coordinator-level or integrated change>

Complete implementation validation at `H`:

- Integrated implementation head `H`: `<40-hex-sha>`
- `<complete integrated command or review>` — `passed`
- `<complete integrated command or review>` — `passed`
- Applicability at `H2`: <why the finalization-artifact-only delta cannot invalidate these results>

Artifact-affected validation at `H2`:

- Finalization head `H2`: `<40-hex-sha>`
- Direct-parent proof (`H2^ = H`): `passed`
- `H..H2` sole-artifact delta proof: `passed` — `<finalization-artifact-path>` only
- `<artifact or schema check rerun at H2>` — `passed`
- `git diff --check H..H2` — `passed`
- `git diff --check <target-base-sha>...H2` — `passed`

Integrated scope review:

- Fetched runtime target base: `origin/main` at `<40-hex-base-sha>`
- PR-equivalent merge base: `<40-hex-merge-base-sha>`
- Reviewed range: `<merge-base-sha>...<H2-sha>`
- Coordinator and child source-map reconciliation: `passed`
- Unexplained unrelated changes: `none`

Source, target, and readiness evidence:

- Source branch: `<coordinator-branch>`
- Verified remote source ref: `origin/<coordinator-branch>` equals `H2`
- Target branch: `main`
- Re-fetched `origin/main` SHA still equals the recorded target base: `passed`
- Merge base, `H2` head identity, ancestry, validation freshness, and scope freshness rechecked: `passed`
- Existing same-run final PR check: `<none | current consistent PR URL>`
- Pull request state: `ready for review` (never a draft fallback)

Remaining risks:

- <remaining risk, limitation, or `None`>

Coordinator delivery rules:

- Open or reuse this runtime final PR only when every required result is fresh and `passed`; non-passing or unavailable evidence opens no draft fallback.
- If an existing same-run final PR is stale or inconsistent, stop and report the blocker without creating a duplicate or silently mutating readiness.
- This is the only sidecar PR boundary that targets `main` or uses closing keywords. Child PRs target the coordinator branch and use `Related to` references only.
- Report the observed PR URL and ready state from current GitHub evidence in the final report. Do not write the URL into the branch-bound artifact or create an `H3`/`H4` finalization commit.
- Cleanup remains `ineligible` with reason `pending final PR merge` until this runtime final PR is observed merged and current fetched `origin/main` contains exact `H2` by ancestry; merged metadata alone is insufficient.
- Required merge method: the user performs the merge and selects GitHub's **"Create a merge commit"**.
- **"Squash and merge"** and **"Rebase and merge"** are prohibited because exact `H2` must remain in `main` ancestry so standard non-force local branch deletion can complete.
- Codex must not merge or approve this PR, enable auto-merge, change repository merge settings, separately mutate GitHub issues, or perform branch/worktree cleanup.
- The temporary #258 build-out PR is different: it targets `workflow/sidecar-buildout` and uses `Related to #258`; it does not use this runtime closing-authority template.
