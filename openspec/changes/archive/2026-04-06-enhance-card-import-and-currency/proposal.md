## Why

目前 AI 從銀行活動頁面擷取的資料嚴重不足：只抓到通路類別名稱（如「嚴選日系名店」），沒有抓出實際店家清單，導致使用者在店內無法直接搜尋店家取得刷卡建議；同時，上限類型（每月重置 vs 整個活動期間）被混淆處理，造成計算錯誤；此外，在海外旅遊場景下，使用者只知道刷了多少日幣，需要 App 根據旅程設定的固定匯率自動換算台幣。

## What Changes

- **AI 擷取 Prompt 強化**：要求 AI 抓出每個加碼通路下的完整實際店家名單、活動有效期間、以及上限類型（月上限 vs 活動期間上限）
- **CardImportResult 資料型別擴充**：新增 `stores[]`（店家清單）、`validFrom/validTo`（活動期間）、`capPeriod: 'monthly' | 'period'`（上限類型）欄位
- **Card / StoreBonus 資料結構擴充**：`StoreBonus` 新增 `stores: string[]` 與 `capPeriod` 欄位；`Card` 新增 `validFrom`、`validTo` 欄位
- **旅程新增匯率設定**：建立旅程時可輸入固定匯率（如 1 JPY = 0.22 TWD）
- **記帳支援外幣輸入**：使用者可輸入日幣金額，App 依旅程匯率自動換算台幣儲存，並同時顯示兩種金額
- **上限追蹤邏輯修正**：活動期間上限（`capPeriod: 'period'`）改為跨整個活動期間累計，不每月重置
- **推薦頁店家搜尋改善**：推薦頁的店家選單改為以實際店家名稱顯示，選中任一店家可正確對應其所屬的加碼通路

## Non-Goals

- 不支援即時匯率 API，匯率由使用者在旅程建立時手動輸入
- 不支援多幣別（僅日幣 JPY，未來可擴充）
- 不修改現有的 CORS Proxy（Cloudflare Worker）
- 不自動偵測活動是否到期後停用卡片，僅顯示提醒

## Capabilities

### New Capabilities

- `foreign-currency-expense`: 記帳時支援輸入外幣（JPY）金額，依旅程固定匯率換算台幣，顯示兩種金額

### Modified Capabilities

- `card-import-from-url`: AI 擷取結果擴充為包含實際店家清單、活動期間、上限類型
- `card-settings`: `StoreBonus` 與 `Card` 資料結構新增 `stores[]`、`capPeriod`、`validFrom`、`validTo` 欄位；卡片設定頁可手動新增/刪除店家別名
- `trip-manager`: 旅程建立表單新增匯率輸入欄位
- `expense-tracker`: 記帳表單新增外幣輸入模式，並修正活動期間上限的追蹤邏輯
- `card-advisor`: 推薦頁店家選單改以實際店家名稱顯示（由 `StoreBonus.stores[]` 展開）

## Impact

- Affected specs: `card-import-from-url`、`card-settings`、`trip-manager`、`expense-tracker`、`card-advisor`（均需 delta spec）；新增 `foreign-currency-expense`
- Affected code:
  - `src/types/index.ts` — 擴充 `StoreBonus`、`Card`、`Trip` 型別
  - `src/lib/cardImport.ts` — 擴充 `CardImportResult`、AI prompt、parseClaudeResponse
  - `src/lib/rewardCalc.ts` — 修正活動期間上限邏輯、新增外幣換算輔助函式
  - `src/pages/TripsPage.tsx` — 新增匯率輸入欄位
  - `src/pages/ExpensePage.tsx` — 新增外幣輸入、顯示日幣 + 台幣
  - `src/pages/AdvisorPage.tsx` — 展開 `stores[]` 作為店家選單
  - `src/pages/SettingsPage.tsx` — 顯示活動期間、到期提醒
  - `src/components/CardForm.tsx` — 新增店家別名管理、`capPeriod` 選項、日期欄位
  - `src/store/useStore.ts` — 配合型別變更更新 reducer
