# expense-draft-persistence Specification

## Purpose

Persist the CalcPage draft state across tab switches within the same browser session, scoped per active trip.

## Requirements

### Requirement: CalcPage draft persists across tab switches

The system SHALL persist the CalcPage draft state — `amount`, `store`, `paymentMethod` — in `sessionStorage` using the key `calc-draft-{activeTripId}`. The draft SHALL be restored when the user returns to the 試算 Tab within the same browser session.

The draft SHALL be scoped per trip: switching to a different active trip SHALL load that trip's own draft (or an empty state if none exists), not the previous trip's draft.

The draft SHALL NOT persist across browser sessions (i.e., sessionStorage only, not localStorage).

After a successful expense record, the draft SHALL be cleared from sessionStorage (amount and store reset).

#### Scenario: Draft restored after tab switch

- **WHEN** user enters amount "5000" and store "7-ELEVEN" in the 試算 Tab, then switches to 刷卡金 Tab and back
- **THEN** the amount field SHALL display "5000"
- **THEN** the store field SHALL display "7-ELEVEN"

#### Scenario: Draft isolated per trip

- **WHEN** user enters amount "3000" for Trip A, then switches to Trip B (which has no draft)
- **THEN** the amount field SHALL be empty (not "3000")

#### Scenario: Draft cleared after successful record

- **WHEN** user records an expense successfully
- **THEN** the amount and store fields SHALL be cleared
- **THEN** the sessionStorage draft for this trip SHALL be reset

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
-->

<!-- @trace
source: phase1-core-workflow-fixes
updated: 2026-04-13
code:
  - src/pages/LedgerPage.tsx
  - src/types/index.ts
  - repomix-output.xml
  - src/store/useStore.tsx
  - src/pages/TripDetailPage.tsx
  - src/pages/CalcPage.tsx
-->