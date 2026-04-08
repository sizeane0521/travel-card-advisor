## ADDED Requirements

### Requirement: StoreBonus prerequisite mechanism

The `StoreBonus` interface SHALL support an optional `prerequisite` field (string) and an optional `prerequisiteMet` field (boolean). When `prerequisite` is defined and `prerequisiteMet` is not `true`, the store bonus SHALL be excluded from:
- Effective rate calculation in `calcCardAdvice`
- Reward computation in `calcExpenseReward`
- Bonus status panel display in LedgerPage
- Store bonus matching in `findStoreBonus`

When `prerequisite` is absent or `prerequisiteMet` is `true`, the store bonus SHALL behave as before (fully active).

The CalcPage expense entry form SHALL display a toggleable chip for each StoreBonus that has a `prerequisite`, within the card recommendation row. The chip SHALL show the prerequisite description and the bonus rate (e.g. "限新戶 (+5%)"). Toggling the chip SHALL update the effective rate and estimated reward immediately, similar to payment method prerequisite toggles.

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

#### Scenario: CalcPage shows prerequisite toggle for store bonus

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `rate: 5`
- **THEN** the card row SHALL display a toggleable chip "限新戶 (+5%)"
- **THEN** toggling the chip on SHALL include this bonus in effectiveRate and reward estimate

## MODIFIED Requirements

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

### Requirement: Bonus status panel in expense entry page

The system SHALL display a bonus status panel in the 明細 Tab (LedgerPage), below the expense list. The panel SHALL show the current utilization status of each store bonus rule AND each payment method bonus tier across all configured cards.

**Store bonus rows:**

For each StoreBonus with `cap > 0` and either no `prerequisite` or `prerequisiteMet === true`, the panel SHALL display:
- The card name and store bonus label (e.g. "聯邦吉鶴卡・熱門商店加碼")
- The reward amount used vs. reward cap (e.g. "NT$280 / NT$600")
- A visual progress bar reflecting `storeRewardUsed / cap`
- Whether the cap period is monthly or for the entire promotion period

StoreBonus entries with `prerequisite` defined and `prerequisiteMet !== true` SHALL NOT appear in the panel.

**Payment method bonus tier rows:**

For each card with `paymentMethodBonus`, and for each tier with `monthlyCap > 0`, the panel SHALL display:
- The card name and tier label (tier's `prerequisite` text, or "行動支付加碼" if no prerequisite)
- The reward amount used this month vs. monthly cap (e.g. "NT$94 / NT$600")
- A visual progress bar reflecting `tierRewardUsed / monthlyCap`
- "本月" as the period label

Payment method tiers with `prerequisite` defined and `prerequisiteMet !== true` SHALL NOT appear in the panel.

The panel SHALL only render when at least one qualifying row exists.

#### Scenario: Panel shows store bonus with reward cap values

- **WHEN** 吉鶴卡 has a store bonus with `cap: 600` (reward cap), and expenses have accumulated NT$280 in store bonus rewards
- **THEN** the panel SHALL show "NT$280 / NT$600" for that bonus
- **THEN** the progress bar SHALL reflect approximately 47% utilization

#### Scenario: Panel hides store bonus with unmet prerequisite

- **WHEN** 吉鶴卡 has a StoreBonus "新戶日本實體消費加碼" with `prerequisite: "限新戶"` and `prerequisiteMet: false`
- **THEN** that bonus SHALL NOT appear in the bonus status panel

#### Scenario: Panel shows payment method bonus tier progress

- **WHEN** 吉鶴卡 has a paymentMethodBonus tier with `monthlyCap: 600` and NT$94 has been accrued in `paymentMethodReward` this month
- **THEN** the panel SHALL show a row "聯邦吉鶴卡・行動支付加碼" with "NT$94 / NT$600"
- **THEN** the progress bar SHALL reflect approximately 16% utilization

#### Scenario: Panel hides payment method tier with unmet prerequisite

- **WHEN** a paymentMethodBonus tier has `prerequisite: "前月帳單滿30000元"` and `prerequisiteMet: false`
- **THEN** that tier SHALL NOT appear in the bonus status panel

#### Scenario: Panel hidden when no qualifying rows exist

- **WHEN** all store bonuses have `cap: 0` or unmet prerequisites, and all payment method tiers have `monthlyCap: 0` or unmet prerequisites
- **THEN** the bonus status panel SHALL NOT be rendered
