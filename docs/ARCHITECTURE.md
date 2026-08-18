# CatWorld Architecture

CatWorld is a full-stack administration system for cat-boarding operations.

This document describes the currently implemented architecture and domain behavior. It is not a permanent limit on future CatWorld product scope.

This document focuses on the backend architecture, domain model, persistence decisions and testing strategy.

## Scope

CatWorld currently covers:

- Owner management.
- Cat management.
- Reference vet management.
- Stay booking management.
- Independently configurable nightly reference rates for one cat, two cats and
  three or more cats.
- Permanent stay deletion for authorized correction of mistaken records.
- Database-backed HTTP Basic application authentication.
- ADMIN-only application account management with fixed `ADMIN` and `STAFF` roles.
- Safe ADMIN-only application account deletion with creator and enabled-admin protection.
- Lookup of current, future, completed and cancelled stays.

## Stack

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- MySQL
- Flyway
- Docker Compose
- JUnit 5
- Mockito
- Angular
- Angular animations
- Angular Material
- Angular CDK
- TypeScript
- SCSS
- FullCalendar
- GitHub Actions
- PlantUML

## Architecture Style

CatWorld is intentionally developed as a layered monolith.

```txt
controller -> service -> repository -> database
```

Main package responsibilities:

- `controller`: HTTP endpoints, request validation entry point and response status handling.
- `service`: business rules, transactions and application use cases.
- `repository`: persistence access through Spring Data JPA.
- `model`: JPA entities and domain behavior.
- `dto`: input and output contracts exposed by the API.
- `mapper`: conversion between DTOs and entities.
- `exception`: custom exceptions and global HTTP exception handling.

The project keeps business rules out of controllers. Controllers delegate to services and focus on the HTTP contract.

## Domain Model

### Main Entities

#### Owner

Represents a cat owner and contact information.

An `Owner` can have:

- multiple cats
- multiple stays
- one application account recorded as its creator

#### Vet

Represents a reference veterinarian.

A `Vet` can be associated with multiple cats, but a cat can also exist without a vet.

Each `Vet` stores the application account that created it.

#### Cat

Represents a cat registered in the boarding system.

A `Cat` belongs to one `Owner` and may optionally reference one `Vet`.

Each `Cat` stores the application account that created it.

#### Stay

Represents one boarding stay.

A `Stay` contains:

- `startAt`
- `endAt`
- `cancelledAt`
- `notes`
- nullable retained nightly reference rate
- nullable agreed whole-stay amount
- `owner`
- participating cats through `StayCat`
- the application account that created it

When an ADMIN changes the authoritative night count, the pricing confirmation
may retain the stay's original nullable nightly rate or select the current
applicable `ONE_CAT`/`TWO_CATS`/`THREE_PLUS_CATS` rate. The service locks the
stay and, for a current-rate selection, the applicable rate row; it rejects
arbitrary or stale selections, derives the suggestion from the selected rate,
and changes the stay snapshot only after the complete update validates.

#### StayCat

Represents the link between a `Stay` and a `Cat`.

The project uses an explicit link entity instead of a plain `@ManyToMany`.

#### UserAccount

Represents an application login account.

A `UserAccount` contains:

- unique username
- encoded password hash
- fixed `ADMIN` or `STAFF` role
- enabled state
- auditing timestamps

`UserAccount` does not store its own creator. Operational creator attribution
is stored only on owner, cat, vet and stay records.

#### NightlyReferenceRate

Represents the current optional whole-stay nightly amount for exactly one fixed
category: `ONE_CAT`, `TWO_CATS` or `THREE_PLUS_CATS`. Each category is
identified by its exact minimum cat-count configuration threshold (`1`, `2` or
`3`). The amount is a positive whole number with at most 19 digits, represented
in Java by `BigDecimal` and persisted as `DECIMAL(19,0)`.

#### NightlyReferenceRateChange

Represents one immutable, append-only transition of a nightly reference rate.
It records the category, exact previous and new nullable amounts, the
`UserAccount` that made the change and the application-clock timestamp.

#### StayPricingDecision

Represents one immutable pricing confirmation for a stay. It records the
selected retained nightly rate, previous and new authoritative night counts, previous
and new agreed amounts, optional reason, deciding `UserAccount` and
application-clock timestamp. It stores the stay UUID as audit evidence rather
than a foreign key so the history survives operational stay deletion.

#### StayAgreedAmountCorrection

Represents one immutable administrative correction of a stay's agreed amount.
It records the nullable exact previous amount, exact new amount, required
reason, deciding `UserAccount` and application-clock timestamp. It stores the
stay UUID as indexed audit evidence without an operational foreign key, so the
history survives cancellation and permanent stay deletion.

#### StayPayment

Represents one operational payment registered against a stay. It retains the
exact positive whole-unit amount, payment date, optional note, registering
`UserAccount`, timestamps and an annulled flag. Amount correction is the only
supported edit and annulment is terminal. An `ADMIN` may permanently remove an
active or annulled payment through the focused removal operation, which first
persists durable evidence and then deletes the operational row atomically.

#### StayPaymentEdit and StayPaymentAnnulment

Represent focused immutable evidence for real payment amount changes and
annulments. Each records scalar stay/payment UUIDs, the responsible
`UserAccount`, application-clock timestamp and required reason; edit evidence
also records the exact previous and new amounts. Scalar operational identities
let this evidence survive deletion of the payment's stay.

