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
| Current phase | corrected implementation head H-prime validated; single artifact-only H2-prime is SELF/HEAD; pending H2-prime checks |
| Artifact freeze | re-established at SELF/HEAD; no H3, H4, or post-H2-prime finalization commit is permitted |

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
| #196 Block cat deletion when stay history exists | open | layer 1 implementation | none | specs/196-block-cat-deletion-when-stay-history-exists/ | handoff-ready | integrated | launched | PR #283 was user-merged with Create a merge commit; exact delivered head is in refreshed coordinator ancestry. |
| #198 Block vet deletion while cats reference it | open | layer 1 implementation | none | specs/198-block-vet-deletion-while-cats-reference-it/ | handoff-ready | integrated | launched | PR #284 was user-merged with Create a merge commit; exact delivered head is in refreshed coordinator ancestry. |
| #197 Block owner deletion while cats or stays reference it | open | layer 2 implementation and combined architecture summary | #196, #198 | specs/197-block-owner-deletion-while-cats-or-stays-reference-it/ | handoff-ready | integrated | launched | PR #285 was user-merged with Create a merge commit; exact delivered head is in refreshed coordinator ancestry. |

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
6. DeletionAuthorizationPolicy semantics and existing entry points,
   GlobalExceptionHandler, SecurityConfig, shared exceptions, and completed stay
   deletion behavior remain unchanged. The authorized H-prime correction adds
   only a compatible pure policy overload that accepts an already-resolved
   current account.
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
| Human-only | none for the current finalization gate | The eventual coordinator-to-main PR merge remains user-only and must use Create a merge commit. |

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
The H-prime review correction is that later explicit authorization for the
compatible policy overload; it does not authorize any other caution surface.

## Branch and worktree plan

| Resource | Planned or actual value | State and ownership |
|---|---|---|
| Coordinator local branch | sidecar/148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays | created from exact origin/main a36164a2d50f4d797f147f8885abee03ebc4c8cf; owned by this run |
| Coordinator remote branch | origin/sidecar/148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays | freshly fetched and proven equal to superseded historical H2 959a692ac37f546dc2b79d39ef26876de291aa8a before the authorized correction; normal non-force delivery of H-prime/H2-prime remains pending the H2-prime gates |
| Coordinator worktree | C:\\cw-sidecars\\sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6\\148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays | exact branch association; clean at H-prime e427568ccd536c5cf9e6859b19dc628ee28b86e0 before this write; the only H-prime..SELF/HEAD delta is this coordinator artifact |
| #196 local branch | sidecar/196-block-cat-deletion-when-stay-history-exists | created from coordinator preparation head c1637a789533f7a0ab654caa09033ffebc30a982; exact run-owned association |
| #196 remote branch | origin/sidecar/196-block-cat-deletion-when-stay-history-exists | created by normal non-force push; local/remote equal at 6237930c41a3afba9d5953e88238f0919891152c |
| #196 worktree | C:\\cw-sidecars\\sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6\\196-block-cat-deletion-when-stay-history-exists | retained and clean at 6237930c41a3afba9d5953e88238f0919891152c; exact branch/run association; PR #283 is merged into the coordinator branch |
| #198 local branch | sidecar/198-block-vet-deletion-while-cats-reference-it | created from coordinator preparation head c1637a789533f7a0ab654caa09033ffebc30a982; exact run-owned association |
| #198 remote branch | origin/sidecar/198-block-vet-deletion-while-cats-reference-it | created by normal non-force push; local/remote equal at c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697 |
| #198 worktree | C:\\cw-sidecars\\sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6\\198-block-vet-deletion-while-cats-reference-it | retained and clean at c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697; exact branch/run association; PR #284 is merged into the coordinator branch |
| #197 local branch | sidecar/197-block-owner-deletion-while-cats-or-stays-reference-it | created from exact coordinator integration record 335d6ed1895a66b48c501dc9b23e892fb05f2409; exact run-owned association |
| #197 remote branch | origin/sidecar/197-block-owner-deletion-while-cats-or-stays-reference-it | created by normal non-force push; local/remote equal at 4570d13336e92eab0e32e5decfb718865a8e16df |
| #197 worktree | C:\\cw-sidecars\\sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6\\197-block-owner-deletion-while-cats-or-stays-reference-it | retained and clean at 4570d13336e92eab0e32e5decfb718865a8e16df; exact branch/run association; PR #285 is merged into the coordinator branch |

The first attempted coordinator parent under
C:\\Users\\moshe\\Desktop\\catworld-sidecar-worktrees was rejected by Git
because repository-relative paths exceeded the Windows filename limit. Git
removed the failed worktree association and target. The remaining empty parent
is not a branch worktree. The shorter workflow-context parent above was checked
for collisions before creation; every deterministic directory component remains
unchanged.

## Two-phase dispatch ledger

Implementation and delivery permission was granted only to the exact released
identities after the durable barrier passed. All three children exercised that
scoped permission and are integrated. No further child work or merge permission
is implied.

