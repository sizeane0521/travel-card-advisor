# expense-tracker Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: ux-amount-display-and-bug-fixes
updated: 2026-04-14
code:
  - src/pages/CalcPage.tsx
  - src/pages/TripsPage.tsx
-->

---
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

<!-- @trace
source: ux-amount-display-and-bug-fixes
updated: 2026-04-14
code:
  - src/pages/CalcPage.tsx
-->


<!-- @trace
source: ux-amount-display-and-bug-fixes
updated: 2026-04-14
code:
  - src/pages/CalcPage.tsx
  - src/pages/TripsPage.tsx
-->

---
### Requirement: Reward rate breakdown display

The system SHALL display a breakdown of the effective reward rate for each card in the inline recommendation list, showing the individual contribution of each reward layer: base rate, payment method bonus, and store bonus.

The breakdown SHALL be shown as a compact secondary line below the effective rate percentage, only when at least one bonus layer (payment method or store) is active for that card.

Format: `基本{base} + AP{pm}` or `基本{base} + AP{pm} + 店家{store}` where:
- `{base}` = card's base rate (always shown in breakdown when breakdown is visible)
- `AP` label is used for Apple Pay; `GP` label is used for Google Pay
- `+ AP{pm}` is shown only when `paymentMethod > 0`
- `+ 店家{store}` is shown only when `store > 0`

When no bonus is active (both `paymentMethod === 0` and `store === 0`), the breakdown line SHALL NOT be rendered.

The breakdown data SHALL come from the `rateBreakdown` field on `CardAdvice`.

#### Scenario: All three layers active

- **WHEN** a card has base rate 2.5%, Apple Pay bonus 1.5%, and store bonus 3.0% all applying
- **THEN** the breakdown line SHALL display "基本2.5 + AP1.5 + 店家3.0"
- **THEN** the effective rate SHALL display "7.0%"

#### Scenario: Only base and payment method active

- **WHEN** no store is selected or no matching store bonus exists for the selected store
- **THEN** the breakdown line SHALL display "基本2.5 + AP1.5"
- **THEN** no "店家" segment SHALL appear in the breakdown

#### Scenario: Only base rate, no bonuses

- **WHEN** payment method is physical and no store bonus applies
- **THEN** the breakdown line SHALL NOT be rendered
- **THEN** only the effective rate percentage SHALL be displayed

#### Scenario: Store bonus cap exceeded hides store from breakdown

- **WHEN** a store bonus exists but its cap has been fully consumed this month
- **THEN** `rateBreakdown.store` SHALL be 0
- **THEN** the "店家" segment SHALL NOT appear in the breakdown line


<!-- @trace
source: expense-ux-search-first-rate-breakdown
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
-->

---
### Requirement: Reward NT$ breakdown display in recommendation list

When a TWD amount is entered, each card row in the inline recommendation list SHALL display a reward breakdown line showing the NT$ contribution of each active reward layer.

The breakdown format SHALL be: `NT${total} = 基本 NT${base} + {store name}加碼 NT${store} + 行動支付加碼 NT${pm}`

Rules:
- The `+ {store name}加碼 NT${store}` segment SHALL only appear when `breakdown.store > 0`
- The `+ 行動支付加碼 NT${pm}` segment SHALL only appear when `breakdown.paymentMethod > 0`
- When only the base reward applies, the display SHALL show `NT${total}` with no breakdown segments
- The breakdown SHALL be computed from the `breakdown` object returned by `calcExpenseReward()`

#### Scenario: All three reward layers active

- **WHEN** NT$2000 is entered, base rate 2%, store bonus 5%, Apple Pay bonus 1.5% all apply
- **THEN** the card row SHALL display: "NT$170 = 基本 NT$40 + 永旺加碼 NT$100 + 行動支付加碼 NT$30"

#### Scenario: Only base reward applies

- **WHEN** NT$1000 is entered, only base rate 3% applies (no store, no payment bonus)
- **THEN** the card row SHALL display: "NT$30" with no breakdown segments

#### Scenario: Store bonus truncated — only partial shown

- **WHEN** a store bonus is partially truncated, `breakdown.store` contains only the earned portion
- **THEN** the breakdown line SHALL show the actual earned store bonus NT$ (not the theoretical full amount)

