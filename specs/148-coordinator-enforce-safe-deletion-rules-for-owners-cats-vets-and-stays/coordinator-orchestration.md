# Sidecar coordinator orchestration: issue #148

## Stable run identity

| Field | Value |
|---|---|
| run_id | sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6 |
| Repository | TheZenithPassage/catworld |
| Git common directory | C:\\Users\\moshe\\Desktop\\catworld\\.git |
| Control checkout | C:\\Users\\moshe\\Desktop\\catworld |
| Control checkout branch | main |
| Control checkout state | clean; unchanged at a36164a2d50f4d797f147f8885abee03ebc4c8cf |
| Immutable control-plane source revision | a36164a2d50f4d797f147f8885abee03ebc4c8cf |
| Source ref | fetched origin/main |
| Current phase | prepared artifacts complete; initial coordinator commit pending |
| Artifact freeze | not reached; H2 does not exist |

This exact run ID is the ownership key for every branch, worktree, artifact,
dispatch record, resume check, and any later Git-common-directory cleanup
journal. No resource from another run may be inferred from a matching name.

## Coordinator classification and authorization

- Coordinator issue: #148, [Backend] Enforce safe deletion rules for owners,
  cats, vets and stays.
- URL: https://github.com/TheZenithPassage/catworld/issues/148
- State: open.
- Labels: backend, database, security, feature.
- Classification: coordinator issue with listed implementation children.
- Parent epic: #139.
- Requested route: explicit parallel sidecar route.
- Exclusion check: #148 is not in the #220 through #234 sequential-only range.
- Repository merge policy: merge commits are enabled. User-owned child merges
  must use GitHub Create a merge commit; squash and rebase merges are prohibited.
- Authorization result: passed before mutation. Required coordinator, child,
  dependency, repository, architecture, and source-of-truth context was readable,
  current, consistent, unique, and safe.
- GitHub issue mutation: not approved.
- Public GitHub comments: not approved.
- PR merge, approval, and auto-merge: user-only; not approved for Codex.
- Remote branch cleanup: not approved.

## Sources inspected

- Issue #148 and child issues #195, #196, #197, and #198.
- Parent epic #139.
- Shared deletion authorization issue #147 and its implemented artifacts under
  specs/009-deletion-authorization-policy/.
- Completed safe stay deletion issue #195 and its implemented artifacts under
  specs/010-safe-stay-deletion/.
- Frontend deletion coordinator #150, which makes action visibility subject to
  both role eligibility and entity integrity.
- Cat photo storage issue #153, which remains open and is not present in the
  control revision.
- Activated sidecar workflow issues #220 through #234 and #249 through #261.
- AGENTS.md, .specify/memory/constitution.md, docs/ARCHITECTURE.md, the current
  backend source, tests, Flyway schema, and sidecar PR templates.
- Child PR template blob:
  c906255b39517bcb4462e0406b6dc47e8a97cff3.
- Final PR template blob:
  7fce414494c942c9979f5ac11cdd53985423de3a.

## Child issue map and artifact preparation

| Issue | State | Role | Hard dependencies | Artifact path | Preparation | Handoff | Launch | Non-launch reason |
|---|---|---|---|---|---|---|---|---|
| #195 Safe stay deletion | closed | preserved completed scope | none | specs/010-safe-stay-deletion/ | existing and preserved | not applicable | not applicable | Closed scope is already integrated and must not be reimplemented. |
| #196 Block cat deletion when stay history exists | open | layer 1 implementation | none | specs/196-block-cat-deletion-when-stay-history-exists/ | prepared | pending | pending | Initial coordinator push, child Git context, and durable held-dispatch barrier are pending. |
| #198 Block vet deletion while cats reference it | open | layer 1 implementation | none | specs/198-block-vet-deletion-while-cats-reference-it/ | prepared | pending | pending | Initial coordinator push, child Git context, and durable held-dispatch barrier are pending. |
| #197 Block owner deletion while cats or stays reference it | open | layer 2 implementation and combined architecture summary | #196, #198 | specs/197-block-owner-deletion-while-cats-or-stays-reference-it/ | prepared | pending | pending | Waits for both layer 1 PRs to be user-merged into the coordinator branch. |

