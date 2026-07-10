# Contract: Final Coordinator Validation and PR Delivery

This contract applies only to the future activated sidecar coordinator
`parallel` lifecycle after all child execution layers have completed. It does
not change normal sequential issue implementation, direct child issue
delivery, closed-child sequential coordinator final passes, or the temporary
#258 build-out PR target.

## Finalization Evidence Contract

Before final validation, the coordinator re-reads current GitHub and repository
evidence for the coordinator issue, all prepared child issues and dependencies,
all child PRs, remote and local coordinator state, coordinator and child
artifacts, validation state, blockers, existing final PR state, and cleanup
eligibility. Private conversation context is never a source of truth.

The prepared-child ledger must be complete and unique. Every child PR must:

- target the coordinator branch;
- be merged into that branch;
- have its integrated commit present in refreshed local coordinator ancestry;
- have durable workflow state `integrated` with no active, blocked, pending,
  dependency-incomplete, missing, duplicate, or unexpected child state.

Child GitHub issues may remain open until the final PR merges. Open state does
not prove incompleteness, and closed state does not prove integration.

Any current-evidence mismatch or incomplete ledger stops before integrated
validation, PR rendering, or GitHub mutation.

## Integrated Validation Contract

Once all children are integrated, no additional child layer may start. The
coordinator identifies all validation required by the coordinator issue,
prepared child artifacts, shared contracts, integrated surfaces, and repository
instructions.

Prior attempts remain historical. Each required command or review has exactly
one current readiness record per evaluated coordinator state and relevant
inputs. Status is one of:

- `passed`
- `failed`
- `skipped`
- `timed out`
- `interrupted`
- `partial`
- `stale`
- `blocked`
- `not run`

Unavailable or dishonest-to-run evidence is recorded as `blocked` or `not run`
with a reason. Child evidence may be consumed only when its applicability and
freshness are proven; it never replaces required integrated coordinator
validation. Relevant later changes make affected evidence stale.

Final delivery requires every required item to be fresh and `passed`. There is
no draft final-PR fallback for non-passing evidence.

## Two-Head Finalization Contract

Runtime finalization uses these heads:

- `B`: the freshly fetched `origin/main` target-base SHA;
- `H`: the fully integrated coordinator head where the complete required
  implementation validation runs;
- `H2`: the direct child of `H` containing only the factual
  finalization/coordinator artifact update.

The H2 artifact must record:

- literal `B` and literal `H`;
- `H2` as `SELF/HEAD`, the commit containing the artifact;
- expected parent `H` and the command/evidence used to prove direct ancestry;
- the sole allowed `H..H2` artifact path and delta proof;
- every complete implementation check run at `H` with its truthful status;
- every artifact-affected command that must be rerun at `H2`; the artifact does
  not preclaim post-commit results, and the final report records each resolved
  status after the rerun;
- why the artifact-only delta cannot invalidate each consumed `H` result;
- target-base SHA, merge base, head, ancestry, validation freshness, and
  existing-PR recheck requirements before creation.

The resolved H2 SHA is verified and reported after commit. It is not embedded
literally in its own tree because doing so would require an `H3`. Any
non-artifact path in `H..H2`, any additional commit after `H2`, failed affected
check, changed base/head/merge base, or stale evidence blocks final delivery or
requires the affected validation to rerun. The workflow must not claim the
complete suite ran at `H2` unless it actually did.

After H2 checks pass, push H2 to the remote coordinator branch with a normal
non-force push, fetch that remote ref, and require it to equal H2. A rejected
push or remote mismatch blocks final delivery. Do not force-push, rebase-push,
delete/recreate the branch, or otherwise rewrite history to make H2 remote.

## Integrated Scope Review Contract

Before delivery, fetch current `origin/main` without updating local `main`,
record its SHA and the PR-equivalent merge base, and inspect the coordinator
diff from that merge base. Reconcile every changed path and affected surface
with:

- coordinator issue scope and approved coordinator artifacts;
- child issue scopes, source maps, and integrated child PRs;
- shared contracts and repository source-of-truth documentation.

Unexplained unrelated changes block final delivery and require correction or
explicit resolution followed by affected revalidation. Immediately before PR
creation, re-fetch and recheck the target-base SHA, merge base, `H2`, ancestry,
diff scope, and validation freshness.

## Final PR Contract

Before creation, re-read existing final PR evidence for the same run. Create at
most one final coordinator PR. Reuse an existing same-run PR and update it only
when the approved workflow permits and required evidence is fresh after the
update.

