## Why

刷卡金頁面的消費記錄中，卡片名稱以純文字顯示，當使用者持有多張名稱相近的信用卡（例如多張國泰系列卡）時，難以快速辨識每筆消費用了哪張卡。同時也缺乏按卡片篩選消費記錄的功能，使用者必須逐筆翻閱才能找到特定卡片的消費。

## What Changes

- **卡片名稱 chip 化**：消費記錄中的卡片名稱改為小 chip 樣式（金色邊框 `#c8901a`、透明背景、`#c8a060` 文字），與試算頁的視覺語言一致
- **付款方式 badge**：若消費的 `paymentMethod` 為 `apple_pay` 或 `google_pay`，在卡片 chip 右側顯示藍色 badge（沿用試算頁的 Apple Pay / Google Pay badge 樣式）；`physical` 不顯示 badge
- **卡片篩選 Tab**：在消費記錄列表上方新增橫向可滾動的篩選 Tab 列，第一個 Tab 固定為「全部」，其餘 Tab 動態生成——依本次旅程消費記錄中實際出現過的卡片（去重、依首次出現順序排列）；點擊 Tab 過濾消費記錄，只顯示該卡片的消費

## Non-Goals

- 不支援多選卡片篩選（一次只能選一張卡或全部）
- 不支援依日期、金額、店家等其他條件篩選
- 不修改卡片設定（不新增顏色欄位）

## Capabilities

### New Capabilities

- `ledger-card-filter`: 刷卡金頁依卡片篩選消費記錄的 Tab UI

### Modified Capabilities

（無）

## Impact

- Affected specs: `ledger-card-filter`（新）
- Affected code:
  - `src/pages/LedgerPage.tsx`（主要修改）
