## MODIFIED Requirements

### Requirement: End a trip

The system SHALL allow users to mark a trip as ended by setting its end date to the current date. Ended trips appear in history but cannot have new expenses added.

A trip is considered ended if and only if its `endDate` is set AND `endDate <= today`. A trip with `endDate` set to a future date SHALL be treated as an active in-progress trip — it SHALL accept new expenses and SHALL NOT display the ended state.

The `isEnded` flag in `TripsPage` SHALL be computed as `!!trip.endDate && trip.endDate <= todayStr()`. The CalcPage locked screen SHALL only render when `activeTrip.endDate && activeTrip.endDate <= todayStr()`.

#### Scenario: Ended trip cannot receive new expenses

- **WHEN** a trip is marked as ended (end date set to today via "結束旅程" button)
- **THEN** the system SHALL prevent new expense records from being added to that trip
- **THEN** the system SHALL prompt the user to create a new trip if they try to log an expense

#### Scenario: Future end date does not lock the trip

- **WHEN** a trip is created with `startDate: "2026-04-13"` and `endDate: "2026-04-17"` (a future date)
- **AND** today is "2026-04-13"
- **THEN** the trip SHALL be treated as active
- **THEN** the CalcPage SHALL NOT show the locked screen
- **THEN** the trip card SHALL NOT display the "已結束" badge

#### Scenario: Past end date locks the trip

- **WHEN** a trip has `endDate: "2026-04-12"` and today is "2026-04-13"
- **THEN** the trip SHALL be treated as ended
- **THEN** the CalcPage SHALL show the locked screen "此旅程已結束，無法新增消費"
- **THEN** the trip card SHALL display the "已結束" badge

#### Scenario: Both active and ended badges not shown simultaneously

- **WHEN** a trip is the active trip AND has a future `endDate`
- **THEN** the trip card SHALL display the "◆ 進行中" badge only
- **THEN** the "已結束" badge SHALL NOT be displayed
