## ADDED Requirements

### Requirement: Settings page section order

The settings page SHALL display its sections in the following top-to-bottom order:
1. AI import settings (API key selection and entry)
2. Credit card list (with add card button)
3. Cross-device sync (QR code export and import)

This order reflects the natural user workflow: configure the AI provider first, then set up cards, then optionally sync to other devices.

#### Scenario: Settings page renders sections in correct order

- **WHEN** user navigates to the settings page
- **THEN** the AI import settings section SHALL appear first (topmost)
- **THEN** the credit card list section SHALL appear second
- **THEN** the cross-device sync section SHALL appear last (bottommost)

---

### Requirement: Visual credit card face in settings list

The credit card list in the settings page SHALL display each card as a visual credit card face panel instead of a plain text panel.

Each card face SHALL:
- Have a fixed height of `h-40` (160px) and full width
- Display a CSS gradient background derived from the card name using a deterministic hash function, so the same card name always produces the same color scheme
- Show the card name in large text (`text-xl font-bold`) at the bottom-left, with a text shadow for readability
- Show the base reward rate (e.g. "2.5%") at the top-right corner inside a semi-transparent badge
- Show the promotion end date (`validTo`) at the bottom-right if present, formatted as `YYYY/MM/DD`
- Show an expiry badge ("活動已結束" or "即將到期") at the top-left if applicable, using the same color rules as the current implementation
- Include decorative card-style details (e.g. a subtle chip icon or horizontal accent lines) to reinforce the credit card metaphor

Below each card face, a row of action items SHALL be rendered:
- Bank promotion page link (if `bankUrl` is set), opening in a new tab
- "編輯" button
- "刪除" button

#### Scenario: Card face renders with gradient background

- **WHEN** the settings page renders a card with name "吉鶴卡"
- **THEN** the card face SHALL display a gradient background derived from hashing "吉鶴卡"
- **THEN** the same card SHALL always render with the same gradient on every page load

#### Scenario: Card face shows base rate badge

- **WHEN** a card has `baseRate: 2.5`
- **THEN** the card face SHALL display "2.5%" in a semi-transparent badge at the top-right

#### Scenario: Card face shows validTo date

- **WHEN** a card has `validTo: "2026-06-30"`
- **THEN** the card face SHALL display "2026/06/30" at the bottom-right of the card face

#### Scenario: Card face hides validTo when not set

- **WHEN** a card has no `validTo` field
- **THEN** no date SHALL be rendered on the card face

#### Scenario: Action row below card face

- **WHEN** the card has `bankUrl` set
- **THEN** the action row below the card face SHALL display the bank link, "編輯" button, and "刪除" button
- **WHEN** the card has no `bankUrl`
- **THEN** the action row SHALL display only the "編輯" and "刪除" buttons

---

### Requirement: CardForm section active focus state

Each section panel in CardForm (基本資訊, 新戶加碼, 特定店家加碼, 行動支付加碼) SHALL visually indicate when it is the active editing section.

A section panel SHALL be treated as active when any `<input>`, `<textarea>`, or `<button>` within it has keyboard focus (CSS `focus-within` state). When active:
- The panel border color SHALL change from the resting color (`#4a3418`) to the active color (`#c8901a`)
- A subtle outer glow SHALL appear: `box-shadow: 0 0 0 2px rgba(200, 144, 26, 0.15)`

When focus leaves the panel, it SHALL revert immediately to the resting style.

The transition SHALL be smooth (`transition: border-color 0.15s, box-shadow 0.15s`).

#### Scenario: Section panel highlights on input focus

- **WHEN** user clicks into the base rate input inside the 基本資訊 section
- **THEN** the 基本資訊 panel border SHALL change to `#c8901a`
- **THEN** the panel SHALL display the outer glow shadow

#### Scenario: Section panel reverts when focus leaves

- **WHEN** user moves focus from an input inside 新戶加碼 to an input inside 特定店家加碼
- **THEN** the 新戶加碼 panel SHALL revert to the resting border color `#4a3418`
- **THEN** the 特定店家加碼 panel SHALL become active with the gold border

#### Scenario: Only one section active at a time

- **WHEN** focus is inside the 行動支付加碼 section
- **THEN** only the 行動支付加碼 panel SHALL display the active gold border
- **THEN** all other section panels SHALL display the resting dark border
