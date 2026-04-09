## MODIFIED Requirements

### Requirement: Import card info from bank promotion URL

The system SHALL allow users to provide a bank promotion page URL and automatically extract credit card reward information from it using Claude API, pre-filling the card configuration form to reduce manual data entry. The system SHALL support Claude and Gemini as AI providers, selected by the user in settings. The system SHALL use a self-hosted Cloudflare Worker as the CORS proxy to fetch bank promotion page HTML.

The AI extraction prompt SHALL instruct the model to output the following fields:
- `cardName`: card name string or null
- `baseRate`: overseas general reward rate (number, e.g. 3.0 = 3%) or null
- `rewardCap`: monthly reward limit in NTD (integer) or null
- `spendCap`: monthly spend limit in NTD (integer) or null
- `validFrom`: promotion start date in YYYY-MM-DD format (string) or null
- `validTo`: promotion end date in YYYY-MM-DD format (string) or null
- `storeRules`: array of store bonus rules — SHALL only contain non-new-user bonuses; any rule whose prerequisite is a new-user condition (e.g. "限新戶", "限首次", "限初次") SHALL be placed in `newUserBonusRules` instead
- `newUserBonusRules`: array of new-user-only store bonus rules, each with:
  - `categoryName`: bank-defined category label
  - `stores`: array of actual store name strings (empty array if none listed)
  - `bonusRate`: bonus reward rate (number)
  - `spendCap`: per-category spend cap in NTD (integer, 0 if not specified)
  - `capPeriod`: "monthly" or "period"
  - `subCategories` (optional): array of `{ label, stores }` for visual sub-groups
- `paymentMethodBonusTiers`: array of payment method bonus tiers (unchanged)

Each `storeRules` entry SHALL contain: `categoryName`, `stores`, `bonusRate`, `spendCap`, `capPeriod`, optional `subCategories`, and optional `prerequisite` (only for non-new-user conditions such as "需登錄").

The prompt SHALL include an example showing both `storeRules` and `newUserBonusRules` populated.

The `CardImportResult` type SHALL include `newUserBonusRules` as an optional array alongside `storeRules`.

#### Scenario: Successful extraction with store list

- **WHEN** user enters a valid bank promotion URL for a card whose page lists specific stores under a bonus category
- **THEN** each `storeRules` entry SHALL contain a non-empty `stores` array with those store names
- **THEN** the form SHALL pre-fill store bonus rules with both `categoryName` and `stores` populated

#### Scenario: Extraction captures visual sub-groups as subCategories

- **WHEN** the bank promotion page visually groups stores under sub-headings within one bonus category
- **THEN** the corresponding `storeRules` entry SHALL contain `subCategories` with one object per visual group
- **THEN** each sub-category object SHALL have `label` matching the sub-heading text and `stores` matching the listed store names

#### Scenario: No visual sub-groups on page

- **WHEN** the bank promotion page lists stores under a bonus category without any visual sub-grouping
- **THEN** the corresponding `storeRules` entry SHALL NOT contain a `subCategories` field

#### Scenario: Extraction captures promotion validity dates

- **WHEN** the bank promotion page states an activity period (e.g. "115/1/1–115/6/30")
- **THEN** `validFrom` SHALL be "2026-01-01" and `validTo` SHALL be "2026-06-30"

#### Scenario: Extraction captures period cap type

- **WHEN** the bank promotion page states a cap as "活動期間上限 NT$600"
- **THEN** the corresponding `storeRules` entry SHALL have `capPeriod: "period"` and `spendCap: 600`

#### Scenario: Extraction captures monthly cap type

- **WHEN** the bank promotion page states a cap as "每月上限 NT$600"
- **THEN** the corresponding `storeRules` entry SHALL have `capPeriod: "monthly"` and `spendCap: 600`

#### Scenario: New-user bonus is placed in newUserBonusRules

- **WHEN** the bank promotion page contains a bonus category with the prerequisite "限新戶", "限首次", or "限初次"
- **THEN** that rule SHALL be placed in `newUserBonusRules` and SHALL NOT appear in `storeRules`
- **THEN** the `newUserBonusRules` entry SHALL NOT contain a `prerequisite` field (the new-user constraint is implied by the array it belongs to)
- **THEN** the form SHALL display the new-user bonus in the "新戶加碼" section, separate from "特定店家加碼"

#### Scenario: Non-new-user prerequisite remains in storeRules

- **WHEN** a bonus category has a prerequisite such as "需登錄" (not a new-user condition)
- **THEN** that rule SHALL remain in `storeRules` with its `prerequisite` field populated

#### Scenario: No store list available on page

- **WHEN** the bank promotion page only names a category without listing individual stores
- **THEN** the `stores` array for that rule SHALL be empty (`[]`)
- **THEN** the category SHALL still be importable and manually editable after import

#### Scenario: Partial extraction with missing fields

- **WHEN** the AI provider returns a JSON response with one or more fields absent or null
- **THEN** the system SHALL pre-fill available fields and leave missing fields empty
- **THEN** the system SHALL display a notice indicating which fields were not found

#### Scenario: CORS proxy fetch failure

- **WHEN** the Cloudflare Worker CORS proxy request fails
- **THEN** the system SHALL display an error message explaining the fetch failure
- **THEN** the system SHALL offer a fallback option allowing the user to manually paste HTML content

#### Scenario: AI provider parse failure

- **WHEN** the AI provider returns a non-JSON or unmappable response
- **THEN** the system SHALL display an error message and leave the form empty for manual input

#### Scenario: Manual HTML fallback

- **WHEN** user chooses to paste HTML manually
- **THEN** the system SHALL accept raw HTML in a textarea and proceed with the same AI provider extraction flow
