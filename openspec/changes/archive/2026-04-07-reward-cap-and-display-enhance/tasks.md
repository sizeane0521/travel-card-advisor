## 1. 資料模型擴充

- [x] 1.1 套用「StoreBonus 子分類結構」設計決策：在 `src/types/index.ts` 的 `StoreBonus` 介面新增 `subCategories?: { label: string; stores: string[] }[]` 欄位，實作 StoreBonus sub-category data model
- [x] 1.2 套用「Expense 新增 rewardBreakdown 欄位」設計決策：在 `src/types/index.ts` 的 `Expense` 介面新增 `rewardBreakdown?: { base: number; store: number; paymentMethod: number; effectiveRate: number }` 欄位，實作 expense record reward breakdown display

## 2. 修正活動期間上限計算

- [x] 2.1 修改 `src/lib/rewardCalc.ts` 的 `calcCardAdvice()` 函式簽名，新增 `allExpenses: Expense[]` 參數（所有旅程的消費記錄），實作 activity-period cap tracking 跨旅程累計邏輯
- [x] 2.2 在 `calcCardAdvice()` 中套用「活動期間上限改用卡片日期範圍計算」設計決策：當 `bonus.capPeriod === 'period'` 時，改用 `allExpenses` 過濾 `expense.date >= card.validFrom && expense.date <= card.validTo`（validFrom/validTo 缺失時不過濾日期）來計算 `storeSpend`，取代原本只看 `tripExpenses`
- [x] 2.3 更新所有呼叫 `calcCardAdvice()` 的地方（`src/pages/ExpensePage.tsx`），傳入 `AppData.trips` 展開的全部 `Expense[]` 作為 `allExpenses`

## 3. 消費記錄儲存回饋明細

- [x] 3.1 在 `src/pages/ExpensePage.tsx` 的記帳儲存邏輯中，於建立 `Expense` 物件時呼叫 `calcExpenseReward()` 並將 `breakdown` 與 `effectiveRate` 寫入 `expense.rewardBreakdown`
- [x] 3.2 在 `src/pages/ExpensePage.tsx` 的消費記錄列表（`本次旅程消費記錄` 區塊）中，當 `expense.rewardBreakdown` 存在時，顯示回饋率（例如 "7%"）及三項疊加明細（格式：`回饋 NT$X = 基本 NT$Y + {storeName}加碼 NT$Z + 行動支付加碼 NT$W`，零值部分省略）；當 `rewardBreakdown` 不存在時，只顯示 `回饋 NT$X`，實作 expense record reward breakdown display

## 4. 加碼狀態面板

- [x] 4.1 在 `src/pages/ExpensePage.tsx` 消費記錄列表下方新增 bonus status panel：掃描 `AppData.cards`，對每張有 `cap > 0` 的 `StoreBonus`，計算已用額度（period cap 用跨旅程計算、monthly cap 用當月計算），顯示卡片名稱、加碼名稱、進度條（已用/總額）、剩餘額度；無符合資料時隱藏整個面板，實作 bonus status panel in expense entry page

## 5. CardForm 子分類管理

- [x] 5.1 在 `src/components/CardForm.tsx` 的 StoreBonus 編輯區塊中，為每個已建立的 bonus 新增「子分類管理」展開區域：可輸入子分類標籤（如「便利商店」）後新增，在標籤下可新增/刪除個別店家名稱，可刪除整個子分類，實作 StoreBonus sub-category management in CardForm
- [x] 5.2 確認 `addBonus()`、`applyImportResult()` 在 `src/components/CardForm.tsx` 中正確處理 `subCategories` 欄位（新增時預設 `subCategories: []`，匯入結果若有分類資料則填入）

## 6. 記帳頁分類瀏覽器

- [x] 6.1 修改 `src/lib/rewardCalc.ts` 的 `getAllStoreNames()`，除了原有的 `bonus.stores[]`，也從 `bonus.subCategories[].stores[]` 取出店家名稱加入回傳 Set
- [x] 6.2 在 `src/pages/ExpensePage.tsx` 店家選擇區塊新增可展開的 category browser panel：預設收起，點擊「展開分類」按鈕後顯示；列出各 StoreBonus 有 `subCategories` 的群組，每個群組可折疊展開，展開後顯示子分類標籤及其店家 chips；點選 chip 效果等同搜尋選取，實作 category browser in expense store selector；無 subCategories 時不渲染此面板