If an existing same-run final PR is stale or inconsistent and no safety
downgrade is explicitly authorized, stop and report the exact base, head, body,
validation, or PR-state blocker and required user action. Do not create a
duplicate or silently mutate readiness. The no-draft-fallback rule prohibits
creating a draft final PR as a substitute for failed readiness; it does not
grant authority to mutate an existing PR.

A newly created final PR must:

- be ready for review;
- source the coordinator integration branch;
- target `main`;
- render `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`;
- identify integrated child PRs or child issue references;
- list integrated validation with explicit statuses and freshness;
- summarize integrated scope review and remaining risks;
- use closing keywords only for the coordinator and delivered child issues.

Child PRs continue to target the coordinator branch and use `Related to`
references only. This #258 build-out PR instead uses fetched
`origin/workflow/sidecar-buildout` as its base/freshness/merge-base reference,
targets `workflow/sidecar-buildout`, and uses `Related to #258`; it is not a
runtime final sidecar PR. Runtime behavior must not substitute that temporary
build-out branch for `main`.

## Current #258 Build-Out Finalization Artifact

The current implementation delivery creates
`specs/032-final-coordinator-delivery/finalization.md` only in H2. Its required
machine-readable body is one fenced JSON object with this schema (illustrative
values shown):

```json
{
  "schema_version": 1,
  "issue_number": 258,
  "base": {
    "ref": "origin/workflow/sidecar-buildout",
    "sha": "<40-hex-B>",
    "merge_base_sha": "<40-hex-merge-base>"
  },
  "implementation_head": {
    "label": "H",
    "sha": "<40-hex-H>"
  },
  "finalization_head": {
    "label": "H2",
    "identity": "SELF/HEAD",
    "expected_parent_sha": "<40-hex-H>",
    "resolved_sha_location": "external-final-report"
  },
  "allowed_delta": [
    {
      "status": "A",
      "path": "specs/032-final-coordinator-delivery/finalization.md"
    }
  ],
  "complete_checks_at_h": [
    {
      "id": "<unique-check-id>",
      "command": "<exact-command>",
      "status": "passed"
    }
  ],
  "h2_required_checks": [
    {
      "id": "<unique-check-id>",
      "command": "<exact-command>"
    }
  ],
  "applicability": [
    {
      "check_id": "<complete-check-id>",
      "reason": "<why the artifact-only delta cannot affect this result>"
    }
  ],
  "scope_at_h": {
    "status": "passed",
    "h2_rechecks": ["target-base", "merge-base", "scope-diff", "head", "ancestry"]
  },
  "template": {
    "path": ".github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md",
    "blob_sha": "<40-hex-template-blob>",
    "render_input_requirements": [
      "coordinator-issue",
      "integrated-child-traceability",
      "complete-h-validation",
      "resolved-h2-validation",
      "scope-review",
      "remaining-risks",
      "source-target-readiness"
    ]
  },
  "readiness": {
    "status": "pending_h2_checks",
    "resolved_status_location": "external-final-report"
  },
  "delivery": {
    "head_branch": "chore/258-implement-final-coordinator-validation-pr-delivery",
    "base_branch": "workflow/sidecar-buildout",
    "issue_reference": "Related to #258",
    "write_pr_url_to_artifact": false,
    "allow_h3": false
  },
  "remaining_risks": [],
  "runtime_contract": {
    "final_target": "main",
    "cleanup_eligibility": "ineligible",
    "cleanup_reason": "pending final PR merge"
  }
}
```

All SHA fields use full 40-hex commit/blob values as appropriate. Check IDs are
unique, every H check is `passed`, H2 check entries have no status field, every
consumed H check has one non-empty applicability reason, and every
`remaining_risks` item is a non-empty string. The schema is closed: every
object must contain exactly the keys shown for its object type, and the
verifier rejects unknown properties recursively, including properties that
would preclaim resolved H2 evidence. The runtime-contract assertions preserve
coordinator-to-`main` delivery and cleanup ineligibility.

This fixed JSON schema is only the current #258 build-out finalization record.
The later runtime artifact contract below may carry stable run identity and
integrated-child traceability in its durable coordinator artifact; those
runtime-only fields are not omitted #258 JSON properties and must not be added
to this closed schema.

For current #258 delivery, `complete_checks_at_h` must contain exactly these
IDs (no omissions or extras):

