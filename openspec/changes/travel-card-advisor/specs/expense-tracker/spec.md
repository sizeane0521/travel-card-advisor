## ADDED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering: amount (NTD, positive integer), selecting a card, and optionally selecting a store. The expense SHALL be timestamped with the current date and saved to the active trip.

#### Scenario: Log expense with store

- **WHEN** user enters NT$1200, selects "Cube Card", selects "Don Quijote", and confirms
- **THEN** an expense record SHALL be created under the active trip with amount 1200, cardId "cube", store "Don Quijote", and today's date

#### Scenario: Log general expense without store

- **WHEN** user enters NT$800, selects "Line Bank", and leaves store as "General Purchase"
- **THEN** an expense record SHALL be created with store field set to null or "general"

#### Scenario: Amount must be positive

- **WHEN** user enters 0 or a negative number as the amount
- **THEN** the system SHALL prevent saving and display a validation error

### Requirement: Reward estimation on save

After saving an expense, the system SHALL display an estimated reward amount calculated as: `expense amount × effective rate` for the chosen card and store at the time of logging.

#### Scenario: Show reward estimate after logging

- **WHEN** user logs NT$2000 to a card with 3% base rate and no store bonus
- **THEN** the system SHALL display "Estimated reward: NT$60"

#### Scenario: Reward capped at remaining cap

- **WHEN** a card's remaining reward cap is NT$50 and the user logs NT$3000 at 3% (which would yield NT$90)
- **THEN** the displayed estimate SHALL be NT$50 (capped, not NT$90)

### Requirement: Monthly spend accumulation

The system SHALL aggregate all expense amounts per card per calendar month and expose the total as the card's "current month spend" for use by the card-advisor capability.

#### Scenario: Monthly total updates after logging

- **WHEN** user logs a new expense of NT$500 to Card A
- **THEN** Card A's current month total SHALL increase by NT$500

#### Scenario: Expenses from different months not aggregated

- **WHEN** Card A has NT$10000 logged in June and NT$5000 in July
- **THEN** Card A's July monthly total SHALL be NT$5000, not NT$15000

### Requirement: Expense list view

The system SHALL display a chronological list of all expenses within the active trip, showing date, store, card name, amount, and estimated reward for each entry.

#### Scenario: Expense list shows all active trip entries

- **WHEN** user navigates to the expense list
- **THEN** all expenses belonging to the active trip SHALL be displayed in reverse chronological order

### Requirement: Delete expense

The system SHALL allow users to delete any individual expense record from the active trip. Deletion SHALL immediately update the monthly spend totals and card recommendations.

#### Scenario: Delete expense updates totals

- **WHEN** user deletes an expense of NT$1200 from Card A
- **THEN** Card A's current month total SHALL decrease by NT$1200
- **THEN** the card recommendation list SHALL recalculate and update
