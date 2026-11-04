# Research: Student-level available classes

Revised on 2026-11-03 after the owner approved removing package assignment tracking. All technical unknowns are resolved.

## 1. One balance and no package entity

**Decision**: Store `available_classes` on each student. Default zero; optional initial amount or later additions accept 1, 5, 10 or custom positive whole numbers. Details show “Clases disponibles”.

**Rationale**: The owner explicitly does not need package provenance, assignment counts, issuance totals or assignment history. Constitution 2.0.0 removes oldest-package and source-package refund rules.

**Alternatives considered**: Separate assignment/remaining-count rows preserve distinctions the owner does not need. Deriving balances from package records would reintroduce the removed model.

## 2. Existing architecture and migration

**Decision**: Keep Express/EJS, pg and PostgreSQL; use transactional v1→v2 under the existing initializer's advisory lock. Validate known v1 before altering it; create students and technical receipts; replace the version constraint/value; validate v2 and apply private privileges/RLS. Fresh setup produces the same v2.

**Rationale**: `src/db.ts` validates exact columns/constraints and version=1; merely appending definitions would break existing initialization. Preserve metadata, classes, registrations, indexes and the registration lock trigger. No implemented student/package data exists to convert. Do not derive balances from existing placeholder registrations or retrofit their student foreign key.

**Alternatives considered**: SQLite is obsolete after cloud preparation. Separate storage or permissive setup would weaken compatibility and persistence.

## 3. Atomic balance updates and archive races

**Decision**: Reuse `transaction(url, work)` and parameterized SQL. Lock the selected student before active-status checks and balance increments. Use an arithmetic SQL increment, never an unlocked read-modify-write. Create student and initial balance/receipt in one transaction. Reject overflow without writes.

**Rationale**: The checked-out client keeps all transaction statements on one connection. Locking the same student in edit/archive/addition serializes their outcomes. Both independent additions must contribute to the total. Archive-first rejects a new addition; addition-first retains the total after archive.

**Alternatives considered**: UI-only guards do not handle response-loss retries or separate instances; pool queries across connections do not form one transaction.

Sources checked during planning: [node-postgres transactions](https://node-postgres.com/features/transactions), [parameterized queries](https://node-postgres.com/features/queries), [PostgreSQL row locks](https://www.postgresql.org/docs/current/explicit-locking.html).

## 4. Retry protection without assignment records

**Decision**: Retain minimal technical submission receipts keyed by server-generated form UUID. Store operation, normalized-request SHA-256 fingerprint and resulting student id. No package count/date/size history is exposed or used to calculate balances. Keep receipts durable, with no expiry in this feature, so old successful submissions cannot increment again.

**Rationale**: Tokens prevent duplicate student creation and balance additions across app instances. Same token and fingerprint return the original destination without another increment; changed input/target conflicts. A fresh form/token permits another intentional same-size addition. Creation fingerprint uses original normalized name/phone/initial amount, remaining valid even after edits. Receipt insertion, balance mutation and commit succeed or fail together; concurrent uniqueness losers reload the committed receipt after rollback. Check committed replay before archived-state rejection because replay performs no new mutation.

**Alternatives considered**: Per-package assignment entities are unnecessary. Student's last token alone cannot recognize older retries after another successful addition. In-memory receipts fail across instances. A loading button is useful feedback but cannot guarantee exactly-once effects.

Source: [PostgreSQL unique constraints](https://www.postgresql.org/docs/current/ddl-constraints.html). The receipt is an implementation choice for FR-011, not a product package model.

## 5. Validation and phone workflows

**Decision**: Trim name/phone edges, preserve internal formatting, allow duplicates, and use literal case-insensitive name substring search. Counts and totals must be positive/nonnegative safe integers respectively, stored as BIGINT up to 9007199254740991. Reject invalid amount or total overflow in Spanish without changing the balance. This bound prevents representation corruption, not a studio tier limit.

**Rationale**: No country assumptions; existing code already uses this safe-integer approach for capacity. Active list by default, explicit archived-list link and read-only archived details. Create/edit/addition use form then existing details with success; archive uses confirmation then active list. No success-only screen.

**Alternatives considered**: Phone normalization or uniqueness changes agreed behavior. History screens and multi-step wizards add unnecessary work.

**Decision**: Add a small progressive-enhancement script for Spanish submit-button loading/disabled state. Restore state on failed validation, returned error form and `pageshow`/back navigation; expose a status announcement. Do not disable fields required for form serialization. Keep normal forms functional without JavaScript.

**Rationale**: Meets FR-015 alongside durable server protection. Phone preference guides layout but does not establish a validated speed claim or new deployment requirement.
