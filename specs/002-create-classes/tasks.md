---
description: "Implementation tasks for creating and editing classes"
---

# Tasks: Create and Edit Classes

**Input**: `specs/002-create-classes/plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/class-scheduling.md`, and `quickstart.md`

**Tests**: The specification defines independent tests and acceptance checks; write the focused tests before implementing the associated behavior.

**Organization**: Tasks are grouped by user story. `[P]` marks work on separate files that can proceed concurrently once its stated prerequisites are complete.

## Phase 1: Setup

- [ ] T001 Confirm the existing Node 24 and pnpm 10.12.4 setup and baseline build and tests using `package.json` and `README.md`; record any pre-existing failures before changes.

## Phase 2: Foundational (blocks all stories)

- [ ] T002 [P] Add migration and initialization tests in `tests/class-migration.test.ts` for populated version 1 metadata preservation, fresh/upgrade schema equivalence, incompatible schema, rollback on failure, and refusal to overwrite existing files.
- [ ] T003 [P] Add shared validation tests in `tests/class-validation.test.ts` for the model constraints: "nonblank title"; "local calendar date in `YYYY-MM-DD`"; "local clock time in `HH:MM`"; "positive whole-number student limit"; and "teacher text `Claudia` or `Ester` for classes created or edited here", including impossible dates, unsafe integers and whitespace-only titles.
- [ ] T004 Implement versioned transactional migration and equivalent fresh initialization in `src/db.ts`: preserve version 1 metadata, validate schema, create classes and registration seam, and update `user_version` only after success; meet T002.
- [ ] T005 Add an explicit non-destructive upgrade command in `src/migrate-db.ts` and `package.json`, using the migration from `src/db.ts`; keep `db:init` exclusive to new files.
- [ ] T006 Implement shared server-side class input validation in `src/classes.ts` for "nonblank title"; "local calendar date in `YYYY-MM-DD`"; "local clock time in `HH:MM`"; "positive whole-number student limit"; and "teacher text `Claudia` or `Ester` for classes created or edited here"; check real dates and times, safe integers, and preserve local date/time without timezone conversion; meet T003.
- [ ] T007 Define the durable registration seam in `src/db.ts`: "a class reference, opaque student identifier and status `assigned` or `waitlisted`; prevent duplicate class/student entries"; enforce class references and expose no enrollment UI, while supporting the serialized write boundary for future enrollment.

**Checkpoint**: Fresh and upgraded databases are compatible, and shared validation and registration storage are available.

## Phase 3: User Story 1 — Create a scheduled class (Priority: P1) 🎯 MVP

**Goal**: Create a durable class and see it in its scheduled week.

**Independent test**: Create classes for Claudia and Ester, navigate to their weeks, and reopen the app to verify all details.

- [ ] T008 [P] [US1] Add create and schedule HTTP tests in `tests/class-create.test.ts` covering both teachers, all fields, other weeks, matching class details, cancellation, 400/503 schedule behavior, and escaped titles.
- [ ] T009 [P] [US1] Add persistence and retry tests in `tests/class-create-storage.test.ts` covering restart, unique submission-token replay, a new token for an identical class, and failed writes without duplicate records.
- [ ] T010 [US1] Implement class insertion and week queries in `src/classes.ts` with a "Stable generated identifier" and a "unique creation submission token separately from the displayed fields"; same-token replay resolves the original class, while separate tokens allow identical details; meet T009.
- [ ] T011 [US1] Add `GET /classes/new` and `POST /classes` in `src/app.ts`, generate and validate submission tokens, validate fields via `src/classes.ts`, and redirect successful saves to the class week without writing on cancel; meet T008.
- [ ] T012 [P] [US1] Create the Spanish class creation form in `src/views/class-form.ejs` with title, date, time, student limit, Claudia/Ester selection, accessible labels, save and cancel controls, and escaped submitted values.
- [ ] T013 [P] [US1] Extend `src/views/schedule.ejs` to display each class on its date, expose its limit and creation action, highlight a missing teacher, and retain current/previous/next week navigation using Spanish text.
- [ ] T014 [US1] Connect weekly class queries and Spanish date formatting in `src/app.ts` and `src/schedule.ts`, preserving locale-based week boundaries and displaying empty weeks correctly; integrate T012 and T013 and meet T008.
- [ ] T015 [US1] Update existing assertions in `tests/app.test.ts`, `tests/revisit.test.ts`, and `tests/db-init.test.ts` for Spanish text and the new schema version while retaining their original coverage; verify creation persists across application restarts.

**Checkpoint**: US1 works end to end, including valid basic validation and persistence, before editing is added.

## Phase 4: User Story 2 — Edit a scheduled class (Priority: P1)

**Goal**: Update existing details and enforce the registration-dependent limit restriction atomically.

**Independent test**: Edit a class into another week, restart, and test limit changes with no registrations, assigned registrations, and waitlisted registrations.

