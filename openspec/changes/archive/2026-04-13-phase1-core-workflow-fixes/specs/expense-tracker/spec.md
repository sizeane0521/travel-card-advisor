## MODIFIED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering an amount, selecting a consumption date, and optionally selecting a store via a search input field. The system SHALL automatically select the highest-reward card based on the entered amount and selected store. The expense entry form SHALL reside in the 試算 Tab (CalcPage).

The expense entry form SHALL include a date picker field labeled "消費日期". The default value SHALL be today's date (`todayStr()`). The date picker `min` attribute SHALL be set to `trip.startDate`. The date picker `max` attribute SHALL be set to `trip.endDate` if present, otherwise to today's date. The selected date SHALL be stored as `Expense.date` when the expense is recorded.

Each card row in the inline recommendation list SHALL display a「+刷卡」inline action button. Tapping the「+刷卡」button on a card row SHALL record the expense using that card — no separate global submit button is required.

When the user taps「+刷卡」on a card row:
- If the amount field is empty or invalid (not a positive integer), the system SHALL display a validation error message "請輸入正整數金額" and SHALL NOT record the expense
- If the amount is valid, the system SHALL compute and dispatch the expense identically to the previous submit behavior, using the tapped card's ID, the current store, payment method, prerequisite overrides, and the selected date
- After a successful record, the form SHALL reset: amount and store inputs SHALL be cleared; the selected payment method, selectedCardId, prereqOverrides, AND date (reset to today) SHALL be preserved per their respective rules — date SHALL reset to today after each record
- The system SHALL display a toast notification at the top of the page showing the reward breakdown for the recorded expense. The toast SHALL auto-dismiss after 3 seconds. The toast content SHALL follow the format: "已記帳！回饋 NT${total} = 基本 NT${base} + {storeName}加碼 NT${store} + 行動支付加碼 NT${pm}". Segments with zero value SHALL be omitted. When only base reward applies, the toast SHALL show "已記帳！回饋 NT${total}"
- The user SHALL remain on the 試算 Tab after submission (no automatic tab switch)

The「+刷卡」button SHALL be disabled (not tappable) when `card.isFull === true`.

