## MODIFIED Requirements

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

## ADDED Requirements

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
