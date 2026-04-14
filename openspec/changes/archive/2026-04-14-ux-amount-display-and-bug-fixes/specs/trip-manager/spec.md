## ADDED Requirements

### Requirement: Trip card displays exchange rate info

When a trip has an `exchangeRate` set, the trip history card SHALL display the configured currency and rate in the card's statistics row. The display format SHALL be `{currency} · 匯率 {rate}` (e.g. `JPY · 匯率 0.21`). When no `exchangeRate` is set on the trip, this element SHALL NOT be rendered.

#### Scenario: Trip with exchange rate shows currency and rate on card

- **WHEN** a trip was created with `exchangeRate: { currency: "JPY", rate: 0.21 }`
- **THEN** the trip history card SHALL display "JPY · 匯率 0.21" in the statistics row

#### Scenario: Trip without exchange rate shows no currency info

- **WHEN** a trip was created without an exchange rate
- **THEN** the trip history card SHALL NOT display any currency or rate text