#### SensitiveStayContext and StayPaymentRemoval

`SensitiveStayContext` is an immutable per-event snapshot of the affected
stay, owner and deterministically ordered cats. It stores scalar operational
UUIDs plus names and stay dates, with no foreign keys to operational stay,
owner, cat or payment rows. Eligible pricing overrides, every new agreed-amount
correction, payment edit, payment annulment and payment removal each own one
context. Legacy producer rows are not backfilled and remain ineligible.

`StayPaymentRemoval` is immutable append-only evidence containing the exact
payment amount, date, note, annulled state, original registrar/time, removing
administrator/time and mandatory reason. Its stay and payment identities are
scalar; restrictive account foreign keys preserve attribution.

## Stay Model

### Key Rule

A `Stay` represents **one boarding stay**.

It can include:

- one cat
- multiple cats from the same owner

All cats inside the same `Stay` share:

- `startAt`
- `endAt`
- `cancelledAt`
- `notes`

If one cat needs a different checkout time, a separate cancellation or a different lifecycle, it should be modeled as a separate `Stay`.

## Relationships

Main relationships:

- An `Owner` may have zero or more `Cat` records; each `Cat` belongs to one `Owner`.
- A `Vet` may be referenced by zero or more cats; each `Cat` may reference zero or one `Vet`.
- An `Owner` may have zero or more `Stay` records; each `Stay` belongs to one `Owner`.
- A `Stay` contains one or more `StayCat` links.
- A `Cat` may have zero or more `StayCat` links.
- Each `Owner`, `Cat`, `Vet` and `Stay` references the `UserAccount` that
  created it.
- Each `NightlyReferenceRateChange` references the `UserAccount` that made the
  transition.
- Each `StayPricingDecision` references the `UserAccount` that confirmed the
  price and identifies its stay by an indexed UUID without an operational
  foreign key.
- Each `StayAgreedAmountCorrection` references the `UserAccount` that made the
  correction and identifies its stay by an indexed UUID without an operational
  foreign key.
- Each `StayPayment` belongs to one `Stay` and references the `UserAccount` that
  registered it.
- Each `StayPaymentEdit` and `StayPaymentAnnulment` references its actor but
  identifies the affected stay and payment with indexed scalar UUIDs rather
  than operational foreign keys.
- Each eligible stay-scoped economic event references one immutable
  `SensitiveStayContext`; its cat children reference only that context.
- Each `StayPaymentRemoval` references its original registrar, removal actor
  and context, but has no operational stay/payment foreign key.

The persisted `Stay <-> Cat` relationship is materialized through `StayCat`.

## Modeling Decisions

### Stay Stores the Owner

`Stay` stores a direct reference to `Owner`.

Reasons:

- Preserve historical ownership more clearly.
- Avoid changing past stay history if a cat owner changes later.
- Simplify queries involving stays by owner.

Even though the owner could be derived from the cats, storing it directly makes the stay aggregate easier to query and safer historically.

### Stay-Cat Uses a Link Entity

The relationship between `Stay` and `Cat` is represented with `StayCat`.

Reasons:

- Make the relationship explicit in the domain model.
- Control the database structure directly.
- Prevent duplicate pairs with a composite primary key.
- Leave room for future relationship-specific fields if needed.

### Stay Status Is Dynamic

Stay status is not persisted.

It is computed from:

- `startAt`
- `endAt`
- `cancelledAt`
- current time

Possible statuses:

- `RESERVED`
- `CHECKED_IN`
- `CHECKED_OUT`
- `CANCELLED`

This avoids storing redundant state that can become inconsistent with the dates.

### Stay Nights Are Response-Derived

Stay responses expose `numberOfNights` as an authoritative backend calculation.
The value is the number of days between the local calendar dates of `startAt`
and `endAt`. Time-of-day does not affect the calculation after each timestamp
is converted to its local date, so a valid positive-duration stay on one
calendar date returns zero nights.

`numberOfNights` is not accepted in stay request contracts and is not persisted
on the `Stay` entity or in the database schema.

### Stay Pricing Is Retained and Explicitly Confirmed

Creation resolves the actual cat count to `ONE_CAT`, `TWO_CATS` or
`THREE_PLUS_CATS` and snapshots that category's current nullable nightly rate
onto the stay. Later reference-rate changes never reprice the stay. Responses
derive `suggestedAmount` as retained rate multiplied by authoritative
`numberOfNights`; the suggestion is null when the retained rate is unavailable
and is never persisted.

Every new stay requires an explicit nested pricing decision from either
authenticated role. The agreed amount is a non-negative whole number of at
most 19 digits, including zero. A non-blank reason is required exactly when an
available suggestion differs numerically from the agreement.

Only a change to the authoritative night count is pricing-affecting. Such an
update requires `ADMIN`, a fresh explicit pricing decision and a selected
retained rate that is either the locked stay's original nullable value or the
locked current applicable category rate. The service derives the suggestion
from that selected rate, then changes the retained-rate snapshot and agreement
and appends its immutable decision in one transaction only after the complete
stay update validates. Equal-night date or time changes do not reconfirm pricing.

