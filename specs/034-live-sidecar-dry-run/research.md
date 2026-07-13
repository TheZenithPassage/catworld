# Research: Live Sidecar Dry Run

## Decision 1: Temporary routing identity

**Decision**: Permit pre-#261 sidecar execution only when the current coordinator issue number and URL equal the sole fixture identity recorded by #260, the issue body explicitly states that it is the controlled sidecar dry-run fixture for #260, the request includes `parallel`, and every ordinary sidecar preflight/safety check passes.

**Rationale**: The issue body is durable public evidence; the recorded exact number/URL prevents another issue from copying the marker. Requiring both avoids inference from titles, branches, or private conversation and keeps #261 inactive generally.

**Alternatives considered**: Branch-prefix or title matching is forgeable and explicitly forbidden. A label would introduce an unapproved routing source and mutation. General #261 activation is out of scope. A private-session whitelist is not resumable evidence.

## Decision 2: Active routing source alignment

**Decision**: Align only `AGENTS.md`, the routing section of `catworld-implement-issue`, the coordinator skill's independent activation gates, the child skill's prepared-handoff trigger, and `docs/ARCHITECTURE.md`. Define a routing-authorized run and leave lifecycle internals in the sidecar skills.

**Rationale**: These sources independently block or authorize the exact operations required by the live run. Editing fewer leaves an executable contradiction; editing historical issue artifacts or generators adds unrelated scope.

**Alternatives considered**: Changing only `AGENTS.md` leaves coordinator/child gates closed. Copying lifecycle rules into the sequential skill duplicates sources. Rewriting historical #226–#259 artifacts would falsify their issue-scoped record.

## Decision 3: Fixture topology and harmless surfaces

**Decision**: Use one coordinator, two independent first-layer documentation children with disjoint files, and one documentation child hard-dependent on both first-layer outputs. The dependent child adds an index/summary that references both completed first-layer fixture documents.

**Rationale**: Two first-layer PRs are necessary to prove fan-out and the required state where one is merged while one remains active. A third dependent child is necessary to prove dependency-layer recomputation and later launch. Disjoint Markdown files minimize conflict and product risk.

**Alternatives considered**: One child cannot prove fan-out or active refresh. Two children cannot also prove a later hard-dependent layer without conflating scopes. Product code and shared workflow-source edits create unnecessary risk.

## Decision 4: Control and runtime context separation

**Decision**: Use the #260 build-out checkout/ref as the governing control context and create the runtime coordinator branch from current `origin/main`, with child branches from that coordinator. Record both contexts in the coordinator artifact and every handoff.

**Rationale**: Current `origin/main` does not contain the complete #251–#259 build-out delta, but the user explicitly requires the runtime base to be `main` and the #260 delivery base to be `workflow/sidecar-buildout`. Keeping both recorded avoids silently merging build-out history into the fixture.

**Alternatives considered**: Starting the runtime branch from the build-out ref violates the required production-shaped base and final target. Cherry-picking the build-out delta into runtime would pollute the fixture scope. Updating local `main` is prohibited.

## Decision 5: Validation strategy

**Decision**: Treat the real staged run as the end-to-end evidence, reuse existing focused scripts where applicable, and use direct run-specific Git/ref/artifact/template checks for the live fixture. Do not adapt the #258 finalization verifier as a generic runtime harness because it contains #258/build-out-specific constants.

**Rationale**: Issue #260 explicitly requests a staged live dry-run rather than another simulation. Direct checks can validate the actual fixture identity and runtime H/H2 without introducing a new framework.

**Alternatives considered**: Another broad simulation would not prove real GitHub transitions. Rewriting all prior validators into a generic suite is disproportionate. Blindly running the #258-specific verifier on live H2 would produce misleading evidence.

## Decision 6: Checkpoint and defect behavior

**Decision**: Persist factual state before each mandatory pause, stop immediately once the checkpoint evidence is complete, and resume only from re-read GitHub/repository evidence. On the first concrete defect, preserve all state and stop with the smallest likely correction rather than continuing.

**Rationale**: User-owned merges are intentional external state transitions. Durable artifacts and current evidence make the run resumable and keep defects diagnosable.

**Alternatives considered**: Polling/waiting obscures user ownership. Continuing after a defect invalidates the dry-run. Cleanup or recreation would destroy evidence.

## Decision 7: Stable held child dispatch

**Decision**: Resolve the observed launch-state circularity with the explicitly approved two-phase barrier using the Codex stable named-subagent capability. `spawn_agent` returns one canonical task identity for a preflight-only turn; `followup_task` later targets that same identity for release. Before dispatch, a deterministic fingerprint is computed from immutable prepared inputs, then handoff-ready evidence and a later recording update containing its exact SHA are committed and pushed; those two later SHAs are separate correlation fields. After unambiguous dispatch acceptance, factual launched evidence and a later activation/recording update containing its exact SHA are committed and pushed. Only after current remote equality plus evidence-ancestry proof may the same child receive targeted release, incorporate the current activation head, and verify the launched evidence before editing.

