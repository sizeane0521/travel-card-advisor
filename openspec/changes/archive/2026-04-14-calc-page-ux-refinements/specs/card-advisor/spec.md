## MODIFIED Requirements

### Requirement: Reward total display takes visual priority over breakdown details

Within each card recommendation row in CalcPage, the layout SHALL be structured as follows:

**Interactivity guard:**
When `validAmount` is `false` (the amount input is empty or non-positive), the entire card row SHALL be non-interactive:
- The card container's `onClick` SHALL NOT fire
- The `+刷卡` button SHALL be `disabled`
- The card container SHALL render with `opacity: 0.4` and `cursor: default`
This guard is independent of and additive to the existing `isFull` guard.

**Recommendation badge (best recommendation only):**
The card with the highest effective rate that is not full SHALL display a "推薦" badge absolutely positioned at the top-left corner of the card container. The card container SHALL use `position: relative` and `overflow: hidden`. The badge SHALL be positioned with `position: absolute; top: 0; left: 0` and SHALL NOT occupy any flex or block space, ensuring all cards (with or without the badge) have identical content width and layout alignment. The badge SHALL have a gold/yellow background (`#c8901a`) and "推薦" text in dark color (`#0d0a06`). Cards that are NOT the top recommendation SHALL NOT display this badge.

**First row (card identity and action):**
A single horizontal row containing, in order:
1. Card name (`font-medium`, `text-[#f2e8c9]`, `flex-1`)
2. Payment method badge (Apple Pay / Google Pay — only when `paymentMethod !== 'physical'` and the badge applies)
3. Effective rate percentage (`text-lg font-bold`, gold color `#d4a017`; `0%` in red `#c0392b` if `isFull`)
4. "+刷卡" action button (`shrink-0`)

**Second row (rates and reward total):**
A horizontal row containing:
- Left: Rate breakdown text (`text-xs`, `#c8a060`) showing `基本X% + 行動支付X% + 店家X%` with `%` unit on each value (only when payment or store bonus is active). The payment method bonus prefix SHALL always be displayed as `行動支付` regardless of whether the selected payment method is Apple Pay or Google Pay.
- Right: Reward total `NT$XXX` (`text-2xl font-bold`, green `#4ade80`) — only shown when `twdAmount > 0` and `!isFull`

**Divider:** A horizontal separator line (only rendered when breakdown details exist).

**Detail row (below divider):**
A single line of text (`text-xs`, `#9a7040`) combining all non-zero reward components separated by ` | `:
- Format: `基本 {N} | {storeBonusLabel}加碼 {N} | 行動支付加碼 {N}`
- Only components with value > 0 SHALL be included
- Only shown when `twdAmount > 0` and breakdown exists

**Warnings (unchanged):** Store bonus cap warning and operation warning remain below the detail row.

**Progress bar:** Spend/reward progress bar for the top card remains below warnings.

#### Scenario: Card row is non-interactive when no valid amount

- **WHEN** the amount input is empty or zero (`validAmount === false`)
- **THEN** clicking the card container SHALL NOT select the card
- **THEN** the `+刷卡` button SHALL be disabled
- **THEN** the card row SHALL render with `opacity: 0.4` and `cursor: default`

#### Scenario: Card row becomes interactive once amount is entered

- **WHEN** the user enters a positive amount (`validAmount === true`) and the card is not full
- **THEN** clicking the card container SHALL select the card
- **THEN** the `+刷卡` button SHALL be enabled

#### Scenario: Full card remains non-interactive even with valid amount

- **WHEN** `isFull: true` and `validAmount: true`
- **THEN** the `+刷卡` button SHALL remain disabled
- **THEN** clicking the card SHALL NOT select it

#### Scenario: Rate breakdown shows 行動支付 for Apple Pay

- **WHEN** `paymentMethod: 'apple_pay'` and `rateBreakdown.paymentMethod > 0`
- **THEN** the second row SHALL show `行動支付X%` (not `APX%`)

#### Scenario: Rate breakdown shows 行動支付 for Google Pay

- **WHEN** `paymentMethod: 'google_pay'` and `rateBreakdown.paymentMethod > 0`
- **THEN** the second row SHALL show `行動支付X%` (not `GPX%`)

#### Scenario: Best card displays absolute-positioned recommendation badge

- **WHEN** a card is the highest-reward non-full card in the list
- **THEN** a gold "推薦" badge SHALL be displayed at the top-left corner of the card using absolute positioning
- **THEN** the badge SHALL NOT occupy any flex layout space
- **THEN** all cards (with or without badge) SHALL have identical content area width

#### Scenario: Non-top card has no badge and no offset

- **WHEN** a card is NOT the highest-reward non-full card
- **THEN** no "推薦" badge SHALL be displayed
- **THEN** the card's content SHALL start from the left edge without any indentation

#### Scenario: First row shows card name, rate, and button in one line

- **WHEN** a card recommendation row is rendered with `effectiveRate: 7`
- **THEN** the card name, payment badge, "7%", and "+刷卡" button SHALL all appear on a single horizontal row

#### Scenario: Second row shows rate breakdown left and reward total right

- **WHEN** `twdAmount: 10000` and `breakdown: { base: 250, store: 300, paymentMethod: 150 }`
- **THEN** the second row SHALL show rate breakdown text on the left (e.g. "基本2.5% + 行動支付1.5% + 店家3%")
- **THEN** "NT$700" SHALL appear on the right in large green text (`text-2xl font-bold`)

#### Scenario: Detail row shows items separated by pipe

- **WHEN** `breakdown: { base: 250, store: 300, paymentMethod: 150 }` and all values > 0
- **THEN** the detail row below the divider SHALL show "基本 250 | {store}加碼 300 | 行動支付加碼 150"

#### Scenario: Full card shows 0% without reward total

- **WHEN** a card's monthly cap is fully consumed (`isFull: true`)
- **THEN** the rate SHALL display "0%" in red
- **THEN** no reward total or detail rows SHALL be shown