`POST /api/stays/pricing-preview` gives `ADMIN` and `STAFF` an unlocked,
read-only authoritative creation preview from proposed dates and selected cats.
`POST /api/stays/{id}/pricing-preview` gives a persisted `ADMIN` a pricing-
affecting date-change preview from the existing stay's retained rate, never a
current global rate; equal-night previews preserve the existing `STAFF` update
reachability. Preview monetary values are exact decimal strings and each
pricing-affecting response includes a structured `confirmation` snapshot,
separate from `pricingDecision`. Final mutations lock and recalculate the
authoritative basis, compare every snapshot field with numeric monetary and
exact null semantics, and return `STALE_PRICING_CONFIRMATION` on mismatch before
writing. Preview calls persist nothing.

All frontend-consumed stay pricing and payment response amounts, including
nested operational payments and sensitive economic activity variants, serialize
as JSON strings when non-null so supported 19-digit values remain exact.

The final pricing decision carries that confirmation. Creation locks and rereads
the applicable category rate. A pricing-affecting update locks the stay and also
locks the applicable category row when the client selects the current rate. The
service authorizes only the original or current selected rate, recalculates the
complete basis inside the mutation transaction and compares the confirmation
before any operational or pricing-history write. A missing confirmation is
invalid, while a stale current rate, arbitrary selected rate, requested pricing
input, or persisted existing-stay basis returns `409 Conflict` atomically. The
confirmation is not otherwise client-authoritative and is never persisted.

### Agreed Amounts Have a Focused Administrative Correction Path

`PATCH /api/stays/{id}/agreed-amount` lets an authenticated persisted `ADMIN`
correct an existing known agreement independently of the stay lifecycle. An
inherited stay whose current agreement is null has no recorded economic value
to correct, so the operation rejects it without changing the stay or appending
evidence.

The submitted amount follows the normal non-negative whole-unit monetary
contract of at most 19 digits. Every real correction requires a non-blank
reason. Numerically equal values such as `20` and `20.0`
are successful no-ops after authorization and do not update the stay timestamp
or append evidence.

The service takes the existing pessimistic `Stay` lock before persisted-account
authorization and current-value comparison. A real change updates only
`agreedAmount` and inserts one immutable correction event in the same
transaction. The exact previous and new values therefore form a serialized
chain for competing corrections, and neither half can commit without the
other. Correction evidence is retained after cancellation or permanent
deletion of the operational stay.

### Stay Payments Are Operational; Balances Are Derived

Stay reads return payment history ordered by creation time and derive
`totalPaid`, nullable `remainingAmount`, `paymentCondition` and
`outstandingCollectionEligible` from the active rows and current agreement.
`NO_PAYMENT`, `PARTIAL_PAYMENT` and `FULL_PAYMENT` are response values, never
persisted state. Annulled rows remain visible but contribute nothing to the
active total. For a cancelled stay with a known agreement, `remainingAmount`
is the operational balance `0` and outstanding eligibility is false, while
`paymentCondition` continues to describe the real active-payment history.

Inherited stays with a null agreement return zero paid, null remaining,
`NO_PAYMENT`, false outstanding eligibility and empty history. Payment
mutations and focused agreement corrections are rejected because no recorded
economic agreement exists to mutate. The overview renders a localized absence
message instead of economic values and exposes neither payment management nor
the agreed-amount correction action. Otherwise active payments may never exceed
the agreement, including an agreement of zero.

Registration, amount-only edits, annulments, pricing reconfirmation and focused
agreement correction all serialize through the existing pessimistic `Stay`
lock. A real agreement change is rejected below the active-payment total;
numeric correction no-ops are still detected before reason and floor
validation. Operational payment mutation and its edit/annul evidence commit or
roll back in one transaction. Permanent removal is `ADMIN`-only in every stay
status, requires a non-blank reason, accepts active or annulled payments and
uses the same lock. Context/removal evidence is flushed before the operational
payment deletion, and the refreshed response derives economics from the rows
that remain.

## Stay Business Rules

Current rules:

- A `Stay` must include at least one cat.
- All cats in a `Stay` must belong to the same `Owner`.
- The `Stay` owner must match every cat owner.
- The same cat cannot be repeated inside the same `Stay`.
- `endAt` must be after `startAt`.
- A cat cannot have overlapping active stays.
- Cancelled stays are ignored during overlap validation.
- Payment amounts are positive whole numbers of at most 19 digits and their
  active aggregate cannot exceed the current agreed amount.
- Payment edits require a real amount change and a non-blank reason;
  annulments require a non-blank reason and are terminal.
- Payment removal requires `ADMIN`, a non-blank reason and exact durable
  evidence; it is not a refund operation.
- Outstanding collection is true only for a non-cancelled stay with a known
  positive remaining amount.
- Stored rabies and triple-feline vaccination dates must cover the complete
  stay. Each operational expiry is the stored vaccination date plus one year;
  a missing date or a stay ending on or after expiry is a vaccine conflict.
- Stay creation and updates that extend `endAt` beyond the currently persisted
  value aggregate every conflicting cat-vaccine pair into a structured `409
  Conflict`. Updates that keep or shorten the persisted end time skip the
  vaccine-conflict policy while all other stay rules remain active. `STAFF`
  remains blocked on a conflicting creation or extension even when an override
  is supplied. `ADMIN` receives the same conflict by default and may continue
  only with an explicit request-scoped override.
- Vaccine expiry, override intent and warning state are calculated for the
  request only and are not persisted. An administrator override bypasses only
  the vaccine policy; all other stay rules remain active.
