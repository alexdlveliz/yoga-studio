# Yoga Studio Constitution

## Core Principles

### I. Owner-Focused Scheduling

The app MUST open on the current week's schedule and provide a clear, readable way for the
owner to manage classes, capacity, and teacher assignments. Classes without an assigned teacher
MUST be highlighted. The owner MUST be able to navigate between weeks.

### II. Persistent Studio Records

The app MUST preserve studio data across visits. It MUST maintain teachers and students, including
identifying and contact information and one nonnegative whole-number available-class balance per
student. Adding a package MUST increase that student's balance by 1, 5, 10, or a custom positive
whole number of class accesses. Separate package assignment records, package counts and package
history are not required; packages are a convenient way to add classes to the student balance.

### III. Accurate Access Accounting

Assigning a student to an available class place MUST atomically deduct one access from that
student's available-class balance. A student MUST have a positive balance to receive a place.
Removing an assigned student MUST return one access to that student's balance only when the
enrollment being removed deducted an access; repeated removal MUST NOT refund twice. Adding a
student to a full class MUST place them on its waitlist without a deduction; removing a waitlisted
student MUST leave balances unchanged. Adding classes MUST atomically increase the selected
student's balance by the requested amount exactly once per submission, including on retry.
Package provenance, oldest-package consumption and source-package refunds are not required.

### IV. Fair Waitlist Promotion

When a place opens, the app MUST scan the waitlist in first-in, first-out order and promote the
first student with a positive available-class balance, atomically deducting one access from
that student’s balance. Students without access MUST be skipped and remain in their original
waitlist order. If no student qualifies, the place MUST remain open.

### V. Enrollment Integrity

The app MUST prevent a student from being enrolled more than once in the same class, including
across assigned and waitlisted positions. Class capacity and nonnegative student balances MUST be
respected when enrollment or promotion changes. Enrollment state and its balance change MUST
commit or fail together; concurrent changes MUST NOT overspend or lose added/refunded classes.

### VI. Spanish User-Facing Information

All information presented to users MUST be in Spanish, including interface text, forms,
instructions, and error messages. Code and specifications MAY remain in English. This ensures
the owner can use the app consistently in Spanish.

## Product Constraints

The product is an owner-facing web app. It MUST NOT include e-commerce, checkout, or payment
processing. Class-access expiration and additional package rules are outside the approved design
until explicitly adopted. Technology and storage choices remain subject to the persistence and
behavioral requirements in this constitution.

## Development Workflow

Feature specifications and implementation plans MUST be checked against the approved product
design and this constitution. Changes affecting enrollment, capacity, student balances or waitlists
MUST include verification of the relevant accounting and promotion behavior, including atomic
class additions, nonnegative balances, refunds, skipped waitlisted students and duplicate
prevention where applicable. Reviews MUST identify constitution conflicts and resolve them before
changes are accepted.

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

### Amendment adopted 2026-11-03: Student-level class balance

The project owner approved replacing package assignment records with one available-class balance
per student because package provenance and assignment counts/history are unnecessary for the
intended studio workflow. This supersedes the oldest-package and same-package refund rules.
FIFO waitlist order, access eligibility, duplicate enrollment prevention and refunds remain.

Migration: no student/package model or accounting has been implemented in the current application,
so there are no package records to convert. Feature 004 MUST add students with zero initial
balance (or the selected initial amount), preserving existing metadata, classes and registration
scaffolding. Existing registration rows MUST NOT cause inferred deductions or refunds. Any future
migration from a system with package balances MUST explicitly preserve each student's total
remaining accesses; original package sizes alone MUST NOT be treated as remaining balances.

**Version**: 2.0.0 | **Ratified**: 2026-11-01 | **Last Amended**: 2026-11-03
