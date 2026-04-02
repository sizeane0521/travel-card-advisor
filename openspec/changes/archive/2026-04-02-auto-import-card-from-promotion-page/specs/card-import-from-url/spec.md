## ADDED Requirements

### Requirement: Import card info from bank promotion URL

The system SHALL allow users to provide a bank promotion page URL and automatically extract credit card reward information from it, pre-filling the card configuration form.

#### Scenario: Successful extraction and pre-fill

- **WHEN** user enters a valid bank promotion URL and clicks "Import from URL"
- **THEN** the system SHALL fetch the page HTML via a CORS proxy
- **THEN** the system SHALL send the cleaned HTML to Claude API with a structured extraction prompt
- **THEN** the system SHALL parse the JSON response into card fields: name, base overseas reward rate (%), monthly cap type, monthly cap value (NTD), and store bonus rules (store name, bonus rate %, spend cap NTD)
- **THEN** the system SHALL pre-fill the card configuration form with the extracted values
- **THEN** the user SHALL be able to review, edit, and save the pre-filled form

#### Scenario: Partial extraction with missing fields

- **WHEN** Claude API returns a JSON response with one or more fields absent or null
- **THEN** the system SHALL pre-fill available fields and leave missing fields empty
- **THEN** the system SHALL display a notice indicating which fields were not found

#### Scenario: CORS proxy fetch failure

- **WHEN** the CORS proxy request fails (network error, timeout, or non-2xx response)
- **THEN** the system SHALL display an error message explaining the fetch failure
- **THEN** the system SHALL offer a fallback option allowing the user to manually paste HTML content

#### Scenario: Claude API parse failure

- **WHEN** Claude API returns a non-JSON response or a response that cannot be mapped to card fields
- **THEN** the system SHALL display an error message and leave the form empty for manual input

#### Scenario: Manual HTML fallback

- **WHEN** user chooses to paste HTML manually (fallback path)
- **THEN** the system SHALL accept raw HTML in a textarea and proceed with the same Claude API extraction flow

---

### Requirement: Claude API key configuration

The system SHALL allow users to configure their Claude API key, which is required for the URL import feature.

#### Scenario: Save API key

- **WHEN** user enters a Claude API key in the settings page and saves
- **THEN** the system SHALL store the key in localStorage under a dedicated key
- **THEN** the system SHALL mask the key in the UI (show only last 4 characters)

#### Scenario: Import attempted without API key

- **WHEN** user attempts to import from a URL but no Claude API key is configured
- **THEN** the system SHALL display a prompt directing the user to configure their API key in settings

#### Scenario: Invalid API key

- **WHEN** the configured Claude API key is rejected by the Claude API (401 or 403 response)
- **THEN** the system SHALL display an error message indicating the key is invalid
- **THEN** the system SHALL direct the user to update their API key in settings
