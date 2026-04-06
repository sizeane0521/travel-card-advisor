## ADDED Requirements

### Requirement: Trip exchange rate setting

The system SHALL allow users to optionally set a fixed exchange rate when creating a new trip (e.g. 1 JPY = 0.22 TWD). The exchange rate SHALL be stored as `exchangeRate: { currency: string; rate: number }` on the `Trip` object. If no exchange rate is set, the trip operates in TWD-only mode.

#### Scenario: Create trip with JPY exchange rate

- **WHEN** user creates a new trip and enters currency "JPY" with rate 0.22
- **THEN** the trip SHALL be saved with `exchangeRate: { currency: "JPY", rate: 0.22 }`
- **THEN** the expense entry form for this trip SHALL switch to foreign currency input mode

#### Scenario: Create trip without exchange rate

- **WHEN** user creates a new trip and leaves the exchange rate field empty
- **THEN** the trip SHALL be saved with no `exchangeRate` field
- **THEN** the expense entry form SHALL operate in TWD-only mode (existing behavior)

#### Scenario: Exchange rate persisted across sessions

- **WHEN** user closes and reopens the app
- **THEN** the trip's exchange rate SHALL be restored from localStorage and the expense form SHALL remain in the correct input mode
