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

Before executing any code from the workflow-source checkout, establish this
bounded trust boundary independently using trusted filesystem and Git
operations:

1. Require `.catworld-workflow/runtime-manifest.json` and
   `.catworld-workflow/AGENTS.md`.
2. Read the manifest only after requiring it to be a regular, non-symlink file
   reached through safe, non-symlink directory components. Require `sourcePath`
   to be an absolute path and `sourceSha` to be an exact 40-character Git SHA.
3. Reject path traversal, symlink/junction traversal, and other unsafe source
   paths before using the source checkout. Require `sourcePath` to resolve to
   the root of an existing Git checkout whose repository identity is
   `TheZenithPassage/catworld-workflows`. Require `sourceSha` to directly
   identify a commit and the source checkout's current `HEAD` to equal it.
4. Read `scripts/install-catworld-workflow-runtime.ps1` from that exact commit
   using trusted, read-only Git operations with lazy fetching disabled. Require
   its committed Git entry to be a regular file. Require the corresponding
   working-tree verifier to be a regular, non-symlink file reached through
   safe, non-symlink directory components.
5. Compare the working-tree verifier's raw bytes with its exact committed blob
   bytes. Do not apply Git filters, text or encoding conversion, or line-ending
   normalization. Stop if the entry point cannot be authenticated exactly;
   its expected path or mere existence does not establish trust.

Only after those checks succeed, invoke the authenticated entry point with
PowerShell 7, using the actual CatWorld checkout root and validated manifest
SHA:

```powershell
pwsh -NoProfile -File <authenticated-verifier-path> `
  -TargetRoot <actual-catworld-checkout-root> `
  -VerifyOnly `
  -ExpectedSourceSha <validated-manifest-sourceSha>
```

Require a successful process exit. The canonical verifier's successful result
is authoritative for complete runtime validation: the canonical managed-file
set, manifest/set agreement, committed source blobs, regular non-symlink
projected targets, and exact projected bytes. Do not reconstruct or repeat
those complete managed-file/blob/byte checks in the model. Independent checks
are limited to the bounded source/verifier trust boundary and its stability.

Before loading projected authority, recheck that the safely read manifest,
resolved source checkout/repository identity, recorded commit and source
`HEAD`, and authenticated verifier path, regular-file status and raw bytes
remain consistent with the identities established before invocation. Recheck
the relevant path components for symlinks/junctions as well. If any identity
changed across execution, or stability cannot be established, stop; do not
assume the successful verifier result remains valid.

Only after pre-execution authentication, successful canonical verification,
and stable source/verifier identity, load and follow the projected authoritative
`.catworld-workflow/AGENTS.md` for all routing and workflow behavior.

Any missing, stale, unsafe, invalid, unauthenticated, or mismatched runtime or
workflow source is a deliberate local bootstrap stop. Report the failing
invariant/path when available; instruct the operator to update/project the
external workflow runtime as appropriate and start a fresh Codex session.
Never automatically repair or reproject the runtime, substitute another source
or SHA, or fall back to remote authority. Manifest absence inside a real local
CatWorld checkout is a local bootstrap failure. Never mutate, clone, fetch,
pull, switch, reset, restore, clean, update, or otherwise repair the recorded
workflow-source checkout automatically.

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
