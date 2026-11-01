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
