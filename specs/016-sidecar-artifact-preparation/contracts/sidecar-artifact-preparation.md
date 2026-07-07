# Sidecar Artifact Preparation Contract

## Purpose

Define the artifact-preparation contract that the sidecar coordinator skill must
apply before any future delegation to child implementation work.

## Accepted Input

- A clearly identified CatWorld coordinator issue selected for sidecar
  preparation by an approved workflow path.
- Full coordinator issue title, body, state, labels, listed child issues,
  dependency information, validation requirements, and source-of-truth
  references.
- Full child issue title, body, state, labels, dependencies, validation
  requirements, and source-of-truth references for each listed child issue.
- Repository source-of-truth context from `AGENTS.md`, the constitution,
  `docs/ARCHITECTURE.md`, applicable feature artifacts under `specs/`, and the
  #225 sidecar artifact path contract.

## Coordinator Artifact Requirements

The coordinator orchestration artifact must contain or explicitly require:

- coordinator issue number, title, classification, and source references;
- child issue map with each child issue number, title, state, dependency notes,
  and artifact path;
- dependency layers that identify hard dependencies, independent candidates,
  conflict risks, and incomplete-context blockers;
- shared contract section that records cross-child contracts, source-of-truth
  references, and unresolved shared-contract blockers;
- validation plan covering coordinator-level validation and child-level evidence
  expected before integration or final review;
- status table for every child issue and preparation outcome.

## Child Artifact Requirements

Each child issue must have prepared or described artifacts at:

```text
specs/<child-issue-number>-<child-slug>/
├── spec.md
├── plan.md
└── tasks.md
```

Each child artifact set must be derived from:

- the coordinator artifact;
- that child issue body;
- dependency layer placement;
- shared contract requirements;
- applicable source-of-truth documentation;
- existing feature artifacts when present.

Child artifacts must not expand beyond the child issue scope or silently absorb
missing shared-contract, foundation, or seed work.

## Path Contract

Coordinator artifact paths use:

```text
specs/<coordinator-number>-coordinator-<slug>/
```

Child artifact paths use:

```text
specs/<child-issue-number>-<child-slug>/
```

The GitHub issue number is the uniqueness key. Existing target paths,
same-number prefixes, or duplicate child issue numbers are stop conditions.

## Stop Conditions

The sidecar coordinator must stop before delegation when:

- coordinator or child issue context cannot be fetched, classified, or
  reconciled;
- coordinator, child issue, source-of-truth, or shared-contract requirements
  conflict;
- shared contracts are missing, unsafe, or unresolved;
- a seed, foundation, or shared-contract child issue appears necessary but does
  not already exist and the user has not explicitly approved creating it;
- a target coordinator or child artifact path already exists or collides;
- dependency layers reveal hard dependencies or conflict risks that make
  delegation unsafe;
- any prepared child artifact expands beyond approved child issue scope;
- closed-child coordinator final-pass routing applies.

## Prohibited Side Effects

Artifact preparation must not:

- change the normal sequential Spec Kit flow;
- run for closed-child coordinator final passes;
- create unapproved seed, foundation, or shared-contract child issues;
- mutate GitHub issues, labels, assignees, milestones, comments, or state;
- create, switch, merge, rebase, push, delete, or prune Git branches;
- create, update, delete, or clean worktrees;
- delegate child implementation work;
- open, update, merge, approve, or enable auto-merge on pull requests;
- modify CatWorld product code;
- modify `.agents/skills/catworld-implement-issue/SKILL.md`.

## Validation Contract

Validation must include:

- one simulated coordinator with at least three child issues;
- artifact path verification against the #225 coordinator and child path rules;
- blocker simulation for missing shared contracts;
- review that no seed, foundation, or shared-contract child issue is invented;
- review that closed-child coordinator final pass stays outside this path;
- changed-file review proving `.agents/skills/catworld-implement-issue/SKILL.md`
  and product code are untouched;
- `git diff --check`.
