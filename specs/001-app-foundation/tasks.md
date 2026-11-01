---
description: "Dependency-ordered tasks for the local app foundation"
---

# Tasks: Local App Foundation

**Input**: `specs/001-app-foundation/plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/schedule.md`, and `quickstart.md`

**Organization**: Story tasks are grouped by user journey. The specification explicitly requires persistence and acceptance verification, so test tasks are included. Write each story's tests first and verify they fail before implementing the behavior.

## Phase 1: Setup

- [X] T001 Create `package.json` and `pnpm-lock.yaml` for Node 24, TypeScript, Express 5, EJS, better-sqlite3, Vitest, required type packages, and `build`, `start`, `db:init`, and `test` scripts; pin `packageManager` to `pnpm@10.12.4` and allow `better-sqlite3` in `pnpm.onlyBuiltDependencies`.
- [X] T002 Configure TypeScript compilation, source and test inclusion, and compatible Node module settings in `tsconfig.json` and `vitest.config.ts`.
- [X] T003 [P] Add `.gitignore` entries for dependencies, compiled output, environment files, SQLite data and SQLite journal files so a clone receives no studio data.

## Phase 2: Foundational Prerequisites

- [X] T004 Write isolated database initialization and schema tests in `tests/db-init.test.ts`, covering first initialization, refusal to overwrite, missing database, schema version, and metadata constraints.
- [X] T005 Implement explicit initialization and connection helpers in `src/db.ts` and `src/init-db.ts`: create the metadata table with `key` as a "non-empty text primary key" and `value` as "non-null text"; set `PRAGMA user_version` to 1 transactionally; use `STUDIO_DB_PATH` or `data/studio.sqlite`; refuse existing files and use `fileMustExist` for normal access.
- [X] T006 Implement the Express app factory and loopback-only entry point in `src/app.ts` and `src/server.ts`, including EJS/static paths, `127.0.0.1:8000`, and request-scoped storage access that verifies schema without recreating data.

**Checkpoint**: A fresh clone can install and build; explicit initialization creates a usable local database without overwriting an existing one.

## Phase 3: User Story 1 — Open the Weekly Schedule (P1)

**Goal**: Open the current week and navigate adjacent empty weeks in a readable local browser interface.

**Independent test**: With an initialized empty database, open the app, verify today falls in the displayed week, and navigate to adjacent weeks at a 1024-pixel viewport.

- [X] T007 [P] [US1] Write date tests in `tests/schedule.test.ts` for local current date, locale-dependent week starts and override, fallback, seven dates, adjacent weeks, month/year transitions, and daylight-saving boundaries.
- [X] T008 [P] [US1] Write HTTP contract tests in `tests/app.test.ts` for current-week rendering, empty state, valid week normalization, navigation links, invalid date HTTP 400, no-cache headers, and operation without JavaScript.
- [X] T009 [US1] Implement calendar-date calculations and Node ICU locale resolution in `src/schedule.ts`, honoring `STUDIO_LOCALE` and logging the documented `en-US` fallback.
- [X] T010 [P] [US1] Create accessible seven-day schedule and invalid-date templates in `src/views/schedule.ejs` and `src/views/bad-request.ejs` with descriptive headings, dates, and navigation.
- [X] T011 [P] [US1] Style the schedule in `src/public/styles.css` for a readable 1024-pixel desktop viewport without horizontal scrolling.
- [X] T012 [US1] Implement `GET /` and strict `week=YYYY-MM-DD` validation in `src/app.ts`; connect date calculations and templates, add previous/next links and no-cache headers.

**Checkpoint**: US1 can be demonstrated with an initialized empty database; the week and adjacent navigation are correct.

## Phase 4: User Story 2 — Preserve Foundation Data (P2)

**Goal**: Prove database data survives browser visits and application restarts without an owner-facing test-data feature.

**Independent test**: Insert a unique test metadata record into an isolated file-backed database and retrieve unchanged values after ten real application-process restarts.

- [X] T013 [P] [US2] Write persistence integration tests in `tests/storage.test.ts` using an isolated SQLite file and a test-only record, covering commit, rollback, and unchanged retrieval across ten actual application-process restarts.
- [X] T014 [P] [US2] Add a browser revisit integration scenario in `tests/revisit.test.ts` verifying that reopening the app retains existing metadata and renders the schedule.
- [X] T015 [US2] Implement parameterized metadata read/write operations with transactions, rollback, and scoped connections in `src/db.ts`; keep verification records and write access out of public routes.

**Checkpoint**: Restart and revisit checks pass against a temporary database without creating production sample data.

## Phase 5: User Story 3 — Understand a Storage Problem (P3)

**Goal**: Make storage failures clear and prevent failed writes from appearing successful.

**Independent test**: Start the app with a missing or invalid database, open the schedule, and verify the actionable error replaces the empty state.

- [X] T016 [P] [US3] Write storage-failure HTTP tests in `tests/storage-errors.test.ts` for missing, unreadable, corrupt and incompatible databases, HTTP 503, safe diagnostics, no normal empty state, and recovery without stale caching.
- [X] T017 [P] [US3] Write failed-write and rollback tests in `tests/write-errors.test.ts` that verify failed operations do not report success or alter committed values.
- [X] T018 [P] [US3] Create an actionable storage-error template in `src/views/storage-error.ejs` that advises retrying or seeking help without exposing paths or stack traces.
- [X] T019 [US3] Integrate storage exception handling and HTTP 503 responses in `src/app.ts`, and ensure failed writes propagate errors and transactions roll back in `src/db.ts`.

**Checkpoint**: Storage failures are visibly distinct from an empty schedule and never presented as successful saves.

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [P] Update `README.md` with clone, Node 24, pnpm 10.12.4 and native-build prerequisites, `pnpm install --frozen-lockfile`, build, one-time database initialization, local start, locale and database configuration, tests, and the local-only data boundary.
- [X] T021 Run `pnpm install --frozen-lockfile`, verify the `better-sqlite3` native binding loads, then run `pnpm test` and `pnpm run build`; resolve failures in `src/` and `tests/` and verify initialization refuses to overwrite a database.
- [X] T022 (marked complete at owner request; see quickstart validation record for unperformed checks) Execute the browser and failure checks in `specs/001-app-foundation/quickstart.md` for Chrome, Edge, Firefox, and Safari where available; record any unavailable browsers or unresolved failures in `specs/001-app-foundation/quickstart.md`.

## Dependencies & Execution Order

- **Setup → Foundation → US1 → US2 → US3 → Polish** is the recommended sequence. US1 depends on a usable database; US2 depends on the launched application for restart verification; US3 integrates the existing route and storage layer.
- Within each story, write and run tests before implementing corresponding behavior. Tasks marked `[P]` touch different files and can run concurrently after their prerequisites; tasks touching `src/app.ts` or `src/db.ts` must be sequenced.
- US1 can be validated after Phase 3, US2 through isolated file-backed integration tests, and US3 through controlled storage failures.

## Parallel Examples

- **US1**: T007 and T008 can run together; after their tests are in place, T010 and T011 can run together while T009 implements date logic.
- **US2**: T013 and T014 can be written together before T015.
- **US3**: T016, T017, and T018 can run together before T019.

## Implementation Strategy

Start with setup, the shared database foundation, and US1 as the smallest demonstrable schedule shell. Add durable-data verification in US2 and storage-failure handling in US3, then complete the full test, build, documentation, and browser checks. The MVP checkpoint is not completion of the full feature until all three stories pass.
