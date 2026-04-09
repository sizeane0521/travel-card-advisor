# card-settings Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

### Requirement: Card configuration storage

The system SHALL allow users to configure up to 10 credit cards, each with: a name, base overseas reward rate (%), monthly cap type (reward amount cap or spend amount cap), monthly cap value (in NTD), optional promotion validity dates (`validFrom`, `validTo` in YYYY-MM-DD format), and an optional list of store-specific bonus rules. Cards SHALL be created either by manual form entry or by pre-filling from the URL import flow.

Each store bonus rule (`StoreBonus`) SHALL contain:
- `storeName`: display name for the bonus category (e.g. "熱門商店")
- `stores`: array of actual store name strings that qualify for this bonus (e.g. ["唐吉訶德", "FamilyMart"]); SHALL be an empty array `[]` when no specific stores are listed
- `rate`: bonus reward rate (%)
- `cap`: spend cap amount in NTD (0 = no cap)
- `capPeriod`: "monthly" (cap resets each calendar month) or "period" (cap applies to the entire promotion validity period)
- `prerequisite` (optional): prerequisite condition text
- `prerequisiteMet` (optional): boolean indicating whether the prerequisite is currently met

The `Card` type SHALL include a `newUserBonus?: StoreBonus[]` field to store new-user-only bonus rules separately from `storeBonus`. Each entry in `newUserBonus` SHALL use the same `StoreBonus` structure, with `prerequisite` set to the condition text (e.g. "限新戶") and `prerequisiteMet` defaulting to `false` upon import.

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

Each tier display row (showing rate % and monthly cap NT$) SHALL render on a single line without wrapping on viewports as narrow as 375px. The row SHALL NOT use `flex-wrap`. The rate input, separator label "% · 月上限 NT$", and cap input SHALL all appear inline.

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

#### Scenario: Tier row does not wrap at 375px

- **WHEN** CardForm renders an existing payment method bonus tier on a 375px wide viewport
- **THEN** the rate input, "% · 月上限 NT$" label, and cap input SHALL appear on a single line
- **THEN** no line wrapping SHALL occur within the tier row

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


<!-- @trace
source: edit-card-ui-improvements
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
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


<!-- @trace
source: edit-card-ui-improvements
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

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

---
### Requirement: Store bonus card layout in CardForm

