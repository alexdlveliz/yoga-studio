# Implementation Plan: Local App Foundation

**Branch**: `001-app-foundation` (feature identifier; no Git branch exists) | **Date**: 2026-11-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-app-foundation/spec.md`

## Summary

Build a locally served, server-rendered weekly schedule shell, backed by a persistent SQLite database. Use one Node.js application process bound to loopback; no independently deployed backend is needed. The shell navigates weeks, checks storage availability, and reports storage errors without suggesting data was saved.

## Technical Context

**Language/Version**: TypeScript on Node.js 24 LTS; HTML and CSS; no client framework required.

**Primary Dependencies**: Express 5, EJS, better-sqlite3, TypeScript; use pnpm 10.12.4 pinned in `package.json` and commit `pnpm-lock.yaml`; configure `pnpm.onlyBuiltDependencies` to allow the required better-sqlite3 native build.

**Storage**: SQLite file outside source-controlled files, accessed with better-sqlite3.

**Package Management**: pnpm 10.12.4; use `pnpm install --frozen-lockfile` for clone installs.

**Testing**: Vitest for date logic, HTTP and storage integration; browser acceptance checks in current stable Chrome, Edge, Firefox and Safari where available.

**Target Platform**: One local studio computer with Node.js and a supported desktop browser; bind HTTP to `127.0.0.1` only.

**Project Type**: Single-process local web application.

**Performance Goals**: Meet the specification's correctness, persistence, and 1024-pixel usability outcomes; no unsupported latency target.

**Constraints**: No remote or multi-user service, commerce, owner-facing record management, or test-data controls. Database must persist independently of process and browser lifetime.

**Scale/Scope**: One owner, one computer, empty schedule shell, and minimal persistence foundation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Owner-focused scheduling**: PASS — current week, adjacent navigation, readable shell; actual class and teacher management is deferred per the explicitly approved foundation scope.
- **Persistent studio records**: PASS for foundation scope — a durable database and restart verification are included; people and package records are deferred, not represented as complete.
- **Accounting, waitlist and enrollment integrity**: PASS — no enrollment or balance mutations are introduced; future features must implement and verify these rules.
- **Product constraints and workflow**: PASS — owner-facing local app, no commerce; tests cover applicable behaviors and failures.

**Post-design review**: PASS — the data model and contracts add no conflicting studio behavior. The locale fallback and explicit database initialization are documented in research and quickstart.

## Project Structure

### Documentation (this feature)

```text
specs/001-app-foundation/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
├── quickstart.md
└── tasks.md             # created later by $speckit-tasks
```

### Source Code (repository root)

```text
src/
├── server.ts            # local server and routes
├── db.ts                # connection and explicit initialization
├── schedule.ts          # locale-aware date calculations
├── views/               # schedule and error templates
└── public/              # presentation
tests/
├── schedule.test.ts
├── storage.test.ts
└── app.test.ts
```

**Structure Decision**: One Express application serves HTML and accesses SQLite directly. Keep configuration, initialization, and local launch documented in the project README; do not introduce a separately deployed API or a frontend build tool.
