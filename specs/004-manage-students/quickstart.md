# Validation quickstart: Students and available classes

This describes validation after implementation, not completed test results. See [contract](contracts/student-management.md) and [data model](data-model.md). Revised scope has no package assignment history.

## Prerequisites and setup

Node.js 24, pnpm 10.12.4 and PostgreSQL 14+. Follow README.md and docs/deployment.md. Use fictional details in the public demo. Tests need a disposable PostgreSQL server whose role can create databases, never shared production credentials.

```sh
pnpm install --frozen-lockfile
pnpm run build
# Export TEST_DATABASE_URL to a disposable PostgreSQL admin connection.
pnpm test
pnpm run test:deploy
```

Expected: build and all tests pass; packaged function resolves student views and pending-state JavaScript without publishing.

For manual checks copy `.env.example` to `.env`, configure connections, then:

```sh
node --env-file=.env dist/init-db.js
node --env-file=.env dist/server.js
```

Open `http://127.0.0.1:8000/`. Node does not automatically load `.env`. Actual phone access uses the existing hosted HTTPS URL; a narrow desktop viewport proves layout only.

## Automated evidence required

- Fresh v2 and known exact v1 upgrade preserve seeded metadata/classes/assigned+waitlisted registrations, lock trigger and existing behavior. Repeat/concurrent initialization is safe. Unknown versions/schema drift roll back. Students/receipts have private privileges/RLS.
- Validate nonblank Unicode names/phones, permissive formatting, duplicate identities and literal wildcard name search. Details display zero and positive balances correctly.
- Create without initial classes (0), with each preset/custom amount, and reject invalid counts/overflow. Inject receipt/storage failure and prove no partial student or increment.
- Concurrent same-token requests through independent app instances create one student/increment once. Retry after response loss, another successful addition and process restart still does not increment again. Changed target/input conflicts. Fresh tokens allow intentional same-size additions.
- Concurrent distinct additions both appear in the final total; archive/addition/edit serialize without lost updates. Edit/archive/cancel preserve balances. Existing registrations/capacity remain unchanged.
- Restart a real built process and compare all active/archived details/balances. Extend dump/restore checks to receipts, balances, constraints and version; a restored receipt still suppresses retry.
- HTTP 422/409/503 preserve values/tokens with Spanish feedback. Verify no history/metrics are required, new views/assets package successfully and schedule/class regressions pass.

## Phone/browser and owner acceptance (SC-001–005)

1. Open `/`: current-week schedule remains first. Follow “Estudiantes”. At 320px and a representative phone size, essential controls and long values fit without horizontal scrolling.
2. Time unassisted student creation without initial classes: at most 60 seconds and two screens/dialogs; details show zero. Search by name fragment and clear search. Create a shared-name/phone record and verify independent identity/balance.
3. Create a student with 5 classes; add 1, 5, 10 and custom 7 in separate actions; expect 28. Intentionally add 5 again; expect 33. Time a standard addition: at most 60 seconds/two screens. Only current available classes are needed.
4. Under browser network throttling, submit each action and verify immediate Spanish pending state and disabled button. Repeated taps add no duplicate effect. Invalid fields leave or restore a usable button. Returned validation/storage failures retain values; retry works. Navigate back to a submitted form and verify button recovery.
5. Try blank/whitespace fields and missing/0/-1/1.5/nonnumeric custom amounts. Balance stays unchanged and Spanish feedback retains values. Cancel creation/edit/addition and verify no writes.
6. Edit one student: identity/balance persist and other students remain unchanged. Cancel archive, then explicitly confirm it. Student leaves active results but retains details/balance under “Archivados”, without mutation controls.
7. Stop/restart the server and compare 100% of accepted records and balances, including archived students. No package dates/counts/history need to be retrieved.
8. Record actual timings/screens/device and ask the owner what was required, how they identified success and where they found available classes. Log confusion before acceptance; automation alone does not prove these usability criteria.

Enrollment deductions/refunds and FIFO promotion remain later work; no manual acceptance scenario here claims they are implemented.