**Rationale**: A harmless proof returned `/root/dispatch_barrier_capability_proof`, acknowledged preflight with implementation permission false, then accepted a targeted continuation under the same canonical identity. Control/runtime HEADs, statuses, and all ten staged blob IDs were unchanged before dispatch, before release, and after release. This closes the durable-state ordering gap without redefining `launched` or adding infrastructure.

**Alternatives considered**: A fire-and-forget child could edit before durable evidence. A second unrelated agent would break identity continuity. A filesystem lock, queue, daemon, IPC service, transaction framework, or indefinite polling loop would exceed the bounded problem. Treating the sequence as atomic would make failure reporting dishonest.

## Decision 8: Dispatch interruption and failure semantics

**Decision**: A held child has no implementation or delivery permission until remote launched evidence is verified. Rejected or ambiguous dispatch records no launch; ambiguous state is not retried. Launch-state push, child refresh/verification, or pre-release interruption leaves the child unable to edit. Release failure preserves factual launched state but blocks implementation/delivery. A resumed session stops when the exact canonical child identity cannot be verified rather than dispatching a replacement.

**Rationale**: These rules preserve the factual event and prevent duplicate or unidentified execution across every non-atomic boundary.

**Alternatives considered**: Rolling launched back would falsify accepted dispatch. Blind retry could duplicate work. Private conversation evidence is not durable enough to authorize a replacement.

## Decision 9: Resolve immutable commit identities without self-reference

**Decision**: Treat each factual handoff-ready or launched update as an immutable evidence commit whose literal SHA becomes knowable only after commit creation. When that literal SHA must be stored in the tracked coordinator artifact, use one later bounded recording commit. The fetched remote ref must equal the current recording/activation head, and Git ancestry must prove that head contains the recorded evidence commit. The same rule applies to derived identity: a fingerprint stored by the handoff-ready evidence commit cannot include that not-yet-created commit SHA. A held child may remain behind during read-only preflight; on release it incorporates the current activation head and verifies the factual launched evidence commit in ancestry.

**Rationale**: A Git commit hash covers its tree and metadata, so the same commit cannot contain its own final literal SHA. Separating evidence identity from the current containing head satisfies the user's exact-SHA requirement without guessing, circular fields, or false equality after a later artifact update.

**Alternatives considered**: Guessing the commit SHA is invalid. Requiring permanent equality to the earlier evidence commit prevents any later artifact record. A generic transaction/state subsystem is unnecessary. A `SELF/HEAD` sentinel can describe the unresolved identity during commit creation, but the live artifact must resolve and store the literal SHA in the bounded later recording update before the affected dispatch or release gate.

## Decision 10: Canonicalize prepared-handoff identity pre-evidence

**Decision**: Compute each prepared-handoff fingerprint before the handoff-ready evidence commit using canonical schema `sidecar-prepared-handoff-v1`: one exactly ordered PowerShell object containing schema, run/issues, coordinator and child Git context, control revision, prepared artifact paths, dependency layer/list, PR target/references, preparation/launch states, and false permissions. Serialize with `ConvertTo-Json -Compress -Depth 4`, hash UTF-8 bytes with SHA-256, and encode 64 lowercase hex. Validate artifact content separately. Exclude artifact hashes/content identities, the fingerprint, child identity, and all later evidence/recording fields. Correlate those later values separately.

**Rationale**: Reconciliation exposed the first self-reference (including not-yet-created evidence). Independent pre-commit review then found the draft correction still lacked a shared serialization and described artifact content identities that would recurse when an artifact records its own fingerprint. One explicit identity-envelope schema makes coordinator/child recomputation executable while independent artifact review preserves content integrity.

**Alternatives considered**: Computing after evidence merely moves the circularity. Hashing tracked artifact blobs makes the stored fingerprint self-containing. Normalizing documents around a placeholder adds unnecessary complexity. Omitting durable evidence correlation weakens authorization. A mutable fingerprint or generic identity service is outside the approved architecture.

## Decision 11: Supersede the first correction before runtime use

**Decision**: Preserve `C1=a19af010dfe63eaf27b68717ce9b38042372f973` and `C1r=0dd0e867cc52320875a1dd6c2928024f4e512c21` as historical published control evidence. Publish one normally pushed/fetched superseding correction `C2`, then one bounded report-only head `C2r` that stores literal `C2`. Only `C2` may be used as the control-revision input to runtime fingerprints and handoffs.

**Rationale**: No runtime commit or dispatch consumed `C1`, so superseding it preserves the exact stopped state and avoids rewriting history. A distinct `C2r` records the immutable source SHA without requiring `C2` to contain its own hash.

**Alternatives considered**: Amending or force-updating `C1` would rewrite published history and is prohibited. Continuing under `C1` would knowingly consume an inconsistent child contract. Using `C2r` as the workflow source would conflate the correction bytes with later evidence-only bookkeeping.
