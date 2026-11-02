# Research: Create and Edit Classes

## Existing foundation and interface

**Decision**: Extend the existing Express/EJS application, SQLite storage, strict local date utilities and Vitest suite. Retain locale-based week boundaries while rendering owner-facing schedule and form content in Spanish.

**Rationale**: The repository already implements the local app and schedule. Current English schedule and error views must be translated to satisfy the constitution. Spanish display formatting must not change which day starts a week.

**Alternatives considered**: A separate client application or API would add dependencies and duplicate existing scheduling and storage responsibilities.

## Persistence and migration

**Decision**: Introduce a versioned, transactional migration from existing version 1 to the new schema; update fresh initialization and compatibility checks consistently. Preserve metadata and fail visibly on migration or schema errors. Document backup and explicit upgrade before startup; never overwrite an existing file with `db:init`.

**Rationale**: `src/db.ts` currently accepts only version 1 and verifies its metadata schema. Existing user files must survive the upgrade and failed migrations must not be mistaken for empty schedules.

**Alternatives considered**: Reinitialization loses records; silently bypassing version checks risks reading incompatible data.

## Registration guard

**Decision**: Provide a minimal durable registration table/seam with a class reference, opaque student identifier and assigned/waitlisted status, solely to support the capacity invariant. No owner-facing enrollment or package behavior is added. The authoritative check and class update occur in one SQLite write transaction; future enrollment writers must use the same database and serialize their writes with it. Reject the whole update if a changed limit encounters either status. Tests insert fixtures directly and compare them before and after editing.

**Rationale**: No registration model exists yet, but a UI-only or hard-coded zero count would fail the save-time rule and race scenario. A shared persisted seam makes the invariant testable without inventing enrollment workflows. The later enrollment feature must migrate or extend this seam to implement student relations, FIFO and package accounting.

**Alternatives considered**: Assume no registrations until a later feature (cannot verify the specified guard); implement full student and package systems now (outside scope).

## Forms and duplicate prevention

**Decision**: Use server-rendered forms, server-side validation and post/redirect/get after successful writes. Use a persisted unique submission token for creation so retrying the same submission after an uncertain response cannot create a second class; separately submitted identical classes remain allowed. Preserve submitted values and show Spanish errors on validation or confirmed storage failures. All edit fields are updated atomically.

**Rationale**: Browser validation alone cannot enforce teacher choices or the limit rule; redirects and submission identity address repeated requests without prohibiting legitimate duplicate-looking classes.

**Alternatives considered**: Uniqueness on class details incorrectly blocks legitimate classes; disabling the submit button alone cannot protect retries.
