## ADDED Requirements

### Requirement: Reward total display takes visual priority over breakdown details

Within each card recommendation row in CalcPage, the estimated reward total (e.g. `NT$734`) SHALL be displayed as the primary piece of information using large, high-contrast text. The breakdown details (base, store bonus, payment method bonus line items) SHALL be rendered as secondary information using smaller, lower-contrast text below the total.

Specifically:
- The reward total SHALL use at minimum `text-lg font-bold` and the primary reward color (`#4ade80`)
- Each breakdown line item SHALL use `text-xs` and a muted color (e.g. `#9a7040`) and SHALL be displayed on a separate line rather than concatenated into a single long string
- The rate breakdown (e.g. `基本2.5% + AP1.5% + 店家3%`) SHALL include `%` units on each rate value

#### Scenario: Reward total displayed prominently when amount is entered

- **WHEN** the user has entered a valid amount and a card's estimated reward is NT$734
- **THEN** the card row SHALL display "NT$734" in large green text as the dominant reward figure

#### Scenario: Breakdown details displayed as secondary lines

- **WHEN** a card has base reward NT$262, store bonus NT$315, and payment method bonus NT$157
- **THEN** each breakdown item SHALL appear on its own line in small muted text
- **THEN** the items SHALL NOT be concatenated into a single wrapping string

#### Scenario: Rate breakdown includes % unit on each value

- **WHEN** a card has `rateBreakdown: { base: 2.5, paymentMethod: 1.5, store: 3 }`
- **THEN** the rate breakdown text SHALL display "基本2.5% + AP1.5% + 店家3%" (with % on each value)
