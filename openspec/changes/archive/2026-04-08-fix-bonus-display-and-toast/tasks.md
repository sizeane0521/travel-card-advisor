## 1. 型別與資料模型

- [x] 1.1 更新 `src/types/index.ts`：`StoreBonus.cap` 註解改為 reward cap，新增 `prerequisite?: string` 和 `prerequisiteMet?: boolean` 欄位（StoreBonus prerequisite mechanism）

## 2. 回饋計算邏輯（修正 Store bonus proportional cap truncation）

- [x] 2.1 修改 `src/lib/rewardCalc.ts` `calcCardAdvice` 實作 Store bonus proportional cap truncation 修正：將 `storeSpend` 改為 `storeRewardUsed`，累計 `e.rewardBreakdown?.store ?? 0` 而非 `e.amount`；`remainingCap = bonus.cap - storeRewardUsed`；`storeBonusInfo` 傳遞 `{ bonus, storeRewardUsed }`
- [x] 2.2 修改 `src/lib/rewardCalc.ts` `calcExpenseReward`：store bonus reward 改為 `min(floor(amount × rate / 100), remainingRewardCap)`，不再用 `eligibleAmount = min(amount, remainingSpendCap)` 再乘 rate
- [x] 2.3 修改 `src/lib/rewardCalc.ts` `findStoreBonus` 和 `calcCardAdvice`：跳過 `prerequisite` 存在且 `prerequisiteMet !== true` 的 StoreBonus（StoreBonus prerequisite mechanism）

## 3. 明細頁修正 Bonus status panel in expense entry page

- [x] 3.1 修改 `src/pages/LedgerPage.tsx` Bonus status panel in expense entry page：store bonus 進度條累計改用 `e.rewardBreakdown?.store ?? 0`，顯示「已累計回饋金 / 回饋金上限」
- [x] 3.2 修改 `src/pages/LedgerPage.tsx` bonus panel：過濾掉 `prerequisite` 存在且 `prerequisiteMet !== true` 的 StoreBonus
- [x] 3.3 修改 `src/pages/LedgerPage.tsx` bonus panel：新增 paymentMethodBonus tier 進度條，累計當月 `paymentMethodReward`，對比 `tier.monthlyCap`，跳過未啟用的 prerequisite tier

## 4. 試算頁修正 Record a single expense 行為

- [x] 4.1 修改 `src/pages/CalcPage.tsx` Record a single expense `handleRecordWithCard`：移除 `setPrereqOverrides({})`，保留 prereqOverrides 狀態
- [x] 4.2 修改 `src/pages/CalcPage.tsx`：新增 `lastRecordResult` state 和頂部 toast UI，記帳成功後顯示回饋明細（使用 `formatBreakdown`），3 秒後自動消失
- [x] 4.3 修改 `src/pages/CalcPage.tsx`：在卡片推薦列表中，為有 `prerequisite` 的 StoreBonus 顯示 toggleable chip（類似 paymentMethod prerequisite toggle）

## 5. AI 匯入與卡片設定

- [x] 5.1 修改 `src/lib/cardImport.ts` AI prompt：`storeRules` 新增 `prerequisite` 欄位說明，讓 AI 識別「限新戶」、「需登錄」等條件（AI card import recognizes payment method bonuses 延伸）
- [x] 5.2 修改 `src/components/CardForm.tsx`：為每個 StoreBonus 新增 prerequisite toggle UI，讓用戶設定 `prerequisiteMet`（StoreBonus prerequisite mechanism）

## 6. 驗證

- [x] 6.1 執行 `npm run build` 確認無編譯錯誤
- [x] 6.2 手動測試：明細頁進度條顯示回饋金額、新戶 bar 不出現、行動支付 bar 出現、試算頁 toast 顯示、prereqOverrides 保留
