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

The CardForm SHALL provide UI to manage sub-categories within each StoreBonus entry. For each configured StoreBonus, the user SHALL be able to:
1. Add a new sub-category with a label (e.g. "便利商店")
2. Add store names to a sub-category
3. Remove store names from a sub-category
4. Remove an entire sub-category

The sub-category management UI SHALL be redesigned to reduce visual nesting depth:
- When expanded, sub-categories SHALL be displayed as a flat list of labeled groups within the bonus card, rather than nested inside an additional container
- Each sub-category group SHALL show its label as a section header (using `text-[10px] uppercase tracking-wider` style, consistent with existing pattern) followed by its store chips on the next line
- The "add store to sub-category" input SHALL appear inline below each sub-category's chips, not in a deeply nested container
- The "new sub-category" form (label input + add button) SHALL appear at the bottom of the sub-category list, using the same level of nesting as sub-category groups themselves

The sub-category section within a bonus card SHALL use minimal additional nesting: at most one level of visual containment beyond the bonus card itself.

#### Scenario: Add sub-category with stores

- **WHEN** user enters label "便利商店" and adds stores "7-ELEVEN", "FamilyMart" under it
- **THEN** the saved StoreBonus SHALL contain `subCategories: [{ label: "便利商店", stores: ["7-ELEVEN", "FamilyMart"] }]`

#### Scenario: Multiple sub-categories under one StoreBonus

- **WHEN** user adds two sub-categories: "便利商店" (7-ELEVEN, FamilyMart) and "百貨" (永旺, 高島屋)
- **THEN** the StoreBonus SHALL contain both sub-categories with their respective stores

#### Scenario: Sub-category UI nesting depth

- **WHEN** user expands the sub-category management for a StoreBonus
- **THEN** the sub-category groups SHALL be displayed within the bonus card panel without an additional wrapping container that creates a third level of visual nesting
- **THEN** each sub-category label and its store chips SHALL be directly visible without scrolling horizontally


<!-- @trace
source: cardform-bonus-ui-overhaul
updated: 2026-04-08
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