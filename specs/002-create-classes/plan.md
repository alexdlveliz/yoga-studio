# Implementation Plan: Create and Edit Classes

**Branch**: `main` (setup reports feature identifier `002-create-classes`; no feature branch was created) | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-create-classes/spec.md`

## Summary

Extend the existing local weekly schedule with Spanish class creation and editing. Store classes in SQLite, validate inputs on the server, and move edited classes to the week of their saved date. A transactional save-time registration check prevents changing capacity when an assigned or waitlisted student exists; other edits preserve registrations and balances.

## Technical Context

**Language/Version**: TypeScript, Node.js 24; HTML and CSS.

**Primary Dependencies**: Existing Express 5, EJS, better-sqlite3; pnpm 10.12.4. No new runtime dependency is required.

**Storage**: Existing local SQLite file; non-destructive versioned migration from schema version 1 and matching fresh initialization.

**Testing**: Vitest for validation, migrations, transactional storage and HTTP integration; manual desktop browser acceptance and process restart. Update existing English-text and schema-version assertions while preserving their original coverage.

**Target Platform**: One local studio computer, supported current desktop browsers, loopback server.

**Project Type**: Server-rendered local web application.

**Performance Goals**: Meet spec SC-001 through SC-006; no additional throughput target.

**Constraints**: Spanish owner-facing content; durable records; preserve existing metadata; no commerce or enrollment management. The existing locale still determines week boundaries; display labels are Spanish.

**Scale/Scope**: One owner; individual class creation and editing; no recurrence or deletion.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Owner-focused scheduling**: PASS — retain current-week entry and navigation; show classes and support creation/editing. Highlight any class without a teacher if such a record is encountered, even though this feature requires a selection.
- **Persistent records**: PASS — versioned migration and restart checks preserve records; student, teacher and package management remain future scope.
- **Access accounting, waitlist and enrollment integrity**: PASS — no enrollment or balance mutation; assigned and waitlisted registrations both block capacity changes; guard and writes are serialized. Tests verify unchanged registrations and balances using isolated fixtures, including race conditions.
- **Spanish and product constraints**: PASS — translate all touched schedule, form, validation and error surfaces, including existing English views; no payment features.
- **Workflow**: PASS — tests cover persistence, capacity restriction and preservation; unrelated enrollment promotion/refund logic is not implemented or changed.

**Post-design review**: PASS — class edits are atomic; future enrollment must use the same SQLite database and write transaction boundary. No constitution exception is needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-create-classes/
├── plan.md
├── research.md
├── data-model.md
├── contracts/class-scheduling.md
├── quickstart.md
└── tasks.md             # created later by $speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app.ts               # schedule and class form routes
├── db.ts                # initialization, migration and schema checks
├── schedule.ts          # existing date and week calculations
├── classes.ts           # planned validation and transactional persistence
├── views/               # schedule, class form and error pages
└── public/styles.css
tests/                   # existing tests plus class, migration and HTTP coverage
```

**Structure Decision**: Extend the existing single application and database. A small class registration persistence seam is necessary to check assigned and waitlisted records; it does not expose enrollment management and must be adopted by the future enrollment feature.
