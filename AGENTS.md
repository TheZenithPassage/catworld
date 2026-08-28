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
4. Load and follow the installed authoritative `.catworld-workflow/AGENTS.md`
   for all routing and workflow behavior.

Always treat the outer current CatWorld checkout or worktree as the
implementation target. Never reinterpret the separate `catworld-workflows`
checkout as that target.

If the runtime is missing, invalid, or stale, stop and instruct the operator to
run the external projector. When newly projected project-scoped custom agents
are required, also instruct the operator to start a fresh Codex session after
projection. Never clone, fetch, pull, reset, update, or otherwise repair the
`catworld-workflows` checkout automatically, and never fall back to embedded or
historical workflow instructions.
