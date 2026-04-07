## Context

目前 `StoreBonus.capPeriod` 有 `'monthly'` 與 `'period'` 兩種，但計算 `storeSpend` 時，兩者都只看當月（以 `monthPrefix()` 過濾）。當 `capPeriod: 'period'` 時，應跨所有旅程、以卡片 `validFrom`–`validTo` 日期範圍累計，否則每個月都重設，導致上限永遠用不完。

消費記錄目前只儲存 `estimatedReward`（總金額），沒有記錄三項明細（基本/店家/行動支付），導致記錄頁面無法還原計算過程。

`StoreBonus.stores[]` 目前是一維陣列（扁平列表），無法表達「便利商店：7-ELEVEN, FamilyMart」這類子分類結構。

## Goals / Non-Goals

**Goals:**
- 修正 `capPeriod: 'period'` 的 storeSpend 計算，正確跨旅程累計
- 消費記錄儲存並顯示三項回饋明細（% 數 + NT$ 明細）
- 記帳頁底部新增各加碼剩餘額度狀態面板
- `StoreBonus` 支援子分類（`subCategories`），CardForm 可設定，記帳頁可展開瀏覽

**Non-Goals:**
- 不修改每月重置的計算邏輯（`capPeriod: 'monthly'` 行為不變）
- 不做子分類的搜尋權重排序（搜尋仍為字串比對）
- 不回填舊消費記錄的明細（僅對新記錄生效）

## Decisions

### 活動期間上限改用卡片日期範圍計算

**決策**：計算 `storeSpend` 時，若 `capPeriod === 'period'`，改為過濾所有旅程中 `expense.date >= card.validFrom && expense.date <= card.validTo` 的消費記錄。

**替代方案**：以旅程日期（Trip.startDate/endDate）為範圍 → 拒絕，因為同一張卡跨多次旅程時，每趟旅程都有獨立的 NT$600 額度，與銀行活動邏輯不符。

**影響**：`calcCardAdvice()` 需要接收所有旅程的 `Expense[]`（目前只接收 `tripExpenses`）。介面呼叫端需傳入 `AppData.trips` 展開的全部消費。

### Expense 新增 rewardBreakdown 欄位

**決策**：在 `Expense` 介面新增 `rewardBreakdown?: { base: number; store: number; paymentMethod: number }` 欄位，記帳時由 `calcExpenseReward()` 計算後寫入 localStorage。

**替代方案**：每次顯示時重新計算 → 拒絕，因為重算需要知道當時的卡片設定和其他消費記錄，儲存快照更可靠。

**影響**：`Expense` 型別新增欄位（可選，向後相容）。

### StoreBonus 子分類結構

**決策**：`StoreBonus` 新增 `subCategories?: { label: string; stores: string[] }[]` 欄位。原有的 `stores[]` 保留作為「未分類店家」的扁平列表（向後相容）。

**搜尋行為**：`getAllStoreNames()` 除了從 `stores[]` 外，也從 `subCategories[].stores[]` 取店家名稱，合併為一個扁平 Set。

**分類瀏覽器**：記帳頁「店家」欄位增加可展開的分類 panel，先列出各 StoreBonus 的 `subCategories`（例：便利商店 ▶），點開後顯示該類的店家 chips。

## Risks / Trade-offs

- **[Risk] 跨旅程查詢效能** → 資料量小（個人記帳工具），可接受全掃描，不需要索引優化
- **[Risk] 舊消費記錄無 rewardBreakdown** → 記錄頁僅在欄位存在時顯示明細，否則只顯示總金額（graceful degradation）
- **[Risk] subCategories 與 stores[] 重複** → CardForm 應在 UI 層防止同一店家同時出現在兩個地方，但不做強制驗證
