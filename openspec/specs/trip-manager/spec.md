# trip-manager Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

### Requirement: Create a new trip

The system SHALL allow users to create a new trip by providing a name (e.g. "2026 June Japan") and start date. Creating a new trip SHALL set it as the active trip. Card configurations SHALL be carried over unchanged. Expense records from prior trips SHALL remain in history but SHALL NOT count toward the new trip's monthly caps.

#### Scenario: Create trip sets it as active

- **WHEN** user creates a new trip named "2026 June Japan"
- **THEN** that trip SHALL become the active trip
- **THEN** the expense list SHALL be empty for the new trip

#### Scenario: Prior trip expenses not cleared

- **WHEN** user creates a new trip
- **THEN** expenses from the previous trip SHALL remain accessible in trip history

---
### Requirement: Active trip indicator

The system SHALL display the name of the currently active trip on the main screen so the user always knows which trip they are recording expenses for.

#### Scenario: Active trip name shown on home screen

- **WHEN** user opens the app with an active trip
- **THEN** the active trip name SHALL be visible on the home/advisor screen

---
### Requirement: Trip history list

The system SHALL display a list of all trips (completed and active) in reverse chronological order, showing each trip's name, date range, total spend, and estimated total rewards.

#### Scenario: History shows all trips

- **WHEN** user navigates to trip history
- **THEN** all trips including the active one SHALL be listed

#### Scenario: Total spend shown per trip

- **WHEN** a completed trip has 5 expense records summing to NT$32400
- **THEN** the trip entry SHALL display "NT$32,400" as total spend

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