- Closed stays cannot be modified.
- Cancelled stays cannot be cancelled again.
- Permanent stay deletion is separate from cancellation. Authorized deletion
  removes the stay and its `StayCat` links, preserves cat, owner, vet and
  application-account records and sensitive economic evidence, and is not
  blocked by dynamic stay status. Operational payments always block deletion;
  after all payments are removed, historical payment evidence still blocks
  `STAFF` while `ADMIN` may complete the safe deletion order.

## Nightly Reference Rates

The backend maintains exactly three independent current rows identified by the
minimum cat-count thresholds `1`, `2` and `3`. Those thresholds identify
`ONE_CAT`, `TWO_CATS` and `THREE_PLUS_CATS`, respectively. A nullable amount
means that the category is unavailable. Amounts are positive whole-stay nightly
references with at most 19 digits, represented by `BigDecimal` and persisted as
exact `DECIMAL(19,0)` values; they are not per-cat prices, and no currency is
modeled.

Authenticated `ADMIN` and `STAFF` accounts may read the ordered current set
through `GET /api/nightly-reference-rates`. Only `ADMIN` may configure or
replace one category with
`PUT /api/nightly-reference-rates/{minimumCatCount}` or clear it with
`DELETE /api/nightly-reference-rates/{minimumCatCount}`. Valid configuration
thresholds are exactly `1`, `2` and `3`. The service authorizes against the
persisted current account before request-specific mutation validation.
Nightly amounts are serialized as JSON strings in responses so exact values up
to 19 digits reach JavaScript clients without numeric precision loss.

Mutations lock only the selected current row pessimistically. A real transition
updates that row and inserts one immutable audit snapshot in the same
transaction; either both flush and commit or both roll back. Numerically equal
replacement values and clearing an already unavailable category are successful
no-ops without audit rows.

The authenticated Angular interface exposes the three current categories on a
dedicated nightly-rate management page to both supported roles. Threshold `3`
is labeled as three or more cats, unavailable values remain explicit, and the
page explains that configured values are total whole-stay nightly prices rather
than per-cat amounts. Only `ADMIN` sees independent configure, change and clear
controls; every successful mutation reloads the complete current set from the
backend.

Reference-rate changes are prospective guidance only. They do not read,
reprice, update or backfill existing stays. New stays retain the applicable
rate value but do not persist the selected category.

## Persistence

The application uses MySQL in local development through Docker Compose.

Schema management is handled by Flyway migrations under:

```txt
src/main/resources/db/migration
```

Hibernate schema auto-update is not used for development schema evolution. The application validates the schema instead.

Important schema points:

- `owners` stores owner contact data.
- `vets` stores reference vet data.
- `cats` has `owner_id` and optional `vet_id`.
- `stays` has `owner_id` plus nullable `retained_nightly_rate` and
  `agreed_amount` `DECIMAL(19,0)` snapshots. Existing rows are not backfilled.
- `stays` does not have `cat_id`.
- `stay_cat` stores the relationship between stays and cats.
- `stay_cat` prevents duplicate pairs through primary key `(stay_id, cat_id)`.
- `status` is not persisted.
- `user_accounts` stores persistent application users for HTTP Basic authentication.
- `owners`, `cats`, `vets` and `stays` each store a non-null `created_by_id`
  foreign key to `user_accounts`.
- `nightly_reference_rates` stores exactly the three seeded current categories
  and nullable positive whole-number `DECIMAL(19,0)` amounts.
- `nightly_reference_rate_changes` stores immutable previous/new snapshots,
  category, actor and microsecond timestamp. Whole-number column scale and
  database checks reject invalid persisted categories, non-positive values and
  transitions with no state difference.
- Rate-change actor foreign keys are restrictive; account deletion is blocked
  while a rate-change audit row references the target.
- `stay_pricing_decisions` stores append-only pricing confirmations with the
  stay UUID, exact values, night-count transition, reason, actor and
  microsecond timestamp. Its actor foreign key is restrictive, while the stay
  UUID deliberately has no foreign key so audit evidence survives stay
  deletion.
- `stay_agreed_amount_corrections` stores append-only focused administrative
  corrections with indexed scalar stay UUID, nullable exact previous amount,
  required exact new amount, required reason, actor and microsecond timestamp.
  Checks require a real whole-unit transition. The restrictive actor foreign
  key preserves attribution, while the deliberate absence of a stay foreign
  key preserves evidence after operational deletion. V6 creates no backfill
  rows.
- `stay_payments` stores operational positive `DECIMAL(19,0)` amounts,
  immutable payment date/note/registrar attribution, timestamps and terminal
  annulment state. Its restrictive stay foreign key prevents deleting a stay
  that has payment history.
- `stay_payment_edits` and `stay_payment_annulments` store immutable focused
  evidence with indexed scalar stay/payment UUIDs and restrictive actor foreign
  keys. They deliberately omit operational stay/payment foreign keys so
  evidence survives operational deletion. V7 creates no legacy payment or
  audit rows and persists no derived totals, balances, conditions or
  outstanding flags.
- V8 adds `sensitive_stay_contexts` and `sensitive_stay_context_cats` as
  immutable operationally independent snapshots, nullable context links on the
  four existing stay-scoped producers, and exact payment snapshots on edit and
  annulment evidence. It performs no legacy backfill.
- `stay_payment_removals` stores immutable exact removal evidence. Only context
  and account attribution use restrictive foreign keys; scalar stay, owner,
  cat and payment identities deliberately remain free of operational foreign
  keys so safe deletion cannot erase accountability.

