## MODIFIED Requirements

### Requirement: Import card info from bank promotion URL

The system SHALL allow users to provide a bank promotion page URL and automatically extract credit card reward information from it, pre-filling the card configuration form. The system SHALL support Claude and Gemini as AI providers, selected by the user in settings. The system SHALL use a self-hosted Cloudflare Worker as the CORS proxy to fetch bank promotion page HTML.

The AI extraction prompt SHALL instruct the model to output two separate optional cap fields: `rewardCap` (monthly reward limit in NTD) and `spendCap` (monthly spend limit for bonus rate in NTD). The prompt SHALL include an example demonstrating both fields present simultaneously.

The `CardImportResult` type SHALL contain `rewardCap: number | null` and `spendCap: number | null` instead of the former `capType` and `capValue` fields.

#### Scenario: Successful extraction with dual caps

- **WHEN** user enters a valid bank promotion URL and clicks "Import from URL"
- **THEN** the system SHALL fetch the page HTML via the self-hosted Cloudflare Worker CORS proxy
- **THEN** the system SHALL send the cleaned HTML to the selected AI provider with a structured extraction prompt
- **THEN** the system SHALL parse the JSON response into card fields: name, base overseas reward rate (%), `rewardCap` (NTD or null), `spendCap` (NTD or null), and store bonus rules (store name, bonus rate %, spend cap NTD)
- **THEN** the system SHALL pre-fill the card configuration form with the extracted values

#### Scenario: Extraction returns both cap types

- **WHEN** the AI provider extracts a card with both a monthly reward cap (NT$1,500) and a monthly spend cap (NT$50,000) from the page
- **THEN** `rewardCap` SHALL be 1500 and `spendCap` SHALL be 50000 in the result
- **THEN** both fields SHALL be applied to the corresponding form inputs

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
