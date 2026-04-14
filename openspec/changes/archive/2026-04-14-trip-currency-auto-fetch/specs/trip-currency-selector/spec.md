## ADDED Requirements

### Requirement: Popular country chip selector for trip currency

The trip creation form SHALL display five popular-destination chip buttons representing the currencies most commonly used by Taiwan travelers: JPY (Japan), KRW (South Korea), EUR (Europe), USD (United States), and THB (Thailand). The chips SHALL be rendered with country flag emoji and the ISO currency code as the label.

Selecting a chip SHALL set that chip's currency as the trip's `exchangeRate.currency`. Selecting an already-selected chip SHALL deselect it and clear the exchange rate, resulting in no `exchangeRate` stored on the trip (TWD-only mode). At most one chip SHALL be selected at a time.

#### Scenario: User selects JPY chip

- **WHEN** user taps the "🇯🇵 JPY" chip in the trip creation form
- **THEN** the JPY chip SHALL appear visually selected
- **THEN** the system SHALL initiate an exchange rate fetch (see: Trip currency exchange rate auto-fetch)
- **THEN** all other chips SHALL appear unselected

#### Scenario: User deselects the currently selected chip

- **WHEN** user taps the currently selected chip a second time
- **THEN** the chip SHALL become unselected
- **THEN** the exchange rate input field SHALL be cleared
- **THEN** no `exchangeRate` SHALL be stored when the trip is created

#### Scenario: User switches from one chip to another

- **WHEN** user has "🇯🇵 JPY" selected and then taps "🇰🇷 KRW"
- **THEN** the KRW chip SHALL become selected and JPY SHALL become unselected
- **THEN** the exchange rate input SHALL be updated with the KRW rate (from already-fetched data if available)

---

### Requirement: Trip currency exchange rate auto-fetch

When the user selects a currency chip for the first time in a session, the system SHALL fetch exchange rates from `https://open.er-api.com/v6/latest/TWD` via a single GET request. The system SHALL compute the rate as `round(1 / rates[currency], 4)` (i.e. how many TWD per 1 unit of foreign currency). The computed rate SHALL be automatically filled into the exchange rate input field.

The system SHALL perform at most one API call per form session: the full response SHALL be stored in component state (`allRates: Record<string, number>`). Subsequent chip selections SHALL look up rates from this cached state without triggering additional API calls.

While the fetch is in progress, the exchange rate input SHALL be disabled and a loading indicator SHALL be shown near the chip row. After the fetch succeeds, the input SHALL be re-enabled with the computed rate pre-filled.

If the fetch fails (network error or non-2xx response), the system SHALL display an inline error message "無法取得最新匯率，請手動輸入" below the chip row. The exchange rate input SHALL remain empty and editable, allowing the user to type the rate manually. The failure SHALL NOT prevent the trip creation form from being submitted.

#### Scenario: Fetch succeeds and rate is pre-filled

- **WHEN** user selects a chip and the API returns `{ "rates": { "JPY": 4.6820 } }`
- **THEN** the exchange rate input SHALL display `0.2136` (i.e. `round(1 / 4.6820, 4)`)
- **THEN** a hint text SHALL be shown: "已自動帶入最新參考匯率，可手動調整"

#### Scenario: Loading state during fetch

- **WHEN** user selects a chip and the fetch is in progress
- **THEN** the exchange rate input SHALL be disabled
- **THEN** a loading indicator SHALL be visible near the chip row

#### Scenario: Fetch fails

- **WHEN** user selects a chip and the API request fails or returns a non-2xx status
- **THEN** the error message "無法取得最新匯率，請手動輸入" SHALL be displayed below the chip row
- **THEN** the exchange rate input SHALL be empty and editable
- **THEN** the user SHALL still be able to create the trip by manually typing a rate or leaving it empty

#### Scenario: Second chip selection reuses cached rates

- **WHEN** user selects JPY (triggering a fetch) and then selects KRW
- **THEN** the system SHALL NOT make a second API call
- **THEN** the KRW rate SHALL be computed from the already-fetched `allRates` state

---

### Requirement: Manual override of auto-fetched exchange rate

After an exchange rate is auto-filled from the API, the user SHALL be able to edit the exchange rate input field to enter a different value. The manually entered value SHALL take precedence over the auto-fetched value. The hint text SHALL change to reflect that the rate has been manually modified.

#### Scenario: User overrides auto-fetched rate

- **WHEN** the system has auto-filled the rate with `0.2136`
- **AND** the user clears the field and types `0.22`
- **THEN** the trip SHALL be created with `exchangeRate: { currency: "JPY", rate: 0.22 }`

#### Scenario: User leaves rate empty after selecting a chip

- **WHEN** user selects a chip but clears the exchange rate input field before submitting
- **THEN** no `exchangeRate` SHALL be stored on the trip
- **THEN** the trip SHALL operate in TWD-only mode
