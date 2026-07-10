# Feature Specification: Final Coordinator Validation and PR Delivery

**Feature Branch**: `chore/258-implement-final-coordinator-validation-pr-delivery`

**Created**: 2026-07-10

**Input**: GitHub issue #258, "[Workflow] Implement final coordinator validation and PR delivery"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A sidecar coordinator enters final delivery only after current evidence proves every prepared child is integrated and no child remains blocked, active, pending, or otherwise incomplete.
  - **Why this priority**: Final validation and delivery cannot be trustworthy while child work or coordinator state is incomplete or inferred from stale conversation context.
  - **Acceptance Scenarios**:
    1. **Given** all child pull requests have been merged into the remote coordinator branch and local coordinator state has been refreshed from that branch, **When** finalization begins, **Then** the coordinator re-reads current GitHub, repository, branch, artifact, child, blocker, and validation evidence before deciding whether the run is complete.
    2. **Given** a child pull request is not merged into the coordinator branch or a child remains blocked, active, pending, or missing required evidence, **When** finalization evaluates the run, **Then** it stops and reports the incomplete state without beginning final validation or opening the final pull request.
    3. **Given** recorded coordinator artifact state conflicts with current GitHub or repository evidence, **When** finalization evaluates the run, **Then** it stops and reports the mismatch rather than using private conversation context to resolve it.
  - **Validation Evidence**: Finalization simulation covering fully integrated, unmerged, blocked, active, pending, missing-evidence, and evidence-mismatch child states; coordinator artifact review; and `git diff --check`.

- **TO-002**: Final coordinator readiness is based only on fresh, required integrated validation with every check recorded using an explicit truthful status.
  - **Why this priority**: Individually valid child changes can interact after integration, so the coordinator branch itself must provide current evidence before it is offered for final review.
  - **Acceptance Scenarios**:
    1. **Given** all child work is integrated and required validation is known, **When** final coordinator validation runs, **Then** the workflow executes the required integrated commands against the current coordinator branch and records each check as passed, failed, stale, skipped, timed out, interrupted, partial, blocked, or not run.
    2. **Given** child validation evidence remains applicable and fresh for the current integrated coordinator state, **When** final readiness is assessed, **Then** the workflow may consume that evidence while still running all required integrated coordinator validation.
    3. **Given** any required evidence is failed, stale, skipped, timed out, interrupted, partial, blocked, unavailable, or cannot be run honestly, **When** readiness is assessed, **Then** final delivery stops and no ready final coordinator pull request is opened.
    4. **Given** complete integrated validation passed at coordinator head `H`, **When** the coordinator commits the factual finalization artifact as direct child `H2`, **Then** the workflow proves the `H..H2` delta contains only that artifact, preserves the complete implementation results from `H` only when the artifact-only delta cannot affect them, and reruns every artifact-affected check at `H2`.
    5. **Given** any relevant coordinator state changes outside the allowed `H..H2` artifact-only delta, **When** readiness is reassessed, **Then** affected evidence is stale until the required checks are rerun against the updated coordinator state.
  - **Validation Evidence**: Integrated-validation simulations for all-passed, failed, stale, skipped, timed-out, interrupted, partial, blocked, and not-run evidence; a two-head `H`/`H2` ancestry and artifact-only delta simulation; freshness review against current coordinator state; and `git diff --check`.