### #196

- Artifact state: handoff-ready; workflow integrated; factual launch launched.
- Dependency layer: 1; hard dependencies: empty.
- Prepared-handoff fingerprint: f3252b3a16fb76b6494a1e3599258e882a9bc1d8f4d68c5211ce7bdd565f22dd.
- Handoff-ready evidence SHA R: 250341a6d9cbfb784c0858f731462c2ecdd169f4; normally pushed, fetched, and proven equal to the remote coordinator ref before this bounded update.
- Remote recording head Rr containing R: 57fbc766bf2458c7f89748ad345e1f0aeeed187e; fetched remote equality and R ancestry passed.
- Stable held dispatch identity: /root/held_child_196_148; no separate agent ID was exposed.
- Held preflight zero-edit result: preflight-accepted; fingerprint independently reproduced; coordinator and child worktrees remained clean; zero repository or GitHub mutations.
- Factual launch state: launched and held; accepted dispatch is factual but grants no permission.
- Launched evidence SHA L: c9650ef0887f04cb9c6f365724d253f153f26905; normally pushed, fetched, and proven equal to the remote coordinator ref before this bounded update.
- Remote activation/recording head Lr containing L: 0074d6a8fd696f8673972b60718676d82e31ee22; normally pushed/fetched, remote equality proven, and L ancestry passed.
- Implementation permission: true for /root/held_child_196_148 after release-accepted.
- Delivery permission: exercised after all readiness gates passed.
- Targeted release: release-accepted by the same canonical identity after fingerprint recheck, exact Lr fetch, L ancestry proof, clean fast-forward to Lr, artifact re-read, and clean-state proof.
- Delivered commits: 7c445827a3d695a77cc2943c933a1c229546ea7d and additive review fix 6237930c41a3afba9d5953e88238f0919891152c; no history rewrite.
- Remote child branch: origin/sidecar/196-block-cat-deletion-when-stay-history-exists equals 6237930c41a3afba9d5953e88238f0919891152c; local worktree is clean and equal.
- Child PR: https://github.com/TheZenithPassage/catworld/pull/283; closed and merged by the user at merge commit 8b4651f4b8127724a04fe30c73c0c6e3b7f07f4b; exact coordinator target and child head retained.
- Integration proof: merge commit parents are 0a03f4af4cb69ee93a06274418f508b178238ecd and 6237930c41a3afba9d5953e88238f0919891152c; the delivered child head is an ancestor of refreshed coordinator head 9d57e2e62f985c9ed045049c84acfbe596dc52b3.
- Review state: one P2 test-fidelity finding was resolved by the additive test-only commit before readiness.

### #198

- Artifact state: handoff-ready; workflow integrated; factual launch launched.
- Dependency layer: 1; hard dependencies: empty.
- Prepared-handoff fingerprint: c965558afc8382260c79485673bafbd3ad3f719173b4f8959a8337f7724a4818.
- Handoff-ready evidence SHA R: 250341a6d9cbfb784c0858f731462c2ecdd169f4; normally pushed, fetched, and proven equal to the remote coordinator ref before this bounded update.
- Remote recording head Rr containing R: 57fbc766bf2458c7f89748ad345e1f0aeeed187e; fetched remote equality and R ancestry passed.
- Stable held dispatch identity: /root/held_child_198_148; no separate agent ID was exposed.
- Held preflight zero-edit result: preflight-accepted; fingerprint independently reproduced; coordinator and child worktrees remained clean; zero repository or GitHub mutations.
- Factual launch state: launched and held; accepted dispatch is factual but grants no permission.
- Launched evidence SHA L: c9650ef0887f04cb9c6f365724d253f153f26905; normally pushed, fetched, and proven equal to the remote coordinator ref before this bounded update.
- Remote activation/recording head Lr containing L: 0074d6a8fd696f8673972b60718676d82e31ee22; normally pushed/fetched, remote equality proven, and L ancestry passed.
- Implementation permission: true for /root/held_child_198_148 after release-accepted.
- Delivery permission: exercised after all readiness gates passed.
- Targeted release: release-accepted by the same canonical identity after fingerprint recheck, exact Lr fetch, L ancestry proof, clean fast-forward to Lr, artifact re-read, and clean-state proof.
- Delivered commit: c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697.
- Remote child branch: origin/sidecar/198-block-vet-deletion-while-cats-reference-it equals c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697; local worktree is clean and equal.
- Child PR: https://github.com/TheZenithPassage/catworld/pull/284; closed and merged by the user at merge commit 9d57e2e62f985c9ed045049c84acfbe596dc52b3; exact coordinator target and child head retained.
- Integration proof: merge commit parents are 8b4651f4b8127724a04fe30c73c0c6e3b7f07f4b and c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697; the delivered child head is an ancestor of refreshed coordinator head 9d57e2e62f985c9ed045049c84acfbe596dc52b3.
- Review state: independent read-only review found no production or test finding.

### #197

