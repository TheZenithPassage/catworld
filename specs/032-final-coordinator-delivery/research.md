# Research: Final Coordinator Validation and PR Delivery

## Decision: Extend existing sidecar workflow sources and validation patterns

**Decision**: Implement #258 by updating the existing sidecar coordinator
skill, architecture source text, final coordinator PR template/README, and a
feature-local contract, quickstart, and PowerShell simulation.

**Rationale**: The current build-out already represents sidecar execution as
Codex skill procedures, repository templates, durable artifacts, and temporary
Git/state simulations. The gap is executable finalization logic, not a missing
runtime platform.

**Alternatives considered**:

- Add a repository-local finalizer command: unnecessary new command and
  maintenance surface before the sidecar is activated.
- Add GitHub Actions or an external orchestration service: exceeds the issue,
  adds credentials and operational ownership, and weakens local reviewability.

## Decision: Prove child completion from workflow state and Git ancestry

**Decision**: Finalization requires a complete, unique prepared-child ledger;
every child PR merge must be present in refreshed coordinator ancestry; and no
child workflow state may remain active, blocked, pending,
dependency-incomplete, missing, duplicate, or unexpected. GitHub issue
open/closed state is evidence to re-read but is not integration proof.

**Rationale**: Sidecar child PRs intentionally use `Related to`, so child
issues normally remain open until the final coordinator PR merges. Conversely,
a closed issue does not prove its commit is integrated.

**Alternatives considered**:

- Require child issues to be closed: contradicts the approved sidecar PR model.
- Trust merged PR metadata alone: insufficient until refreshed coordinator
  ancestry contains the merge.

## Decision: Bind integrated validation to current coordinator state

**Decision**: Enumerate every required integrated command, preserve prior
attempts as history, record exactly one current readiness result per requirement
and evaluated coordinator state, and allow readiness only when every required
item is fresh and passed. Unavailable or dishonest-to-
run evidence maps to canonical `blocked` or `not run` with a reason. Child
evidence may be consumed only when applicable and fresh and never replaces
required integrated coordinator validation.

**Rationale**: Integration can invalidate child-only results, and the existing
sidecar contract already defines exhaustive truthful statuses and staleness.

**Alternatives considered**:

- Reuse all child validation without integrated reruns: fails #258's integrated
  validation requirement.
- Open a draft final PR for non-passing evidence: contradicts ready-only final
  delivery and confuses final coordinator behavior with child draft behavior.

## Decision: Review the PR-equivalent integrated diff before delivery

**Decision**: Fetch current `origin/main` without updating local `main`, record
the target-base SHA and merge base, compare the coordinator branch using the
PR-equivalent merge-base diff, then reconcile changed paths and surfaces with
the coordinator issue, child issues, approved artifacts, child PRs, and
combined source maps. Re-fetch and recheck base/head/merge-base evidence
immediately before PR creation. Unexplained scope or relevant movement blocks
delivery.

**Rationale**: A fully integrated branch can contain unrelated work even when
each child report looked valid. Reviewer-facing final delivery needs one final
scope check.

**Alternatives considered**:

- Trust child PR file lists only: misses coordinator-level and accidental
  integrated changes.
- Compare only the latest commit: misses earlier integrated child content.

## Decision: Use one ready final PR and the existing final template

**Decision**: Re-read current PR evidence, avoid duplicate same-run final PRs,
render `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`,
and create one ready PR from the coordinator branch to `main` only after all
gates pass. Closing keywords are confined to that final template. An existing
same-run PR may be updated only when the approved workflow permits and evidence
is revalidated. If an existing final PR is stale or inconsistent and no safety
downgrade is explicitly authorized, stop and report the required user action
without duplicating the PR or silently mutating readiness.

**Rationale**: This preserves the established child-to-coordinator versus
coordinator-to-`main` delivery boundary and provides traceability for reviewers.

**Alternatives considered**:

- Generate an ad hoc body: risks losing closing, traceability, validation, or
  risk sections.
- Always create a new PR on resume: duplicates the final delivery boundary.

## Decision: Use two heads for factual artifact state and fresh validation

**Decision**: Run the complete required integrated implementation checks at
`H`. Create direct child `H2` containing only the finalization/coordinator
artifact. The artifact records the target-base SHA, literal `H`, `H2` as the
`SELF/HEAD` commit containing the artifact, expected parent `H`, the sole
allowed artifact path, checks run at `H`, artifact-affected checks to rerun at
`H2`, and why the artifact-only delta cannot invalidate unaffected `H`
evidence. Prove direct ancestry and the sole-path delta, then rerun every
artifact-affected check at `H2`. Push H2 normally, fetch the remote coordinator
ref, and require it to equal H2 before PR creation; rejection blocks without
force or history rewriting. After PR creation, GitHub and the final report
provide the observed URL; do not create an `H3` merely to write it back.

**Rationale**: A factual artifact written after validation changes the branch
head. The approved two-head sequence makes that change explicit and validates
its impact without claiming the full suite ran at `H2`. `SELF/HEAD` is required
because a commit cannot embed its own literal SHA without another commit.

**Alternatives considered**:

- Open draft, write URL, revalidate, then mark ready: the issue permits final PR
  creation only when ready.
- Write factual readiness at `H` without a second head: impossible because the
  result is not factual until validation completes.
- Open ready, commit URL, and leave prior evidence unchanged: creates an `H3`
  and falsely treats a changed coordinator branch as still validated.

## Decision: Record stable template identity and defer resolved render evidence

**Decision**: H2 records the final template blob identity and the complete
render-input requirements available at H2. Actual resolved H2 statuses, final
scope/readiness, resolved render inputs, the rendered PR body, and its
fingerprint are current-evidence/final-report data after post-H2 checks.

**Rationale**: A final rendered body that includes post-H2 statuses cannot
exist factually inside H2 without predicting results or creating H3.

**Alternatives considered**:

- Store the final rendered-body fingerprint in H2: self-invalidating because
  the body depends on evidence resolved after H2 exists.
- Store an input-manifest hash without the canonical manifest/encoding: not
  recomputable and therefore not useful evidence.
- Omit all template evidence: weakens proof that the approved runtime template
  and exact inputs were used.

## Decision: Keep build-out delivery separate from runtime final delivery

**Decision**: The current #258 implementation uses fetched
`origin/workflow/sidecar-buildout` as `B`, freshness and merge-base reference,
and PR target. Its PR uses `Related to #258`. The future runtime workflow uses
fetched `origin/main` as its target-base reference, opens coordinator branch to
`main`, and may use final coordinator closing keywords.

**Rationale**: `workflow/sidecar-buildout` is temporary integration for issues
#251–#261 and is not part of activated sidecar runtime semantics.

**Alternatives considered**:

- Use `origin/main` for current #258 delivery: violates the approved build-out
  integration strategy.
- Change runtime final PRs to target `workflow/sidecar-buildout`: would encode a
  temporary implementation branch into the future workflow contract.

## Decision: Validate with temporary Git and in-memory GitHub models

**Decision**: Use a feature-local PowerShell harness with temporary Git
repositories for ancestry, two-head finalization, freshness, and diff behavior,
plus in-memory PR/artifact objects, actual template rendering, and a focused
current-delivery finalization artifact verifier.

**Rationale**: This matches issues #254–#257, proves Git-sensitive behavior,
and avoids live issue, branch, PR, merge, or cleanup mutation.

**Alternatives considered**:

- Use real GitHub PRs as fixtures: outside validation authority and mutates
  shared state.
- Use text review alone: insufficient for ancestry, staleness, and scope-diff
  gates.
