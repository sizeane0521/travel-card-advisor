## MODIFIED Requirements

### Requirement: Reward total display takes visual priority over breakdown details

Within each card recommendation row in CalcPage, the layout SHALL be restructured to a horizontal design with the following sections:

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
- Left: Rate breakdown text (`text-xs`, `#c8a060`) showing `基本X% + APX% + 店家X%` with `%` unit on each value (only when payment or store bonus is active)
- Right: Reward total `NT$XXX` (`text-2xl font-bold`, green `#4ade80`) — only shown when `twdAmount > 0` and `!isFull`

**Divider:** A horizontal separator line (only rendered when breakdown details exist).

**Detail row (below divider):**
A single line of text (`text-xs`, `#9a7040`) combining all non-zero reward components separated by ` | `:
- Format: `基本 {N} | {storeBonusLabel}加碼 {N} | 行動支付加碼 {N}`
- Only components with value > 0 SHALL be included
- Only shown when `twdAmount > 0` and breakdown exists

**Warnings (unchanged):** Store bonus cap warning and operation warning remain below the detail row.

**Progress bar:** Spend/reward progress bar for the top card remains below warnings.

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
- **THEN** the second row SHALL show rate breakdown text on the left (e.g. "基本2.5% + AP1.5% + 店家3%")
- **THEN** "NT$700" SHALL appear on the right in large green text (`text-2xl font-bold`)

#### Scenario: Detail row shows items separated by pipe

- **WHEN** `breakdown: { base: 250, store: 300, paymentMethod: 150 }` and all values > 0
- **THEN** the detail row below the divider SHALL show "基本 250 | {store}加碼 300 | 行動支付加碼 150"

#### Scenario: Full card shows 0% without reward total

- **WHEN** a card's monthly cap is fully consumed (`isFull: true`)
- **THEN** the rate SHALL display "0%" in red
- **THEN** no reward total or detail rows SHALL be shown

---

### Requirement: StoreBonus prerequisite mechanism

The `StoreBonus` interface SHALL support an optional `prerequisite` field (string) and an optional `prerequisiteMet` field (boolean). When `prerequisite` is defined and `prerequisiteMet` is not `true`, the store bonus SHALL be excluded from:
- Effective rate calculation in `calcCardAdvice`
- Reward computation in `calcExpenseReward`
- Bonus status panel display in LedgerPage
- Store bonus matching in `findStoreBonus`

When `prerequisite` is absent or `prerequisiteMet` is `true`, the store bonus SHALL behave as before (fully active).

The CalcPage expense entry form SHALL NOT display any prerequisite toggle chips or buttons for StoreBonus entries. The prerequisite state (`prerequisiteMet`) is managed exclusively in SettingsPage (CardForm) and is applied directly in calculations. The card recommendation results in CalcPage SHALL reflect the current `prerequisiteMet` values without offering any in-place toggle.

The CardForm SHALL allow users to set `prerequisiteMet` for each StoreBonus that has a `prerequisite` field.

The AI card import prompt SHALL recognize store bonus prerequisites (e.g. "限新戶", "需登錄") and output them in the `storeRules[].prerequisite` field.

#### Scenario: StoreBonus with unmet prerequisite excluded from calculation

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `prerequisiteMet: false`
- **THEN** `findStoreBonus` SHALL NOT return this bonus for matching stores
- **THEN** the bonus rate SHALL NOT be included in `effectiveRate`
- **THEN** `calcExpenseReward` SHALL NOT compute any store bonus reward from this entry

#### Scenario: StoreBonus with met prerequisite included normally

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `prerequisiteMet: true`
- **THEN** the bonus SHALL behave identically to a StoreBonus without a prerequisite

#### Scenario: StoreBonus without prerequisite always active

- **WHEN** a card has a StoreBonus with no `prerequisite` field
- **THEN** the bonus SHALL always be included in calculations regardless of `prerequisiteMet`

#### Scenario: CalcPage does not show prerequisite toggle chips

- **WHEN** a card has any StoreBonus with a `prerequisite` field (regardless of `prerequisiteMet` value)
- **THEN** CalcPage SHALL NOT render any toggle chip or button for that prerequisite
- **THEN** the bonus inclusion is determined solely by the stored `prerequisiteMet` value

#### Scenario: CalcPage hides prerequisite toggle when prerequisiteMet is false

- **WHEN** a card has a StoreBonus with `prerequisite: "限新戶"` and `prerequisiteMet: false`
- **THEN** no toggle chip SHALL be rendered for that StoreBonus in CalcPage
- **THEN** the bonus SHALL be excluded from effectiveRate and reward estimate without any user interaction
