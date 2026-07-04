# Phase 0 Research: Remove Legacy UI Styles

## Researchable Unknowns

None. The specification contains no `NEEDS CLARIFICATION` markers and no unresolved material product, architecture, persistence, security, shared-contract, authorization, UX, operational, or correctness-sensitive decisions.

## Repository Findings

- **Decision**: Use the already approved Angular Material foundation and remove only superseded native-control coexistence styling.
  - **Rationale**: `docs/ARCHITECTURE.md` documents Angular Material and Angular CDK as the default UI foundation approved by issue #176, while issue #183 specifically asks to remove legacy native UI infrastructure after dependencies #177 through #182.
  - **Alternatives considered**: Introducing a new component system or keeping the native global component system. Both are out of scope because issue #183 requires a coherent Material-based interface and the constitution forbids unapproved framework or architecture changes.

- **Decision**: Treat data model, API contracts, persistence, backend services, authorization, and migrations as not applicable.
  - **Rationale**: The issue scope is frontend style cleanup, documentation, and validation. The spec explicitly preserves routes, behavior, translations, role visibility, backend APIs, authorization, and persistence.
  - **Alternatives considered**: Adding backend or API validation artifacts. Rejected as unnecessary and scope-expanding for a frontend presentation cleanup.

- **Decision**: Use source audit, frontend regression commands, and manual keyboard/viewport smoke checks as validation evidence.
  - **Rationale**: Removing global CSS can create visual, focus, target-size, and responsive regressions that are not fully proven by unit tests. Issue #183 explicitly requires format, tests, build, keyboard validation, and target-device checks.
  - **Alternatives considered**: Automated tests only. Rejected because target-device and keyboard validation are explicit issue requirements.
