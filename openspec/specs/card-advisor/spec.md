# card-advisor Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

### Requirement: Store bonus proportional cap truncation

When computing the estimated reward for a store bonus, the system SHALL apply the bonus rate to the full expense amount, then cap the resulting reward at the remaining reward cap for that store bonus.

The remaining reward cap SHALL be computed as: `max(0, StoreBonus.cap - storeRewardUsed)`, where `storeRewardUsed` is the total store bonus reward already earned for that bonus rule in the current cap period. `storeRewardUsed` SHALL be computed by summing `expense.rewardBreakdown.store` for all matching expenses (same card, same bonus rule, within the cap period).

The store bonus reward for a single expense SHALL be: `min(floor(expense amount × rate / 100), remaining reward cap)`.

When `StoreBonus.cap === 0`, the bonus SHALL apply to the full expense amount with no truncation (unlimited).

The `storeBonusInfo` field on `CardAdvice` SHALL expose `{ bonus, storeRewardUsed }` instead of `{ bonus, storeSpend }`.

#### Scenario: Expense fully within remaining reward cap

- **WHEN** a store bonus has `cap: 600` (reward cap), `rate: 5`, and `storeRewardUsed: 200`
- **AND** the current expense is NT$5000
- **THEN** the uncapped store bonus reward SHALL be `floor(5000 × 5 / 100) = 250`
- **THEN** the remaining reward cap SHALL be `600 - 200 = 400`
- **THEN** the store bonus reward SHALL be `min(250, 400) = 250` (fully within cap)

#### Scenario: Expense partially within remaining reward cap

- **WHEN** a store bonus has `cap: 600`, `rate: 5`, and `storeRewardUsed: 500`
- **AND** the current expense is NT$5000
- **THEN** the uncapped store bonus reward SHALL be `floor(5000 × 5 / 100) = 250`
- **THEN** the remaining reward cap SHALL be `600 - 500 = 100`
- **THEN** the store bonus reward SHALL be `min(250, 100) = 100` (capped)
- **THEN** `breakdown.storeCapped` SHALL be `true`

#### Scenario: Reward cap already fully consumed

- **WHEN** a store bonus has `cap: 600` and `storeRewardUsed: 600` (or more)
- **THEN** the store bonus reward SHALL be NT$0

#### Scenario: Unlimited store bonus (cap === 0)

- **WHEN** a store bonus has `cap: 0`
- **THEN** the full expense amount SHALL be used for bonus rate calculation
- **THEN** no truncation SHALL occur


<!-- @trace
source: fix-bonus-display-and-toast
updated: 2026-04-08
code:
  - src/components/CardForm.tsx
  - src/pages/LedgerPage.tsx
  - src/types/index.ts
  - src/lib/rewardCalc.ts
  - src/lib/cardImport.ts
  - CLAUDE.md
  - src/pages/CalcPage.tsx
-->

---
### Requirement: Reward breakdown structure in calcExpenseReward

The `calcExpenseReward()` function SHALL return a `breakdown` object alongside the existing `estimatedReward` and `paymentMethodReward` fields.

The `breakdown` object SHALL contain:
- `base: number` — the NT$ reward from the base rate (before cap)
- `store: number` — the NT$ reward from the store bonus, after proportional truncation
- `paymentMethod: number` — the NT$ reward from the payment method bonus
- `storeCapped: boolean` — `true` if the store bonus was truncated due to cap
- `storeCapRemaining: number` — the remaining reward NT$ that could have been earned from the store bonus if not truncated; `0` if not capped

#### Scenario: Breakdown returned for a normal expense

- **WHEN** `calcExpenseReward()` is called for NT$2000 with base rate 2%, store bonus 5%, and no payment method bonus
- **THEN** `breakdown.base` SHALL be `floor(2000 × 0.02) = 40`
- **THEN** `breakdown.store` SHALL be `floor(2000 × 0.05) = 100`
- **THEN** `breakdown.paymentMethod` SHALL be `0`
- **THEN** `breakdown.storeCapped` SHALL be `false`

#### Scenario: Breakdown reflects truncation

