## MODIFIED Requirements

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
