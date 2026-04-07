## MODIFIED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering an amount and optionally selecting a store via a search input field. The system SHALL automatically select the highest-reward card based on the entered amount and selected store. The user SHALL be able to override the auto-selected card by tapping any other card in the inline recommendation list. The expense SHALL be timestamped with the current date and saved to the active trip.

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

## ADDED Requirements

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
