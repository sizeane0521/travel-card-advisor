## MODIFIED Requirements

### Requirement: StoreBonus prerequisite mechanism

The `StoreBonus` interface SHALL support an optional `prerequisite` field (string) and an optional `prerequisiteMet` field (boolean). When `prerequisite` is defined and `prerequisiteMet` is not `true`, the store bonus SHALL be excluded from:
- Effective rate calculation in `calcCardAdvice`
- Reward computation in `calcExpenseReward`
- Bonus status panel display in LedgerPage
- Store bonus matching in `findStoreBonus`

When `prerequisite` is absent or `prerequisiteMet` is `true`, the store bonus SHALL behave as before (fully active).

The CalcPage expense entry form SHALL display a toggleable chip for each StoreBonus that has a `prerequisite` AND `prerequisiteMet !== false`. StoreBonus entries with `prerequisiteMet === false` SHALL NOT render a toggle chip in CalcPage; they SHALL be treated as permanently disabled for the session. The chip SHALL show the prerequisite description and the bonus rate (e.g. "限新戶 (+5%)"). Toggling the chip on SHALL include this bonus in effectiveRate and reward estimate.

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

#### Scenario: CalcPage shows prerequisite toggle for store bonus with undefined or true prerequisiteMet

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `prerequisiteMet` is `true` or `undefined`
- **THEN** the card row SHALL display a toggleable chip "限新戶 (+5%)"
- **THEN** toggling the chip on SHALL include this bonus in effectiveRate and reward estimate

#### Scenario: CalcPage hides prerequisite toggle when prerequisiteMet is false

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `prerequisiteMet: false`
- **THEN** no toggle chip SHALL be rendered for that StoreBonus in CalcPage
- **THEN** the bonus SHALL be excluded from effectiveRate and reward estimate without any user interaction

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

---

## ADDED Requirements

### Requirement: Expense record action button label

The button within each card recommendation row in CalcPage that records an expense SHALL be labeled "+明細".

#### Scenario: Button displays correct label

- **WHEN** the card recommendation list is rendered in CalcPage
- **THEN** each card row's record button SHALL display the text "+明細"
