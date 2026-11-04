# Tasks: Manage students and available classes

**Input**: Design documents in `specs/004-manage-students/`: plan.md, spec.md, research.md, data-model.md, contracts/student-management.md and quickstart.md.
**Prerequisites**: Approved design and constitution 2.0.0; existing Express/EJS/PostgreSQL application.
**Tests**: Required by the implementation plan and quickstart. Write meaningful failing tests before the associated implementation; use isolated real PostgreSQL databases.
**Organization**: User-story increments, with shared migration prerequisites first. No package entity/history, enrollment accounting, notifications or hosting changes.

## Format and paths

Tasks use `- [ ] Tnnn [P?] [USn?] Description`. `[P]` identifies work in different files that can overlap after stated prerequisites. Paths are relative to the repository root. Story labels map directly to spec.md. Find callers before modifying existing functions. Do not commit without owner diff review; then stage specific files and use incremental Conventional Commits. No push or PR is authorized by this task list.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare existing infrastructure without introducing dependencies or a new application scaffold.

- [X] T001 Trace callers of initializeDatabase, transaction and createApp in src/db.ts, src/app.ts, src/init-db.ts, src/migrate-db.ts, src/server.ts and tests/; record integration points and baseline build/test results in specs/004-manage-students/quickstart.md without claiming unrun checks passed.
- [X] T002 Extend tests/helpers.ts with isolated exact-v1 fixtures, fictional student/receipt fixtures and independent application-instance support; retain existing class/registration fixtures and disposable-database safeguards.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Durable v2 storage shared by all stories. Complete before story implementation.

- [X] T003 Add failing fresh-v2, exact-v1 upgrade, repeat/concurrent initialization, rollback and schema-drift tests in tests/db-init.test.ts; replace unsupported-version=2 coverage with a genuinely unknown version; assert unchanged metadata/classes/assigned and waitlisted registrations, indexes and lock trigger, plus private privileges/RLS and receipt FK index.
- [X] T004 Implement transactional v1→v2 and equivalent fresh initialization under the existing advisory lock in src/db.ts; validate exact v1 before upgrade, replace version constraint/value, validate complete v2 and roll back corruption/unknown versions. Preserve registration student_id placeholders without adding their FK or inferring accounting. Student constraints verbatim: id “Server-generated UUID, stable identity”; name “Trim edges; reject whitespace-only; database nonblank check”; phone “Required, preserve common formatting, no uniqueness”; available_classes “CHECK >= 0 and <= 9007199254740991”; archived_at “NULL active, server timestamp archived”. Use TEXT NOT NULL for name/phone, BIGINT NOT NULL DEFAULT 0 for balance, nullable TIMESTAMPTZ for archived_at; reject Unicode whitespace-only direct writes and allow duplicate names/phones without arbitrary length limits.
- [X] T005 Complete technical receipt schema validation, privileges/RLS and FK index in src/db.ts with constraints verbatim: token “UUID issued for one creation or add-classes form”; operation “CHECK `create_student` or `add_classes`”; request_fingerprint “SHA-256 of canonical normalized operation input”; student_id “Original result/target; restrictive deletion”. Use TEXT primary-key token and NOT NULL operation/fingerprint/student FK; retain receipts durably and introduce no amount/date/package/history fields. Run tests/db-init.test.ts to green before proceeding.

**Checkpoint**: Existing data is preserved and fresh/upgraded databases converge on validated v2.

## Phase 3: User Story 1 — Create and find a student (P1, MVP)

**Goal**: Save distinct student identities, find them by name and show durable zero balances.
**Independent test**: Create without initial classes, reopen/restart, search by name fragment and open unchanged name, formatted phone and zero balance. Shared identities remain distinct.

### Tests first

