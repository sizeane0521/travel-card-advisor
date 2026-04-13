## 1. 型別與 Store 修改

- [x] 1.1 在 `src/types.ts` 的 `Expense` interface 新增 `customRate?: number` 欄位（per-expense exchange rate）
- [x] 1.2 在 `src/store/useStore.tsx` 新增 `UPDATE_EXPENSE` action 型別：`{ type: 'UPDATE_EXPENSE'; tripId: string; expense: Expense }`，並在 reducer 中實作：以 `expense.id` 比對並替換對應紀錄（update expense replaces matching record）

## 2. 生命週期 Bug 修正

- [x] 2.1 在 `CalcPage.tsx` 新增 `useEffect`，監聽 `activeTrip?.id` 變更，當 `expenseDate` 超出新旅程的 `[startDate, endDate ?? today]` 範圍時自動 snap（expense date snapped on active trip change）
- [x] 2.2 在 `LedgerPage.tsx` 將 `card?.name ?? e.cardId` 改為 `card?.name ?? '已刪除的卡片'`（deleted card graceful fallback in expense display）
- [x] 2.3 在 `TripDetailPage.tsx` 將 `card?.name ?? e.cardId` 改為 `card?.name ?? '已刪除的卡片'`（deleted card graceful fallback in expense display）
- [x] 2.4 在 `CalcPage.tsx` 的 Apple/Google Pay 徽章渲染條件加上 `paymentMethod !== 'physical'` 保險（payment method badge hidden in physical card mode）

## 3. 店家條件自動重置

- [x] 3.1 在 `CalcPage.tsx` 的「清除店家」按鈕 onClick 與「點擊店家 Chip」的 onClick 中，呼叫 `setStoreBonusOverrides({})` 與 `setPrereqOverrides({})`，確保 Record a single expense 的 overrides 行為正確（storeBonusOverrides cleared when store chip changes；參考 design 決定：店家條件重置的觸發點）
- [x] 3.2 確認監聽 `store` state 的任何 `useEffect` 不觸發此重置（overrides NOT cleared while typing in search input）

## 4. 試算草稿持久化

- [x] 4.1 在 `CalcPage.tsx` 使用 `useEffect` 將 `{ amount, store, paymentMethod }` 寫入 `sessionStorage`，key 為 `calc-draft-${activeTripId}`，每次狀態更新時同步（CalcPage draft persists across tab switches；參考 design 決定：試算草稿持久化方案）
- [x] 4.2 在 `CalcPage.tsx` 的初始化 `useState` 改為從 `sessionStorage['calc-draft-${activeTripId}']` 讀取初始值，若無則使用預設值（draft restored after tab switch）
- [x] 4.3 在 `CalcPage.tsx` 的 `activeTrip?.id` 變更時，重新從 sessionStorage 讀取對應旅程的 draft（draft isolated per trip）
- [x] 4.4 在成功記帳後，清除 sessionStorage 中的對應 draft key（draft cleared after successful record）

## 5. 常用店家快捷 Chip

- [x] 5.1 在 `CalcPage.tsx` 新增 `frequentStores` 計算：當 `storeQuery === ''` 時，從 `tripExpenses` 統計各 store 出現次數，取前 5 名（排除 `null`），（frequent store chips shown when search is empty；參考 design 決定：常用店家資料範圍）
- [x] 5.2 在 `CalcPage.tsx` 的店家 Chip 區塊，當 `storeQuery === ''` 時渲染 `frequentStores` Chip；當 `storeQuery` 非空時隱藏並只顯示搜尋結果（frequent chips hidden when search is active）

## 6. 單筆匯率覆寫

- [x] 6.1 在 `CalcPage.tsx` 新增 `customRate` local state（初始為空字串）；當 trip 有 `exchangeRate` 時，在匯率顯示旁新增一個小 input 供手動輸入（per-expense exchange rate override）
- [x] 6.2 修改 TWD 換算邏輯：優先使用 `parseFloat(customRate)`，若無效則 fallback 至 `exchangeRate.rate`（override rate used for TWD conversion）
- [x] 6.3 在 `handleRecordWithCard` 中，若有 `customRate`，將其存入 `Expense.customRate`（custom rate stored in Expense；參考 design 決定：單筆匯率覆寫的儲存）；記帳後清除 `customRate` state
- [x] 6.4 確認未輸入 customRate 時，`Expense.customRate` 為 `undefined`（default rate used when no override）

## 7. 消費紀錄編輯

- [x] 7.1 在 `LedgerPage.tsx` 新增 `editingId` state（初始 `null`）；點擊消費紀錄時，設定 `editingId = e.id`，進入 inline 編輯模式（edit an existing expense record）
- [x] 7.2 編輯模式 UI：顯示可修改的 amount（TWD）、date、cardId 下拉選單，以及「儲存」與「取消」按鈕（edit amount updates reward；edit card updates reward rate；edit date updates the expense）
- [x] 7.3 點擊「取消」時，設定 `editingId = null`，不 dispatch 任何 action（cancel edit restores original values）
- [x] 7.4 點擊「儲存」時，以更新後的欄位呼叫 `calcExpenseReward` 重算回饋（使用預設 prerequisite，不回溯 overrides；參考 design 決定：消費編輯的前置條件處理），然後 dispatch `UPDATE_EXPENSE`（UPDATE_EXPENSE replaces matching record）