- Artifact state: handoff-ready; workflow integrated; factual launch launched.
- Dependency layer: 2; hard dependencies: #196 and #198.
- Prepared-handoff fingerprint: 2cd9ca6c9e1b4262cf0946249a85a22a6c413fb9321ec5f060e00a3bf1c34e10.
- Handoff-ready evidence SHA R: 3afa6d42662e7bb044da4dd69b578af60c942884; normally pushed, fetched, and proven equal to the remote coordinator ref before this bounded update.
- Remote recording head Rr containing R: 3199ac3a3ac84da2ce0a771201e88b8d506bda4f; normally pushed/fetched, remote equality proven, and R ancestry passed.
- Stable held dispatch identity: /root/held_child_197_148; no separate agent ID was exposed.
- Held preflight zero-edit result: preflight-accepted; fingerprint independently reproduced; coordinator and child worktrees remained clean; zero repository or GitHub mutations.
- Factual launch state: launched and held; accepted dispatch is factual but grants no permission.
- Launched evidence SHA L: 819cf734de5ee2ad4d799e7ad5dd8ac3ebb6ef76; normally pushed, fetched, and proven equal to the remote coordinator ref before this bounded update.
- Remote activation/recording head Lr containing L: d43d94da611f15677cd2a59e1c944446abb105d1; normally pushed/fetched, remote equality proven, and L ancestry passed.
- Branch/worktree preparation: exact child branch/worktree incorporated Lr by clean fast-forward before implementation; delivered local/remote child refs are equal at 4570d13336e92eab0e32e5decfb718865a8e16df.
- Implementation permission: true for /root/held_child_197_148 after release-accepted.
- Delivery permission: exercised after all readiness gates passed.
- Targeted release: release-accepted by the same canonical identity after fingerprint recheck, exact Lr fetch, L ancestry proof, clean fast-forward to Lr, artifact re-read, and clean-state proof.
- Delivered commit: 4570d13336e92eab0e32e5decfb718865a8e16df; direct parent is exact Lr d43d94da611f15677cd2a59e1c944446abb105d1; no history rewrite.
- Remote child branch: origin/sidecar/197-block-owner-deletion-while-cats-or-stays-reference-it equals 4570d13336e92eab0e32e5decfb718865a8e16df; local worktree is clean and equal.
- Child PR: https://github.com/TheZenithPassage/catworld/pull/285; closed and merged by the user at merge commit 07a232e930cacf9af973a900ddf4ae4d7ab7368e; exact coordinator target and child head retained.
- Integration proof: merge commit parents are 76da659b20ebcd76f0d01a63ff3a94bc10976356 and 4570d13336e92eab0e32e5decfb718865a8e16df; the exact delivered child head is an ancestor of refreshed coordinator head 07a232e930cacf9af973a900ddf4ae4d7ab7368e.
- Review state: independent production, tests/documentation, and final delivery reviews found no actionable finding and made no edits.

Canonical fingerprints use the workflow-defined ordered 21-field payload,
UTF-8 compact JSON, and lowercase SHA-256. The #197 fingerprint was computed
only after the actual local child branch/worktree associations existed.

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
- Final coordinator PR base: main. Its closure authority is exactly Closes #148,
  Closes #196, Closes #198, and Closes #197 after every child is terminal and
  integrated and all final gates pass. Already-closed preserved issue #195 is
  not closed again.
- Codex will not merge, approve, enable auto-merge, mutate issues, post public
  comments, or delete remote branches.

Current delivery and integration evidence:

- #196: PR https://github.com/TheZenithPassage/catworld/pull/283 is closed and
  merged through merge commit 8b4651f4b8127724a04fe30c73c0c6e3b7f07f4b;
  exact delivered head 6237930c41a3afba9d5953e88238f0919891152c is
  present in refreshed coordinator ancestry.
- #198: PR https://github.com/TheZenithPassage/catworld/pull/284 is closed and
  merged through merge commit 9d57e2e62f985c9ed045049c84acfbe596dc52b3;
  exact delivered head c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697 is
  present in refreshed coordinator ancestry.
- #197: PR https://github.com/TheZenithPassage/catworld/pull/285 is closed and
  merged through merge commit 07a232e930cacf9af973a900ddf4ae4d7ab7368e;
  exact delivered head 4570d13336e92eab0e32e5decfb718865a8e16df is
  present in refreshed coordinator ancestry.
- All three child PRs targeted the coordinator branch, retained exactly their
  child-then-coordinator Related to lines, and were user-merged with Create a
  merge commit.
- The fetched remote coordinator ref and local coordinator worktree were proven
  equal and clean at superseded historical H2
  959a692ac37f546dc2b79d39ef26876de291aa8a before the authorized additive
  correction. H-prime is its direct child; no history was rewritten.

## Validation plan and reporting

Each evidence row records exactly one status and distinguishes current H-prime
evidence from superseded historical evidence. Allowed statuses are passed,
failed, skipped, timed out, interrupted, partial, stale, blocked, and not run.
Non-passing evidence is never summarized as passing.

