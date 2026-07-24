---
name: catworld-feature-planning
description: Plan CatWorld release features from an updated origin/main baseline into feature epics and focused backend and frontend implementation issues, continue a user-identified local feature plan, or publish an explicitly approved plan to GitHub. Use when the user asks to plan features for a CatWorld release, convert feature descriptions into an epic and implementation issues, continue a specific feature-planning artifact, or publish an approved feature plan.
---

# CatWorld Feature Planning

Turn user-defined product behavior into a reviewable release plan and, only
after explicit authorization, GitHub epics and implementation issues. Write
GitHub titles and bodies in English.

## Sources of truth

- After refreshing the remote baseline, treat the code at `origin/main` as the
  source of truth for implemented behavior. Use repository documentation from
  that baseline for established contracts and architectural context.
- Treat GitHub issues and pull requests as the source of truth for planned,
  active, and completed work.
- Treat the local planning artifact only as working memory for the active,
  unpublished plan. It is not a parallel backlog or permanent publication
  record.

## Start or continue a plan

1. Read `AGENTS.md` and `.specify/memory/constitution.md`.
2. Run `git fetch origin main`. Inspect `origin/main` directly without checking
   out, changing, or updating local `main`. Stop if the fetch fails or a reliable
   `origin/main` baseline cannot be inspected.
3. For a new request, identify the target release and user-defined features in
   scope, then create one clearly named, human-readable artifact under
   `specs/`. Default to Markdown, but use another readable format when it fits
   better. Do not use Spec Kit names such as `spec.md`, `plan.md`, or
   `tasks.md`. Create the new artifact with state `draft`.
4. Do not scan or enumerate `specs/` for previous plans. Read an existing
   artifact only when the user explicitly asks to continue that specific file.
   During an active planning conversation, keep updating the already known
   artifact.
5. Use diagrams only when they materially clarify relationships, states, flows,
   or dependencies; keep complete issue definitions in text.

## Understand the requested work

Compare the requested behavior with the relevant code and documentation at
`origin/main` and only the related GitHub issues and pull requests. Report
whether the requested functionality already exists fully or partially. Do not
propose or publish equivalent work; for partial implementations, plan only the
remaining approved behavior. Do not exhaustively inspect the repository, test
suite, backlog, milestones, or labels.

Let the user define features and product behavior. Ask only about decisions that
materially change behavior, scope, contracts, dependencies, architecture, or
issue boundaries. Leave minor technical, testing, component, and visual choices
to `catworld-implement-issue`. Do not add behavior because it appears useful or
conventional.

If one user-defined feature appears to contain independent features, explain
the possible split and ask the user. Do not create additional epics
unilaterally.

Apply the constitution proportionally. Add a brief constitution check to the
plan. Expand it only when the feature triggers a material architecture or
technology decision that requires human approval.

## Maintain the active artifact

Keep only the information needed to review and resume the unpublished plan:

- release and planning scope;
- confirmed behavior and boundaries for each feature;
- complete proposed epic titles and bodies;
- complete proposed implementation issue titles and bodies;
- implementation order and hard dependencies;
- decisions that still block part of the plan;
- a brief constitution check;
- state: `draft` or `approved`.

Update the artifact when a material decision changes the plan. If an approved
plan changes materially, return it to `draft`. Do not store a publication
ledger, ownership metadata, GitHub URLs, recovery metadata, or a `published`
state. After successful publication, GitHub is authoritative; do not require
preservation or automatic rediscovery of the artifact.

## Structure epics and implementation issues

- Create one `[Epic]` issue for each complete user-defined feature. Epics
  organize work and are not implemented directly.
- Link every implementation issue from its epic and reference the parent epic
  from every implementation issue. Use native GitHub relationships when the
  available tools support them, while retaining clear references in issue
  bodies.
- Assign an epic and all its implementation issues to the same milestone.
- Make each leaf implementation issue one focused, independently understandable
  pull request that leaves `main` valid after merge. Only leaf implementation
  issues are valid inputs to `catworld-implement-issue`.
- For full-stack features, create at least one `[Backend]` issue and at least one
  `[Frontend]` issue. Implement and merge the backend first, make the frontend
  issue explicitly depend on it, and have the frontend consume and adapt to the
  implemented backend contract.
- Keep backend authoritative for persistence, invariants, validation,
  permissions, business rules, and the API contract. Keep frontend responsible
  for interaction, accessibility, and visual experience.
- For backend-only or frontend-only features, create only the relevant issue.
- Begin with one issue per required layer. Add issues only when every result
  owns a coherent, independently implementable and reviewable outcome.
- Do not split by entities, DTOs, services, controllers, components, migrations,
  files, fields, or tests. Avoid microissues for trivial mechanical or visual
  work.
- Record only hard dependencies as dependencies. Keep optional sequencing
  separate.
- Do not add coordinators or another hierarchy level.

Use `.github/ISSUE_TEMPLATE/feature-epic.md` and
`.github/ISSUE_TEMPLATE/implementation-issue.md`. Add optional sections such as
`Business rules`, `Validation`, or `Out of scope` only when they convey concrete
issue-specific information. Do not repeat the implementation workflow, Spec Kit
process, file prescriptions, generic commands, or generic testing requirements
in every issue.

## Review and publish

Present the proposed epics, implementation issues, order, hard dependencies, and
blocking decisions to the user in Spanish. Keep proposed GitHub titles and
bodies in English. Mark the artifact `approved` only when the user approves the
complete plan.

Do not write to GitHub until the user explicitly authorizes publication of the
exact plan. When authorized:

1. Recheck only related GitHub work for equivalent epics or implementation
   issues. Stop rather than publish duplicates.
2. Use or create the agreed milestone only when the authorization covers it,
   and assign every created epic and implementation issue to it.
3. Create each epic before its implementation issues.
4. Link every child from its epic, reference the epic from every child, and use
   native relationships when supported.
5. Apply only relevant existing labels.
6. Read the created issues back and verify their essential content,
   relationships, milestone, and labels.

If publication fails partway, stop and report exactly what was created and what
remains pending. Do not recreate items automatically.
