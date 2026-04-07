## ADDED Requirements

### Requirement: AI card import recognizes payment method bonuses

When the AI parses a bank credit card page and detects payment method bonuses (Apple Pay, Google Pay, 行動支付, 感應支付), the system SHALL output them as `paymentMethodBonusTiers` instead of `storeRules`. Each tier SHALL include the bonus rate, monthly reward cap in NTD, and an optional prerequisite condition string.

The system SHALL populate the card's `paymentMethodBonus` form fields automatically from the imported tiers: the payment method bonus toggle SHALL be enabled, both Apple Pay and Google Pay SHALL be pre-selected, and each imported tier SHALL appear as a row in the tier list.

#### Scenario: Import card with payment method bonus tiers

- **WHEN** the AI parses a page containing 行動支付登錄加碼 1.5% (月上限 NT$600) and 帳單滿額加碼 1.0% (前月帳單滿 NT$30,000, 月上限 NT$200)
- **THEN** `CardImportResult.paymentMethodBonusTiers` SHALL contain two entries: `{ rate: 1.5, monthlyCap: 600 }` and `{ rate: 1.0, monthlyCap: 200, prerequisite: "前月帳單滿30000元" }`
- **THEN** the card form SHALL have payment method bonus enabled with Apple Pay and Google Pay selected
- **THEN** the tier list SHALL show both tiers with their respective rates and caps

#### Scenario: Payment method bonus does not appear in storeBonus

- **WHEN** the AI parses a page where 行動支付加碼 is present
- **THEN** `CardImportResult.storeRules` SHALL NOT contain any entry with a category name matching 行動支付, Apple Pay, Google Pay, or 感應支付 keywords
- **THEN** the card's `storeBonus[]` SHALL NOT include a payment-method bonus entry after import

#### Scenario: Import card with no payment method bonus

- **WHEN** the AI parses a page with no 行動支付 / Apple Pay / Google Pay bonus
- **THEN** `CardImportResult.paymentMethodBonusTiers` SHALL be an empty array or absent
- **THEN** the payment method bonus toggle SHALL remain disabled in the card form
