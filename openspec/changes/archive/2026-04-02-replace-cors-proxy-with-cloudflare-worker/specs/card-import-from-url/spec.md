## MODIFIED Requirements

### Requirement: Import card info from bank promotion URL

The system SHALL allow users to provide a bank promotion page URL and automatically extract credit card reward information from it, pre-filling the card configuration form. The system SHALL support Claude and Gemini as AI providers, selected by the user in settings. The system SHALL use a self-hosted Cloudflare Worker as the CORS proxy to fetch bank promotion page HTML.

#### Scenario: Successful extraction and pre-fill

- **WHEN** user enters a valid bank promotion URL and clicks "Import from URL"
- **THEN** the system SHALL fetch the page HTML via the self-hosted Cloudflare Worker CORS proxy at `https://cois-pioxy.sizeane0521.workers.dev`
- **THEN** the system SHALL send the cleaned HTML to the selected AI provider (Claude or Gemini) with a structured extraction prompt
- **THEN** the system SHALL parse the JSON response into card fields: name, base overseas reward rate (%), monthly cap type, monthly cap value (NTD), and store bonus rules (store name, bonus rate %, spend cap NTD)
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
