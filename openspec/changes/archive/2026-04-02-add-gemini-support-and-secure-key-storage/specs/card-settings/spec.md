## ADDED Requirements

### Requirement: Claude API key configuration

The system SHALL allow users to enter their Claude API key in the settings page for use during the current session. The key SHALL be stored in memory only and SHALL NOT be persisted to localStorage.

#### Scenario: Enter API key

- **WHEN** user selects Claude as the AI provider and enters their API key in the settings page
- **THEN** the system SHALL hold the key in React state (memory) for the duration of the session
- **THEN** the system SHALL NOT write the key to localStorage or any persistent storage
- **THEN** the system SHALL mask the key display (show only last 4 characters) while the key is active in the session

#### Scenario: Import attempted without API key

- **WHEN** user attempts to import from a URL but no API key is held in the current session
- **THEN** the system SHALL display a prompt directing the user to enter their API key in settings

#### Scenario: Invalid API key

- **WHEN** the API key is rejected by the AI provider (401 or 403 response)
- **THEN** the system SHALL display an error message indicating the key is invalid
- **THEN** the system SHALL direct the user to re-enter their API key in settings

---

## ADDED Requirements

### Requirement: AI provider selection

The system SHALL allow users to select between Claude and Gemini as the AI provider for the card import feature.

#### Scenario: Select Claude as provider

- **WHEN** user selects Claude in the provider toggle on the settings page
- **THEN** the system SHALL display the Claude API key input field
- **THEN** all subsequent import operations in the session SHALL use the Claude API

#### Scenario: Select Gemini as provider

- **WHEN** user selects Gemini in the provider toggle on the settings page
- **THEN** the system SHALL display the Gemini API key input field with a note that Gemini has a free tier
- **THEN** all subsequent import operations in the session SHALL use the Gemini API

#### Scenario: Provider defaults to Gemini

- **WHEN** user opens the settings page for the first time in a session
- **THEN** the system SHALL default the provider selection to Gemini
