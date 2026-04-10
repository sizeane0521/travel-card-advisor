## ADDED Requirements

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

---

### Requirement: Trip card navigates to detail view

The system SHALL make each trip card in the trip history list tappable. Tapping a trip card SHALL navigate to the trip detail view for that trip. Each trip card SHALL display a visual indicator (e.g. a chevron `›`) on its right side to signal that it is interactive.

#### Scenario: Tap trip card opens detail view

- **WHEN** user taps anywhere on a trip card (excluding action buttons)
- **THEN** the system SHALL display the trip detail view for that trip

#### Scenario: Trip card shows chevron indicator

- **WHEN** the trip history list is displayed
- **THEN** each trip card SHALL show a `›` chevron on the right side of its header row
