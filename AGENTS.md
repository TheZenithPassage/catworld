# CatWorld Agent Bootstrap

This repository is the `TheZenithPassage/catworld` product and target
repository. `TheZenithPassage/catworld-workflows` is its single workflow
methodology authority.

Before looking for a runtime manifest, select the authority acquisition mode
from host capability:

- Use `projected-local` when an actual local CatWorld checkout is the execution
  target.
- Use `remote-snapshot` only when no local CatWorld runtime filesystem exists
  and the CatWorld repository is available through GitHub or equivalent remote
  repository access.

## Projected-local

Before normal workflow execution:

1. Require `.catworld-workflow/runtime-manifest.json` and
   `.catworld-workflow/AGENTS.md`.
2. Parse the manifest and require a valid `sourcePath`, an exact 40-character
   `sourceSha`, and a `managedFiles` array of unique, safe relative runtime
   paths.
3. Require the recorded source checkout to exist and its current HEAD to
   resolve to the recorded `sourceSha`.
4. Derive the complete canonical target set from tracked regular files at
   `sourceSha`: map source `AGENTS.md` to `.catworld-workflow/AGENTS.md`, and map
   canonical `.agents/skills/**`, `.codex/agents/**`, and `.specify/**` to the
   same target paths, excluding target-local state such as
   `.specify/feature.json`. Require `managedFiles` to equal this set exactly;
   missing, extra, duplicate, or unsafe entries are invalid.
5. For every canonical managed target, require a regular, non-symlink file
   whose bytes exactly match its committed Git blob at `sourceSha`. Map
   `.catworld-workflow/AGENTS.md` to source `AGENTS.md`; map every other target
   to the same relative source path. Read committed blob bytes, never source
   working-tree text.
6. Only after every check succeeds, load and follow the projected authoritative
   `.catworld-workflow/AGENTS.md` for all routing and workflow behavior.

Any missing, stale, invalid, or mismatched projected runtime is a deliberate
local bootstrap stop. Report the failing path when applicable, instruct the
operator to run the external projector and start a fresh Codex session, and
never fall back to remote authority. Manifest absence inside a real local
CatWorld checkout is a local bootstrap failure. Never clone, fetch, pull,
reset, update, or otherwise repair the recorded workflow checkout
automatically.

## Remote-snapshot

Resolve `TheZenithPassage/catworld-workflows` `main` once to one exact
40-character commit SHA. Keep that SHA immutable for the complete invocation,
and load source `AGENTS.md` plus every subsequently required workflow or
support file only from that same SHA. Treat the pinned SHA as the workflow
authority identity and expose it as `workflowSourceSha` whenever reporting is
active.

Never mix authority files from moving `main`, another branch, cached or
historical workflow text, or another environment. Do not require or invent
`.catworld-workflow` state, persist a manually maintained workflow SHA in
CatWorld, ask for local projection, or clone or create a checkout merely to
load authority. If the source repository, exact SHA, or a required same-SHA
file cannot be resolved reliably, stop with an actionable remote-authority
blocker.

## Post-routing capability gate

After the authoritative routing contract is loaded, `remote-snapshot` may
execute exactly these user-facing top-level workflows:

- `catworld-feature-planning`;
- `catworld-refine-issue`;
- `catworld-design-refinement`;
- `catworld-reconcile-contract`; and
- `catworld-review-pr`.

`catworld-implement-issue` and `catworld-implement-parent` remain local-only. If
either is selected in `remote-snapshot`, stop with an execution-capability
blocker requiring an execution-capable local CatWorld checkout with a valid
projected runtime. Do not classify that stop as an authority-acquisition
failure and do not attempt remote implementation.

Always keep the outer CatWorld repository as the product and implementation
target. Never reinterpret the separate `catworld-workflows` repository as that
target or copy workflow-specific semantics into this bootstrap.
