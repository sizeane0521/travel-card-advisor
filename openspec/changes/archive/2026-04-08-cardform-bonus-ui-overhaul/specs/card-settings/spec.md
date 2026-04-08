## ADDED Requirements

### Requirement: Store bonus card layout in CardForm

The CardForm store bonus section SHALL render each StoreBonus entry as an individual rounded card panel (consistent with the app's `beast-card rounded-xl` pattern), rather than a flat list separated by bottom borders.

Each card panel SHALL have:
- Background color `#141008` (nested panel pattern) with border `1px solid #3d2e14`
- Rounded corners (`rounded-xl`)
- Internal padding (`p-3`)
- A clear margin or gap between cards (`space-y-2` or equivalent)

#### Scenario: Multiple bonuses render as separate cards

- **WHEN** a card has two StoreBonus entries ("日本熱門商店加碼" and "新戶日本實體消費加碼")
- **THEN** each SHALL be rendered as a visually distinct card panel with rounded corners and separated by a gap
- **THEN** no bottom-border separator SHALL be used between bonuses

### Requirement: Prerequisite bonus visual differentiation in CardForm

When a StoreBonus has a `prerequisite` field defined, its card panel in CardForm SHALL display visual differentiation from bonuses without prerequisites.

The differentiation SHALL include:
- A left border accent in a distinct color (e.g. `borderLeft: '3px solid #f59e0b'`, orange warning color) to distinguish from standard bonuses
- A small badge or label showing the prerequisite text (e.g. "限新戶") next to the bonus name

#### Scenario: Prerequisite bonus has distinct visual style

- **WHEN** a StoreBonus has `prerequisite: "新戶於活動期間申辦且核卡"`
- **THEN** its card panel SHALL display a left border accent in a warning color
- **THEN** the prerequisite text SHALL appear as a visible badge near the bonus name

#### Scenario: Bonus without prerequisite has standard style

- **WHEN** a StoreBonus has no `prerequisite` field
- **THEN** its card panel SHALL use the standard panel styling without any left border accent

### Requirement: Store bonus action buttons consistent styling

The action buttons within each StoreBonus entry in CardForm ("＋店家", "＋分類", "刪除") SHALL use bordered pill/chip styling consistent with the app's toggle button pattern, rather than plain text link styling.

Each button SHALL have:
- A visible border (`border: '1px solid ...'`)
- Rounded corners (`rounded-lg`)
- Padding (`px-2 py-1`)
- Text size `text-xs`

The "＋店家" and "＋分類" buttons SHALL use the inactive toggle style (`color: '#c8a060', borderColor: '#4a3418'`). The "刪除" button SHALL use the delete style (`color: '#c0392b', borderColor: '#5a1a1a'`).

#### Scenario: Action buttons render as chips

- **WHEN** a StoreBonus entry is displayed in CardForm
- **THEN** the "＋店家", "＋分類", and "刪除" buttons SHALL each have a visible border and rounded corners
- **THEN** the buttons SHALL NOT be rendered as plain text links without borders

### Requirement: New bonus form visual separation

The "add new bonus" form at the bottom of the CardForm store bonus section SHALL be visually separated from the existing bonus list.

The form SHALL be enclosed in a distinct panel with:
- A dashed top border or a clearly different background shade to mark the boundary
- All input fields SHALL use consistent sizing that prevents overflow on narrow screens (min-width 375px)

The "加碼 %" and "上限 NT$" input fields SHALL NOT overflow their container on narrow mobile viewports. They SHALL use `min-w-0` to prevent flex item overflow and appropriate `placeholder` text that fits within the rendered width.

#### Scenario: New bonus form is visually distinct from bonus list

- **WHEN** the CardForm store bonus section has existing bonuses and the add form
- **THEN** there SHALL be a clear visual boundary between the last bonus card and the add form

#### Scenario: Input fields do not overflow on narrow screens

- **WHEN** the CardForm is viewed on a 375px wide viewport
- **THEN** the "加碼 %" and "上限 NT$" input fields SHALL remain within their container boundaries
- **THEN** no horizontal scrolling SHALL occur
