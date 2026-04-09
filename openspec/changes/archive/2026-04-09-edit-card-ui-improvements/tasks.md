## 1. bankUrl 自動帶入與前往活動按鈕

- [x] 1.1 修改 `applyImportResult()`（`src/components/CardForm.tsx`）：在清空 `importUrl` 前，若 `bankUrl` 為空則呼叫 `setBankUrl(importUrl.trim())`，實作「Import URL auto-fills bankUrl field」需求
- [x] 1.2 在 `bankUrl` 輸入框下方加入條件渲染：當 `bankUrl` 非空時顯示「前往活動頁面 ↗」`<a>` 連結（`target="_blank" rel="noopener noreferrer"`），實作「Bank promotion page links」in-form 按鈕需求

## 2. 移除限新戶自動 prerequisite

- [x] 2.1 修改 `addBonus('nub')` 函式（CardForm.tsx 第 182 行）：移除 `{ prerequisite: '限新戶', prerequisiteMet: false }`，讓手動新增的新戶加碼不帶預設 prerequisite，實作「Manually added new-user bonus has no auto prerequisite」場景
- [x] 2.2 修改 `applyImportResult()`（CardForm.tsx 第 356 行）：移除 `prerequisite: '限新戶'`，讓 AI 匯入的新戶加碼規則不再強制帶入「限新戶」字串，實作「New-user bonus as independent card field」需求

## 3. 新增加碼表單改為收合式

- [x] 3.1 在 CardForm state 中新增 `showAddStoreForm` 與 `showAddNubForm`（初始值 `false`），對應「Collapsible add-bonus form in CardForm」需求
- [x] 3.2 修改 `renderAddBonusForm(type)` 函式：當對應 show 狀態為 `false` 時，渲染「＋ 新增加碼」（store）或「＋ 新增新戶加碼」（nub）按鈕；為 `true` 時才渲染現有表單內容
- [x] 3.3 修改 `addBonus()` 呼叫後的邏輯：新增一條完成後將對應 show 狀態重置為 `false`，實作「Form auto-collapses after submission」場景

## 4. 行動支付加碼月上限欄位破版修復

- [x] 4.1 移除 CardForm.tsx 第 1014 行 tier 顯示列的 `flex-wrap` class，確保 rate input、"% · 月上限 NT$" label、cap input 同行不換行，實作「Payment method bonus configuration in card form」中「Tier row does not wrap at 375px」及「Payment method bonus tier row no-wrap layout」需求

## 5. 標題置中

- [x] 5.1 修改 CardForm.tsx header div（第 764 行）：將 container 改為 `relative flex items-center mb-4`，將 `<h1>` 改為 `absolute left-1/2 -translate-x-1/2`，實作「Card edit page header title centering」需求
