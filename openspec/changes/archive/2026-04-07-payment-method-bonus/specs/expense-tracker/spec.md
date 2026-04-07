## ADDED Requirements

### Requirement: Payment method selection during expense entry

The expense entry form SHALL display a payment method selector with three options: "Apple Pay", "Google Pay", and "實體卡". The selector SHALL appear as chip buttons above the inline card recommendation list. The default selection SHALL be "實體卡".

The selected payment method SHALL affect the effective rate and estimated reward displayed for each card in the inline recommendation list in real time. The selected payment method SHALL be stored in the `Expense.paymentMethod` field when the expense is saved. The selector SHALL persist its state within the session (not reset between expenses).

#### Scenario: Default payment method is physical card

- **WHEN** user opens the expense entry form for the first time in a session
- **THEN** "實體卡" SHALL be selected by default
- **THEN** no payment method bonus SHALL be applied to any card's effective rate

#### Scenario: Switching to Apple Pay updates recommendation rates

- **WHEN** user selects "Apple Pay" and a card has `paymentMethodBonus.methods` including `'apple_pay'` with eligible tier rate 1.5%
- **THEN** that card's displayed effective rate SHALL increase by 1.5% (subject to remaining tier cap)
- **THEN** the recommendation list SHALL re-sort based on the updated effective rates

#### Scenario: Payment method saved with expense

- **WHEN** user selects "Google Pay" and submits an expense
- **THEN** the saved `Expense.paymentMethod` SHALL be `'google_pay'`

#### Scenario: Card without paymentMethodBonus unaffected by selector

- **WHEN** user selects "Apple Pay" but a card has no `paymentMethodBonus`
- **THEN** that card's effective rate SHALL remain unchanged (no bonus applied)

---

## MODIFIED Requirements

### Requirement: Inline card recommendation during expense entry

The expense entry form SHALL display a live-sorted list of all configured cards, ranked by effective reward rate for the currently selected store, entered amount, AND selected payment method. The list SHALL update immediately when the amount, store, or payment method changes (no submit required). The top-ranked non-full card SHALL be highlighted as the auto-selected card. All other cards SHALL be shown below in order with their effective rate and, if a cap exists, a text showing the remaining cap amount.

Each card row in the recommendation list SHALL display which payment method to use. When a card has `paymentMethodBonus` and the currently selected payment method matches one of its supported methods AND at least one tier still has remaining cap, the card row SHALL display a badge indicating the recommended payment method (e.g. "Apple Pay" or "Google Pay"). When the selected method is "實體卡" or no bonus applies, no payment method badge SHALL appear.

The top-ranked card in the inline list SHALL display a visual progress bar showing cap utilization: `(total_cap - remaining) / total_cap × 100%`. The bar SHALL only appear when the card has a `rewardLimit` or `spendLimit` configured. Cards with neither cap SHALL show no progress bar.

Cards with `isFull: true` SHALL appear at the bottom of the list with a "本月已滿" label and SHALL NOT be selectable as the confirmed card.

#### Scenario: Cards sorted by effective rate including payment method bonus

- **WHEN** user selects "Apple Pay", Card A has effective rate 2.5% (no mobile bonus), Card B has effective rate 5.0% (2.5% base + 2.5% Apple Pay bonus, cap available)
- **THEN** Card B SHALL rank first in the recommendation list
- **THEN** Card B's row SHALL display an "Apple Pay" badge

#### Scenario: Payment method badge hidden when bonus exhausted

- **WHEN** a card's payment method bonus tiers are all at monthly cap
- **THEN** no payment method badge SHALL appear for that card regardless of selected payment method
- **THEN** the effective rate SHALL reflect only base rate and any store bonus

#### Scenario: Cards sorted by effective rate for selected store

- **WHEN** user selects store "唐吉訶德" and Card A has 3% bonus for that store, Card B has 2.5% base rate
- **THEN** Card A SHALL be automatically selected (highlighted) in the inline recommendation list
- **THEN** the submit button SHALL use Card A unless the user taps Card B to override

#### Scenario: Auto-selects next best card when top card is full

- **WHEN** the highest-rate card for the selected store has `isFull: true`
- **THEN** the system SHALL automatically select the next card in the ranked list that is not full

#### Scenario: Top card shows progress bar when cap exists

- **WHEN** the top-ranked card has `rewardLimit: 600` and has earned NT$400 this month
- **THEN** the inline card row SHALL display a progress bar at approximately 67% fill
- **THEN** the remaining text SHALL show "NT$200 回饋剩餘"

#### Scenario: Top card shows no progress bar when no cap

- **WHEN** the top-ranked card has neither `rewardLimit` nor `spendLimit`
- **THEN** no progress bar SHALL be displayed for that card
- **THEN** the effective rate SHALL be displayed prominently

#### Scenario: Full card shown at bottom and not auto-selected

- **WHEN** a card with the highest base rate has `isFull: true`
- **THEN** that card SHALL appear at the bottom of the inline list
- **THEN** the next non-full card SHALL be auto-selected instead

#### Scenario: User overrides auto-selection

- **WHEN** user taps a non-auto-selected card in the inline list
- **THEN** that card SHALL become the confirmed selection (visually highlighted)
- **THEN** submitting SHALL record the expense with the user-selected card
