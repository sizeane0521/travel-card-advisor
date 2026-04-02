# card-advisor Specification

## Purpose

TBD - created by archiving change 'travel-card-advisor'. Update Purpose after archive.

## Requirements

### Requirement: Store selection for recommendation

The system SHALL present a list of available stores derived from store bonus rules across all configured cards, plus a "General Purchase" option. The user SHALL be able to select a store before viewing card recommendations.

#### Scenario: Select a specific store

- **WHEN** user selects "Don Quijote" from the store list
- **THEN** the system SHALL display card recommendations using the Don Quijote bonus rate for cards that have it configured

#### Scenario: Select general purchase

- **WHEN** user selects "General Purchase"
- **THEN** the system SHALL display card recommendations using each card's base overseas rate

---
### Requirement: Card recommendation ranking

The system SHALL rank all configured cards by their effective reward rate for the selected store and current month, in descending order (highest rate first).

Effective reward rate calculation:
- If the card's monthly reward cap has been reached → effective rate = 0%, card is marked "This Month Full"
- If the card has a store bonus and the store's spend cap has not been reached → use store bonus rate
- Otherwise → use base overseas rate
- If monthly spend cap type: effective rate applies only up to the remaining spend allowance; beyond that, base rate applies

#### Scenario: Highest rate card ranked first

- **WHEN** Card A has effective rate 5% and Card B has 3% for the selected store
- **THEN** Card A SHALL appear above Card B in the recommendation list

#### Scenario: Card at monthly cap marked full

- **WHEN** a card's accumulated monthly reward has reached its monthly cap
- **THEN** that card SHALL be displayed at the bottom of the list with label "This Month Full"

#### Scenario: Store bonus applied correctly

- **WHEN** user selects a store for which Card A has a 5% bonus and Card B only has a 3% base rate
- **THEN** Card A SHALL show 5% effective rate and Card B SHALL show 3% effective rate

---
### Requirement: Remaining cap display

The system SHALL display the remaining spend allowance or remaining reward allowance for each card on the recommendation screen, so the user knows how much more they can charge to that card before the cap is reached.

#### Scenario: Display remaining reward amount

- **WHEN** a card has a reward-type monthly cap of NT$3000 and NT$1200 reward already earned
- **THEN** the system SHALL display "NT$1,800 reward remaining"

#### Scenario: Display remaining spend amount

- **WHEN** a card has a spend-type monthly cap of NT$30000 and NT$12000 already spent this month
- **THEN** the system SHALL display "NT$18,000 spend remaining"

---
### Requirement: Recommendation based on active trip month

The system SHALL calculate accumulated spending per card using only expense records from the current calendar month (based on expense date). Expenses from prior months SHALL NOT count toward the current month's cap.

#### Scenario: Prior month expenses excluded

- **WHEN** the current month is July and a card has NT$20000 in expenses recorded in June
- **THEN** the card's remaining cap for July SHALL be calculated as if no expenses have been made in July
