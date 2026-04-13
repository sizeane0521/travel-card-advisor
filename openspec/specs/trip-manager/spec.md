# trip-manager Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: trip-end-date-and-expense-date
updated: 2026-04-13
code:
  - src/pages/CalcPage.tsx
  - src/pages/TripsPage.tsx
-->

---
### Requirement: Active trip indicator

The system SHALL display the name of the currently active trip on the main screen so the user always knows which trip they are recording expenses for.

#### Scenario: Active trip name shown on home screen

- **WHEN** user opens the app with an active trip
- **THEN** the active trip name SHALL be visible on the home/advisor screen

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


<!-- @trace
source: trip-end-date-and-expense-date
updated: 2026-04-13
code:
  - src/pages/CalcPage.tsx
  - src/pages/TripsPage.tsx
-->

---
### Requirement: End a trip

The system SHALL allow users to mark a trip as ended by setting its end date to the current date. Ended trips appear in history but cannot have new expenses added.

#### Scenario: Ended trip cannot receive new expenses

- **WHEN** a trip is marked as ended
- **THEN** the system SHALL prevent new expense records from being added to that trip
- **THEN** the system SHALL prompt the user to create a new trip if they try to log an expense

---
### Requirement: Trip-scoped expense isolation

Each expense record SHALL belong to exactly one trip. The card-advisor capability SHALL compute monthly spend totals using only expenses from the active trip that fall within the current calendar month.

#### Scenario: Expenses from other trips excluded from cap calculation

- **WHEN** a card was used for NT$20000 in a previous trip
- **THEN** the current trip's cap calculation for that card SHALL start from NT$0 unless expenses in the same calendar month exist within the current trip

---
### Requirement: Trip data persisted in localStorage

All trip records and their associated expenses SHALL be stored in localStorage under `travel-card-advisor-data` and SHALL persist across browser sessions.

#### Scenario: Trip history survives app restart

- **WHEN** user closes and reopens the app
- **THEN** all trips and their expense records SHALL be restored from localStorage

---
### Requirement: Trip exchange rate setting

The system SHALL allow users to optionally set a fixed exchange rate when creating a new trip (e.g. 1 JPY = 0.22 TWD). The exchange rate SHALL be stored as `exchangeRate: { currency: string; rate: number }` on the `Trip` object. If no exchange rate is set, the trip operates in TWD-only mode.

#### Scenario: Create trip with JPY exchange rate

- **WHEN** user creates a new trip and enters currency "JPY" with rate 0.22
- **THEN** the trip SHALL be saved with `exchangeRate: { currency: "JPY", rate: 0.22 }`
- **THEN** the expense entry form for this trip SHALL switch to foreign currency input mode

#### Scenario: Create trip without exchange rate

- **WHEN** user creates a new trip and leaves the exchange rate field empty
- **THEN** the trip SHALL be saved with no `exchangeRate` field
- **THEN** the expense entry form SHALL operate in TWD-only mode (existing behavior)

#### Scenario: Exchange rate persisted across sessions

- **WHEN** user closes and reopens the app
- **THEN** the trip's exchange rate SHALL be restored from localStorage and the expense form SHALL remain in the correct input mode

<!-- @trace
source: enhance-card-import-and-currency
updated: 2026-04-06
code:
  - src/lib/cardImport.ts
  - src/types/index.ts
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/store/storage.ts
  - src/pages/TripsPage.tsx
-->

---
### Requirement: Delete a trip

The system SHALL allow users to delete a trip and all its associated expense records. A delete button SHALL be present on each trip card in the trip history list. Before deleting, the system SHALL display a confirmation dialog. If the deleted trip was the active trip, `activeTripId` SHALL be set to null, and the 刷卡金 Tab SHALL display its no-active-trip empty state.

#### Scenario: Delete a non-active trip

- **WHEN** user taps the delete button on a completed trip and confirms
- **THEN** the trip SHALL be removed from the trip history list
- **THEN** all expense records belonging to that trip SHALL be deleted
- **THEN** the active trip SHALL remain unchanged

#### Scenario: Delete the active trip

- **WHEN** user taps the delete button on the currently active trip and confirms
- **THEN** the trip SHALL be removed from the trip history list
- **THEN** `activeTripId` SHALL be set to null
- **THEN** the 刷卡金 Tab SHALL display the empty state prompting the user to create a new trip

#### Scenario: Confirm dialog prevents accidental deletion

- **WHEN** user taps the delete button on a trip
- **THEN** a confirmation dialog SHALL appear before any data is removed
- **WHEN** user cancels the confirmation dialog
- **THEN** the trip SHALL NOT be deleted

<!-- @trace
source: ledger-rebrand-and-trip-detail
updated: 2026-04-10
code:
  - src/pages/TripsPage.tsx
  - src/store/useStore.tsx
-->

---
### Requirement: Trip card navigates to detail view

The system SHALL make each trip card in the trip history list tappable. Tapping a trip card SHALL navigate to the trip detail view for that trip. Each trip card SHALL display a visual indicator (e.g. a chevron `›`) on its right side to signal that it is interactive.

#### Scenario: Tap trip card opens detail view

- **WHEN** user taps anywhere on a trip card (excluding action buttons)
- **THEN** the system SHALL display the trip detail view for that trip

#### Scenario: Trip card shows chevron indicator

- **WHEN** the trip history list is displayed
- **THEN** each trip card SHALL show a `›` chevron on the right side of its header row

<!-- @trace
source: ledger-rebrand-and-trip-detail
updated: 2026-04-10
code:
  - src/pages/TripsPage.tsx
  - src/pages/TripDetailPage.tsx
-->

---
### Requirement: Expense date snapped on active trip change

When the active trip changes (i.e., `activeTripId` is updated), the system SHALL validate the current `expenseDate` in CalcPage against the new trip's date range. If `expenseDate` falls outside `[newTrip.startDate, newTrip.endDate ?? today]`, the system SHALL snap it to the nearest boundary:
- If `expenseDate < newTrip.startDate` → snap to `newTrip.startDate`
- If `newTrip.endDate` is set and `expenseDate > newTrip.endDate` → snap to `newTrip.endDate`

The snap SHALL happen automatically without user interaction.

#### Scenario: Date snapped to startDate when too early

- **WHEN** the user switches to Trip B whose `startDate` is "2026-06-01"
- **AND** the current `expenseDate` is "2026-04-15" (before Trip B's start)
- **THEN** `expenseDate` SHALL be set to "2026-06-01"

#### Scenario: Date snapped to endDate when too late

- **WHEN** the user switches to Trip B whose `endDate` is "2026-05-03"
- **AND** the current `expenseDate` is "2026-05-10" (after Trip B's end)
- **THEN** `expenseDate` SHALL be set to "2026-05-03"

#### Scenario: Date unchanged when within trip range

- **WHEN** the user switches to Trip B whose range is "2026-04-28" to "2026-05-03"
- **AND** the current `expenseDate` is "2026-04-30" (within range)
- **THEN** `expenseDate` SHALL remain "2026-04-30"

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
-->

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
code:
  - src/pages/LedgerPage.tsx
  - src/types/index.ts
  - repomix-output.xml
  - src/store/useStore.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->