# Project guidance

This repository is for an owner-facing yoga studio management web app. The approved product design is in `docs/superpowers/specs/2026-11-01-yoga-studio-design.md`; consult it before planning or implementing features.

## Product rules

Before planning or implementing features, consult [the ICP and primary user persona](docs/product/icp-and-persona.md). Tailor decisions to the small-studio owner's daily work and phone preference, preserve the document's evidence labels, and surface conflicts with approved requirements before changing behavior. Desired capabilities in the profiles are inputs to feature planning, not claims that those capabilities exist.

- Open on the current week's class schedule. The owner manages classes, capacity, and teacher assignments.
- Maintain teachers, students, and student class packages. Packages grant 1, 5, 10, or a custom positive number of class accesses.
- Assigning a student to an available class place deducts one access. Adding a student to a full class puts them on the waitlist without a deduction.
- Removing an assigned student refunds the access to the package it came from. Removing a waitlisted student does not change their balance.
- When a place opens, automatically scan the waitlist in FIFO order and promote the first student with an available access, deducting one access. Skip students without access; if nobody qualifies, leave the place open.
- Skipped students remain in their original waitlist order. Use the oldest assigned package with access remaining first. Prevent duplicate enrollment in a class.
- There is no e-commerce, checkout, or payment processing.

These rules include the assumptions recorded in the approved design. Preserve data across visits when implementing the app. No application technology or storage approach has been selected yet.
