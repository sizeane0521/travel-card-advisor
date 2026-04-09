# store-subcategory Specification

## Purpose

Extends the `StoreBonus` data model with an optional `subCategories` field, enabling store names to be grouped under typed category labels (e.g. "便利商店"). Provides CardForm UI for managing sub-categories and an expandable category browser in the expense entry store selector.

## Requirements

### Requirement: StoreBonus sub-category data model

The `StoreBonus` interface SHALL support an optional `subCategories` field: an array of objects, each with a `label: string` (e.g. "便利商店") and `stores: string[]` (e.g. ["7-ELEVEN", "FamilyMart", "LAWSON"]).

The existing `StoreBonus.stores[]` flat array SHALL remain as the list of uncategorized stores and SHALL continue to be used for store matching and chip display.

When `subCategories` is present, store names within each sub-category SHALL be included in the set returned by `getAllStoreNames()` and SHALL be searchable in the same way as names from `StoreBonus.stores[]`.

#### Scenario: Sub-category stores appear in search results

- **WHEN** a StoreBonus has `subCategories: [{ label: "便利商店", stores: ["7-ELEVEN", "FamilyMart"] }]` and the user types "7"
- **THEN** "7-ELEVEN" SHALL appear as a chip in the store search results
- **THEN** the chip "便利商店" SHALL NOT appear in the search results

#### Scenario: Card with no subCategories behaves as before

- **WHEN** a StoreBonus has `subCategories` absent or empty and `stores: ["唐吉訶德"]`
- **THEN** "唐吉訶德" SHALL appear in search results when user types a matching query
- **THEN** behavior SHALL be identical to the pre-subCategories implementation


<!-- @trace
source: reward-cap-and-display-enhance
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
  - src/components/CardForm.tsx
-->

---
### Requirement: StoreBonus sub-category management in CardForm

The CardForm SHALL provide UI to manage sub-categories within each StoreBonus entry using a per-group inline editor model. The top-level bonus card header SHALL NOT contain a `+店家` button. Instead, store management SHALL be accessible via an `[編輯]` button on each group row.

For each configured StoreBonus, the user SHALL be able to:
1. Add a new sub-category label using the `[＋分類]` button in the bonus card header, which opens an inline form at the bottom of the group list
2. Add store names to a specific group by opening that group's `[編輯]` inline editor and using the store-name input
3. Remove store names from a group using the `×` chip button within the group's inline editor
4. Remove an entire named sub-category using the "刪除此分類" button in the group's inline editor
5. Rename a sub-category label by editing the label input in the group's inline editor

The flat `stores[]` array (uncategorized stores) SHALL be managed via the default "適用店家" group editor when no `subCategories` exist. When `subCategories` exist, the "適用店家" default group SHALL NOT be shown; only the subcategory groups SHALL be displayed.

#### Scenario: Add sub-category with stores

- **WHEN** user clicks `[＋分類]`, enters label "便利商店", then opens that group's editor and adds "7-ELEVEN" and "FamilyMart"
- **THEN** the saved StoreBonus SHALL contain `subCategories: [{ label: "便利商店", stores: ["7-ELEVEN", "FamilyMart"] }]`

#### Scenario: Multiple sub-categories under one StoreBonus

- **WHEN** user adds two sub-categories: "便利商店" (7-ELEVEN, FamilyMart) and "百貨" (永旺, 高島屋)
- **THEN** the StoreBonus SHALL contain both sub-categories with their respective stores
- **THEN** both groups SHALL be visible in the collapsed display with their labels and chips

#### Scenario: Manage stores when no subcategories exist

- **WHEN** a StoreBonus has no subCategories and user clicks `[編輯]` on the "適用店家" default group
- **THEN** the user SHALL be able to add and remove stores from `b.stores[]` directly
- **THEN** no label input and no "刪除此分類" button SHALL be shown in this editor


<!-- @trace
source: bonus-card-store-management-redesign
updated: 2026-04-09
code:
  - src/components/CardForm.tsx
-->

---
### Requirement: Category browser in expense store selector

The expense entry form SHALL provide an expandable category browser panel below the search input. The panel SHALL list each StoreBonus group that has sub-categories. Each group SHALL be collapsible. When expanded, the sub-category labels SHALL be shown, and each sub-category SHALL show its store name chips.

The category browser SHALL be collapsed by default. The user SHALL be able to toggle it with a button (e.g. "展開分類").

Tapping a store chip in the category browser SHALL select that store, exactly as if the user had typed and selected it from the search results.

#### Scenario: Category browser shows sub-categories

- **WHEN** a card has StoreBonus with sub-categories "便利商店" (7-ELEVEN, FamilyMart) and "量販" (BIC CAMERA, Yodobashi)
- **THEN** the category browser SHALL show "便利商店 ▶" and "量販 ▶" as expandable sections
- **THEN** expanding "便利商店" SHALL reveal chips for "7-ELEVEN" and "FamilyMart"

#### Scenario: Selecting from category browser populates store field

- **WHEN** user expands "便利商店" and taps "7-ELEVEN"
- **THEN** the store input SHALL be set to "7-ELEVEN"
- **THEN** the recommendation list SHALL update as if the user typed "7-ELEVEN"

#### Scenario: No category browser when no sub-categories exist

- **WHEN** no StoreBonus has any sub-categories configured
- **THEN** the category browser panel SHALL NOT be rendered

<!-- @trace
source: reward-cap-and-display-enhance
updated: 2026-04-07
code:
  - src/types/index.ts
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/components/CardForm.tsx
-->

<!-- @trace
source: reward-cap-and-display-enhance
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/types/index.ts
  - src/components/CardForm.tsx
-->

---
### Requirement: AI import auto-populates subCategories from page visual structure

When importing a card via AI from a bank promotion URL, the system SHALL automatically populate `StoreBonus.subCategories` based on the visual grouping detected by the AI on the bank page. The user SHALL NOT need to manually enter sub-categories for store groups that are already visually grouped on the bank's page.

The `+分類` UI in CardForm SHALL remain available for users to add, edit, or remove sub-categories after import as a manual adjustment tool.

#### Scenario: Import auto-fills subCategories

- **WHEN** user imports a card from a bank URL whose page groups stores under visual sub-headings (e.g. "便利商店", "樂園")
- **THEN** the resulting StoreBonus SHALL contain `subCategories` with one entry per detected visual group
- **THEN** the category browser in the expense entry form SHALL immediately show these sub-categories without any manual input

#### Scenario: Import with no visual sub-groups leaves subCategories empty

- **WHEN** user imports a card from a bank URL whose page lists stores without visual sub-grouping
- **THEN** the resulting StoreBonus SHALL have `subCategories` absent or empty
- **THEN** the user MAY manually add sub-categories using the +分類 button in CardForm

#### Scenario: User edits auto-filled subCategories after import

- **WHEN** user imports a card with auto-filled `subCategories` and then uses +分類 to add or remove a sub-category
- **THEN** the manual edit SHALL take effect and be saved with the card
- **THEN** the AI-generated sub-categories SHALL NOT be re-applied automatically

<!-- @trace
source: ai-import-auto-subcategories
updated: 2026-04-08
code:
  - src/lib/cardImport.ts
  - src/components/CardForm.tsx
-->

<!-- @trace
source: ai-import-auto-subcategories
updated: 2026-04-08
code:
  - src/components/CardForm.tsx
  - src/lib/cardImport.ts
-->