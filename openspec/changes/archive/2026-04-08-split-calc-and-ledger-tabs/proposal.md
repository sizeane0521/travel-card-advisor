## Why

目前「試算（輸入表單 + 信用卡推薦列表）」與「明細（消費列表 + 加碼額度狀態）」共存於同一個 ExpensePage，造成頁面過長、視覺層級混亂、使用者必須大量捲動才能在兩個功能區之間切換。將兩者拆分為獨立的 App-level Tab，讓每個畫面的使用目的單一清晰。

## What Changes

- App-level Bottom Tab Bar 從 3 個 Tab（記帳、旅程、設定）擴展為 4 個 Tab（**試算**、**明細**、旅程、設定）
- 新增 `CalcPage`（試算）：包含金額輸入、店家選擇、付款方式選擇、信用卡推薦列表；每張信用卡 row 新增「+記帳」inline action button，直接以該卡送出記帳，取代底部全域「◆ 記錄消費」submit button
- 新增 `LedgerPage`（明細）：包含本次旅程消費列表與加碼額度狀態面板（保留 progress bar，定位為旅程規劃儀表板）
- **BREAKING** 移除 `ExpensePage` 底部全域「◆ 記錄消費」Submit Button，以 per-card「+記帳」取代
- 移除 `ExpensePage`（原有頁面不再存在，功能分拆至 CalcPage 與 LedgerPage）

## Capabilities

### New Capabilities

（無；此 change 為 UI 重構，不引入新業務能力）

### Modified Capabilities

- `expense-tracker`：記帳送出方式從「選卡 + 全域送出按鈕」改為「per-card +記帳 inline button」；提交後留在試算 Tab（不自動切換）
- `card-advisor`：信用卡推薦列表 row 新增「+記帳」inline action button；最佳推薦卡 mini progress bar 保留

## Impact

- Affected code:
  - `src/App.tsx` — Tab type 新增 `'calc'` 與 `'ledger'`；TABS 陣列新增兩項；render 對應新 Page
  - `src/pages/ExpensePage.tsx` — 拆分：表單邏輯移至 CalcPage，列表邏輯移至 LedgerPage（原檔可刪除）
  - `src/pages/CalcPage.tsx`（新建）— 表單 + 信用卡推薦列表 + per-card「+記帳」button
  - `src/pages/LedgerPage.tsx`（新建）— 消費列表 + 加碼額度狀態面板