| Scope | Required evidence | Evidence status |
|---|---|---|
| #196 | focused cat service/controller/mapper/persistence tests | historical: passed at superseded H as part of the 131-test integrated deletion suite; 0 failures/errors/skips |
| #196 | ./mvnw verify | historical: passed at superseded H in the 171-test full backend regression; 0 failures/errors/skips |
| #196 | clean MySQL/Flyway Docker startup and FK behavior | historical only: passed at superseded H in isolated project cw148h7d6b1d4d with Flyway V1-V3, API canDelete/204/409, fk_stay_cat_cat NO ACTION, raw MySQL 1451 preservation, and clean teardown |
| #198 | focused vet service/controller/mapper/persistence tests | historical: passed at superseded H as part of the 131-test integrated deletion suite; 0 failures/errors/skips |
| #198 | ./mvnw verify | historical: passed at superseded H in the 171-test full backend regression; 0 failures/errors/skips |
| #198 | clean MySQL/Flyway Docker startup and FK behavior | historical only: passed at superseded H in isolated project cw148h7d6b1d4d with Flyway V1-V3, API canDelete/204/409, fk_cats_vet NO ACTION, raw MySQL 1451 preservation, and clean teardown |
| #197 | focused owner service/controller/mapper/persistence tests | historical: passed at superseded H as part of the 131-test integrated deletion suite; 0 failures/errors/skips |
| #197 | ./mvnw verify | historical: passed at superseded H in the 171-test full backend regression; 0 failures/errors/skips |
| #197 | clean MySQL/Flyway Docker startup and both FK paths | historical only: passed at superseded H in isolated project cw148h7d6b1d4d with API canDelete/204/409, fk_cats_owner and fk_stays_owner NO ACTION, independent raw MySQL 1451 preservation, and clean teardown |
| Coordinator | corrected batching-focused Maven suite | current: passed at exact H-prime with 60 tests, 0 failures/errors/skips |
| Coordinator | .\\mvnw.cmd verify | current: passed at exact H-prime with 179 tests, 0 failures/errors/skips |
| Coordinator | corrected scope and whitespace review | current: passed at exact H-prime; the 15-path correction is authorized, old-H2..H-prime and B...H-prime `git diff --check` passed, and B...H-prime reconciles to 38 expected paths |
| Coordinator | Docker/MySQL/Flyway/API validation | not run at H-prime (Docker was not rerun); the correction adds portable JPQL ID projections and changes no schema, migration, native SQL, Docker/Compose, API shape, authorization rule, DELETE write path, or FK contract; old-H Docker evidence is historical/applicable background only |
| Coordinator | status-free H2-prime rerun manifest | recorded below; readiness remains pending the external H2-prime checks |

Docker validation uses fixed shared ports and must be serialized by the
coordinator. Maven/focused validation may run independently where it does not
share mutable external state. Validation becomes stale after a relevant branch
refresh or integration update and must be rerun or reported stale.

The earlier child delivery results became stale after integration and remain
historical evidence. The original finalization pair, H
77852060a99873b16566006907ba9b00fcce1c2c and H2
959a692ac37f546dc2b79d39ef26876de291aa8a, was then superseded because review
confirmed merge-blocking per-entity authentication and relationship-query
amplification in owner, cat, and vet listing `canDelete` rendering. Exact
H-prime e427568ccd536c5cf9e6859b19dc628ee28b86e0 contains the bounded additive
code/test correction and fresh current Maven/scope evidence. H2-prime changes
only this orchestration artifact; the applicability table below states which
H-prime results may be consumed and which artifact-affected checks must be
rerun.

Historical attempts remain non-passing evidence rather than being rewritten:

- #196 had one unquoted PowerShell focused-command parse failure before Maven;
  the corrected quoted command passed at both delivered heads.
- #198 had two focused failures in a test-only timestamp precision assertion;
  the persisted-value assertion correction then passed focused and full suites.
- #197 had one initial metadata query failure because a column reference was
  ambiguous; the corrected query passed without a code change, and that
  delivered-head Docker evidence is retained only as historical.
- The #196 independent review found mixed-fixture coverage did not independently
  prove cancelled-only and historical-only history. Additive commit 6237930c
  introduced isolated future-only, cancelled-only, and historical-only
  persistence cases, after which the then-current child validation was rerun
  and passed.

## Resume state and child integration ledger

### Complete child resume/status table

