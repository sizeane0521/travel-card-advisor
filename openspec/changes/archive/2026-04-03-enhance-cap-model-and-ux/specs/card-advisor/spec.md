## MODIFIED Requirements

### Requirement: Card recommendation ranking

The system SHALL rank all configured cards by their effective reward rate for the selected store and current month, in descending order (highest rate first).

Effective reward rate calculation:
- If the card's `rewardLimit` has been reached (monthly reward ≥ rewardLimit) → effective rate = 0%, card is marked "This Month Full"
- If the card has a `spendLimit` and monthly spend has reached it → applicable rate SHALL fall back to the card's base overseas rate
- If the card has a store bonus and the store's spend cap has not been reached → use store bonus rate
- Otherwise → use base overseas rate
- If both `rewardLimit` and `spendLimit` are set, both constraints SHALL be checked independently; `rewardLimit` exhaustion takes precedence and sets isFull = true

#### Scenario: Highest rate card ranked first

- **WHEN** Card A has effective rate 5% and Card B has 3% for the selected store
- **THEN** Card A SHALL appear above Card B in the recommendation list

#### Scenario: Card at monthly reward cap marked full

- **WHEN** a card's accumulated monthly reward has reached its `rewardLimit`
- **THEN** that card SHALL be displayed at the bottom of the list with label "This Month Full"

#### Scenario: Store bonus applied correctly

- **WHEN** user selects a store for which Card A has a 5% bonus and Card B only has a 3% base rate
- **THEN** Card A SHALL show 5% effective rate and Card B SHALL show 3% effective rate

#### Scenario: Spend cap exceeded drops rate to base

- **WHEN** a card has `spendLimit: 50000` and NT$50,000 has already been spent this month
- **THEN** the card's effective rate SHALL fall back to its base overseas rate (not 0%)
- **THEN** the card SHALL NOT be marked "This Month Full"

#### Scenario: Both caps set, reward cap hit first

- **WHEN** a card has both `rewardLimit: 1500` and `spendLimit: 50000`, and monthly reward equals 1500 with spend at 30000
- **THEN** the card SHALL be marked "This Month Full" with effective rate 0%

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
