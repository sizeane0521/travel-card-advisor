## 1. App.tsx — Tab 擴展（Tab type 從 3-variant 擴展為 4-variant）

- [x] 1.1 在 `src/App.tsx` 中，將 `Tab` type 從 `'expense' | 'trips' | 'settings'` 改為 `'calc' | 'ledger' | 'trips' | 'settings'`；將 TABS 陣列更新為 4 項：試算（calc，新建計算機 SVG icon）、明細（ledger，沿用現有 ScrollIcon）、旅程（trips，保持）、設定（settings，保持）；預設 tab 從 `'expense'` 改為 `'calc'`；render 區塊新增 `{tab === 'calc' && <CalcPage />}` 和 `{tab === 'ledger' && <LedgerPage />}`，移除 `{tab === 'expense' && <ExpensePage />}`；新增對 `CalcPage` 和 `LedgerPage` 的 import

## 2. CalcPage.tsx — 建立試算頁面

- [x] 2.1 建立 `src/pages/CalcPage.tsx`，內容來自現有 `ExpensePage.tsx` L1–501（imports、local state、helper functions、handleDelete 移除、form JSX），刪除以下部分：L503–621（消費列表、加碼額度狀態面板）；確認 `handleDelete` function 不出現在 CalcPage（刪除動作在 LedgerPage）；CalcPage 在旅程未啟動或已結束時，顯示與原 ExpensePage 相同的 empty state 畫面（record a single expense）
- [x] 2.2 在 CalcPage 的信用卡推薦列表中，Per-card「+記帳」button 替換全域 Submit Button：為每張卡的 row 新增「+記帳」inline action button，button 位於 row 右側，樣式為小型 pill（金色邊框，hover 時填色 `#c8901a`，文字色 `#0d0a06`），當 `advice.isFull === true` 時 button disabled；button 的 onClick handler 邏輯：(1) `parseInt(amount)` 若 ≤ 0 則 `setAmountError('請輸入正整數金額')` 並 return；(2) 以 `advice.card.id` 執行與原 handleSubmit 完全相同的 `calcExpenseReward` + `dispatch({ type: 'ADD_EXPENSE', ... })` 邏輯；(3) reset：`setAmount('')`、`setStore('')`、`setStoreQuery('')`、`setPrereqOverrides({})`（保留 `paymentMethod` 和 `selectedCardId`）；移除 `<form>` 的 `onSubmit` handler 和底部全域「◆ 記錄消費」`<button type="submit">`（inline card recommendation during expense entry）
- [x] 2.3 CalcPage 的 page header（原 ExpensePage L158–161）只顯示「試算」標題，移除「本次旅程 N 筆」count badge（「本次旅程 N 筆」count 只顯示在明細 Tab header — trip expense count summary）

## 3. LedgerPage.tsx — 建立明細頁面

- [x] 3.1 建立 `src/pages/LedgerPage.tsx`，加碼額度狀態面板整體搬移至 LedgerPage：內容來自 `ExpensePage.tsx` L503–621（消費列表 section + 加碼額度狀態 section），加上必要的 imports（`useStore`、`calcExpenseReward` 等）和 local state（無 form state；`expenses` 和 `allExpenses` 從 `useStore()` 取得）；確認消費列表的「刪除」button 及 `handleDelete` function 正確存在於 LedgerPage（expense list view + delete expense）；確認加碼額度狀態面板（bonus status panel in expense entry page）位於消費列表下方，在旅程未啟動或已結束時顯示對應的 empty state
- [x] 3.2 LedgerPage 的 page header 顯示「明細」標題 + 「本次旅程 N 筆」count badge（`activeTrip.expenses.length`），格式與原 ExpensePage header 一致（trip expense count summary — count shown in 明細 Tab header）

## 4. 清理

- [x] 4.1 刪除 `src/pages/ExpensePage.tsx`（原檔功能已完整分拆至 CalcPage 與 LedgerPage；CalcPage 與 LedgerPage 作為獨立頁面元件（而非 ExpensePage 內部的條件渲染），各自持有自己的 local state，共用資料透過 `useStore()` 取得）
