# Data Model: Live Sidecar Dry Run

This feature changes no CatWorld domain entity, database schema, API payload, or browser storage. It does create structured workflow evidence governed by the existing sidecar artifact and cleanup contracts.

## Controlled Fixture Run

- `run_id`: exact stable identifier used for resume and cleanup journal identity.
- `control_ref`: #260 build-out branch/ref containing routing and accepted evidence.
- `runtime_base`: fetched `origin/main` SHA used to create the coordinator branch.
- `coordinator_issue`: exact number, URL, title, body identity marker, state, and labels.
- `child_issues`: complete unique set of two first-layer children and one dependent child.
- `dependency_layers`: layer 1 contains both independent children; layer 2 contains the child hard-dependent on both.
- `routing_state`: authorized only while the current coordinator identity and body marker match the #260 record and all preflight gates pass.
- `checkpoint_state`: preparation, pause-1, pause-2, pause-3, pause-4, post-merge, accepted, or blocked.

## Git Resource

- `kind`: coordinator branch/worktree or child branch/worktree.
- `branch`: exact local branch and corresponding remote ref when pushed.
- `source_ref`: `origin/main` for the coordinator; coordinator branch/ref for children.
- `path`: normalized exact checkout/worktree path.
- `head_sha`: current observed head for the recorded state.
- `ownership`: exact `run_id` association recorded before H2.
- `refresh_state`: not-needed, needed, stale, refreshed, or blocked.
- `cleanup_state`: ineligible, eligible/not-started, blocked, partial, or completed according to the existing cleanup contract.

## Fixture Child

- `issue_identity`: exact number, URL, title, body, state, labels, and coordinator reference.
- `artifact_path`: issue-numbered `spec.md`, `plan.md`, and `tasks.md` set.
- `dependency_layer`: 1 or 2.
- `dependencies`: empty for layer 1; both first-layer issue numbers for layer 2.
- `owned_surface`: one harmless disjoint Markdown file or the dependent summary file.
- `branch_and_worktree`: exact runtime Git resource.
- `handoff_state`: planned, prepared, handoff-ready, launched, or blocked.
- `handoff_ready_evidence_sha`: exact immutable coordinator commit containing the prepared handoff and disabled implementation/delivery permissions; its literal value is resolved only after that commit exists.
- `handoff_ready_recording_head`: later current remote coordinator head whose tracked artifact stores `handoff_ready_evidence_sha` and whose ancestry contains that evidence commit.
- `prepared_handoff_identity`: stable content fingerprint plus run ID, child issue, child branch, and child worktree correlation fields.
- `dispatch_identity`: canonical stable child/task handle returned by the approved child-agent capability; absent before accepted dispatch.
- `launched_evidence_sha`: exact immutable coordinator commit containing factual launched evidence and the dispatch identity; its literal value is resolved only after that commit exists.
- `activation_recording_head`: later current remote coordinator head whose tracked artifact stores `launched_evidence_sha`, whose ancestry contains it, and whose permission fields are true subject to child revalidation.
- `implementation_permission`: false before activation-head equality and launched-evidence ancestry verification; true only for the exact released child after current evidence satisfies the activation condition.
- `delivery_permission`: false before activation-head equality and launched-evidence ancestry verification; true afterward but still subordinate to completed tasks, fresh validation, correct PR target/wording, and no blocker.
- `control_plane_revision`: immutable pushed #260 commit supplying corrected coordinator/child workflow instructions to the runtime handoff.
- `workflow_state`: pending, waiting-for-dependency-merge, active, integrated, or blocked.
- `validation_state`: one current canonical result per requirement plus preserved historical attempts.
- `pull_request`: URL, target coordinator branch, source branch, readiness, body wording, and merge observation when available.

## Validation Evidence

- `requirement`: exact route, artifact, Git, PR, scope, or safety property evaluated.
- `evaluated_state`: issue/ref/head/input set for which the result is valid.
- `command_or_review`: executed command or objective review method.
- `status`: passed, failed, skipped, timed out, interrupted, partial, stale, blocked, or not run.
- `freshness`: current or stale with reason.
- `output_summary`: enough evidence to judge the result without claiming unrun work.

## State Transitions

1. A run becomes routing-authorized only after the exact fixture identity is created, recorded, and re-read with the required body marker.
2. A dependency-ready child becomes handoff-ready after its prepared artifacts, Git context, disabled permissions, and handoff identity pass validation. The coordinator commits/pushes that evidence, then a later bounded recording commit stores the exact evidence SHA; current remote equality to the recording head and ancestry containment of the evidence SHA are required before dispatch.
3. A handoff-ready child is dispatched once into preflight-only state. Unambiguous acceptance records one stable dispatch identity; no repository edit is permitted.
4. Accepted dispatch makes `launched` factual. The coordinator commits/pushes that evidence, then a later bounded activation/recording commit stores the exact launched evidence SHA; implementation and delivery permission remain ineffective until current remote equality, evidence ancestry, and identity correlation pass.
5. The same held child becomes active only after targeted continuation, clean child-branch incorporation of the current activation head, verification that it contains the launched evidence SHA, release acknowledgment, and permission revalidation. This sequence is not atomic, and no evidence commit is required to contain its own SHA.
6. A merged child becomes integrated only after remote merge evidence is re-read and the local coordinator branch is refreshed to ancestry containing the child result.
7. The still-active layer-1 child becomes stale after coordinator refresh, then current only after a normal merge refresh and validation rerun.
8. The layer-2 child becomes ready-next-layer only after both layer-1 children are integrated.
9. H validation starts only after every prepared child is uniquely integrated. H2 freezes the tracked coordinator artifact.
10. Cleanup becomes eligible only after the final runtime PR is confirmed merged into `main`; eligibility alone does not authorize deletion.