## Authentication

HTTP Basic credentials are authenticated through Spring Security against `user_accounts`.

Successful login returns the canonical stored username and its fixed `ADMIN` or `STAFF` role. Angular keeps that identity and role in its in-memory authentication state alongside the HTTP Basic credentials.

The `/api/users` endpoints list, create and update application users and are restricted to `ADMIN`. Angular exposes the corresponding Accounts area at `/accounts` only to an authenticated `ADMIN` and protects direct route access with the same role distinction. `STAFF` retains access to all existing operational routes. A `403 Forbidden` from `/api/users` clears the potentially stale frontend session, while forbidden responses from unrelated APIs do not trigger that behavior. When an account DELETE receives that response, the redirect carries a fixed internal reason so the login page can explain the failed removal in the active language without exposing raw backend text.

Nightly reference-rate reads allow authenticated `ADMIN` and `STAFF` roles,
while configure, replace and clear operations require `ADMIN`. Spring Security
method-aware matchers enforce this HTTP boundary before the generic
authenticated API rule, and the application authorization policy repeats the
authoritative persisted-account decision at the service boundary.

Both authenticated roles may create a stay with an explicit pricing decision.
Only `ADMIN` may change a stay's authoritative night count and reconfirm its
price. This contextual decision is enforced at the service boundary after the
stay is locked; the general authenticated HTTP update route remains available
for non-pricing edits.

The focused agreed-amount correction route remains under the generic
authenticated HTTP rule because its authoritative `ADMIN` decision uses the
persisted current account at the service boundary after taking the same stay
lock. `STAFF` can reach the route but cannot change the agreement or append
correction evidence.

Both authenticated roles may read payment history and derived stay economics.
Payment registration, edit and annul routes also remain under the generic
authenticated HTTP rule; the service makes the authoritative decision from
the persisted current account after taking the stay lock. `ADMIN` may mutate
payments in any stay status, while `STAFF` may do so only for `RESERVED` and
`CHECKED_IN` stays.

`DELETE /api/stays/{stayId}/payments/{paymentId}` requires `ADMIN` at the HTTP
boundary and repeats the decision against the persisted current account after
locking the stay. `GET /api/sensitive-economic-activity` is likewise
`ADMIN`-only and returns a discriminated six-event union ordered by occurrence
time descending, event-type order and event UUID. Optional actor, inclusive
`occurredFrom`, exclusive `occurredTo`, event type, owner, cat and stay filters
compose conjunctively; invalid time ranges return `400 Bad Request`.

`DELETE /api/users/{id}` allows an authenticated `ADMIN` to delete another
application account. The service rejects authenticated self-deletion with
`403 Forbidden`, returns `404 Not Found` for a missing target, and blocks
deletion with `409 Conflict` while any creator record, nightly-rate change,
pricing decision, correction, operational payment, payment edit/annulment or
payment removal references the target as actor or original registrar. Deleting
an `ADMIN` is allowed only when a different enabled `ADMIN` remains; disabled
administrators do not satisfy that invariant.

Account deletion resolves the target and authenticated account, checks creator
references, then locks the enabled-admin set for every eligible target. The
service validates the deletion against that locked current state rather than
the target role read before locking, then deletes and explicitly flushes in one
transaction. Existing creator foreign keys remain final protection against
concurrent reference creation, and an integrity or optimistic-locking race maps
to `409 Conflict`. The operation never cascades, detaches, reassigns or deletes
operational records to make account deletion succeed.

Account deletion, every non-self role change to `STAFF`, and every non-self
enabled change to `false` share one enabled-admin critical section. Each path
resolves its target before acquiring the enabled-admin write lock, validates
that the locked current set contains an enabled administrator with a different
target UUID, and mutates only after that validation succeeds. Whether the lock
is acquired never depends on the target's pre-lock role or enabled snapshot.
Role and enabled mutations then use column-scoped updates and reload the target:
a role write cannot publish a stale enabled value, an enabled write cannot
publish a stale role, and a validated reducer is persisted even when the
pre-lock target snapshot already contains its requested value. Each focused
statement also advances `updatedAt`. This target-first lock ordering and focused
persistence protocol serialize deletion, demotion and disabling without
changing their existing HTTP contracts.

Before an administrator role change to `STAFF` or enabled change to `false`
enters that critical section, the service compares the target with the
persisted authenticated account and rejects removal of the current
administrator's own access with `409 Conflict`. This self-mutation rule applies
even when another enabled administrator exists. Account management mirrors the
rule by fixing the current administrator's role and omitting its disable action;
the backend remains authoritative for stale UI state and direct requests.

On a fresh database, the configured `catworld.security.username` and `catworld.security.password` create the first `ADMIN` account. The password is encoded before it is stored. When any user already exists, startup does not create, update, re-enable or overwrite accounts.

When authenticated users create owner, cat, vet or stay records, the backend
resolves the stored `UserAccount` for the current Spring Security username and
persists it as the record creator. Creator attribution is server-controlled and
is not part of operational client request payloads or response display.

Owner, cat, vet and stay deletion use a shared backend authorization policy.
`ADMIN` accounts may delete operational records regardless of creator or record
age. `STAFF` accounts may delete only records they created, and only while the
record's `createdAt` timestamp remains strictly less than 15 minutes old
according to server time. At exactly 15 minutes, and after that boundary, staff
deletion is forbidden. The policy uses the backend time source and maps
authorization denial to `403 Forbidden`; Angular does not calculate or enforce
this rule. Entity lookup, relationship and state checks stay in the responsible
services outside the shared authorization policy.

