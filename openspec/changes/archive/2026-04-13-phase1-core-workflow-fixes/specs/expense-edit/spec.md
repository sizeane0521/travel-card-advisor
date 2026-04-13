## ADDED Requirements

### Requirement: Edit an existing expense record

The system SHALL allow users to edit an existing expense record in the 明細 Tab. Tapping an expense record SHALL enter edit mode for that record inline. In edit mode, the user SHALL be able to modify: `amount` (TWD), `date`, and `cardId`. After saving, the system SHALL recalculate `estimatedReward`, `paymentMethodReward`, and `rewardBreakdown` using the updated values and default prerequisite settings (no overrides applied).

The `useStore` reducer SHALL support an `UPDATE_EXPENSE` action: `{ type: 'UPDATE_EXPENSE'; tripId: string; expense: Expense }`, which replaces the matching expense by `id` within the specified trip.

Edit mode SHALL be cancelable. Cancelling SHALL restore the original values with no changes applied.

Small recalculation differences due to not restoring original prerequisite toggle states are acceptable — this product's primary purpose is cap tracking, not precise reward auditing.

#### Scenario: Edit amount updates reward

- **WHEN** user edits an expense from NT$3000 to NT$5000 and saves
- **THEN** the expense record SHALL show the new amount NT$5000
- **THEN** `estimatedReward` SHALL be recalculated based on NT$5000 and the card's current default rates

#### Scenario: Edit card updates reward rate

- **WHEN** user changes the card from Card A (2%) to Card B (3%) and saves
- **THEN** the expense record SHALL reference Card B
- **THEN** `estimatedReward` SHALL be recalculated using Card B's reward rates

#### Scenario: Edit date updates the expense

- **WHEN** user changes the expense date from "2026-04-29" to "2026-04-30" and saves
- **THEN** the stored `Expense.date` SHALL be "2026-04-30"

#### Scenario: Cancel edit restores original values

- **WHEN** user enters edit mode and changes the amount but taps Cancel
- **THEN** the expense record SHALL retain its original amount
- **THEN** no UPDATE_EXPENSE action SHALL be dispatched

#### Scenario: UPDATE_EXPENSE replaces matching record

- **WHEN** `UPDATE_EXPENSE` is dispatched with an expense having id "exp-001"
- **THEN** the expense with id "exp-001" in the specified trip SHALL be replaced with the new expense object
- **THEN** all other expenses SHALL remain unchanged
