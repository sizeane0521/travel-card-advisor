## Why

刷卡金頁面（LedgerPage）目前有兩個 UI 問題：加碼血條顯示所有卡片加碼而不跟篩選卡片連動，造成資訊混亂；消費記錄的回饋拆解以中文等號串接成一長行，難以快速閱讀。

## What Changes

- 當使用者選取特定卡片的篩選 tab 時，上方「加碼額度狀態」區塊僅顯示該卡片的加碼血條；選取「全部」時顯示所有卡片的加碼血條
- 消費記錄中的回饋拆解改為以 ` | ` 分隔的小字樣式，對齊試算頁（CalcPage）的回饋明細設計

## Non-Goals

- 不修改加碼血條的計算邏輯或數值，僅調整顯示的範圍
- 不改變篩選 tab 本身的視覺樣式（已由 `ledger-card-filter` spec 定義）
- 不重構消費記錄卡片的整體排版，僅調整回饋拆解行的格式

## Capabilities

### New Capabilities

- `ledger-expense-breakdown-display`：定義消費記錄中回饋拆解的顯示格式（ `|` 分隔小字）

### Modified Capabilities

- `ledger-card-filter`：擴展篩選 tab 的作用範圍，使其同時控制加碼血條的顯示

## Impact

- Affected specs: `ledger-card-filter`（修改）、`ledger-expense-breakdown-display`（新增）
- Affected code: `src/pages/LedgerPage.tsx`
