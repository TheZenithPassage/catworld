# Quickstart: Run and Validate the Live Sidecar Dry Run

## Prerequisites

- Run control operations from the clean #260 build-out checkout.
- Use current read-only GitHub evidence for issue/PR decisions.
- Fetch `origin/main` and `origin/workflow/sidecar-buildout` without updating local `main`.
- Record the original local-main SHA and empty `git status --porcelain` result.
- Treat every user merge as an external checkpoint; do not poll or merge on the user's behalf.
- Before runtime resume, prove the environment can retain one stable named child-agent identity across a preflight-only turn and a targeted continuation with zero repository actions.

## Preparation checks

```powershell
git status --porcelain
git fetch origin main workflow/sidecar-buildout
git rev-parse refs/heads/main
git rev-parse refs/remotes/origin/main
git rev-parse refs/remotes/origin/workflow/sidecar-buildout
git worktree list --porcelain
```

Confirm the #260 branch descends from the fetched build-out ref, the runtime coordinator branch descends from the fetched main ref, target paths/refs do not collide, and local `main` remains unchanged. If `refs/heads/main` has no attached worktree, record that from the worktree inventory instead of claiming an unrun main-checkout status; prove the ref/tree are unchanged and every existing run checkout is clean.

## Routing validation

Review current issue evidence and the five active routing sources. Prove:

- the exact recorded coordinator with the #260 body marker routes with `parallel`;
- the same request stops if the marker or exact identity does not agree;
- another coordinator remains blocked before #261;
- normal/direct-child `parallel` remains invalid;
- coordinator without `parallel` and open children remains blocked;
- closed-child coordinator final pass remains sequential;
- #220 through #234 remain excluded.

Run the existing prohibited-operation scenario after routing edits:

```powershell
& .\specs\032-final-coordinator-delivery\validation\simulate-final-coordinator-delivery.ps1 -Scenario prohibited-operations
```

Inspect the sequential-skill diff and confirm only routing-boundary hunks changed:

```powershell
git diff --unified=0 origin/workflow/sidecar-buildout -- .agents/skills/catworld-implement-issue/SKILL.md
git diff --exit-code origin/workflow/sidecar-buildout -- .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md
```

## Two-phase dispatch validation

The barrier is ordered and explicitly non-atomic:

1. Commit and normally push handoff-ready evidence `R` with each selected child non-launched, implementation/delivery false, prepared-handoff identity, and immutable control-plane source revision. Resolve its literal SHA only after the commit exists.
2. Store exact `R` in one later bounded recording commit `Rr`, push/fetch it, prove the remote ref equals `Rr`, and prove `R` is in its ancestry. Do not require a commit to contain its own SHA.
3. Dispatch the child in preflight-only mode. Accept only an unambiguous canonical child/task identity; do not release it or allow repository mutation. The clean child branch may remain behind `Rr` during this read-only preflight.
4. Record factual `launched` plus that identity in evidence commit `L` and normally push it. Resolve exact `L`, store it with activation permissions in one later bounded recording commit `Lr`, push/fetch `Lr`, prove remote equality to `Lr`, and prove `L` is in its ancestry.
5. Target only that same identity with continuation. The child fetches and incorporates `Lr` by fast-forward or normal merge, verifies it contains `L`, proves the worktree stayed clean, acknowledges release, and revalidates effective implementation/delivery permission before executing tasks.

Run the complete focused #255 and #256 simulation surfaces, including every newly added barrier failure and behind-child case, and parse both scripts before treating them as fresh evidence. Rejected or ambiguous dispatch, failed evidence/recording push, failed child refresh/ancestry verification, and release failure must all produce zero implementation edits and zero delivery. An ambiguous dispatch must not create a replacement child.

The harmless capability proof uses `spawn_agent` for preflight-only dispatch and `followup_task` against the returned canonical task name for targeted continuation. A separate `spawn_agent` call is a different child and cannot be substituted.

## Mandatory checkpoints

At each stage, update durable factual evidence before returning:

1. Pause 1: handoff-ready/launched evidence SHAs and their containing recording/activation heads, stable dispatch identities, proof of zero pre-release edits, two ready first-layer PR URLs/branches/commits/validation, unchanged local-main proof, and an instruction to merge exactly one selected PR with GitHub's merge-commit strategy.
2. Pause 2: one merged child proof, refreshed coordinator SHA, active-child normal-merge proof, rerun validation, remaining PR URL, and an instruction to merge that PR with GitHub's merge-commit strategy.
3. Pause 3: both first-layer ancestry proofs, the ready dependent-child PR URL, and an instruction to merge it with GitHub's merge-commit strategy.
4. Pause 4: H/H2, integrated and artifact-affected checks, remote H2 equality, final ready PR URL/source/target, risks, and exact user merge action.

Do not continue beyond a pause until the user reports the required merge state. On resume, re-read GitHub, refs, artifacts, worktrees, validation, blockers, and cleanup state before acting.

## Runtime Git checks

Use direct run-specific commands at the relevant runtime worktree/ref:

```powershell
git status --porcelain
git rev-parse HEAD
git rev-parse <expected-ref>
git merge-base <base> <head>
git merge-base --is-ancestor <child-commit> <coordinator-head>
git diff --name-status <merge-base>..<head>
git diff --check <explicit-range>
```

Do not treat `specs/032-final-coordinator-delivery/validation/verify-finalization-evidence.ps1` as a generic live H2 verifier; it is scoped to issue #258/build-out constants. Validate live H/H2 directly against the current coordinator artifact and contract.

## Final #260 validation

After the final runtime merge and cleanup-eligibility evaluation, run all applicable existing #250–#259 focused validations named by the final task list, the live evidence reviews, and:

```powershell
git diff --check
git status --short
git diff --name-only origin/workflow/sidecar-buildout...HEAD
```

Rerun any check affected by a later routing, artifact, ref, base, merge, or evidence change. Report evidence not rerun as stale or not revalidated rather than passed.
