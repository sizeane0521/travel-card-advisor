# expense-tracker Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: smart-expense-entry
updated: 2026-04-06
code:
  - src/pages/ExpensePage.tsx
-->

---
### Requirement: Reward estimation on save

After saving an expense, the system SHALL display an estimated reward amount calculated as: `expense amount × effective rate` for the chosen card and store at the time of logging.

#### Scenario: Show reward estimate after logging

- **WHEN** user logs NT$2000 to a card with 3% base rate and no store bonus
- **THEN** the system SHALL display "Estimated reward: NT$60"

#### Scenario: Reward capped at remaining cap

- **WHEN** a card's remaining reward cap is NT$50 and the user logs NT$3000 at 3% (which would yield NT$90)
- **THEN** the displayed estimate SHALL be NT$50 (capped, not NT$90)

---
### Requirement: Monthly spend accumulation

The system SHALL aggregate all expense amounts per card per calendar month and expose the total as the card's "current month spend" for use by the card-advisor capability.

#### Scenario: Monthly total updates after logging

- **WHEN** user logs a new expense of NT$500 to Card A
- **THEN** Card A's current month total SHALL increase by NT$500

#### Scenario: Expenses from different months not aggregated

- **WHEN** Card A has NT$10000 logged in June and NT$5000 in July
- **THEN** Card A's July monthly total SHALL be NT$5000, not NT$15000

---
### Requirement: Expense list view

The system SHALL display a chronological list of all expenses within the active trip, showing date, store, card name, amount, and estimated reward for each entry.

#### Scenario: Expense list shows all active trip entries

- **WHEN** user navigates to the expense list
- **THEN** all expenses belonging to the active trip SHALL be displayed in reverse chronological order

---
### Requirement: Delete expense

The system SHALL allow users to delete any individual expense record from the active trip. Deletion SHALL immediately update the monthly spend totals and card recommendations.

#### Scenario: Delete expense updates totals

- **WHEN** user deletes an expense of NT$1200 from Card A
- **THEN** Card A's current month total SHALL decrease by NT$1200
- **THEN** the card recommendation list SHALL recalculate and update

---
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

<!-- @trace
source: enhance-card-import-and-currency
updated: 2026-04-06
code:
  - src/lib/cardImport.ts
  - src/types/index.ts
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/store/storage.ts
  - src/pages/TripsPage.tsx
-->

---
### Requirement: Payment method selection during expense entry

The expense entry form SHALL display a payment method selector with three options: "Apple Pay", "Google Pay", and "實體卡". The selector SHALL appear as chip buttons above the inline card recommendation list. The default selection SHALL be "Apple Pay". The chip order SHALL be: Apple Pay → Google Pay → 實體卡.

The selected payment method SHALL affect the effective rate and estimated reward displayed for each card in the inline recommendation list in real time. The selected payment method SHALL be stored in the `Expense.paymentMethod` field when the expense is saved. The selector SHALL persist its state within the session (not reset between expenses).

#### Scenario: Default payment method is Apple Pay

- **WHEN** user opens the expense entry form for the first time in a session
- **THEN** "Apple Pay" SHALL be selected by default
- **THEN** any card with `paymentMethodBonus` including `apple_pay` SHALL display its Apple Pay effective rate immediately

#### Scenario: Chip order is Apple Pay first

- **WHEN** the payment method selector is rendered
- **THEN** the chips SHALL appear left-to-right in order: Apple Pay, Google Pay, 實體卡

#### Scenario: Switching to 實體卡 removes payment method bonus

- **WHEN** user selects "實體卡"
- **THEN** no payment method bonus SHALL be applied to any card's effective rate
- **THEN** the recommendation list SHALL re-sort based on base and store rates only


<!-- @trace
source: expense-entry-ux
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
  - src/lib/rewardCalc.ts
-->

---
### Requirement: Inline card recommendation during expense entry

The expense entry form SHALL display a live-sorted list of all configured cards, ranked by effective reward rate for the currently selected store, entered amount, AND selected payment method. The list SHALL update immediately when the amount, store, or payment method changes (no submit required). The top-ranked non-full card SHALL be highlighted as the auto-selected card. All other cards SHALL be shown below in order with their effective rate and, if a cap exists, a text showing the remaining cap amount.

Each card row in the recommendation list SHALL display which payment method to use. When a card has `paymentMethodBonus` and the currently selected payment method matches one of its supported methods AND at least one tier still has remaining cap, the card row SHALL display a badge indicating the recommended payment method (e.g. "Apple Pay" or "Google Pay"). When the selected method is "實體卡" or no bonus applies, no payment method badge SHALL appear.

