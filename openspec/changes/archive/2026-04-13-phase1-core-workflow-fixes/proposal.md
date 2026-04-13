## Why

目前系統在旅程切換、卡片刪除、店家切換等生命週期事件中，UI 狀態未隨之更新，導致顯示錯誤與條件索引錯亂。同時 CalcPage 的試算草稿在切換 Tab 後消失、明細頁缺乏編輯能力，影響日常記帳流暢度。

## What Changes

**Stage 1 — 生命週期 Bug 修正**
- 切換旅程時，若 `expenseDate` 超出新旅程範圍，自動 Snap 至 `startDate` 或 `endDate`
- 找不到關聯卡片時，顯示「已刪除的卡片」而非 UUID（LedgerPage、TripDetailPage）
- 點選店家 Chip 或清除搜尋時，自動清空 `storeBonusOverrides` 與 `prereqOverrides`（不監聽 `store` state，避免打字時觸發）
- 渲染層加上 `paymentMethod !== 'physical'` 保險，確保 Apple/Google Pay 徽章不在實體卡模式顯示

**Stage 2 — CalcPage 互動優化**
- 搜尋框為空時，從當前 `tripExpenses` 統計頻次，顯示前 3–5 名常用店家 Chip
- 使用 `sessionStorage`（key = `calc-draft-${activeTripId}`）持久化 `amount`、`store`、`paymentMethod`，切換 Tab 後草稿保留
- 旅程匯率旁加入可覆寫輸入框，允許單筆手動調整匯率；`Expense` 型別新增 `customRate?: number`

**Stage 3 — 明細管理增強**
- `useStore` 新增 `UPDATE_EXPENSE` action
- LedgerPage 點擊消費紀錄進入編輯模式，可調整金額、日期、卡片；回饋自動重算（前置條件以預設值計算，接受小誤差）

## Non-Goals

- 不處理跨旅程的前置條件覆寫同步
- 匯率覆寫精確度不保證與銀行結算一致，此產品目的為額度追蹤而非精算
- 消費編輯不支援回溯前置條件 toggle 狀態

## Capabilities

### New Capabilities

- `expense-draft-persistence`: CalcPage 試算草稿透過 sessionStorage 在 Tab 切換後保留
- `frequent-store-chips`: 根據當前旅程消費統計，自動顯示常用店家快捷 Chip
- `per-expense-exchange-rate`: 單筆消費允許手動覆寫匯率，並儲存至 `Expense.customRate`
- `expense-edit`: 明細頁支援編輯消費紀錄（金額、日期、卡片），自動重算回饋

### Modified Capabilities

- `expense-tracker`: 新增 `UPDATE_EXPENSE` action；`Expense` 型別新增 `customRate?: number`
- `trip-manager`: 切換旅程時自動校正 `expenseDate` 至旅程範圍內

## Impact

- Affected specs: `expense-tracker`, `trip-manager`（修改）；`expense-draft-persistence`, `frequent-store-chips`, `per-expense-exchange-rate`, `expense-edit`（新增）
- Affected code:
  - `src/pages/CalcPage.tsx`
  - `src/pages/LedgerPage.tsx`
  - `src/pages/TripDetailPage.tsx`
  - `src/store/useStore.tsx`
  - `src/types.ts`