- `scenario-all-integrated`
- `scenario-incomplete-children`
- `scenario-evidence-mismatch`
- `scenario-integrated-validation`
- `scenario-validation-readiness`
- `scenario-validation-staleness`
- `scenario-two-head-finalization`
- `scenario-scope-drift`
- `scenario-final-pr-delivery`
- `scenario-existing-final-pr`
- `scenario-artifact-final-state`
- `scenario-closing-keyword-isolation`
- `scenario-prohibited-operations`
- `coordinator-source-review`
- `architecture-template-source-review`
- `protected-skills-range-review-at-h`
- `source-map-range-review-at-h`
- `diff-check-b-h`
- `tasks-complete`

`h2_required_checks` must contain exactly these IDs:

- `finalization-evidence-verifier`
- `diff-check-h-h2`
- `diff-check-b-h2`
- `protected-skills-range-review-b-h2`
- `source-map-range-review-b-h2`
- `runtime-template-source-review-h2`
- `remote-head-h2-verification`
- `base-head-merge-base-pr-recheck`

Each ID has one non-empty exact command recorded as audit evidence. The
verifier compares both ID sets for exact equality, rejects duplicate or missing
IDs, requires applicability for every H check, and requires the fixed
render-input requirement set above. The canonical ID sets prove manifest
completeness; the recorded commands remain reviewable audit records rather
than a verifier-owned semantic mapping from every ID to one prescribed command
string.

`verify-finalization-evidence.ps1` accepts `-RepositoryPath`,
`-ArtifactPath`, `-ExpectedBaseSha`, and `-ExpectedImplementationHeadSha`. It
requires a clean index/worktree, resolves actual HEAD as H2, proves HEAD has
exactly one parent equal to H, proves B is an ancestor of H and that
`merge-base B H` equals both B and the artifact's declared `merge_base_sha`,
checks `git diff --name-status H..HEAD` is exactly `A` plus the fixed artifact
path, proves the artifact is absent at H and present at HEAD, runs
`git diff --check H..HEAD`, rejects the literal resolved H2 SHA inside the
artifact, and validates the JSON contract and canonical manifests. It returns
structured JSON on success and nonzero exit on failure. The PR URL, resolved H2
statuses, resolved render inputs, rendered-body fingerprint, and final
readiness remain GitHub/current-evidence/final-report data.

## Artifact and Final Report Contract

Before PR creation, the coordinator artifact factually records:

- stable final-delivery identity;
- source, target, target-base SHA, merge base, validated integration head `H`,
  final artifact head `H2` as `SELF/HEAD`, and expected parent `H`;
- direct-parent and sole-artifact delta evidence;
- integrated child traceability;
- complete validation records from `H`, the required H2 command list,
  applicability rationale for consumed `H` evidence, and the rule that resolved
  H2 records live in current evidence and the final report;
- scope result from H and the required post-H2 scope/base recheck manifest;
- final template blob and complete render-input requirements;
- readiness `pending H2 checks`, readiness criteria, and remaining risks;
- cleanup eligibility `ineligible` with reason `pending final PR merge`.

After PR creation, current GitHub evidence is authoritative for its observed
URL and state. The final report includes the URL, ready status, validation
summary, resolved H2 statuses, final H2 scope review, rendered-body fingerprint,
remote-source proof, integrated child traceability, remaining risks, and
cleanup-ineligible state. The workflow does not create an `H3` or other
post-validation coordinator-branch change solely to store the allocated URL.

## Safety Contract

Final delivery does not:

- merge or approve the final PR;
- enable auto-merge;
- mutate GitHub issues, labels, comments, milestones, or assignees separately;
- start another child layer after final validation begins;
- make cleanup eligible before merge to `main`;
- delete branches/worktrees or perform remote cleanup;
- rebase, force-push, use force-with-lease, or rewrite history;
- alter normal sequential, direct-child, legacy coordinator, or #261 routing
  behavior.

## Validation Contract

Validation covers all-child ancestry, incomplete child states, evidence
mismatch, exact integrated command accounting, every non-passing status,
staleness after HEAD changes, `H`/`H2` direct ancestry and sole-artifact delta,
split complete-versus-affected validation reporting, target-base and merge-base
rechecks, unrelated diff scope, actual final-template rendering, existing final
PR identity and stale-state stop, artifact/final-report state, closing keyword
isolation, cleanup ineligibility, prohibited operations, unchanged out-of-scope
workflow skills, and `git diff --check`.