Owner, cat, vet and stay responses expose a backend-calculated `canDelete`
rendering hint for the current authenticated user. The hint combines the shared
deletion policy with entity-specific integrity rules: an owner must have no cat
or direct stay references, a cat must have no `StayCat` history, and a vet must
have no cat references. A stay must have no operational payments; historical
payment-removal evidence also leaves the hint false for `STAFF`, while an
otherwise authorized `ADMIN` may complete the safe deletion order. Authorization failure
short-circuits relationship probing, and these hints remain advisory; every
DELETE request recomputes the current server-side rules.

Permanent deletion follows lookup, authorization, relationship checks where
applicable, delete and explicit flush in that order. Missing records return
`404 Not Found`, authorization denial returns `403 Forbidden` before protected
relationships are queried, and a known reference or delete/flush race returns
`409 Conflict`. Any cat or direct stay reference blocks owner deletion; any
historical, cancelled, active or future `StayCat` reference blocks cat
deletion; and any cat reference blocks vet deletion. Authorized stay deletion
removes the stay and its links while preserving owners, cats, vets and
application accounts. Existing foreign keys remain the final integrity
protection, and no dependent record is cascaded, detached or reassigned merely
to make owner, cat or vet deletion succeed.

## Frontend UI Foundation

Frontend operational time uses `BusinessTimeService` as the single boundary
between absolute instants and the deployment's business timezone. The timezone
is loaded at runtime from `frontend/public/runtime-config.json` (currently
`America/Argentina/Buenos_Aires`), so deployments can replace it without a
component change or deployment-specific build. `Instant` values are formatted
and `datetime-local` sensitive-activity filters are interpreted in that IANA
zone. Stay `LocalDateTime` values retain their wall-clock fields, and payment
`LocalDate` formatting remains separate from timezone conversion.
The standard nginx container generates that file at startup from the
`BUSINESS_TIME_ZONE` environment variable, which accepts an IANA timezone such
as `Europe/Madrid` and defaults to `America/Argentina/Buenos_Aires`.

The authenticated Angular administration interface uses Angular Material and
Angular CDK as its default UI foundation for interactive components,
application-wide theming and shared UI behavior.

Angular Material was selected and approved as the frontend foundation in
GitHub issue #176. Issue #177 establishes the foundation and migration
boundaries without migrating complete pages, forms, tables, shell controls or
feature workflows.

### Material Theming

`frontend/src/styles.scss` owns the application-wide Material theme.

The theme:

- Uses Angular Material public Sass APIs from `@angular/material`.
- Preserves CatWorld's warm, soft administration identity through the existing
  CatWorld colors, typography and density choices.
- Provides the Material system tokens that future Material components inherit.
- Does not implement the user-facing dark-mode preference tracked by #126.

Material customization must use supported theming APIs and public component
APIs. CatWorld must not rely on private Angular Material selectors, internal
DOM structure or implementation details for customization.

### Styling Responsibilities

Global styles are limited to:

- Material theme setup.
- Document and application-level defaults.
- CatWorld design tokens and CSS custom properties.
- Truly shared utilities.
- Integration boundaries for external libraries.

Component SCSS remains responsible for local layout, responsive composition
and product-specific presentation.

Shared utilities should stay small, semantic and broadly useful across
approved migrated surfaces. They should not become a parallel component system.
Global styles must not recreate native button, input, select, textarea, table
or checkbox component systems for authenticated administration surfaces that
use Angular Material.

FullCalendar remains a custom integration where Material does not provide the
relevant calendar interaction or structure. FullCalendar-specific styling stays
explicitly separate from Material component customization.

### Material Completion and Native Boundaries

Authenticated administration controls use Angular Material when Material
provides the matching interaction role. CatWorld no longer keeps a global
native-control styling system alongside the Material foundation.

Retained native markup is limited to explicit boundaries:

- Native `<select>` elements may remain inside `mat-form-field` with
  `matNativeControl` for short option lists where Angular Material explicitly
  supports the native select control and the existing form behavior does not
  require the custom `mat-select` overlay.
- FullCalendar owns its internal buttons, tables and event markup. CatWorld
  styles that vendor boundary only through the calendar component integration
  styles, not through global native-control selectors.
- Browser-provided dialogs such as cancellation confirmation prompts remain
  browser controls unless a feature explicitly approves replacing the
  interaction.

Any future retained native control in an authenticated administration surface
must record its reason and must not depend on global legacy native-control
styling.

### Material Shell and Shared States

The authenticated application shell uses Angular Material toolbar, menu, button
and icon primitives for global navigation, language switching and session
actions while preserving the existing route and guard structure. Desktop
navigation remains visible in the toolbar; narrow viewports use the Material
menu trigger without adding product routes or changing the navigation
information architecture.
The root application configuration provides Angular animations for Material
overlays and interactive shell components.

Reusable loading, empty and error states live under
`frontend/src/app/shared/ui-state/`. Pages continue to own data fetching,
filtering, retries and domain decisions; the shared state component owns only
Material-themed presentation, accessible status or alert semantics and optional
retry-action rendering.