| Issue | Artifact | Layer | Launch / workflow | Branch and local worktree | PR / target | Current validation | Blocker or non-launch reason | Readiness | Refresh | Cleanup | Required validation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| #195 | specs/010-safe-stay-deletion/ | preserved | not applicable / completed | not sidecar-owned | historical / main | historical integrated stay regression passed at superseded H; current H-prime full verification passed | closed and already integrated | terminal | not applicable | ineligible | current H-prime applicability recorded below |
| #196 | specs/196-block-cat-deletion-when-stay-history-exists/ | 1 | launched / integrated | retained clean child worktree at 6237930c41a3afba9d5953e88238f0919891152c | merged PR #283 / coordinator branch | current H-prime focused/full/scope checks passed; old-H Docker evidence is historical only | none; exact delivered commit and merge commit are in H-prime ancestry | integrated | coordinator current through H-prime; terminal child refresh not needed | ineligible | completed at H-prime; H2-prime applicability recorded below |
| #198 | specs/198-block-vet-deletion-while-cats-reference-it/ | 1 | launched / integrated | retained clean child worktree at c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697 | merged PR #284 / coordinator branch | current H-prime focused/full/scope checks passed; old-H Docker evidence is historical only | none; exact delivered commit and merge commit are in H-prime ancestry | integrated | coordinator current through H-prime; terminal child refresh not needed | ineligible | completed at H-prime; H2-prime applicability recorded below |
| #197 | specs/197-block-owner-deletion-while-cats-or-stays-reference-it/ | 2 | launched / integrated | retained clean child worktree and local/remote refs equal at 4570d13336e92eab0e32e5decfb718865a8e16df | merged PR #285 / coordinator branch | current H-prime focused/full/scope checks passed; old-H Docker evidence is historical only | none; exact delivered commit and merge commit are in H-prime ancestry | integrated | coordinator current through H-prime; terminal child refresh not needed | ineligible | completed at H-prime; H2-prime applicability recorded below |

### Sidecar Git state

- Coordinator local branch/worktree: local and remote were clean/equal at
  superseded historical H2 959a692ac37f546dc2b79d39ef26876de291aa8a
  before correction. The local worktree was clean at exact H-prime
  e427568ccd536c5cf9e6859b19dc628ee28b86e0 before the sole H2-prime artifact
  write; all exact delivered and merge commits are in H-prime ancestry.
- Child branches/worktrees: #196 is clean and local/remote equal at
  6237930c41a3afba9d5953e88238f0919891152c; #198 is clean and local/remote
  equal at c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697. They remain retained and
  terminal; #197 is clean and local/remote equal at
  4570d13336e92eab0e32e5decfb718865a8e16df and is terminal/integrated.
- Child PR targets: merged PR #283, merged PR #284, and merged PR #285 all
  target the coordinator branch; the existing coordinator-to-main delivery is
  PR #299 and must remain open.
- Refresh status: all three integrations and corrected validation are current
  through exact H-prime; H2-prime artifact-affected checks remain to be resolved
  externally after SELF/HEAD is committed.
- Cleanup status: ineligible for all run-owned resources. No final PR merge has
  occurred and no cleanup authority exists.
- Remote-cleanup approval: false.

| Issue | Workflow state | Branch/worktree | PR | Merge observation | Coordinator ancestry | Readiness | Refresh | Cleanup eligibility |
|---|---|---|---|---|---|---|---|---|
| #195 | completed and preserved | not sidecar-owned | existing historical delivery | present on main | b4fc5fb trace recorded | terminal | not applicable | ineligible |
| #196 | integrated | retained clean/pushed at 6237930c41a3afba9d5953e88238f0919891152c | #283 merged | merge commit 8b4651f4b8127724a04fe30c73c0c6e3b7f07f4b observed | exact delivered commit is an ancestor of refreshed coordinator head | terminal | coordinator refreshed; terminal child refresh not needed | ineligible |
| #198 | integrated | retained clean/pushed at c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697 | #284 merged | merge commit 9d57e2e62f985c9ed045049c84acfbe596dc52b3 observed | exact delivered commit is an ancestor of refreshed coordinator head | terminal | coordinator refreshed; terminal child refresh not needed | ineligible |
| #197 | integrated | retained clean/pushed at 4570d13336e92eab0e32e5decfb718865a8e16df | #285 merged | merge commit 07a232e930cacf9af973a900ddf4ae4d7ab7368e observed | exact delivered commit is an ancestor of refreshed coordinator head | terminal | coordinator refreshed; terminal child refresh not needed | ineligible |

Before any resume transition, re-read current issue/PR state, fetch the remote
coordinator ref, prove exact local/remote branch associations and clean states,
verify recorded evidence ancestry and dispatch identity, recompute dependency
layers, and mark relevant validation stale. Conversation memory alone is not
resume authority.

## Integrated scope review

- Initial fetched origin/main target-base SHA: a36164a2d50f4d797f147f8885abee03ebc4c8cf.
- Runtime final target base B: a36164a2d50f4d797f147f8885abee03ebc4c8cf,
  freshly fetched from origin/main without updating local main.
- PR-equivalent merge base: a36164a2d50f4d797f147f8885abee03ebc4c8cf.
- Superseded historical reviewed head H:
  77852060a99873b16566006907ba9b00fcce1c2c.
- Superseded historical artifact-only H2:
  959a692ac37f546dc2b79d39ef26876de291aa8a.
- Current literal reviewed implementation head H-prime:
  e427568ccd536c5cf9e6859b19dc628ee28b86e0.
