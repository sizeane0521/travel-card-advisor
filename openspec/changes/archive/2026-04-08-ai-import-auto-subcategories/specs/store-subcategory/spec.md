## ADDED Requirements

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
