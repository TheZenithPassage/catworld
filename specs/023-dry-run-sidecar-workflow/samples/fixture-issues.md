# Fixture Issues

These are local dry-run fixtures, not real GitHub issues. They use `DRY-`
prefixes so they cannot be confused with CatWorld GitHub issue numbers.

## Fixture Set

| Fixture | Classification | State | Children | Purpose |
|---------|----------------|-------|----------|---------|
| `DRY-9901` - Controlled workflow dry-run coordinator | Coordinator | Open | `DRY-9902`, `DRY-9903`, `DRY-9904` | Valid coordinator `parallel` and sidecar artifact/Git/PR/validation evidence. |
| `DRY-9902` - Child routing fixture | Direct child | Open | None | Child artifact and branch fixture; independent candidate. |
| `DRY-9903` - Child reporting fixture | Direct child | Open | None | Validation reporting and PR wording fixture; independent candidate. |
| `DRY-9904` - Child resume fixture | Direct child | Open | None | Resume/cleanup fixture; blocked in one sample to prove blocker reporting. |
| `DRY-9905` - Non-coordinator workflow issue | Normal implementable issue | Open | None | Invalid non-coordinator `parallel` routing. |
| `DRY-9906` - Open-child coordinator | Coordinator | Open | `DRY-9907` open | Invalid coordinator end-to-end while listed child issues are still open. |
| `DRY-9907` - Open child for blocked coordinator | Direct child | Open | None | Makes `DRY-9906` an open-child coordinator. |
| `DRY-9908` - Closed-child coordinator | Coordinator | Open | `DRY-9909`, `DRY-9910` closed | Valid closed-child coordinator final pass through sequential workflow. |
| `DRY-9909` - Closed child A | Direct child | Closed | None | Closed child scope that must not be redone. |
| `DRY-9910` - Closed child B | Direct child | Closed | None | Closed child scope that must not be redone. |
| `DRY-9911` - Direct child end-to-end fixture | Direct child | Open | None | Valid direct child end-to-end routing through sequential workflow. |

## Controlled Coordinator Body: DRY-9901

```md
## Goal

Dry-run sidecar coordinator routing and operational guardrails without product
implementation.

## Child issues

- [ ] DRY-9902 - Child routing fixture
- [ ] DRY-9903 - Child reporting fixture
- [ ] DRY-9904 - Child resume fixture

## Dependencies

- DRY-9902 and DRY-9903 are independent candidates.
- DRY-9904 is blocked by a simulated shared-contract gap for blocker evidence.

## Validation

- Prepare or describe coordinator and child artifact paths.
- Record coordinator branch and child branch names.
- Record child PR target expectations.
- Record validation status and freshness.
- Stop before child implementation, PR operations, GitHub issue mutation, and cleanup.
```

## Live Issue References

- Real issue #234 is the active implementation issue and routes through the
  normal sequential workflow.
- Parent epic #220 and issues #221 through #234 are sequential-only while the
  sidecar workflow is designed, validated, and adopted.
- No live controlled coordinator issue outside #220-#234 was found during the
  read-only search performed for this dry-run.
