# Feature Specification: Manage students and available classes

**Feature Branch**: `feature/create-students`

**Created**: 2026-11-03

**Status**: Draft

**Input**: Create, view, edit and archive students with required name and phone in fewer than three steps. Optionally add 1, 5, 10 or a custom positive whole number of available classes during creation or later. The owner explicitly approved one student-level balance instead of package assignment records; package counts, issuance totals and assignment history are unnecessary.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and find a student (Priority: P1)

The owner records a student's name and phone on a phone-sized screen and finds their saved details and available classes without relying on paper.

**Why this priority**: Dependable student records and balances support the owner's daily work.

**Independent Test**: Create a student without an initial class addition, reopen the app and find their saved details and zero available classes by name.

**Acceptance Scenarios**:

1. **Given** the student list, **When** the owner opens creation, enters a name and phone and saves, **Then** the student is available with both details and zero available classes, and success is confirmed within two screens or dialogs.
2. **Given** saved students, **When** the owner searches by all or part of a name, **Then** matching active students are shown and their details can be opened; clearing search shows all active students.
3. **Given** either required field is blank or whitespace-only, **When** saving, **Then** no student is created, Spanish field feedback identifies the issue and entered values remain available.
4. **Given** a student was saved, **When** the app is reopened after a restart, **Then** the same details and balance are available.
5. **Given** two students share a name or phone number, **When** the second record is created, **Then** both remain separate records with independent balances.

---

### User Story 2 - Add and review available classes (Priority: P1)

The owner adds classes when creating a student or at any later time and sees one current available-class balance.

**Why this priority**: This establishes the student balance needed to replace unreliable paper pass records, without unnecessary package tracking.

**Independent Test**: Create a student with 5 classes, add 1, 5, 10 and custom 7, then reopen the app and verify 28 available classes under the correct student.

**Acceptance Scenarios**:

1. **Given** student creation, **When** the owner optionally chooses an initial class amount and saves valid details, **Then** the student and initial balance are saved together; omitting the addition creates a zero balance. A failed save leaves neither a partial student nor a partial balance change.
2. **Given** an active student with 3 available classes, **When** the owner adds 1, 5, 10 or a custom positive whole number, **Then** the requested amount is added to the existing balance and the new total is shown within two screens or dialogs.
3. **Given** a student with 5 available classes, **When** the owner intentionally adds another 5 in a new action, **Then** the balance becomes 10 without requiring package records or history.
4. **Given** a missing custom count, zero, negative, fractional or nonnumeric count, **When** saving, **Then** the balance stays unchanged and Spanish feedback allows correction without losing entered values.
5. **Given** a saved student, **When** their details are viewed, **Then** the current available-class balance is clearly shown, including zero; no package count, issuance total or assignment history is required.
6. **Given** a class-addition submission is repeated while pending or retried after a lost response, **When** saving finishes, **Then** its amount is added exactly once; a later intentional addition of the same amount remains possible.
7. **Given** a valid student creation, edit, archive or class-addition form, **When** the owner submits it, **Then** its submit button immediately displays a Spanish loading state and prevents repeated activation while pending. If validation or saving fails, the button becomes usable again and entered values remain available for correction or retry.
8. **Given** two different valid additions to the same active student occur concurrently, **When** both succeed, **Then** the final balance includes both amounts without a lost update.

---

### User Story 3 - Correct and archive students (Priority: P2)

The owner corrects student details and removes inactive students from the active list without losing their records or available classes.

**Why this priority**: Maintaining accurate records supports daily work while preserving balances.

**Independent Test**: Edit one of two students, then archive that student and verify their preserved details and balance.

**Acceptance Scenarios**:

1. **Given** an active student, **When** the owner opens their prefilled edit form, changes valid details and saves, **Then** the same record is updated within two screens or dialogs, persists after restarting and retains its balance; other students are unchanged.
2. **Given** editing, **When** a required field is blank, **Then** the saved record stays unchanged and feedback and entered values allow correction.
3. **Given** an active student, **When** the owner requests removal and confirms archiving, **Then** the student leaves the active list within two screens or dialogs while their details and balance remain accessible for review.
4. **Given** editing or archive confirmation, **When** the owner cancels, **Then** saved details, active status and balance stay unchanged.

### Edge Cases

