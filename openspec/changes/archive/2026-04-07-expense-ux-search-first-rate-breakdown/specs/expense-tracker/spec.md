## MODIFIED Requirements

### Requirement: Record a single expense

The system SHALL allow users to record an expense by entering an amount and optionally selecting a store via a search input field. The system SHALL automatically select the highest-reward card based on the entered amount and selected store. The user SHALL be able to override the auto-selected card by tapping any other card in the inline recommendation list. The expense SHALL be timestamped with the current date and saved to the active trip.

When the active trip has an `exchangeRate` set (e.g. `{ currency: "JPY", rate: 0.22 }`):
- The expense entry form SHALL display a foreign currency input field (e.g. "金額（JPY）")
- The system SHALL convert the entered foreign amount to TWD by multiplying by the trip's exchange rate and rounding down to the nearest integer
- The system SHALL display the converted TWD amount in real time as the user types

The store selection area SHALL use a search-first interaction model:
- A text search input SHALL always be visible
- A "一般消費" chip SHALL always be visible and selected by default
- Store name chips SHALL only appear when the user has typed at least one character in the search input
- Chips displayed SHALL be filtered to those matching the search query (case-insensitive substring match)
- There SHALL be no default chip list, no "更多/收起" expand button, and no paginated chip display

#### Scenario: Store search shows chips only when typing

- **WHEN** the user has not typed anything in the store search box
- **THEN** only the "一般消費" chip SHALL be displayed; no store chips SHALL appear

#### Scenario: Store search filters as user types

- **WHEN** the user types "唐" in the store search box
- **THEN** only store names containing "唐" SHALL appear as chips (e.g. "唐吉軻德")
- **THEN** chips for non-matching stores SHALL NOT be displayed

#### Scenario: Clearing search resets to default

- **WHEN** the user clears the search input (via the × button or by deleting all text)
- **THEN** all store chips SHALL disappear and "一般消費" SHALL be the active selection

## ADDED Requirements

### Requirement: Reward rate breakdown display

The system SHALL display a breakdown of the effective reward rate for each card in the inline recommendation list, showing the individual contribution of each reward layer: base rate, payment method bonus, and store bonus.

The breakdown SHALL be shown as a compact secondary line below the effective rate percentage, only when at least one bonus layer (payment method or store) is active for that card.

Format: `基本{base} + AP{pm}` or `基本{base} + AP{pm} + 店家{store}` where:
- `{base}` = card's base rate (always shown in breakdown when breakdown is visible)
- `AP` label is used for Apple Pay; `GP` label is used for Google Pay
- `+ AP{pm}` is shown only when `paymentMethod > 0`
- `+ 店家{store}` is shown only when `store > 0`

When no bonus is active (both `paymentMethod === 0` and `store === 0`), the breakdown line SHALL NOT be rendered.

The breakdown data SHALL come from the `rateBreakdown` field on `CardAdvice`.

#### Scenario: All three layers active

- **WHEN** a card has base rate 2.5%, Apple Pay bonus 1.5%, and store bonus 3.0% all applying
- **THEN** the breakdown line SHALL display "基本2.5 + AP1.5 + 店家3.0"
- **THEN** the effective rate SHALL display "7.0%"

#### Scenario: Only base and payment method active

- **WHEN** no store is selected or no matching store bonus exists for the selected store
- **THEN** the breakdown line SHALL display "基本2.5 + AP1.5"
- **THEN** no "店家" segment SHALL appear in the breakdown

#### Scenario: Only base rate, no bonuses

- **WHEN** payment method is physical and no store bonus applies
- **THEN** the breakdown line SHALL NOT be rendered
- **THEN** only the effective rate percentage SHALL be displayed

#### Scenario: Store bonus cap exceeded hides store from breakdown

- **WHEN** a store bonus exists but its cap has been fully consumed this month
- **THEN** `rateBreakdown.store` SHALL be 0
- **THEN** the "店家" segment SHALL NOT appear in the breakdown line
