# frequent-store-chips Specification

## Purpose

Display quick-access chips for the most frequently used stores in the current active trip when the store search input is empty.

## Requirements

### Requirement: Frequent store chips shown when search is empty

When the store search input is empty, the system SHALL display up to 5 quick-access chips showing the most frequently used store names from the current active trip's expenses (`tripExpenses`). Frequency is determined by the count of expenses with a matching `store` field. Only stores with at least one matching expense SHALL appear.

The frequent store chips SHALL appear between the "一般消費" chip and the search-filtered chips area. When the search input is non-empty, the frequent store chips SHALL NOT be shown (filtered chips take over).

When the current trip has no expenses or all expenses have `store: null`, no frequent store chips SHALL be displayed.

#### Scenario: Top stores shown when search is empty

- **WHEN** the active trip has expenses: 全家 ×5, 7-ELEVEN ×3, 星巴克 ×2, 唐吉軻德 ×1
- **AND** the store search input is empty
- **THEN** the system SHALL display chips: "全家", "7-ELEVEN", "星巴克", "唐吉軻德" (up to 5, sorted by frequency descending)

#### Scenario: Frequent chips hidden when search is active

- **WHEN** user types "唐" in the store search input
- **THEN** frequent store chips SHALL NOT be displayed
- **THEN** only chips matching the search query SHALL appear

#### Scenario: No frequent chips for a new trip

- **WHEN** the active trip has zero expense records
- **THEN** no frequent store chips SHALL appear
- **THEN** only the "一般消費" chip SHALL be visible when search is empty

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
-->

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
code:
  - src/pages/LedgerPage.tsx
  - src/types/index.ts
  - repomix-output.xml
  - src/store/useStore.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->