- **WHEN** store bonus has `cap: 5000`, `storeSpend: 4800`, and the expense is NT$1000 with rate 5%
- **THEN** `breakdown.store` SHALL be `floor(200 × 0.05) = 10`
- **THEN** `breakdown.storeCapped` SHALL be `true`
- **THEN** `breakdown.storeCapRemaining` SHALL be `10` (the actual capped reward used)


<!-- @trace
source: fix-store-tags-reward-calc-and-warnings
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
-->

---
### Requirement: Operation warnings on Card type

The `Card` type SHALL support an optional `operationWarnings` field: an array of objects, each with `paymentMethod` (`'apple_pay' | 'google_pay'`) and `message` (string).

When present, the system SHALL surface these warnings to the UI when the user selects the corresponding payment method for a card recommendation.

#### Scenario: Card has no operation warnings

- **WHEN** a card's `operationWarnings` field is absent or empty
- **THEN** no warning message SHALL be displayed for that card in the recommendation list

#### Scenario: Card has a matching operation warning

- **WHEN** a card has `operationWarnings: [{ paymentMethod: "apple_pay", message: "結帳請告知感應信用卡，勿使用 QUICPay" }]` and the user selects Apple Pay
- **THEN** the warning message SHALL be visible within that card's row in the recommendation list

#### Scenario: Warning shown only for matching payment method

- **WHEN** a card has a warning for `apple_pay` only and the user selects Google Pay
- **THEN** no warning SHALL be displayed for that card

<!-- @trace
source: fix-store-tags-reward-calc-and-warnings
updated: 2026-04-07
code:
  - src/types/index.ts
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
### Requirement: Bonus status panel in expense entry page

The system SHALL display a bonus status panel in the 明細 Tab (LedgerPage), below the expense list. The panel SHALL show the current utilization status of each store bonus rule AND each payment method bonus tier across all configured cards.

**Store bonus rows:**

For each StoreBonus with `cap > 0` and either no `prerequisite` or `prerequisiteMet === true`, the panel SHALL display:
- The card name and store bonus label. The label SHALL be `StoreBonus.storeName` directly (without appending any suffix).
- The reward amount used vs. reward cap (e.g. "NT$280 / NT$600")
- A visual progress bar reflecting `storeRewardUsed / cap`
- Whether the cap period is monthly or for the entire promotion period

StoreBonus entries with `prerequisite` defined and `prerequisiteMet !== true` SHALL NOT appear in the panel.

**Payment method bonus tier rows:**

For each card with `paymentMethodBonus`, and for each tier with `monthlyCap > 0` and prerequisite met (or no prerequisite), the panel SHALL display:
- The card name and tier label. When a card has exactly one qualifying tier, the label SHALL be "行動支付加碼". When a card has two or more qualifying tiers, each label SHALL be "行動支付加碼 #N" where N is the 1-based sequence number among qualifying tiers (in tier array order).
- The reward amount used this month vs. monthly cap (e.g. "NT$94 / NT$600")
- A visual progress bar reflecting `tierRewardUsed / monthlyCap`
- "本月" as the period label

Payment method tiers with `prerequisite` defined and `prerequisiteMet !== true` SHALL NOT appear in the panel.

The panel SHALL only render when at least one qualifying row exists.

#### Scenario: Panel shows store bonus with reward cap values

- **WHEN** 吉鶴卡 has a store bonus with `storeName: "日本熱門商店加碼"`, `cap: 600`, and NT$280 accumulated in store bonus rewards
- **THEN** the panel SHALL show "日本熱門商店加碼" as the label (not "日本熱門商店加碼加碼")
- **THEN** the panel SHALL show "NT$280 / NT$600"
- **THEN** the progress bar SHALL reflect approximately 47% utilization

#### Scenario: Panel hides store bonus with unmet prerequisite

- **WHEN** 吉鶴卡 has a StoreBonus "新戶日本實體消費加碼" with `prerequisite: "限新戶"` and `prerequisiteMet: false`
- **THEN** that bonus SHALL NOT appear in the bonus status panel

#### Scenario: Panel shows single payment method bonus tier with generic label

- **WHEN** 吉鶴卡 has exactly one qualifying paymentMethodBonus tier with `monthlyCap: 600` and NT$94 accrued this month
- **THEN** the panel SHALL show "行動支付加碼" as the tier label
- **THEN** the panel SHALL show "NT$94 / NT$600"

