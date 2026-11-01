# Research: Local App Foundation

## Local application architecture

- **Decision**: Use TypeScript on Node.js 24 LTS with Express 5 and EJS server-rendered HTML. Serve CSS and ordinary links/forms; introduce browser TypeScript when interaction requires it. Bind the single application process to `127.0.0.1`.
- **Rationale**: The user selected TypeScript. One language can support future browser and server logic while a single local process and server-rendered pages fit the foundation's small scope.
- **Alternatives considered**: Python and Flask do not match the chosen language; a separate frontend and API or a client framework adds complexity before the feature needs it. React or another frontend framework can be evaluated when richer interactions are introduced.
- **Sources**: [Express template engines](https://expressjs.com/en/5x/guide/using-template-engines/), [Node.js releases](https://nodejs.org/en/about/previous-releases).

## Persistence and initialization

- **Decision**: Use better-sqlite3 and a configurable stable local SQLite path, defaulting to `data/studio.sqlite`. Explicitly initialize once with a CLI command. Thereafter open using `fileMustExist`, check schema on each schedule request, and show the storage error if missing, inaccessible, or invalid. Use transactional writes, parameterized SQL, and scoped connections; never reset or silently replace a database.
- **Rationale**: An embedded database needs no separate service; explicit initialization and `fileMustExist` distinguish a missing database from a first use. The native dependency may require build tools when prebuilt binaries are unavailable.
- **Alternatives considered**: Node's built-in SQLite API is still a release candidate in Node 24; implicit creation could hide data loss. An external database service is disproportionate for one computer.
- **Sources**: [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md), [Node 24 SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html), [SQLite serverless](https://www.sqlite.org/serverless.html).

## Week boundaries and dates

- **Decision**: Use the Node process's local calendar date and `Intl.DateTimeFormat().resolvedOptions().locale`, or `STUDIO_LOCALE` when set. Resolve first weekday with `Intl.Locale.getWeekInfo()` on the selected Node 24 runtime; require full ICU, and if locale resolution fails use `en-US` and log the fallback. Use calendar-date arithmetic, not elapsed hours.
- **Rationale**: Server-side locale data provides consistent week boundaries across browsers and supports month, year and daylight-saving transitions. The runtime's effective locale must match the computer's regional settings, or the override must be configured.
- **Alternatives considered**: Hard-coding Monday violates the locale assumption; browser-side week APIs vary across engines.
- **Source**: [Node internationalization support](https://nodejs.org/api/intl.html).

## Verification

- **Decision**: Use Vitest with temporary file-backed databases, HTTP integration tests and an actual process restart for persistence; manually check supported desktop browsers.
- **Rationale**: A file-backed restart test proves durability; an in-memory database cannot. Browser checks cover supported engines and the 1024-pixel layout.
- **Alternatives considered**: Only unit tests or only manual checks leave persistence and failure paths unverified.

## Package management

- **Decision**: Pin pnpm 10.12.4 in the `packageManager` field of `package.json`, commit `pnpm-lock.yaml`, and use `pnpm install --frozen-lockfile` for clone installs. Configure `pnpm.onlyBuiltDependencies` to allow `better-sqlite3` to build; verify its native binding loads after a clean installation.
- **Rationale**: The user requires pnpm; a pinned version and frozen lockfile make installs reproducible, while explicitly approving the native dependency enables SQLite to work with pnpm 10 build-script controls.
- **Alternatives considered**: npm lockfiles and npm install commands conflict with the user’s preference; suppressing all dependency builds prevents the native SQLite binding from being installed.
- **Sources**: [pnpm install](https://pnpm.io/cli/install), [pnpm build approval](https://pnpm.io/cli/approve-builds), [pnpm installation](https://pnpm.io/installation).