- [X] T006 [P] [US1] Add failing required-field and normalization tests in tests/student-validation.test.ts for Unicode whitespace, trimmed edges, preserved internal phone formatting, no country pattern or arbitrary business length limit, and permitted shared names/phones.
- [X] T007 [P] [US1] Add failing create/read/search and durable creation-receipt tests in tests/student-storage.test.ts: zero balance, literal case-insensitive substring search including %, _ and backslash, independent identities, atomic student/receipt rollback, same-token concurrency across instances, normalized replay, immutable fingerprint after edits, changed-input/operation conflicts and safe BIGINT conversion.
- [X] T008 [P] [US1] Add failing HTTP contract tests in tests/student-flow.test.ts for GET /students, /students/new, /students/:id and POST /students: default active search/list, empty/no-match states, UUID tokens, 303 created redirect, escaped text, zero display, malformed structures→Spanish 400, invalid fields/token→422, missing→404 and storage failure→503 with values/token retained; whitelist notice keys.

### Implementation

- [X] T009 [US1] Implement required-field validation, active/archived reads, literal search and safe-number balance mapping in src/students.ts according to data-model.md; select records by stable id and expose typed outcomes without SQL details.
- [X] T010 [US1] Implement zero-balance creation and shared receipt handling in src/students.ts using transaction() on one checked-out client: canonical fingerprint ["create_student", trimmedName, trimmedPhone, 0], atomic student/receipt insert, immutable durable receipts, identical replay returning original result and differing input/operation/target conflict. Resolve uniqueness races by rollback then committed-receipt lookup, including concurrent creation across instances.
- [X] T011 [US1] Implement list/new/detail/create handlers and strict scalar request parsing in src/student-routes.ts; issue UUID form tokens, preserve fields/tokens on 422/503 and applicable 409, use Spanish read/storage feedback and 303 /students/:id?notice=created without a success-only screen.
- [X] T012 [P] [US1] Build Spanish active/archived list, search, empty and no-match guidance in src/views/students.ejs; include details links, clear search and schedule navigation, escaped values and the existing public academic-demo notice.
- [X] T013 [P] [US1] Build creation/edit-ready identity fields in src/views/student-form.ejs with associated labels/errors, type=tel, retained values/token and cancel GET links; build src/views/student-detail.ejs with name, phone, “Clases disponibles” including zero, inline whitelisted success and active/archived states.
- [X] T014 [US1] Mount the student router before the catch-all in src/app.ts and add student navigation in src/views/schedule.ejs while preserving current-week entry and existing class workflows; run US1 validation/storage/HTTP tests and schedule regressions.

**Checkpoint**: Creation without an initial addition and durable student discovery work independently.

## Phase 4: User Story 2 — Add and review available classes (P1)

**Goal**: Optional initial classes and later atomic additions with exactly-once retries, current totals and pending feedback.
**Independent test**: Create with 5, add 1, 5, 10 and custom 7 with new tokens, restart and verify 28. Replay an old successful request without changing 28; intentionally add 5 with a fresh token and verify 33.

### Tests first

- [X] T015 [US2] Extend tests/student-validation.test.ts for creation none/omitted→0, presets 1/5/10 and custom digit-only positive safe integers; reject missing custom, zero, negative, fraction, exponent, nonnumeric/unsafe input and invalid choices; ignore inactive customCount for presets and disallow none on later additions.
- [X] T016 [US2] Extend tests/student-storage.test.ts for all initial amounts, creation/increment receipt-failure rollback, overflow leaving balance unchanged, distinct concurrent additions without lost updates, same-token concurrency across independent instances, response-loss/older-token retries after another addition, fresh-token same-size additions and changed target/input conflicts. Cover matching committed replay before archived-state rejection using archived fixtures.
- [X] T017 [P] [US2] Add failing contract tests in tests/class-addition-flow.test.ts for GET /students/:id/classes/new and POST /students/:id/classes, initial creation choices, 303 classes-added redirect, current total, invalid counts/token/overflow→422, missing→404, archived/conflicting receipt→409 and storage failure→503 with values/token retained; prove standard form submissions work without JavaScript.

