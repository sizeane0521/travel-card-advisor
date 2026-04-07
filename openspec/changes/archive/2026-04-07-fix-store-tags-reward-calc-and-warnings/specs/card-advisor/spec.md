## ADDED Requirements

### Requirement: Store bonus proportional cap truncation

When computing the estimated reward for a store bonus, the system SHALL apply the bonus rate only to the portion of the expense amount that fits within the remaining spend cap for that store bonus.

The remaining spend cap SHALL be computed as: `max(0, StoreBonus.cap - storeSpend)`, where `storeSpend` is the total amount already spent at that store in the current cap period.

The eligible amount for the bonus rate SHALL be: `min(expense amount, remaining spend cap)`.

The store bonus reward SHALL be: `floor(eligible amount × rate / 100)`.

When `StoreBonus.cap === 0`, the bonus SHALL apply to the full expense amount with no truncation (unlimited).

#### Scenario: Expense fully within remaining cap

- **WHEN** a store bonus has `cap: 5000`, `storeSpend: 2000`, and the current expense is NT$1000
- **THEN** the eligible amount SHALL be NT$1000 (fully within the remaining NT$3000 cap)
- **THEN** the store bonus reward SHALL be `floor(1000 × rate / 100)`

#### Scenario: Expense partially within remaining cap

- **WHEN** a store bonus has `cap: 5000`, `storeSpend: 4800`, and the current expense is NT$1000
- **THEN** the eligible amount SHALL be NT$200 (the remaining cap before truncation)
- **THEN** the store bonus reward SHALL be `floor(200 × rate / 100)`
- **THEN** the `breakdown.storeCapped` field SHALL be `true`

#### Scenario: Cap already fully consumed

- **WHEN** a store bonus has `cap: 5000` and `storeSpend: 5000` (or more)
- **THEN** the eligible amount SHALL be NT$0
- **THEN** the store bonus reward SHALL be NT$0

#### Scenario: Unlimited store bonus (cap === 0)

- **WHEN** a store bonus has `cap: 0`
- **THEN** the full expense amount SHALL be used for bonus rate calculation
- **THEN** no truncation SHALL occur

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