#### Scenario: Panel shows multiple payment method bonus tiers with sequence labels

- **WHEN** 吉鶴卡 has two qualifying paymentMethodBonus tiers (both with met prerequisites or no prerequisite)
- **THEN** the first tier row SHALL display "行動支付加碼 #1"
- **THEN** the second tier row SHALL display "行動支付加碼 #2"

#### Scenario: Panel hides payment method tier with unmet prerequisite

- **WHEN** a paymentMethodBonus tier has `prerequisite: "前月帳單滿30000元"` and `prerequisiteMet: false`
- **THEN** that tier SHALL NOT appear in the bonus status panel

#### Scenario: Panel hidden when no qualifying rows exist

- **WHEN** all store bonuses have `cap: 0` or unmet prerequisites, and all payment method tiers have `monthlyCap: 0` or unmet prerequisites
- **THEN** the bonus status panel SHALL NOT be rendered


<!-- @trace
source: ui-five-optimizations
updated: 2026-04-10
code:
  - src/pages/CalcPage.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/SettingsPage.tsx
-->

---
### Requirement: StoreBonus prerequisite mechanism

The `StoreBonus` interface SHALL support an optional `prerequisite` field (string) and an optional `prerequisiteMet` field (boolean). When `prerequisite` is defined and `prerequisiteMet` is not `true`, the store bonus SHALL be excluded from:
- Effective rate calculation in `calcCardAdvice`
- Reward computation in `calcExpenseReward`
- Bonus status panel display in LedgerPage
- Store bonus matching in `findStoreBonus`

When `prerequisite` is absent or `prerequisiteMet` is `true`, the store bonus SHALL behave as before (fully active).

The CalcPage expense entry form SHALL NOT display any prerequisite toggle chips or buttons for StoreBonus entries. The prerequisite state (`prerequisiteMet`) is managed exclusively in SettingsPage (CardForm) and is applied directly in calculations. The card recommendation results in CalcPage SHALL reflect the current `prerequisiteMet` values without offering any in-place toggle.

The CardForm SHALL allow users to set `prerequisiteMet` for each StoreBonus that has a `prerequisite` field.

The AI card import prompt SHALL recognize store bonus prerequisites (e.g. "限新戶", "需登錄") and output them in the `storeRules[].prerequisite` field.

#### Scenario: StoreBonus with unmet prerequisite excluded from calculation

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `prerequisiteMet: false`
- **THEN** `findStoreBonus` SHALL NOT return this bonus for matching stores
- **THEN** the bonus rate SHALL NOT be included in `effectiveRate`
- **THEN** `calcExpenseReward` SHALL NOT compute any store bonus reward from this entry

#### Scenario: StoreBonus with met prerequisite included normally

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `prerequisiteMet: true`
- **THEN** the bonus SHALL behave identically to a StoreBonus without a prerequisite

#### Scenario: StoreBonus without prerequisite always active

- **WHEN** a card has a StoreBonus with no `prerequisite` field
- **THEN** the bonus SHALL always be included in calculations regardless of `prerequisiteMet`

#### Scenario: CalcPage does not show prerequisite toggle chips

- **WHEN** a card has any StoreBonus with a `prerequisite` field (regardless of `prerequisiteMet` value)
- **THEN** CalcPage SHALL NOT render any toggle chip or button for that prerequisite
- **THEN** the bonus inclusion is determined solely by the stored `prerequisiteMet` value

#### Scenario: CalcPage hides prerequisite toggle when prerequisiteMet is false

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `prerequisiteMet: false`
- **THEN** no toggle chip SHALL be rendered for that StoreBonus in CalcPage
- **THEN** the bonus SHALL be excluded from effectiveRate and reward estimate without any user interaction


<!-- @trace
source: ui-five-optimizations
updated: 2026-04-10
code:
  - src/pages/CalcPage.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/SettingsPage.tsx
-->

---
### Requirement: Expense record action button label

The button within each card recommendation row in CalcPage that records an expense SHALL be labeled "+明細".

#### Scenario: Button displays correct label

- **WHEN** the card recommendation list is rendered in CalcPage
- **THEN** each card row's record button SHALL display the text "+明細"

