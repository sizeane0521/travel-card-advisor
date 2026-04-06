## 1. 型別定義擴充

- [x] 1.1 在 `src/types/index.ts` 中，擴充 StoreBonus 新增 stores[] 陣列：新增 `stores: string[]`（預設空陣列）、`capPeriod: 'monthly' | 'period'`（預設 `'monthly'`）兩個欄位到 `StoreBonus` interface
- [x] 1.2 在 `src/types/index.ts` 中，Card 層級新增 validFrom / validTo：新增 `validFrom?: string` 和 `validTo?: string`（YYYY-MM-DD 格式）到 `Card` interface
- [x] 1.3 在 `src/types/index.ts` 中，Trip 新增 exchangeRate 欄位：新增 `exchangeRate?: { currency: string; rate: number }` 到 `Trip` interface
- [x] 1.4 在 `src/types/index.ts` 中，Expense 新增 foreignAmount 欄位：新增 `foreignAmount?: { currency: string; amount: number }` 到 `Expense` interface

## 2. Store / LocalStorage 向前相容

- [x] 2.1 在 `src/store/useStore.ts` 中，讀取既有 localStorage 資料時為 `StoreBonus` 補上 fallback：若 `stores` 欄位不存在則設為 `[]`，若 `capPeriod` 不存在則設為 `'monthly'`
- [x] 2.2 在 `src/store/useStore.ts` 中，讀取 `Trip` 時：若 `exchangeRate` 不存在則視為 `undefined`（不影響現有旅程）

## 3. AI 擷取邏輯強化（card-import-from-url）

- [x] 3.1 在 `src/lib/cardImport.ts` 中，擴充 `CardImportResult` 型別以實作 Import card info from bank promotion URL：新增 `validFrom: string | null`、`validTo: string | null`，並將 `storeRules` 的每個元素改為包含 `categoryName: string`、`stores: string[]`、`bonusRate: number`、`spendCap: number`、`capPeriod: 'monthly' | 'period'`
- [x] 3.2 在 `src/lib/cardImport.ts` 的 `parseCardFromHtml()` 中，更新 AI extraction prompt：要求 AI 回傳 `validFrom`、`validTo`（YYYY-MM-DD 格式或 null）、並將 `storeRules` 改為包含 `categoryName`、`stores[]`、`bonusRate`、`spendCap`、`capPeriod`（"monthly" 或 "period"）五個欄位；prompt 中加入範例：一筆 storeRules 有非空 stores 陣列、capPeriod 為 "period"、並且 validFrom / validTo 均有值
- [x] 3.3 在 `src/lib/cardImport.ts` 的 `parseClaudeResponse()` 中，更新解析邏輯：正確讀取新的 `storeRules` 結構（含 `categoryName`、`stores`、`capPeriod`），以及 `validFrom`、`validTo`；欄位缺失時一律填 null 或空陣列
- [x] 3.4 在 `src/components/CardForm.tsx` 的 `applyImportResult()` 中，更新欄位對應：將 `CategoryName` 映射到 `StoreBonus.storeName`、`stores` 映射到 `StoreBonus.stores`、`capPeriod` 映射到 `StoreBonus.capPeriod`；並將 `validFrom`、`validTo` 對應到卡片表單的日期欄位

## 4. 卡片設定頁面強化（card-settings / card configuration storage）

- [x] 4.1 在 `src/components/CardForm.tsx` 中，更新店家加碼新增表單以實作 Card configuration storage：加入「上限類型」下拉選單實作 capPeriod 欄位：'monthly' | 'period'（選項：「每月重置」=`monthly`、「活動期間」=`period`），預設為 `monthly`
- [x] 4.2 在 `src/components/CardForm.tsx` 中，在每個已新增的店家加碼規則列表項目旁，加入「管理店家別名」入口：允許使用者新增或刪除 `StoreBonus.stores[]` 中的店家名稱（手動補充店家別名到 stores[] 陣列）
- [x] 4.3 在 `src/components/CardForm.tsx` 中，新增活動期間輸入欄位：加入「活動開始日期」（validFrom）和「活動結束日期」（validTo）的 `date` 類型輸入欄，兩者均為選填
- [x] 4.4 在 `src/pages/SettingsPage.tsx` 中，實作 Promotion expiry indicator：卡片列表中，若 `validTo` 在今天之前顯示「活動已結束」標籤，若 `validTo` 在今天起 7 天內顯示「即將到期」標籤，無 `validTo` 則不顯示任何標籤