- **TO-003**: A ready sidecar coordinator opens one traceable final pull request from the coordinator branch to `main` using the final coordinator template and records delivery state without merging or performing cleanup.
  - **Why this priority**: The final pull request is the sole sidecar delivery boundary allowed to target `main` and use issue-closing keywords, so its source, target, content, and safety rules must be explicit.
  - **Acceptance Scenarios**:
    1. **Given** all child work is integrated, all required integrated validation is fresh and passed, and the integrated diff contains no unexplained unrelated changes, **When** final delivery runs, **Then** it opens a ready pull request from the coordinator branch to `main` using the final sidecar coordinator pull request template.
    2. **Given** the final pull request body is prepared, **When** it is reviewed, **Then** it identifies the integrated child pull requests or child issue references, reports validation evidence and remaining risks, and may use closing keywords for the coordinator and delivered child issues.
    3. **Given** a child pull request is prepared by the sidecar workflow, **When** its body is reviewed, **Then** it still targets the coordinator branch and does not use closing keywords; the final coordinator pull request is the only sidecar pull request allowed to target `main` or close delivered issues.
    4. **Given** artifact-affected checks pass at `H2`, **When** the coordinator pushes `H2` with a normal non-force push, re-fetches `origin/main` and the remote coordinator branch, and rechecks the recorded base SHA, merge base, local/remote `H2` identity, ancestry, validation freshness, and existing final PR state, **Then** it opens one ready coordinator-to-`main` pull request only if none of that evidence changed.
    5. **Given** the final pull request opens successfully, **When** final state is reported, **Then** current GitHub evidence supplies the observed pull request URL and readiness without another coordinator-branch commit, and cleanup remains ineligible with reason `pending final PR merge` until merge to `main`.
  - **Validation Evidence**: Final-delivery simulation confirming source and target branches, ready-only gating, final-template content, closing-keyword isolation, child traceability, two-head artifact state, base/head recheck, cleanup ineligibility, and `git diff --check`.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Finalization Blocked? | GitHub Mutation Made? | Reported Outcome | State Preserved or Recorded | Correction Behavior |
|----------------|-----------------------|-----------------------|------------------|----------------------------|---------------------|
| Every child PR is merged into the coordinator branch, local coordinator state is refreshed, and no child is blocked, active, or pending | No | Read-only evidence calls until delivery | Integration complete; proceed to integrated validation | Current evidence is recorded as the source of truth | N/A |
| Any child PR is unmerged or any child is blocked, active, pending, or missing required evidence | Yes | No | Report incomplete child state | Existing branch, PR, issue, and artifact state is preserved | Resume after current evidence proves all children are integrated and complete |
| Current GitHub or repository evidence conflicts with recorded artifact state | Yes | No | Report evidence mismatch | Conflicting evidence is preserved for review | Resolve the mismatch through the approved workflow, then re-read evidence |
| Every required integrated validation check is fresh and passed | No | Final PR creation is allowed after diff review | Validation ready | Explicit passed statuses are recorded against current coordinator state | Revalidate if relevant state changes before delivery |
| Any required check is failed, stale, skipped, timed out, interrupted, partial, blocked, not run, unavailable, or dishonest to claim | Yes | No final PR creation | Report each non-passing status and blocker | Existing evidence is preserved without promotion to passed | Rerun or repair the affected validation, then reassess from current evidence |
| Complete implementation checks pass at `H`, then direct child `H2` changes only the finalization artifact | No after affected checks pass at `H2` and remote source ref is verified at `H2` | Normal non-force H2 push only; no PR mutation until all two-head checks pass | Report checks run at `H`, artifact-affected checks rerun at `H2`, ancestry, allowed delta, and remote source ref | Preserve `H` results only for surfaces the artifact-only delta cannot affect; H2 artifact readiness remains pending until external H2 checks and remote verification pass | Rerun every artifact-affected check at `H2`; any additional path/commit or rejected/incorrect remote ref blocks delivery without force-push |
| Integrated diff contains an unexplained unrelated change | Yes | No final PR creation | Report scope-drift blocker | Diff and artifact state are preserved | Remove or explicitly resolve the unrelated scope before rerunning affected validation |
| All gates pass and no final coordinator PR exists | No | Create one ready final coordinator PR | Report final PR URL, readiness, validation, traceability, and remaining risks | Record final PR state; keep cleanup ineligible with reason `pending final PR merge` | N/A |
| Final coordinator PR already exists and current evidence still supports readiness | No | Reuse the existing PR; update it only when the approved delivery workflow permits | Report current final PR URL and readiness | Preserve one final delivery PR and current artifact state | Revalidate before any allowed readiness-affecting update after relevant changes |
| Existing final coordinator PR evidence is stale or inconsistent | Yes | No duplicate, readiness mutation, or silent update | Report exact stale base, head, body, validation, or PR-state blocker | Preserve current PR and artifact state without claiming readiness | Stop for explicit user action unless a separately approved workflow permits a safety downgrade |

### Edge Cases

