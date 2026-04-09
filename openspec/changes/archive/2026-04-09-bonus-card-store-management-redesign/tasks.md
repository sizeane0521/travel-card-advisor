## 1. State 重構

- [x] 1.1 在 `CardForm.tsx` 移除 `expandedAliasIdx`、`expandedSubCatIdx`、`newAliasInput`、`newSubCatLabel`、`newSubCatStores`、`expandedNubAliasIdx`、`expandedNubSubCatIdx`、`newNubAliasInput`、`newNubSubCatLabel`、`newNubSubCatStores` 等舊 alias/subcat 管理 state
- [x] 1.2 新增統一 state `expandedGroupKey: string | null`（key 格式：`${type}-${bonusIdx}-${subIdx|'default'}`，其中 type 為 `'store'` 或 `'nub'`）追蹤當前展開的群組編輯器（移除 `+店家`：flat stores 改由預設群組管理）
- [x] 1.3 新增 `newGroupStoreInput: string` state（當前開啟的群組編輯器的店家輸入框）和 `editingGroupLabel: string` state（當前編輯的分類名稱）
- [x] 1.4 新增 `addingSubCatForBonusIdx: { type: 'store' | 'nub'; idx: number } | null` state（+分類 行為：展開 inline 新分類表單），以及 `newSubCatNameInput: string` 和 `newSubCatFirstStore: string` state

## 2. Helper 函式

- [x] 2.1 新增 `openGroupEditor(key: string, initialLabel: string)` helper：設定 `expandedGroupKey = key`，`editingGroupLabel = initialLabel`，`newGroupStoreInput = ''`；同時 reset `addingSubCatForBonusIdx = null`
- [x] 2.2 新增 `addStoreToGroup(type: 'store' | 'nub', bonusIdx: number, subIdx: number | null)` helper：將 `newGroupStoreInput` 加入對應的 `sub.stores[]`（subIdx 非 null）或 `b.stores[]`（subIdx null）；支援 StoreBonus sub-category management in CardForm
- [x] 2.3 新增 `removeStoreFromGroup(type, bonusIdx, subIdx, store)` helper：從指定 group 的 stores 移除該店家
- [x] 2.4 新增 `renameSubCategory(type, bonusIdx, subIdx, label)` helper：更新指定 subCategory 的 label（Per-group 編輯狀態：inline 展開，不用 modal）
- [x] 2.5 新增 `deleteSubCategory(type, bonusIdx, subIdx)` helper：從 subCategories 移除指定 index 的分類，並 reset `expandedGroupKey` 若該群組正在展開
- [x] 2.6 新增 `commitNewSubCategory(type, bonusIdx)` helper：以 `newSubCatNameInput` 為 label 新增空 subCategory 進對應 bonuses，reset `addingSubCatForBonusIdx`（+分類 行為：展開 inline 新分類表單）

## 3. Header 與 Rate/Cap Row 重設計

- [x] 3.1 在 `renderBonusList()` 的 header row 移除 `+店家` 按鈕，只保留 `+分類` 和 `刪除`，確保 store bonus action buttons consistent styling 符合新規格（僅 ＋分類 + 刪除）
- [x] 3.2 rate/cap inline 編輯 div（Rate/Cap Row：固定寬度，不使用 flex-wrap）：移除 `flex-wrap`，rate input 改為 `width: 44px`，中間標籤拆成 `%` 和 `NT$` 分別緊貼各自 input，period badge 縮短為 `每月` / `期間`（rate/cap inline edit row fit on narrow screen）

## 4. Collapsed 群組顯示

- [x] 4.1 在 `renderBonusList()` 的 stores 顯示區塊，判斷 `b.subCategories?.length > 0`：若是，render 各 subCategory 群組（label header + chips + `[編輯]` 按鈕）；若否，render 單一「適用店家」預設群組（chips + `[編輯]` 按鈕），實現 collapsed subcategory display in bonus card panel
- [x] 4.2 各群組 label row 樣式：`text-[10px] uppercase tracking-wider`（label 文字）+ `[編輯]` 按鈕右對齊，群組間以 `mt-1.5` 分隔

## 5. 群組 Inline 編輯器

- [x] 5.1 當 `expandedGroupKey` 對應某群組時，在該群組 label row 下方 inline 展開編輯器：顯示 label input（named subCat 可編輯，預設群組不顯示 label input），onChange 即時更新 `editingGroupLabel` 並呼叫 `renameSubCategory()`（per-group inline store editing in bonus card panel）
- [x] 5.2 編輯器內顯示 store input + `[加入]` 按鈕（Enter 觸發），呼叫 `addStoreToGroup()`；顯示當前 store chips 各有 `×` 按鈕呼叫 `removeStoreFromGroup()`
- [x] 5.3 named subCategory 編輯器底部顯示 `[刪除此分類]` 按鈕（紅色），呼叫 `deleteSubCategory()`；預設群組不顯示此按鈕
- [x] 5.4 編輯器右上角或底部顯示 `[完成]` 按鈕，呼叫 `setExpandedGroupKey(null)`

## 6. +分類 Inline 新增表單

- [x] 6.1 `+分類` 按鈕 onClick：設定 `addingSubCatForBonusIdx = { type, idx }`，reset `expandedGroupKey = null`，`newSubCatNameInput = ''`，`newSubCatFirstStore = ''`
- [x] 6.2 當 `addingSubCatForBonusIdx` 對應某 bonus 時，在群組列表底部 append inline 表單（`+分類` 行為：展開 inline 新分類表單）：分類名稱 input + 店家名稱 input + `[新增分類]` 按鈕；點 `[新增分類]` 呼叫 `commitNewSubCategory()`
- [x] 6.3 `[新增分類]` 點後：create subCategory，立即用 `openGroupEditor()` 展開新分類的編輯器，讓使用者繼續加店家

## 7. 驗證

- [x] 7.1 執行 `npm run build` 確認無 TypeScript 錯誤
- [x] 7.2 在 375px 寬度確認 rate/cap row 不換行（截圖或 DevTools mobile 模擬）
