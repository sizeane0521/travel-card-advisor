## MODIFIED Requirements

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

---

## ADDED Requirements

### Requirement: Collapsed subcategory display in bonus card panel

When a StoreBonus has `subCategories` defined and non-empty, the bonus card panel SHALL display stores in a grouped layout: each subcategory shows its label as a section header followed by its store chips. The flat `stores[]` chips SHALL NOT be shown separately when subCategories are present.

When a StoreBonus has no `subCategories` (or an empty array), the bonus card panel SHALL display a single default group labeled "適用店家" containing the flat `stores[]` chips.

Each group (subcategory or default) SHALL have an `[編輯]` button aligned to the right of its label row.

#### Scenario: Subcategory groups display with labels

- **WHEN** a StoreBonus has `subCategories: [{ label: "便利商店", stores: ["7-ELEVEN", "FamilyMart"] }, { label: "熱門景點", stores: ["東京迪士尼"] }]`
- **THEN** the bonus card SHALL display "便利商店" as a section header with chips "7-ELEVEN ×" and "FamilyMart ×" below it
- **THEN** the bonus card SHALL display "熱門景點" as a section header with chip "東京迪士尼 ×" below it
- **THEN** flat `stores[]` chips SHALL NOT appear outside the subcategory groups

#### Scenario: No subcategories shows default group

- **WHEN** a StoreBonus has no `subCategories` and `stores: ["全聯", "家樂福"]`
- **THEN** the bonus card SHALL display a section header "適用店家" with chips "全聯 ×" and "家樂福 ×"
- **THEN** an `[編輯]` button SHALL appear to the right of the "適用店家" label

---

### Requirement: Per-group inline store editing in bonus card panel

Each group (subcategory or default "適用店家") within a StoreBonus card panel SHALL support an inline editor activated by its `[編輯]` button. Only one group editor SHALL be open at a time across all bonus panels.

When the `[編輯]` button is clicked, the group SHALL expand inline to show:
1. A text input for the group label (editable for named subcategories; read-only or hidden for the default "適用店家" group)
2. A store-name input field with an `[加入]` button; pressing Enter SHALL also trigger add
3. The current store chips, each with an `×` remove button
4. A `[刪除此分類]` button (visible only for named subcategories, not for the default group)
5. A `[完成]` button to collapse the editor

Clicking `[完成]` or clicking another group's `[編輯]` SHALL close the current editor.

#### Scenario: Edit stores within a subcategory

- **WHEN** user clicks `[編輯]` on the "便利商店" subcategory group
- **THEN** the group SHALL expand to show a label input (pre-filled "便利商店"), a store-name input, current store chips with × buttons, and a "刪除此分類" button
- **WHEN** user types "LAWSON" and clicks `[加入]`
- **THEN** "LAWSON" SHALL appear as a chip in the subcategory and be saved to `sub.stores[]`

#### Scenario: Edit stores in the default group

- **WHEN** a StoreBonus has no subcategories and user clicks `[編輯]` on "適用店家"
- **THEN** the group SHALL expand showing a store-name input and current store chips with × buttons
- **THEN** no label input and no "刪除此分類" button SHALL be shown

#### Scenario: Only one group editor open at a time

- **WHEN** user has the "便利商店" editor open and clicks `[編輯]` on "熱門景點"
- **THEN** "便利商店" editor SHALL collapse
- **THEN** "熱門景點" editor SHALL expand

#### Scenario: Add new subcategory via +分類

- **WHEN** user clicks `[＋分類]` in the bonus card header
- **THEN** an inline form SHALL appear at the bottom of the groups list with a label input (empty) and a store-name input
- **WHEN** user fills in the label "百貨" and clicks "新增分類"
- **THEN** a new subcategory `{ label: "百貨", stores: [] }` SHALL be added and its editor SHALL open

---

### Requirement: Rate/cap inline edit row fit on narrow screen

The rate and cap inline edit row within a StoreBonus card panel SHALL render on a single line without wrapping on a 375px wide viewport.

The row SHALL use inputs with fixed pixel widths (rate: 44px, cap: 68px) and abbreviated labels ("%" and "NT$") adjacent to their respective inputs, with a period badge truncated to at most 4 characters ("每月" or "期間").

#### Scenario: Rate/cap row does not wrap on narrow screen

- **WHEN** a StoreBonus card is rendered on a 375px viewport
- **THEN** the rate input, "%" label, cap input, "NT$" label, and period badge SHALL all appear on one horizontal line
- **THEN** no element SHALL wrap to a second line within the rate/cap row
