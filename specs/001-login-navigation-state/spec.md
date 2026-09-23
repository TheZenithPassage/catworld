# Feature Specification: Safe Login Navigation Transition

**Feature Branch**: `chore/418-avoid-authenticated-shell-during-pending-login-navigation`

**Created**: 2026-09-23

**Input**: GitHub issue `TheZenithPassage/catworld#418` — avoid exposing an authenticated shell while post-login navigation is pending and recover cleanly if navigation does not complete.

## User Scenarios, Technical Outcomes & Testing

### User Story 1 - Remain in the public shell during post-login navigation (Priority: P1)

As a user whose credentials were accepted, I remain on a recognizable login surface while CatWorld navigates to my requested authenticated destination, without seeing authenticated navigation or actions before that transition finishes.

**Why this priority**: Showing authenticated controls on the login route creates an inconsistent and potentially misleading security boundary during a critical authentication transition.

**Independent Test**: Complete authentication while holding destination navigation pending and verify that the login route, public layout, localized loading state, and absence of authenticated shell controls persist until navigation completes.

**Acceptance Scenarios**:

1. **Given** valid credentials and a normal authenticated return URL, **When** authentication succeeds but navigation remains pending, **Then** the active login flow remains in the public shell and displays an accessible loading state without authenticated navigation or actions.
2. **Given** valid credentials and a lazy-loaded authenticated return URL, **When** authentication succeeds while the destination is still loading, **Then** the same public-shell loading behavior persists for the full pending interval.
3. **Given** pending post-login navigation, **When** the user attempts to submit again, **Then** no additional authentication request starts.
4. **Given** pending post-login navigation, **When** navigation completes away from the login flow, **Then** the authenticated shell becomes available only after that completion.

---

### User Story 2 - Recover from unsuccessful destination navigation (Priority: P1)

As a user whose credentials were accepted but whose destination navigation fails or is cancelled, I return to a usable login experience instead of remaining authenticated or indefinitely loading on the login route.

**Why this priority**: A failed transition must not leave CatWorld in a contradictory authenticated-on-login state or prevent another login attempt.

**Independent Test**: Cause destination navigation to resolve unsuccessfully and verify that the in-memory session is cleared, loading ends, the form becomes usable again, and a localized generic login failure is presented.

**Acceptance Scenarios**:

1. **Given** authentication succeeded and destination navigation is pending, **When** navigation fails, **Then** the session is cleared, the login form is restored, and a localized login failure is shown.
2. **Given** authentication succeeded and destination navigation is pending, **When** navigation is cancelled or otherwise resolves without leaving the login flow, **Then** the same recovery behavior occurs and the user may submit credentials again.
3. **Given** unsuccessful destination navigation exposes router-specific details internally, **When** recovery feedback is rendered, **Then** the user sees only the existing localized generic login failure message.

### Observable Behavior Detail

- **Visible states**: Before submission, the existing login form remains unchanged. While authentication is in flight, the existing submitting behavior remains. After credentials are accepted and until destination navigation completes, the login page shows the shared accessible loading presentation with its Material spinner and localized copy. On navigation failure or cancellation, loading disappears, the form becomes usable, and a localized generic login failure alert is shown.
- **Interaction outcomes**: Login submission is disabled throughout authentication and pending destination navigation. The authenticated navbar, authenticated actions, and authenticated main-layout presentation are absent while the active route remains `/login`. Successful navigation ends the login flow; failed or cancelled navigation permits retry.
- **Copy and localization**: New loading feedback uses the existing English/Spanish localization system. Navigation failure uses localized generic login failure copy and never displays raw router or backend details.
- **Responsive/mobile behavior**: The existing responsive login and public-shell presentation is preserved; the loading state uses the shared responsive `UiStateComponent` pattern without introducing a new layout.

### Input/State Validation Matrix

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| Blank username or password | Yes | No | Existing localized required-field error | Existing credential handling preserved | Correcting the field clears or replaces the existing validation message through the current flow |
| Valid credentials, authentication request pending | Yes after first submit | Exactly one login request | Existing submitting state | Existing trimmed username and password behavior preserved | Request completion advances to navigation or existing authentication error handling |
| Authentication accepted, destination navigation pending | Yes | No additional login request | Localized shared loading state; no authenticated shell | Session is held only for the attempted transition | Navigation completion leaves login; unsuccessful completion performs recovery |
| Destination navigation completes away from `/login` | N/A | No additional login request | Authenticated destination and shell | Existing return URL preserved | N/A |
| Destination navigation fails, is cancelled, or completes without leaving login | No after recovery | No additional login request until a new submit | Localized generic login failure | In-memory session cleared; entered credentials otherwise follow existing form behavior | A new valid submit replaces the error through the existing submission flow |

