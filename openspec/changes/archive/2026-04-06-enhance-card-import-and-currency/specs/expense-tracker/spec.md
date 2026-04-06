## MODIFIED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering an amount, selecting a card, and optionally selecting a store. The expense SHALL be timestamped with the current date and saved to the active trip.

When the active trip has an `exchangeRate` set (e.g. `{ currency: "JPY", rate: 0.22 }`):
- The expense entry form SHALL display a foreign currency input field (e.g. "金額（JPY）")
- The system SHALL convert the entered foreign amount to TWD by multiplying by the trip's exchange rate and rounding down to the nearest integer
- The converted TWD amount SHALL be stored in `Expense.amount` and used for all reward calculations
- The original foreign amount SHALL be stored in `Expense.foreignAmount: { currency: string; amount: number }`
- Both the foreign amount and the TWD equivalent SHALL be displayed in the expense list entry

When the active trip has no `exchangeRate`:
- The expense entry form SHALL display a TWD amount field (existing behavior)
- `Expense.foreignAmount` SHALL not be set

#### Scenario: Log expense in JPY with exchange rate

- **WHEN** the active trip has `exchangeRate: { currency: "JPY", rate: 0.22 }` and user enters ¥5000, selects a card, and confirms
- **THEN** `Expense.amount` SHALL be 1100 (floor of 5000 × 0.22)
- **THEN** `Expense.foreignAmount` SHALL be `{ currency: "JPY", amount: 5000 }`
- **THEN** the expense list SHALL display "¥5,000 (NT$1,100)"

#### Scenario: Log general expense without store

- **WHEN** user enters an amount, selects a card, and leaves store as "General Purchase"
- **THEN** an expense record SHALL be created with store field set to null

#### Scenario: Amount must be positive

- **WHEN** user enters 0 or a negative number
- **THEN** the system SHALL prevent saving and display a validation error

## ADDED Requirements

### Requirement: Activity-period cap tracking

The system SHALL track store bonus caps with `capPeriod: "period"` across the entire promotion validity period of the card (from `Card.validFrom` to `Card.validTo`), not just the current calendar month.

For a store bonus rule with `capPeriod: "period"`, the system SHALL sum all expenses matching that store bonus across the active trip (regardless of calendar month) to determine remaining cap. Once the activity-period cap is exhausted within the trip, the bonus rate SHALL no longer apply for that store rule for the remainder of the trip.

For a store bonus rule with `capPeriod: "monthly"`, existing monthly-reset behavior SHALL apply unchanged.

#### Scenario: Period cap accumulates across months within a trip

- **WHEN** a store bonus rule has `capPeriod: "period"` with `cap: 600` (NTD reward cap) and the user has already earned NT$400 in rewards from that rule in January
- **THEN** in February of the same trip, the remaining cap for that rule SHALL be NT$200 (not reset to NT$600)

#### Scenario: Monthly cap resets each month

- **WHEN** a store bonus rule has `capPeriod: "monthly"` with `cap: 600`
- **THEN** at the start of a new calendar month, the accumulated spend for that rule SHALL reset to zero