When the active trip has an `exchangeRate` set (e.g. `{ currency: "JPY", rate: 0.22 }`):
- The expense entry form SHALL display a foreign currency input field (e.g. "金額（JPY）")
- The system SHALL convert the entered foreign amount to TWD using the per-expense rate (customRate if provided, otherwise the trip's exchangeRate.rate), rounding down to the nearest integer
- The system SHALL display the converted TWD amount in real time as the user types

The store selection area SHALL use a search-first interaction model:
- A text search input SHALL always be visible
- A "一般消費" chip SHALL always be visible and selected by default
- When the search input is empty, up to 5 frequent store chips (sourced from the current trip's expenses) SHALL appear — see frequent-store-chips capability
- Store name chips SHALL only appear from search results when the user has typed at least one character in the search input
- Chips displayed SHALL be filtered to those matching the search query (case-insensitive substring match)
- Store name chips SHALL only contain names sourced from `StoreBonus.stores[]` arrays — the `StoreBonus.storeName` field (bonus category label) SHALL NOT appear as a chip

When the user selects a different store by clicking a chip or the clear button, the system SHALL reset `storeBonusOverrides` and `prereqOverrides` to empty. This reset SHALL NOT occur while the user is typing in the search input.

The `Expense` type SHALL include an optional field `customRate?: number` to store the per-expense exchange rate override when used.

#### Scenario: Toast shown after successful record

- **WHEN** user enters NT$6300 at 7-ELEVEN with Apple Pay on 吉鶴卡 (base NT$157, 行動支付加碼 NT$94) and taps「+刷卡」
- **THEN** a toast SHALL appear at the top of the page: "已記帳！回饋 NT$251 = 基本 NT$157 + 行動支付加碼 NT$94"
- **THEN** the toast SHALL auto-dismiss after 3 seconds

#### Scenario: Toast with only base reward

- **WHEN** user records an expense with only base reward NT$60 and no bonuses
- **THEN** the toast SHALL show "已記帳！回饋 NT$60"

#### Scenario: prereqOverrides preserved after record

- **WHEN** user has toggled a payment method prerequisite chip (e.g. "前月帳單滿30000元 (+1%)") and taps「+刷卡」
- **THEN** after the record, the prerequisite toggle SHALL remain in its current state (on)
- **THEN** the next expense calculation SHALL include that tier's rate

#### Scenario: storeBonusOverrides cleared when store chip changes

- **WHEN** user has enabled a store prerequisite toggle for Store A, then clicks the chip for Store B
- **THEN** `storeBonusOverrides` SHALL be reset to empty
- **THEN** `prereqOverrides` SHALL be reset to empty

#### Scenario: Overrides NOT cleared while typing in search input

- **WHEN** user has enabled a store prerequisite toggle and then types a character in the store search box
- **THEN** `storeBonusOverrides` SHALL remain unchanged

#### Scenario: Store search shows chips only when typing

- **WHEN** the user has not typed anything in the store search box
- **THEN** only the "一般消費" chip and frequent store chips (if any) SHALL be displayed

#### Scenario: Store search filters as user types

- **WHEN** the user types "唐" in the store search box
- **THEN** only store names containing "唐" SHALL appear as chips (e.g. "唐吉軻德")

#### Scenario: Record expense via per-card button

- **WHEN** user enters NT$1500 in the amount field and taps「+刷卡」on Card A
- **THEN** the system SHALL record the expense using Card A's ID, the current store, payment method, and the selected date
- **THEN** the amount and store fields SHALL be cleared
- **THEN** the user SHALL remain on the 試算 Tab

#### Scenario: Per-card button disabled when card is full

- **WHEN** Card A has `isFull: true`
- **THEN** the「+刷卡」button on Card A's row SHALL be disabled and non-interactive

#### Scenario: Validation error when amount is empty

- **WHEN** user taps「+刷卡」on any card row with an empty or zero amount field
- **THEN** the system SHALL display "請輸入正整數金額" validation error
- **THEN** no expense SHALL be recorded

#### Scenario: Expense date defaults to today

- **WHEN** user opens the expense entry form
- **THEN** the "消費日期" field SHALL display today's date by default

#### Scenario: Expense date bounded by trip start date

- **WHEN** the active trip has `startDate: "2026-04-28"`
- **THEN** the date picker SHALL NOT allow selecting a date before "2026-04-28"

#### Scenario: Expense date bounded by trip end date when set

- **WHEN** the active trip has `startDate: "2026-04-28"` and `endDate: "2026-05-03"`
- **THEN** the date picker SHALL NOT allow selecting a date after "2026-05-03"

#### Scenario: Expense date bounded by today when no end date

- **WHEN** the active trip has `endDate: null`
- **THEN** the date picker `max` SHALL be today's date

#### Scenario: Selected date stored in expense

- **WHEN** user selects "2026-04-30" in the date picker and taps「+刷卡」
- **THEN** the recorded expense SHALL have `date: "2026-04-30"`

#### Scenario: Date resets to today after record

- **WHEN** user records an expense with date "2026-04-29" and the record succeeds
- **THEN** the date picker SHALL reset to today's date for the next entry

#### Scenario: Monthly cap uses expense date month

- **WHEN** user records an expense with date "2026-04-30" (April) and another with "2026-05-01" (May)
- **THEN** the April expense SHALL count toward April's monthly spend cap
- **THEN** the May expense SHALL count toward May's monthly spend cap independently

## ADDED Requirements

### Requirement: Deleted card graceful fallback in expense display

When an expense record references a `cardId` that no longer exists in `data.cards`, the system SHALL display "已刪除的卡片" in place of the card name. This SHALL apply in both LedgerPage and TripDetailPage.

#### Scenario: Deleted card shown as label in LedgerPage

- **WHEN** an expense has `cardId: "abc-123"` and no card with that id exists in `data.cards`
- **THEN** the expense row in LedgerPage SHALL display "已刪除的卡片" instead of the UUID

#### Scenario: Deleted card shown as label in TripDetailPage

- **WHEN** an expense references a deleted card
- **THEN** the expense entry in TripDetailPage SHALL display "已刪除的卡片" for the card name

### Requirement: Payment method badge hidden in physical card mode

When `paymentMethod === 'physical'` is selected, the system SHALL NOT display any Apple Pay or Google Pay badge on any card row in the recommendation list, regardless of the card's `paymentMethodBonus` configuration.

#### Scenario: Badge absent when physical card is selected

- **WHEN** the user selects "實體卡" as the payment method
- **THEN** no Apple Pay or Google Pay badge SHALL appear on any card row

#### Scenario: Badge visible when Apple Pay is selected

- **WHEN** the user selects "Apple Pay" and a card supports Apple Pay bonus with remaining cap
- **THEN** the "Apple Pay" badge SHALL appear on that card's row
