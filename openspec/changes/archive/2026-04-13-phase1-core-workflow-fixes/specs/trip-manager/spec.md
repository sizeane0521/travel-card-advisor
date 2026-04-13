## ADDED Requirements

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