- [ ] T016 [P] [US2] Add edit HTTP tests in `tests/class-edit.test.ts` for prefilled fields, changed date/week, cancel, 404, invalid edit, locked limit explanation, and unchanged limit allowing other edits.
- [ ] T017 [P] [US2] Add transactional guard tests in `tests/class-edit-storage.test.ts` using assigned and waitlisted fixtures, duplicate registration rejection, stale-form registration before save, atomic rejection of all edits, and unchanged registration/order and existing package-balance fixture data.
- [ ] T018 [US2] Implement class lookup and atomic update in `src/classes.ts`; recheck both registration statuses in the same SQLite write transaction, reject the entire edit when a changed limit is blocked, preserve records and balances, and retain the class identifier; meet T017.
- [ ] T019 [US2] Implement `GET /classes/:id/edit` and `POST /classes/:id` in `src/app.ts` with Spanish 404/409 outcomes, prefilled values, save-time guard, cancellation and redirect to the edited date's week; meet T016.
- [ ] T020 [US2] Extend `src/views/class-form.ejs` and `src/views/schedule.ejs` with edit links, current values, an unavailable student-limit control and Spanish explanation when registered; preserve the unchanged limit in submissions.
- [ ] T021 [US2] Add restart and week-boundary edit verification in `tests/revisit.test.ts` for moved classes appearing only in their new week with all values preserved.

**Checkpoint**: US2 works with or without registrations, with no enrollment or balance mutation.

## Phase 5: User Story 3 — Correct invalid or unsaved details (Priority: P2)

**Goal**: Give actionable Spanish validation and save-failure feedback while retaining form values.

**Independent test**: Submit missing, malformed and disallowed values on creation and editing; simulate failed writes, correct the form and retry, and confirm cancel leaves saved data unchanged.

- [ ] T022 [P] [US3] Add failure-path tests in `tests/class-form-errors.test.ts` for missing fields, whitespace title, invalid date/time, zero/negative/fractional limits, invalid teacher/token, retained escaped input, field-specific Spanish feedback and unchanged saved records.
- [ ] T023 [P] [US3] Add write-failure and retry tests in `tests/class-write-errors.test.ts` for both forms, 503 responses, no false success, preserved values, successful retry and no duplicate creation.
- [ ] T024 [US3] Complete validation and storage-error handling in `src/app.ts` and `src/classes.ts` to return 400/422 for invalid fields, 409 for registration conflicts and 503 for storage failures, retaining input without partial changes; meet T022 and T023.
- [ ] T025 [US3] Complete accessible field-specific Spanish messages and retry behavior in `src/views/class-form.ejs`; translate `src/views/storage-error.ejs` and `src/views/bad-request.ejs` and provide a Spanish unknown-class response.

**Checkpoint**: Every failure path preserves user input and saved data as specified.

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Update `README.md` with backup instructions, the exact explicit upgrade command, fresh initialization, startup, test commands, and the registration seam's future integration requirement.
- [ ] T027 [P] Update `src/public/styles.css` for readable Spanish schedule and form layouts, field errors, locked limits and missing-teacher highlighting at desktop widths of 1024px and above.
- [ ] T028 Run `pnpm run build` and `pnpm test`, update affected existing error assertions in `tests/storage-errors.test.ts` and `tests/write-errors.test.ts` without reducing coverage, and execute the manual checks in `specs/002-create-classes/quickstart.md`; record outcomes and any unavailable browser or usability checks.

## Dependencies & Execution Order

- Setup T001 precedes the foundational phase. T002 and T003 can run together; T004 follows T002, T005 follows T004, T006 follows T003, and T007 follows T004. Complete the phase before story work.
- US1 requires the foundation; T008 and T009 are independent, T010 follows T009, T011 follows T010, T012 and T013 can run together, and T014 integrates them after T011. T015 verifies the integrated result.
- US2 requires the class records and form delivered by US1. T016 and T017 can run together; T018 follows T017, T019 follows T018, T020 follows the existing form, and T021 follows integration.
- US3 extends the forms and routes from US1 and US2. T022 and T023 can run together; T024 follows both, then T025 completes the UI. Basic input rejection and safe saves are required in US1/US2, not deferred to this phase.
- T026 and T027 can run in parallel after the relevant interface and migration decisions are implemented. T028 follows all phases.

## Parallel Examples

- **US1**: Write `tests/class-create.test.ts` (T008) and `tests/class-create-storage.test.ts` (T009) concurrently; later, build `src/views/class-form.ejs` (T012) and `src/views/schedule.ejs` (T013) concurrently.
- **US2**: Write HTTP scenarios in `tests/class-edit.test.ts` (T016) alongside transaction scenarios in `tests/class-edit-storage.test.ts` (T017).
- **US3**: Write validation scenarios in `tests/class-form-errors.test.ts` (T022) alongside failure/retry scenarios in `tests/class-write-errors.test.ts` (T023).

## Implementation Strategy

1. Deliver setup and foundation, then US1 as the smallest independently usable creation increment. Validate it before moving on.
2. Add US2 and verify the save-time registration restriction and unchanged student data, including a stale form.
3. Complete US3's comprehensive recovery paths and finish cross-cutting validation. Both creation and editing are required for the full requested feature.
