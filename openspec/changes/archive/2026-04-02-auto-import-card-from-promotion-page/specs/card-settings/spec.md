## MODIFIED Requirements

### Requirement: Card configuration storage

The system SHALL allow users to configure up to 10 credit cards, each with a name, base overseas reward rate (%), monthly cap type (reward amount cap or spend amount cap), monthly cap value (in NTD), and an optional list of store-specific bonus rules. Cards SHALL be created either by manual form entry or by pre-filling from the URL import flow.

#### Scenario: Save card with base rate and monthly cap

- **WHEN** user enters a card name, base rate (e.g. 3.0%), cap type "reward", and cap amount (e.g. NT$3000), then saves
- **THEN** the card SHALL be persisted to localStorage and appear in the card list

#### Scenario: Save card with store bonus rule

- **WHEN** user adds a store bonus rule with store name, bonus rate (%), and spend cap (NTD), then saves
- **THEN** the store bonus rule SHALL be associated with the card and persisted

#### Scenario: Delete store bonus rule

- **WHEN** user removes a store bonus rule from a card
- **THEN** the rule SHALL be deleted and the card saved without it

#### Scenario: Open import from URL entry point

- **WHEN** user clicks the "Import from URL" button on the add card form
- **THEN** the system SHALL display a URL input field (and optionally a manual HTML fallback textarea)
- **THEN** the system SHALL initiate the card import flow defined in the card-import-from-url capability
