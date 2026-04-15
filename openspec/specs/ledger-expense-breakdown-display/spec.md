# ledger-expense-breakdown-display Specification

## Purpose

TBD - created by archiving change 'ledger-ui-improvements'. Update Purpose after archive.

## Requirements

### Requirement: Expense reward breakdown shown as pipe-separated small text

Each expense record in LedgerPage SHALL display the reward breakdown as a pipe-separated inline string in small, muted text rather than a full-sentence format.

The breakdown line SHALL use ` | ` as the separator between components (e.g., `基本 NT$1,987 | 行動支付加碼 NT$503`).

The breakdown line SHALL only appear when there is more than one reward component (i.e., when store bonus or payment method bonus exists in addition to the base reward). When the reward consists of base only, the breakdown line SHALL be omitted.

The reward breakdown text style SHALL use:
- Font size: `text-xs`
- Color: muted gold (`#9a7040`)
- A 1px horizontal divider line above it, styled `background: #3d2e14`

#### Scenario: Multi-component reward shows pipe breakdown

- **WHEN** an expense record has base reward plus at least one bonus (store or payment method)
- **THEN** the breakdown SHALL be displayed as `基本 NT$X | <bonus type> NT$Y` in small muted text below a divider
- **THEN** the separator between each component SHALL be ` | `

#### Scenario: Base-only reward omits breakdown line

- **WHEN** an expense record has only a base reward with no bonuses
- **THEN** no breakdown line or divider SHALL be rendered

#### Scenario: Three-component reward uses two separators

- **WHEN** an expense record has base reward plus both store bonus and payment method bonus
- **THEN** all three components SHALL appear in one line separated by ` | `
- **THEN** the total of all components SHALL equal the displayed reward amount

<!-- @trace
source: ledger-ui-improvements
updated: 2026-04-15
code:
  - src/pages/LedgerPage.tsx
-->