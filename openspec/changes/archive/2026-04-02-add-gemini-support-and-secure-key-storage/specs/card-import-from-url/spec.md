## MODIFIED Requirements

### Requirement: Import card info from bank promotion URL

The system SHALL allow users to provide a bank promotion page URL and automatically extract credit card reward information from it, pre-filling the card configuration form. The system SHALL support Claude and Gemini as AI providers, selected by the user in settings.

#### Scenario: Successful extraction and pre-fill

- **WHEN** user enters a valid bank promotion URL and clicks "Import from URL"
- **THEN** the system SHALL fetch the page HTML via a CORS proxy
- **THEN** the system SHALL send the cleaned HTML to the selected AI provider (Claude or Gemini) with a structured extraction prompt
- **THEN** the system SHALL parse the JSON response into card fields: name, base overseas reward rate (%), monthly cap type, monthly cap value (NTD), and store bonus rules (store name, bonus rate %, spend cap NTD)
- **THEN** the system SHALL pre-fill the card configuration form with the extracted values
- **THEN** the user SHALL be able to review, edit, and save the pre-filled form

#### Scenario: Partial extraction with missing fields

- **WHEN** the AI provider returns a JSON response with one or more fields absent or null
- **THEN** the system SHALL pre-fill available fields and leave missing fields empty
- **THEN** the system SHALL display a notice indicating which fields were not found

#### Scenario: CORS proxy fetch failure

- **WHEN** the CORS proxy request fails (network error, timeout, or non-2xx response)
- **THEN** the system SHALL display an error message explaining the fetch failure
- **THEN** the system SHALL offer a fallback option allowing the user to manually paste HTML content

#### Scenario: AI provider parse failure

- **WHEN** the AI provider returns a non-JSON response or a response that cannot be mapped to card fields
- **THEN** the system SHALL display an error message and leave the form empty for manual input

#### Scenario: Manual HTML fallback

- **WHEN** user chooses to paste HTML manually (fallback path)
- **THEN** the system SHALL accept raw HTML in a textarea and proceed with the same AI provider extraction flow

---

### Requirement: Claude API key configuration

The system SHALL allow users to provide their Claude API key for use during the current session only. The key SHALL NOT be persisted to localStorage or any other storage mechanism.

#### Scenario: Enter Claude API key for session

- **WHEN** user selects Claude as the provider and enters their API key in settings
- **THEN** the system SHALL store the key in memory (React state) only
- **THEN** the key SHALL be available for all import operations during the current browser session
- **THEN** the key SHALL be cleared when the browser tab is closed or the page is refreshed

#### Scenario: Import attempted without API key

- **WHEN** user attempts to import from a URL but no API key has been entered for the current session
- **THEN** the system SHALL display a prompt directing the user to enter their API key in settings

#### Scenario: Invalid API key

- **WHEN** the configured API key is rejected by the AI provider (401 or 403 response)
- **THEN** the system SHALL display an error message indicating the key is invalid
- **THEN** the system SHALL direct the user to re-enter their API key in settings

---

## ADDED Requirements

### Requirement: Gemini API key configuration

The system SHALL allow users to provide their Google Gemini API key as an alternative to Claude, for use during the current session only. The key SHALL NOT be persisted to localStorage.

#### Scenario: Enter Gemini API key for session

- **WHEN** user selects Gemini as the provider and enters their Gemini API key in settings
- **THEN** the system SHALL store the key in memory (React state) only
- **THEN** the system SHALL use the Gemini generateContent endpoint for all subsequent import operations in the session

#### Scenario: Gemini extraction succeeds

- **WHEN** user triggers import with Gemini selected as provider
- **THEN** the system SHALL call the Gemini API with the cleaned HTML and the same structured extraction prompt
- **THEN** the system SHALL parse the Gemini response identically to Claude responses and pre-fill the form
