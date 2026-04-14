## MODIFIED Requirements

### Requirement: Trip exchange rate setting

The system SHALL allow users to optionally set a fixed exchange rate when creating a new trip. The exchange rate SHALL be stored as `exchangeRate: { currency: string; rate: number }` on the `Trip` object. If no exchange rate is set, the trip operates in TWD-only mode.

The exchange rate input UI SHALL consist of two parts:
1. A currency chip selector showing five popular destinations: 🇯🇵 JPY, 🇰🇷 KRW, 🇪🇺 EUR, 🇺🇸 USD, 🇹🇭 THB
2. A numeric input field for the rate (1 foreign currency unit = NT$X), which is auto-filled after chip selection and remains manually editable

The `exchangeRate.currency` SHALL be set to the selected chip's ISO code (e.g. `"JPY"`, `"KRW"`). The `exchangeRate.rate` SHALL be the value in the numeric input at form submission time, parsed as a float. If the rate field is empty or invalid at submission, no `exchangeRate` SHALL be stored.

The previous behavior of a single freeform text input for JPY rate only IS replaced by this chip-based UI. The underlying `Trip.exchangeRate` data structure (`{ currency: string; rate: number }`) SHALL remain unchanged.

#### Scenario: Create trip with JPY exchange rate via chip

- **WHEN** user selects "🇯🇵 JPY" chip and the auto-fetched rate `0.2134` is filled in
- **THEN** the trip SHALL be saved with `exchangeRate: { currency: "JPY", rate: 0.2134 }`
- **THEN** the expense entry form for this trip SHALL switch to foreign currency input mode

#### Scenario: Create trip with KRW exchange rate via chip

- **WHEN** user selects "🇰🇷 KRW" chip and the rate `0.024` is in the input field
- **THEN** the trip SHALL be saved with `exchangeRate: { currency: "KRW", rate: 0.024 }`

#### Scenario: Create trip without exchange rate

- **WHEN** user creates a new trip without selecting any currency chip (or clears the rate input)
- **THEN** the trip SHALL be saved with no `exchangeRate` field
- **THEN** the expense entry form SHALL operate in TWD-only mode

#### Scenario: Exchange rate persisted across sessions

- **WHEN** user closes and reopens the app
- **THEN** the trip's exchange rate SHALL be restored from localStorage and the expense form SHALL remain in the correct input mode
