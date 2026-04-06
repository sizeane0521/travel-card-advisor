# foreign-currency-expense Specification

## Purpose

TBD - created by archiving change 'enhance-card-import-and-currency'. Update Purpose after archive.

## Requirements

### Requirement: Foreign currency amount input

The system SHALL detect whether the active trip has an `exchangeRate` configured and switch the expense entry form accordingly. When an exchange rate is present, the amount input label SHALL show the foreign currency code (e.g. "金額（JPY）") and accept a positive integer as the foreign currency amount.

#### Scenario: Input field shows foreign currency when rate is set

- **WHEN** the active trip has `exchangeRate: { currency: "JPY", rate: 0.22 }`
- **THEN** the expense amount input SHALL be labeled "金額（JPY）"
- **THEN** entering ¥10000 SHALL compute `Expense.amount = 2200` (floor of 10000 × 0.22) in TWD

#### Scenario: Input field shows TWD when no rate is set

- **WHEN** the active trip has no `exchangeRate`
- **THEN** the expense amount input SHALL be labeled "金額（NT$）" and operate in TWD-only mode


<!-- @trace
source: enhance-card-import-and-currency
updated: 2026-04-06
code:
  - src/lib/cardImport.ts
  - src/types/index.ts
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/store/storage.ts
  - src/pages/TripsPage.tsx
-->

---
### Requirement: Dual-amount display in expense list


Each expense recorded with a foreign amount SHALL display both the original foreign currency amount and the converted TWD amount in the expense list.

#### Scenario: Expense list shows both amounts

- **WHEN** an expense has `foreignAmount: { currency: "JPY", amount: 5000 }` and `amount: 1100`
- **THEN** the expense list entry SHALL display "¥5,000 (NT$1,100)"

#### Scenario: TWD-only expense shows single amount

- **WHEN** an expense has no `foreignAmount`
- **THEN** the expense list entry SHALL display only "NT$X,XXX" (existing behavior)


<!-- @trace
source: enhance-card-import-and-currency
updated: 2026-04-06
code:
  - src/lib/cardImport.ts
  - src/types/index.ts
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/store/storage.ts
  - src/pages/TripsPage.tsx
-->

---
### Requirement: Reward estimation uses TWD amount

All reward calculations (estimated reward display, cap tracking, card advisor) SHALL use `Expense.amount` (TWD) regardless of whether the expense was entered in foreign currency.

#### Scenario: Reward calculated from converted TWD amount

- **WHEN** user logs ¥5000 with exchange rate 0.22 (TWD = NT$1100) on a card with 3% base rate
- **THEN** the estimated reward SHALL be NT$33 (floor of 1100 × 0.03)

<!-- @trace
source: enhance-card-import-and-currency
updated: 2026-04-06
code:
  - src/lib/cardImport.ts
  - src/types/index.ts
  - src/pages/SettingsPage.tsx
  - src/components/CardForm.tsx
  - src/lib/rewardCalc.ts
  - src/pages/ExpensePage.tsx
  - src/store/storage.ts
  - src/pages/TripsPage.tsx
-->

---
### Requirement: Real-time JPY to TWD conversion preview

When the active trip has an `exchangeRate` configured, the expense entry form SHALL display a real-time conversion preview below the amount input field. The preview SHALL show the TWD equivalent of the currently entered amount, formatted as "≈ NT$XXX" where XXX is `Math.floor(enteredAmount × rate)`. The preview SHALL update on every keystroke. The preview SHALL only appear when the entered amount is a positive integer greater than 0. When no amount is entered or the amount is 0, the preview line SHALL be hidden.

#### Scenario: Preview appears while typing JPY

- **WHEN** the active trip has `exchangeRate: { currency: "JPY", rate: 0.22 }` and user types "1500"
- **THEN** the form SHALL display "≈ NT$330" immediately below the amount input

#### Scenario: Preview hidden when amount is empty

- **WHEN** the active trip has an exchange rate but the amount input is empty or zero
- **THEN** no conversion preview SHALL be displayed

#### Scenario: Preview not shown without exchange rate

- **WHEN** the active trip has no `exchangeRate`
- **THEN** no conversion preview SHALL be displayed regardless of the entered amount

<!-- @trace
source: smart-expense-entry
updated: 2026-04-06
code:
  - src/pages/ExpensePage.tsx
-->