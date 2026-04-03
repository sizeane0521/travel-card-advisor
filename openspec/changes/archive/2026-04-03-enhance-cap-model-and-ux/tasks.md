## 1. 資料模型更新

- [x] 1.1 實作 Decision 1: MonthlyCap 型別改為雙欄位可選結構 — 將 `src/types/index.ts` 中的 `MonthlyCap` 介面從 `{ type: 'reward'|'spend'; amount: number }` 改為 `{ rewardLimit?: number; spendLimit?: number }`，移除 `type` 欄位
- [x] 1.2 更新 `CardImportResult`（Import card info from bank promotion URL）：將 `src/lib/cardImport.ts` 的 `CardImportResult` 介面中 `capType` 和 `capValue` 替換為 `rewardCap: number | null` 和 `spendCap: number | null`

## 2. localStorage 資料遷移

- [x] 2.1 實作 Decision 3: localStorage 資料遷移 — 在 `src/store/storage.ts` 的 `loadData()` 中加入遷移函式，將舊格式 `{ type: 'reward', amount: N }` → `{ rewardLimit: N }`、`{ type: 'spend', amount: N }` → `{ spendLimit: N }`，遷移後立即寫回 localStorage；以 `try/catch` 包裹，失敗時保留原始資料

## 3. 計算邏輯更新

- [x] 3.1 實作 Decision 2: 計算邏輯更新（calcCardAdvice） — 更新 `src/lib/rewardCalc.ts` 中 `calcCardAdvice()` 函式，移除對 `monthlyCap.type` 的判斷，改為：先檢查 `rewardLimit`（若 monthlyReward ≥ rewardLimit 則 isFull = true）、再檢查 `spendLimit`（若 monthlySpend ≥ spendLimit 則 applicableRate 降回 baseRate）（Card recommendation ranking）
- [x] 3.2 更新 `remainingCapDisplay` 字串邏輯：只有 `rewardLimit` 時顯示「NT$X 回饋剩餘」、只有 `spendLimit` 時顯示「NT$X 消費額度剩餘」、兩者都有時顯示回饋剩餘、兩者都無時顯示空字串（Remaining cap display）
- [x] 3.3 更新 `calcExpenseReward()` 函式：移除對 `monthlyCap.type` 的分支判斷，改用新的 `rewardLimit` / `spendLimit` 欄位計算上限扣除邏輯

## 4. AI 擷取更新

- [x] 4.1 實作 Decision 6: AI 提示詞輸出格式 — 更新 `src/lib/cardImport.ts` 中 `parseCardFromHtml()` 的提示詞，將輸出格式中 `capType` / `capValue` 改為 `rewardCap`（每月回饋上限，整數 NT$ 或 null）和 `spendCap`（每月消費上限，整數 NT$ 或 null），並加入同時存在兩種上限的範例（Import card info from bank promotion URL）
- [x] 4.2 更新 `parseClaudeResponse()` 函式：從解析結果中讀取 `rewardCap` 和 `spendCap` 欄位，對應填入 `CardImportResult.rewardCap` 和 `CardImportResult.spendCap`

## 5. CardForm UI 更新

- [x] 5.1 實作 Decision 5: CardForm 上限輸入欄重構 — 更新 `src/components/CardForm.tsx`，移除「上限類型」toggle（`capType` state），改為兩個獨立的 optional 數字輸入欄：「每月回饋上限（選填）NT$」和「每月消費金額上限（選填）NT$」
- [x] 5.2 更新 `applyImportResult()` 函式：讀取 `result.rewardCap` 和 `result.spendCap` 並填入對應的 state 欄位；更新 `missingFields` 判斷邏輯（不再檢查 `capType`）
- [x] 5.3 更新 `handleSubmit()` 函式：將 `monthlyCap` 組裝為新格式 `{ rewardLimit?: number; spendLimit?: number }`，移除 `capType` 和 `capAmount` state

## 6. AdvisorPage UX 更新

- [x] 6.1 實作 Decision 4: AdvisorPage 視覺層級調整 — 更新 `src/pages/AdvisorPage.tsx` 卡片列的視覺層級，將 `remainingCapDisplay` 改為右側主要數字（`text-xl font-bold`），將 `effectiveRate%` 改為次要標籤（`text-sm text-gray-500`）置於其下方（Remaining cap display）
- [x] 6.2 處理無上限卡片的顯示：當 `remainingCapDisplay` 為空字串時（無 rewardLimit 也無 spendLimit），右側僅顯示 `effectiveRate%`（維持現有大字樣式）

## 7. 驗證

- [x] 7.1 在瀏覽器中開啟應用程式，確認舊 localStorage 資料（若有）能正確遷移，卡片資訊不遺失
- [x] 7.2 新增一張同時設定「回饋上限」和「消費上限」的測試卡片，確認 Advisor 頁面正確顯示剩餘額度並在兩種上限條件下正確切換有效回饋率
- [x] 7.3 使用銀行活動頁面 URL 觸發 AI 擷取，確認 `rewardCap` 和 `spendCap` 欄位被正確解析並填入表單