<!-- @trace
source: fix-store-tags-reward-calc-and-warnings
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
-->


<!-- @trace
source: fix-store-tags-reward-calc-and-warnings
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
-->

---
### Requirement: Over-cap truncation warning in recommendation list

When a store bonus is partially truncated (i.e., `breakdown.storeCapped === true`), the system SHALL display a ⚠️ warning message below the affected card's row in the recommendation list.

The warning message SHALL state how much of the store bonus cap was applied, e.g.:
`⚠️ {store name}加碼額度本次僅剩 NT${storeCapRemaining}，總額中已包含此部分`

#### Scenario: Warning shown when truncation occurs

- **WHEN** the store bonus cap has NT$200 remaining and the current expense would yield NT$500 in store bonus
- **THEN** a ⚠️ warning SHALL appear below the card row
- **THEN** the warning SHALL include the capped reward amount NT$200 (or the reward equivalent)

#### Scenario: No warning when no truncation

- **WHEN** the expense fits entirely within the remaining store bonus cap
- **THEN** no ⚠️ warning SHALL appear for that card row

<!-- @trace
source: fix-store-tags-reward-calc-and-warnings
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
-->


<!-- @trace
source: fix-store-tags-reward-calc-and-warnings
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
-->

---
### Requirement: Operation warning display in recommendation list

When a card in the recommendation list has `operationWarnings` entries matching the currently selected payment method, the system SHALL display the corresponding warning message within that card's row.

The warning SHALL be visually distinct (e.g., amber/yellow text) and SHALL NOT be dismissible — it persists as long as the matching payment method is selected.

#### Scenario: Warning visible for matching payment method

- **WHEN** 吉鶴卡 has `operationWarnings: [{ paymentMethod: "apple_pay", message: "結帳請告知感應信用卡，勿使用 QUICPay" }]` and the user selects Apple Pay
- **THEN** the warning "結帳請告知感應信用卡，勿使用 QUICPay" SHALL appear within 吉鶴卡's row

#### Scenario: Warning hidden for non-matching payment method

- **WHEN** the user switches from Apple Pay to 實體卡
- **THEN** the Apple Pay operation warning SHALL NOT be displayed for any card

<!-- @trace
source: fix-store-tags-reward-calc-and-warnings
updated: 2026-04-07
code:
  - src/types/index.ts
  - src/pages/ExpensePage.tsx
-->


<!-- @trace
source: fix-store-tags-reward-calc-and-warnings
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
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

The system SHALL display a chronological list of all expenses within the active trip, showing date, store, card name, amount, and estimated reward for each entry. The expense list SHALL reside in the 明細 Tab (LedgerPage), not in the same view as the expense entry form.

#### Scenario: Expense list shown in 明細 Tab

- **WHEN** user navigates to the 明細 Tab
- **THEN** all expenses belonging to the active trip SHALL be displayed in reverse chronological order

#### Scenario: Expense list not shown in 試算 Tab

- **WHEN** user is on the 試算 Tab
- **THEN** the expense list SHALL NOT be rendered in that view

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

For a store bonus rule with `capPeriod: "period"`, the system SHALL sum all expenses matching that store bonus across **all trips** where `expense.date >= Card.validFrom AND expense.date <= Card.validTo`, regardless of which trip the expense belongs to. Once the activity-period cap is exhausted across all trips within the validity period, the bonus rate SHALL no longer apply for that store rule.

For a store bonus rule with `capPeriod: "monthly"`, existing monthly-reset behavior SHALL apply unchanged.

When `Card.validFrom` or `Card.validTo` is absent, the system SHALL fall back to summing across all trips with no date filter.

#### Scenario: Period cap accumulates across multiple trips

- **WHEN** a store bonus rule has `capPeriod: "period"` with `cap: 20000` (spend cap), Card.validFrom = "2026-01-01", Card.validTo = "2026-06-30"
- **AND** Trip A (January) has NT$12,000 in matching store expenses for this card
- **AND** Trip B (March) is now active with NT$0 previously spent
- **THEN** the remaining spend cap for Trip B SHALL be NT$8,000 (not reset to NT$20,000)

#### Scenario: Period cap accumulates across months within a trip