The prepared open-child set is exactly #196, #197, and #198. Issue #195 is
accounted for once as preserved terminal context. Its implementation is present
on main through commit b4fc5fb and is not a sidecar child for this run.

## Shared implementation contract

The following contract is complete and has no unresolved shared-contract
decision:

1. Each response canDelete value is a rendering hint equal to shared deletion
   authorization eligibility AND absence of the entity-specific blocking
   relationship.
2. DELETE remains authoritative and recomputes all checks. The required order is
   lookup, shared authorization, relationship existence check, delete plus
   flush, then success.
3. Lookup failure remains 404. Authorization failure remains 403 and occurs
   before relationship probing. A known blocking relationship is 409.
4. A concurrent reference, persistence constraint, or optimistic race detected
   by delete or flush is translated locally to ConflictException and returns
   409.
5. Existing foreign keys remain the final integrity protection. There is no
   cascade cleanup, entity relationship redesign, or migration in this scope.
6. DeletionAuthorizationPolicy, GlobalExceptionHandler, SecurityConfig, shared
   exceptions, and completed stay deletion behavior are reused unchanged.
7. Issue #153 photo cleanup is not applicable to #196 at this control revision
   because the photo-storage feature has not landed. The child must preserve it
   if it appears after an authorized refresh, but must not invent it now.
8. Frontend implementation is outside all three backend child scopes.

Entity-specific blocking relationships:

- #196: any StayCat row for the cat, including historical and cancelled stays.
- #198: any Cat row referencing the vet.
- #197: any Cat row or direct Stay row referencing the owner.

## Dependency layers and conflict control

### Layer 1

- #196 and #198 are independent candidates and may be held-preflighted and then
  released together only after the two-phase evidence barrier passes.
- #196 owns a new focused StayCatRepository relationship query so it does not
  edit CatRepository.
- #198 owns a VetRepository-local relationship query so it does not edit
  CatRepository.
- Neither child owns docs/ARCHITECTURE.md.

### Layer 2

- #197 is dependency-ready only after both #196 and #198 child PRs are observed
  merged into the remote coordinator branch with Create a merge commit, the
  local coordinator worktree is refreshed safely, and exact delivered commits
  are proven in ancestry.
- #197 uses an OwnerRepository-local cat check and
  StayRepository.existsByOwner_Id. It owns the combined #148 architecture
  documentation summary after consuming the integrated layer 1 contract.
- The layer dependency exists to serialize the shared documentation/integrated
  summary and prevent sibling overlap; #197 must not redo #196 or #198 code.

### Conflict and blocker classification

| Category | Current state | Evidence or action |
|---|---|---|
| Child-specific | none | All three scopes are implementable from current source. |
| Coordinator-wide | none | Classification, paths, merge policy, and control revision are established. |
| Shared-contract | none | Effective canDelete and DELETE ordering are fixed above. |
| Conflict | controlled | Repository and documentation ownership is split by layer and source map. |
| Human-only | pending later | User must review and merge child PRs with Create a merge commit. |

## Child-owned source maps

### #196

- CatService, CatResponseDTO, and CatMapper.
- New focused StayCatRepository with a cat-reference existence query.
- CatServiceTest and CatControllerTest.
- New CatMapperTest and CatDeletionPersistenceTest.
- CatController and ICatService production contracts are inspected but expected
  to remain unchanged.

### #198

- VetService, VetRepository, VetResponseDTO, and VetMapper.
- VetServiceTest and VetControllerTest.
- New VetMapperTest and VetDeletionPersistenceTest.
- VetController and IVetService production contracts are inspected but expected
  to remain unchanged.

