# card-settings Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: auto-import-card-from-promotion-page
updated: 2026-04-02
code:
  - src/lib/cardImport.ts
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/skills/spectra-audit/SKILL.md
  - AGENTS.md
  - .github/prompts/spectra-ingest.prompt.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - CLAUDE.md
  - .github/skills/spectra-archive/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/skills/spectra-apply/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - .opencode/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-propose/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .opencode/commands/spectra-audit.md
  - .opencode/skills/spectra-apply/SKILL.md
  - src/components/CardForm.tsx
  - .github/skills/spectra-ingest/SKILL.md
  - .opencode/skills/spectra-audit/SKILL.md
  - .github/skills/spectra-propose/SKILL.md
  - .opencode/skills/spectra-debug/SKILL.md
  - .opencode/commands/spectra-discuss.md
  - .github/prompts/spectra-audit.prompt.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - .opencode/commands/spectra-ingest.md
  - GEMINI.md
  - .github/prompts/spectra-debug.prompt.md
  - .cursorrules
  - .github/prompts/spectra-apply.prompt.md
  - src/pages/SettingsPage.tsx
  - .opencode/commands/spectra-debug.md
  - .github/prompts/spectra-archive.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .opencode/commands/spectra-apply.md
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-propose.md
  - .opencode/commands/spectra-archive.md
  - .github/prompts/spectra-ask.prompt.md
-->

---
### Requirement: Bank promotion page links

The system SHALL display a direct link to each card's bank promotion page, allowing users to quickly navigate to the official page to look up current terms.

#### Scenario: Open bank link

- **WHEN** user taps the bank link icon for a card
- **THEN** the system SHALL open the bank's promotion URL in a new browser tab

---
### Requirement: QR Code export of card settings

The system SHALL allow users to export all card configurations as a QR Code image. The QR Code SHALL encode the cards array as Base64-encoded JSON.

#### Scenario: Generate QR Code on desktop

- **WHEN** user clicks "Generate QR Code" on the settings page
- **THEN** the system SHALL render a scannable QR Code containing all current card configurations

#### Scenario: QR Code fits within capacity limits

- **WHEN** up to 10 cards with up to 10 store bonus rules each are configured
- **THEN** the generated QR Code SHALL be scannable by a standard phone camera

---
### Requirement: QR Code import of card settings

The system SHALL allow mobile users to import card configurations by scanning a QR Code. The import SHALL merge incoming cards into local storage without overwriting existing trip expense data.

#### Scenario: First-time import on mobile

- **WHEN** user scans the QR Code on mobile and the local card list is empty
- **THEN** all cards from the QR Code SHALL be saved to localStorage

#### Scenario: Re-import overwrites card settings only

- **WHEN** user scans a new QR Code on mobile that already has trip expense data
- **THEN** card configurations SHALL be replaced with the scanned data
- **THEN** existing trip and expense records SHALL remain unchanged

---
### Requirement: Data persistence across sessions

The system SHALL store all card configurations in the browser's localStorage under the key `travel-card-advisor-data`. Data SHALL persist across tab closes and browser restarts.

#### Scenario: Data survives tab close

- **WHEN** user closes the browser tab and reopens the app URL
- **THEN** all previously saved card configurations SHALL still be present

---
### Requirement: AI provider selection

The system SHALL allow users to select between Claude and Gemini as the AI provider for the card import feature.

#### Scenario: Select Claude as provider

- **WHEN** user selects Claude in the provider toggle on the settings page
- **THEN** the system SHALL display the Claude API key input field
- **THEN** all subsequent import operations in the session SHALL use the Claude API

#### Scenario: Select Gemini as provider

- **WHEN** user selects Gemini in the provider toggle on the settings page
- **THEN** the system SHALL display the Gemini API key input field with a note that Gemini has a free tier
- **THEN** all subsequent import operations in the session SHALL use the Gemini API

#### Scenario: Provider defaults to Gemini

- **WHEN** user opens the settings page for the first time in a session
- **THEN** the system SHALL default the provider selection to Gemini

<!-- @trace
source: add-gemini-support-and-secure-key-storage
updated: 2026-04-02
code:
  - src/pages/SettingsPage.tsx
  - GEMINI.md
  - CLAUDE.md
  - src/lib/cardImport.ts
  - AGENTS.md
  - src/App.tsx
  - src/lib/apiProviderContext.tsx
  - .cursorrules
  - src/components/CardForm.tsx
-->