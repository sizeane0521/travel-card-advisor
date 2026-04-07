## ADDED Requirements

### Requirement: Payment method bonus tier progress data

The system SHALL expose per-tier progress data from `calcPaymentMethodBonus`, enabling the Advisor UI to render a separate progress bar for each payment method bonus tier.

`calcPaymentMethodBonus` SHALL return a `tierProgress: CapProgress[]` field in addition to `bonusRate` and `bonusReward`. Each entry in `tierProgress` SHALL correspond to one eligible tier (prerequisite met or no prerequisite) and SHALL contain:
- `type`: `'payment_method'`
- `label`: the tier's `prerequisite` text if present; otherwise `行動支付加碼 Tier N` (1-indexed)
- `current`: NT$ of that tier's monthlyCap already consumed this month
- `total`: the tier's `monthlyCap`
- `percentage`: `(current / total) * 100`

When the payment method is `'physical'` or not in the card's `methods`, `tierProgress` SHALL be an empty array.

Tiers that are skipped due to unmet prerequisites SHALL NOT appear in `tierProgress`.

#### Scenario: Single tier returns one progress entry

- **WHEN** `calcPaymentMethodBonus` is called with Apple Pay for a card with one eligible tier (`rate: 1.5%, monthlyCap: 600`) and NT$400 already consumed this month
- **THEN** `tierProgress` SHALL contain exactly one entry with `current: 400`, `total: 600`, `percentage: 66.67`, `type: 'payment_method'`

#### Scenario: Exhausted tier still appears in tierProgress

- **WHEN** a tier has `monthlyCap: 600` and NT$600 has been consumed (fully exhausted)
- **THEN** `tierProgress` SHALL include an entry for that tier with `percentage: 100`

#### Scenario: Physical payment returns empty tierProgress

- **WHEN** `calcPaymentMethodBonus` is called with `paymentMethod: 'physical'`
- **THEN** `tierProgress` SHALL be an empty array

#### Scenario: Prerequisite-unmet tier excluded from tierProgress

- **WHEN** a card has two tiers, the second with `prerequisiteMet: false`, and no override is provided
- **THEN** `tierProgress` SHALL contain only one entry (for the first tier)
