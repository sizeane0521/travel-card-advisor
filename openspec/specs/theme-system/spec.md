# theme-system Specification

## Purpose

TBD - created by archiving change 'glassmorphism-theme-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Theme token definitions

The application SHALL define a complete set of CSS custom properties for both dark and light modes using `[data-theme="dark"]` and `[data-theme="light"]` selectors on the `<html>` element. The token set SHALL include: `--color-bg-base`, `--color-bg-surface`, `--color-primary`, `--color-secondary`, `--color-accent`, `--color-text-base`, `--color-text-muted`, `--color-border`.

#### Scenario: Dark mode tokens applied

- **WHEN** `document.documentElement` has `data-theme="dark"`
- **THEN** the application SHALL render with deep navy blue background gradient, semi-transparent surface cards, and orange/teal accent colors

#### Scenario: Light mode tokens applied

- **WHEN** `document.documentElement` has `data-theme="light"`
- **THEN** the application SHALL render with pale blue-white background gradient, white semi-transparent surface cards, and the same primary/secondary/accent hues with dark text


<!-- @trace
source: glassmorphism-theme-redesign
updated: 2026-04-20
code:
  - src/components/QRImportPanel.tsx
  - src/pages/LedgerPage.tsx
  - src/components/QRCodePanel.tsx
  - src/index.css
  - src/pages/TripsPage.tsx
  - src/pages/SettingsPage.tsx
  - index.html
  - src/App.tsx
  - src/components/CardForm.tsx
  - src/components/DatePicker.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->

---
### Requirement: Theme persistence

The application SHALL persist the user's theme choice in `localStorage` under the key `theme`. On initial load, the application SHALL read this value and apply the stored theme before first render. If no stored value exists, the application SHALL default to `dark` mode.

#### Scenario: Theme persists across page reload

- **WHEN** user switches theme to light and reloads the page
- **THEN** the application SHALL load in light mode without flash of wrong theme

#### Scenario: Default theme on first visit

- **WHEN** no `theme` key exists in `localStorage`
- **THEN** the application SHALL default to dark mode


<!-- @trace
source: glassmorphism-theme-redesign
updated: 2026-04-20
code:
  - src/components/QRImportPanel.tsx
  - src/pages/LedgerPage.tsx
  - src/components/QRCodePanel.tsx
  - src/index.css
  - src/pages/TripsPage.tsx
  - src/pages/SettingsPage.tsx
  - index.html
  - src/App.tsx
  - src/components/CardForm.tsx
  - src/components/DatePicker.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->

---
### Requirement: Theme toggle control

The application SHALL provide a theme toggle UI element in the Settings page. The toggle SHALL display the current active theme and switch to the opposite theme when activated.

#### Scenario: Toggle switches theme

- **WHEN** user activates the theme toggle in Settings
- **THEN** the application SHALL immediately switch between dark and light mode across all pages

#### Scenario: Toggle reflects current theme

- **WHEN** Settings page is rendered
- **THEN** the toggle SHALL visually indicate the currently active theme (dark or light)


<!-- @trace
source: glassmorphism-theme-redesign
updated: 2026-04-20
code:
  - src/components/QRImportPanel.tsx
  - src/pages/LedgerPage.tsx
  - src/components/QRCodePanel.tsx
  - src/index.css
  - src/pages/TripsPage.tsx
  - src/pages/SettingsPage.tsx
  - index.html
  - src/App.tsx
  - src/components/CardForm.tsx
  - src/components/DatePicker.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->

---
### Requirement: Glassmorphism visual components

The application SHALL apply Glassmorphism styling to all card and panel surfaces. This includes `backdrop-filter: blur(12px)`, semi-transparent background using `--color-bg-surface`, and a 1px border using `--color-border`.

#### Scenario: Card surfaces use Glassmorphism

- **WHEN** any card, form panel, or navigation bar is rendered
- **THEN** the element SHALL display backdrop blur, semi-transparent fill, and a subtle border consistent with Glassmorphism design language

#### Scenario: Gradient background rendered

- **WHEN** the application is loaded in either theme
- **THEN** the `<body>` background SHALL display a two-stop gradient using the active theme's background tokens

<!-- @trace
source: glassmorphism-theme-redesign
updated: 2026-04-20
code:
  - src/components/QRImportPanel.tsx
  - src/pages/LedgerPage.tsx
  - src/components/QRCodePanel.tsx
  - src/index.css
  - src/pages/TripsPage.tsx
  - src/pages/SettingsPage.tsx
  - index.html
  - src/App.tsx
  - src/components/CardForm.tsx
  - src/components/DatePicker.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->