### #197

- OwnerService, OwnerRepository, StayRepository, OwnerResponseDTO, and
  OwnerMapper.
- OwnerServiceTest and OwnerControllerTest.
- New OwnerMapperTest and OwnerDeletionPersistenceTest.
- docs/ARCHITECTURE.md for the combined #148 deletion-integrity summary.
- OwnerController and IOwnerService production contracts are inspected but
  expected to remain unchanged.

Shared caution surfaces are DeletionAuthorizationPolicy, exception mapping,
SecurityConfig, CatRepository, entities, Flyway migrations, stay deletion code,
frontend code, and the PR templates. No child may change them unless current
evidence exposes a blocker and the coordinator records a new authorized scope.

## Branch and worktree plan

| Resource | Planned or actual value | State and ownership |
|---|---|---|
| Coordinator local branch | sidecar/148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays | created from exact origin/main a36164a2d50f4d797f147f8885abee03ebc4c8cf; owned by this run |
| Coordinator remote branch | origin/sidecar/148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays | pending initial normal non-force push |
| Coordinator worktree | C:\\cw-sidecars\\sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6\\148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays | created, clean, exact branch association, artifact write boundary |
| #196 local branch | sidecar/196-block-cat-deletion-when-stay-history-exists | planned from the pushed coordinator preparation head |
| #196 remote branch | origin/sidecar/196-block-cat-deletion-when-stay-history-exists | planned; absent |
| #196 worktree | C:\\cw-sidecars\\sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6\\196-block-cat-deletion-when-stay-history-exists | planned and absent |
| #198 local branch | sidecar/198-block-vet-deletion-while-cats-reference-it | planned from the pushed coordinator preparation head |
| #198 remote branch | origin/sidecar/198-block-vet-deletion-while-cats-reference-it | planned; absent |
| #198 worktree | C:\\cw-sidecars\\sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6\\198-block-vet-deletion-while-cats-reference-it | planned and absent |
| #197 local branch | sidecar/197-block-owner-deletion-while-cats-or-stays-reference-it | planned only after layer 1 integration |
| #197 remote branch | origin/sidecar/197-block-owner-deletion-while-cats-or-stays-reference-it | planned only after layer 1 integration; absent |
| #197 worktree | C:\\cw-sidecars\\sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6\\197-block-owner-deletion-while-cats-or-stays-reference-it | planned and absent |

The first attempted coordinator parent under
C:\\Users\\moshe\\Desktop\\catworld-sidecar-worktrees was rejected by Git
because repository-relative paths exceeded the Windows filename limit. Git
removed the failed worktree association and target. The remaining empty parent
is not a branch worktree. The shorter workflow-context parent above was checked
for collisions before creation; every deterministic directory component remains
unchanged.

## Two-phase dispatch ledger

No implementation or delivery permission is granted by this artifact state.
Every permission remains false until exact remote evidence and stable held-child
identity checks pass.

### #196

- Artifact state: prepared.
- Dependency layer: 1; hard dependencies: empty.
- Prepared-handoff fingerprint: pending.
- Handoff-ready evidence SHA R: pending.
- Remote recording head Rr containing R: pending.
- Stable held dispatch identity: pending.
- Held preflight zero-edit result: pending.
- Factual launch state: pending.
- Launched evidence SHA L: pending.
- Remote activation/recording head Lr containing L: pending.
- Implementation permission: false.
- Delivery permission: false.
- Targeted release: not sent.

### #198

- Artifact state: prepared.
- Dependency layer: 1; hard dependencies: empty.
- Prepared-handoff fingerprint: pending.
- Handoff-ready evidence SHA R: pending.
- Remote recording head Rr containing R: pending.
- Stable held dispatch identity: pending.
- Held preflight zero-edit result: pending.
- Factual launch state: pending.
- Launched evidence SHA L: pending.
- Remote activation/recording head Lr containing L: pending.
- Implementation permission: false.
- Delivery permission: false.
- Targeted release: not sent.