- Finalization must re-read current GitHub and repository evidence and must not infer completion from private conversation context.
- A merged child pull request is insufficient if its commit is not present in the current coordinator branch or local coordinator state has not been refreshed from the remote coordinator branch.
- Closed or otherwise inactive child issues do not substitute for proof that their pull requests were merged into the coordinator branch.
- Every child must be accounted for exactly once; missing, duplicate, unexpected, or conflicting child references block finalization.
- Final validation must not begin while another child layer could still start, and no additional child layer may start after final validation begins.
- Child validation may be consumed only when it remains applicable and fresh; it never replaces required integrated coordinator validation.
- A later change to the coordinator branch, validation inputs, final pull request content that affects the delivery claim, or relevant source-of-truth artifact makes affected evidence stale until rerun.
- Complete validation at `H` must not be claimed at `H2`; only unaffected `H` evidence may be consumed after direct-parent and artifact-only delta proof, and every artifact-affected check must actually rerun at `H2`.
- The finalization artifact identifies `H2` as the self/HEAD commit containing that artifact, records literal `H` as its parent, and the resolved `H2` SHA is verified and reported after commit without creating an `H3` self-reference loop.
- H2 stores a machine-readable rerun manifest with readiness `pending H2 checks`, the scope result from `H`, required post-H2 scope/base rechecks, the final template blob identity, and the render-input requirements; resolved H2 statuses, final scope/readiness, resolved render inputs/body fingerprint, and remote-ref evidence remain external.
- Failed, stale, skipped, timed-out, interrupted, partial, blocked, unavailable, and not-run checks must not be summarized as passed or omitted from the final report.
- An unrelated integrated change or unexplained scope outside the coordinator and child contracts blocks final delivery.
- The final coordinator pull request must source the coordinator branch and target `main`; child branches must continue to target the coordinator branch.
- Closing keywords may appear only in the final coordinator pull request, never in child pull requests or this temporary #258 build-out pull request.
- Final pull request creation must not merge the pull request, approve it, enable auto-merge, mutate issues separately, or perform remote cleanup.
- Cleanup eligibility remains `ineligible` with reason `pending final PR merge` after final pull request creation and changes only after merge to `main` is observed by the separately scoped lifecycle workflow.
- The temporary #258 implementation branch and pull request target `workflow/sidecar-buildout`; future coordinator-to-`main` lifecycle text describes the activated sidecar workflow rather than this build-out delivery strategy.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Finalization MUST re-read current GitHub and repository evidence before deciding that a sidecar coordinator run is complete, including coordinator issue and branch state, listed child issues and dependencies, child pull request state and merge target, local and remote coordinator branch state, coordinator and child artifacts, validation freshness, blockers, final pull request state, and cleanup eligibility.
- **TR-002**: Finalization MUST NOT use private conversation context as a source of truth.
- **TR-003**: Finalization MUST verify every prepared child pull request is merged into the coordinator branch and represented in the refreshed local coordinator state.
- **TR-004**: Finalization MUST verify no child remains blocked, active, pending, dependency-incomplete, missing required evidence, or otherwise eligible for another execution layer.
- **TR-005**: Finalization MUST stop and report a blocker when current evidence conflicts with recorded artifact state or when child accounting is missing, duplicated, unexpected, or inconsistent.
- **TR-006**: Final validation MUST run only after all child integration and completion checks pass, and no additional child layer may start after final validation begins.
- **TR-007**: Final validation MUST identify and execute all required integrated coordinator validation commands against the current integrated coordinator branch.
- **TR-008**: Final validation MUST preserve prior attempts as historical evidence while recording exactly one current readiness result per required check and evaluated coordinator state, using an explicit truthful status of passed, failed, stale, skipped, timed out, interrupted, partial, blocked, or not run, together with enough command and branch-state evidence to evaluate freshness.
- **TR-009**: Child validation evidence MAY be consumed only when it remains applicable and fresh for the current integrated coordinator state, and it MUST NOT replace required integrated coordinator validation.
- **TR-010**: Relevant changes after validation MUST mark affected evidence stale until the required checks are rerun.
- **TR-011**: A failed, stale, skipped, timed-out, interrupted, partial, blocked, unavailable, not-run, or otherwise unverifiable required check MUST block final pull request creation and MUST NOT be summarized as passed.
- **TR-012**: Finalization MUST fetch current `origin/main` without updating local `main`, record its target-base SHA and the PR-equivalent merge base, inspect the integrated coordinator diff against the coordinator issue, child issues, approved artifacts, and source maps, and stop on unexplained unrelated changes.
- **TR-013**: The final coordinator pull request MUST be opened only when all integration, validation, freshness, and scope-drift gates pass.
- **TR-014**: The final coordinator pull request MUST source the coordinator branch, target `main`, be ready for review, and use the repository's final sidecar coordinator pull request template.
- **TR-015**: The final coordinator pull request body MUST identify integrated child pull requests or child issue references, include fresh integrated validation evidence, distinguish remaining risks, and may use closing keywords for the coordinator and delivered child issues.
- **TR-016**: Child pull requests MUST continue to target the coordinator branch, MUST NOT target `main`, and MUST NOT use closing keywords; only the final coordinator pull request may do so.
- **TR-017**: The workflow MUST create at most one final coordinator pull request for the run, MUST re-read existing final pull request state before delivery, and MAY update an existing same-run final pull request only when the approved delivery workflow permits the update and required validation is fresh afterward. If an existing final pull request is stale or inconsistent and no safety downgrade is explicitly authorized, the workflow MUST stop and report the required user action without creating a duplicate or silently mutating readiness.
- **TR-018**: Runtime finalization MUST use a two-head sequence: execute the complete required integrated implementation validation at `H`; create direct child `H2` containing only the factual finalization/coordinator artifact update; record the fetched `origin/main` base SHA, `H`, self/HEAD identity for `H2`, `H`-to-`H2` ancestry, sole allowed artifact path, the complete canonical H check manifest and results, the complete canonical H2 rerun manifest, readiness `pending H2 checks`, scope result from `H`, required post-H2 scope/base rechecks, final template blob identity and render-input requirements, and why unaffected `H` evidence remains applicable; and rerun every artifact-affected check at `H2`, recording actual post-commit statuses, final scope/readiness, resolved render inputs/body fingerprint, and remote-ref evidence in current evidence and the final report rather than preclaiming them in H2. The workflow MUST push H2 to the remote coordinator branch with a normal non-force push and verify the fetched remote source ref equals H2; rejection or mismatch blocks without force or history rewriting. Before creation, it MUST re-fetch `origin/main` and the remote coordinator branch and recheck base SHA, merge base, local/remote `H2`, ancestry, diff scope, validation freshness, and existing PR state. After creation, current GitHub evidence and the final report MUST provide the observed URL/readiness without another coordinator-branch commit, and cleanup MUST remain `ineligible` with reason `pending final PR merge`.
- **TR-019**: Final delivery MUST NOT merge the final pull request, approve it, enable auto-merge, mutate GitHub issues separately, delete local or remote branches/worktrees, or perform remote cleanup.
- **TR-020**: Validation MUST simulate all children integrated into a coordinator branch, merged metadata without ancestry, wrong child PR target, all required status classes, two-head `H`/`H2` ancestry and artifact-only delta handling, invalid merge-parent/extra-path/H3/self-marker/applicability cases, H2 normal-push and remote-ref verification, readiness gating, fetched-`origin/main` base/merge-base rechecks, integrated diff review, final template rendering, coordinator-to-`main` source/target selection, closing-keyword isolation, child traceability, final artifact state, cleanup ineligibility, and explicit-range `git diff --check`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld sidecar coordinator workflow skills, sidecar-specific source-of-truth documentation, templates, local simulations, tests, and related workflow artifacts required for issue #258.
- **SB-002**: Feature MUST build on the integrated sidecar preparation, child execution, pull request delivery, and merge-aware resume behavior from issues #249 through #257 as available on `workflow/sidecar-buildout`.
- **SB-003**: Feature MUST preserve normal sequential issue implementation behavior outside explicit sidecar `parallel` coordinator workflow activation.
- **SB-004**: Feature MUST distinguish the temporary build-out branch integration strategy from the future activated coordinator branch lifecycle.
- **SB-005**: Feature MUST NOT introduce CatWorld application runtime, frontend, backend, persistence, authorization, security, database migration, deployment, or product behavior changes.