- **WHEN** a store bonus rule has `capPeriod: "period"` with `cap: 20000` and the user has already spent NT$15,000 at matching stores in January of the active trip
- **THEN** in February of the same trip, the remaining cap SHALL be NT$5,000 (not reset to NT$20,000)

#### Scenario: Monthly cap resets each month

- **WHEN** a store bonus rule has `capPeriod: "monthly"` with `cap: 20000`
- **THEN** at the start of a new calendar month, the accumulated spend for that rule SHALL reset to zero

#### Scenario: Period cap with no validFrom/validTo falls back to all trips

- **WHEN** a card has `capPeriod: "period"` store bonus and `validFrom` / `validTo` are absent
- **THEN** the system SHALL sum matching expenses across all trips with no date filter


<!-- @trace
source: reward-cap-and-display-enhance
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
  - src/components/CardForm.tsx
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

Cards with `isFull: true` SHALL appear at the bottom of the list with a "本月已滿" label and SHALL NOT be selectable or recordable.

The "🌟 最佳推薦" label SHALL appear as a separate line above the card name within the top-ranked card's row. The card name SHALL always be left-aligned at the same horizontal position as card names in all other rows.

Each card row SHALL include a「+刷卡」inline action button on the right side of the row. The button SHALL be disabled when `card.isFull === true`. Tapping the button SHALL record the expense using that card (see Record a single expense requirement for full record behavior).

#### Scenario: Best card badge does not misalign card names

- **WHEN** the top-ranked card row renders the "🌟 最佳推薦" label
- **THEN** the label SHALL appear on its own line above the card name
- **THEN** the card name "國泰 Cube" SHALL be left-aligned at the same position as "吉鶴卡" in the row below

#### Scenario: Cards sorted by effective rate including payment method bonus

- **WHEN** user selects "Apple Pay", Card A has effective rate 2.5% (no mobile bonus), Card B has effective rate 4.0% (2.5% base + 1.5% Apple Pay bonus, cap available)
- **THEN** Card B SHALL rank first in the recommendation list
- **THEN** Card B SHALL display "4.0%" as its effective rate

#### Scenario: Per-card button visible on each row

- **WHEN** the recommendation list renders with at least one non-full card
- **THEN** each non-full card row SHALL display a「+刷卡」button on its right side
- **THEN** full cards SHALL render their「+刷卡」button in a disabled state


<!-- @trace
source: expense-entry-ux
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
  - src/lib/rewardCalc.ts
-->

<!-- @trace
source: split-calc-and-ledger-tabs
updated: 2026-04-08
code:
  - src/pages/CalcPage.tsx
-->

---
### Requirement: Trip expense count summary

The 明細 Tab header SHALL display the total number of expense records in the active trip as a summary badge (e.g. "本次旅程 N 筆"). The count SHALL update immediately after each expense is added or deleted. The count SHALL NOT appear in the 試算 Tab header.

#### Scenario: Count shown in 明細 Tab header

- **WHEN** the active trip has 3 recorded expenses and the user is on the 明細 Tab
- **THEN** the page header area SHALL display "本次旅程 3 筆"

#### Scenario: Count not shown in 試算 Tab header

- **WHEN** the user is on the 試算 Tab
- **THEN** the trip expense count badge SHALL NOT be rendered


<!-- @trace
source: split-calc-and-ledger-tabs
updated: 2026-04-08
code:
  - src/pages/ExpensePage.tsx
  - src/App.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/CalcPage.tsx
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

---
### Requirement: Expense record reward breakdown display

Each expense record in the trip expense list SHALL display the effective reward rate percentage and a three-part reward breakdown showing the NT$ contribution of each active layer: base, store bonus, and payment method bonus.

The expense record SHALL show:
- The effective rate as a percentage (e.g. "7%")
- A breakdown line in the format: `回饋 NT${total} = 基本 NT${base} + {storeName}加碼 NT${store} + 行動支付加碼 NT${pm}`
- Segments with zero value SHALL be omitted from the breakdown line
- When only the base reward applies, the display SHALL show `回饋 NT${total}` with no breakdown

