# Yoga studio management app

## Purpose

Replace paper records with a clear, easy way for the studio owner to manage the class schedule, teachers, students, and student class packages.

## Daily view

Open on the current week's schedule. Show each class's name, date, time, and assigned teacher. Allow the owner to navigate between weeks, add and edit classes, and assign or change the teacher. Highlight a class that has no teacher assigned. The weekly schedule mockup is a visual exploration, with sample data rather than real studio information.

## People and packages

Maintain a list of teachers and a list of students, with basic identifying and contact information. The owner can assign a class package to a student with 1, 5, 10, or a custom positive number of classes. Show each student's assigned packages and class balances.

## Enrollment and class access

Each class has a student capacity. The owner can add students when creating or managing a class. Assigning a student to an available place deducts one class access from that student's package. When the class is full, adding a student places them on the waitlist without deducting an access.

Removing an assigned student refunds the access that was deducted. When a place becomes available, the app checks the waitlist in first-in, first-out order and automatically assigns the first student with an available class access, deducting one access at that point. Students without an available access are skipped; if nobody has one, the place stays open. Removing a waitlisted student does not affect their balance.

Working assumptions: skipped students remain on the waitlist in their original order. A student needs an available class access before being assigned to a place. If a student has multiple packages with access remaining, the oldest assigned package is used first, and a refund returns to that same package. The app prevents duplicate enrollment in the same class. Package expiration and other rules can be added when the studio's needs are clearer.

## Scope and implementation choices

This is an owner-facing web app. It has no e-commerce, checkout, or payment processing. The project has no application code yet, so the technology and storage approach remain implementation choices. Data must persist across visits. A simple, readable interface and quick access to the current week's schedule are priorities.
