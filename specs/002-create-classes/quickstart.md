# Quickstart: Validate Class Scheduling

These steps apply after implementation. Run from the repository root with Node 24 and pnpm 10.12.4. Use an isolated temporary database; do not initialize over existing data. The implementation must document the explicit upgrade command in the README before release.

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
```

For manual checks, choose a new temporary file path and set `STUDIO_DB_PATH` to it, then run `pnpm run db:init` and `pnpm start`. Open `http://127.0.0.1:8000/`. Stop and restart with the same path to check persistence.

1. Create one class for each teacher with valid details; find both in their weeks, inspect the limit, and reopen the app to confirm the values survive.
2. Edit all fields of a class with no registrations, including moving its date to another week. Confirm it appears only in the new week and persists after restart. Cancel a separate edit and confirm nothing changed.
3. Try missing fields, whitespace title, invalid dates/times, zero, negative and fractional limits, and an unsupported teacher submission. Confirm Spanish field errors, retained input and no saved changes. Submit two separate identical classes and confirm both are allowed; replay one creation token and confirm it creates no extra class.
4. Run automated isolated database fixtures for assigned and waitlisted registrations. Verify each blocks a limit change but allows other edits with the limit unchanged; registrations, order and package balances remain unchanged. Verify a registration inserted between form load and save rejects the whole change. Do not add test-data controls to the owner interface.
5. Run migration tests against a populated version 1 database and a fresh database; verify metadata survives, schema versions agree, failed migration rolls back, and initialization refuses to overwrite a file. Simulate storage failure and confirm Spanish errors, retained input and no false success.
6. Check current-week navigation, Spanish schedule and errors, missing-teacher highlighting, month/year boundaries and usability at 1024px. See [contract](contracts/class-scheduling.md) and [data model](data-model.md) for expected behavior.
