# Data Model: Create and Edit Classes

## Class

- Stable generated identifier; nonblank title; local calendar date in `YYYY-MM-DD`; local clock time in `HH:MM`; positive whole-number student limit; teacher text `Claudia` or `Ester` for classes created or edited here.
- Persist a unique creation submission token separately from the displayed fields. Repeated submission of a token returns the original outcome; a new token permits an otherwise identical class.
- Validate actual calendar dates and clock times, positive integer capacity, non-whitespace title and the allowed teacher values on the server. Store local date and time as entered, without timezone conversion. Bound numeric values to safe supported integer representation and report invalid input.
- On create, insert once; on edit, update the existing identifier in one transaction. If the date changes, week queries select the record only for the new date. No class detail changes on validation, registration conflict or failed transaction.
- Reading the schedule must tolerate and visibly highlight a legacy or future class without an assigned teacher; this feature requires a teacher on create and edit.

## Registration seam

- A durable registration has a class reference, opaque student identifier and status `assigned` or `waitlisted`; prevent duplicate class/student entries. It is not an owner-facing enrollment feature.
- A class with any registration in either status cannot have its limit changed. Check the current registrations inside the same write transaction as the update. If the limit is unchanged, other valid fields can be edited. Enrollment writes introduced later must serialize on the same database and use this seam or migrate it without losing records.
- Class editing never modifies registration records, their order or package balances. This feature does not implement student/package records, FIFO promotion or access accounting. Future enrollment design must add the data needed for those rules, including durable waitlist ordering and package links.

## Schema lifecycle

- Existing schema version 1 contains metadata. Upgrade it transactionally without deleting or rewriting existing data, and update `user_version` only on success. Fresh initialization produces the same schema. Verify expected schema and surface incompatible or failed upgrades as errors.
- Existing files are backed up before the documented explicit migration; initialization continues to refuse to replace a file. Tests cover fresh setup, migration, preservation and rollback.
