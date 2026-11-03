# Ideal customer profile and primary user persona

## Purpose and evidence

Use this reference when evaluating features, workflows, and interface choices. It was documented in November 2026 from the project owner's reported conversations and observations of a studio owner; the dates of those conversations and observations are unspecified. This is qualitative evidence about the observed context, not validation of an entire market segment.

Statements below distinguish reported observations, estimates, assumptions, and open questions. These profiles guide decisions; they do not override approved package, enrollment, capacity, or waitlist rules.

## Ideal customer profile (ICP)

The target is a small, owner-operated yoga studio where the owner personally manages daily operations and needs to replace scattered paper records with a reliable shared record of students, classes, and remaining class passes.

| Dimension | Profile and evidence |
| --- | --- |
| Industry | Yoga services. Small, owner-operated yoga studios are the agreed focus; gyms offering yoga are outside the current target. |
| Scale | The observed studio has one location and two teachers. Approximately 15–20 students is a user-provided estimate, not a qualification threshold. |
| Geography | No city or country has been established. A rushed environment is a working-context assumption, not evidence for a geographic market. |
| Technology | The owner prefers a phone or similarly small, easy-to-use device over a laptop, and comfortably browses the web and uses social media. Internet access is reported as reliable. |
| Records | Students carry paper records of remaining class passes. When a paper is missing or lost, the owner must remember the balance. There is no dependable central source of truth. |
| Communication | The owner tells students about classes and changes directly; no clear, standardized channel is currently used. |
| Adoption trigger | The owner needs to see familiar paper information presented faster and more comfortably, with reliable class and student records. This is a reported adoption condition, not evidence of a purchase commitment. |
| Where to find similar users | Small yoga studios are the identified discovery venue; no acquisition channel has been validated. |

The purchasing decision-maker is someone other than the daily user. Their role, budget, motivations, and buying process are deliberately excluded from this round; this ICP is incomplete for sales qualification.

## Primary persona: the hands-on studio owner

This is a role-based persona grounded in the observed owner. No fictional name, age, gender, income, or location is assigned.

**Responsibilities:** create and manage classes, assign teachers, manage student admissions and registrations, track available class passes, and inform students about classes and changes.

**Arrival workflow today:** the owner checks whether an arriving student is registered. Registered students are admitted. For an unregistered student, the owner checks capacity and admits them if there is space. The student's paper provides the remaining pass balance; if it is unavailable, the owner relies on memory. This describes current practice, not a replacement for the app's approved access and enrollment rules.

**Goals and pains:** keep class and student information accurate and immediately available, avoid disagreements with students, and stop depending on papers that students can lose. Communication is another responsibility the owner must handle alongside scheduling and admissions.

**Technology comfort:** familiar with ordinary phone browsing and social media, but not considered tech savvy. Treat this as their first tailored work app, as requested by the project owner; prior digital-tool frustrations have not been recorded. Simple onboarding is a design inference to validate, not an observed onboarding problem.

**Adoption expectations:** show the same useful information as the paper records in a faster, more comfortable form. Complex dashboards, metrics, and advanced filtering are not identified needs.

**Successful first week:** classes proceed without student conflicts, all records are accounted for, no information is lost, and reschedules and cancellations are properly communicated. These are qualitative success criteria; no numerical speed or error targets have been established.

## Implications for product decisions

- Prioritize everyday tasks on a phone: finding a student, checking remaining passes and registration, reviewing capacity, and maintaining records. Use familiar terms and clear, straightforward controls.
- Preserve record integrity and make balances and registration states understandable. Speed must preserve the approved access, refund, and waitlist rules.
- Keep routine information within quick reach. Add complexity only when a demonstrated owner need justifies it.
- Treat durable, centralized records as a core trust requirement. Do not make the owner reconstruct balances from memory.
- Treat reliable internet as the reported operating context. Offline use is not currently an established requirement.

These are product implications of the evidence, not usability-test results or authorization to implement additional features.

## Needs that require future feature planning

**WhatsApp notifications:** the project owner explicitly requires the app to deliver notifications about reschedules, cancellations, and other class-related information through WhatsApp. This extends the original approved design and is not an implemented capability. Students are notification recipients; this does not establish a student-facing app.

Recipients, contact collection, message triggers and content, delivery status, failure handling, integration approach, and costs remain undefined. Resolve them in notification feature planning rather than inferring behavior from this persona.

**Phone access:** the preferred device is a phone, while the current application runs locally on one computer and binds to loopback. Phone-accessible deployment remains a gap requiring separate planning; these profiles do not change hosting or storage.

## Open questions and maintenance

Validate how broadly this profile applies across small yoga studios, confirm the student count, and observe actual phone workflows before claiming usability improvements. Geography, buying criteria, and quantitative success targets remain unknown or outside this round.

Update this reference as new conversations, observations, and usability evidence emerge. Keep estimates and assumptions labeled, and distinguish desired capabilities from implemented behavior using the current product documentation and code.
