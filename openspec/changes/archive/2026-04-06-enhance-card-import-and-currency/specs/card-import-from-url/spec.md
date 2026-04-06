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
- `storeRules`: array of objects, each containing:
  - `categoryName`: bank-defined category label (string, e.g. "熱門商店")
  - `stores`: array of actual store name strings listed under this category (e.g. ["唐吉訶德", "FamilyMart", "7-ELEVEN"]); empty array if none listed
  - `bonusRate`: bonus reward rate (number)
  - `spendCap`: per-store monthly spend cap in NTD (integer, 0 if not specified)
  - `capPeriod`: "monthly" if cap resets each month, "period" if it applies to the entire promotion period

The prompt SHALL include an example showing `storeRules` with a non-empty `stores` array, a `capPeriod` value of "period", and both `validFrom` and `validTo` populated.

The `CardImportResult` type SHALL contain the fields: `cardName`, `baseRate`, `rewardCap`, `spendCap`, `validFrom`, `validTo`, and `storeRules` with the schema described above.

#### Scenario: Successful extraction with store list

- **WHEN** user enters a valid bank promotion URL for a card whose page lists specific stores (e.g. 唐吉訶德, FamilyMart) under a bonus category
- **THEN** each `storeRules` entry SHALL contain a non-empty `stores` array with those store names
- **THEN** the form SHALL pre-fill store bonus rules with both `categoryName` and `stores` populated

#### Scenario: Extraction captures promotion validity dates

- **WHEN** the bank promotion page states an activity period (e.g. "115/1/1–115/6/30")
- **THEN** `validFrom` SHALL be "2026-01-01" and `validTo` SHALL be "2026-06-30"
- **THEN** both fields SHALL be applied to the card configuration form

#### Scenario: Extraction captures period cap type

- **WHEN** the bank promotion page states a cap as "活動期間上限 NT$600" (entire period, not monthly)
- **THEN** the corresponding `storeRules` entry SHALL have `capPeriod: "period"` and `spendCap: 600`

#### Scenario: Extraction captures monthly cap type

- **WHEN** the bank promotion page states a cap as "每月上限 NT$600"
- **THEN** the corresponding `storeRules` entry SHALL have `capPeriod: "monthly"` and `spendCap: 600`

#### Scenario: No store list available on page

- **WHEN** the bank promotion page only names a category (e.g. "特定通路") without listing individual stores
- **THEN** the `stores` array for that rule SHALL be empty (`[]`)
- **THEN** the category SHALL still be importable and manually editable after import

#### Scenario: Successful extraction with dual caps

- **WHEN** user enters a valid bank promotion URL and clicks "Import from URL"
- **THEN** the system SHALL fetch the page HTML via the self-hosted Cloudflare Worker CORS proxy at `https://cois-pioxy.sizeane0521.workers.dev`
- **THEN** the system SHALL send the cleaned HTML to the selected AI provider (Claude or Gemini) with a structured extraction prompt
- **THEN** the system SHALL parse the JSON response into card fields including `validFrom`, `validTo`, and `storeRules` with `stores[]` and `capPeriod`
- **THEN** the system SHALL pre-fill the card configuration form with the extracted values
- **THEN** the user SHALL be able to review, edit, and save the pre-filled form

#### Scenario: Partial extraction with missing fields

- **WHEN** the AI provider returns a JSON response with one or more fields absent or null
- **THEN** the system SHALL pre-fill available fields and leave missing fields empty
- **THEN** the system SHALL display a notice indicating which fields were not found

#### Scenario: CORS proxy fetch failure

- **WHEN** the Cloudflare Worker CORS proxy request fails (network error, timeout, or non-2xx response)
- **THEN** the system SHALL display an error message explaining the fetch failure
- **THEN** the system SHALL offer a fallback option allowing the user to manually paste HTML content

#### Scenario: AI provider parse failure

- **WHEN** the AI provider returns a non-JSON response or a response that cannot be mapped to card fields
- **THEN** the system SHALL display an error message and leave the form empty for manual input

#### Scenario: Manual HTML fallback

- **WHEN** user chooses to paste HTML manually (fallback path)
- **THEN** the system SHALL accept raw HTML in a textarea and proceed with the same AI provider extraction flow
