## MODIFIED Requirements

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
