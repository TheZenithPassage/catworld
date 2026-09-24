# Login Navigation UI Contract

| State | Active route | Session | Login surface | Shell | Allowed action |
|-------|--------------|---------|---------------|-------|----------------|
| Ready | `/login` | Empty | Credential form | Public | Submit valid credentials |
| Authenticating | `/login` | Empty | Existing submitting form state | Public | No duplicate submit |
| Navigating | `/login` | Present | Accessible localized shared loading | Public | No duplicate submit |
| Completed | Not `/login` | Present | Destination content | Authenticated | Destination actions |
| Recovery | `/login` | Cleared | Form plus localized generic failure | Public | Submit again |

- Authentication failure retains existing localized semantics.
- Navigation resolving `true` succeeds only when completed routing ends the login flow.
- `false`, rejection, cancellation, or remaining on `/login` triggers recovery.
- Recovery uses existing logout and exposes no implementation details.
- `returnUrl`, guards, HTTP Basic construction, and backend contracts remain unchanged.
