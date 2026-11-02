# Yoga Studio

A local foundation for an owner-facing studio schedule. It currently displays an empty weekly schedule; class, people, package, and enrollment management are future work.

## Requirements

- Node.js 24 with full ICU support and pnpm 10.12.4 (the version is pinned in `package.json`; Corepack can provide it).
- Native build tools for `better-sqlite3` if a prebuilt binary is unavailable (for example, Xcode Command Line Tools on macOS).

## Set up

Clone the repository and run the following commands from its root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm run db:init
pnpm start
```

Open <http://127.0.0.1:8000/>. Stop the server with Ctrl-C. Run `pnpm run db:init` only once: it refuses to overwrite any existing file. Run `pnpm run build` after changing TypeScript, before launching or initializing.

The database defaults to `data/studio.sqlite` in this clone. To use another location, set `STUDIO_DB_PATH` to a persistent file path before both initialization and launch. Keep a backup of this file; it contains local studio data and is not included in Git. The server binds only to loopback and is intended for one computer, not remote access.

Week boundaries use the Node process's locale. Set `STUDIO_LOCALE` (for example, `es-GT`) if that differs from the computer's regional settings. An invalid or unsupported locale falls back to `en-US` and logs a warning. Calendar dates use the computer's local date.

## Verify

Run `pnpm run build` followed by `pnpm test`. Tests use isolated temporary databases and include real application-process restarts. See [quickstart validation](specs/001-app-foundation/quickstart.md) for manual checks. If the schedule reports unavailable data, check that the original database is accessible and retry or seek help; do not initialize over an existing database.

## Upgrade an existing database

Stop the application before upgrading. Back up the existing SQLite file (the default is `data/studio.sqlite`, or the path in `STUDIO_DB_PATH`) to a separate safe location before proceeding. With the same `STUDIO_DB_PATH` used by the application, run:

```sh
pnpm run build
pnpm run db:migrate
pnpm start
```

The upgrade preserves version 1 metadata and runs in a transaction. `db:init` is only for a new file and will never replace an existing file. If migration fails, keep the original and backup, resolve the error, and retry; do not initialize over it. For a new installation, use `pnpm run db:init` instead of the upgrade command.

Class registrations are stored as an internal seam for the capacity guard; there is no enrollment interface yet. Future enrollment writes must use the same SQLite database and serialized write transaction, preserving the registration records and adding the information needed for waitlist ordering and package accounting. Run `pnpm run build` and `pnpm test` to verify changes; [class scheduling checks](specs/002-create-classes/quickstart.md) describe the manual scenarios.
