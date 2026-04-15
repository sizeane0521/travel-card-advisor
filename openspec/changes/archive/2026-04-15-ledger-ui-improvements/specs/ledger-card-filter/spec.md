## MODIFIED Requirements

### Requirement: Card filter tabs in ledger page

LedgerPage SHALL display a horizontally scrollable tab row above the expense list. The tab row SHALL contain:
- A fixed first tab labeled `全部` that shows all expenses when selected
- One tab per unique card that appears in the current trip's expense records, in the order of first appearance
- Only cards with at least one expense in the current trip SHALL generate a tab

The tab row SHALL be horizontally scrollable (overflow-x: auto, flex-nowrap) to accommodate any number of card tabs without wrapping.

Selecting a tab SHALL filter BOTH the expense list AND the bonus bar section to show only data for that card. Selecting `全部` SHALL show all expenses and all cards' bonus bars.

The active tab SHALL be visually highlighted (gold background `#c8901a`, dark text `#0d0a06`). Inactive tabs SHALL use transparent background with `#c8a060` text and `#4a3418` border.

When the active trip changes, the selected tab SHALL reset to `全部`.

#### Scenario: Tab row shows All plus one tab per card

- **WHEN** a trip has 3 expenses using 2 different cards
- **THEN** the tab row SHALL show `全部` plus 2 card-name tabs (no duplicates)
- **THEN** the card tabs SHALL appear in the order of first expense for each card

#### Scenario: Filtering by card tab filters both expense list and bonus bars

- **WHEN** the user selects a card tab
- **THEN** only expenses charged to that card SHALL be visible in the list
- **THEN** only bonus bars belonging to that card SHALL be visible in the bonus bar section
- **THEN** the selected tab SHALL be highlighted in gold

#### Scenario: All tab shows unfiltered list and all bonus bars

- **WHEN** the user selects `全部`
- **THEN** all expenses for the current trip SHALL be visible
- **THEN** bonus bars for all cards SHALL be visible
- **THEN** the `全部` tab SHALL be highlighted

#### Scenario: Tab resets on trip change

- **WHEN** the active trip changes
- **THEN** the selected tab SHALL automatically reset to `全部`

#### Scenario: Tab row scrollable with many cards

- **WHEN** there are more card tabs than fit in the visible width
- **THEN** the tab row SHALL be horizontally scrollable without wrapping