- Combined expected surfaces: the original 36-path integrated set plus the
  authorized `DeletionAuthorizationPolicy` production/test pair introduced by
  the correction; exactly 38 paths.
- Changed-path reconciliation: passed over
  a36164a2d50f4d797f147f8885abee03ebc4c8cf...e427568ccd536c5cf9e6859b19dc628ee28b86e0;
  the exact 15-path old-H2..H-prime correction is within the review-authorized
  production/test surfaces, both correction and full-range `git diff --check`
  passed, and no prohibited surface changed in the correction.
- Unexplained scope: none. Independent integrated implementation and scope
  reviews found no actionable finding.

## Finalization state

- Superseded historical H: 77852060a99873b16566006907ba9b00fcce1c2c.
- Superseded historical H2: 959a692ac37f546dc2b79d39ef26876de291aa8a.
- Supersession reason: review confirmed merge-blocking query amplification in
  listing-response `canDelete`: database-backed current-user resolution and
  relationship existence checks were repeated per owner, cat, or vet.
- Literal validated implementation head H-prime:
  e427568ccd536c5cf9e6859b19dc628ee28b86e0.
- Artifact-only child H2-prime: SELF/HEAD.
- Expected H2-prime parent H-prime:
  e427568ccd536c5cf9e6859b19dc628ee28b86e0.
- Sole allowed H-prime..H2-prime path:
  specs/148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays/coordinator-orchestration.md.
- Readiness: pending H2-prime checks and normal remote delivery.
- Final scope result from H-prime: passed; exact 38-path full source-map/artifact
  set, exact authorized 15-path correction, and no unexplained or prohibited
  correction surface.
- Final template path:
  .github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md.
- Final template blob identity:
  7fce414494c942c9979f5ac11cdd53985423de3a.
- Final template file SHA-256:
  d8878b4bd1980e737a503fd0938609bae21cb1b58be27a7449f21d81b67c6336.
- Stable same-run final-delivery identity: existing PR #299, source branch
  sidecar/148-coordinator-enforce-safe-deletion-rules-for-owners-cats-vets-and-stays,
  target main, ready-only PR boundary.
- Final cleanup eligibility: ineligible; reason pending final PR merge.

### Superseded historical H/H2 evidence

Every result below was run or rechecked at the same clean historical H. The
query-amplification finding invalidated H/H2 as merge authority, so these
results are retained as immutable historical evidence and are not represented
as current H-prime validation:

1. Terminal ledger, merge topology, and ancestry: #196 delivered
   6237930c41a3afba9d5953e88238f0919891152c through PR #283 merge
   8b4651f4b8127724a04fe30c73c0c6e3b7f07f4b; #198 delivered
   c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697 through PR #284 merge
   9d57e2e62f985c9ed045049c84acfbe596dc52b3; #197 delivered
   4570d13336e92eab0e32e5decfb718865a8e16df through PR #285 merge
   07a232e930cacf9af973a900ddf4ae4d7ab7368e. All exact commits are in H
   ancestry; every prepared child is integrated with no active, pending,
   blocked, missing, duplicate, or unexpected child.
2. Fresh source/target identity: local and fetched remote coordinator refs
   equaled H; fetched B and the PR-equivalent merge base both equaled
   a36164a2d50f4d797f147f8885abee03ebc4c8cf; local main was not updated.
3. Full scope and whitespace: the exact 36 expected paths reconciled over
   B...H; `git diff --check B...H` passed; no unrelated or prohibited surface
   appeared.
4. Focused integrated deletion suite:
   `.\\mvnw.cmd "-Dtest=DeletionAuthorizationPolicyTest,StayServiceTest,StayControllerTest,StayMapperTest,StayDeletionPersistenceTest,CatServiceTest,CatControllerTest,CatMapperTest,CatDeletionPersistenceTest,VetServiceTest,VetControllerTest,VetMapperTest,VetDeletionPersistenceTest,OwnerServiceTest,OwnerControllerTest,OwnerMapperTest,OwnerDeletionPersistenceTest" test`
   ran 131 tests with 0 failures, 0 errors, and 0 skipped.
5. Full backend regression: `.\\mvnw.cmd verify` ran 171 tests with 0
   failures, 0 errors, and 0 skipped and produced the packaged application.
6. Serialized Docker/MySQL/Flyway/API validation used isolated project
   `cw148h7d6b1d4d` on database/backend/frontend ports 33306/18080/14200.
   The clean images built; MySQL became healthy; Flyway successfully validated
   and applied V1, V2, and V3; Hibernate schema validation and application
   startup completed; authenticated backend and frontend returned 200 and an
   unauthenticated login returned 401.
7. The integrated API graph proved backend-calculated `canDelete`, 409 for
   referenced cat, vet, cat-referenced owner, stay-only-referenced owner, and a
   constraint-blocked cancelled stay; it proved 204 for permanent stay, cat,
   vet, and owner deletion. The stay conflict rolled back with stay/link counts
   1/1; successful stay deletion removed the stay and owned link to counts 0/0;
   cancellation remained distinct from permanent deletion.
