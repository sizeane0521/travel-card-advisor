# payment-method-bonus Specification

## Purpose

Define the data model, monthly cap tracking, and effective rate calculation for payment method bonuses (Apple Pay / Google Pay) on credit cards. Enables the system to recommend the optimal payment method per card and per expense.

## Requirements

### Requirement: PaymentMethodBonus data model

The system SHALL define a `PaymentMethodBonus` interface attached to the `Card` type. Each card MAY have at most one `paymentMethodBonus` entry. The bonus SHALL contain:
- `methods`: array of supported mobile payment methods (`'apple_pay' | 'google_pay'`), at least one value required
- `tiers`: array of `PaymentMethodBonusTier`, at least one tier required

Each `PaymentMethodBonusTier` SHALL contain:
- `rate`: additional reward rate in percent (e.g. `1.5` = 1.5%)
- `monthlyCap`: maximum NT$ reward this tier can contribute per calendar month
- `prerequisite` (optional): human-readable description of the condition required to qualify (e.g. "前月帳單達 3 萬元")
- `prerequisiteMet` (required when `prerequisite` is set): boolean declared by the user; when `false` or absent, this tier's rate SHALL NOT be included in the effective rate calculation

Cards without `paymentMethodBonus` SHALL be treated as physical-card-only and receive no payment method bonus.

#### Scenario: Card without paymentMethodBonus treated as physical-only

- **WHEN** a card has no `paymentMethodBonus` field
- **THEN** regardless of the user's selected payment method, no additional bonus rate SHALL be applied to that card

#### Scenario: Card with multiple tiers, all prerequisites met

- **WHEN** a card has `paymentMethodBonus.tiers = [{ rate: 1.5, monthlyCap: 600, prerequisiteMet: true }, { rate: 1.0, monthlyCap: 200, prerequisite: "前月帳單達3萬", prerequisiteMet: true }]`
- **THEN** the effective payment method bonus rate SHALL be 2.5% (sum of both tiers), subject to individual caps

#### Scenario: Card with multiple tiers, one prerequisite not met

- **WHEN** a card has two tiers and the second tier has `prerequisiteMet: false`
- **THEN** only the first tier's rate SHALL be included in the effective payment method bonus
- **THEN** the effective payment method bonus rate SHALL equal the first tier's rate only


<!-- @trace
source: payment-method-bonus
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
-->

---
### Requirement: Payment method bonus monthly cap tracking

The system SHALL track payment method bonus rewards earned per card per calendar month, per tier, using the `paymentMethodReward` field stored on each `Expense` record. The per-tier monthly cap SHALL be enforced independently: each tier's accrued reward for the current month SHALL NOT exceed its `monthlyCap`.

When computing the effective payment method bonus for a new expense:
1. For each eligible tier (prerequisite met or no prerequisite), compute `available = tier.monthlyCap - accrued_this_month_for_this_tier`
2. The tier's contribution to this expense = `min(floor(amount × tier.rate / 100), available)`
3. Total payment method bonus = sum of all tier contributions

#### Scenario: Tier monthly cap limits reward contribution

- **WHEN** a tier has `monthlyCap: 600` and the card has already earned NT$500 in payment method bonus from that tier this month, and the user logs NT$5000
- **THEN** that tier SHALL contribute at most NT$100 to the reward (not NT$75 from the full rate), and the cap SHALL be considered exhausted

#### Scenario: Second tier cap tracked independently

- **WHEN** a card has tier-1 (rate 1.5%, cap NT$600, exhausted) and tier-2 (rate 1%, cap NT$200, NT$0 used)
- **THEN** only tier-2 contributes to the new expense's payment method bonus

#### Scenario: No payment method bonus when method is physical

- **WHEN** user selects "實體卡" as the payment method for the expense
- **THEN** `paymentMethodReward` for the recorded expense SHALL be 0
- **THEN** no payment method bonus tier caps SHALL be consumed


<!-- @trace
source: payment-method-bonus
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
-->

---
### Requirement: Effective rate calculation with payment method bonus

The system SHALL compute the effective rate for a card as: `baseRate + storeBonusRate (if applicable) + paymentMethodBonusRate (if mobile pay selected and bonus not exhausted)`. The payment method bonus rate is excluded when:
- The card has no `paymentMethodBonus`
- The user selected "實體卡" (physical card)
- The selected payment method is not in the card's `paymentMethodBonus.methods`
- All eligible tiers' monthly caps are exhausted

#### Scenario: Effective rate includes mobile pay bonus

- **WHEN** a card has baseRate 2.5%, no store bonus, paymentMethodBonus tiers summing to 2.5% (both caps available), and user selects Apple Pay
- **THEN** the effective rate displayed in the recommendation list SHALL be 5.0%

#### Scenario: Effective rate excludes mobile pay bonus when method is physical

- **WHEN** a card has baseRate 2.5% and paymentMethodBonus 2.5%, and user selects "實體卡"
- **THEN** the effective rate SHALL be 2.5%

#### Scenario: Effective rate uses partial bonus when one tier cap is exhausted

- **WHEN** tier-1 (1.5%) is exhausted and tier-2 (1%) still has remaining cap, and user selects Apple Pay
- **THEN** the effective rate SHALL include only tier-2's contribution (1%)

<!-- @trace
source: payment-method-bonus
updated: 2026-04-07
code:
  - src/types/index.ts
  - src/lib/rewardCalc.ts
-->

<!-- @trace
source: payment-method-bonus
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
-->