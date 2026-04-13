## MODIFIED Requirements

### Requirement: Create a new trip

The system SHALL allow users to create a new trip by providing a name (e.g. "2026 June Japan"), a start date, and an optional end date. Creating a new trip SHALL set it as the active trip. Card configurations SHALL be carried over unchanged. Expense records from prior trips SHALL remain in history but SHALL NOT count toward the new trip's monthly caps.

The end date field SHALL be optional. When provided, the end date SHALL be stored as `Trip.endDate`. When omitted, `Trip.endDate` SHALL be set to null (existing behavior).

#### Scenario: Create trip sets it as active

- **WHEN** user creates a new trip named "2026 June Japan"
- **THEN** that trip SHALL become the active trip
- **THEN** the expense list SHALL be empty for the new trip

#### Scenario: Prior trip expenses not cleared

- **WHEN** user creates a new trip
- **THEN** expenses from the previous trip SHALL remain accessible in trip history

#### Scenario: Create trip with end date

- **WHEN** user fills in start date "2026-04-28" and end date "2026-05-03" and submits
- **THEN** the trip SHALL be saved with `startDate: "2026-04-28"` and `endDate: "2026-05-03"`

#### Scenario: Create trip without end date

- **WHEN** user leaves the end date field empty and submits
- **THEN** the trip SHALL be saved with `endDate: null`

---

### Requirement: Trip history list

The system SHALL display a list of all trips (completed and active) in reverse chronological order, showing each trip's name, date range, total spend, and estimated total rewards.

When a trip has both `startDate` and `endDate`, the date range SHALL be displayed as `{startDate} — {endDate}`. When a trip has only `startDate` (i.e., `endDate` is null), the date range SHALL display only the start date (e.g., `2026-04-06`).

#### Scenario: History shows all trips

- **WHEN** user navigates to trip history
- **THEN** all trips including the active one SHALL be listed

#### Scenario: Total spend shown per trip

- **WHEN** a completed trip has 5 expense records summing to NT$32400
- **THEN** the trip entry SHALL display "NT$32,400" as total spend

#### Scenario: Trip card shows full date range when end date is set

- **WHEN** a trip has `startDate: "2026-04-28"` and `endDate: "2026-05-03"`
- **THEN** the trip card SHALL display "2026-04-28 — 2026-05-03"

#### Scenario: Trip card shows only start date when end date is null

- **WHEN** a trip has `startDate: "2026-04-06"` and `endDate: null`
- **THEN** the trip card SHALL display "2026-04-06" with no end date portion