The top-ranked card in the inline list SHALL display a visual progress bar showing cap utilization: `(total_cap - remaining) / total_cap × 100%`. The bar SHALL only appear when the card has a `rewardLimit` or `spendLimit` configured. Cards with neither cap SHALL show no progress bar.

Cards with `isFull: true` SHALL appear at the bottom of the list with a "本月已滿" label and SHALL NOT be selectable as the confirmed card.

The "🌟 最佳推薦" label SHALL appear as a separate line above the card name within the top-ranked card's row. The card name SHALL always be left-aligned at the same horizontal position as card names in all other rows.

#### Scenario: Best card badge does not misalign card names

- **WHEN** the top-ranked card row renders the "🌟 最佳推薦" label
- **THEN** the label SHALL appear on its own line above the card name
- **THEN** the card name "國泰 Cube" SHALL be left-aligned at the same position as "吉鶴卡" in the row below

#### Scenario: Cards sorted by effective rate including payment method bonus

- **WHEN** user selects "Apple Pay", Card A has effective rate 2.5% (no mobile bonus), Card B has effective rate 4.0% (2.5% base + 1.5% Apple Pay bonus, cap available)
- **THEN** Card B SHALL rank first in the recommendation list
- **THEN** Card B SHALL display "4.0%" as its effective rate


<!-- @trace
source: expense-entry-ux
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
  - src/lib/rewardCalc.ts
-->

---
### Requirement: Store chip selection in expense form

The expense entry form SHALL display a text search input above the store chip list. The search input SHALL have placeholder text "搜尋店家…" and a clear button (×) that resets the store selection to null (一般消費) and clears the input text.

When the search input is empty, the chip list SHALL show the first 5 store names from `getAllStoreNames(cards)` plus a "更多 ▼" button if more than 5 exist; tapping it SHALL expand to show all remaining chips.

When the search input contains text, the chip list SHALL be filtered in real time to show only store names that include the query string (case-insensitive). The "更多 ▼ / 收起 ▲" button SHALL be hidden during active search. If no chips match the query, the chip list SHALL be empty (only "一般消費" remains).

The "一般消費" chip SHALL always be visible regardless of the search query. It represents store = null.

Tapping any chip SHALL:
1. Set the store selection to that chip's store name
2. Fill the search input with that store name
3. Visually highlight the chip as selected

Typing in the search input SHALL:
1. Update the chip list filter in real time
2. Set the store selection to the exact text entered (even if it does not match any chip)
3. Remove the visual highlight from any previously selected chip if the text no longer matches it

#### Scenario: Empty search shows default chip list

- **WHEN** the search input is empty and 6 store names are configured
- **THEN** the form SHALL display "一般消費" plus the first 5 store chips and a "更多 ▼" button

#### Scenario: Typing filters chips in real time

- **WHEN** user types "唐" into the search input
- **THEN** only store chips whose name contains "唐" (e.g. "唐吉訶德") SHALL be displayed
- **THEN** "一般消費" SHALL remain visible
- **THEN** "更多 ▼" button SHALL be hidden

#### Scenario: No matching chips shows empty list

- **WHEN** user types "zzz" and no store name contains "zzz"
- **THEN** only "一般消費" chip SHALL be visible
- **THEN** the store selection SHALL be set to "zzz" (free-text)
- **THEN** card recommendations SHALL recalculate using base rates (no store bonus match)

#### Scenario: Tapping chip fills search input

- **WHEN** user taps the "唐吉訶德" chip
- **THEN** the search input SHALL display "唐吉訶德"
- **THEN** the "唐吉訶德" chip SHALL be visually highlighted as selected
- **THEN** card recommendations SHALL recalculate using that store's bonus rates

#### Scenario: Clear button resets to general purchase

- **WHEN** user taps the × clear button in the search input
- **THEN** the search input SHALL be cleared
- **THEN** the store selection SHALL be set to null (一般消費)
- **THEN** "一般消費" chip SHALL be highlighted
- **THEN** the full default chip list SHALL be restored

#### Scenario: Tapping 一般消費 chip clears search

- **WHEN** user taps "一般消費" chip
- **THEN** the search input SHALL be cleared
- **THEN** store selection SHALL be set to null
- **THEN** card recommendations SHALL recalculate using base rates


<!-- @trace
source: expense-store-search
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
-->

---
### Requirement: Trip expense count summary

The expense entry page header SHALL display the total number of expense records in the active trip as a summary badge (e.g. "本次旅程 N 筆"). The count SHALL update immediately after each expense is added or deleted.

#### Scenario: Count shown in header

- **WHEN** the active trip has 3 recorded expenses
- **THEN** the page header area SHALL display "本次旅程 3 筆"

#### Scenario: Count updates after adding expense

- **WHEN** user adds a new expense
- **THEN** the count SHALL increment by 1 immediately without requiring a page reload

