## MODIFIED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering an amount and optionally selecting a store via a search input field. The system SHALL automatically select the highest-reward card based on the entered amount and selected store. The expense entry form SHALL reside in the 試算 Tab (CalcPage).

Each card row in the inline recommendation list SHALL display a「+記帳」inline action button. Tapping the「+記帳」button on a card row SHALL record the expense using that card — no separate global submit button is required. The global「◆ 記錄消費」submit button SHALL be removed.

When the user taps「+記帳」on a card row:
- If the amount field is empty or invalid (not a positive integer), the system SHALL display a validation error message "請輸入正整數金額" and SHALL NOT record the expense
- If the amount is valid, the system SHALL compute and dispatch the expense identically to the previous submit behavior, using the tapped card's ID, the current store, payment method, and prerequisite overrides
- After a successful record, the form SHALL reset: amount and store inputs SHALL be cleared, `prereqOverrides` SHALL be cleared; the selected payment method and selectedCardId SHALL be preserved
- The user SHALL remain on the 試算 Tab after submission (no automatic tab switch)

The「+記帳」button SHALL be disabled (not tappable) when `card.isFull === true`.

When the active trip has an `exchangeRate` set (e.g. `{ currency: "JPY", rate: 0.22 }`):
- The expense entry form SHALL display a foreign currency input field (e.g. "金額（JPY）")
- The system SHALL convert the entered foreign amount to TWD by multiplying by the trip's exchange rate and rounding down to the nearest integer
- The system SHALL display the converted TWD amount in real time as the user types

The store selection area SHALL use a search-first interaction model:
- A text search input SHALL always be visible
- A "一般消費" chip SHALL always be visible and selected by default
- Store name chips SHALL only appear when the user has typed at least one character in the search input
- Chips displayed SHALL be filtered to those matching the search query (case-insensitive substring match)
- Store name chips SHALL only contain names sourced from `StoreBonus.stores[]` arrays — the `StoreBonus.storeName` field (bonus category label) SHALL NOT appear as a chip
- There SHALL be no default chip list, no "更多/收起" expand button, and no paginated chip display

#### Scenario: Record expense via per-card button

- **WHEN** user enters NT$1500 in the amount field and taps「+記帳」on Card A
- **THEN** the system SHALL record the expense using Card A's ID, the current store, and payment method
- **THEN** the amount and store fields SHALL be cleared
- **THEN** the user SHALL remain on the 試算 Tab

#### Scenario: Per-card button disabled when card is full

- **WHEN** Card A has `isFull: true`
- **THEN** the「+記帳」button on Card A's row SHALL be disabled and non-interactive

#### Scenario: Validation error when amount is empty

- **WHEN** user taps「+記帳」on any card row with an empty or zero amount field
- **THEN** the system SHALL display "請輸入正整數金額" validation error
- **THEN** no expense SHALL be recorded

#### Scenario: Form stays on 試算 Tab after submission

- **WHEN** user successfully records an expense via「+記帳」
- **THEN** the active tab SHALL remain 試算
- **THEN** the recommendation list SHALL recalculate immediately (reflecting the new monthly spend)

#### Scenario: Store search shows chips only when typing

- **WHEN** the user has not typed anything in the store search box
- **THEN** only the "一般消費" chip SHALL be displayed; no store chips SHALL appear

#### Scenario: Store search filters as user types

- **WHEN** the user types "唐" in the store search box
- **THEN** only store names containing "唐" SHALL appear as chips (e.g. "唐吉軻德")
- **THEN** chips for non-matching stores SHALL NOT be displayed

#### Scenario: Clearing search resets to default

- **WHEN** the user clears the search input (via the × button or by deleting all text)
- **THEN** all store chips SHALL disappear and "一般消費" SHALL be the active selection

#### Scenario: Promotional bonus labels do not appear as store chips

- **WHEN** a card has a `StoreBonus` with `storeName: "行動支付加碼"` and `stores: ["7-ELEVEN"]`
- **THEN** the chip "行動支付加碼" SHALL NOT appear in the store search results
- **THEN** the chip "7-ELEVEN" SHALL appear when the user types a matching query

---

## MODIFIED Requirements

### Requirement: Expense list view

The system SHALL display a chronological list of all expenses within the active trip, showing date, store, card name, amount, and estimated reward for each entry. The expense list SHALL reside in the 明細 Tab (LedgerPage), not in the same view as the expense entry form.

#### Scenario: Expense list shown in 明細 Tab

- **WHEN** user navigates to the 明細 Tab
- **THEN** all expenses belonging to the active trip SHALL be displayed in reverse chronological order

#### Scenario: Expense list not shown in 試算 Tab

- **WHEN** user is on the 試算 Tab
- **THEN** the expense list SHALL NOT be rendered in that view

---

## MODIFIED Requirements

### Requirement: Trip expense count summary

The 明細 Tab header SHALL display the total number of expense records in the active trip as a summary badge (e.g. "本次旅程 N 筆"). The count SHALL update immediately after each expense is added or deleted. The count SHALL NOT appear in the 試算 Tab header.

#### Scenario: Count shown in 明細 Tab header

- **WHEN** the active trip has 3 recorded expenses and the user is on the 明細 Tab
- **THEN** the page header area SHALL display "本次旅程 3 筆"

#### Scenario: Count not shown in 試算 Tab header

- **WHEN** the user is on the 試算 Tab
- **THEN** the trip expense count badge SHALL NOT be rendered
