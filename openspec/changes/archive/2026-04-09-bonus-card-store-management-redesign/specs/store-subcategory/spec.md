## MODIFIED Requirements

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
