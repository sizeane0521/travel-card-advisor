## ADDED Requirements

### Requirement: Payment method bonus configuration in card form

The system SHALL allow users to configure a `paymentMethodBonus` for each card within the card creation and edit form (CardForm). The configuration SHALL include:
- A toggle or section to enable/disable payment method bonus for the card
- A checkbox group to select which mobile payment methods the bonus applies to (Apple Pay, Google Pay); at least one SHALL be required when the section is enabled
- A list of tiers, each with: bonus rate (%), monthly cap (NT$), optional prerequisite text, and (when prerequisite text is present) a checkbox for the user to declare whether the prerequisite is currently met
- Buttons to add and remove tiers

The card's `paymentMethodBonus` field SHALL be `undefined` when the section is disabled. When enabled with at least one tier, it SHALL be saved to the card.

CardForm SHALL display a reminder note adjacent to any prerequisite checkbox: "每月初請確認條件是否仍符合".

#### Scenario: Add payment method bonus with one unconditional tier

- **WHEN** user enables payment method bonus, selects "Apple Pay" and "Google Pay", adds one tier with rate 1.5% and monthly cap NT$600 (no prerequisite), and saves the card
- **THEN** the card SHALL be persisted with `paymentMethodBonus: { methods: ['apple_pay', 'google_pay'], tiers: [{ rate: 1.5, monthlyCap: 600 }] }`

#### Scenario: Add payment method bonus with conditional tier

- **WHEN** user adds a second tier with rate 1.0%, monthly cap NT$200, prerequisite "前月帳單達3萬元", and checks the prerequisite met checkbox, then saves
- **THEN** the tier SHALL be persisted with `{ rate: 1.0, monthlyCap: 200, prerequisite: "前月帳單達3萬元", prerequisiteMet: true }`

#### Scenario: Uncheck prerequisite condition

- **WHEN** user unchecks the prerequisite met checkbox for a tier and saves
- **THEN** the tier SHALL be persisted with `prerequisiteMet: false`
- **THEN** that tier's rate SHALL NOT be included in effective rate calculations

#### Scenario: Disable payment method bonus section

- **WHEN** user disables the payment method bonus section for a card and saves
- **THEN** the card SHALL be persisted with `paymentMethodBonus: undefined`
- **THEN** no mobile payment bonus SHALL apply to that card