8. Real MySQL metadata reported NO ACTION for `fk_stay_cat_cat`,
   `fk_cats_vet`, `fk_cats_owner`, and `fk_stays_owner`. Independent raw delete
   attempts returned MySQL 1451 naming each exact constraint and preserved all
   fixture records. The validation-only stay conflict guard was dropped; the
   isolated stack, volume, and network were removed; all five pre-existing
   containers retained the same IDs and remained running.
9. Independent integrated production/documentation and source-map reviews found
   no actionable finding. The final template blob/hash matched the recorded
   identities, and a fresh GitHub search at that historical boundary found no
   existing same-run final PR.

### Canonical H-prime evidence

Every result below was run or rechecked at the same clean literal H-prime
e427568ccd536c5cf9e6859b19dc628ee28b86e0 and has current status `passed`
unless explicitly reported otherwise:

1. Additive topology: H-prime has one parent, exact superseded historical H2
   959a692ac37f546dc2b79d39ef26876de291aa8a. Historical H/H2 were not amended,
   rebased, squashed, deleted, or otherwise rewritten.
2. The correction resolves the current account once per non-empty owner, cat,
   or vet listing and reuses a pure `DeletionAuthorizationPolicy` evaluation
   path. Existing single-record and DELETE policy entry points remain intact.
3. Authorization-eligible IDs are selected in memory before relationship
   access. Distinct repository ID projections batch cat stay-history blockers,
   vet cat-reference blockers, and owner cat/stay blockers. Empty candidate
   sets skip bulk lookup; unauthorized IDs never enter lookup; cat-blocked owner
   IDs are removed before the stay lookup. Mapping performs no per-record
   relationship-existence call introduced by `canDelete`.
4. Focused correction suite:
   `.\\mvnw.cmd "-Dtest=DeletionAuthorizationPolicyTest,CatServiceTest,VetServiceTest,OwnerServiceTest,CatDeletionPersistenceTest,VetDeletionPersistenceTest,OwnerDeletionPersistenceTest" test`
   ran 60 tests with 0 failures, 0 errors, and 0 skipped.
5. Full backend regression: `.\\mvnw.cmd verify` ran 179 tests with 0 failures,
   0 errors, and 0 skipped and produced the packaged application.
6. Scope and whitespace: `git diff --check` passed for exact historical
   H2..H-prime and B...H-prime. The correction changes exactly 15 authorized
   production/test paths and does not change this artifact. B...H-prime contains
   exactly 38 expected paths: the original 36-path integrated set plus the
   authorized `DeletionAuthorizationPolicy` production/test pair.
7. Docker/MySQL/Flyway/API validation was not rerun for H-prime. The correction
   uses portable JPQL distinct-ID projections and changes no schema, migration,
   native SQL, Docker/Compose input, API shape, authentication/authorization
   rule, DELETE write path, explicit-flush ordering, or foreign-key contract.
   Historical old-H Docker evidence remains applicable background for those
   unchanged contracts, but it is not current H-prime validation.
8. Independent production, test-fidelity, scope, and validation-proportionality
   reviews found no remaining actionable finding. The one test-fidelity finding
   about permitting extra bulk calls was resolved before H-prime by asserting
   each applicable bulk method's total invocation count is exactly one.

### Canonical status-free H2-prime rerun manifest

The following manifest intentionally carries no result status. Resolve it only
after committing H2-prime as the direct artifact-only child of H-prime:

1. One-parent commit shape and `H2-prime^ = H-prime` identity.
2. Exact `H-prime..H2-prime` sole modified path and artifact-only content
   classification.
3. Runtime artifact structure: required B, merge base, superseded H/H2,
   H-prime, SELF/HEAD, expected parent, sole path, H-prime results,
   applicability, readiness, template identity, risks, and cleanup fields;
   absence of a resolved H2-prime self SHA, post-H2-prime result claims,
   final-ready claim, body fingerprint, or coordinator PR URL.
4. `git diff --check H-prime..H2-prime`.
5. `git diff --check B...H2-prime`.
6. Exact full B...H2-prime 38-path reconciliation and prohibited-surface review.
7. Fresh B, merge base, delivered/merge ancestry, local/remote coordinator
   equality, clean worktree, and normal non-force H2-prime push/fetch identity.
8. Final template path, blob, SHA-256, closing-authority set, and render inputs.
9. Existing PR #299 identity, updated external final-body rendering with no
   unresolved placeholder, and current GitHub check-state recheck; require all
   checks green before readiness.

### H-prime result applicability at H2-prime