The CardForm store bonus section SHALL render each StoreBonus entry as an individual rounded card panel (consistent with the app's `beast-card rounded-xl` pattern), rather than a flat list separated by bottom borders.

Each card panel SHALL have:
- Background color `#141008` (nested panel pattern) with border `1px solid #3d2e14`
- Rounded corners (`rounded-xl`)
- Internal padding (`p-3`)
- A clear margin or gap between cards (`space-y-2` or equivalent)

#### Scenario: Multiple bonuses render as separate cards

- **WHEN** a card has two StoreBonus entries ("日本熱門商店加碼" and "新戶日本實體消費加碼")
- **THEN** each SHALL be rendered as a visually distinct card panel with rounded corners and separated by a gap
- **THEN** no bottom-border separator SHALL be used between bonuses


<!-- @trace
source: cardform-bonus-ui-overhaul
updated: 2026-04-08
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Prerequisite bonus visual differentiation in CardForm

When a StoreBonus has a `prerequisite` field defined, its card panel in CardForm SHALL display visual differentiation from bonuses without prerequisites.

The differentiation SHALL include:
- A left border accent in a distinct color (e.g. `borderLeft: '3px solid #f59e0b'`, orange warning color) to distinguish from standard bonuses
- A small badge or label showing the prerequisite text (e.g. "限新戶") next to the bonus name

#### Scenario: Prerequisite bonus has distinct visual style

- **WHEN** a StoreBonus has `prerequisite: "新戶於活動期間申辦且核卡"`
- **THEN** its card panel SHALL display a left border accent in a warning color
- **THEN** the prerequisite text SHALL appear as a visible badge near the bonus name

#### Scenario: Bonus without prerequisite has standard style

- **WHEN** a StoreBonus has no `prerequisite` field
- **THEN** its card panel SHALL use the standard panel styling without any left border accent


<!-- @trace
source: cardform-bonus-ui-overhaul
updated: 2026-04-08
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Store bonus action buttons consistent styling

The action buttons within each StoreBonus entry in CardForm ("＋分類", "刪除") SHALL use bordered pill/chip styling consistent with the app's toggle button pattern.

Each button SHALL have:
- A visible border (`border: '1px solid ...'`)
- Rounded corners (`rounded-lg`)
- Padding (`px-2 py-1`)
- Text size `text-xs`

The "＋分類" button SHALL use the inactive toggle style (`color: '#c8a060', borderColor: '#4a3418'`). The "刪除" button SHALL use the delete style (`color: '#c0392b', borderColor: '#5a1a1a'`).

The "＋店家" button SHALL NOT be present at the StoreBonus header level. Store management SHALL be performed within each group's inline editor.

#### Scenario: Action buttons render as chips without +店家

- **WHEN** a StoreBonus entry is displayed in CardForm
- **THEN** the "＋分類" and "刪除" buttons SHALL each have a visible border and rounded corners
- **THEN** a "＋店家" button SHALL NOT appear in the bonus card header


<!-- @trace
source: bonus-card-store-management-redesign
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Collapsed subcategory display in bonus card panel

When a StoreBonus entry in CardForm is not in edit mode, the bonus card panel SHALL display its store groups in a collapsed read-only view. The display SHALL reflect the group structure:

- If `subCategories` is non-empty: render each sub-category as a labeled group (group label + store chips)
- If `subCategories` is absent or empty: render a single default group labeled "適用店家" showing the flat `stores[]` chips

Each group row SHALL show:
- A group label in `text-[10px] uppercase tracking-wider` style on the left
- An `[編輯]` button on the right, triggering per-group inline edit mode for that group
- Store chips displayed below the label row
- Groups separated by `mt-1.5` spacing

#### Scenario: StoreBonus with subCategories shows labeled groups collapsed

- **WHEN** a StoreBonus has `subCategories: [{ label: "便利商店", stores: ["7-ELEVEN"] }, { label: "百貨", stores: ["高島屋"] }]`
- **THEN** the collapsed panel SHALL show two labeled group rows: "便利商店" and "百貨"
- **THEN** each group SHALL show its store chips and an `[編輯]` button

#### Scenario: StoreBonus without subCategories shows default group collapsed

- **WHEN** a StoreBonus has no `subCategories` and `stores: ["唐吉訶德", "FamilyMart"]`
- **THEN** the collapsed panel SHALL show a single "適用店家" group row with those store chips and an `[編輯]` button

<!-- @trace
source: bonus-card-store-management-redesign
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->


<!-- @trace
source: bonus-card-store-management-redesign
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Per-group inline store editing in bonus card panel

Each store group in a StoreBonus card panel SHALL support per-group inline editing, triggered by the `[編輯]` button on that group row. Only one group editor may be open at a time; opening a new group editor SHALL close any previously open one.

When a group editor is open, it SHALL display inline below the group label row:
- For named sub-categories: an editable label `<input>` for renaming the sub-category; changes SHALL be applied immediately via `renameSubCategory()`
- For the default "適用店家" group: no label input (label is fixed)
- A store name `<input>` and `[加入]` button (also triggered by Enter key); submitting SHALL call `addStoreToGroup()`
- The current store chips, each with an `×` button that calls `removeStoreFromGroup()`
- For named sub-categories: a `[刪除此分類]` button in red at the bottom, calling `deleteSubCategory()`; default group SHALL NOT show this button
- A `[完成]` button to close the editor (`setExpandedGroupKey(null)`)

#### Scenario: Edit a named sub-category inline

- **WHEN** user clicks `[編輯]` on the "便利商店" group row
- **THEN** an inline editor SHALL expand below the group label row showing: label rename input pre-filled with "便利商店", store name input, existing store chips with × buttons, `[刪除此分類]` button, and `[完成]` button

#### Scenario: Edit the default group inline

- **WHEN** user clicks `[編輯]` on the "適用店家" default group row
- **THEN** an inline editor SHALL expand showing: store name input, existing store chips with × buttons, and `[完成]` button
- **THEN** NO label input and NO `[刪除此分類]` button SHALL be rendered

#### Scenario: Only one group editor open at a time

- **WHEN** user opens the editor for group A, then clicks `[編輯]` on group B
- **THEN** group A's editor SHALL collapse
- **THEN** group B's editor SHALL expand

<!-- @trace
source: bonus-card-store-management-redesign
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->


<!-- @trace
source: bonus-card-store-management-redesign
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Rate/cap inline edit row fit on narrow screen

The rate and cap inline edit row within each StoreBonus card panel in CardForm SHALL fit on a single line without wrapping on viewports as narrow as 375px.

The row SHALL:
- NOT use `flex-wrap`
- Use a fixed width of `44px` for the rate `<input>` and the cap `<input>`
- Render `%` immediately after the rate input and `NT$` immediately before the cap input as inline labels, rather than as a combined placeholder
- Shorten the period badge to `每月` (monthly) or `期間` (period) to reduce text overflow

#### Scenario: Rate/cap row does not wrap at 375px

- **WHEN** a StoreBonus entry is displayed in CardForm on a 375px wide viewport
- **THEN** the rate input, `%`, cap label `NT$`, cap input, and period badge SHALL all appear on a single line
- **THEN** no line wrapping SHALL occur within the rate/cap row

<!-- @trace
source: bonus-card-store-management-redesign
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->


<!-- @trace
source: bonus-card-store-management-redesign
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: New bonus form visual separation

The "add new bonus" form at the bottom of the CardForm store bonus section SHALL be visually separated from the existing bonus list.

The form SHALL be enclosed in a distinct panel with:
- A dashed top border or a clearly different background shade to mark the boundary
- All input fields SHALL use consistent sizing that prevents overflow on narrow screens (min-width 375px)

The "加碼 %" and "上限 NT$" input fields SHALL NOT overflow their container on narrow mobile viewports. They SHALL use `min-w-0` to prevent flex item overflow and appropriate `placeholder` text that fits within the rendered width.

#### Scenario: New bonus form is visually distinct from bonus list

- **WHEN** the CardForm store bonus section has existing bonuses and the add form
- **THEN** there SHALL be a clear visual boundary between the last bonus card and the add form

#### Scenario: Input fields do not overflow on narrow screens

- **WHEN** the CardForm is viewed on a 375px wide viewport
- **THEN** the "加碼 %" and "上限 NT$" input fields SHALL remain within their container boundaries
- **THEN** no horizontal scrolling SHALL occur

<!-- @trace
source: cardform-bonus-ui-overhaul
updated: 2026-04-08
code:
  - src/components/CardForm.tsx
-->

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


<!-- @trace
source: edit-card-ui-improvements
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Inline editing of bonus rate and cap in CardForm

The system SHALL allow users to directly edit the `rate` (%) and `cap` (NT$) of existing StoreBonus entries and PaymentMethodBonusTier entries within CardForm, without requiring deletion and re-creation.

Each existing StoreBonus card panel SHALL render the rate and cap as editable `<input type="number">` fields instead of static text. Changes SHALL update the in-memory bonus state immediately on input. The same inline editing SHALL apply to entries in the "新戶加碼" section.

Each existing PaymentMethodBonusTier SHALL render its `rate` (%) and `monthlyCap` (NT$) as editable `<input type="number">` fields.

#### Scenario: User edits rate of an existing store bonus

- **WHEN** user changes the rate input of an existing StoreBonus entry from 3% to 5% and saves the card
- **THEN** the card SHALL be saved with that StoreBonus entry having `rate: 5`
- **THEN** subsequent reward calculations SHALL use the updated rate

#### Scenario: User edits cap of an existing store bonus

- **WHEN** user changes the cap input of an existing StoreBonus entry from NT$600 to NT$1000 and saves
- **THEN** the card SHALL be saved with `cap: 1000` for that entry
- **THEN** cap progress tracking SHALL use the updated cap value

#### Scenario: User edits rate and monthlyCap of an existing payment method tier

- **WHEN** user changes the rate input of an existing PaymentMethodBonusTier from 1.5% to 2.0% and saves
- **THEN** the card SHALL be saved with the updated tier rate
- **THEN** the effective payment method bonus rate SHALL reflect the change in subsequent calculations

<!-- @trace
source: card-settings-improvements
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

<!-- @trace
source: card-settings-improvements
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
  - src/types/index.ts
  - src/lib/rewardCalc.ts
  - src/lib/cardImport.ts
-->

---
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


<!-- @trace
source: edit-card-ui-improvements
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Card edit page header title centering

The "編輯卡片" / "新增卡片" heading in CardForm SHALL be horizontally centered within the page header, regardless of the position of the back button on the left.

The back button SHALL remain left-aligned. The title SHALL be positioned at the horizontal center of the header container using absolute positioning.

#### Scenario: Title is centered with back button present

- **WHEN** CardForm renders the header for editing or adding a card
- **THEN** the "編輯卡片" or "新增卡片" title SHALL appear at the horizontal center of the header
- **THEN** the "返回" back button SHALL remain left-aligned and not affect the title's center position

<!-- @trace
source: edit-card-ui-improvements
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Settings page section order

The settings page SHALL display its sections in the following top-to-bottom order:
1. AI import settings (API key selection and entry)
2. Credit card list (with add card button)
3. Cross-device sync (QR code export and import)

This order reflects the natural user workflow: configure the AI provider first, then set up cards, then optionally sync to other devices.

#### Scenario: Settings page renders sections in correct order

- **WHEN** user navigates to the settings page
- **THEN** the AI import settings section SHALL appear first (topmost)
- **THEN** the credit card list section SHALL appear second
- **THEN** the cross-device sync section SHALL appear last (bottommost)


<!-- @trace
source: settings-ux-improvements
updated: 2026-04-09
code:
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
-->

---
### Requirement: Visual credit card face in settings list

The credit card list in the settings page SHALL display each card as a visual credit card face panel instead of a plain text panel.

Each card face SHALL:
- Have a fixed height of `h-40` (160px) and full width
- Display a CSS gradient background derived from the card name using a deterministic hash function, so the same card name always produces the same color scheme
- Show the card name in large text (`text-xl font-bold`) at the bottom-left, with a text shadow for readability
- Show the base reward rate (e.g. "2.5%") at the top-right corner inside a semi-transparent badge
- Show the promotion end date (`validTo`) at the bottom-right if present, formatted as `YYYY/MM/DD`
- Show an expiry badge ("活動已結束" or "即將到期") at the top-left if applicable, using the same color rules as the current implementation
- Include decorative card-style details (e.g. a subtle chip icon or horizontal accent lines) to reinforce the credit card metaphor

Below each card face, a row of action items SHALL be rendered:
- Bank promotion page link (if `bankUrl` is set), opening in a new tab
- "編輯" button
- "刪除" button

#### Scenario: Card face renders with gradient background

- **WHEN** the settings page renders a card with name "吉鶴卡"
- **THEN** the card face SHALL display a gradient background derived from hashing "吉鶴卡"
- **THEN** the same card SHALL always render with the same gradient on every page load

#### Scenario: Card face shows base rate badge

- **WHEN** a card has `baseRate: 2.5`
- **THEN** the card face SHALL display "2.5%" in a semi-transparent badge at the top-right

#### Scenario: Card face shows validTo date

- **WHEN** a card has `validTo: "2026-06-30"`
- **THEN** the card face SHALL display "2026/06/30" at the bottom-right of the card face

#### Scenario: Card face hides validTo when not set

- **WHEN** a card has no `validTo` field
- **THEN** no date SHALL be rendered on the card face

#### Scenario: Action row below card face

- **WHEN** the card has `bankUrl` set
- **THEN** the action row below the card face SHALL display the bank link, "編輯" button, and "刪除" button
- **WHEN** the card has no `bankUrl`
- **THEN** the action row SHALL display only the "編輯" and "刪除" buttons


<!-- @trace
source: settings-ux-improvements
updated: 2026-04-09
code:
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
-->

---
### Requirement: CardForm section active focus state

Each section panel in CardForm (基本資訊, 新戶加碼, 特定店家加碼, 行動支付加碼) SHALL visually indicate when it is the active editing section.

A section panel SHALL be treated as active when any `<input>`, `<textarea>`, or `<button>` within it has keyboard focus (CSS `focus-within` state). When active:
- The panel border color SHALL change from the resting color (`#4a3418`) to the active color (`#c8901a`)
- A subtle outer glow SHALL appear: `box-shadow: 0 0 0 2px rgba(200, 144, 26, 0.15)`

When focus leaves the panel, it SHALL revert immediately to the resting style.

The transition SHALL be smooth (`transition: border-color 0.15s, box-shadow 0.15s`).

#### Scenario: Section panel highlights on input focus

- **WHEN** user clicks into the base rate input inside the 基本資訊 section
- **THEN** the 基本資訊 panel border SHALL change to `#c8901a`
- **THEN** the panel SHALL display the outer glow shadow

#### Scenario: Section panel reverts when focus leaves

- **WHEN** user moves focus from an input inside 新戶加碼 to an input inside 特定店家加碼
- **THEN** the 新戶加碼 panel SHALL revert to the resting border color `#4a3418`
- **THEN** the 特定店家加碼 panel SHALL become active with the gold border

#### Scenario: Only one section active at a time

- **WHEN** focus is inside the 行動支付加碼 section
- **THEN** only the 行動支付加碼 panel SHALL display the active gold border
- **THEN** all other section panels SHALL display the resting dark border

<!-- @trace
source: settings-ux-improvements
updated: 2026-04-09
code:
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
-->