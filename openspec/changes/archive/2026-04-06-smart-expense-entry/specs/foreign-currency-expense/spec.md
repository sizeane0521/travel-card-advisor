## ADDED Requirements

### Requirement: Real-time JPY to TWD conversion preview

When the active trip has an `exchangeRate` configured, the expense entry form SHALL display a real-time conversion preview below the amount input field. The preview SHALL show the TWD equivalent of the currently entered amount, formatted as "≈ NT$XXX" where XXX is `Math.floor(enteredAmount × rate)`. The preview SHALL update on every keystroke. The preview SHALL only appear when the entered amount is a positive integer greater than 0. When no amount is entered or the amount is 0, the preview line SHALL be hidden.

#### Scenario: Preview appears while typing JPY

- **WHEN** the active trip has `exchangeRate: { currency: "JPY", rate: 0.22 }` and user types "1500"
- **THEN** the form SHALL display "≈ NT$330" immediately below the amount input

#### Scenario: Preview hidden when amount is empty

- **WHEN** the active trip has an exchange rate but the amount input is empty or zero
- **THEN** no conversion preview SHALL be displayed

#### Scenario: Preview not shown without exchange rate

- **WHEN** the active trip has no `exchangeRate`
- **THEN** no conversion preview SHALL be displayed regardless of the entered amount
