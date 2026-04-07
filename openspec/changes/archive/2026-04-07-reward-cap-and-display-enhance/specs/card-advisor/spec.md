## ADDED Requirements

### Requirement: Bonus status panel in expense entry page

The expense entry page SHALL display a bonus status panel below the expense list. The panel SHALL show the current utilization status of each store bonus rule across all configured cards.

For each StoreBonus with `cap > 0`, the panel SHALL display:
- The card name and store bonus label (e.g. "聯邦吉鶴卡・熱門商店加碼")
- The amount used vs. total cap (e.g. "NT$600 / NT$600")
- A visual progress bar reflecting `used / cap`
- Whether the cap period is monthly or for the entire promotion period

The panel SHALL only show store bonuses for cards that have at least one StoreBonus with `cap > 0`.

#### Scenario: Panel shows period cap status

- **WHEN** 吉鶴卡 has a store bonus with `cap: 20000`, `capPeriod: "period"`, and the user has spent NT$10,000 at matching stores across all trips within the card's validity period
- **THEN** the bonus status panel SHALL show "NT$10,000 / NT$20,000" for that bonus
- **THEN** the progress bar SHALL reflect 50% utilization

#### Scenario: Panel shows monthly cap reset

- **WHEN** a StoreBonus has `capPeriod: "monthly"` and it is a new calendar month
- **THEN** the displayed usage SHALL be NT$0 (reset)

#### Scenario: Panel hidden when no caps configured

- **WHEN** all configured cards have only uncapped store bonuses (`cap: 0`)
- **THEN** the bonus status panel SHALL NOT be rendered
