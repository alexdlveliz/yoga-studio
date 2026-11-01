# Schedule Interface Contract

## Owner interface

- `GET /` displays the current local week when the database is available. The seven dates and a clear empty-state message appear with previous and next links.
- `GET /?week=YYYY-MM-DD` displays the week containing that valid local date, normalized to the locale's first weekday. Previous and next links supply dates seven days before or after the displayed start.
- Invalid `week` values return HTTP 400 with a readable error; no silent fallback changes the requested date.
- Storage unavailable or schema invalid returns HTTP 503 with a readable message to retry or seek help; do not display the ordinary empty state. Do not expose file paths, stack traces, or sensitive diagnostics to the page.
- Pages and navigation work without JavaScript and remain usable without horizontal scrolling at a 1024-pixel desktop viewport. The browser must not cache an error or schedule response in a way that hides a subsequent recovery or date change.

## Local operation interface

- `pnpm run db:init` explicitly initializes a missing database; refuse to overwrite an existing database and return a nonzero exit status on failure.
- `pnpm start` serves the app locally. Environment configuration supports `STUDIO_DB_PATH` and `STUDIO_LOCALE`; the default database path is `data/studio.sqlite` in the project directory.
- No public endpoint inserts verification data or manages classes. Test-only code exercises writes directly through the storage layer in an isolated database.
