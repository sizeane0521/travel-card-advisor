## MODIFIED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering an amount and optionally selecting a store via chip buttons or an expanded store list. The system SHALL automatically select the highest-reward card based on the entered amount and selected store. The user SHALL be able to override the auto-selected card by tapping any other card in the inline recommendation list. The expense SHALL be timestamped with the current date and saved to the active trip.

When the active trip has an `exchangeRate` set (e.g. `{ currency: "JPY", rate: 0.22 }`):
- The expense entry form SHALL display a foreign currency input field (e.g. "金額（JPY）")
- The system SHALL convert the entered foreign amount to TWD by multiplying by the trip's exchange rate and rounding down to the nearest integer
- The converted TWD amount SHALL be stored in `Expense.amount` and used for all reward calculations
- The original foreign amount SHALL be stored in `Expense.foreignAmount: { currency: string; amount: number }`
- Both the foreign amount and the TWD equivalent SHALL be displayed in the expense list entry

When the active trip has no `exchangeRate`:
- The expense entry form SHALL display a TWD amount field (existing behavior)
- `Expense.foreignAmount` SHALL not be set

After submission, the form SHALL reset the amount to empty and the store selection to "General Purchase". The card selection SHALL remain as whatever was last confirmed.

#### Scenario: Auto-selects best card on store change

- **WHEN** user selects store "唐吉訶德" and Card A has 3% bonus for that store, Card B has 2.5% base rate
- **THEN** Card A SHALL be automatically selected (highlighted) in the inline recommendation list
- **THEN** the submit button SHALL use Card A unless the user taps Card B to override

#### Scenario: Auto-selects next best card when top card is full

- **WHEN** the highest-rate card for the selected store has `isFull: true`
- **THEN** the system SHALL automatically select the next card in the ranked list that is not full

#### Scenario: Form resets after submission

- **WHEN** user successfully submits an expense
- **THEN** the amount field SHALL be cleared
- **THEN** the store selection SHALL reset to "General Purchase" (store = null)

#### Scenario: Log expense in JPY with exchange rate

- **WHEN** the active trip has `exchangeRate: { currency: "JPY", rate: 0.22 }` and user enters ¥5000 and confirms
- **THEN** `Expense.amount` SHALL be 1100 (floor of 5000 × 0.22)
- **THEN** `Expense.foreignAmount` SHALL be `{ currency: "JPY", amount: 5000 }`
- **THEN** the expense list SHALL display "¥5,000 (NT$1,100)"

#### Scenario: Amount must be positive

- **WHEN** user enters 0 or a negative number
- **THEN** the system SHALL prevent saving and display a validation error

## ADDED Requirements

### Requirement: Inline card recommendation during expense entry

The expense entry form SHALL display a live-sorted list of all configured cards, ranked by effective reward rate for the currently selected store and entered amount. The list SHALL update immediately when the amount or store changes (no submit required). The top-ranked non-full card SHALL be highlighted as the auto-selected card. All other cards SHALL be shown below in order with their effective rate and, if a cap exists, a text showing the remaining cap amount.

The top-ranked card in the inline list SHALL display a visual progress bar showing cap utilization: `(total_cap - remaining) / total_cap × 100%`. The bar SHALL only appear when the card has a `rewardLimit` or `spendLimit` configured. Cards with neither cap SHALL show no progress bar.

Cards with `isFull: true` SHALL appear at the bottom of the list with a "本月已滿" label and SHALL NOT be selectable as the confirmed card.

#### Scenario: Cards sorted by effective rate for selected store

- **WHEN** user selects store "唐吉訶德" and enters NT$1000
- **THEN** cards SHALL be displayed sorted by effective rate descending
- **THEN** the card with the highest effective rate SHALL be visually highlighted as auto-selected

#### Scenario: Top card shows progress bar when cap exists

- **WHEN** the top-ranked card has `rewardLimit: 600` and has earned NT$400 this month
- **THEN** the inline card row SHALL display a progress bar at approximately 67% fill
- **THEN** the remaining text SHALL show "NT$200 回饋剩餘"

#### Scenario: Top card shows no progress bar when no cap

- **WHEN** the top-ranked card has neither `rewardLimit` nor `spendLimit`
- **THEN** no progress bar SHALL be displayed for that card
- **THEN** the effective rate SHALL be displayed prominently

#### Scenario: Full card shown at bottom and not auto-selected

- **WHEN** a card with the highest base rate has `isFull: true`
- **THEN** that card SHALL appear at the bottom of the inline list
- **THEN** the next non-full card SHALL be auto-selected instead

#### Scenario: User overrides auto-selection

- **WHEN** user taps a non-auto-selected card in the inline list
- **THEN** that card SHALL become the confirmed selection (visually highlighted)
- **THEN** submitting SHALL record the expense with the user-selected card

---

### Requirement: Store chip selection in expense form

The expense entry form SHALL display store names from `getAllStoreNames(cards)` as tappable chip buttons. The chip list SHALL show at most 5 store chips by default. If more than 5 stores are available, a "更多 ▼" button SHALL appear; tapping it SHALL expand to show all remaining store chips. A "一般消費" chip SHALL always be present and represent store = null.

#### Scenario: Chips show stores with bonuses

- **WHEN** configured cards have store bonuses for "唐吉訶德", "7-ELEVEN", "FamilyMart", "熱門商店", "全支付", "新戶"
- **THEN** the form SHALL display the first 5 as chips and a "更多 ▼" button for the rest

#### Scenario: Expand more chips

- **WHEN** user taps "更多 ▼"
- **THEN** all remaining store chips SHALL be revealed
- **THEN** the button text SHALL change to "收起 ▲"

#### Scenario: General purchase chip always visible

- **WHEN** user taps "一般消費" chip
- **THEN** store selection SHALL be set to null and card list SHALL recalculate using base rates

---

### Requirement: Trip expense count summary

The expense entry page header SHALL display the total number of expense records in the active trip as a summary badge (e.g. "本次旅程 N 筆"). The count SHALL update immediately after each expense is added or deleted.

#### Scenario: Count shown in header

- **WHEN** the active trip has 3 recorded expenses
- **THEN** the page header area SHALL display "本次旅程 3 筆"

#### Scenario: Count updates after adding expense

- **WHEN** user adds a new expense
- **THEN** the count SHALL increment by 1 immediately without requiring a page reload
