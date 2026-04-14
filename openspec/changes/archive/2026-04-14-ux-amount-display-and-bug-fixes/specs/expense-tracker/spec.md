## MODIFIED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering an amount, selecting a consumption date, and optionally selecting a store via a search input field. The system SHALL automatically select the highest-reward card based on the entered amount and selected store. The expense entry form SHALL reside in the 試算 Tab (CalcPage).

The expense entry form SHALL include a date picker field labeled "消費日期". The default value SHALL be today's date (`todayStr()`). The date picker `min` attribute SHALL be set to `trip.startDate`. The date picker `max` attribute SHALL be set to `trip.endDate` if present, otherwise to today's date. The selected date SHALL be stored as `Expense.date` when the expense is recorded.

Each card row in the inline recommendation list SHALL display a「+刷卡」inline action button. Tapping the「+刷卡」button on a card row SHALL record the expense using that card — no separate global submit button is required.

When the user taps「+刷卡」on a card row:
- If the amount field is empty or invalid (not a positive integer), the system SHALL display a validation error message "請輸入正整數金額" and SHALL NOT record the expense
- If the amount is valid, the system SHALL compute and dispatch the expense identically to the previous submit behavior, using the tapped card's ID, the current store, payment method, prerequisite overrides, and the selected date
- After a successful record, the form SHALL reset: amount and store inputs SHALL be cleared; the selected payment method, selectedCardId, prereqOverrides, AND date (reset to today) SHALL be preserved per their respective rules — date SHALL reset to today after each record

**Trip end date gate**: Recording SHALL be blocked if and only if the active trip has an `endDate` that is less than or equal to today's date (i.e. the trip has already ended). A trip with a future `endDate` SHALL still accept new expense records. Specifically, the guard condition SHALL evaluate `activeTrip.endDate && activeTrip.endDate <= todayStr()` — NOT merely `activeTrip.endDate`.

#### Scenario: Expense recorded successfully

- **WHEN** user enters a valid amount, selects a store and payment method, and taps「+刷卡」
- **THEN** the expense SHALL be recorded with the selected card's ID, store, payment method, and computed reward
- **THEN** the amount and store inputs SHALL be cleared

#### Scenario: Invalid amount blocked

- **WHEN** user taps「+刷卡」with no amount entered
- **THEN** the system SHALL display "請輸入正整數金額"
- **THEN** no expense SHALL be recorded

#### Scenario: Active trip with future end date allows recording

- **WHEN** the active trip has `endDate: "2026-05-30"` and today is "2026-04-14" (end date is in the future)
- **THEN** tapping「+刷卡」with a valid amount SHALL successfully record the expense

#### Scenario: Ended trip blocks recording

- **WHEN** the active trip has `endDate: "2026-04-10"` and today is "2026-04-14" (trip has ended)
- **THEN** the expense entry form SHALL NOT be rendered
- **THEN** tapping「+刷卡」SHALL NOT record any expense

## ADDED Requirements

### Requirement: TWD converted amount visual prominence

When the active trip has an exchange rate and the user has entered a valid amount, the system SHALL display the converted TWD amount with primary visual prominence — specifically using a larger font size and high-contrast color — so the user can immediately confirm the converted value without scanning through secondary text.

The converted amount display SHALL use at minimum `text-2xl font-bold` and the primary text color (`#f2e8c9`) to distinguish it from helper labels.

#### Scenario: Converted amount displayed prominently when exchange rate active

- **WHEN** the active trip has `exchangeRate: { currency: "JPY", rate: 0.21 }` and the user enters "50000" in the amount field
- **THEN** the system SHALL display "≈ NT$10,500" in large, high-contrast text immediately below the amount input
- **THEN** the converted amount text SHALL be visually larger and brighter than surrounding helper labels

#### Scenario: No converted amount shown when no exchange rate

- **WHEN** the active trip has no `exchangeRate`
- **THEN** no converted TWD amount line SHALL be displayed
