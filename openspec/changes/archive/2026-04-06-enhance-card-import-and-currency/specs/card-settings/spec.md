## MODIFIED Requirements

### Requirement: Card configuration storage

The system SHALL allow users to configure up to 10 credit cards, each with: a name, base overseas reward rate (%), monthly cap type (reward amount cap or spend amount cap), monthly cap value (in NTD), optional promotion validity dates (`validFrom`, `validTo` in YYYY-MM-DD format), and an optional list of store-specific bonus rules. Cards SHALL be created either by manual form entry or by pre-filling from the URL import flow.

Each store bonus rule SHALL contain:
- `storeName`: display name for the bonus category (e.g. "熱門商店")
- `stores`: array of actual store name strings that qualify for this bonus (e.g. ["唐吉訶德", "FamilyMart"]); SHALL be an empty array `[]` when no specific stores are listed
- `rate`: bonus reward rate (%)
- `cap`: spend cap amount in NTD (0 = no cap)
- `capPeriod`: "monthly" (cap resets each calendar month) or "period" (cap applies to the entire promotion validity period)

#### Scenario: Save card with base rate and monthly cap

- **WHEN** user enters a card name, base rate (e.g. 3.0%), cap type "reward", and cap amount (e.g. NT$3000), then saves
- **THEN** the card SHALL be persisted to localStorage and appear in the card list

#### Scenario: Save card with store bonus rule including store list

- **WHEN** user adds a store bonus rule with category name "熱門商店", stores ["唐吉訶德", "FamilyMart"], bonus rate 3%, spend cap NT$600, and capPeriod "period", then saves
- **THEN** the store bonus rule SHALL be associated with the card and persisted with all five fields

#### Scenario: Save card with promotion validity dates

- **WHEN** user enters validFrom "2026-01-01" and validTo "2026-06-30" for a card
- **THEN** the card SHALL be persisted with those dates and displayed in the card list

#### Scenario: Manually add store alias to existing rule

- **WHEN** user opens a card with a store bonus rule and adds "ドン・キホーテ" to the stores array for "熱門商店"
- **THEN** the updated stores array SHALL be persisted and used for store matching in recommendations

#### Scenario: Delete store alias from rule

- **WHEN** user removes "FamilyMart" from a store bonus rule's stores array
- **THEN** the rule's stores array SHALL be saved without "FamilyMart"

#### Scenario: Delete store bonus rule

- **WHEN** user removes a store bonus rule from a card
- **THEN** the rule SHALL be deleted and the card saved without it

#### Scenario: Open import from URL entry point

- **WHEN** user clicks the "Import from URL" button on the add card form
- **THEN** the system SHALL display a URL input field
- **THEN** the system SHALL initiate the card import flow defined in the card-import-from-url capability

## ADDED Requirements

### Requirement: Promotion expiry indicator

The system SHALL display a visual indicator on the card list when a card's promotion end date (`validTo`) is within 7 days of the current date or has already passed.

#### Scenario: Promotion expires within 7 days

- **WHEN** today's date is within 7 days before a card's `validTo`
- **THEN** the card entry in the settings list SHALL display a warning label (e.g. "即將到期")

#### Scenario: Promotion already expired

- **WHEN** today's date is after a card's `validTo`
- **THEN** the card entry in the settings list SHALL display an expired label (e.g. "活動已結束")

#### Scenario: No validTo set

- **WHEN** a card has no `validTo` date
- **THEN** no expiry indicator SHALL be shown for that card
