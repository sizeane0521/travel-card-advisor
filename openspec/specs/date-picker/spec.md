# date-picker Specification

## Purpose

Define the custom DatePicker component that replaces native `<input type="date">` elements across the application, providing a consistent popover calendar UI that matches the dark gold design theme and works on both mobile and desktop.

## Requirements

### Requirement: DatePicker component renders a styled text input that opens a popover calendar

The system SHALL provide a `DatePicker` React component that replaces native `<input type="date">` elements. The component SHALL accept the following props: `value` (string in YYYY-MM-DD format or empty string), `onChange` (callback receiving a YYYY-MM-DD string), optional `min` (YYYY-MM-DD), optional `max` (YYYY-MM-DD), optional `className`, and optional `style`.

The component SHALL render a text input displaying the selected date in a human-readable format. Clicking anywhere on the input field SHALL open a popover calendar. The input SHALL NOT require the user to click a specific icon to trigger the calendar.

#### Scenario: Clicking anywhere on the input opens the calendar

- **WHEN** user clicks anywhere on the DatePicker input field
- **THEN** a popover calendar SHALL appear near the input
- **THEN** the calendar SHALL display the month containing the currently selected date, or the current month if no date is selected

#### Scenario: Selecting a date closes the calendar and updates the value

- **WHEN** user clicks a valid (non-disabled) date in the calendar
- **THEN** the calendar SHALL close
- **THEN** `onChange` SHALL be called with the selected date in YYYY-MM-DD format
- **THEN** the input field SHALL display the newly selected date


<!-- @trace
source: custom-date-picker
updated: 2026-04-19
code:
  - src/pages/CalcPage.tsx
  - src/components/DatePicker.tsx
  - src/store/useStore.tsx
  - src/components/CardForm.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/TripsPage.tsx
-->

---
### Requirement: DatePicker calendar displays a navigable month grid

The calendar popover SHALL display a month view with:
- A header showing the current month and year (zh-TW locale)
- Previous and next month navigation buttons
- A 7-column day-of-week header row (zh-TW short weekday names)
- A grid of date cells (up to 6 rows × 7 columns) covering the full month

The currently selected date cell SHALL be visually highlighted with a filled background. Today's date (if not selected) SHALL be indicated with a border outline. Dates outside the current month SHALL be rendered as filler cells (dimmed or empty).

#### Scenario: Month navigation works correctly

- **WHEN** user clicks the previous month button
- **THEN** the calendar SHALL display the previous month's grid
- **WHEN** user clicks the next month button
- **THEN** the calendar SHALL display the next month's grid

#### Scenario: Selected date is highlighted in the calendar

- **WHEN** the DatePicker has a value of "2026-04-15"
- **AND** the calendar is opened
- **THEN** the cell for April 15 SHALL be rendered with a filled gold background (`#d4a017`)


<!-- @trace
source: custom-date-picker
updated: 2026-04-19
code:
  - src/pages/CalcPage.tsx
  - src/components/DatePicker.tsx
  - src/store/useStore.tsx
  - src/components/CardForm.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/TripsPage.tsx
-->

---
### Requirement: DatePicker enforces min and max date constraints

When `min` and/or `max` props are provided, dates outside the allowed range SHALL be rendered as disabled in the calendar grid. Clicking a disabled date SHALL have no effect. Navigation SHALL still allow the user to browse outside the range, but disabled dates SHALL be non-interactive.

#### Scenario: Dates before min are disabled

- **WHEN** `min` is set to "2026-04-14"
- **THEN** all date cells before April 14 SHALL be rendered in a disabled style and SHALL NOT call `onChange` when clicked

#### Scenario: Dates after max are disabled

- **WHEN** `max` is set to "2026-04-17"
- **THEN** all date cells after April 17 SHALL be rendered in a disabled style and SHALL NOT call `onChange` when clicked


<!-- @trace
source: custom-date-picker
updated: 2026-04-19
code:
  - src/pages/CalcPage.tsx
  - src/components/DatePicker.tsx
  - src/store/useStore.tsx
  - src/components/CardForm.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/TripsPage.tsx
-->

---
### Requirement: DatePicker calendar closes when clicking outside

The calendar popover SHALL close when the user clicks or taps anywhere outside the DatePicker component boundaries.

#### Scenario: Click outside closes the calendar

- **WHEN** the calendar popover is open
- **AND** user clicks outside the DatePicker component
- **THEN** the calendar SHALL close without changing the selected value


<!-- @trace
source: custom-date-picker
updated: 2026-04-19
code:
  - src/pages/CalcPage.tsx
  - src/components/DatePicker.tsx
  - src/store/useStore.tsx
  - src/components/CardForm.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/TripsPage.tsx
-->

---
### Requirement: DatePicker replaces all native date inputs in the application

The `DatePicker` component SHALL be used in place of `<input type="date">` in all five locations: `CalcPage` (expense date), `LedgerPage` (inline edit date), `TripsPage` (trip start date and trip end date), and `CardForm` (card validFrom and validTo).

#### Scenario: DatePicker used in CalcPage

- **WHEN** user is on the CalcPage expense form
- **THEN** the 消費日期 field SHALL use the DatePicker component with `min` set to `activeTrip.startDate` and `max` set to today

#### Scenario: DatePicker used in LedgerPage inline edit

- **WHEN** user is editing an expense inline in LedgerPage
- **THEN** the date field SHALL use the DatePicker component with `min` set to `activeTrip.startDate` and `max` set to `activeTrip.endDate ?? today`

#### Scenario: DatePicker used in TripsPage

- **WHEN** user is creating or editing a trip in TripsPage
- **THEN** both 開始日期 and 結束日期 fields SHALL use the DatePicker component; 結束日期 SHALL have `min` set to the trip's startDate

#### Scenario: DatePicker used in CardForm

- **WHEN** user is editing card validFrom or validTo in CardForm
- **THEN** both fields SHALL use the DatePicker component

<!-- @trace
source: custom-date-picker
updated: 2026-04-19
code:
  - src/components/DatePicker.tsx
  - src/pages/CalcPage.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/TripsPage.tsx
  - src/components/CardForm.tsx
-->

<!-- @trace
source: custom-date-picker
updated: 2026-04-19
code:
  - src/pages/CalcPage.tsx
  - src/components/DatePicker.tsx
  - src/store/useStore.tsx
  - src/components/CardForm.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/TripsPage.tsx
-->