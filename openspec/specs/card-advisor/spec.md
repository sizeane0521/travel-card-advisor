# card-advisor Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

### Requirement: Store selection for recommendation

The system SHALL present a list of available stores derived from all configured cards' store bonus rules, plus a "General Purchase" option. The store list SHALL be built by combining:
1. Each `StoreBonus.storeName` (category-level name, e.g. "熱門商店")
2. Each individual entry in `StoreBonus.stores[]` (actual store names, e.g. "唐吉訶德", "FamilyMart")

Duplicate names SHALL be deduplicated. The list SHALL be sorted alphabetically. The user SHALL be able to select any store name (category or actual) to get recommendations.

When the user selects an actual store name (e.g. "唐吉訶德"), the system SHALL match it to any `StoreBonus` rule whose `stores[]` array contains that name and apply the corresponding bonus rate for recommendations.

#### Scenario: Select an actual store name

- **WHEN** a card has a store bonus rule with `stores: ["唐吉訶德", "FamilyMart"]` and user selects "唐吉訶德"
- **THEN** the system SHALL apply that rule's bonus rate to the recommendation for that card
- **THEN** the card's effective rate SHALL reflect the store bonus, not the base rate

#### Scenario: Select a category name

- **WHEN** user selects the category label "熱門商店" (storeName)
- **THEN** the system SHALL match it by `storeName` and apply the corresponding bonus rate

#### Scenario: Store appears once in list despite multiple cards

- **WHEN** two cards both have "唐吉訶德" in their `stores[]` arrays
- **THEN** "唐吉訶德" SHALL appear only once in the store selection list
- **THEN** selecting it SHALL apply the correct bonus rate for each card independently

#### Scenario: Select general purchase

- **WHEN** user selects "General Purchase"
- **THEN** the system SHALL display card recommendations using each card's base overseas rate


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
### Requirement: Card recommendation ranking

The system SHALL rank all configured cards by their effective reward rate for the selected store and current month, in descending order (highest rate first).

Effective reward rate calculation:
- If the card's `rewardLimit` has been reached (monthly reward ≥ rewardLimit) → effective rate = 0%, card is marked "This Month Full"
- If the card has a `spendLimit` and monthly spend has reached it → applicable rate SHALL fall back to the card's base overseas rate
- If the card has a store bonus and the store's spend cap has not been reached → the store bonus rate SHALL be **added to** the card's base overseas rate (not replace it). Effective rate = base rate + store bonus rate
- Otherwise → use base overseas rate
- If both `rewardLimit` and `spendLimit` are set, both constraints SHALL be checked independently; `rewardLimit` exhaustion takes precedence and sets isFull = true

#### Scenario: Highest rate card ranked first

- **WHEN** Card A has effective rate 5% and Card B has 3% for the selected store
- **THEN** Card A SHALL appear above Card B in the recommendation list

#### Scenario: Card at monthly reward cap marked full

- **WHEN** a card's accumulated monthly reward has reached its `rewardLimit`
- **THEN** that card SHALL be displayed at the bottom of the list with label "This Month Full"

#### Scenario: Store bonus stacks with base rate

- **WHEN** a card has base rate 2.5% and a store bonus of 3% for the selected store, and the store's spend cap has not been reached
- **THEN** the card's effective rate SHALL be 5.5% (2.5% + 3%)
- **THEN** the store bonus rate SHALL NOT replace the base rate

#### Scenario: Spend cap exceeded drops rate to base

- **WHEN** a card has `spendLimit: 50000` and NT$50,000 has already been spent this month
- **THEN** the card's effective rate SHALL fall back to its base overseas rate (not 0%)
- **THEN** the card SHALL NOT be marked "This Month Full"

#### Scenario: Both caps set, reward cap hit first

- **WHEN** a card has both `rewardLimit: 1500` and `spendLimit: 50000`, and monthly reward equals 1500 with spend at 30000
- **THEN** the card SHALL be marked "This Month Full" with effective rate 0%


<!-- @trace
source: 2026-04-07-clarify-bonus-stacking
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/AdvisorPage.tsx
-->

---
### Requirement: Remaining cap display

The system SHALL display the remaining reward allowance or spend allowance for each card on the recommendation screen, as the primary decision-making information, so the user knows how much more they can charge before the cap is reached.

