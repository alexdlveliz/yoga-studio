# Yoga Studio Constitution

## Core Principles

### I. Owner-Focused Scheduling

The app MUST open on the current week's schedule and provide a clear, readable way for the
owner to manage classes, capacity, and teacher assignments. Classes without an assigned teacher
MUST be highlighted. The owner MUST be able to navigate between weeks.

### II. Persistent Studio Records

The app MUST preserve studio data across visits. It MUST maintain teachers, students, and student
class packages, including identifying and contact information and each package's class balance.
Packages MUST grant 1, 5, 10, or a custom positive number of class accesses.

### III. Accurate Access Accounting

Assigning a student to an available class place MUST deduct one access from the oldest assigned
package with access remaining. A student MUST have an available access to receive a place.
Removing an assigned student MUST refund that access to the same package. Adding a student to a
full class MUST place them on its waitlist without a deduction; removing a waitlisted student MUST
leave balances unchanged.

### IV. Fair Waitlist Promotion

When a place opens, the app MUST scan the waitlist in first-in, first-out order and promote the
first student with an available access, deducting one access. Students without access MUST be
skipped and remain in their original waitlist order. If no student qualifies, the place MUST remain
open.

### V. Enrollment Integrity

The app MUST prevent a student from being enrolled more than once in the same class, including
across assigned and waitlisted positions. Class capacity and access balances MUST be respected
when enrollment or promotion changes.

### VI. Spanish User-Facing Information

All information presented to users MUST be in Spanish, including interface text, forms,
instructions, and error messages. Code and specifications MAY remain in English. This ensures
the owner can use the app consistently in Spanish.

## Product Constraints

The product is an owner-facing web app. It MUST NOT include e-commerce, checkout, or payment
processing. Package expiration and additional package rules are outside the approved design until
explicitly adopted. Technology and storage choices remain open, subject to the persistence and
behavioral requirements in this constitution.

## Development Workflow

Feature specifications and implementation plans MUST be checked against the approved product
design and this constitution. Changes affecting enrollment, capacity, packages, or waitlists MUST
include verification of the relevant accounting and promotion behavior, including refunds,
skipped waitlisted students, and duplicate prevention where applicable. Reviews MUST identify
constitution conflicts and resolve them before changes are accepted.

## Governance

This constitution governs project development alongside the approved product design and project
guidance. A proposed amendment MUST document its rationale and effects, receive project owner
approval, and include a migration plan when existing behavior or data must change. Reviewers MUST
check applicable work for compliance and document any required amendment before accepting a
conflicting change.

Constitution versions use semantic versioning: increment MAJOR for backward-incompatible
principle removals or redefinitions, MINOR for new principles or materially expanded guidance, and
PATCH for clarifications and other non-semantic corrections. Preserve the original ratification
date and update the last-amended date when an amendment is adopted.

**Version**: 1.1.0 | **Ratified**: 2026-11-01 | **Last Amended**: 2026-11-01
