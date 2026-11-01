# Feature Specification: Create Classes

**Feature Branch**: None (no branch configured)

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "I want the user to be able to create classes, a class should have a title, date, time, student limit and teacher (charfield). One of two teachers can be selected for each class: Claudia and Ester."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a scheduled class (Priority: P1)

The owner creates a class by entering its title, date, time and student limit and choosing Claudia or Ester. The saved class appears in the corresponding weekly schedule and remains available on a later visit.

**Why this priority**: Creating visible, durable classes is the core scheduling need.

**Independent Test**: Create a class with valid details for each teacher, view the corresponding week, and reopen the app to verify the saved details.

**Acceptance Scenarios**:

1. **Given** the owner opens class creation, **When** they enter a nonblank title, valid date and time, a positive whole-number student limit and select Claudia, then save, **Then** the class is saved and displayed in the week containing its date with its title, date, time and teacher, and its student limit is available to view.
2. **Given** the owner enters valid class details and selects Ester, **When** they save, **Then** the class is saved with Ester as its teacher.
3. **Given** a saved class, **When** the owner closes and later reopens the app and navigates to its week, **Then** the class and all its saved details remain available.
4. **Given** a class date outside the displayed week, **When** the owner views the week containing that date, **Then** the saved class appears there.

### User Story 2 - Correct invalid or unsaved details (Priority: P2)

The owner receives clear guidance when class details are incomplete or invalid, and can correct them without re-entering the valid details.

**Why this priority**: Clear validation prevents unusable class records and protects the owner's work.

**Independent Test**: Attempt to save with missing and invalid values, correct them, and repeat with an unavailable save operation.

**Acceptance Scenarios**:

1. **Given** any required value is missing, the title contains only whitespace, the date or time is invalid, or the student limit is not a positive whole number, **When** the owner attempts to save, **Then** no class is created, the affected fields are identified in Spanish, and entered values remain available for correction.
2. **Given** a teacher value other than Claudia or Ester, **When** a save is attempted, **Then** the class is not created and the owner is told to select an available teacher.
3. **Given** valid details and an unavailable save operation, **When** the owner attempts to save, **Then** the app reports the failure in Spanish, retains the entered details for retry, and does not claim the class was saved.
4. **Given** the owner has entered class details, **When** they cancel creation, **Then** no class is created.

### Edge Cases

- Dates at month and year boundaries appear in the correct week.
- A title consisting only of spaces is rejected; leading and trailing whitespace is ignored when checking the title.
- Zero, negative and fractional student limits are rejected.
- Multiple classes may have the same title, date, time or teacher; a class is not rejected solely for matching another class.
- An unsuccessful save does not create a class or falsely report success. A retry after a confirmed failure creates only one class.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The owner MUST be able to start and cancel creation of an individual class from the scheduling workflow.
- **FR-002**: Class creation MUST collect a title, date, time, student limit and exactly one teacher, all required.
- **FR-003**: The teacher selection MUST offer exactly the text values Claudia and Ester for new classes, and reject other values.
- **FR-004**: The title MUST contain at least one non-whitespace character; the date and time MUST be valid calendar and clock values; and the student limit MUST be a positive whole number.
- **FR-005**: The app MUST prevent creation when required values are missing or invalid, identify the affected fields, and retain entered values for correction.
- **FR-006**: On a successful save, the app MUST preserve all class details across visits and application restarts and make the class visible in the week containing its date, including its title, date, time and teacher; its student limit MUST be available to view.
- **FR-007**: The app MUST report a save failure without claiming success, retain entered details for retry, and ensure a retry after a confirmed failure does not create duplicates.
- **FR-008**: Canceling creation MUST leave no new class record.
- **FR-009**: All owner-facing labels, instructions, confirmations and error messages for this feature MUST be in Spanish.
- **FR-010**: The app MUST permit classes with matching titles, dates, times or teachers; these matches alone MUST NOT prevent creation.

### Key Entities

- **Class**: An individual scheduled offering with a title, calendar date, time, positive whole-number student limit, and one teacher name selected from Claudia and Ester.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a usability check, at least 90% of participating owners can create a valid class and find it on the appropriate weekly schedule within two minutes without assistance.
- **SC-002**: In acceptance checks, 100% of valid classes created with either teacher display the correct saved details after reopening the app.
- **SC-003**: In acceptance checks, 100% of attempts with missing or invalid required values are blocked and identify the fields needing correction.
- **SC-004**: In simulated save failures, 100% of attempts show a failure message and preserve entered details for retry without reporting a successful save.

## Assumptions

- The owner is the user; dates and times are interpreted in the studio computer's local time. Past and future dates are permitted.
- Each creation produces one class; recurrence, editing, deletion, teacher management and student enrollment are outside this feature. The wider product design continues to govern those later workflows.
- A teacher is required when creating a class in this feature. The wider schedule must still highlight any existing class without a teacher, as required by the constitution.
- The two teacher names are used exactly as supplied; teacher selection records the name as text. The weekly schedule and persistent application foundation are dependencies.
- The student limit is capacity for later enrollment; this feature does not assign students or alter package balances.
