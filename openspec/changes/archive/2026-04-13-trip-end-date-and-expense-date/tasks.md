## 1. 旅程建立表單：加入預計結束日期

- [x] 1.1 在 `TripsPage.tsx` 的新增旅程表單中加入「預計結束日期」`<input type="date">` 欄位，對應 state `endDate`，預設為空字串（結束日期為選填欄位，設計決策見 design.md）
- [x] 1.2 在 `handleCreate` 中將 `endDate` state 傳入 `trip.endDate`：有值時存字串，空字串時存 `null`，符合 "Create a new trip" 需求
- [x] 1.3 `handleCreate` 執行後重置 `endDate` state 為空字串
- [x] 1.4 日期欄位的 `min` 屬性設為 `startDate`，確保結束日不早於開始日

## 2. 旅程卡片：顯示完整日期區間

- [x] 2.1 修改 `TripsPage.tsx` 旅程卡片的日期顯示：`endDate` 存在時顯示 `{startDate} — {endDate}`，`endDate` 為 null 時只顯示 `{startDate}`，符合 "Trip history list" 需求（現行邏輯已有，確認無誤）

## 3. 試算頁：新增消費日期選擇器

- [x] 3.1 在 `CalcPage.tsx` 加入 `expenseDate` state，預設 `todayStr()`
- [x] 3.2 在金額輸入欄附近加入「消費日期」`<input type="date">` 欄位，綁定 `expenseDate` state，符合 "Record a single expense" 需求
- [x] 3.3 設定日期選擇器的 `min` 為 `activeTrip.startDate`，`max` 為 `activeTrip.endDate ?? todayStr()`，符合「消費日期選擇器的預設值與邊界」設計決策及 "Expense date bounded by trip start date" 與 "Expense date bounded by trip end date when set" 需求
- [x] 3.4 修改記帳 dispatch（`handleRecord`）：將 `date: expenseDate` 取代現有的 `date: todayStr()`，符合 "Selected date stored in expense" 需求
- [x] 3.5 記帳成功後將 `expenseDate` 重置為 `todayStr()`，符合 "Date resets to today after record" 需求

## 4. 驗證月費用上限計算正確性

- [x] 4.1 確認 `rewardCalc.ts` 的 `getMonthlySpend` 與 `getMonthlyReward` 使用 `expense.date.slice(0,7)` 做月份分組（月費用上限計算不需改動，設計決策見 design.md），符合 "Monthly cap uses expense date month" 需求；若已正確則無需修改