### #197

- Artifact state: prepared.
- Dependency layer: 2; hard dependencies: #196 and #198.
- Dispatch and all evidence: pending dependency integration.
- Implementation permission: false.
- Delivery permission: false.

Canonical fingerprints will use the workflow-defined ordered 21-field payload,
UTF-8 compact JSON, and lowercase SHA-256. They will be computed only after the
actual child branch/worktree associations exist.

## Pull request delivery contract

- Child PR base: the coordinator branch, never main.
- #196 PR body reference lines, exactly and with no other issue number:
  Related to #196; Related to #148.
- #198 PR body reference lines, exactly and with no other issue number:
  Related to #198; Related to #148.
- #197 PR body reference lines, exactly and with no other issue number:
  Related to #197; Related to #148.
- Child PRs may be ready only when all required validation at the exact delivered
  head is fresh and passed with no blocker. Otherwise they are draft/not-ready.
- User merge method for every child PR: Create a merge commit. Squash and rebase
  merges are prohibited.
- Final coordinator PR base: main. Its closure authority is Closes #148 only
  after every child is terminal and integrated and all final gates pass.
- Codex will not merge, approve, enable auto-merge, mutate issues, post public
  comments, or delete remote branches.

## Validation plan and reporting

Each child must record exactly one current status for every requirement at its
evaluated head. Allowed statuses are passed, failed, skipped, timed out,
interrupted, partial, stale, blocked, and not run. Non-passing evidence is never
summarized as passing.

| Scope | Required current evidence | Current status |
|---|---|---|
| #196 | focused cat service/controller/mapper/persistence tests | not run |
| #196 | ./mvnw verify | not run |
| #196 | clean MySQL/Flyway Docker startup and FK behavior | not run |
| #198 | focused vet service/controller/mapper/persistence tests | not run |
| #198 | ./mvnw verify | not run |
| #198 | clean MySQL/Flyway Docker startup and FK behavior | not run |
| #197 | focused owner service/controller/mapper/persistence tests | not run |
| #197 | ./mvnw verify | not run |
| #197 | clean MySQL/Flyway Docker startup and both FK paths | not run |
| Coordinator | combined source-map and unexplained-scope review | pending |
| Coordinator | integrated ./mvnw verify | pending |
| Coordinator | integrated clean MySQL/Flyway Docker startup | pending |
| Coordinator | final canonical H checks and status-free H2 rerun manifest | pending |

Docker validation uses fixed shared ports and must be serialized by the
coordinator. Maven/focused validation may run independently where it does not
share mutable external state. Validation becomes stale after a relevant branch
refresh or integration update and must be rerun or reported stale.

## Resume state and child integration ledger

### Complete child resume/status table

| Issue | Artifact | Layer | Launch / workflow | Branch and local worktree | PR / target | Current validation | Blocker or non-launch reason | Readiness | Refresh | Cleanup | Required validation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| #195 | specs/010-safe-stay-deletion/ | preserved | not applicable / completed | not sidecar-owned | historical / main | consumed precedent; not rerun | closed and already integrated | terminal | not applicable | ineligible | no child rerun; integrated regression later |
| #196 | specs/196-block-cat-deletion-when-stay-history-exists/ | 1 | pending / prepared | branch and worktree planned | none / coordinator branch | focused, verify, Docker: not run | initial push, child Git context, and held barrier pending | not ready | not needed | ineligible | focused cat tests, ./mvnw verify, serialized MySQL/Flyway |
| #198 | specs/198-block-vet-deletion-while-cats-reference-it/ | 1 | pending / prepared | branch and worktree planned | none / coordinator branch | focused, verify, Docker: not run | initial push, child Git context, and held barrier pending | not ready | not needed | ineligible | focused vet tests, ./mvnw verify, serialized MySQL/Flyway |
| #197 | specs/197-block-owner-deletion-while-cats-or-stays-reference-it/ | 2 | pending / waiting-for-dependency-merge | branch and worktree intentionally uncreated | none / coordinator branch | focused, verify, Docker: not run | #196 and #198 must be user-merged and integrated | not ready | required after layer 1 merges | ineligible | focused owner tests, docs review, ./mvnw verify, serialized MySQL/Flyway |

