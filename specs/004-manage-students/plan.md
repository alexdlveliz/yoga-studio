# Implementation Plan: Manage students and available classes

**Branch**: `feature/create-students` (actual Git branch); setup feature identifier: `004-manage-students` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Input**: Revised student-balance scope approved on 2026-11-03. Supersedes the initial package-assignment plan. Planning ends after Phase 1; generate tasks separately.

## Summary

Extend the existing Express/EJS application with student creation, search, details, editing and confirmed archiving. Store one `available_classes` balance per student in PostgreSQL. Add 1, 5, 10 or a custom positive whole number at creation or later; display the current total. There is no package assignment model or history. Durable technical submission receipts prevent repeated additions; a loading button prevents repeated interaction. Preserve current-week entry and deployment arrangements.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 24, HTML/CSS and small progressive-enhancement browser JavaScript; pnpm 10.12.4.

**Primary Dependencies**: Existing Express 5, EJS 3, pg 8; no new runtime dependency.

**Storage**: Existing PostgreSQL 14+ private `yoga_studio` schema. Transactional v1→v2 upgrade adds students and technical submission receipts; fresh initialization produces equivalent v2.

**Testing**: Existing Vitest 3 with isolated real PostgreSQL databases; HTTP integration, concurrency, process restart, backup/restore and deployment packaging. Browser/manual loading-state and phone acceptance.

**Target Platform**: Existing local server and Netlify Functions; phone-sized browser layouts. Actual phone access uses the existing deployed URL, not loopback.

**Project Type**: Server-rendered owner-facing web application.

**Performance Goals**: SC-001: creation and separate standard addition each within 60 seconds in owner acceptance. SC-002: each mutation within two screens/dialogs. No additional throughput claim.

**Constraints**: Spanish user-facing content; durable nonnegative balances; shared names/phones allowed; permissive phone formatting; no package history, usage accounting, enrollment UI, payments or new hosting/access arrangements. Keep public demo notice; use fictional acceptance records.

**Scale/Scope**: One small studio; estimated 15–20 students is qualitative context, not a limit. This feature adds/displays classes; later enrollment implements deductions/refunds and FIFO promotion.

## Constitution Check

*Evaluated before research and after revised design against constitution 2.0.0.*

| Principle | Gate | Design evidence |
| --- | --- | --- |
| I. Owner-focused scheduling | PASS | `/` and week navigation retained; add student navigation. |
| II. Persistent records | PASS | One student balance, optional initial addition, durable later additions; migration/restart/restore checks. |
| III. Accurate accounting | PASS for incremental scope | Atomic increments and durable retry protection; edit/archive preserve balance. Deductions/refunds remain later enrollment work, not claimed here. |
| IV–V. FIFO and enrollment integrity | PASS, unaffected | No registration/capacity changes; retain trigger and scaffold. Document future atomic student-balance accounting and once-only refunds. |
| VI. Spanish | PASS | Labels, errors, loading/success feedback and zero balances in Spanish. |
| Product/workflow | PASS | No commerce, expiration or changed access arrangement; test balance races and unchanged existing data. |

**Post-design review**: PASS. This plan adopts the owner-approved 2.0.0 amendment and makes no claim of full enrollment implementation. No unresolved clarification or constitution exception.

## Project Structure

### Documentation

```text
specs/004-manage-students/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/student-management.md
├── quickstart.md
└── checklists/requirements.md
```

`tasks.md` is generated separately with `$speckit-tasks`.

### Planned source and validation map

```text
src/db.ts                         # versioned migration, exact schema checks, RLS/privileges
src/students.ts                   # validation, reads, edit/archive and atomic class additions
src/student-routes.ts             # router, parsing, form results and HTTP outcomes
src/app.ts                        # mount router before catch-all
src/views/students.ejs             # active/archived lists, search
src/views/student-detail.ejs       # details and available classes; no package history
src/views/student-form.ejs         # creation/edit and optional initial classes
src/views/class-addition-form.ejs  # later addition
src/views/student-archive.ejs      # explicit confirmation
src/views/schedule.ejs             # student navigation
src/public/styles.css             # responsive forms/lists and loading feedback
src/public/form-submission.js     # pending button state, retry/back-navigation recovery
 tests/student-validation.test.ts
 tests/student-storage.test.ts
 tests/student-flow.test.ts
 tests/class-addition-flow.test.ts
 tests/db-init.test.ts             # v1→v2 migration and corrupt/unknown schema checks
 tests/storage.test.ts             # restart and backup/restore of balances/receipts
 tests/deployment.test.ts          # new views and assets packaged
 scripts/deployment-smoke.mjs      # student route/static asset smoke
 README.md                        # update implemented scope during implementation
```

**Structure Decision**: Retain current pool and `transaction()` helper; one focused student domain module and one router. No package module or package-assignment table. Before modifying existing functions, find callers, especially `initializeDatabase` and `createApp`.

## Implementation sequence for later task generation

1. Storage: pin migration/preservation tests, implement v1→v2 and equivalent fresh schema. Validate repeat/concurrent setup, RLS and rollback. Change existing unsupported-version test from version 2 to a genuinely unknown version without losing rejection coverage.
2. Domain: required strings, formatted phones, literal case-insensitive name search, independent identities, active/archive reads and mutations. Atomically create initial balance and perform later increments using student row locks and technical receipts. Test no lost updates, no duplicate retries, overflow rejection, archive races and rollback.
3. UI/routes: contract routes and Spanish views, current total/zero state, optional initial amount, additional classes, two-screen confirmations, inline feedback, preserved values and accessible pending buttons. Include normal form operation without JavaScript; database protection remains authoritative.
4. Validation: restart/restore, packaged views/JS, existing schedule/class regressions, browser loading-state/back-navigation checks and SC-001–005 owner acceptance.

Use meaningful failing tests before implementation and verify each unit. Stage specific files; make incremental Conventional Commits only after owner diff review. No push/PR without the explicit confirmation required in project instructions.

## Review Focus

- Concurrent additions to the same student include every successful amount; archive/addition ordering is consistent.
- Same-token retries after a lost response add exactly once across app instances; new tokens permit intentional same-size additions.
- Required Unicode/whitespace input, literal wildcard searches, shared identities and formatted phones preserve the selected student's data.
- Corrupt/unknown schemas fail without partial upgrades; safe-integer overflow leaves the original balance unchanged; restored receipts still prevent duplicate additions.
- At 320px, long text, zero balance, errors and pending feedback remain usable. Buttons recover after validation/save failures and browser back navigation; success adds no extra screen.

## Complexity Tracking

No constitution violations. Submission receipts are technical retry protection, not a package business model or reporting history.
