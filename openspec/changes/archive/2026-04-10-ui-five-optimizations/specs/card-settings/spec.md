## MODIFIED Requirements

### Requirement: AI provider selection

The system SHALL allow users to select between Claude and Gemini as the AI provider for the card import feature.

The AI import settings section in SettingsPage SHALL support a collapsible/expandable state:
- When an API key is set and the section is collapsed, the section header SHALL display a one-line summary showing: the selected provider name, the masked key (all characters except last 4 replaced with `•`), and a "修改" button to re-expand.
- When the API key is not yet set, the section SHALL render expanded by default, showing the provider selector and key input.
- When the user saves a valid API key by clicking "設定" or pressing Enter, the section SHALL automatically collapse.
- Clicking "修改" SHALL expand the section to show the full provider selector and key input again.
- Clicking "清除" SHALL clear the API key and collapse the section (returning to the empty state where no key is set).

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

#### Scenario: Section auto-collapses after key is saved

- **WHEN** user enters a valid API key and clicks "設定"
- **THEN** the section SHALL collapse automatically
- **THEN** the header SHALL display the provider name, masked key, and "修改" button

#### Scenario: Section shows summary when key is already set

- **WHEN** user navigates to the settings page and an API key is already set in the session
- **THEN** the section SHALL render in collapsed state by default
- **THEN** the header SHALL show provider name and masked key (e.g. "Gemini · ••••5678")

#### Scenario: Expand section via Modify button

- **WHEN** user clicks "修改" while the section is collapsed
- **THEN** the section SHALL expand showing the provider selector, description, and key input or current key display

#### Scenario: Clear key collapses section

- **WHEN** user clicks "清除" to remove the current API key
- **THEN** the API key SHALL be removed from the session
- **THEN** the section SHALL display the key input form (expanded, no key set state)