The breakdown data SHALL be sourced from the `Expense.rewardBreakdown` field stored at the time of logging. When `rewardBreakdown` is absent (legacy records), the record SHALL show only `回饋 NT${estimatedReward}` with no breakdown or rate.

The `Expense` interface SHALL be extended with an optional field: `rewardBreakdown?: { base: number; store: number; paymentMethod: number; effectiveRate: number }`.

#### Scenario: Expense record shows full breakdown

- **WHEN** an expense was logged with base 2.5%, Apple Pay 1.5%, store 3%, total NT$6,375
- **THEN** the record SHALL display "7%" as the rate
- **THEN** the record SHALL display "回饋 NT$6,375 = 基本 NT$2,625 + 熱門商店加碼 NT$600 + 行動支付加碼 NT$1,575"

#### Scenario: Legacy expense record shows only total

- **WHEN** an expense has `estimatedReward: 500` and `rewardBreakdown` is absent
- **THEN** the record SHALL display "回饋 NT$500" with no breakdown segments and no rate percentage

<!-- @trace
source: reward-cap-and-display-enhance
updated: 2026-04-07
code:
  - src/types/index.ts
  - src/pages/ExpensePage.tsx
-->

<!-- @trace
source: reward-cap-and-display-enhance
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
  - src/components/CardForm.tsx
-->
---
### Requirement: 刷卡金 Tab identity and layout

The second navigation Tab SHALL be labeled「刷卡金」and display a credit card icon (rectangular card outline with a horizontal stripe and short line segments representing card number area). The Tab was previously labeled「明細」with a scroll/document icon.

Within the 刷卡金 Tab, the bonus quota status panel SHALL appear above the expense list. The layout order SHALL be:
1. Page header (「刷卡金」title + expense count)
2. Bonus quota status panel (加碼額度狀態)
3. Current trip expense list (本次旅程消費記錄)

#### Scenario: Tab displays correct label and icon

- **WHEN** user views the bottom navigation bar
- **THEN** the second Tab SHALL display the label「刷卡金」
- **THEN** the second Tab icon SHALL be a credit card shape

#### Scenario: Bonus quota status appears above expense list

- **WHEN** user navigates to the 刷卡金 Tab with an active trip and qualifying bonus rows
- **THEN** the bonus quota status panel SHALL be visible before scrolling to the expense list
- **THEN** the expense list SHALL appear below the bonus quota status panel

<!-- @trace
source: ledger-rebrand-and-trip-detail
updated: 2026-04-10
code:
  - src/App.tsx
  - src/pages/LedgerPage.tsx
-->

---
### Requirement: Deleted card graceful fallback in expense display

When an expense record references a `cardId` that no longer exists in `data.cards`, the system SHALL display "已刪除的卡片" in place of the card name. This SHALL apply in both LedgerPage and TripDetailPage.

#### Scenario: Deleted card shown as label in LedgerPage

- **WHEN** an expense has `cardId: "abc-123"` and no card with that id exists in `data.cards`
- **THEN** the expense row in LedgerPage SHALL display "已刪除的卡片" instead of the UUID

#### Scenario: Deleted card shown as label in TripDetailPage

- **WHEN** an expense references a deleted card
- **THEN** the expense entry in TripDetailPage SHALL display "已刪除的卡片" for the card name

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
-->


<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
code:
  - src/pages/LedgerPage.tsx
  - src/types/index.ts
  - repomix-output.xml
  - src/store/useStore.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->

---
### Requirement: Payment method badge hidden in physical card mode

When `paymentMethod === 'physical'` is selected, the system SHALL NOT display any Apple Pay or Google Pay badge on any card row in the recommendation list, regardless of the card's `paymentMethodBonus` configuration.

#### Scenario: Badge absent when physical card is selected

- **WHEN** the user selects "實體卡" as the payment method
- **THEN** no Apple Pay or Google Pay badge SHALL appear on any card row

#### Scenario: Badge visible when Apple Pay is selected

- **WHEN** the user selects "Apple Pay" and a card supports Apple Pay bonus with remaining cap
- **THEN** the "Apple Pay" badge SHALL appear on that card's row

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
-->

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
code:
  - src/pages/LedgerPage.tsx
  - src/types/index.ts
  - repomix-output.xml
  - src/store/useStore.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->