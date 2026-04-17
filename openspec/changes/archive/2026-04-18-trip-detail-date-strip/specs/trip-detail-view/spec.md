## MODIFIED Requirements

### Requirement: Trip detail view with daily expense breakdown

The system SHALL provide a trip detail view accessible by tapping a trip card in the trip history list. The detail view SHALL display:
- A back button that returns the user to the trip history list
- The trip name as the page heading
- The trip date range (startDate to endDate; if endDate is null, display startDate only)
- A summary row showing total spend (NT$), total estimated reward (NT$), and total expense count
- A horizontally scrollable date chip strip listing all dates that have expenses, in descending order (most recent date first)
- The expense list and daily subtotals for the currently selected date

The date chip strip SHALL display one chip per date. Each chip SHALL show the day-of-month number and the day of week in Traditional Chinese short form (e.g. "週二"). The most recently dated chip SHALL be selected by default when the view loads.

The selected chip SHALL be visually distinguished from unselected chips (e.g. filled background vs. outline).

When a date chip is selected, the system SHALL display below the strip:
- The daily subtotals for that date: number of expenses, total spend (NT$), and total reward (NT$)
- Each expense in the selected date's group, rendered as a card showing:
  - Amount: foreign currency original amount (e.g. "¥8,000") if `foreignAmount` is set, followed by the TWD equivalent in parentheses (e.g. "(NT$1,760)"); otherwise just the TWD amount (e.g. "NT$200")
  - Store name (or "一般消費" if null)
  - Card name (looked up from `cardId` against the cards array)
  - Effective rate as a percentage badge (from `rewardBreakdown.effectiveRate` if available)
  - Estimated reward in NT$

Within a date group, expenses SHALL be displayed in the order they appear in the trip's `expenses` array (reversed so the first recorded appears last within the day group).

When a trip has no expenses, the detail view SHALL display a message "此旅程尚無消費記錄" and SHALL NOT render the date chip strip.

#### Scenario: Navigate to trip detail from trip list

- **WHEN** user taps a trip card in the trip history list
- **THEN** the system SHALL display the trip detail view for that trip
- **THEN** the trip name, date range, and summary statistics SHALL be visible

#### Scenario: Date chip strip shows most recent date selected by default

- **WHEN** a trip has expenses on 2026-06-14 and 2026-06-16
- **THEN** the date chip strip SHALL show chips for both dates
- **THEN** the chip for 2026-06-16 SHALL be selected by default

#### Scenario: Selecting a date chip shows only that day's expenses

- **WHEN** a trip has expenses on 2026-06-14 and 2026-06-16
- **AND** user taps the chip for 2026-06-14
- **THEN** only expenses from 2026-06-14 SHALL be displayed in the list below
- **THEN** the daily subtotals SHALL reflect 2026-06-14's totals only

#### Scenario: Daily subtotals are correct for selected date

- **WHEN** user selects a date chip for 2026-06-15 which has 3 expenses totaling NT$5,000 spend and NT$150 reward
- **THEN** the view SHALL display "3 筆", "消費 NT$5,000", and "回饋 NT$150"

#### Scenario: Foreign currency expense displayed with original and TWD amounts

- **WHEN** an expense has `foreignAmount: { currency: "JPY", amount: 8000 }` and `amount: 1760`
- **THEN** the expense card SHALL display "¥8,000 (NT$1,760)"

#### Scenario: Back button returns to trip list

- **WHEN** user taps the back button in the trip detail view
- **THEN** the system SHALL return to the trip history list
- **THEN** the trip detail view SHALL no longer be visible

#### Scenario: Empty trip shows placeholder message without date chip strip

- **WHEN** user taps a trip card that has zero expenses
- **THEN** the detail view SHALL display "此旅程尚無消費記錄"
- **THEN** the date chip strip SHALL NOT be rendered
