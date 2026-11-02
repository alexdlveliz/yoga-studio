# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The studio owner uses the app to manage the studio's schedule and records. The app is for the owner, not for students to use directly.

## Product Purpose

Replace paper records with an easy-to-use way to manage classes, teachers, students, and class packages. The owner should be able to find the current week's schedule quickly and use straightforward controls to complete everyday tasks.

## Operating Context

The app opens on the current week's class schedule, with navigation between weeks. Classes show their name, date, time, and assigned teacher; a class without a teacher is highlighted. Dates and times follow the studio computer's local time.

The current implementation runs locally on one computer and stores data in a persistent SQLite database. The interface is in Spanish.

## Capabilities and Constraints

- The owner manages classes, capacity, and teacher assignments, and maintains teacher and student contact information.
- Student packages provide 1, 5, 10, or a custom positive number of class accesses. Student records show packages and balances.
- Assigning a student to an available place consumes one access from their oldest assigned package with access remaining. A full class places the student on a FIFO waitlist without deducting an access.
- Removing an assigned student refunds the same package. When a place opens, the first waitlisted student with an available access is promoted and charged one access. Skipped students retain their order; if none qualifies, the place remains open. Removing a waitlisted student does not change their balance.
- A student cannot enroll twice in the same class. Package expiration and additional package rules remain undecided.
- Data must persist across visits. There is no e-commerce, checkout, or payment processing.
- The existing app supports the weekly schedule and class creation and editing. Teacher and student management, packages, and enrollment remain future work.

## Evidence on Hand

The approved product design is in `docs/superpowers/specs/2026-11-01-yoga-studio-design.md`. Its schedule mockup is a visual exploration with sample data, not real studio information. The current application and setup are documented in `README.md`.

## Product Principles

- Put the current week's schedule within immediate reach.
- Make routine owner tasks easy to understand and complete with straightforward controls.
- Keep class places, waitlist order, and package balances consistent and reliable.
- Preserve studio records across visits.
