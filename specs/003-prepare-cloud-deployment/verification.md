# Implementation and verification record

## Delivered

- Specification and separate quality checklist; active feature reference updated.
- PostgreSQL-only runtime with async routes and a small warm-function connection pool.
- Explicit transactional setup in private `yoga_studio` schema; repeat/concurrent setup preserves records, rejects incompatible structures/versions and restores privacy settings.
- Database uniqueness protects concurrent repeated submissions; row locks and a registration trigger preserve the capacity guard.
- Netlify function, build/static assets, explicit EJS engine and packaged-function smoke check.
- Configurable studio locale/timezone, Spanish demo notice and safe Spanish fallback errors.
- Spanish setup, deployment, free-limit, inactivity recovery and manual backup/restore documentation.

## Evidence

- Clean baseline: 36 original tests passed with local network permissions.
- `pnpm run build`: passed.
- `TEST_DATABASE_URL=<isolated local PostgreSQL> pnpm test`: 32 tests passed across 12 files. Tests were ported from SQLite to real PostgreSQL, consolidating obsolete SQLite-specific cases and adding cloud behavior coverage.
- Tests include concurrent duplicate requests across two app instances, assigned/waitlisted guards, late registrations, failed writes and retry, process restarts, repeated/concurrent setup, setup rollback, schema incompatibility, private schema permissions and a real pg_dump/pg_restore into an empty database.
- `pnpm run test:deploy`: passed; packages with Netlify tooling, extracts outside the source tree and invokes the function with no credentials. Covers views, form validation, safe storage failure, static assets and rewrite configuration.
- Regression tests reproduced the unsupported-version/missing-constraint review finding before the fix and passed afterward.
- Mechanical UI check reported only advisory palette/type findings; the new notice uses existing ink and amber colors. Existing unrelated palette/type advisories were left unchanged.

## Review

An independent final reviewer identified one Important issue: setup could accept incompatible versions/constraints. Fixed with transactional comparison against reference tables built from the same definitions, checking column types/nullability and constraint semantics, and an explicit version check. All tests passed after the fix.

Deferred minor: add a two-connection contention test where an uncommitted registration holds the class lock while an update waits. Existing tests cover concurrent creation and a registration committed after the edit form opens; they do not reproduce that exact wait state.

## Implementation decisions

- User-selected scope: PostgreSQL becomes the only runtime datastore. Local SQLite files are untouched; no import is performed.
- Use configurable demo defaults `es-GT` and `America/Guatemala`; these are not persona geography claims. A different studio must configure its own values.
- Use serverless-http 4 because v3 was reproduced skipping Express 5 form parsing. Bundle dependencies and explicitly register EJS because external dependency tracing produced an incomplete standalone bundle in this environment.
- Existing feature branch retained at the user's request. The user reviewed and approved committing and pushing on 2026-11-03. No PR, account creation or publication is included in that approval.

## Pending hosted acceptance

No account credentials were used and nothing was published. A maintainer must follow docs/deployment.md to verify Supabase TLS/permissions, live Netlify rewrites/HTTPS, phone layout, a second browser and persistence after actual redeployment. Browser-host access was unavailable in this session, so rendered phone/desktop QA could not run locally. Free allowances must be reconfirmed in provider dashboards.

The public-coursework permission model is intentionally shared editing without login. Enrollment/package accounting and SQLite migration are excluded by the approved scope.
