## MODIFIED Requirements

### Requirement: Bank promotion page links

The system SHALL display a direct link to each card's bank promotion page, allowing users to quickly navigate to the official page to look up current terms.

The CardForm edit form SHALL also display a "前往活動頁面 ↗" anchor link below the `bankUrl` input field when `bankUrl` is non-empty.

When a card is imported via URL (import panel), the `bankUrl` field SHALL be automatically populated with the import source URL if `bankUrl` was previously empty.

#### Scenario: Open bank link from card list

- **WHEN** user taps the bank link icon for a card in the settings list
- **THEN** the system SHALL open the bank's promotion URL in a new browser tab

#### Scenario: Import URL auto-fills bankUrl field

- **WHEN** user imports a card via the URL import panel and the card's `bankUrl` is currently empty
- **THEN** after import completes, the `bankUrl` input in CardForm SHALL be populated with the import source URL

#### Scenario: bankUrl already set is not overwritten on import

- **WHEN** user imports via URL but the card already has a non-empty `bankUrl`
- **THEN** the existing `bankUrl` SHALL remain unchanged

#### Scenario: "前往活動頁面" link appears when bankUrl is set

- **WHEN** the CardForm `bankUrl` input contains a non-empty URL
- **THEN** a "前往活動頁面 ↗" link SHALL appear below the input field
- **THEN** clicking the link SHALL open the URL in a new browser tab

#### Scenario: No link when bankUrl is empty

- **WHEN** the CardForm `bankUrl` input is empty
- **THEN** no "前往活動頁面" link SHALL be rendered

---

### Requirement: New-user bonus as independent card field

The system SHALL store new-user-only bonus rules in a separate `newUserBonus?: StoreBonus[]` field on the `Card` type, distinct from `storeBonus`. Each entry in `newUserBonus` SHALL use the same `StoreBonus` structure (storeName, stores, rate, cap, capPeriod, subCategories, prerequisite, prerequisiteMet) as store bonuses.

The `prerequisite` field on new-user bonus entries SHALL be optional and NOT automatically assigned. When adding a new-user bonus entry manually via CardForm, no `prerequisite` value SHALL be auto-populated. When importing new-user bonus entries via AI import, only a `prerequisite` value explicitly identified in the source content SHALL be set; the system SHALL NOT inject a default "限新戶" string.

The CardForm SHALL display a dedicated "新戶加碼" section above the "特定店家加碼" section. The section SHALL use the same card panel layout, action buttons, and prerequisite toggle as store bonuses. Users SHALL be able to add, delete, and edit new-user bonus entries independently.

The reward calculation engine SHALL search `[...card.storeBonus, ...(card.newUserBonus ?? [])]` when matching a store name to a bonus rule, using identical eligibility logic (`prerequisiteMet` check).

#### Scenario: New-user bonus imported from URL is displayed in its own section

- **WHEN** user imports a card whose bank page contains a new-user bonus category
- **THEN** the new-user bonus SHALL appear in the "新戶加碼" section of CardForm
- **THEN** the new-user bonus SHALL NOT appear in the "特定店家加碼" section
- **THEN** the card SHALL be saved with `newUserBonus` containing that entry

#### Scenario: Manually added new-user bonus has no auto prerequisite

- **WHEN** user fills the "新增新戶加碼" form and submits
- **THEN** the new entry SHALL be added to `newUserBonus` with no `prerequisite` field set by default

#### Scenario: New-user bonus participates in reward calculation when prerequisite is met

- **WHEN** a card has a `newUserBonus` entry with `prerequisiteMet: true` for a matching store
- **THEN** the reward calculation SHALL include the new-user bonus rate for that store
- **THEN** the cap tracking SHALL apply to the new-user bonus using its own `cap` and `capPeriod`

#### Scenario: New-user bonus is excluded when prerequisite is not met

- **WHEN** a card has a `newUserBonus` entry with `prerequisiteMet: false` for a matching store
- **THEN** the reward calculation SHALL NOT include the new-user bonus rate

#### Scenario: Existing cards without newUserBonus field remain functional

- **WHEN** a card persisted before this change is loaded (no `newUserBonus` field)
- **THEN** the system SHALL treat `newUserBonus` as an empty array

