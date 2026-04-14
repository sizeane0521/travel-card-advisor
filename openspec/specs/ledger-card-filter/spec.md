# ledger-card-filter Specification

## Purpose

TBD - created by archiving change 'ledger-card-chip-and-filter'. Update Purpose after archive.

## Requirements

### Requirement: Card chip display in expense records

Each expense record in LedgerPage SHALL display the card name as a styled chip instead of plain text. The chip SHALL have:
- A transparent background
- A border color of `#c8901a`
- Text color `#c8a060`
- Rounded corners (`rounded` / `border-radius: 4px`)
- Small padding (`px-1.5 py-0.5`)
- Font size `text-xs`

If the card no longer exists (deleted), the chip SHALL display `已刪除的卡片` with muted styling.

#### Scenario: Card name shown as chip

- **WHEN** an expense record is rendered with a valid card reference
- **THEN** the card name SHALL appear inside a chip with gold border and muted gold text
- **THEN** the chip SHALL be visually distinct from surrounding plain text

#### Scenario: Deleted card shown with fallback

- **WHEN** an expense record references a card that no longer exists in `data.cards`
- **THEN** the chip SHALL display `已刪除的卡片` with reduced opacity or muted color


<!-- @trace
source: ledger-card-chip-and-filter
updated: 2026-04-14
code:
  - src/pages/LedgerPage.tsx
-->

---
### Requirement: Payment method badge in expense records

Each expense record SHALL display a payment method badge adjacent to the card chip when the payment method is `apple_pay` or `google_pay`. The badge SHALL use the same style as the payment method badge in CalcPage:
- Background: `rgba(74,174,226,0.15)`
- Text color: `#4aade2`
- Border: `1px solid rgba(74,174,226,0.3)`
- Label: `Apple Pay` for `apple_pay`, `Google Pay` for `google_pay`

When `paymentMethod` is `physical` or absent, no badge SHALL be rendered.

#### Scenario: Apple Pay badge shown

- **WHEN** an expense record has `paymentMethod: 'apple_pay'`
- **THEN** a blue `Apple Pay` badge SHALL appear next to the card chip

#### Scenario: Google Pay badge shown

- **WHEN** an expense record has `paymentMethod: 'google_pay'`
- **THEN** a blue `Google Pay` badge SHALL appear next to the card chip

#### Scenario: No badge for physical card

- **WHEN** an expense record has `paymentMethod: 'physical'` or no `paymentMethod`
- **THEN** no payment method badge SHALL be rendered


<!-- @trace
source: ledger-card-chip-and-filter
updated: 2026-04-14
code:
  - src/pages/LedgerPage.tsx
-->

---
### Requirement: Card filter tabs in ledger page

LedgerPage SHALL display a horizontally scrollable tab row above the expense list. The tab row SHALL contain:
- A fixed first tab labeled `全部` that shows all expenses when selected
- One tab per unique card that appears in the current trip's expense records, in the order of first appearance
- Only cards with at least one expense in the current trip SHALL generate a tab

The tab row SHALL be horizontally scrollable (overflow-x: auto, flex-nowrap) to accommodate any number of card tabs without wrapping.

Selecting a tab SHALL filter the expense list to show only expenses charged to that card. Selecting `全部` SHALL show all expenses.

The active tab SHALL be visually highlighted (gold background `#c8901a`, dark text `#0d0a06`). Inactive tabs SHALL use transparent background with `#c8a060` text and `#4a3418` border.

When the active trip changes, the selected tab SHALL reset to `全部`.

#### Scenario: Tab row shows All plus one tab per card

- **WHEN** a trip has 3 expenses using 2 different cards
- **THEN** the tab row SHALL show `全部` plus 2 card-name tabs (no duplicates)
- **THEN** the card tabs SHALL appear in the order of first expense for each card

#### Scenario: Filtering by card tab

- **WHEN** the user selects a card tab
- **THEN** only expenses charged to that card SHALL be visible in the list
- **THEN** the selected tab SHALL be highlighted in gold

#### Scenario: All tab shows unfiltered list

- **WHEN** the user selects `全部`
- **THEN** all expenses for the current trip SHALL be visible
- **THEN** the `全部` tab SHALL be highlighted

#### Scenario: Tab resets on trip change

- **WHEN** the active trip changes
- **THEN** the selected tab SHALL automatically reset to `全部`

#### Scenario: Tab row scrollable with many cards

- **WHEN** there are more card tabs than fit in the visible width
- **THEN** the tab row SHALL be horizontally scrollable without wrapping

<!-- @trace
source: ledger-card-chip-and-filter
updated: 2026-04-14
code:
  - src/pages/LedgerPage.tsx
-->