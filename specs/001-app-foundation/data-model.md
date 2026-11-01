# Data Model: Local App Foundation

## Schedule week (derived, not persisted)

- `start_date`: local calendar date of the locale's first weekday.
- `end_date`: `start_date` plus six calendar days.
- `dates`: seven consecutive local calendar dates, inclusive of both endpoints.
- Navigation changes `start_date` by seven calendar days. On initial load derive it from the computer's current local date and locale.

## Foundation metadata (SQLite)

- `key`: non-empty text primary key.
- `value`: non-null text.
- Schema version is tracked separately through SQLite `PRAGMA user_version`, initially `1`. Explicit initialization creates the table and sets that version transactionally; normal requests verify the version and table are readable without creating or replacing anything.
- No studio entities or production verification values are prepopulated. Integration tests may insert and retrieve a uniquely named metadata record in a temporary file-backed database, then remove the temporary database after testing.
- Connections are scoped to each request or CLI/test operation; writes commit on success and roll back on failure.

## State and failures

- An explicitly initialized, readable database permits the empty schedule state.
- Missing, unreadable, corrupt, or incompatible storage produces the error state, not an empty schedule. A failed write never produces a success result.
- Future studio entities and enrollment transitions will be designed with their own features; no enrollment behavior is claimed here.
