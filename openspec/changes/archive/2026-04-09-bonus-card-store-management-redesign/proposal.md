## Why

CardForm 的 StoreBonus card panel 在手機上有兩個問題：inline rate/cap 編輯行在窄螢幕換行導致 card 過高；`+店家` 按鈕的語意不對（店家應屬於分類，不應在頂層獨立操作），且 subCategories 群組在 collapsed 狀態完全不顯示，使用者無法從畫面看出店家的分類結構。

## What Changes

- **移除** `+店家` 頂層按鈕——店家管理改為在各分類群組內進行
- **新增** collapsed display state：若有 `subCategories`，以群組 label + store chips 的層次顯示；若只有 flat `stores[]`，顯示為「適用店家」預設群組
- **新增** 每個群組（subcategory 或預設群組）的 `[編輯]` 按鈕，點後 inline 展開編輯（改分類名、加店家、刪分類）
- **修改** header 按鈕列：只保留 `+分類` 和 `刪除`，移除 `+店家`
- **修改** rate/cap inline 編輯行排版：header 簡化後空間充足，使用固定寬度輸入欄確保不換行
- **修改** `+分類` 的行為：點擊後直接在清單底部展開新分類 inline 表單（category label 輸入 + store 新增）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-settings`：Store bonus card panel 的 action buttons 規格改變（移除 `+店家`，保留 `+分類` + `刪除`）；新增 collapsed subcategory display 要求；新增 per-group inline 編輯互動模式；rate/cap row 不換行要求
- `store-subcategory`：CardForm 的 subCategory 管理 UI 互動方式改變（從 header expand → per-group `[編輯]` inline 展開）

## Impact

- 受影響的 specs：`card-settings`、`store-subcategory`
- 受影響的程式碼：
  - `src/components/CardForm.tsx`：`renderBonusList()` 整體重設計
