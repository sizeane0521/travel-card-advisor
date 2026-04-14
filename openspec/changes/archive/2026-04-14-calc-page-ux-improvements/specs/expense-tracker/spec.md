## ADDED Requirements

### Requirement: Custom store input confirmation chip

When the user types a store name in the store search field that does not match any bonus store (i.e., the filtered search results are empty), the system SHALL display a confirmation chip in the store chip row showing the typed name. The chip SHALL appear in the selected/active style (gold background, dark text) to signal that this custom store name will be recorded when the user taps "+刷卡".

The confirmation chip SHALL only appear when ALL of the following conditions are true:
1. `storeQuery` is non-empty
2. The filtered bonus store results are empty (no matching bonus stores found)

When the confirmation chip is visible, it SHALL display the text of `storeQuery` directly (e.g., if the user typed "無印良品", the chip shows "無印良品"). The "一般消費" chip SHALL NOT appear in the active/selected style at the same time (their conditions are mutually exclusive).

If the user clears the input, the confirmation chip SHALL disappear and "一般消費" SHALL return to its default unselected state.

#### Scenario: Custom store chip appears for non-bonus store

- **WHEN** the user types "無印良品" in the store search field
- **AND** "無印良品" does not match any configured bonus store
- **THEN** a chip displaying "無印良品" SHALL appear in the chip row in the selected/active gold style

#### Scenario: Custom store chip disappears on clear

- **WHEN** the user clears the store input field
- **THEN** the custom store confirmation chip SHALL no longer be visible
- **THEN** the "一般消費" chip SHALL return to its unselected appearance

#### Scenario: Chip does not appear when bonus store matches

- **WHEN** the user types "唐吉訶德" and it matches a configured bonus store in the search results
- **THEN** no custom store confirmation chip SHALL appear (the matched bonus store chip appears instead)