### Edge Cases

- Navigation to a lazy-loaded authenticated route remains pending longer than navigation to an eager route; public-shell loading behavior must remain stable for the entire interval.
- Router navigation may reject, resolve `false`, or otherwise finish without leaving `/login`; each outcome must restore a logged-out, retryable login state.
- Authentication state can become available before a router completion event; the root shell must still be governed by whether the active flow is the login route.
- Query parameters and the existing `returnUrl` contract must not cause `/login` to be misclassified as an authenticated destination.
- Existing authentication errors remain distinct from post-authentication navigation failure while both use localized, non-technical feedback.

## Requirements

### Functional Requirements

- **FR-001**: CatWorld MUST retain the public shell, including the public main layout, for the entire time the active route is `/login`, regardless of whether an in-memory authenticated session already exists.
- **FR-002**: The login page MUST show an accessible localized loading state using the existing shared loading presentation for the entire interval between accepted credentials and completed destination navigation.
- **FR-003**: The login flow MUST prevent any additional authentication request while either authentication or post-authentication destination navigation is pending.
- **FR-004**: CatWorld MUST expose the authenticated shell only after router navigation has completed away from the login flow.
- **FR-005**: When destination navigation fails, is cancelled, resolves unsuccessfully, or otherwise does not complete away from login, CatWorld MUST clear the in-memory authenticated session.
- **FR-006**: After unsuccessful destination navigation, the login page MUST return to a non-loading, usable state that permits another credential submission.
- **FR-007**: After unsuccessful destination navigation, the login page MUST show a localized generic login failure message and MUST NOT expose router or backend implementation details.
- **FR-008**: The transition behavior MUST apply consistently to eager and lazy-loaded authenticated destinations.

### Technical Requirements

- **TR-001**: The existing `AuthSessionService` MUST remain the single owner of in-memory authentication state, and recovery MUST use its existing logout behavior rather than a parallel state mechanism.
- **TR-002**: Root-shell visibility MUST extend the existing Router navigation-completion awareness so authentication state alone cannot select the authenticated shell while the active flow is `/login`.
- **TR-003**: The existing `returnUrl`, authentication guard, administrator guard, HTTP Basic authentication, and backend authentication contracts MUST remain unchanged.
- **TR-004**: The implementation MUST NOT introduce a new state-management framework, routing abstraction, login loading component, or dependency.
- **TR-005**: Focused frontend automated coverage MUST verify the pending-navigation shell boundary, loading and duplicate-submit behavior, completed navigation, unsuccessful navigation recovery, and the root-shell condition.
- **TR-006**: Validation MUST include the complete frontend automated test suite and frontend production build, plus manual verification of normal and throttled navigation including a lazy-loaded authenticated destination.

### Scope Boundaries

- **SB-001**: Changes are limited to the frontend authentication transition, route-aware application shell, existing localization resources, focused frontend tests, and source-of-truth documentation when implemented behavior would otherwise be unclear.
- **SB-002**: Existing authentication, authorization, return-URL, logout, and backend behavior outside the post-login transition MUST remain unchanged.
- **SB-003**: The implementation MUST reuse existing CatWorld authentication, routing, UI-state, Material, and localization patterns.

### Out of Scope

- Backend authentication or authorization changes.
- Persisted or remembered frontend sessions.
- A new authenticated-on-login retry state after navigation failure.
- Route authorization policy or return-URL contract changes.
- Unrelated shell or login-page redesign.

### Open Questions

None. The approved issue resolves the behavior, recovery, reuse, localization, coverage, and validation boundaries required for implementation.

## Success Criteria

### Measurable Outcomes

- **SC-001**: During every tested pending post-login navigation interval, the login route retains the public shell and exposes no authenticated navbar or authenticated actions.
- **SC-002**: During every tested pending post-login navigation interval, one accessible Material loading state remains visible and repeated submissions start no additional authentication request.
- **SC-003**: Successful destination navigation enables the authenticated shell only after leaving the login flow, for both eager and lazy-loaded authenticated destinations.
- **SC-004**: Every tested failed or cancelled destination navigation clears the in-memory session, restores a usable non-loading login form, and shows localized generic failure feedback.
- **SC-005**: The frontend automated test suite and production build complete successfully after the change.

## Assumptions

- Existing login-field validation and credential retention behavior remains unchanged because the issue does not request form-field redesign.
- The existing generic localized login failure message is appropriate for destination-navigation recovery, as required by the issue's reuse and non-technical-feedback constraints.