<!-- @trace
source: ui-five-optimizations
updated: 2026-04-10
code:
  - src/pages/CalcPage.tsx
  - src/pages/LedgerPage.tsx
  - src/pages/SettingsPage.tsx
-->

---
### Requirement: Reward total display takes visual priority over breakdown details

Within each card recommendation row in CalcPage, the layout SHALL be restructured to a horizontal design with the following sections:

**Recommendation badge (best recommendation only):**
The card with the highest effective rate that is not full SHALL display a "推薦" badge absolutely positioned at the top-left corner of the card container. The card container SHALL use `position: relative` and `overflow: hidden`. The badge SHALL be positioned with `position: absolute; top: 0; left: 0` and SHALL NOT occupy any flex or block space, ensuring all cards (with or without the badge) have identical content width and layout alignment. The badge SHALL have a gold/yellow background (`#c8901a`) and "推薦" text in dark color (`#0d0a06`). Cards that are NOT the top recommendation SHALL NOT display this badge.

**First row (card identity and action):**
A single horizontal row containing, in order:
1. Card name (`font-medium`, `text-[#f2e8c9]`, `flex-1`)
2. Payment method badge (Apple Pay / Google Pay — only when `paymentMethod !== 'physical'` and the badge applies)
3. Effective rate percentage (`text-lg font-bold`, gold color `#d4a017`; `0%` in red `#c0392b` if `isFull`)
4. "+刷卡" action button (`shrink-0`)

**Second row (rates and reward total):**
A horizontal row containing:
- Left: Rate breakdown text (`text-xs`, `#c8a060`) showing `基本X% + APX% + 店家X%` with `%` unit on each value (only when payment or store bonus is active)
- Right: Reward total `NT$XXX` (`text-2xl font-bold`, green `#4ade80`) — only shown when `twdAmount > 0` and `!isFull`

**Divider:** A horizontal separator line (only rendered when breakdown details exist).

**Detail row (below divider):**
A single line of text (`text-xs`, `#9a7040`) combining all non-zero reward components separated by ` | `:
- Format: `基本 {N} | {storeBonusLabel}加碼 {N} | 行動支付加碼 {N}`
- Only components with value > 0 SHALL be included
- Only shown when `twdAmount > 0` and breakdown exists

**Warnings (unchanged):** Store bonus cap warning and operation warning remain below the detail row.

**Progress bar:** Spend/reward progress bar for the top card remains below warnings.

#### Scenario: Best card displays absolute-positioned recommendation badge

- **WHEN** a card is the highest-reward non-full card in the list
- **THEN** a gold "推薦" badge SHALL be displayed at the top-left corner of the card using absolute positioning
- **THEN** the badge SHALL NOT occupy any flex layout space
- **THEN** all cards (with or without badge) SHALL have identical content area width

#### Scenario: Non-top card has no badge and no offset

- **WHEN** a card is NOT the highest-reward non-full card
- **THEN** no "推薦" badge SHALL be displayed
- **THEN** the card's content SHALL start from the left edge without any indentation

#### Scenario: First row shows card name, rate, and button in one line

- **WHEN** a card recommendation row is rendered with `effectiveRate: 7`
- **THEN** the card name, payment badge, "7%", and "+刷卡" button SHALL all appear on a single horizontal row

#### Scenario: Second row shows rate breakdown left and reward total right

- **WHEN** `twdAmount: 10000` and `breakdown: { base: 250, store: 300, paymentMethod: 150 }`
- **THEN** the second row SHALL show rate breakdown text on the left (e.g. "基本2.5% + AP1.5% + 店家3%")
- **THEN** "NT$700" SHALL appear on the right in large green text (`text-2xl font-bold`)

#### Scenario: Detail row shows items separated by pipe

- **WHEN** `breakdown: { base: 250, store: 300, paymentMethod: 150 }` and all values > 0
- **THEN** the detail row below the divider SHALL show "基本 250 | {store}加碼 300 | 行動支付加碼 150"

#### Scenario: Full card shows 0% without reward total

- **WHEN** a card's monthly cap is fully consumed (`isFull: true`)
- **THEN** the rate SHALL display "0%" in red
- **THEN** no reward total or detail rows SHALL be shown

<!-- @trace
source: calc-page-ux-improvements
updated: 2026-04-14
code:
  - src/pages/CalcPage.tsx
  - index.html
-->