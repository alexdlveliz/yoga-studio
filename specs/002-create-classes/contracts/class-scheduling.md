# Class Scheduling Contract

## Owner interface

- The current-week schedule retains previous/next navigation and links to create a class. Classes appear on their date with title, time, teacher and a way to view/edit the student limit. Missing teachers are highlighted. Text, date display, field labels and errors are Spanish, independently of the locale used to determine week boundaries.
- Creation and editing present title, date, time, student limit and teacher choice (Claudia or Ester). Editing prepopulates saved values. Both forms support save and cancel. Editing shows the current limit as non-editable with an explanation when either assigned or waitlisted registrations exist.
- A valid creation saves one class; a valid edit updates that class. Successful writes redirect to the week containing its saved date. Validation errors identify fields and retain submitted values; save errors retain values and do not claim success. Cancellation performs no write.
- On a stale edit where registration appears before saving, a changed limit rejects the entire edit with a Spanish explanation, retaining entered values; unchanged limit allows other edits. The server enforces the guard regardless of client controls.

## HTTP interaction

- `GET /?week=YYYY-MM-DD`: existing schedule contract, extended to include classes for the computed week; malformed dates remain 400 and storage failures remain 503.
- `GET /classes/new`: form with a unique creation token. `POST /classes`: validate and create; on success redirect to the saved class's week. Replaying the same token must not create another class.
- `GET /classes/:id/edit`: prefilled form and current registration status. `POST /classes/:id`: validate and atomically update, checking the limit guard within the write transaction; on success redirect to the saved class's week.
- Invalid submitted data returns a form with field errors (400 or 422); a capacity conflict returns a form with a conflict explanation (409); an unknown class returns 404; inaccessible storage returns a Spanish error (503). For form write errors, retain submitted values and allow retry. Missing or invalid creation tokens are rejected; a token already committed resolves to its existing class without overwriting it.
- All database writes are atomic; class lookup and form output escape user-supplied text. The creation token is unique per intended submission, not derived from class details.