<!-- @trace
source: smart-expense-entry
updated: 2026-04-06
code:
  - src/pages/ExpensePage.tsx
-->

---
### Requirement: AI card import recognizes payment method bonuses

When the AI parses a bank credit card page and detects payment method bonuses (Apple Pay, Google Pay, 行動支付, 感應支付), the system SHALL output them as `paymentMethodBonusTiers` instead of `storeRules`. Each tier SHALL include the bonus rate, monthly reward cap in NTD, and an optional prerequisite condition string.

The system SHALL populate the card's `paymentMethodBonus` form fields automatically from the imported tiers: the payment method bonus toggle SHALL be enabled, both Apple Pay and Google Pay SHALL be pre-selected, and each imported tier SHALL appear as a row in the tier list.

#### Scenario: Import card with payment method bonus tiers

- **WHEN** the AI parses a page containing 行動支付登錄加碼 1.5% (月上限 NT$600) and 帳單滿額加碼 1.0% (前月帳單滿 NT$30,000, 月上限 NT$200)
- **THEN** `CardImportResult.paymentMethodBonusTiers` SHALL contain two entries: `{ rate: 1.5, monthlyCap: 600 }` and `{ rate: 1.0, monthlyCap: 200, prerequisite: "前月帳單滿30000元" }`
- **THEN** the card form SHALL have payment method bonus enabled with Apple Pay and Google Pay selected
- **THEN** the tier list SHALL show both tiers with their respective rates and caps

#### Scenario: Payment method bonus does not appear in storeBonus

- **WHEN** the AI parses a page where 行動支付加碼 is present
- **THEN** `CardImportResult.storeRules` SHALL NOT contain any entry with a category name matching 行動支付, Apple Pay, Google Pay, or 感應支付 keywords
- **THEN** the card's `storeBonus[]` SHALL NOT include a payment-method bonus entry after import

#### Scenario: Import card with no payment method bonus

- **WHEN** the AI parses a page with no 行動支付 / Apple Pay / Google Pay bonus
- **THEN** `CardImportResult.paymentMethodBonusTiers` SHALL be an empty array or absent
- **THEN** the payment method bonus toggle SHALL remain disabled in the card form

<!-- @trace
source: fix-card-import-payment-method-bonus
updated: 2026-04-07
code:
  - src/lib/cardImport.ts
  - src/components/CardForm.tsx
-->

---
### Requirement: Prerequisite tier selection during expense entry

When the selected payment method matches a card's `paymentMethodBonus.methods` AND that card has at least one tier with a non-null `prerequisite`, the expense entry form SHALL display a prerequisite section within that card's recommendation row. Each prerequisite tier SHALL appear as a toggleable chip labeled with the prerequisite description and the additional rate (e.g. "前月帳單滿 30,000 元 (+1%)").

The prerequisite toggles SHALL be local to the current expense entry and SHALL NOT persist to the card configuration. When a prerequisite toggle is turned on, the effective rate and estimated reward for that card SHALL update immediately to include that tier's rate (subject to remaining monthly cap).

#### Scenario: Prerequisite tier shown when payment method matches

- **WHEN** user selects "Apple Pay" and 吉鶴卡 has two tiers: tier 1 `{ rate: 1.5, monthlyCap: 600 }` and tier 2 `{ rate: 1.0, monthlyCap: 200, prerequisite: "前月帳單滿30000元" }`
- **THEN** 吉鶴卡's row SHALL show a toggleable chip labeled "前月帳單滿 30,000 元 (+1%)"
- **THEN** tier 1 (no prerequisite) SHALL be included in effectiveRate automatically: 2.5% + 1.5% = 4.0%

#### Scenario: Enabling prerequisite tier updates rate immediately

- **WHEN** user taps the "前月帳單滿 30,000 元 (+1%)" chip to enable it
- **THEN** 吉鶴卡's effectiveRate SHALL update to 2.5% + 1.5% + 1.0% = 5.0%
- **THEN** the estimated reward SHALL recalculate using 5.0%

#### Scenario: Prerequisite toggle does not persist to card settings

- **WHEN** user submits the expense with the prerequisite toggle enabled
- **THEN** the saved `Expense` SHALL record the actual rates used at time of logging
- **THEN** 吉鶴卡's card configuration SHALL remain unchanged (prerequisiteMet on the card tier SHALL NOT be modified)

#### Scenario: No prerequisite section when tiers have no conditions

- **WHEN** all of a card's payment method bonus tiers have `prerequisite: null`
- **THEN** no prerequisite toggle section SHALL appear for that card

<!-- @trace
source: expense-entry-ux
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
  - src/lib/rewardCalc.ts
-->