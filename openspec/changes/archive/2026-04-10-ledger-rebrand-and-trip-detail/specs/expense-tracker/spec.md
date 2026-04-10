## MODIFIED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering an amount and optionally selecting a store via a search input field. The system SHALL automatically select the highest-reward card based on the entered amount and selected store. The expense entry form SHALL reside in the 試算 Tab (CalcPage).

Each card row in the inline recommendation list SHALL display a「+刷卡」inline action button. Tapping the「+刷卡」button on a card row SHALL record the expense using that card — no separate global submit button is required.

When the user taps「+刷卡」on a card row:
- If the amount field is empty or invalid (not a positive integer), the system SHALL display a validation error message "請輸入正整數金額" and SHALL NOT record the expense
- If the amount is valid, the system SHALL compute and dispatch the expense identically to the previous submit behavior, using the tapped card's ID, the current store, payment method, and prerequisite overrides
- After a successful record, the form SHALL reset: amount and store inputs SHALL be cleared; the selected payment method, selectedCardId, AND `prereqOverrides` SHALL be preserved (NOT cleared)
- The system SHALL display a toast notification at the top of the page showing the reward breakdown for the recorded expense. The toast SHALL auto-dismiss after 3 seconds. The toast content SHALL follow the format: "已記帳！回饋 NT${total} = 基本 NT${base} + {storeName}加碼 NT${store} + 行動支付加碼 NT${pm}". Segments with zero value SHALL be omitted. When only base reward applies, the toast SHALL show "已記帳！回饋 NT${total}"
- The user SHALL remain on the 試算 Tab after submission (no automatic tab switch)

The「+刷卡」button SHALL be disabled (not tappable) when `card.isFull === true`.

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

#### Scenario: Toast shown after successful record

- **WHEN** user enters NT$6300 at 7-ELEVEN with Apple Pay on 吉鶴卡 (base NT$157, 行動支付加碼 NT$94) and taps「+刷卡」
- **THEN** a toast SHALL appear at the top of the page: "已記帳！回饋 NT$251 = 基本 NT$157 + 行動支付加碼 NT$94"
- **THEN** the toast SHALL auto-dismiss after 3 seconds

#### Scenario: Toast with only base reward

- **WHEN** user records an expense with only base reward NT$60 and no bonuses
- **THEN** the toast SHALL show "已記帳！回饋 NT$60"

#### Scenario: prereqOverrides preserved after record

- **WHEN** user has toggled a payment method prerequisite chip (e.g. "前月帳單滿30000元 (+1%)") and taps「+刷卡」
- **THEN** the prerequisite override state SHALL be preserved after the record is submitted

---

## ADDED Requirements

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