### Out of Scope

- Merging the final coordinator pull request.
- Approving the final coordinator pull request or enabling auto-merge.
- Closing or otherwise mutating GitHub issues separately from final pull request closing keywords.
- Remote cleanup, branch deletion, worktree deletion, or changing cleanup eligibility before merge to `main`.
- Starting additional child layers after final validation begins.
- Product implementation outside integrated child scopes.
- Activating sidecar coordinator routing before the separately scoped activation issue.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Finalization Evidence**: Current GitHub, repository, branch, artifact, child, blocker, validation, pull request, and cleanup data used to decide whether final coordinator validation may begin.
- **Child Integration Ledger**: Complete accounting of prepared child issues and pull requests, their coordinator-branch merge status, refreshed local integration state, dependency completion, and active, blocked, pending, or complete state.
- **Integrated Validation Record**: Per-command evidence tied to the current coordinator state with an explicit status, freshness/applicability result, and any blocking explanation.
- **Integrated Scope Review**: Comparison of the coordinator branch diff with coordinator and child issue scope, approved artifacts, source maps, and expected integrated child pull requests.
- **Two-Head Finalization State**: Fetched `origin/main` target-base SHA, validated integrated head `H`, direct artifact-only child `H2`, self/HEAD identity and literal parent proof, allowed delta path, complete canonical H check results, complete canonical H2 rerun manifest with pending readiness, applicability rationale, final template blob/render-input requirements, resolved external H2 evidence/body fingerprint, remote-source H2 verification, and final base/head/merge-base freshness recheck.
- **Final Coordinator Pull Request State**: The unique final delivery pull request's validated artifact identity plus its observed GitHub URL, source coordinator branch, `main` target, ready status, template content, closing references, child traceability, validation summary, and remaining risks.
- **Cleanup Eligibility State**: Durable `ineligible` state with reason `pending final PR merge`, proving cleanup is not permitted merely because the final pull request exists and may become eligible only after merge to `main` is observed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Finalization simulation verifies a run proceeds only when every prepared child pull request is merged into the coordinator branch, local coordinator state is refreshed, and no child is blocked, active, pending, missing evidence, or dependency-incomplete.
- **SC-002**: Integrated-validation simulation verifies all required commands run against current coordinator state and every result is recorded explicitly as passed, failed, stale, skipped, timed out, interrupted, partial, blocked, or not run.
- **SC-003**: Negative validation simulations verify any required non-passing or unverifiable status prevents creation of a ready final coordinator pull request.
- **SC-004**: Scope review simulation verifies unexplained unrelated integrated changes block final delivery.
- **SC-005**: Final-delivery simulation verifies the unique ready pull request sources the coordinator branch, targets `main`, uses the final coordinator template, identifies integrated children, contains closing keywords only at this final boundary, and reports validation and remaining risks.
- **SC-006**: Two-head finalization review verifies complete validation ran at `H`, `H2` directly descends from `H`, `H..H2` changes only the allowed finalization artifact, every artifact-affected check reran at `H2`, unaffected `H` evidence has an explicit applicability reason, normal non-force push made the remote coordinator ref equal H2, the fetched base/head/merge-base evidence is current immediately before creation, GitHub/final reporting supplies resolved H2 statuses, readiness, rendered-body fingerprint, and observed URL without an `H3`, and cleanup remains ineligible pending merge to `main`.
- **SC-007**: Source review confirms the finalization path does not merge or approve the final pull request, enable auto-merge, mutate issues separately, start new child layers, perform cleanup, rewrite history, or allow child branches to target `main`.
- **SC-008**: `git diff --check` reports no whitespace errors.

## Assumptions

- Issue #257's merge-aware resume implementation is integrated into `workflow/sidecar-buildout` and provides the refreshed coordinator and child evidence on which finalization builds, even though issue closure is intentionally deferred.
- Existing sidecar artifacts and source-of-truth documentation define the prepared child set, validation records, blocker state, final pull request state, and cleanup eligibility that this feature extends rather than replacing them with a new persistence mechanism.
- Local simulations may represent GitHub pull request merge and creation outcomes where exercising live final coordinator delivery would mutate repository state outside issue #258's implementation validation.
- The active implementation branch for this issue starts from `origin/workflow/sidecar-buildout`, its delivery pull request targets `workflow/sidecar-buildout`, and that temporary build-out pull request uses `Related to #258`; future sidecar final coordinator pull requests still source a coordinator branch, target `main`, and may use closing keywords.
- For the current #258 implementation delivery only, `B` means the fetched `origin/workflow/sidecar-buildout` SHA, `H` means the fully implemented and completely validated #258 head, and `H2` means the direct artifact-only finalization child used for the build-out PR. Runtime sidecar simulations use the same sequencing shape but retain `origin/main` as their future final target base.
