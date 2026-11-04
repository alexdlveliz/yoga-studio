# Yoga studio management app

## Purpose

Replace paper records with a clear, easy way for the studio owner to manage the class schedule, teachers, students, and each student’s available classes.

## Daily view

Open on the current week's schedule. Show each class's name, date, time, and assigned teacher. Allow the owner to navigate between weeks, add and edit classes, and assign or change the teacher. Highlight a class that has no teacher assigned. The weekly schedule mockup is a visual exploration, with sample data rather than real studio information.

## People and available classes

Maintain a list of teachers and a list of students, with basic identifying and contact information. Each student has one nonnegative whole-number available-class balance. The owner can add 1, 5, 10, or a custom positive whole number of classes at student creation or later. A package is only a convenient choice of how many classes to add; no separate package assignment model, package counts, issuance totals or assignment history is needed. Show the student's current available classes.

Creating a student without an initial addition starts the balance at zero. Creating a student with an initial addition succeeds or fails as a whole. Later additions atomically increase the existing balance; retries of the same submission must not add classes twice. Editing details and archiving preserve the balance. Archived students remain reviewable but cannot receive new class additions; restoration and permanent deletion are outside the current feature.

## Enrollment and class access

Each class has a student capacity. The owner can add students when creating or managing a class. Assigning a student to an available place atomically deducts one from that student's available-class balance, provided it is positive. When the class is full, adding a student places them on the waitlist without deducting an access.

Removing an assigned student refunds one access to that student’s balance only if that enrollment deducted an access. Repeating the removal must not refund twice. When a place becomes available, the app checks the waitlist in first-in, first-out order and automatically assigns the first student with an available class access, deducting one access at that point. Students without an available access are skipped; if nobody has one, the place stays open. Removing a waitlisted student does not affect their balance.

Working assumptions: skipped students remain on the waitlist in their original order. A student needs an available class access before being assigned to a place. All additions, deductions and refunds use the same student balance. Enrollment state and balance changes commit together, and concurrent operations must not produce a negative balance or lose changes. The app prevents duplicate enrollment in the same class. Access expiration and other rules can be added when the studio's needs are clearer.

## Scope and implementation choices

This is an owner-facing web app. It has no e-commerce, checkout, or payment processing. The current application uses Express/EJS and PostgreSQL with local and Netlify deployment support. Student balances and enrollment accounting described here are requirements, not claims of implemented functionality. Data must persist across visits. A simple, readable interface and quick access to the current week's schedule are priorities.

## Approved amendment — 2026-11-03

The project owner explicitly approved student-level available classes in place of package records. This replaces the original package-history, oldest-package and source-package refund assumptions; the revised constitution is version 2.0.0. There are no implemented student/package records to convert. The student feature adds and displays balances; actual enrollment deductions, refunds and waitlist promotion remain for enrollment implementation. Preserve existing class/registration data without retroactive accounting. Technical retry protection may retain submission identifiers; it does not establish a package history requirement.