### Implementation

- [X] T018 [US2] Extend src/students.ts to normalize amount choices and fingerprint creation as ["create_student", trimmedName, trimmedPhone, initialAmountOrZero] and additions as ["add_classes", studentId, amount]; create initial balance/receipt atomically, lock the student before new active-state checks, use parameterized SQL arithmetic increments, reject unsafe totals, and commit receipt/increment together. Check committed replay first; reuse rollback-and-read conflict resolution from T010.
- [X] T019 [US2] Extend src/student-routes.ts with initial amount parsing and later addition GET/POST handlers, new UUID tokens and typed missing/archived/token-conflict outcomes; preserve attempted values and original token with Spanish failures and redirect successful/replayed operations to their original destination.
- [X] T020 [US2] Add optional initial amount controls in src/views/student-form.ejs, later preset/custom controls in src/views/class-addition-form.ejs and active-student addition links in src/views/student-detail.ejs; show only current balance and inline success, associate errors and preserve selections/custom input, with no history or metrics.
- [X] T021 [P] [US2] Implement progressive enhancement in src/public/form-submission.js for all marked student forms: valid submit immediately disables the submitting button, announces “Guardando…”/“Archivando…” and blocks repeated activation without disabling posted fields; invalid browser validation, returned errors and pageshow/back navigation restore usability. If transport errors are handled in place, restore controls and retain values there too; keep native form operation functional.
- [X] T022 [US2] Wire the pending script into src/views/student-form.ejs and src/views/class-addition-form.ejs; add responsive long-text, field/error and pending-state styles in src/public/styles.css and run US2 tests, verifying exact totals without package records.

**Checkpoint**: Initial/later additions are atomic, retries are safe and new tokens allow intentional repeated amounts.

## Phase 5: User Story 3 — Correct and archive students (P2)

**Goal**: Maintain selected student details and archive explicitly while preserving identities and balances.
**Independent test**: Edit one of two students, cancel then confirm archive, restart and review the archived student's preserved details/balance; the other record remains unchanged.

### Tests first

- [X] T023 [US3] Extend tests/student-storage.test.ts with edit/archive identity and balance preservation, repeated archive no-op, archived edit/addition rejection and controlled concurrent archive/addition/edit orderings; addition-first retains its amount, archive-first rejects a new addition, matching old receipt replays still succeed and registrations stay unchanged.
- [X] T024 [P] [US3] Extend tests/student-flow.test.ts for GET/POST /students/:id/edit and /students/:id (edit POST), GET/POST /students/:id/archive, prefilled fields, explicit confirm=archive, cancellation without writes, 303 updated/archived notices, archived-list/read-only details, missing ids, archived conflicts and 422/409/503 value retention; assert archived pages have no mutation controls and archive workflows fit two screens.

### Implementation

- [X] T025 [US3] Implement edit and archive operations in src/students.ts under the same student-row lock used for additions: change only name/phone or archived_at, respectively; preserve balance/identity/registrations, reject new archived edits and make repeated archive idempotent.
- [X] T026 [US3] Implement edit/archive contract handlers in src/student-routes.ts with required confirmation, Spanish typed failures and retained input; cancellation remains GET-only, successful edit redirects to details and archive to active list with inline notices.
- [X] T027 [US3] Complete prefilled edit mode in src/views/student-form.ejs, explicit confirmation/cancel in src/views/student-archive.ejs and active-only edit/archive links plus read-only archived presentation in src/views/student-detail.ejs; include pending enhancement for both forms and run US3 tests.

