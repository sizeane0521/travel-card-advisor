## MODIFIED Requirements

### Requirement: Payment method bonus tier row no-wrap layout

The tier display row within the payment method bonus section of CardForm SHALL render on a single line at all supported viewport widths (minimum 375px). The row element SHALL NOT include `flex-wrap` in its CSS. The rate input (`type="number"`), the separator label "% · 月上限 NT$", and the cap input SHALL always appear on the same line.

The CalcPage prerequisite toggle display for `paymentMethodBonus` tiers SHALL follow these rules:
- A toggle chip SHALL only be rendered for tiers where `tier.prerequisite` is defined AND `tier.prerequisiteMet !== false`.
- Tiers with `prerequisiteMet === false` SHALL be excluded from the toggle list; they are permanently disabled and SHALL NOT contribute to effectiveRate regardless of session state.
- The outer wrapper `<div>` for prerequisite toggles SHALL only render when at least one tier satisfies the above condition.

#### Scenario: Tier row renders inline at 375px

- **WHEN** a card with an existing `paymentMethodBonus` tier is opened in CardForm on a 375px viewport
- **THEN** the tier row SHALL display the rate input, label, and cap input on a single line without wrapping

#### Scenario: CalcPage hides toggle for tier with prerequisiteMet false

- **WHEN** a paymentMethodBonus tier has `prerequisite: "前月帳單滿30000元"` and `prerequisiteMet: false`
- **THEN** no toggle chip SHALL be rendered for that tier in CalcPage
- **THEN** that tier SHALL NOT contribute to effectiveRate in CalcPage regardless of session overrides

#### Scenario: CalcPage shows toggle for tier with undefined prerequisiteMet

- **WHEN** a paymentMethodBonus tier has `prerequisite: "需登錄"` and `prerequisiteMet` is `undefined`
- **THEN** a toggle chip SHALL be rendered for that tier in CalcPage
- **THEN** the chip SHALL default to inactive (+) state until the user toggles it on
