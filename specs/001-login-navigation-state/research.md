# Research: Safe Login Navigation Transition

## Angular navigation settlement

- **Decision**: Use `Router.navigateByUrl()` as the login settlement boundary and root `NavigationEnd` as the completed-route boundary.
- **Rationale**: Existing APIs distinguish true, false, rejection, and the route that actually completed.
- **Alternatives considered**: Router wrapper or global transition store; both duplicate existing responsibilities.

## Login-route classification

- **Decision**: Classify completed URL by path so `/login` remains public with query parameters/fragments.
- **Rationale**: Login uses `returnUrl` query parameters and the root already normalizes Calendar URLs.
- **Alternatives considered**: Raw equality would misclassify query-bearing login URLs.

## Pending presentation and recovery

- **Decision**: Keep existing submitting state through navigation, show shared loading after authentication, and use existing logout plus `loginFailed` on unsuccessful routing.
- **Rationale**: These explicit issue anchors preserve ownership, accessibility, and localized non-technical errors.
- **Alternatives considered**: Separate global state, new spinner, or raw errors; all violate constraints.

## Permanent coverage

- **Decision**: Add focused tests only at root shell and login boundaries.
- **Rationale**: The issue explicitly requires them and async route/session ordering has meaningful maintenance value.
- **Alternatives considered**: Duplicate guard/service tests or new E2E infrastructure exceed scope.
