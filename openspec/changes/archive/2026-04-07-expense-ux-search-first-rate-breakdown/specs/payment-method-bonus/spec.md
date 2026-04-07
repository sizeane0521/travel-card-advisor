## ADDED Requirements

### Requirement: Rate breakdown data on CardAdvice

The system SHALL expose a `rateBreakdown` field on the `CardAdvice` interface, providing individual rate components so the UI can display each contribution separately.

`CardAdvice.rateBreakdown` SHALL contain:
- `base: number` — the card's `baseRate` (e.g. 2.5)
- `paymentMethod: number` — the sum of eligible payment method bonus tier rates (0 if physical card or no bonus applies)
- `store: number` — the store bonus rate actually applied (0 if no store selected, no matching bonus, or spend cap exceeded)

The three values SHALL satisfy: `base + paymentMethod + store === effectiveRate` for non-full cards.

For cards with `isFull: true`, `rateBreakdown` SHALL be `{ base: 0, paymentMethod: 0, store: 0 }`.

#### Scenario: Rate breakdown sums to effectiveRate

- **WHEN** `calcCardAdvice` returns for a card with base 2.5%, Apple Pay bonus 1.5%, and store bonus 3.0% applied
- **THEN** `rateBreakdown.base` SHALL be 2.5
- **THEN** `rateBreakdown.paymentMethod` SHALL be 1.5
- **THEN** `rateBreakdown.store` SHALL be 3.0
- **THEN** `rateBreakdown.base + rateBreakdown.paymentMethod + rateBreakdown.store` SHALL equal `effectiveRate` (7.0)

#### Scenario: No store bonus returns zero store breakdown

- **WHEN** no store is selected or the selected store has no matching bonus rule
- **THEN** `rateBreakdown.store` SHALL be 0

#### Scenario: Full card returns all-zero breakdown

- **WHEN** a card has `isFull: true`
- **THEN** `rateBreakdown` SHALL be `{ base: 0, paymentMethod: 0, store: 0 }`
