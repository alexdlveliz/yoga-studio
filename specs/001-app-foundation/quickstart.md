# Quickstart Validation: Local App Foundation

These commands describe the planned implementation and become runnable after implementation. Run from the repository root on a local computer with Node.js 24 LTS, pnpm 10.12.4, and a supported desktop browser. The SQLite dependency may require native build tools if no prebuilt binary is available.

## Setup and run

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run db:init
pnpm start
```

Install the pinned pnpm version using the [pnpm installation guide](https://pnpm.io/installation). The project must permit the `better-sqlite3` build script; verify the native binding loads after installing. Initialize only once; the command refuses an existing database. The default database is `data/studio.sqlite`; set `STUDIO_DB_PATH` before initialization and launch to select another persistent path. Set `STUDIO_LOCALE` to a locale such as `es-GT` if Node's default locale does not match the computer's regional settings. Use an official Node distribution with full ICU.

## Validate

1. Open `http://127.0.0.1:8000/`; confirm the seven dates include today, the empty state is visible, and previous/next links show the adjacent weeks. Check a month and year boundary.
2. Run `pnpm test` in a second terminal. The suite uses isolated temporary databases, checks locale-specific week starts and failure responses, and performs ten actual application-process restarts with a test record preserved unchanged.
3. With the application stopped, set `STUDIO_DB_PATH` to a nonexistent path and restart it without running initialization. The page must show an actionable storage error, not an empty schedule. Restore the original path after the check; do not remove or overwrite the studio database.
4. At 1024 pixels wide, repeat the schedule and navigation checks in current stable Chrome, Edge, Firefox, and Safari where available on the computer. Confirm readable content and no horizontal scrolling.

See [schedule contract](contracts/schedule.md) and [data model](data-model.md) for expected behavior and storage details.

## Validation record (2026-11-01)

- Automated checks cover initialization, date calculations, HTTP behavior, corrupt and incompatible storage, recovery, transaction rollback, and ten application-process restarts.
- Chrome: current week and next-week navigation inspected in a desktop window. An exact 1024-pixel viewport check remains outstanding.
- Edge and Safari are installed but were not checked. Firefox is not installed. The browser automation host was unavailable, so cross-browser and exact-width acceptance checks remain outstanding.

- The owner requested that the multi-browser task be marked complete despite the outstanding exact-width and cross-browser checks above. Those checks were not performed and are not represented as passing.
