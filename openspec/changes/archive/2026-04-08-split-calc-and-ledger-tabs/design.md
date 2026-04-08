## Context

`ExpensePage.tsx`（623 行）目前將兩個使用目的完全不同的功能放在同一頁：
- **試算區（L23–501）**：輸入金額、選店家、選付款方式、查看信用卡推薦列表、送出記帳
- **明細區（L503–621）**：查看本次旅程消費列表 + 加碼額度狀態面板

`App.tsx` 管理 3 個 App-level Tab（記帳、旅程、設定），Tab type 為字串 union。

## Goals / Non-Goals

**Goals:**
- App-level Bottom Tab Bar 擴展為 4 個 Tab：試算、明細、旅程、設定
- ExpensePage 拆分為 CalcPage（試算）和 LedgerPage（明細）
- 信用卡推薦列表每個 row 新增「+記帳」inline action button，以該卡直接送出
- 移除底部全域「◆ 記錄消費」Submit Button

**Non-Goals:**
- 不改變 reward 計算邏輯（`rewardCalc.ts` 不動）
- 不改變 store 資料結構（`useStore.tsx` 不動）
- 不加 Tab 切換動畫（保持現有的條件渲染方式）
- 送出後不自動切換到明細 Tab

## Decisions

### CalcPage 與 LedgerPage 作為獨立頁面元件（而非 ExpensePage 內部的條件渲染）

建立 `src/pages/CalcPage.tsx` 和 `src/pages/LedgerPage.tsx` 兩個新檔案，`ExpensePage.tsx` 可刪除。

理由：兩者各自擁有獨立的 local state（CalcPage 持有 amount/store/paymentMethod/prereqOverrides；LedgerPage 無 form state），不共享 local state，適合分拆為兩個獨立元件。共用的 global state 均透過 `useStore()` 取得。

**CalcPage local state（完整保留自 ExpensePage）：**
- `amount`, `store`, `storeQuery`, `selectedCardId`, `amountError`, `paymentMethod`, `prereqOverrides`, `showCategoryBrowser`, `expandedGroups`

**LedgerPage local state：**
- 無（純讀取 `useStore()` 的資料渲染）

### Per-card「+記帳」button 替換全域 Submit Button

每張卡的 recommendation row 右側新增一顆「+記帳」pill button。

- 點擊邏輯：先驗證 `amount`（`parseInt` > 0），若無效則 `setAmountError('請輸入正整數金額')` 並 return；若有效，以該卡的 `card.id` 執行與現有 `handleSubmit` 相同的 dispatch 邏輯，然後 reset form state
- Disabled 條件：`card.isFull === true`（已滿額，與現有 row 的 opacity 邏輯一致）
- 按鈕樣式：小型 pill，金色邊框，hover 時填色，與現有 chip button 風格一致
- 全域「◆ 記錄消費」`<button type="submit">` 完全移除；`<form>` 的 `onSubmit` handler 也一並移除

### Tab type 從 3-variant 擴展為 4-variant

`App.tsx` 的 `Tab` type 從 `'expense' | 'trips' | 'settings'` 改為 `'calc' | 'ledger' | 'trips' | 'settings'`。

Tab 順序：試算（calc）→ 明細（ledger）→ 旅程（trips）→ 設定（settings）。

預設 Tab：`'calc'`（原來是 `'expense'`）。

### 「本次旅程 N 筆」count 只顯示在明細 Tab header

原本在 ExpensePage header 顯示的 expense count，移至 LedgerPage header。CalcPage header 只顯示「試算」標題，不顯示筆數（筆數在明細 Tab 查看更直覺）。

### 加碼額度狀態面板整體搬移至 LedgerPage

現有 ExpensePage L556–621 的「加碼額度狀態」section 原封不動搬至 LedgerPage，位於消費列表下方。CalcPage 中最佳推薦卡的 mini progress bar 保留（現有 L433–443），作為即時決策輔助。

## Risks / Trade-offs

- **CalcPage form reset 時機**：現有 `handleSubmit` 在送出後 reset `amount`、`store`、`storeQuery`、`prereqOverrides`，但保留 `selectedCardId` 和 `paymentMethod`。Per-card button 的 reset 邏輯應保持一致。→ 以相同的 reset 行為實作。
- **「+記帳」button 的 amount 為空時 UX**：使用者可能在金額欄空白時直接點「+記帳」。→ 顯示 `amountError`，不送出。
- **4 個 Tab 的 icon 選擇**：需要為試算和明細各提供一個語義清晰的 SVG icon。→ 試算用計算機圖示，明細用清單圖示（ScrollIcon 已存在，可沿用為明細）。