Reusable permanent-deletion presentation lives under
`frontend/src/app/shared/permanent-deletion/`. The shared Material confirmation
dialog accepts plain-text record context and returns a positive result only for
the explicit delete-permanently action; cancel and dismissal remain
non-confirming. Shared deletion error handling maps backend `403`, `404` and
`409` responses to localized permission, missing-resource and integrity-conflict
messages, with a generic fallback for other failures. It does not calculate
deletion authorization, correction windows or relationship eligibility.

The existing stay, cat, owner, vet and application-account API services expose
their implemented permanent `DELETE` endpoints. Entity features remain
responsible for action placement, backend-provided eligibility hints, request
and loading state, success refresh or removal, and any entity-specific conflict
context. Stay cancellation remains a separate operation and keeps its distinct
“Cancel stay” terminology.

### Material Forms

The login, account management, owner create/edit, vet create/edit, cat
create/edit and stay create/edit forms use Angular Material form fields,
inputs, supported native selects, checkboxes and buttons for their interactive
controls where Material provides the matching control role. Each routed form
page keeps its own signal-based field state, request payload shaping, submit
method, navigation and responsive form layout in component SCSS.

Required-field validation for these migrated forms is presented through
Material field errors while preserving existing validation rules and submit
timing where the control has field-level validation. Page-level loading,
backend errors and cross-field or selection errors use the shared
`UiStateComponent` where that presentation fits the existing behavior.

Stay create and edit forms recognize the backend's structured vaccine-validity
conflict response and present every affected cat and vaccine in a localized
Material warning dialog. `STAFF` may review and dismiss the warning but receives
no override action. `ADMIN` may cancel or explicitly continue, which retries the
same request once with request-scoped vaccine-override intent. Closing or
cancelling preserves the entered form values, fresh submissions do not retain
override intent, and the backend remains authoritative for the role policy.

Stay creation and date editing also consume the backend pricing-preview
contracts. Angular keeps every monetary value as an exact decimal string,
invalidates confirmation when pricing-relevant inputs change, rejects late
preview responses for an older input basis and submits pricing only after an
explicit confirmation. Existing-stay updates follow the backend
`pricingDecisionRequired` result: ordinary edits remain available to both roles,
while only `ADMIN` may confirm a pricing-affecting date change. A
`STALE_PRICING_CONFIRMATION` conflict preserves entered form and vaccine-override
state, obtains a fresh preview and never retries until the user explicitly
reconfirms. The stays overview renders backend-supplied retained rate,
suggestion, agreement, paid total and remaining amount, and exposes focused
agreement correction only to `ADMIN` for stays with a known agreement;
successful correction replaces the row with the complete authoritative
response.

Calendar app-owned filters, display options, stays overview status filters and
shared stay search filters are Material-based. FullCalendar vendor-owned
controls remain a separate integration boundary. Material inputs, supported
native selects, checkboxes and buttons do not depend on legacy global
native-control selectors.

For stays with a known agreement, the individual stay route exposes
backend-authoritative economics and operational active and annulled payment
history, including exact string amounts, payment dates, notes and registration
attribution. Annulled operational entries also expose the user and instant
recorded by the existing immutable annulment, so both `ADMIN` and `STAFF` can
understand ordinary payment history without access to sensitive economic
activity. Historical stays whose agreement is null expose neither payment
economics nor payment-management entry points or actions in the overview and
individual route. Ordinary stay editing remains limited by the existing dynamic
status rule and remains available for otherwise-allowed non-pricing changes to
those historical stays. `ADMIN` receives payment mutation affordances in every
status for known agreements; `STAFF` receives register, edit and annul
affordances only for reserved and checked-in stays and never receives permanent
removal.
These affordances are advisory and the backend remains the authorization and
monetary-invariant boundary. Successful payment mutations replace the displayed
stay from the complete backend response, and Angular neither derives payment
totals nor converts monetary strings through JavaScript numbers. Administrator
payment removal extends the shared permanent-deletion dialog with a mandatory
reason while preserving its explicit-confirmation and dismissal semantics.

The authenticated shell also exposes one independent sensitive-economic-activity
route to `ADMIN` only. The route uses the existing administrator guard while the
backend remains authoritative for direct API authorization. Its feature-local
HTTP boundary validates the six approved discriminated event variants at
runtime, preserves monetary JSON strings and nullable amounts without numeric
conversion, and rejects malformed or unknown variants instead of inferring an
event. The page preserves backend ordering and durable owner, cat, stay and
payment context without requiring live operational routes.

Actor, period, event-type, owner, cat and stay filters share one page-owned state
with supported query parameters. Refinement and refresh preserve active
criteria, clear removes every criterion, and Angular sends the composed filter
set to the backend rather than filtering or deduplicating sensitive events
locally. Loading, empty, authorization, malformed-contract and request-failure
states use localized accessible presentation. This global audit surface remains
separate from stay details and operational active and annulled payment history.

### Component Conventions

Standalone Material imports belong in the standalone component that directly
uses them, or in a narrowly scoped shared component that owns a real CatWorld
pattern. CatWorld should not introduce a broad global Material module that
re-exports many unused Material modules.

Icons should support recognition without replacing clear operational text.
Primary actions should keep text labels where practical. Decorative icons must
be hidden from assistive technology, and icon-only controls must have an
accessible name and a clear visible or tooltip-supported affordance.

Typography and density are configured through the Material theme. Local
typography or density overrides should be limited to documented product
exceptions on specific components.

