# Student management interface contract

Revised 2026-11-03: current student balances replace package assignment history. Server-rendered Spanish HTML; URL-encoded mutations. Mount before catch-all; records selected by id.

## Routes

| Method/path | Input | Result |
| --- | --- | --- |
| GET `/students` | optional `q`, `status=active|archived` (default active) | 200 list, literal case-insensitive name substring search; clear empty/no-match guidance |
| GET `/students/new` | none | 200 creation form, optional initial classes and new token |
| POST `/students` | `name`, `phone`, `classChoice`, `customCount`, `token` | Atomic student/initial balance/receipt; 303 `/students/:id?notice=created` |
| GET `/students/:id` | id | 200 details and “Clases disponibles”, including zero and archived records |
| GET `/students/:id/edit` | active id | 200 prefilled identity/contact form, no balance editing |
| POST `/students/:id` | `name`, `phone` | Update details only; 303 details with `notice=updated` |
| GET `/students/:id/archive` | active id | 200 explicit “Archivar estudiante” confirmation and cancel |
| POST `/students/:id/archive` | `confirm=archive` | Archive only with explicit confirmation; 303 active list with `notice=archived` |
| GET `/students/:id/classes/new` | active id | 200 “Agregar clases” form and new token |
| POST `/students/:id/classes` | `classChoice`, `customCount`, `token` | Atomic balance increment/receipt; 303 details with `notice=classes-added` |

Creation `classChoice=none|1|5|10|custom`; omitted/none means initial 0. Later additions require `1|5|10|custom`. `customCount` required only for custom: digit-only positive safe integer. Reject missing/zero/negative/fractional/exponent/nonnumeric/unsafe values; ignore inactive custom field for preset. Reject a sum above the safe-integer bound without changing the balance.

UUID token identifies one create/addition operation. Persist a minimal technical receipt as specified in [data-model.md](../data-model.md). Same token/normalized input returns the original redirect without another mutation, including after response loss or later archiving. Different input/operation/target conflicts with 409. New form/token permits intentional same-size additions. No package assignment/history routes or metrics.

## Failures, feedback and accessibility

- 422: invalid fields/token, missing archive confirmation or unrepresentable balance total; same form, Spanish field feedback and entered values retained.
- 404: unknown student, Spanish feedback.
- 409: new edit/addition against archived student or conflicting receipt; Spanish explanation and attempted form values preserved where applicable.
- 503: mutation storage failure; same form/token/values, no success. Read failures use existing Spanish storage-error page.
- Malformed query/body structures receive Spanish 400 feedback; whitelist notice keys rather than echo arbitrary query text.
- Cancel follows a GET link and writes nothing. Archived-list link exposes read-only details/balance; archived pages offer no mutation controls.
- Escape user text in EJS; labels and associated field errors; status announcements for success/pending. Phone uses `type=tel` without country patterns. Long values and controls fit at 320px without essential horizontal scrolling.
- Retain the Spanish public academic-demo notice. Phone collection does not enable notifications.
- On a valid submit, immediately set the submitting button to disabled/loading with Spanish “Guardando…” (or “Archivando…”), expose pending status and block repeated activation. Preserve posted form fields. Invalid browser validation must leave the button usable. Returned validation/save-error forms and browser back navigation restore the usable state; transport errors handled in place restore it and preserve values too. Normal forms work without JavaScript and server duplicate protection remains authoritative.

## Interaction budget

Create/edit/add classes: form → existing details with inline success and current total. Archive: confirmation → active list with inline success. At most two screens/dialogs each; no success-only page and no package-history step.

## Internal boundaries

`students.ts` owns required-field/amount validation, list/details, atomic creation/additions and edit/archive. Use the existing checked-out-client `transaction()` helper, same student lock for mutations and parameterized arithmetic increments. `student-routes.ts` maps typed ok/missing/archived/token-conflict results and validation/storage failures to the outcomes above. Domain errors never expose SQL details. `form-submission.js` provides the loading behavior; it does not calculate or own the authoritative balance.