- An empty student list and a search with no matches show clear Spanish guidance.
- Shared names and phone numbers do not merge records; actions apply to the selected record.
- Common phone formatting, including an international prefix, spaces, parentheses and hyphens, is accepted without assuming a country or claiming verification.
- Failed saves explain the failure in Spanish, retain entered values for retry and do not report success or leave partial student/balance changes.
- Archived details and balances remain viewable but cannot be edited or receive new classes; restoration and permanent deletion are deferred.
- Concurrent archive and addition produce a consistent result: an addition committed first is preserved; a new addition attempted after archiving is rejected without changing the balance.
- Long names and phone values remain readable and usable on phone-sized screens. Zero balance is a valid, clearly displayed state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The owner MUST be able to create students using a form with required name and phone number, each containing at least one non-whitespace character.
- **FR-002**: The app MUST provide an active student list, partial-name search and access to each student's details and available classes; empty and no-match states MUST be explained.
- **FR-003**: The owner MUST be able to edit an active student's name and phone using a prefilled form without changing their identity, available classes or other student records.
- **FR-004**: The owner MUST be able to archive a student through an explicitly confirmed removal action. Archiving MUST hide the student from active lists and preserve their details and available classes for review.
- **FR-005**: Each creation, edit, archive or class-addition workflow MUST require at most two screens or dialogs from starting that action through confirmation, including any confirmation dialog. Field entry, scrolling and validation correction within the same form do not constitute extra steps; a separate success screen does.
- **FR-006**: The owner MUST be able to optionally add classes during creation and add classes to any existing active student at any time. Creation without an initial addition MUST start at zero available classes.
- **FR-007**: Class-addition choices MUST include 1, 5, 10 and a custom positive whole number; invalid custom counts MUST be rejected with field feedback.
- **FR-008**: Each student MUST have one nonnegative whole-number available-class balance. Adding classes MUST atomically increase that balance by the selected amount. Student creation with an optional initial addition MUST succeed or fail as a whole. Concurrent successful additions MUST all be reflected in the balance.
- **FR-009**: Student details, archive status and available classes MUST survive subsequent visits and application restarts.
- **FR-010**: Student details MUST clearly show the current available-class balance. A separate package assignment model, assignment history, assignment dates, package counts and issuance totals MUST NOT be required for this feature.
- **FR-011**: Validation and save failures MUST provide Spanish feedback and retain entered values. Cancellation MUST leave saved records unchanged. Repeated or retried submissions MUST NOT create duplicate students or add the same classes twice; a later intentional addition of the same amount MUST remain possible.
- **FR-012**: Shared names and phone numbers MUST be allowed without merging records. Common phone formatting MUST be accepted without country-specific assumptions or verification claims.
- **FR-013**: All user-facing information MUST be Spanish, and all specified workflows MUST be usable on phone-sized screens without horizontal scrolling to reach essential fields or actions.
- **FR-014**: The app MUST continue opening on the current week's schedule while providing access to student management.
- **FR-015**: During student creation, editing, archiving and class-addition submissions, the submit button MUST immediately display a Spanish loading state and prevent repeated activation while pending. Validation or save failures MUST restore the button to a usable state and retain entered values for correction or retry. This frontend guard MUST complement FR-011's duplicate-submission protection.

### Key Entities *(include if feature involves data)*

- **Student**: An individual studio attendee with a name, phone number, active or archived status and one nonnegative whole-number available-class balance. This is not an application login account.
- **Class-addition choice**: A selection of 1, 5, 10 or a custom positive whole number used to increase a student's balance. It is an action input, not a separately maintained package entity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a phone usability acceptance session, the owner can create a student and separately add a standard amount of classes in no more than 60 seconds each, without assistance.
- **SC-002**: All four management actions—creation, editing, archiving and adding classes—complete in at most two screens or dialogs during valid-input acceptance checks.
- **SC-003**: In persistence acceptance checks, 100% of saved student details and available-class balances are available under the correct student after reopening and restarting the app, including archived records.
- **SC-004**: Every accepted initial or later class addition produces the expected student balance, including concurrent additions and retries, without consulting a package assignment record.
- **SC-005**: After completing creation and adding classes without assistance, the owner confirms they understood the required information, could identify success and could find the current available classes. Any confusion is recorded as a usability issue before acceptance.

## Assumptions

- On 2026-11-03 the owner explicitly replaced package assignment records with one student-level available-class balance. Package provenance, assignment counts/history, oldest-package deductions and same-package refunds are no longer required. Removal still means archiving.
- The [ICP and persona](../../docs/product/icp-and-persona.md) report a phone preference and unreliable paper pass records. The estimated 15–20 students is not a limit; the evidence is qualitative and does not validate the whole market. This feature establishes balances but does not yet replace paper usage tracking during class attendance.
- Required phone collection follows the user's decision. Future WhatsApp notifications are a desired capability, not included or enabled by recording a number.
- The 60-second usability target is proposed for acceptance, not an observed persona result. Name search and permissive phone formatting are agreed-plan defaults.
- Addition sizes follow the amended [approved design](../../docs/superpowers/specs/2026-11-01-yoga-studio-design.md) and [constitution v2.0.0](../../.specify/memory/constitution.md).
- Enrollment, attendance, deductions, refunds, waitlist promotion, expiration, payments, notifications, imports, manual balance reductions/corrections and student restoration are outside this feature. Later enrollment work MUST atomically deduct one from the student balance for a place, refund once only for an enrollment that deducted an access, and preserve FIFO promotion, skipped-student order and duplicate prevention. No package-source tracking is needed.
- Existing hosting/access and the schedule opening view remain unchanged. No authentication or student-facing account is introduced. Existing class/registration scaffolding is preserved without inferred retroactive balance changes.
