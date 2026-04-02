## ADDED Requirements

### Requirement: Card configuration storage

The system SHALL allow users to configure up to 10 credit cards, each with a name, base overseas reward rate (%), monthly cap type (reward amount cap or spend amount cap), monthly cap value (in NTD), and an optional list of store-specific bonus rules.

#### Scenario: Save card with base rate and monthly cap

- **WHEN** user enters a card name, base rate (e.g. 3.0%), cap type "reward", and cap amount (e.g. NT$3000), then saves
- **THEN** the card SHALL be persisted to localStorage and appear in the card list

#### Scenario: Save card with store bonus rule

- **WHEN** user adds a store bonus rule with store name, bonus rate (%), and spend cap (NTD), then saves
- **THEN** the store bonus rule SHALL be associated with the card and persisted

#### Scenario: Delete store bonus rule

- **WHEN** user removes a store bonus rule from a card
- **THEN** the rule SHALL be deleted and the card saved without it

### Requirement: Bank promotion page links

The system SHALL display a direct link to each card's bank promotion page, allowing users to quickly navigate to the official page to look up current terms.

#### Scenario: Open bank link

- **WHEN** user taps the bank link icon for a card
- **THEN** the system SHALL open the bank's promotion URL in a new browser tab

### Requirement: QR Code export of card settings

The system SHALL allow users to export all card configurations as a QR Code image. The QR Code SHALL encode the cards array as Base64-encoded JSON.

#### Scenario: Generate QR Code on desktop

- **WHEN** user clicks "Generate QR Code" on the settings page
- **THEN** the system SHALL render a scannable QR Code containing all current card configurations

#### Scenario: QR Code fits within capacity limits

- **WHEN** up to 10 cards with up to 10 store bonus rules each are configured
- **THEN** the generated QR Code SHALL be scannable by a standard phone camera

### Requirement: QR Code import of card settings

The system SHALL allow mobile users to import card configurations by scanning a QR Code. The import SHALL merge incoming cards into local storage without overwriting existing trip expense data.

#### Scenario: First-time import on mobile

- **WHEN** user scans the QR Code on mobile and the local card list is empty
- **THEN** all cards from the QR Code SHALL be saved to localStorage

#### Scenario: Re-import overwrites card settings only

- **WHEN** user scans a new QR Code on mobile that already has trip expense data
- **THEN** card configurations SHALL be replaced with the scanned data
- **THEN** existing trip and expense records SHALL remain unchanged

### Requirement: Data persistence across sessions

The system SHALL store all card configurations in the browser's localStorage under the key `travel-card-advisor-data`. Data SHALL persist across tab closes and browser restarts.

#### Scenario: Data survives tab close

- **WHEN** user closes the browser tab and reopens the app URL
- **THEN** all previously saved card configurations SHALL still be present
