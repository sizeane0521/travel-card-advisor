# card-settings Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: enhance-card-import-and-currency
updated: 2026-04-06
code:
  - src/lib/cardImport.ts
  - src/types/index.ts
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/store/storage.ts
  - src/pages/TripsPage.tsx
-->

---
### Requirement: Payment method bonus configuration in card form

The system SHALL allow users to configure a `paymentMethodBonus` for each card within the card creation and edit form (CardForm). The configuration SHALL include:
- A toggle or section to enable/disable payment method bonus for the card
- A checkbox group to select which mobile payment methods the bonus applies to (Apple Pay, Google Pay); at least one SHALL be required when the section is enabled
- A list of tiers, each with: bonus rate (%), monthly cap (NT$), optional prerequisite text, and (when prerequisite text is present) a checkbox for the user to declare whether the prerequisite is currently met
- Buttons to add and remove tiers

The card's `paymentMethodBonus` field SHALL be `undefined` when the section is disabled. When enabled with at least one tier, it SHALL be saved to the card.

CardForm SHALL display a reminder note adjacent to any prerequisite checkbox: "每月初請確認條件是否仍符合".

#### Scenario: Add payment method bonus with one unconditional tier

- **WHEN** user enables payment method bonus, selects "Apple Pay" and "Google Pay", adds one tier with rate 1.5% and monthly cap NT$600 (no prerequisite), and saves the card
- **THEN** the card SHALL be persisted with `paymentMethodBonus: { methods: ['apple_pay', 'google_pay'], tiers: [{ rate: 1.5, monthlyCap: 600 }] }`

#### Scenario: Add payment method bonus with conditional tier

- **WHEN** user adds a second tier with rate 1.0%, monthly cap NT$200, prerequisite "前月帳單達3萬元", and checks the prerequisite met checkbox, then saves
- **THEN** the tier SHALL be persisted with `{ rate: 1.0, monthlyCap: 200, prerequisite: "前月帳單達3萬元", prerequisiteMet: true }`

#### Scenario: Uncheck prerequisite condition

- **WHEN** user unchecks the prerequisite met checkbox for a tier and saves
- **THEN** the tier SHALL be persisted with `prerequisiteMet: false`
- **THEN** that tier's rate SHALL NOT be included in effective rate calculations

#### Scenario: Disable payment method bonus section

- **WHEN** user disables the payment method bonus section for a card and saves
- **THEN** the card SHALL be persisted with `paymentMethodBonus: undefined`
- **THEN** no mobile payment bonus SHALL apply to that card

<!-- @trace
source: payment-method-bonus
updated: 2026-04-07
code:
  - src/components/CardForm.tsx
  - src/types/index.ts
  - src/store/storage.ts
-->


<!-- @trace
source: payment-method-bonus
updated: 2026-04-07
code:
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
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

---
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

<!-- @trace
source: enhance-card-import-and-currency
updated: 2026-04-06
code:
  - src/lib/cardImport.ts
  - src/types/index.ts
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/store/storage.ts
  - src/pages/TripsPage.tsx
-->