The remaining cap display SHALL be the most visually prominent number on each card row.

For cards with only `rewardLimit`: remaining = rewardLimit − monthly reward earned.
For cards with only `spendLimit`: remaining = spendLimit − monthly spend.
For cards with both: display remaining reward amount (rewardLimit − monthly reward).
For cards with neither cap: display no cap indicator.

#### Scenario: Display remaining reward amount

- **WHEN** a card has `rewardLimit: 3000` and NT$1,200 reward already earned this month
- **THEN** the system SHALL display "NT$1,800 回饋剩餘" as the primary number in the card row

#### Scenario: Display remaining spend amount

- **WHEN** a card has `spendLimit: 30000` and NT$12,000 already spent this month
- **THEN** the system SHALL display "NT$18,000 消費額度剩餘" as the primary number in the card row

#### Scenario: Reward rate shown as secondary information

- **WHEN** a card is displayed in the recommendation list
- **THEN** the effective reward rate (e.g., "5%") SHALL be displayed in a smaller, secondary style below or alongside the remaining cap amount

#### Scenario: No cap configured

- **WHEN** a card has neither `rewardLimit` nor `spendLimit` set
- **THEN** the system SHALL display the effective rate prominently with no cap indicator

---
### Requirement: Cap progress visualization

The system SHALL display structured progress data ("blood bars") for each card in the Advisor recommendation list, allowing the user to see how close each applicable bonus or cap is to being exhausted.

The system SHALL expose a `caps: CapProgress[]` field on each `CardAdvice` result. Each `CapProgress` entry SHALL contain:
- `type`: one of `'reward' | 'spend' | 'store_bonus' | 'payment_method'`
- `label`: human-readable name (e.g. "月回饋上限", "商店加碼", tier prerequisite text)
- `current`: NT$ already consumed toward this cap
- `total`: total NT$ cap value
- `percentage`: `(current / total) * 100`, used by UI for progress bar width

The `caps` array SHALL include entries for all applicable limits of the card:
- Store bonus cap (when `StoreBonus.cap > 0` and a matching store is selected)
- Payment method bonus tier caps (one entry per eligible tier with `monthlyCap > 0`)
- Monthly reward cap (when `rewardLimit` is defined)
- Monthly spend cap (when `spendLimit` is defined)

Cards with no applicable caps SHALL return `caps: []`.

The Advisor UI SHALL render a progress bar for each `CapProgress` entry. Progress bars SHALL be sorted by `percentage` descending (most-exhausted first) so the user notices the most urgent cap first.

Progress bar color SHALL reflect urgency:
- `percentage < 70` → green
- `70 ≤ percentage < 90` → orange
- `percentage ≥ 90` → red

Cards with `isFull: true` SHALL NOT render progress bars.

#### Scenario: Store bonus cap shown as progress bar

- **WHEN** a card has a store bonus with `cap: 10000` for the selected store, and NT$6,000 has already been spent toward that bonus
- **THEN** the Advisor SHALL display a progress bar with `current: 6000`, `total: 10000`, `percentage: 60`, colored green

#### Scenario: Progress bars sorted by urgency

- **WHEN** a card has a store bonus at 80% exhausted and a monthly reward cap at 40% exhausted
- **THEN** the store bonus progress bar SHALL appear before the monthly reward cap bar

#### Scenario: No progress bars when card is full

- **WHEN** a card has `isFull: true`
- **THEN** the Advisor SHALL NOT render any progress bars for that card

#### Scenario: No progress bars when no caps configured

- **WHEN** a card has no `rewardLimit`, no `spendLimit`, no store bonus cap, and no payment method bonus tiers
- **THEN** `caps` SHALL be an empty array and no progress bars SHALL be rendered


<!-- @trace
source: 2026-04-07-clarify-bonus-stacking
updated: 2026-04-07
code:
  - src/lib/rewardCalc.ts
  - src/pages/AdvisorPage.tsx
-->

---
### Requirement: Recommendation based on active trip month

The system SHALL calculate accumulated spending per card using only expense records from the current calendar month (based on expense date). Expenses from prior months SHALL NOT count toward the current month's cap.

#### Scenario: Prior month expenses excluded

- **WHEN** the current month is July and a card has NT$20000 in expenses recorded in June
- **THEN** the card's remaining cap for July SHALL be calculated as if no expenses have been made in July