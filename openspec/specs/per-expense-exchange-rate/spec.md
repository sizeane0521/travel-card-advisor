# per-expense-exchange-rate Specification

## Purpose

Allow users to override the trip's default exchange rate on a per-expense basis without modifying the trip's exchange rate setting.

## Requirements

### Requirement: Per-expense exchange rate override

When the active trip has an `exchangeRate` set, the expense entry form SHALL display the trip's exchange rate and allow the user to override it for the current expense only. The override SHALL apply only to that single expense and SHALL NOT modify the trip's `exchangeRate` setting.

The UI SHALL display the current effective rate (trip default or user-overridden) next to the foreign currency amount input. A small input field SHALL allow the user to type a custom rate. Preset shortcut buttons for common currencies (JPY, KRW) SHALL NOT be required — only a freeform input is needed.

When a custom rate is entered, the system SHALL use it for TWD conversion of that expense (`Math.floor(foreignAmount × customRate)`). The custom rate SHALL be stored as `Expense.customRate` (type `number`) alongside the existing `foreignAmount`.

When the user clears the custom rate input, the system SHALL fall back to the trip's default `exchangeRate.rate`.

#### Scenario: Override rate used for TWD conversion

- **WHEN** the trip's default rate is 0.220 (JPY) and the user enters a custom rate of 0.215
- **AND** the user enters ¥5000
- **THEN** the displayed TWD preview SHALL be NT$1075 (Math.floor(5000 × 0.215))
- **THEN** the recorded expense SHALL have `customRate: 0.215` and `amount: 1075`

#### Scenario: Custom rate stored in Expense

- **WHEN** user records an expense with a custom rate of 0.218
- **THEN** `Expense.customRate` SHALL be `0.218`

#### Scenario: Default rate used when no override

- **WHEN** user does not enter a custom rate
- **THEN** the trip's `exchangeRate.rate` SHALL be used for conversion
- **THEN** `Expense.customRate` SHALL be absent (undefined)

#### Scenario: Rate override does not affect other expenses

- **WHEN** user records one expense with custom rate 0.215 and then records a second expense without overriding
- **THEN** the second expense SHALL use the trip's default rate

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