**Checkpoint**: All three stories work; archives preserve readable balances and cannot receive new mutations.

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T028 [P] Extend tests/storage.test.ts with a real built-process restart and dump/restore of active/archived details, balances, durable receipts, v2 constraints/version and replay suppression after restart/restore; compare all seeded records and retain existing storage coverage.
- [ ] T029 [P] Extend tests/deployment.test.ts and scripts/deployment-smoke.mjs to verify all student views, routes and src/public/form-submission.js are packaged and served without publishing; inspect scripts/build-assets.mjs and change it only if current asset copying misses these files.
- [ ] T030 Run build, full tests and test:deploy as documented in specs/004-manage-students/quickstart.md; record actual commands/results and unresolved blockers there, including existing schedule/class/capacity regressions. Do not claim deferred enrollment deductions/refunds/FIFO are implemented.
- [ ] T031 Execute browser checks from specs/004-manage-students/quickstart.md at 320px and a representative phone viewport: long values, zero totals, Spanish labels/associated errors/status, all four pending buttons under throttling, repeated taps, invalid validation, storage failure/retry, back navigation and no-JavaScript operation; record evidence/issues in that file and fix issues in the affected src/views/ or src/public/ files.
- [ ] T032 Conduct and record owner acceptance SC-001–005 in specs/004-manage-students/quickstart.md using fictional records and existing deployed phone access: actual device, unassisted creation and standard-addition timings ≤60 seconds each, ≤2 screens per action, complete restart preservation, exact totals and owner understanding/confusion. If owner access is unavailable, mark this acceptance pending rather than inventing results or deploying without authorization.
- [ ] T033 Update README.md with implemented student/balance scope, migration/validation usage and deferred enrollment accounting, notifications and restoration; preserve existing deployment instructions and public-demo guidance without claiming unobserved usability success.

## Dependencies & Execution Order

```text
Setup T001–T002 → Foundation T003–T005 → US1 T006–T014
                                             ↓
                                      US2 T015–T022
                                             ↓
                                      US3 T023–T027
                                             ↓
                                      Polish T028–T033
```

US2 uses US1 identity, receipt and view infrastructure. US3 uses US1 reads/forms and US2's shared mutation locking. Each story has its own acceptance checkpoint; this is a deliberate sequential implementation order because the modules/views overlap, not a claim that whole stories can run concurrently. Within each phase, tests precede implementation, domain precedes handlers, and handlers/views precede integration verification. T028/T029 can overlap after all stories; T030 follows both and T031 follows a working build. T032 requires the owner and an available existing deployment; automated success does not substitute for it. T033 follows verification so documentation reflects actual scope.

## Parallel Opportunities and Examples

- **US1**: After foundation, write T006 (`tests/student-validation.test.ts`), T007 (`tests/student-storage.test.ts`) and T008 (`tests/student-flow.test.ts`) concurrently. After handlers/domain exist, T012 (`src/views/students.ejs`) and T013 (form/detail views) can overlap.
- **US2**: After US1, T017 (`tests/class-addition-flow.test.ts`) can overlap T015/T016 (distinct validation/storage test files). Once form-markup conventions are agreed, T021 (`src/public/form-submission.js`) can overlap T020 (views). Finish T022 only after both; do not concurrently edit shared domain/router files across stories.
- **US3**: After US2, T023 (`tests/student-storage.test.ts`) and T024 (`tests/student-flow.test.ts`) can run concurrently. Domain, router and view implementation then follow their dependencies sequentially.
- **Cross-cutting**: T028 (`tests/storage.test.ts`) and T029 (deployment test/smoke files) can overlap after story completion. Parallel examples describe scheduling opportunities; they do not authorize spawning agents.

## Implementation Strategy

1. Deliver Setup + Foundation + US1 as the first reviewable MVP: persisted identities, search and zero balances with retry-safe creation.
2. Add US2 next to deliver the main balance value: optional initial classes, later additions, exactly-once effects and pending feedback. Both P1 stories are required for the complete balance workflow.
3. Add US3 and verify editing/archiving preserve all student data and serialize with additions.
4. Complete restart/restore, packaging, regression and browser checks; conduct owner acceptance or explicitly report it pending. Request diff review before each logical commit; use specific paths and Conventional Commits. Push/PR remains contingent on explicit owner confirmation that implementation is complete and tested.