### Sidecar Git state

- Coordinator local branch/worktree: created and clean at the immutable control
  revision; initial artifact commit and remote push are pending.
- Child branches/worktrees: #196 and #198 are dependency-ready but still
  planned; #197 is intentionally uncreated pending integration.
- Child PR target for every prepared child: the coordinator branch.
- Refresh status: not needed before layer 1; mandatory after user-owned layer 1
  merge commits and before layer 2 preparation.
- Cleanup status: ineligible for all run-owned resources. No final PR merge has
  occurred and no cleanup authority exists.
- Remote-cleanup approval: false.

| Issue | Workflow state | Branch/worktree | PR | Merge observation | Coordinator ancestry | Readiness | Refresh | Cleanup eligibility |
|---|---|---|---|---|---|---|---|---|
| #195 | completed and preserved | not sidecar-owned | existing historical delivery | present on main | b4fc5fb trace recorded | terminal | not applicable | ineligible |
| #196 | pending preparation | planned | none | none | none | not ready | not needed | ineligible |
| #198 | pending preparation | planned | none | none | none | not ready | not needed | ineligible |
| #197 | waiting for dependency merge | planned only | none | none | none | not ready | required after layer 1 merges | ineligible |

Before any resume transition, re-read current issue/PR state, fetch the remote
coordinator ref, prove exact local/remote branch associations and clean states,
verify recorded evidence ancestry and dispatch identity, recompute dependency
layers, and mark relevant validation stale. Conversation memory alone is not
resume authority.

## Integrated scope review

- Initial fetched origin/main target-base SHA: a36164a2d50f4d797f147f8885abee03ebc4c8cf.
- Runtime final target base B: pending a fresh finalization fetch.
- PR-equivalent merge base: pending integration.
- Combined expected product surfaces: the three child source maps above plus the
  #197-owned architecture summary.
- Changed-path reconciliation: pending integration.
- Unexplained scope: none observed in preparation; final result pending.

## Finalization state

- Literal validated head H: pending.
- Artifact-only child H2 as SELF/HEAD: pending.
- Expected H2 parent H: pending.
- Direct-parent and sole-artifact delta proof: pending.
- Canonical H checks: pending.
- Canonical status-free H2 rerun manifest and per-check applicability: pending.
- Readiness: pending H2 checks.
- Final scope result from H: pending.
- Post-H2 recheck criteria: target base, merge base, local/remote head equality,
  ancestry, scope, validation freshness, template identity, existing PR state,
  and final rendered body must all remain current.
- Final template blob identity:
  7fce414494c942c9979f5ac11cdd53985423de3a.
- Stable same-run final-delivery identity and external result locations: pending.
- Remaining risks: concurrent relationship insertion is handled only when
  delete plus flush is exercised; MySQL/Flyway evidence must remain fresh.
- Final cleanup eligibility: ineligible; reason pending final PR merge.

## Stop conditions and next transition

Stop without fallback, replacement identity, overwrite, history rewrite, or
scope expansion if any artifact, branch, worktree, remote ref, issue, PR,
dependency, shared contract, held identity, evidence SHA, ancestry proof,
validation result, or merge method is missing, stale, dirty, duplicated,
contradictory, or unproven.

The next allowed transition is: validate all prepared child artifact sets,
commit and normally push the coordinator preparation head, create only the
dependency-ready #196 and #198 branches/worktrees from that head, then persist
and remotely prove handoff-ready evidence before held preflight. #197 remains
uncreated until both layer 1 PRs are user-merged and the coordinator is safely
refreshed.