## 5. 回饋計算邏輯修正（activity-period cap tracking / store selection）

- [x] 5.1 在 `src/lib/rewardCalc.ts` 的 `calcCardAdvice()` 中，修正 Activity-period cap tracking：當 `StoreBonus.capPeriod === 'period'` 時，對活動期間所有 tripExpenses（不限月份）累計該店家的消費總額；當 `capPeriod === 'monthly'` 時維持現有只計算當月邏輯
- [x] 5.2 在 `src/lib/rewardCalc.ts` 的 `calcCardAdvice()` 中，更新店家比對邏輯：先比對 `StoreBonus.storeName === storeName`（類別名稱精確比對），若無符合，再對所有 `StoreBonus.stores[]` 陣列搜尋 `stores.includes(storeName)`；找到第一個符合的 StoreBonus 即應用其 rate/cap/capPeriod
- [x] 5.3 在 `src/lib/rewardCalc.ts` 的 `getAllStoreNames()` 中，展開 stores[] 以實作完整 Store selection for recommendation：回傳同時包含所有 `StoreBonus.storeName` 和 `StoreBonus.stores[]` 中的每個元素，並去除重複後排序

## 6. 旅程建立新增匯率設定（trip exchange rate setting）

- [x] 6.1 在 `src/pages/TripsPage.tsx` 的建立旅程表單中，實作 Trip exchange rate setting：新增選填的匯率輸入欄位，包含貨幣代碼（固定顯示 "JPY"）和匯率數字（例如 0.22）；只在使用者輸入非空值時，將 `exchangeRate: { currency: "JPY", rate: 數字 }` 存入旅程；未輸入則不設此欄位

## 7. 記帳外幣輸入（foreign currency amount input / record a single expense）

- [x] 7.1 在 `src/pages/ExpensePage.tsx` 中，實作 Foreign currency amount input 與 Record a single expense：根據 activeTrip.exchangeRate 切換輸入模式，有匯率時輸入欄標籤改為「金額（JPY）」，無匯率時維持「金額（NT$）」
- [x] 7.2 在 `src/pages/ExpensePage.tsx` 的 `handleSubmit()` 中，實作外幣換算邏輯：當有匯率時，`Expense.amount = Math.floor(foreignAmount × rate)`，並同時設定 `Expense.foreignAmount = { currency: "JPY", amount: foreignAmount }`；無匯率時維持現有邏輯
- [x] 7.3 在 `src/pages/ExpensePage.tsx` 的消費記錄列表中，實作 Dual-amount display in expense list：若 expense 有 `foreignAmount`，顯示「¥X,XXX (NT$X,XXX)」；否則只顯示「NT$X,XXX」（現有行為）
- [x] 7.4 確認 Reward estimation uses TWD amount：reward 計算使用 `Expense.amount`（台幣），與外幣無關，現有 `calcExpenseReward` 邏輯不需改動，僅需確認 `ExpensePage` 的估算顯示使用 TWD amount

## 8. 推薦頁店家選單更新（card advisor store selection）

- [x] 8.1 在 `src/pages/AdvisorPage.tsx` 中，實作推薦頁店家選單展開 stores[]（Store selection for recommendation）：更新店家選單資料來源，改用更新後的 `getAllStoreNames()`（已展開 stores[]），確保實際店家名稱（如唐吉訶德）出現在選單中
