# Data model: Students and available classes

Revised 2026-11-03 for constitution 2.0.0. **Student is the sole business entity introduced by this feature.** A package is a choice of amount to add, not a persisted assignment entity.

## Student — `yoga_studio.students`

| Field | Storage | Rules |
| --- | --- | --- |
| id | TEXT primary key | Server-generated UUID, stable identity |
| name | TEXT NOT NULL | Trim edges; reject whitespace-only; database nonblank check |
| phone | TEXT NOT NULL | Required, preserve common formatting, no uniqueness |
| available_classes | BIGINT NOT NULL DEFAULT 0 | CHECK >= 0 and <= 9007199254740991 |
| archived_at | TIMESTAMPTZ nullable | NULL active, server timestamp archived |

Names/phones may match other records. Validate Unicode whitespace with JavaScript trim and reject whitespace-only direct writes at the database boundary too. No arbitrary business length limit; retain existing request-body limits with Spanish feedback. Explicitly convert PostgreSQL BIGINT reads to safe numbers. There are no package fields, assignment dates or derived history totals.

## Technical submission receipt — `yoga_studio.submission_receipts`

| Field | Storage | Rules |
| --- | --- | --- |
| token | TEXT primary key | UUID issued for one creation or add-classes form |
| operation | TEXT NOT NULL | CHECK `create_student` or `add_classes` |
| request_fingerprint | TEXT NOT NULL | SHA-256 of canonical normalized operation input |
| student_id | TEXT NOT NULL FK students(id) | Original result/target; restrictive deletion |

This is technical duplicate-submission protection, not a package assignment model. No separate amount, package id, assignment date or reporting API; balances come exclusively from `students.available_classes`. Retain receipts durably for this feature. One student may have multiple receipts but the application neither reports nor uses their count as a product metric.

Fingerprint canonical JSON arrays: creation `["create_student", trimmedName, trimmedPhone, initialAmountOrZero]`; addition `["add_classes", studentId, amount]`. Keep the original fingerprint immutable after student edits. Same token/fingerprint returns the existing result without writing; token reuse for another input/operation/target conflicts. Always consult an already-committed matching receipt before rejecting a replay against an archived student.

## Transitions and invariants

- Create without initial addition → active student with balance 0.
- Create with amount x → active student with balance x; student and receipt commit together or both roll back.
- Add x to active student → `available_classes = available_classes + x`, x positive integer; receipt and increment commit together. Check total remains representable before commit.
- Serialize additions/edit/archive on the student row. Independent additions both contribute; same-token replays contribute once. Resolve receipt uniqueness races by rolling back then reading the committed receipt, not by swallowing a failed statement inside an aborted transaction.
- Edit changes name/phone only. Archive sets status only; preserves balance and existing registration records. Cancel performs no mutation. Archived details remain readable; new edits/additions are rejected. Repeated archive is an idempotent no-op.
- No assignment entities, history or package metrics. No manual balance reductions/corrections in this feature.

## Future enrollment integration (not implemented by feature 004)

Enrollment to an available place atomically changes enrollment state and deducts 1 from a positive student balance. Removing that assigned enrollment refunds 1 exactly once only if it deducted an access; persisted enrollment state must prove that fact. Waitlisting/removing a waitlisted student changes no balance. FIFO promotion scans for the first positive-balance student, skips others without reordering, and atomically assigns/deducts once. No package provenance is needed.

## Migration and preservation

Under the initializer's existing advisory lock, validate exact v1, add students/receipts with an FK index on receipt student_id, replace schema-version constraint/value with v2, apply private privileges/RLS, validate complete v2, then commit. Fresh initialization produces equivalent v2. Unknown versions/corruption fail closed; repeated/concurrent initialization is safe. Roll back failed upgrades.

No implemented student/package records need conversion. Preserve metadata/classes/registrations and their lock trigger unchanged. Keep `registrations.student_id` as-is: placeholders may not reference students. Do not invent students or infer deductions/refunds from these rows; future enrollment reconciliation must explicitly establish identities and whether an access was deducted before refunding.