| Consumed result | Applicability reason |
|---|---|
| Terminal child ledger and ancestry | H2-prime adds no child implementation or merge commit; exact ancestry and unique terminal rows are explicitly rechecked by the H2-prime manifest. |
| H-prime 38-path scope and manual contract review | H-prime remains immutable; H2-prime changes only the declared orchestration Markdown, while the complete B...H2-prime path set and prohibited surfaces are separately rechecked. |
| Focused 60-test Maven suite | H2-prime changes no source, test, resource, dependency, plugin, or build input, so the exact compiled/tested inputs are byte-identical to H-prime. |
| Full 179-test Maven verify | H2-prime changes no pom, source, test, resource, packaging, or runtime input, so the full regression and packaged application inputs are byte-identical to H-prime. |
| Historical Docker/Flyway/API/FK evidence | Not consumed as current H-prime validation. It remains background only for unchanged schema, migration, Docker/Compose, API, DELETE ordering, and FK contracts; current focused persistence and full Maven results cover the portable correction. |
| Independent correction review | H2-prime changes neither implementation nor docs/ARCHITECTURE.md; only this evidence artifact changes. |
| Template and existing-PR identity | H2-prime does not change the template; its identity and PR #299 state/body/checks are explicitly rechecked before readiness reporting. |

### Final PR render inputs

- Title: `feat(backend): enforce safe deletion rules`.
- Delivery identity: update the existing ready PR #299; do not create a second
  coordinator-to-main PR.
- Source: exact fetched remote coordinator branch at SELF/HEAD after normal
  non-force delivery.
- Target: `main` at the still-current fetched B.
- State: ready for review; never a draft fallback.
- Authoritative pair in the rendered body: H-prime
  e427568ccd536c5cf9e6859b19dc628ee28b86e0 and H2-prime SELF/HEAD. Historical
  H 77852060a99873b16566006907ba9b00fcce1c2c and H2
  959a692ac37f546dc2b79d39ef26876de291aa8a must be labeled superseded.
- Closing lines: `Closes #148`, `Closes #196`, `Closes #198`, and
  `Closes #197`; no closing line for already-closed #195.
- Child trace: PR #283 / #196 delivered 6237930c41a3afba9d5953e88238f0919891152c
  and integrated as 8b4651f4b8127724a04fe30c73c0c6e3b7f07f4b; PR #284 / #198
  delivered c7e8f3d3638e3ce6660fd1d1bd40ef8d03b37697 and integrated as
  9d57e2e62f985c9ed045049c84acfbe596dc52b3; PR #285 / #197 delivered
  4570d13336e92eab0e32e5decfb718865a8e16df and integrated as
  07a232e930cacf9af973a900ddf4ae4d7ab7368e.
- Summary: enforce authorization-first, relationship-safe permanent deletion
  for stays, cats, vets, and owners with rendering-only `canDelete`; owner, cat,
  and vet listing eligibility now resolves the current account once and batches
  relationship blockers without changing stable 404/403/409 behavior, explicit
  flush conflict translation, or final FK protection.
- Validation claims: current H-prime focused 60-test and full 179-test Maven
  results plus exact diff/scope checks. Old-H Docker/MySQL/Flyway/API results may
  appear only as historical background; no current Docker or concurrency claim.
- Required merge method: the user selects GitHub Create a merge commit; squash
  and rebase merges are prohibited so exact SELF/HEAD remains in main ancestry.

### Remaining risks and limitations

- A true timing-controlled concurrent relationship insertion was not stress
  scheduled for H-prime. DELETE revalidation, explicit flush conflict
  translation, and FK protection remain unchanged; their Docker/API evidence is
  historical rather than current H-prime validation.
- Pre-existing mapper-triggered lazy relationship loads, including possible cat
  owner/vet loads, were not measured or changed. The correction bounds only the
  authentication and relationship calls introduced by listing `canDelete`; it
  does not establish that every full listing endpoint query is O(1).
- The portable JPQL bulk projections use one unpaginated `IN` candidate set per
  applicable relationship family. Listings of the expected hundreds of records
  are covered by the bounded design, but database parameter limits and very
  large-list performance were not benchmarked. Pagination, chunking, caching,
  and a generic batching framework remain outside this correction.
- Docker/MySQL validation was not rerun because H-prime changes no schema,
  migration, native query, Docker/Compose input, API/auth contract, DELETE write
  path, or foreign-key behavior. Current focused persistence tests and full
  Maven verification passed; old-H Docker evidence is background only.
- Cleanup remains ineligible with reason `pending final PR merge`; no local or
  remote branch/worktree cleanup is authorized at this stage.

## Stop conditions and next transition

Stop without fallback, replacement identity, overwrite, history rewrite, or
scope expansion if any artifact, branch, worktree, remote ref, issue, PR,
dependency, shared contract, held identity, evidence SHA, ancestry proof,
validation result, or merge method is missing, stale, dirty, duplicated,
contradictory, or unproven.

The next transition is fixed: commit exactly this sole artifact as H2-prime,
then make no further repository edit or commit. Resolve the status-free
H2-prime manifest, normally push H-prime/H2-prime only after proving the direct
parent and sole-artifact shape, refetch B and the coordinator ref, render and
apply the current final body to existing PR #299, and report ready for a new
independent review only if every gate and GitHub check remains current and
passing. The user alone performs its Create a merge commit.
