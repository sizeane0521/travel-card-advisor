## MODIFIED Requirements

### Requirement: Store chip selection in expense form

The expense entry form SHALL display a text search input above the store chip list. The search input SHALL have placeholder text "搜尋店家…" and a clear button (×) that resets the store selection to null (一般消費) and clears the input text.

When the search input is empty, the chip list SHALL show the first 5 store names from `getAllStoreNames(cards)` plus a "更多 ▼" button if more than 5 exist; tapping it SHALL expand to show all remaining chips.

When the search input contains text, the chip list SHALL be filtered in real time to show only store names that include the query string (case-insensitive). The "更多 ▼ / 收起 ▲" button SHALL be hidden during active search. If no chips match the query, the chip list SHALL be empty (only "一般消費" remains).

The "一般消費" chip SHALL always be visible regardless of the search query. It represents store = null.

Tapping any chip SHALL:
1. Set the store selection to that chip's store name
2. Fill the search input with that store name
3. Visually highlight the chip as selected

Typing in the search input SHALL:
1. Update the chip list filter in real time
2. Set the store selection to the exact text entered (even if it does not match any chip)
3. Remove the visual highlight from any previously selected chip if the text no longer matches it

#### Scenario: Empty search shows default chip list

- **WHEN** the search input is empty and 6 store names are configured
- **THEN** the form SHALL display "一般消費" plus the first 5 store chips and a "更多 ▼" button

#### Scenario: Typing filters chips in real time

- **WHEN** user types "唐" into the search input
- **THEN** only store chips whose name contains "唐" (e.g. "唐吉訶德") SHALL be displayed
- **THEN** "一般消費" SHALL remain visible
- **THEN** "更多 ▼" button SHALL be hidden

#### Scenario: No matching chips shows empty list

- **WHEN** user types "zzz" and no store name contains "zzz"
- **THEN** only "一般消費" chip SHALL be visible
- **THEN** the store selection SHALL be set to "zzz" (free-text)
- **THEN** card recommendations SHALL recalculate using base rates (no store bonus match)

#### Scenario: Tapping chip fills search input

- **WHEN** user taps the "唐吉訶德" chip
- **THEN** the search input SHALL display "唐吉訶德"
- **THEN** the "唐吉訶德" chip SHALL be visually highlighted as selected
- **THEN** card recommendations SHALL recalculate using that store's bonus rates

#### Scenario: Clear button resets to general purchase

- **WHEN** user taps the × clear button in the search input
- **THEN** the search input SHALL be cleared
- **THEN** the store selection SHALL be set to null (一般消費)
- **THEN** "一般消費" chip SHALL be highlighted
- **THEN** the full default chip list SHALL be restored

#### Scenario: Tapping 一般消費 chip clears search

- **WHEN** user taps "一般消費" chip
- **THEN** the search input SHALL be cleared
- **THEN** store selection SHALL be set to null
- **THEN** card recommendations SHALL recalculate using base rates