## Auditing

Main entities include:

- `createdAt`
- `updatedAt`

Entity-managed writes update these fields through JPA Auditing. The focused
bulk updates for `UserAccount.role` and `UserAccount.enabled` bypass entity
listeners, so each statement advances `updatedAt` alongside only its requested
domain column.

Operational entities also include required creator attribution:

- `Owner.createdBy`
- `Cat.createdBy`
- `Vet.createdBy`
- `Stay.createdBy`

Creator attribution is assigned by services during creation and enforced by
database foreign keys. It is separate from JPA timestamp auditing.

Nightly reference-rate history uses a separate focused audit model. Each real
transition preserves nullable previous/new exact amounts, category, actor and
change time in `nightly_reference_rate_changes`. These rows have no update
path, are not a generic event log, and retain their actor through a restrictive
foreign key and account-deletion pre-check.

Stay pricing history is a second focused append-only audit model. Creation and
each pricing-affecting update preserve exact retained, previous and new values,
night counts, actor, decision time and optional reason. Decision rows expose no
update path and deliberately outlive deletion of their operational stay.

Agreed-amount correction history is a third focused append-only audit model.
Each real administrative correction preserves the nullable exact previous
amount, exact new amount, required reason, actor and decision time. Correction
rows expose no update or delete path and deliberately outlive cancellation and
deletion of their operational stay.

Payment correction, annulment and removal history uses focused append-only
audit models. A real amount edit preserves exact previous/new amounts; an
annulment preserves the terminal action; a removal preserves the complete
payment snapshot and both attribution points. They expose no update/delete path
and outlive their operational stay/payment identities. A focused read repository
combines these producers with rate changes, eligible pricing deviations and
real agreement corrections through one database-side `UNION ALL`; actor, time,
type, owner, cat and stay predicates and the deterministic global ordering are
applied by the database. The application service retains only authorization,
range validation and typed response mapping. This read path introduces neither
a generic event table nor a database view.

## Error Handling

The API uses custom exceptions for common error cases:

- resource not found
- bad request
- conflict

A global exception handler translates application exceptions into HTTP responses.

Typical mappings:

- `ResourceNotFoundException` -> `404 Not Found`
- `BadRequestException` -> `400 Bad Request`
- `ConflictException` -> `409 Conflict`
- validation errors -> `400 Bad Request`

## Testing Strategy

Testing focuses on backend business rules and HTTP contracts, complemented by behavior-level frontend tests for critical authentication and calendar flows.

### Service Tests

Service tests cover business rules directly.

Current focus:

- stay creation rules
- owner consistency
- overlap validation
- cancellation flow
- update flow rules
- nightly reference-rate authorization, current-state transitions and audit
  construction
- stay pricing selection, explicit confirmation, role policy, reconfirmation
  and atomic audit construction
- focused agreed-amount correction authorization, numeric no-op behavior,
  atomic immutable evidence and same-stay serialization
- payment authorization, exact registration/edit/annul/removal rules, derived
  economics, agreement floors and atomic evidence construction
- sensitive economic eligibility, typed identity, global ordering, filters,
  persisted administrator authorization and payment-aware deletion hints

Repositories and mappers are mocked where appropriate.

### Controller Tests

Controller tests cover the HTTP contract.

Expected focus:

- request methods and paths
- response status codes
- request validation
- path variables
- service delegation
- exception mapping through the global exception handler
- nested stay pricing validation and authenticated-role reachability
- focused agreed-amount correction validation, delegation and representative
  authenticated reachability
- payment history/removal serialization, validation, delegation, exception mapping and
  authenticated-role reachability
- representative sensitive-activity typed JSON, filter binding and
  administrator-only reachability

Controller tests should use Spring MVC slice testing instead of booting the full application context unless there is a concrete reason.

Repository validation covers the V8 schema, the database-side sensitive
economic union and filter/ordering contract, exact active aggregation and
operational/audit rollback boundaries. A conditional isolated MySQL integration
suite additionally validates the full Flyway chain and Hibernate schema, all
six sensitive economic variants and eligibility boundaries, native zero-scale
round trips, durable deletion survival, InnoDB rollback and
payment/removal/stay-deletion contention through the shared stay lock.

### CI

GitHub Actions runs backend and frontend validation automatically.

Workflow files:

```txt
.github/workflows/backend-ci.yml
.github/workflows/frontend-ci.yml
```

Both workflows:

- run on pull requests targeting any branch
- run on pushes to `main`
- support manual `workflow_dispatch`

The backend workflow:

- sets up Java 17
- uses Maven dependency caching
- runs `./mvnw verify`

The frontend workflow:

- runs from `frontend/`
- sets up Node.js 22
- uses npm dependency caching
- runs `npm ci`
- runs `npm run build`
- runs `npm run format:check`
- runs `npm run test:ci`

## Diagrams

PlantUML diagrams live in:

```txt
docs/uml/
```

Current diagrams:

- `01-domain-classes.puml`
- `02-db-schema.puml`
- `03-components.puml`
- `04-sequence-create-stay.puml`

## Public Repository Notes

No real credentials are required to run this project locally.

The committed environment examples use dummy local values. The real `.env` file is ignored by Git.

Database credentials for real environments must be provided through environment variables or external secret management, not committed to the repository.

## Source of Truth

The source of truth for architecture and modeling is:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/uml/*`
