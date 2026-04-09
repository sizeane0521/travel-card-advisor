## ADDED Requirements

### Requirement: Import card info from screenshot or image file

The system SHALL allow users to paste a screenshot (via Ctrl+V / Cmd+V clipboard paste) or upload an image file (via file picker, accepting common image formats) in the card import panel. The system SHALL encode the image as base64 and send it to the selected AI provider's vision endpoint (Claude multimodal messages or Gemini inline_data) along with the same structured extraction prompt used for HTML-based import. The extracted result SHALL be applied to the card form using the same `applyImportResult()` flow.

The system SHALL support two input methods:
- **Clipboard paste**: An `onPaste` event listener on the import panel detects image files in `ClipboardEvent.clipboardData.files` and triggers image recognition
- **File upload**: A hidden `<input type="file" accept="image/*">` triggered by a visible button, supporting images from desktop or mobile

The system SHALL display a thumbnail preview of the selected image before and during recognition.

If the image file size exceeds 5 MB, the system SHALL display a warning message and SHALL NOT submit the image to the AI provider.

#### Scenario: User pastes screenshot via clipboard

- **WHEN** user opens the card import panel and pastes an image from clipboard (Ctrl+V / Cmd+V)
- **THEN** the system SHALL detect the image in the clipboard data
- **THEN** the system SHALL display a thumbnail preview of the pasted image
- **THEN** the system SHALL send the image as base64 to the selected AI provider's vision API
- **THEN** the system SHALL apply the extracted card info to the form using the same flow as URL import

#### Scenario: User uploads image file via file picker

- **WHEN** user clicks the "選擇圖片檔案" button and selects an image file
- **THEN** the system SHALL read the file and display a thumbnail preview
- **THEN** the system SHALL send the image as base64 to the selected AI provider's vision API
- **THEN** the extracted card info SHALL be applied to the form

#### Scenario: Image exceeds 5 MB size limit

- **WHEN** user pastes or selects an image file larger than 5 MB
- **THEN** the system SHALL display an error message indicating the image is too large
- **THEN** the system SHALL NOT submit the image to the AI provider

#### Scenario: Image recognition fails or returns unparseable result

- **WHEN** the AI provider returns a non-JSON or unmappable response from an image input
- **THEN** the system SHALL display an error message
- **THEN** the form SHALL remain empty for manual input

#### Scenario: Image recognition with missing fields

- **WHEN** the AI provider cannot extract one or more fields from the image (e.g., card name not visible in screenshot)
- **THEN** the system SHALL pre-fill available fields
- **THEN** the system SHALL display a notice listing fields that were not found

#### Scenario: No API key configured for image recognition

- **WHEN** user attempts image recognition but no API key has been entered for the current session
- **THEN** the system SHALL display a prompt directing the user to enter their API key in settings
- **THEN** the image recognition SHALL NOT be submitted
