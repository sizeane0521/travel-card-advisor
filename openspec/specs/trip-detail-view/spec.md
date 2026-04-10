# trip-detail-view Specification

## Purpose

Define the trip detail view that shows per-trip statistics and daily expense breakdown when a user taps a trip card in the trip history list.

## Requirements

### Requirement: Trip detail view with daily expense breakdown

The system SHALL provide a trip detail view accessible by tapping a trip card in the trip history list. The detail view SHALL display:
- A back button that returns the user to the trip history list
- The trip name as the page heading
- The trip date range (startDate to endDate; if endDate is null, display startDate only)
- A summary row showing total spend (NT$), total estimated reward (NT$), and total expense count
- Expenses grouped by date in descending date order (most recent date first)

For each date group, the system SHALL display:
- A date header showing the ISO date (YYYY-MM-DD), the day of week in Traditional Chinese short form (e.g. "週一"), the number of expenses for that date, and the daily subtotals for spend and reward
- Each expense in the group, rendered as a card showing:
  - Amount: foreign currency original amount (e.g. "¥8,000") if `foreignAmount` is set, followed by the TWD equivalent in parentheses (e.g. "(NT$1,760)"); otherwise just the TWD amount (e.g. "NT$200")
  - Store name (or "一般消費" if null)
  - Card name (looked up from `cardId` against the cards array)
  - Effective rate as a percentage badge (from `rewardBreakdown.effectiveRate` if available)
  - Estimated reward in NT$

Within each date group, expenses SHALL be displayed in the order they appear in the trip's `expenses` array (most recently added first, since expenses are prepended or appended in recording order; display SHALL be reversed so the first recorded is shown last within the day group).

When a trip has no expenses, the detail view SHALL display a message "此旅程尚無消費記錄".

#### Scenario: Navigate to trip detail from trip list

- **WHEN** user taps a trip card in the trip history list
- **THEN** the system SHALL display the trip detail view for that trip
- **THEN** the trip name, date range, and summary statistics SHALL be visible

#### Scenario: Detail view shows daily groups in descending order

- **WHEN** a trip has expenses on 2026-06-14 and 2026-06-16
- **THEN** the detail view SHALL show the 2026-06-16 group first, followed by the 2026-06-14 group

#### Scenario: Daily header shows correct subtotals

- **WHEN** a date group on 2026-06-15 has 3 expenses totaling NT$5,000 spend and NT$150 reward
- **THEN** the 2026-06-15 header SHALL display "3 筆", "消費 NT$5,000", and "回饋 NT$150"

#### Scenario: Foreign currency expense displayed with original and TWD amounts

- **WHEN** an expense has `foreignAmount: { currency: "JPY", amount: 8000 }` and `amount: 1760`
- **THEN** the expense card SHALL display "¥8,000 (NT$1,760)"

#### Scenario: Back button returns to trip list

- **WHEN** user taps the back button in the trip detail view
- **THEN** the system SHALL return to the trip history list
- **THEN** the trip detail view SHALL no longer be visible

#### Scenario: Empty trip shows placeholder message

- **WHEN** user taps a trip card that has zero expenses
- **THEN** the detail view SHALL display "此旅程尚無消費記錄"

<!-- @trace
source: ledger-rebrand-and-trip-detail
updated: 2026-04-10
code:
  - src/pages/TripDetailPage.tsx
  - src/pages/TripsPage.tsx
-->
