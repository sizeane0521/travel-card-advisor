## MODIFIED Requirements

### Requirement: Activity-period cap tracking

The system SHALL track store bonus caps with `capPeriod: "period"` across the entire promotion validity period of the card (from `Card.validFrom` to `Card.validTo`), not just the current calendar month.

For a store bonus rule with `capPeriod: "period"`, the system SHALL sum all expenses matching that store bonus across **all trips** where `expense.date >= Card.validFrom AND expense.date <= Card.validTo`, regardless of which trip the expense belongs to. Once the activity-period cap is exhausted across all trips within the validity period, the bonus rate SHALL no longer apply for that store rule.

For a store bonus rule with `capPeriod: "monthly"`, existing monthly-reset behavior SHALL apply unchanged.

When `Card.validFrom` or `Card.validTo` is absent, the system SHALL fall back to summing across all trips with no date filter.

#### Scenario: Period cap accumulates across multiple trips

- **WHEN** a store bonus rule has `capPeriod: "period"` with `cap: 20000` (spend cap), Card.validFrom = "2026-01-01", Card.validTo = "2026-06-30"
- **AND** Trip A (January) has NT$12,000 in matching store expenses for this card
- **AND** Trip B (March) is now active with NT$0 previously spent
- **THEN** the remaining spend cap for Trip B SHALL be NT$8,000 (not reset to NT$20,000)

#### Scenario: Period cap accumulates across months within a trip

- **WHEN** a store bonus rule has `capPeriod: "period"` with `cap: 20000` and the user has already spent NT$15,000 at matching stores in January of the active trip
- **THEN** in February of the same trip, the remaining cap SHALL be NT$5,000 (not reset to NT$20,000)

#### Scenario: Monthly cap resets each month

- **WHEN** a store bonus rule has `capPeriod: "monthly"` with `cap: 20000`
- **THEN** at the start of a new calendar month, the accumulated spend for that rule SHALL reset to zero

#### Scenario: Period cap with no validFrom/validTo falls back to all trips

- **WHEN** a card has `capPeriod: "period"` store bonus and `validFrom` / `validTo` are absent
- **THEN** the system SHALL sum matching expenses across all trips with no date filter

---

## ADDED Requirements

### Requirement: Expense record reward breakdown display

Each expense record in the trip expense list SHALL display the effective reward rate percentage and a three-part reward breakdown showing the NT$ contribution of each active layer: base, store bonus, and payment method bonus.

The expense record SHALL show:
- The effective rate as a percentage (e.g. "7%")
- A breakdown line in the format: `回饋 NT${total} = 基本 NT${base} + {storeName}加碼 NT${store} + 行動支付加碼 NT${pm}`
- Segments with zero value SHALL be omitted from the breakdown line
- When only the base reward applies, the display SHALL show `回饋 NT${total}` with no breakdown

The breakdown data SHALL be sourced from the `Expense.rewardBreakdown` field stored at the time of logging. When `rewardBreakdown` is absent (legacy records), the record SHALL show only `回饋 NT${estimatedReward}` with no breakdown or rate.

The `Expense` interface SHALL be extended with an optional field: `rewardBreakdown?: { base: number; store: number; paymentMethod: number; effectiveRate: number }`.

#### Scenario: Expense record shows full breakdown

- **WHEN** an expense was logged with base 2.5%, Apple Pay 1.5%, store 3%, total NT$6,375
- **THEN** the record SHALL display "7%" as the rate
- **THEN** the record SHALL display "回饋 NT$6,375 = 基本 NT$2,625 + 熱門商店加碼 NT$600 + 行動支付加碼 NT$1,575"

#### Scenario: Legacy expense record shows only total

- **WHEN** an expense has `estimatedReward: 500` and `rewardBreakdown` is absent
- **THEN** the record SHALL display "回饋 NT$500" with no breakdown segments and no rate percentage
