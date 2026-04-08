## MODIFIED Requirements

### Requirement: Inline card recommendation during expense entry

The expense entry form SHALL display a live-sorted list of all configured cards, ranked by effective reward rate for the currently selected store, entered amount, AND selected payment method. The list SHALL update immediately when the amount, store, or payment method changes (no submit required). The top-ranked non-full card SHALL be highlighted as the auto-selected card. All other cards SHALL be shown below in order with their effective rate and, if a cap exists, a text showing the remaining cap amount.

Each card row in the recommendation list SHALL display which payment method to use. When a card has `paymentMethodBonus` and the currently selected payment method matches one of its supported methods AND at least one tier still has remaining cap, the card row SHALL display a badge indicating the recommended payment method (e.g. "Apple Pay" or "Google Pay"). When the selected method is "實體卡" or no bonus applies, no payment method badge SHALL appear.

The top-ranked card in the inline list SHALL display a visual progress bar showing cap utilization: `(total_cap - remaining) / total_cap × 100%`. The bar SHALL only appear when the card has a `rewardLimit` or `spendLimit` configured. Cards with neither cap SHALL show no progress bar.

Cards with `isFull: true` SHALL appear at the bottom of the list with a "本月已滿" label and SHALL NOT be selectable or recordable.

The "🌟 最佳推薦" label SHALL appear as a separate line above the card name within the top-ranked card's row. The card name SHALL always be left-aligned at the same horizontal position as card names in all other rows.

Each card row SHALL include a「+記帳」inline action button on the right side of the row. The button SHALL be disabled when `card.isFull === true`. Tapping the button SHALL record the expense using that card (see expense-tracker spec for full record behavior).

#### Scenario: Best card badge does not misalign card names

- **WHEN** the top-ranked card row renders the "🌟 最佳推薦" label
- **THEN** the label SHALL appear on its own line above the card name
- **THEN** the card name "國泰 Cube" SHALL be left-aligned at the same position as "吉鶴卡" in the row below

#### Scenario: Cards sorted by effective rate including payment method bonus

- **WHEN** user selects "Apple Pay", Card A has effective rate 2.5% (no mobile bonus), Card B has effective rate 4.0% (2.5% base + 1.5% Apple Pay bonus, cap available)
- **THEN** Card B SHALL rank first in the recommendation list
- **THEN** Card B SHALL display "4.0%" as its effective rate

#### Scenario: Per-card button visible on each row

- **WHEN** the recommendation list renders with at least one non-full card
- **THEN** each non-full card row SHALL display a「+記帳」button on its right side
- **THEN** full cards SHALL render their「+記帳」button in a disabled state

---

## MODIFIED Requirements

### Requirement: Bonus status panel in expense entry page

The system SHALL display a bonus status panel in the 明細 Tab (LedgerPage), below the expense list. The panel SHALL NOT appear in the 試算 Tab (CalcPage). The panel SHALL show the current utilization status of each store bonus rule across all configured cards.

For each StoreBonus with `cap > 0`, the panel SHALL display:
- The card name and store bonus label (e.g. "聯邦吉鶴卡・熱門商店加碼")
- The amount used vs. total cap (e.g. "NT$600 / NT$600")
- A visual progress bar reflecting `used / cap`
- Whether the cap period is monthly or for the entire promotion period

The panel SHALL only show store bonuses for cards that have at least one StoreBonus with `cap > 0`.

#### Scenario: Panel shown in 明細 Tab

- **WHEN** user navigates to the 明細 Tab and at least one card has a capped StoreBonus
- **THEN** the bonus status panel SHALL be rendered below the expense list

#### Scenario: Panel not shown in 試算 Tab

- **WHEN** user is on the 試算 Tab
- **THEN** the bonus status panel SHALL NOT be rendered (the mini progress bar on the top recommendation card is the only cap indicator in 試算)

#### Scenario: Panel shows period cap status

- **WHEN** 吉鶴卡 has a store bonus with `cap: 20000`, `capPeriod: "period"`, and the user has spent NT$10,000 at matching stores across all trips within the card's validity period
- **THEN** the bonus status panel SHALL show "NT$10,000 / NT$20,000" for that bonus
- **THEN** the progress bar SHALL reflect 50% utilization

#### Scenario: Panel shows monthly cap reset

- **WHEN** a StoreBonus has `capPeriod: "monthly"` and it is a new calendar month
- **THEN** the displayed usage SHALL be NT$0 (reset)

#### Scenario: Panel hidden when no caps configured

- **WHEN** all configured cards have only uncapped store bonuses (`cap: 0`)
- **THEN** the bonus status panel SHALL NOT be rendered
