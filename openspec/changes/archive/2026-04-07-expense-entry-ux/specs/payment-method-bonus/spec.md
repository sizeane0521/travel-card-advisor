## ADDED Requirements

### Requirement: Payment method bonus rate calculation

The system SHALL calculate the payment method bonus for a given card, payment method, amount, and set of trip expenses. Tiers are consumed in order; each tier has its own monthly cap tracked via `tripExpenses[].paymentMethodReward` totals.

Tiers with a `prerequisite` SHALL be included in the calculation only when `prerequisiteMet` is `true` OR when an explicit per-expense override is provided. The calculation function SHALL accept an optional `prerequisiteOverrides` parameter of type `Record<number, boolean>` where the key is the tier index. When an override is provided for a tier index, it SHALL take precedence over the tier's stored `prerequisiteMet` value.

#### Scenario: Tier without prerequisite always applies

- **WHEN** `calcPaymentMethodBonus` is called for a card with a tier `{ rate: 1.5, monthlyCap: 600, prerequisite: null }` and Apple Pay is selected
- **THEN** the tier SHALL contribute 1.5% to `bonusRate` regardless of `prerequisiteOverrides`

#### Scenario: Prerequisite tier applies only when override is true

- **WHEN** `calcPaymentMethodBonus` is called with `prerequisiteOverrides: { 1: true }` for a card where tier index 1 has `{ rate: 1.0, prerequisite: "前月帳單滿30000元" }`
- **THEN** that tier SHALL contribute 1.0% to `bonusRate`

#### Scenario: Prerequisite tier excluded when override is false or absent

- **WHEN** `calcPaymentMethodBonus` is called with no `prerequisiteOverrides` and a tier has `prerequisiteMet: false`
- **THEN** that tier SHALL NOT contribute to `bonusRate` or `bonusReward`

#### Scenario: Override does not mutate card data

- **WHEN** `calcPaymentMethodBonus` is called with `prerequisiteOverrides: { 1: true }`
- **THEN** the card object's `paymentMethodBonus.tiers[1].prerequisiteMet` SHALL remain unchanged after the call
