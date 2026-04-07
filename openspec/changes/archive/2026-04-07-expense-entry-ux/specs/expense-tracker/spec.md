## MODIFIED Requirements

### Requirement: Payment method selection during expense entry

The expense entry form SHALL display a payment method selector with three options: "Apple Pay", "Google Pay", and "實體卡". The selector SHALL appear as chip buttons above the inline card recommendation list. The default selection SHALL be "Apple Pay". The chip order SHALL be: Apple Pay → Google Pay → 實體卡.

The selected payment method SHALL affect the effective rate and estimated reward displayed for each card in the inline recommendation list in real time. The selected payment method SHALL be stored in the `Expense.paymentMethod` field when the expense is saved. The selector SHALL persist its state within the session (not reset between expenses).

#### Scenario: Default payment method is Apple Pay

- **WHEN** user opens the expense entry form for the first time in a session
- **THEN** "Apple Pay" SHALL be selected by default
- **THEN** any card with `paymentMethodBonus` including `apple_pay` SHALL display its Apple Pay effective rate immediately

#### Scenario: Chip order is Apple Pay first

- **WHEN** the payment method selector is rendered
- **THEN** the chips SHALL appear left-to-right in order: Apple Pay, Google Pay, 實體卡

#### Scenario: Switching to 實體卡 removes payment method bonus

- **WHEN** user selects "實體卡"
- **THEN** no payment method bonus SHALL be applied to any card's effective rate
- **THEN** the recommendation list SHALL re-sort based on base and store rates only

---

### Requirement: Inline card recommendation during expense entry

The expense entry form SHALL display a live-sorted list of all configured cards, ranked by effective reward rate for the currently selected store, entered amount, AND selected payment method. The list SHALL update immediately when the amount, store, or payment method changes (no submit required). The top-ranked non-full card SHALL be highlighted as the auto-selected card. All other cards SHALL be shown below in order with their effective rate and, if a cap exists, a text showing the remaining cap amount.

Each card row in the recommendation list SHALL display which payment method to use. When a card has `paymentMethodBonus` and the currently selected payment method matches one of its supported methods AND at least one tier still has remaining cap, the card row SHALL display a badge indicating the recommended payment method (e.g. "Apple Pay" or "Google Pay"). When the selected method is "實體卡" or no bonus applies, no payment method badge SHALL appear.

The top-ranked card in the inline list SHALL display a visual progress bar showing cap utilization: `(total_cap - remaining) / total_cap × 100%`. The bar SHALL only appear when the card has a `rewardLimit` or `spendLimit` configured. Cards with neither cap SHALL show no progress bar.

Cards with `isFull: true` SHALL appear at the bottom of the list with a "本月已滿" label and SHALL NOT be selectable as the confirmed card.

The "🌟 最佳推薦" label SHALL appear as a separate line above the card name within the top-ranked card's row. The card name SHALL always be left-aligned at the same horizontal position as card names in all other rows.

#### Scenario: Best card badge does not misalign card names

- **WHEN** the top-ranked card row renders the "🌟 最佳推薦" label
- **THEN** the label SHALL appear on its own line above the card name
- **THEN** the card name "國泰 Cube" SHALL be left-aligned at the same position as "吉鶴卡" in the row below

#### Scenario: Cards sorted by effective rate including payment method bonus

- **WHEN** user selects "Apple Pay", Card A has effective rate 2.5% (no mobile bonus), Card B has effective rate 4.0% (2.5% base + 1.5% Apple Pay bonus, cap available)
- **THEN** Card B SHALL rank first in the recommendation list
- **THEN** Card B SHALL display "4.0%" as its effective rate

---

## ADDED Requirements

### Requirement: Prerequisite tier selection during expense entry

When the selected payment method matches a card's `paymentMethodBonus.methods` AND that card has at least one tier with a non-null `prerequisite`, the expense entry form SHALL display a prerequisite section within that card's recommendation row. Each prerequisite tier SHALL appear as a toggleable chip labeled with the prerequisite description and the additional rate (e.g. "前月帳單滿 30,000 元 (+1%)").

The prerequisite toggles SHALL be local to the current expense entry and SHALL NOT persist to the card configuration. When a prerequisite toggle is turned on, the effective rate and estimated reward for that card SHALL update immediately to include that tier's rate (subject to remaining monthly cap).

#### Scenario: Prerequisite tier shown when payment method matches

- **WHEN** user selects "Apple Pay" and 吉鶴卡 has two tiers: tier 1 `{ rate: 1.5, monthlyCap: 600 }` and tier 2 `{ rate: 1.0, monthlyCap: 200, prerequisite: "前月帳單滿30000元" }`
- **THEN** 吉鶴卡's row SHALL show a toggleable chip labeled "前月帳單滿 30,000 元 (+1%)"
- **THEN** tier 1 (no prerequisite) SHALL be included in effectiveRate automatically: 2.5% + 1.5% = 4.0%

#### Scenario: Enabling prerequisite tier updates rate immediately

- **WHEN** user taps the "前月帳單滿 30,000 元 (+1%)" chip to enable it
- **THEN** 吉鶴卡's effectiveRate SHALL update to 2.5% + 1.5% + 1.0% = 5.0%
- **THEN** the estimated reward SHALL recalculate using 5.0%

#### Scenario: Prerequisite toggle does not persist to card settings

- **WHEN** user submits the expense with the prerequisite toggle enabled
- **THEN** the saved `Expense` SHALL record the actual rates used at time of logging
- **THEN** 吉鶴卡's card configuration SHALL remain unchanged (prerequisiteMet on the card tier SHALL NOT be modified)

#### Scenario: No prerequisite section when tiers have no conditions

- **WHEN** all of a card's payment method bonus tiers have `prerequisite: null`
- **THEN** no prerequisite toggle section SHALL appear for that card
