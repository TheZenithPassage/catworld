# Data Model: Final Coordinator Delivery State

No CatWorld application data model changes are introduced. There are no new
domain entities, persistence models, API payloads, schema changes, browser
storage, or external application contracts.

The feature extends structured sidecar workflow state already represented by
coordinator artifacts and current GitHub evidence:

## Finalization Evidence

- Coordinator issue identity and current source references.
- Prepared-child ledger and expected child PR identities.
- Remote and refreshed local coordinator refs and current HEAD.
- Current final PR evidence, blockers, validation requirements, and cleanup
  eligibility.

## Child Terminal State

Each prepared child records:

- issue and artifact identity;
- child PR identity and coordinator target;
- PR merge observation and coordinator-ancestry proof;
- workflow status: `integrated`, `active`, `blocked`, `pending`,
  `dependency-incomplete`, or another factual non-terminal reason;
- validation applicability and freshness.

Finalization requires a complete, unique ledger in which every child is
`integrated`. GitHub issue open/closed state does not replace this state.

## Integrated Validation Record

Each required evidence item records:

- command or manual review identity;
- requirement/source that makes it required;
- evaluated coordinator state (`H`, `H2`, or another factual head) and relevant
  inputs;
- explicit status: `passed`, `failed`, `skipped`, `timed out`, `interrupted`,
  `partial`, `stale`, `blocked`, or `not run`;
- freshness/applicability result;
- output summary and blocking reason when not passed.

Prior attempts remain historical. Exactly one result per requirement and
evaluated coordinator state is current for readiness. Readiness requires every
current required item to be fresh and `passed`.

## Integrated Scope Review

- Fetched target-base ref and SHA (`origin/main` for runtime final delivery).
- PR-equivalent merge base and coordinator head.
- Changed paths and affected surfaces.
- Expected coordinator and child source-map ownership.
- Integrated child PR/issue traceability.
- Explained changes and unresolved unrelated changes.

Any unexplained unrelated change blocks delivery.

## Two-Head Finalization State

- Target-base ref and SHA.
- `H`: literal integrated implementation head where complete required checks
  ran.
- `H2`: `SELF/HEAD`, meaning the direct child commit containing the factual
  finalization artifact; its resolved SHA is verified and reported after
  commit rather than embedded in its own tree.
- Expected parent SHA (`H`) and direct-parent proof.
- Sole allowed `H..H2` artifact path and delta proof.
- Complete checks run at `H`.
- Artifact-affected commands required at `H2`; resolved post-commit statuses
  remain current-evidence/final-report data rather than H2 artifact content.
- Applicability rationale for each `H` result consumed at `H2`.
- H2 readiness `pending H2 checks`, scope result from `H`, and required
  post-H2 scope/base recheck list.
- Final template blob identity and complete render-input requirements; resolved
  render inputs and the rendered-body fingerprint remain external until
  post-H2 evidence exists.
- Normal non-force H2 push result and fetched remote coordinator ref identity.
- Final target-base, merge-base, head, ancestry, validation freshness, and
  existing-PR recheck before creation.

Any additional commit or changed path after `H2` blocks delivery or requires
affected revalidation. No `H3` is created to store the PR URL.

## Final Delivery State

- Stable run/final-delivery identity.
- Source coordinator branch and `main` target.
- Validated integration head `H`, final artifact head `H2`, target-base SHA,
  merge base, and final body fingerprint.
- `ready` or blocking readiness result.
- Integrated child references.
- Validation summary and remaining risks.
- Existing/final PR observation from current GitHub evidence, including URL and
  readiness when it exists.
- Cleanup eligibility `ineligible` with reason `pending final PR merge` until
  merge to `main`.

The artifact records factual `H` results, the complete required H2 command
manifest, pending H2 readiness, H scope result/recheck manifest, and final
template/render-input requirements.
Current validation evidence and the final report record resolved H2 statuses,
final H2 scope/readiness, rendered-body fingerprint, and remote-source proof;
GitHub and the final report supply the observed PR URL after creation without
requiring a new coordinator-branch commit.

## State Transitions

```text
waiting-for-child-integration
  -> finalization-evidence-review
  -> complete-integrated-validation-at-H
  -> artifact-only-finalization-at-H2
  -> artifact-affected-validation-at-H2
  -> integrated-scope-review
  -> ready-to-open
  -> final-pr-opened
  -> waiting-for-final-merge
  -> cleanup-eligible (implemented by later lifecycle work)
```

Any incomplete child, evidence mismatch, non-passing/stale validation, scope
drift, duplicate PR identity, or prohibited-operation requirement transitions
the run to `blocked` and prevents final PR creation.
