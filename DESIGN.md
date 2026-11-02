---
name: Yoga Studio
description: An owner-facing studio program for managing the weekly schedule.
colors:
  ink: "#263b46"
  ground: "#f4eee2"
  paper: "#fff"
  clay: "#a64e37"
  clay-deep: "#873d2b"
  link: "#244d4c"
  muted: "#526768"
  line: "#cad3cc"
  divider: "#dce2dc"
  sage: "#e2ebe3"
  amber: "#fff0d9"
  warning-line: "#a45b24"
  error: "#a02d24"
  error-ground: "#fff0e9"
  readonly: "#edf0eb"
typography:
  headline:
    fontFamily: "Georgia, serif"
    fontSize: "42px"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "16px"
  label:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "14px"
    fontWeight: 700
rounded:
  field: "4px"
  button: "5px"
spacing:
  compact: "8px"
  small: "12px"
  medium: "16px"
  large: "24px"
components:
  button-primary:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "11px 16px"
  button-primary-hover:
    backgroundColor: "{colors.clay-deep}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "11px 16px"
  class-card:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.ink}"
    padding: "14px 12px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
---

# Design System: Yoga Studio

## Overview

**Creative North Star: "The Studio Program"**

A calm, practical studio program gives the owner a clear view of the week. A dark ink header and warm ground frame paper-like working surfaces; typography and quiet color provide character while controls remain easy to find.

The interface is an Operate surface: scanability, consistent controls, and clear states guide routine work. Its Spanish copy should remain direct and useful.

**Key Characteristics:**
- Ink header over a warm ground and white working surfaces.
- Day columns and softly colored class entries organize the schedule.
- Serif headings pair with a straightforward sans-serif interface.
- Flat surfaces, fine rules, and clear focus states keep attention on the task.

## Colors

The palette pairs warm paper and dark blue ink with restrained clay and sage accents.

### Primary
- **Studio Clay** (`clay`): primary actions and keyboard focus; darker clay marks hover.

### Neutral
- **Ink** (`ink`): header, main text, and class times.
- **Warm Ground** (`ground`) and **Paper** (`paper`): page background and working surfaces.
- **Muted Sage Ink** (`muted`) and **Deep Green Link** (`link`): supporting text and links.
- **Soft Line** (`line`) and **Divider** (`divider`): container and day boundaries.
- **Sage** (`sage`): ordinary class cards.
- **Amber** (`amber`) and **Warning Line** (`warning-line`): classes without an assigned teacher.
- **Error** (`error`) and **Error Ground** (`error-ground`): validation and alert states.
- **Readonly** (`readonly`): a field whose value cannot be changed.

## Typography

Georgia gives headings an editorial, printed-program quality; Avenir Next and its system fallbacks keep controls and records legible. Main headings use 42px, regular weight, and 1.12 line height; they reduce to 34px on small screens. Body text starts at 16px. Class details and controls use 14px, while class titles use bold 16px. Time values use tabular numerals for scanning.

## Layout

The main area is centered at a maximum width of 1360px with 32px horizontal padding. The schedule uses seven equal day columns and a 500px minimum height. At 1000px and below, the introduction stacks and the calendar uses four columns. At 600px and below, days become a vertical list, horizontal padding becomes 20px, and the primary schedule action occupies its own row. Forms and messages are constrained to 744px. Spacing is compact within entries and more generous between page sections.

## Elevation & Depth

Surfaces are flat, without box shadows. White paper, sage cards, color changes, and fine borders establish grouping and state.

## Shapes

Containers and class cards are square. Buttons have subtly rounded 5px corners and fields use 4px corners. Thin borders define the calendar, form panel, and controls.

## Components

### Buttons and links

Buttons have a minimum height of 46px, semibold 14px text, and 11px by 16px padding. Primary buttons use clay with white text and darken on hover; secondary buttons are transparent with a muted border and a pale hover fill. Links use deep green and a visible underline offset. Keyboard focus uses a 3px clay outline with a 3px offset.

### Schedule and class cards

The calendar is a bordered white surface divided into days. Each day has a bold weekday and a quieter date. Sage class cards show time, title, teacher, capacity, and an edit link; the missing-teacher state changes to amber with an inset warning outline and explicit text. An empty week places a centered message in the calendar, becoming part of the normal flow on small screens.

### Fields and alerts

Form fields are full width, white, bordered, and at least 46px tall, with labels above. Helper and error text sits beneath the field; invalid fields have an error-colored border. Read-only fields use a subdued fill. Alerts use a pale warm background with dark red text.

### Header

A dark ink bar holds the white studio name and a quiet contextual note. The note disappears on narrow screens.

## Do's and Don'ts

### Do:
- **Do** make the current schedule and primary action easy to scan.
- **Do** pair status colors with explicit text, as in the missing-teacher state.
- **Do** preserve visible keyboard focus on interactive controls.

### Don't:
- **Don't** add shadows to ordinary surfaces; use borders and tonal grouping.
- **Don't** rely on color alone to communicate a class or field state.
