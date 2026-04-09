## ADDED Requirements

### Requirement: Payment method bonus tier row no-wrap layout

The tier display row within the payment method bonus section of CardForm SHALL render on a single line at all supported viewport widths (minimum 375px). The row element SHALL NOT include `flex-wrap` in its CSS. The rate input (`type="number"`), the separator label "% · 月上限 NT$", and the cap input SHALL always appear on the same line.

#### Scenario: Tier row renders inline at 375px

- **WHEN** a card with an existing `paymentMethodBonus` tier is opened in CardForm on a 375px viewport
- **THEN** the tier row SHALL display the rate input, label, and cap input on a single line without wrapping
