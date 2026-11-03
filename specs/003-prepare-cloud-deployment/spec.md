# Feature Specification: Prepare cloud deployment

**Feature Branch**: `feature/prepare-deployment-environment`
**Created**: 2026-11-03
**Status**: Approved scope for implementation
**Input**: Prepare the existing Spanish app for a public coursework demo on Netlify with persistent Supabase data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the shared demo on a phone (Priority: P1)

A reviewer opens the public HTTPS address, sees the current studio week in Spanish, navigates weeks, creates a fictional class and edits it.

**Why this priority**: Phone access is the owner's reported preference; this demo makes the existing workflows reviewable remotely.
**Independent Test**: Complete the workflow in a phone browser using the provider-supplied domain.

**Acceptance Scenarios**:

1. **Given** the deployed demo, **When** a visitor opens it, **Then** the studio's current week and a Spanish public-demo notice appear without login.
2. **Given** a valid class form, **When** it is saved and edited, **Then** the Spanish schedule shows the new details in the correct week.
3. **Given** an invalid form, **When** submitted, **Then** Spanish field errors appear and input is retained.

### User Story 2 - Trust durable shared records (Priority: P1)

Visitors share fictional records that survive browser changes, application restarts and redeployment.

**Why this priority**: Persistent centralized records are a core product requirement.
**Independent Test**: Save a class, open another browser, restart and redeploy; verify the same record.

**Acceptance Scenarios**:

1. **Given** a saved class, **When** another visitor opens its week after redeployment, **Then** its details persist.
2. **Given** concurrent repeats of one submission, **When** processed, **Then** exactly one class exists.
3. **Given** assigned or waitlisted registrations, **When** capacity is changed, **Then** all changes are refused and existing records remain intact.
4. **Given** unavailable storage, **When** reading or saving, **Then** understandable Spanish errors reveal no credentials and a later retry can recover.

### User Story 3 - Set up and recover a free demo (Priority: P2)

The maintainer follows documented setup, operation and recovery steps without paid services.

**Why this priority**: Reviewers need a reproducible deployment rather than undocumented local state.
**Independent Test**: Follow the setup on fresh free accounts; repeat setup after saving a record, then back up and restore into a separate empty database.

**Acceptance Scenarios**:

1. **Given** a fresh database, **When** explicit setup runs twice, **Then** the database is usable and no existing records are removed.
2. **Given** existing local SQLite files, **When** cloud setup runs, **Then** those files are untouched and not imported.
3. **Given** provider inactivity or quota interruption, **When** following recovery instructions, **Then** the maintainer can identify the interruption and retry safely.

### Edge Cases

- Simultaneous duplicate submissions and registrations added after opening an edit form.
- Studio midnight, week/year boundaries and hosting servers with different timezone defaults.
- Missing configuration, unavailable storage, malformed dates and invalid capacities.
- Repeated or concurrent setup, incompatible schema, and failed setup transactions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Preserve existing Spanish interface, routes, week navigation and class creation/editing over public HTTPS.
- **FR-002**: Persist shared records across visits, restarts and redeployment.
- **FR-003**: Preserve field validation, duplicate submission protection and capacity-change restrictions for any registered class.
- **FR-004**: Provide an explicit repeatable database setup that never deletes existing records; do not import or modify local SQLite files.
- **FR-005**: Keep credentials server-side, outside source control, browser responses and static assets. Visitors access data only through application routes, with no unrestricted database access.
- **FR-006**: Display a Spanish notice that this is a public coursework demo, all visitors can edit shared data, and only fictional data belongs here.
- **FR-007**: Document free setup, environment variables, deployment, limits, inactivity recovery and manual backup/restore.
- **FR-008**: Configure studio locale and timezone explicitly, independent of hosting defaults.
- **FR-009**: Return understandable Spanish storage errors while retaining submitted input and permitting retries.
- **FR-010**: Preserve approved enrollment/accounting rules as constraints; add no enrollment, people, package, notification, authentication or payment features.

### Key Entities

- **Class**: Existing title, calendar date, time, capacity, teacher and submission identity.
- **Registration**: Existing assigned/waitlisted association used by the capacity guard; no new enrollment workflow.
- **Studio configuration**: Explicit locale and timezone governing current week.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer completes week navigation, creation and editing in Spanish on a phone through one public HTTPS address.
- **SC-002**: One saved class retains all fields across a second browser, one restart and one redeployment.
- **SC-003**: Concurrent repeats of the same submission result in exactly one class; assigned and waitlisted capacity-change cases both preserve all records.
- **SC-004**: Two setup runs preserve a previously saved record; invalid submissions and storage failures reveal no credentials.
- **SC-005**: Documented setup uses only free plans and provider domains; behavior, build and deployment smoke checks pass.

## Assumptions

- Coursework demo with fictional records and no production availability requirement; all visitors may edit shared data without login.
- Netlify Functions will host the existing Express/EJS app; Supabase PostgreSQL replaces runtime SQLite. A second SQLite runtime and data import are out of scope.
- Free-tier interruptions and usage limits are acceptable; free operation depends on provider allowances.
- Account creation and publishing are separate actions, not authorized by this implementation.
- Explicit defaults es-GT and America/Guatemala are demo configuration choices, not claims about the persona's geography; maintainers may override both.
- Constitution 1.1.0 and approved design reviewed: this changes deployment/storage only, preserving Spanish, persistence and capacity semantics. Profile evidence labels and future capability claims remain unchanged.
