# CatWorld Agent Bootstrap

This repository is the CatWorld target and product repository. The authoritative
CatWorld agent and development workflow is installed from
`TheZenithPassage/catworld-workflows`.

Before normal workflow execution:

1. Require `.catworld-workflow/runtime-manifest.json` and
   `.catworld-workflow/AGENTS.md`.
2. Parse the manifest and require a valid `sourcePath`, a full `sourceSha`, and
   valid `managedFiles` evidence for the installed runtime.
3. Require the recorded source checkout to exist and its current HEAD to resolve
   to the recorded `sourceSha`.
4. For every `managedFiles` path, require a regular, non-symlink target file
   whose bytes exactly match its committed Git blob at `sourceSha`. Map
   `.catworld-workflow/AGENTS.md` to source `AGENTS.md`; map every other target
   to the same relative source path. Read committed blob bytes, never source
   working-tree text.
5. Only after these checks, load and follow the installed authoritative
   `.catworld-workflow/AGENTS.md`
   for all routing and workflow behavior.

Always treat the outer current CatWorld checkout or worktree as the
implementation target. Never reinterpret the separate `catworld-workflows`
checkout as that target.

If any bootstrap check fails, do not load the external authority. Stop, report
the missing, invalid, or stale managed path when applicable, and instruct the
operator to run the external projector and then start a fresh Codex session.
Never clone, fetch, pull, reset, update, or otherwise repair the
`catworld-workflows` checkout automatically, and never fall back to embedded or
historical workflow instructions.
