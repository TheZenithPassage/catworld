# Quickstart: Sidecar Validation Reporting

Run these checks after implementing issue #231 and rerun any affected check
after later edits to sidecar workflow or reporting text.

## Prerequisites

- Run commands from the CatWorld repository root.
- Do not run sidecar parallel execution for issue #231.
- Do not open real pull requests.
- Do not mutate GitHub issues, labels, assignees, milestones, issue state, or
  public comments.

## 1. Review Local Sample Reports

Expected sample files:

```text
specs/020-sidecar-validation-reporting/samples/sidecar-success-report.md
specs/020-sidecar-validation-reporting/samples/sidecar-failure-report.md
specs/020-sidecar-validation-reporting/samples/sidecar-stale-validation-report.md
specs/020-sidecar-validation-reporting/samples/sidecar-blocker-report.md
specs/020-sidecar-validation-reporting/samples/sidecar-conflict-report.md
specs/020-sidecar-validation-reporting/samples/sidecar-human-only-blocker-report.md
specs/020-sidecar-validation-reporting/samples/coordinator-final-pass-report.md
```

Expected outcome:

- Success samples list commands or reviews as passed and fresh.
- Failure samples include failed or not-run evidence and do not summarize it as
  passed.
- Stale samples identify the branch update or relevant change that made
  evidence stale.
- Blocker samples distinguish child-specific, coordinator-wide, and
  shared-contract blockers.
- Conflict samples stop for user guidance when contract, scope, persistence,
  security, authorization, UX, or domain behavior is affected.
- Human-only blocker samples identify a covered category, affected scope, and
  required human decision.
- The closed-child coordinator final-pass sample uses normal sequential
  reporting and does not present closed child scope as newly implemented work.

## 2. Required Text Checks

```powershell
Select-String -Path specs/020-sidecar-validation-reporting/samples/*.md -Pattern 'passed','failed','stale','not run','draft','ready','user guidance','explicit user approval'
Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,.agents/skills/catworld-parallel-child-implementation/SKILL.md,docs/ARCHITECTURE.md -Pattern 'failed validation is never summarized as passed','stale','child-specific blocker','coordinator-wide blocker','shared-contract blocker','human-only blocker','public comments','explicit user approval','normal sequential reporting'
Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,.agents/skills/catworld-parallel-child-implementation/SKILL.md,docs/ARCHITECTURE.md -Pattern 'contract, scope, persistence, security, authorization, UX, or domain behavior'
git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md
git diff --check
```

Expected outcome:

- Sample reports contain explicit status, readiness, blocker, user-guidance,
  and approval-boundary language.
- Sidecar workflow text contains required validation, blocker, conflict,
  human-only blocker, public-comment, explicit-approval, and normal-sequential
  boundary wording.
- `.agents/skills/catworld-implement-issue/SKILL.md` has no diff.
- `git diff --check` reports no whitespace errors.

## 3. Manual Review Checklist

- Verify reports record commands run, failed, skipped, stale, and not run.
- Verify failed, timed-out, skipped, interrupted, partial, stale, and not-run
  validation is never summarized as passed.
- Verify stale validation after branch updates blocks readiness until rerun or
  explicitly reported as stale.
- Verify ready/draft child PR readiness depends on fresh required validation,
  unresolved blockers, and sidecar PR target rules.
- Verify shared-contract blockers stop affected sidecar work.
- Verify non-trivial conflicts affecting contract, scope, persistence,
  security, authorization, UX, or domain behavior require user guidance.
- Verify human-only blocker categories include material architecture,
  production exposure, deployment, secrets, and Git/GitHub workflow issues.
- Verify no workflow text permits GitHub issue body, checklist, label,
  assignee, milestone, state, or public comment mutation without explicit user
  approval.
- Verify normal sequential validation/reporting behavior is unchanged.
- Verify closed-child coordinator final-pass reporting remains normal
  sequential reporting.
- Review the implementation against issue #220 routing and operational
  guardrails.