## ADDED Requirements

### Requirement: Collapsible add-bonus form in CardForm

The "add new bonus" form at the bottom of each bonus section (新戶加碼 and 特定店家加碼) in CardForm SHALL be hidden by default and revealed only when the user explicitly triggers it.

Each section SHALL display a "＋ 新增加碼" button (or "＋ 新增新戶加碼" for the 新戶加碼 section) when the form is hidden. Clicking the button SHALL expand the add form. After the user submits a new bonus entry, the form SHALL automatically collapse. The user SHALL also be able to collapse the form without submitting.

#### Scenario: Add form is hidden on section load

- **WHEN** CardForm renders a bonus section (新戶加碼 or 特定店家加碼)
- **THEN** the add-bonus form SHALL NOT be visible by default
- **THEN** a "＋ 新增加碼" button SHALL be visible at the bottom of the section

#### Scenario: Form expands on button click

- **WHEN** user clicks "＋ 新增加碼"
- **THEN** the add-bonus form SHALL become visible
- **THEN** the trigger button SHALL be hidden or replaced by the expanded form

#### Scenario: Form auto-collapses after submission

- **WHEN** user fills the add form fields and clicks "新增"
- **THEN** the new bonus entry SHALL be added to the list
- **THEN** the add form SHALL collapse automatically
- **THEN** the "＋ 新增加碼" button SHALL reappear

---

### Requirement: Payment method bonus configuration in card form

The system SHALL allow users to configure a `paymentMethodBonus` for each card within the card creation and edit form (CardForm). The configuration SHALL include:
- A toggle or section to enable/disable payment method bonus for the card
- A checkbox group to select which mobile payment methods the bonus applies to (Apple Pay, Google Pay); at least one SHALL be required when the section is enabled
- A list of tiers, each with: bonus rate (%), monthly cap (NT$), optional prerequisite text, and (when prerequisite text is present) a checkbox for the user to declare whether the prerequisite is currently met
- Buttons to add and remove tiers

The card's `paymentMethodBonus` field SHALL be `undefined` when the section is disabled. When enabled with at least one tier, it SHALL be saved to the card.

CardForm SHALL display a reminder note adjacent to any prerequisite checkbox: "每月初請確認條件是否仍符合".

Each tier display row (showing rate % and monthly cap NT$) SHALL render on a single line without wrapping on viewports as narrow as 375px. The row SHALL NOT use `flex-wrap`. The rate input, separator label "% · 月上限 NT$", and cap input SHALL all appear inline.

#### Scenario: Add payment method bonus with one unconditional tier

- **WHEN** user enables payment method bonus, selects "Apple Pay" and "Google Pay", adds one tier with rate 1.5% and monthly cap NT$600 (no prerequisite), and saves the card
- **THEN** the card SHALL be persisted with `paymentMethodBonus: { methods: ['apple_pay', 'google_pay'], tiers: [{ rate: 1.5, monthlyCap: 600 }] }`

#### Scenario: Add payment method bonus with conditional tier

- **WHEN** user adds a second tier with rate 1.0%, monthly cap NT$200, prerequisite "前月帳單達3萬元", and checks the prerequisite met checkbox, then saves
- **THEN** the tier SHALL be persisted with `{ rate: 1.0, monthlyCap: 200, prerequisite: "前月帳單達3萬元", prerequisiteMet: true }`

#### Scenario: Tier row does not wrap at 375px

- **WHEN** CardForm renders an existing payment method bonus tier on a 375px wide viewport
- **THEN** the rate input, "% · 月上限 NT$" label, and cap input SHALL appear on a single line
- **THEN** no line wrapping SHALL occur within the tier row

---

### Requirement: Card edit page header title centering

The "編輯卡片" / "新增卡片" heading in CardForm SHALL be horizontally centered within the page header, regardless of the position of the back button on the left.

The back button SHALL remain left-aligned. The title SHALL be positioned at the horizontal center of the header container using absolute positioning.

#### Scenario: Title is centered with back button present

- **WHEN** CardForm renders the header for editing or adding a card
- **THEN** the "編輯卡片" or "新增卡片" title SHALL appear at the horizontal center of the header
- **THEN** the "返回" back button SHALL remain left-aligned and not affect the title's center position
