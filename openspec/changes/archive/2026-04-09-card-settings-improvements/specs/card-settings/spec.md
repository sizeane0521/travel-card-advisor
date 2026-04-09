## ADDED Requirements

### Requirement: New-user bonus as independent card field

The system SHALL store new-user-only bonus rules in a separate `newUserBonus?: StoreBonus[]` field on the `Card` type, distinct from `storeBonus`. Each entry in `newUserBonus` SHALL use the same `StoreBonus` structure (storeName, stores, rate, cap, capPeriod, subCategories, prerequisite, prerequisiteMet) as store bonuses, with `prerequisite` set to the condition text (e.g. "限新戶") and `prerequisiteMet` defaulting to `false` upon import.

The CardForm SHALL display a dedicated "新戶加碼" section above the "特定店家加碼" section. The section SHALL use the same card panel layout, action buttons, and prerequisite toggle as store bonuses. Users SHALL be able to add, delete, and edit new-user bonus entries independently.

The reward calculation engine SHALL search `[...card.storeBonus, ...(card.newUserBonus ?? [])]` when matching a store name to a bonus rule, using identical eligibility logic (`prerequisiteMet` check).

#### Scenario: New-user bonus imported from URL is displayed in its own section

- **WHEN** user imports a card whose bank page contains a new-user bonus category
- **THEN** the new-user bonus SHALL appear in the "新戶加碼" section of CardForm
- **THEN** the new-user bonus SHALL NOT appear in the "特定店家加碼" section
- **THEN** the card SHALL be saved with `newUserBonus` containing that entry

#### Scenario: New-user bonus participates in reward calculation when prerequisite is met

- **WHEN** a card has a `newUserBonus` entry with `prerequisiteMet: true` for a matching store
- **THEN** the reward calculation SHALL include the new-user bonus rate for that store
- **THEN** the cap tracking SHALL apply to the new-user bonus using its own `cap` and `capPeriod`

#### Scenario: New-user bonus is excluded when prerequisite is not met

- **WHEN** a card has a `newUserBonus` entry with `prerequisiteMet: false` for a matching store
- **THEN** the reward calculation SHALL NOT include the new-user bonus rate
- **THEN** only the base rate (and any other eligible store bonus) SHALL apply

#### Scenario: Existing cards without newUserBonus field remain functional

- **WHEN** a card persisted before this change is loaded (no `newUserBonus` field)
- **THEN** the system SHALL treat `newUserBonus` as an empty array
- **THEN** all existing store bonus, reward, and cap calculations SHALL continue to work unchanged

---

### Requirement: Inline editing of bonus rate and cap in CardForm

The system SHALL allow users to directly edit the `rate` (%) and `cap` (NT$) of existing StoreBonus entries and PaymentMethodBonusTier entries within CardForm, without requiring deletion and re-creation.

Each existing StoreBonus card panel SHALL render the rate and cap as editable `<input type="number">` fields instead of static text. Changes SHALL update the in-memory bonus state immediately on input. The same inline editing SHALL apply to entries in the "新戶加碼" section.

Each existing PaymentMethodBonusTier SHALL render its `rate` (%) and `monthlyCap` (NT$) as editable `<input type="number">` fields.

#### Scenario: User edits rate of an existing store bonus

- **WHEN** user changes the rate input of an existing StoreBonus entry from 3% to 5% and saves the card
- **THEN** the card SHALL be saved with that StoreBonus entry having `rate: 5`
- **THEN** subsequent reward calculations SHALL use the updated rate

#### Scenario: User edits cap of an existing store bonus

- **WHEN** user changes the cap input of an existing StoreBonus entry from NT$600 to NT$1000 and saves
- **THEN** the card SHALL be saved with `cap: 1000` for that entry
- **THEN** cap progress tracking SHALL use the updated cap value

#### Scenario: User edits rate and monthlyCap of an existing payment method tier

- **WHEN** user changes the rate input of an existing PaymentMethodBonusTier from 1.5% to 2.0% and saves
- **THEN** the card SHALL be saved with the updated tier rate
- **THEN** the effective payment method bonus rate SHALL reflect the change in subsequent calculations
