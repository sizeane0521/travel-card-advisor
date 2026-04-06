## Context

目前系統的卡片資料模型是針對「單一回饋率 + 月上限」設計的。AI 擷取 prompt 只要求抓通路類別名稱，`StoreBonus.storeName` 存的是銀行自定義的類別字串（如「嚴選日系名店」），而非可供比對的實際店家名稱。`monthlyCap` 只支援每月重置的上限，無法表達「活動期間上限」。旅程和記帳均以台幣為單位，不支援外幣輸入。

## Goals / Non-Goals

**Goals:**
- AI 擷取結果包含每個加碼通路下的完整實際店家名單
- 資料結構能分辨「月上限」與「活動期間上限」
- 卡片可儲存活動有效期間（validFrom / validTo）
- 旅程可設定固定匯率，記帳時可輸入外幣（JPY）並自動換算台幣
- 推薦頁的店家選單展開為實際店家名稱

**Non-Goals:**
- 不串接即時匯率 API
- 不支援 JPY 以外的外幣（此次）
- 不修改 CORS Proxy
- 不自動停用過期卡片

## Decisions

### 擴充 StoreBonus 新增 stores[] 陣列

在 `StoreBonus` 加入 `stores: string[]`（實際店家名稱列表，可為空陣列）。`storeName` 保留作為通路顯示名稱（例如「熱門商店」），`stores[]` 存實際名稱（例如 `["唐吉訶德", "FamilyMart", "7-ELEVEN"]`）。

替代方案：廢除 `storeName`，只用 `stores[]` 第一個元素。但通路名稱對使用者顯示有意義，且有些通路（如「日本實體商店」）沒有列舉具體店家，所以保留兩個欄位。

### capPeriod 欄位：'monthly' | 'period'

在 `StoreBonus` 新增 `capPeriod: 'monthly' | 'period'`，預設 `'monthly'`。月上限每月重置，活動期間上限跨整個 `Card.validFrom` ~ `Card.validTo` 區間累計，不重置。

上限的「金額單位」維持現有 `StoreBonus.cap`（每月消費上限）邏輯，但當 `capPeriod = 'period'` 時，`rewardCalc` 改為對活動期間全部消費記錄（不限月份）進行累計。

### Card 層級新增 validFrom / validTo

活動期間屬於整張卡的促銷條件，放在 `Card` 頂層而非每個 `StoreBonus` 個別設定，避免重複。`validFrom` / `validTo` 皆為可選的 `string | undefined`（YYYY-MM-DD 格式）。

### Trip 新增 exchangeRate 欄位

`Trip` 新增 `exchangeRate?: { currency: string; rate: number }`。建立旅程時若設定了匯率（例如 `{ currency: 'JPY', rate: 0.22 }`），記帳頁即切換為外幣輸入模式。

### Expense 新增 foreignAmount 欄位

`Expense` 新增 `foreignAmount?: { currency: string; amount: number }`，記錄原始外幣金額。`Expense.amount`（台幣）仍為計算回饋的主欄位，由外幣金額乘以旅程匯率換算而來（無條件捨去）。這樣既不破壞現有回饋計算邏輯，又保留了對帳用的外幣金額。

### 推薦頁店家選單展開 stores[]

`getAllStoreNames()` 改為同時回傳 `StoreBonus.stores[]` 中的個別店家名稱，並建立一個內部 map：`實際店家名稱 → StoreBonus`。`calcCardAdvice()` 在比對 `storeName` 時，先查此 map，找到就用對應 `StoreBonus` 的 rate/cap。`StoreBonus.storeName`（通路名）也仍可直接搜尋。

## Risks / Trade-offs

- **既有資料相容性**：`StoreBonus.stores` 在舊資料中不存在，讀取時須容錯（視為空陣列）。`StoreBonus.capPeriod` 不存在時預設 `'monthly'`。`Trip.exchangeRate` 不存在時視為無外幣模式。
  → 在 `useStore` 讀取資料時加 fallback 預設值處理。

- **AI 擷取品質不穩定**：部分銀行頁面的店家清單以圖片或 JavaScript 動態渲染，AI 可能抓不到。
  → 保留手動補充入口（CardForm 的店家別名管理）。

- **活動期間上限需要跨旅程累計**：若使用者同一活動期間建了多次旅程（例如分兩趟去日本），期間上限應累計所有旅程消費，但目前 `calcCardAdvice` 只看傳入的 `tripExpenses`。
  → 此次先限定「單一旅程內累計」，跨旅程累計列為未來改善項目。

## Migration Plan

1. 更新 `src/types/index.ts`（純型別新增，不刪除欄位）
2. 更新 `useStore` 讀取既有 localStorage 資料時加 fallback
3. 更新 `rewardCalc.ts`（capPeriod 邏輯、getAllStoreNames 展開）
4. 更新 `cardImport.ts`（prompt、CardImportResult 型別、parseClaudeResponse）
5. 更新各 UI 頁面
6. 無需資料庫 migration，localStorage 資料向前相容
